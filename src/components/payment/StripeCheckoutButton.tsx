// ============================================================
// Stripe 결제 버튼 컴포넌트 (시뮬레이션 모달 내장형)
// ============================================================
// Stripe Elements/Checkout 스타일의 고급스러운 결제 흐름 모사
//
// 사용법:
//   <StripeCheckoutButton
//     product={product}
//     onSuccess={() => console.log('결제 성공')}
//     onError={(err) => console.error(err)}
//   />
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { generateOrderId, type StripeProduct } from '../../lib/stripe';
import { CreditCard, ShieldCheck, X, Sparkles, Loader2 } from 'lucide-react';

interface StripeCheckoutButtonProps {
  product: StripeProduct;
  onSuccess: (details: any) => void;
  onError?: (error: any) => void;
  className?: string;
}

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  product,
  onSuccess,
  onError,
  className,
}) => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
  
  // 카드 입력 폼 상태
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('***');
  const [name, setName] = useState('KODARI HONG');

  // Stripe SDK 로드 시뮬레이션
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => {
      console.warn('Stripe SDK load fallback (Offline mode active)');
      setSdkLoaded(true); // 오프라인 환경에서도 시뮬레이터 구동을 위해 true 처리
    };
    document.head.appendChild(script);

    return () => {
      const existing = document.querySelector('script[src*="stripe.com"]');
      if (existing) {
        document.head.removeChild(existing);
      }
    };
  }, []);

  const handleOpenPayment = () => {
    setStep('input');
    setShowModal(true);
  };

  const handlePay = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;
    setProcessing(true);
    setStep('processing');

    // 시뮬레이션 애니메이션 딜레이
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const orderId = generateOrderId();
      const mockPaymentDetails = {
        id: orderId,
        object: 'payment_intent',
        amount: product.price,
        currency: product.currency.toLowerCase(),
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
        payment_method_details: {
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
          },
        },
      };

      setStep('success');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowModal(false);
      onSuccess(mockPaymentDetails);
    } catch (err) {
      console.error('[Stripe Simulator] Error:', err);
      onError?.(err);
      setStep('input');
    } finally {
      setProcessing(false);
    }
  }, [product, onSuccess, onError, processing]);

  return (
    <>
      <button
        onClick={handleOpenPayment}
        disabled={!sdkLoaded}
        className={`
          w-full max-w-md mx-auto h-[50px] rounded-lg font-medium text-[15px]
          flex items-center justify-center gap-2
          transition-all duration-200
          ${sdkLoaded
            ? 'bg-[#635BFF] hover:bg-[#524BDE] active:scale-[0.98] cursor-pointer'
            : 'bg-gray-600 cursor-not-allowed'
          }
          text-white border-none
          ${className || ''}
        `}
      >
        <CreditCard size={18} />
        <span>{product.price.toLocaleString()}원 Stripe 결제</span>
      </button>

      {/* Stripe Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => !processing && setShowModal(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-[#1B192A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 transition-all duration-300">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#635BFF] flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">S</span>
                </div>
                <span className="text-xs font-bold text-white/50 tracking-wider">STRIPE SECURE GATEWAY</span>
              </div>
              {!processing && (
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'input' && (
                <form onSubmit={handlePay} className="flex flex-col gap-4">
                  {/* Amount Badge */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">주문 상품</p>
                      <p className="text-sm font-semibold mt-0.5 text-white/90">{product.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">결제 금액</p>
                      <p className="text-lg font-black text-[#FF8A80]">₩{product.price.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Card Simulator UI */}
                  <div className="relative aspect-[1.586/1] w-full rounded-2xl bg-gradient-to-br from-[#2E2A47] via-[#201D35] to-[#12111E] p-5 flex flex-col justify-between border border-white/10 overflow-hidden shadow-lg">
                    {/* Glossmorphic elements */}
                    <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] rounded-full bg-[#635BFF]/10 blur-2xl" />
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1">
                        <Sparkles className="text-yellow-400" size={16} />
                        <span className="text-[10px] tracking-[0.2em] font-extrabold text-white/80">PREMIUM CONNECT</span>
                      </div>
                      <div className="w-10 h-7 bg-white/10 rounded-md backdrop-blur-sm border border-white/5 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white/40">CHIP</span>
                      </div>
                    </div>

                    <div className="my-4">
                      <input 
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="bg-transparent border-none text-white text-lg tracking-[0.1em] font-mono w-full focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-between items-end font-mono">
                      <div>
                        <p className="text-[7px] text-white/30 uppercase">Card Holder</p>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-transparent border-none text-white text-xs w-full focus:outline-none uppercase"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[7px] text-white/30 uppercase">Expires</p>
                          <input
                            type="text"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            className="bg-transparent border-none text-white text-xs w-10 focus:outline-none"
                          />
                        </div>
                        <div>
                          <p className="text-[7px] text-white/30 uppercase">CVC</p>
                          <input
                            type="text"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value)}
                            className="bg-transparent border-none text-white text-xs w-8 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full h-[52px] bg-[#635BFF] hover:bg-[#524BDE] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(99,91,255,0.4)] transition-all cursor-pointer border-none"
                  >
                    <ShieldCheck size={16} />
                    <span>카드 안전 결제 승인</span>
                  </button>
                </form>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="animate-spin text-[#635BFF]" size={40} />
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">Stripe 결제 승인 대기 중</p>
                    <p className="text-xs text-white/40 mt-1">3D Secure 및 가맹점 정산 규격 검증 중...</p>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">결제 처리 완료</p>
                    <p className="text-xs text-white/40 mt-1">지갑 충전 처리를 완료하는 중입니다.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StripeCheckoutButton;
