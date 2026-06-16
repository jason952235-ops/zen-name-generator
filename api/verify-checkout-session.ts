interface ApiRequest {
  method?: string;
  query?: {
    session_id?: string;
  };
}

interface ApiResponse {
  status: (code: number) => {
    json: (data: unknown) => void;
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只接受 GET 請求。' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const sessionId = req.query?.session_id;

  if (!stripeSecretKey) {
    return res.status(500).json({ error: '尚未設定 STRIPE_SECRET_KEY。' });
  }

  if (!sessionId) {
    return res.status(400).json({ error: '缺少 Stripe session_id。' });
  }

  const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`
    }
  });

  const data = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return res.status(500).json({ error: 'Stripe 付款驗證失敗。', detail: data });
  }

  const isPaid = data.payment_status === 'paid';

  return res.status(200).json({
    paid: isPaid,
    payment_status: data.payment_status,
    amount_total: data.amount_total,
    currency: data.currency
  });
}
