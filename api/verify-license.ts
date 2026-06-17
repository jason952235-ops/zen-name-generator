interface ApiResponse {
  status: (code: number) => {
    json: (data: { success: boolean; message: string }) => void;
  };
}

export default async function handler(_: unknown, res: ApiResponse) {
  return res.status(410).json({
    success: false,
    message: 'License key verification is no longer used. Please verify your Gumroad purchase receipt.'
  });
}
