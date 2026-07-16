// ============================================================
// Stripe Configuration
// ============================================================
//
// VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (테스트)
// VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (실서비스)
//
// ============================================================

export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51P1abcdefghijklmnopqrstuvwxyz1234567890',
  currency: 'KRW',
};

// ── 상품 타입 정의 ──

export interface StripeProduct {
  id: string;
  name: string;       // 주문명
  price: number;      // 원 단위 (예: 39900)
  currency: string;   // 'KRW'
  description?: string;
}

// ── 상품 목록 ──

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'connect-ai-basic-kr',
    name: 'Best-Saiko Basic (하트 30개)',
    price: 39900,
    currency: 'KRW',
    description: '실시간 1:1 한-일 번역 채팅용 하트 30개 충전',
  },
  {
    id: 'connect-ai-pro-kr',
    name: 'Best-Saiko Pro 30일 패스',
    price: 129000,
    currency: 'KRW',
    description: '텍스트 번역 무제한 + 통화 매일 60분 무료 + 보너스 하트 100개 지급',
  },
];

// ── 주문 ID 생성 헬퍼 ──

export function generateOrderId(): string {
  const now = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `order_${now}_${random}`;
}
