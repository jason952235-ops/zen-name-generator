declare const process: {
  env: {
    GUMROAD_PRODUCT_ID?: string;
    GUMROAD_ACCESS_TOKEN?: string;
  };
};

interface ApiRequest {
  method?: string;
  body?: {
    licenseKey?: string;
  };
}

interface ApiResponse {
  status: (code: number) => {
    json: (data: { success: boolean; message?: string }) => void;
  };
}

interface GumroadPurchase {
  product_id?: string;
  product_permalink?: string;
  permalink?: string;
  refunded?: boolean;
  chargebacked?: boolean;
  disputed?: boolean;
}

interface GumroadVerifyResponse {
  success?: boolean;
  purchase?: GumroadPurchase;
}

function isCorrectProduct(purchase: GumroadPurchase | undefined, productId: string) {
  if (!purchase) return true;

  const knownProductValues = [
    purchase.product_id,
    purchase.product_permalink,
    purchase.permalink
  ].filter(Boolean);

  return knownProductValues.length === 0 || knownProductValues.includes(productId);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Invalid license key' });
  }

  const licenseKey = req.body?.licenseKey?.trim();
  const productId = process.env.GUMROAD_PRODUCT_ID?.trim();

  if (!licenseKey || !productId) {
    return res.status(400).json({ success: false, message: 'Invalid license key' });
  }

  try {
    const body = new URLSearchParams({
      product_permalink: productId,
      license_key: licenseKey,
      increment_uses_count: 'false'
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    if (process.env.GUMROAD_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GUMROAD_ACCESS_TOKEN}`;
    }

    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers,
      body
    });

    const result = await gumroadResponse.json() as GumroadVerifyResponse;
    const purchase = result.purchase;
    const purchaseIsActive = !purchase?.refunded && !purchase?.chargebacked && !purchase?.disputed;

    if (gumroadResponse.ok && result.success && purchaseIsActive && isCorrectProduct(purchase, productId)) {
      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ success: false, message: 'Invalid license key' });
  } catch {
    return res.status(500).json({ success: false, message: 'Invalid license key' });
  }
}
