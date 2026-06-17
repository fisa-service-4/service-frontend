export const BANK_LOGO: Record<string, string> = {
  '003': '/banks/IBK.png',
  '004': '/banks/KB.png',
  '011': '/banks/NH.png',
  '020': '/banks/Woori.png',
  '023': '/banks/SC.png',
  '080': '/banks/Shinhan.png',
  '081': '/banks/Hana.png',
  '088': '/banks/Shinhan.png',
  '090': '/banks/Kakao.png',
  '092': '/banks/Toss.png',
  '243': '/banks/KIS.png',
  '247': '/banks/NH.png',
};

export const BANK_NAME: Record<string, string> = {
  '003': 'IBK기업은행',
  '004': 'KB국민은행',
  '011': 'NH농협은행',
  '020': '우리은행',
  '023': 'SC제일은행',
  '080': '신한은행',
  '081': '하나은행',
  '088': '신한은행',
  '090': '카카오뱅크',
  '092': '토스뱅크',
  '243': '한국투자증권',
  '247': 'NH투자증권',
};

// 로고 이미지가 없는 기관의 축약 표기 (fallback용)
export const BANK_ABBR: Record<string, string> = {
  '243': 'KIS',
};

// 은행 bankCode Set (증권 계좌 코드 243, 247 제외)
export const BANK_CODES = new Set([
  '003', '004', '011', '020', '023', '080', '081', '088', '090', '092',
]);
