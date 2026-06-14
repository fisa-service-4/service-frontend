export const BANK_LOGO: Record<string, string> = {
  '003': '/banks/IBK.png',
  '004': '/banks/KB.png',
  '011': '/banks/NH.png',
  '020': '/banks/Woori.png',
  '023': '/banks/SC.png',
  '081': '/banks/Hana.png',
  '088': '/banks/Shinhan.png',
  '090': '/banks/Kakao.png',
  '092': '/banks/Toss.png',
};

// 은행 bankCode Set — 이 외의 코드는 증권 계좌로 분류
export const BANK_CODES = new Set(Object.keys(BANK_LOGO));

export const BANK_NAME: Record<string, string> = {
  '003': 'IBK기업은행',
  '004': 'KB국민은행',
  '011': 'NH농협은행',
  '020': '우리은행',
  '023': 'SC제일은행',
  '081': '하나은행',
  '088': '신한은행',
  '090': '카카오뱅크',
  '092': '토스뱅크',
};
