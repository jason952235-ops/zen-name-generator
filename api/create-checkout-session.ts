interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  status: (code: number) => {
    json: (data: unknown) => void;
  };
}

const stripeApiUrl = 'https://api.stripe.com/v1/checkout/sessions';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST 請求。' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.SITE_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5173');

  if (!stripeSecretKey) {
    return res.status(500).json({ error: '尚未設定 STRIPE_SECRET_KEY。' });
  }

  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': '999',
    'line_items[0][price_data][product_data][name]': 'Chinese Cultural Identity Premium Report',
    success_url: `${siteUrl}/?premium=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/?premium=cancelled`
  });

  const stripeResponse = await fetch(stripeApiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const data = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return res.status(500).json({ error: 'Stripe 結帳建立失敗。', detail: data });
  }

  return res.status(200).json({ url: data.url });
}
