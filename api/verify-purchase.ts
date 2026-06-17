declare const process: {
  env: {
    GUMROAD_ACCESS_TOKEN?: string;
    GUMROAD_PRODUCT_ID?: string;
  };
};

interface ApiRequest {
  method?: string;
  body?: {
    receiptInfo?: string;
  };
}

interface ApiResponse {
  status: (code: number) => {
    json: (data: { success: boolean; message?: string; error?: string }) => void;
  };
}

interface GumroadSale {
  id?: string;
  sale_id?: string;
  order_id?: string;
  email?: string;
  purchase_email?: string;
  product_id?: string;
  product_permalink?: string;
  permalink?: string;
  paid?: boolean;
  refunded?: boolean;
  chargebacked?: boolean;
  disputed?: boolean;
}

interface GumroadSalesResponse {
  success?: boolean;
  sale?: GumroadSale;
  sales?: GumroadSale[];
  next_page_url?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function booleanValue(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeSale(value: unknown): GumroadSale | null {
  if (!isRecord(value)) return null;

  return {
    id: stringValue(value.id),
    sale_id: stringValue(value.sale_id),
    order_id: stringValue(value.order_id),
    email: stringValue(value.email),
    purchase_email: stringValue(value.purchase_email),
    product_id: stringValue(value.product_id),
    product_permalink: stringValue(value.product_permalink),
    permalink: stringValue(value.permalink),
    paid: booleanValue(value.paid),
    refunded: booleanValue(value.refunded),
    chargebacked: booleanValue(value.chargebacked),
    disputed: booleanValue(value.disputed)
  };
}

function normalizeSalesResponse(value: unknown): GumroadSalesResponse {
  if (!isRecord(value)) return {};

  const sale = normalizeSale(value.sale);
  const sales = Array.isArray(value.sales)
    ? value.sales.map(normalizeSale).filter((item): item is GumroadSale => item !== null)
    : undefined;

  return {
    success: booleanValue(value.success),
    sale: sale || undefined,
    sales,
    next_page_url: typeof value.next_page_url === 'string' || value.next_page_url === null
      ? value.next_page_url
      : undefined
  };
}

function cleanReceiptInfo(receiptInfo: string) {
  return receiptInfo.trim().toLowerCase();
}

function saleMatchesReceiptInfo(sale: GumroadSale, receiptInfo: string) {
  const normalizedReceiptInfo = cleanReceiptInfo(receiptInfo);
  const values = [
    sale.id,
    sale.sale_id,
    sale.order_id,
    sale.email,
    sale.purchase_email
  ];

  return values.some((value) => {
    if (!value) return false;
    return normalizedReceiptInfo.includes(value.toLowerCase());
  });
}

function saleMatchesProduct(sale: GumroadSale, productId: string) {
  const productValues = [
    sale.product_id,
    sale.product_permalink,
    sale.permalink
  ].filter(Boolean);

  return productValues.length === 0 || productValues.includes(productId);
}

function saleIsPaidAndActive(sale: GumroadSale) {
  const paid = sale.paid !== false;
  return paid && !sale.refunded && !sale.chargebacked && !sale.disputed;
}

async function fetchGumroadJson(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const result = await response.json();
  console.log('GUMROAD RESPONSE:', JSON.stringify(result, null, 2));

  if (!response.ok) return null;
  return normalizeSalesResponse(result);
}

async function findMatchingSale(receiptInfo: string, productId: string, accessToken: string) {
  console.log('receiptInfo=', receiptInfo);
  console.log('productId=', productId);

  const encodedAccessToken = encodeURIComponent(accessToken);
  const encodedProductId = encodeURIComponent(productId);
  const directCandidates = receiptInfo.match(/[a-zA-Z0-9_-]{8,}/g) || [];

  for (const candidate of directCandidates) {
    const saleUrl = `https://api.gumroad.com/v2/sales/${encodeURIComponent(candidate)}?access_token=${encodedAccessToken}`;
    const saleResult = await fetchGumroadJson(saleUrl, accessToken);
    if (saleResult?.sale && saleMatchesProduct(saleResult.sale, productId) && saleMatchesReceiptInfo(saleResult.sale, receiptInfo)) {
      console.log('FOUND SALE=', JSON.stringify(saleResult.sale, null, 2));
      return saleResult.sale;
    }
  }

  const salesSearchUrls = [
    `https://api.gumroad.com/v2/sales?access_token=${encodedAccessToken}&product_id=${encodedProductId}`,
    `https://api.gumroad.com/v2/sales?access_token=${encodedAccessToken}`
  ];

  for (const initialSalesUrl of salesSearchUrls) {
    let salesUrl: string | null = initialSalesUrl;

    for (let page = 0; page < 5 && salesUrl; page += 1) {
      const salesResult = await fetchGumroadJson(salesUrl, accessToken);
      const matchedSale = salesResult?.sales?.find((sale) => {
        return saleMatchesProduct(sale, productId) && saleMatchesReceiptInfo(sale, receiptInfo);
      });

      if (matchedSale) {
        console.log('FOUND SALE=', JSON.stringify(matchedSale, null, 2));
        return matchedSale;
      }

      salesUrl = salesResult?.next_page_url || null;
    }
  }

  return null;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Purchase could not be verified' });
  }

  const receiptInfo = req.body?.receiptInfo?.trim();
  const accessToken = process.env.GUMROAD_ACCESS_TOKEN?.trim();
  const productId = process.env.GUMROAD_PRODUCT_ID?.trim();

  if (!receiptInfo || !accessToken || !productId) {
    return res.status(400).json({ success: false, message: 'Purchase could not be verified' });
  }

  try {
    const sale = await findMatchingSale(receiptInfo, productId, accessToken);

    if (sale && saleMatchesProduct(sale, productId) && saleIsPaidAndActive(sale)) {
      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ success: false, message: 'Purchase could not be verified' });
  } catch (error) {
    console.error('VERIFY PURCHASE ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Purchase could not be verified',
      error:
        error instanceof Error
          ? error.stack
          : String(error)
    });
  }
}
