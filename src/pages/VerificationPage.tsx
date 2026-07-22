import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, FileCheck, CheckCircle2, RefreshCw } from 'lucide-react';

export default function VerificationPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [identityVerified, setIdentityVerified] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 로컬에서 인증 상태 확인
  useEffect(() => {
    if (!user) return;
    const isVerified = localStorage.getItem(`verified_${user.uid}`) === 'true';
    setIdentityVerified(isVerified);
  }, [user]);

  // 서류 업로드 및 AI 판독 시뮬레이션 가동
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 프리뷰 URL 생성
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // AI 판독 스피너 시뮬레이션 가동
    setAnalyzing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setAnalyzing(false);
            setIdentityVerified(true);
            if (user) {
              localStorage.setItem(`verified_${user.uid}`, 'true');
            }
          }, 800);
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  // 초기화 (재검증용)
  const resetVerification = () => {
    setIdentityVerified(false);
    setPreviewUrl(null);
    if (user) {
      localStorage.removeItem(`verified_${user.uid}`);
    }
  };

  if (!user) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center pt-24 text-white">
        <p className="text-sm text-white/50">
          {lang === 'ko' ? '로그인 후 이용할 수 있는 페이지입니다.' : 'ログイン後にご利用いただけるページです。'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0D0B14] text-white px-4 py-32 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-[#181524] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
          <FileCheck className="text-[#00E5FF]" size={28} />
          <h1 className="text-xl font-bold tracking-tight">
            {lang === 'ko' ? '신원 검증 및 AI eKYC 인증센터' : '本人確認とAI eKYC認証センター'}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {analyzing ? (
            /* 1단계: AI 분석 애니메이션 상태 */
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-12 text-center"
            >
              <RefreshCw className="text-[#00E5FF] animate-spin mb-6" size={54} />
              <h2 className="text-lg font-bold mb-2">
                {lang === 'ko' ? 'AI eKYC 실시간 안면 및 신분 서류 판독 중' : 'AI eKYC 顔写真・本人確認書類照合中'}
              </h2>
              <p className="text-xs text-white/50 mb-8 max-w-sm">
                {lang === 'ko' 
                  ? '제출하신 신분증 이미지와 AI 프로필 대조 알고리즘이 실시간 진위 판독을 수행하고 있습니다. 잠시만 기다려주세요.'
                  : '提出された身分証明書画像とAIプロフィール照合アルゴリズムが真贋判定を実行しています。少々お待ちください。'}
              </p>

              {/* 진행도 바 */}
              <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00E5FF] to-[#69F0AE] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-[#00E5FF] font-semibold mt-3">{progress}%</span>
            </motion.div>

          ) : identityVerified ? (
            /* 2단계: 인증 통과 완료 상태 */
            <motion.div
              key="verified"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-6 text-center"
            >
              <CheckCircle2 className="text-[#69F0AE] mb-6 animate-bounce" size={64} />
              <h2 className="text-xl font-bold text-[#69F0AE] mb-2">
                {lang === 'ko' ? '🔒 AI 신원 인증 통과 완료' : '🔒 AI 本人確認が完了しました'}
              </h2>
              <p className="text-xs text-white/50 mb-8 max-w-md">
                {lang === 'ko'
                  ? '축하합니다! 신분증 검증과 안면 대조 판독이 성공적으로 완료되어 공식 [신원 검증 완료] 배지가 활성화되었습니다.'
                  : 'おめでとうございます！本人確認と顔写真照合が完了し、公式の「本人確認済み」バッジが有効になりました。'}
              </p>

              {/* 활성화된 내 신뢰 배지 리스트 */}
              <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-left mb-8">
                <h3 className="text-xs font-semibold text-white/40 tracking-wider uppercase mb-4">
                  {lang === 'ko' ? '🛡️ 내 활성화된 신뢰 배지 목록' : '🛡️ 私のアクティブな信頼バッジ一覧'}
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center bg-[#69F0AE]/10 border border-[#69F0AE]/20 px-4 py-3 rounded-xl">
                    <span className="text-xs font-bold text-[#69F0AE]">
                      {lang === 'ko' ? '✓ 신원 인증 배지 (Identity Verified)' : '✓ 身元認証バッジ (Identity Verified)'}
                    </span>
                    <span className="text-[10px] text-white/40">유효기간: 1년</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.04] px-4 py-3 rounded-xl border border-white/5 opacity-50">
                    <span className="text-xs text-white/70">
                      {lang === 'ko' ? '🔒 재직/소득 인증 배지' : '🔒 在籍・所得認証バッジ'}
                    </span>
                    <span className="text-[10px] text-white/40">서류 제출 필요</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.04] px-4 py-3 rounded-xl border border-white/5 opacity-50">
                    <span className="text-xs text-white/70">
                      {lang === 'ko' ? '🔒 학력 인증 배지' : '🔒 学歴認証バッジ'}
                    </span>
                    <span className="text-[10px] text-white/40">서류 제출 필요</span>
                  </div>
                </div>
              </div>

              <button
                onClick={resetVerification}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer bg-transparent"
              >
                {lang === 'ko' ? '인증 정보 재등록' : '再検証を申請'}
              </button>
            </motion.div>

          ) : (
            /* 3단계: 기본 서류 업로드 요구 상태 */
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6"
            >
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 items-start">
                <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-amber-500 mb-1">
                    {lang === 'ko' ? '⚖️ 법령 준수 및 신뢰도를 높여주는 eKYC 본인인증' : '⚖️ 法令遵守および信頼度を高めるeKYC本人確認'}
                  </h4>
                  <p className="text-[11px] text-amber-400/70 leading-relaxed">
                    {lang === 'ko'
                      ? '본 서비스는 [대한민국 결혼중개업법]에 의거한 만 19세 이상 이용 제한 및 [일본 이성소개사업법]에 의거한 만 18세 이상 연령 증명 의무를 엄격히 준수합니다. 본인 인증을 위해 공인 신분증(여권, 주민등록증, 마이넘버카드 등)을 제출해 주십시오. AI가 얼굴과 성명을 안전하게 대조하여 [신원 인증 배지]를 즉시 발급합니다.'
                      : '当サービスは、[韓国結婚仲介業法]に基づく満19歳以上の利用制限、および[日本異性紹介事業法]に基づく満18歳以上の年齢確認義務を厳格に遵守します。本人確認のため、公的身分証明書（パスポート、マイナンバーカード等）をご提出ください。AIが照합後、「本人確認済みバッジ」を自動付与します。'}
                  </p>
                </div>
              </div>

              {/* 드래그 앤 드롭 업로드 카드 */}
              <label className="w-full min-h-[220px] border border-dashed border-white/20 hover:border-[#00E5FF]/40 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                
                {previewUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img 
                      src={previewUrl} 
                      alt="Identity preview" 
                      className="w-32 h-20 object-cover rounded-lg border border-white/10" 
                    />
                    <span className="text-xs text-white/50">파일 교체하려면 클릭</span>
                  </div>
                ) : (
                  <>
                    <FileCheck className="text-white/30 mb-4" size={40} />
                    <span className="text-xs font-bold text-white/80 block mb-1">
                      {lang === 'ko' ? '신분증 및 서류 첨부하기' : '身分証明書または書類を添付'}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {lang === 'ko' ? '클릭하여 파일 선택 (PNG, JPG)' : 'クリックしてファイルを選択 (PNG, JPG)'}
                    </span>
                  </>
                )}
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
