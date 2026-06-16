interface ApiResponse {
  status: (code: number) => {
    json: (data: unknown) => void;
  };
}

export default async function handler(_: unknown, res: ApiResponse) {
  return res.status(410).json({
    error: '此付款 API 已停用。請使用 Gumroad 商品頁完成付款。',
    url: 'https://jasonwave356.gumroad.com/l/rzlgdp'
  });
}
