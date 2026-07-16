import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Heart, Save, ShieldCheck, Coins, X, AlertTriangle } from 'lucide-react';
import PayPalCheckoutButton from '../components/payment/PayPalCheckoutButton';
import StripeCheckoutButton from '../components/payment/StripeCheckoutButton';
import { PRODUCTS } from '../lib/paypal';
import { STRIPE_PRODUCTS } from '../lib/stripe';
import { createOrder } from '../lib/firestore';

export default function ProfilePage() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [nickname, setNickname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [country, setCountry] = useState<'KR' | 'JP'>('KR');

  // 가치관 필터 정보
  const [childPlan, setChildPlan] = useState('DISCUSS');
  const [dualIncome, setDualIncome] = useState('FLEXIBLE');
  const [religion, setReligion] = useState('NONE');
  const [residenceFlex, setResidenceFlex] = useState('ANY');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // 지갑 / 하트 상태
  const [hearts, setHearts] = useState(5);
  const [membershipType, setMembershipType] = useState<'FREE' | 'PREMIUM'>('FREE');
  const [showChargeModal, setShowChargeModal] = useState(false);

  // 가상 지갑 정보 패치 (localStorage 시뮬레이션 및 초기화)
  const fetchWallet = useCallback(() => {
    if (!user) return;
    const stored = localStorage.getItem(`wallet_${user.uid}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHearts(parsed.hearts ?? 5);
        setMembershipType(parsed.membershipType ?? 'FREE');
      } catch (e) {
        console.error(e);
      }
    } else {
      const initial = { userId: user.uid, hearts: 5, membershipType: 'FREE' };
      localStorage.setItem(`wallet_${user.uid}`, JSON.stringify(initial));
      setHearts(5);
      setMembershipType('FREE');
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // 결제 완료 콜백 처리
  const handlePaymentSuccess = async (productId: string, amount: string, isUpgrade: boolean = false) => {
    if (!user) return;
    try {
      // 1. 주문 생성
      await createOrder({
        id: `pp_profile_${Date.now()}`,
        userId: user.uid,
        productId,
        productName: isUpgrade ? 'Best-Saiko Pro 30일 패스' : 'Best-Saiko Basic (하트 30개)',
        amount: parseFloat(amount),
        currency: 'USD',
        status: 'completed',
        paypalOrderId: `pp_profile_${Date.now()}`,
      });

      // 2. 가상 지갑 업데이트 및 충전
      const current = localStorage.getItem(`wallet_${user.uid}`);
      const wallet = current ? JSON.parse(current) : { hearts: 5, membershipType: 'FREE' };
      
      const updated = {
        userId: user.uid,
        hearts: isUpgrade ? wallet.hearts + 100 : wallet.hearts + 30,
        membershipType: isUpgrade ? 'PREMIUM' : wallet.membershipType
      };
      
      localStorage.setItem(`wallet_${user.uid}`, JSON.stringify(updated));
      fetchWallet();
      setShowChargeModal(false);
      alert(lang === 'ko' ? '✅ 충전/결제가 정상적으로 완료되었습니다!' : '✅ チャージ・決済が正常に完了しました！');
    } catch (err) {
      console.error(err);
      alert('결제 처리 중 요류가 발생했습니다.');
    }
  };

  // 프로필 데이터 로드
  useEffect(() => {
    if (!user) return;
    const localProfile = localStorage.getItem(`profile_${user.uid}`);
    if (localProfile) {
      try {
        const parsed = JSON.parse(localProfile);
        setNickname(parsed.displayName || '');
        setBirthdate(parsed.birthdate || '');
        setCountry(parsed.country || 'KR');
        setChildPlan(parsed.childPlan || 'DISCUSS');
        setDualIncome(parsed.dualIncome || 'FLEXIBLE');
        setReligion(parsed.religion || 'NONE');
        setResidenceFlex(parsed.residenceFlex || 'ANY');
      } catch (e) {
        console.error(e);
      }
    } else {
      setNickname(user.displayName || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMsg('');

    const profileData = {
      email: user.email,
      displayName: nickname,
      birthdate,
      country,
      childPlan,
      dualIncome,
      religion,
      residenceFlex,
    };

    // 로컬 스토리지 시뮬레이션 저장
    localStorage.setItem(`profile_${user.uid}`, JSON.stringify(profileData));

    setTimeout(() => {
      setSaving(false);
      setMsg(lang === 'ko' ? '✅ 프로필 설정이 성공적으로 저장되었습니다!' : '✅ プロフィール設定が正常に保存されました！');
    }, 800);
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
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Heart className="text-[#FF8A80]" size={28} />
            <h1 className="text-xl font-bold tracking-tight">
              {lang === 'ko' ? '내 프로필 및 결정사 가치관 설정' : '私のプロフィールと結婚価値観設定'}
            </h1>
          </div>

          {/* 지갑 현황 배지 */}
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-3 shrink-0">
            <Coins className="text-yellow-500" size={18} />
            <div className="text-left">
              <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">My Wallet</p>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                {membershipType === 'PREMIUM' ? (
                  <span className="text-xs text-yellow-500 font-extrabold">👑 PRO (무제한)</span>
                ) : (
                  <span>💖 {hearts}개</span>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowChargeModal(true)}
              className="ml-2 px-2.5 py-1 rounded bg-[#FF8A80] text-black text-[10px] font-bold hover:bg-[#FF8A80]/80 transition-colors"
            >
              {lang === 'ko' ? '충전하기' : 'チャージ'}
            </button>
          </div>
        </div>

        {msg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            {msg}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* 기본인적사항 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white/40 text-[11px] uppercase tracking-widest block mb-2 font-semibold">
                {lang === 'ko' ? '닉네임 (활동명)' : 'ニックネーム'}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                required
                className="w-full h-[46px] bg-white/[0.04] border border-white/10 rounded-xl px-4 text-white text-sm outline-none focus:border-[#FF8A80] transition-colors"
              />
            </div>
            <div>
              <label className="text-white/40 text-[11px] uppercase tracking-widest block mb-2 font-semibold">
                {lang === 'ko' ? '생년월일' : '生年月日'}
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={e => setBirthdate(e.target.value)}
                required
                className="w-full h-[46px] bg-white/[0.04] border border-white/10 rounded-xl px-4 text-white text-sm outline-none focus:border-[#FF8A80] transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div>
            <label className="text-white/40 text-[11px] uppercase tracking-widest block mb-2 font-semibold">
              {lang === 'ko' ? '거주 국가' : '居住国'}
            </label>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="country"
                  checked={country === 'KR'}
                  onChange={() => setCountry('KR')}
                  className="w-4 h-4 accent-[#FF8A80]"
                />
                대한민국 🇰🇷
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="country"
                  checked={country === 'JP'}
                  onChange={() => setCountry('JP')}
                  className="w-4 h-4 accent-[#FF8A80]"
                />
                일본 🇯🇵
              </label>
            </div>
          </div>

          {/* 결정사 가치관 매칭 값들 */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-[#00E5FF] flex items-center gap-2">
              <ShieldCheck size={18} />
              {lang === 'ko' ? 'Best-Saiko 매칭 가치관 설정' : 'Best-Saiko マッチング価値観設定'}
            </h3>

            {/* 자녀 계획 */}
            <div>
              <label className="text-white/40 text-[11px] uppercase tracking-widest block mb-3 font-semibold">
                {lang === 'ko' ? '1. 자녀 계획' : '1. 子どもの計画'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'DISCUSS', label_ko: '협의 가능', label_ja: '協議可能' },
                  { value: 'WANT', label_ko: '자녀 원함', label_ja: '子ども希望' },
                  { value: 'NO', label_ko: '원치 않음', label_ja: '希望しない' },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setChildPlan(item.value)}
                    className={`py-3 rounded-xl border text-xs font-semibold transition-all ${
                      childPlan === item.value
                        ? 'bg-[#FF8A80] text-black border-[#FF8A80]'
                        : 'bg-white/[0.03] text-white/70 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {lang === 'ko' ? item.label_ko : item.label_ja}
                  </button>
                ))}
              </div>
            </div>

            {/* 맞벌이 지향성 */}
            <div>
              <label className="text-white/40 text-[11px] uppercase tracking-widest block mb-3 font-semibold">
                {lang === 'ko' ? '2. 맞벌이 지향성' : '2. 共働きの志向'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'YES', label_ko: '맞벌이 희망', label_ja: '共働き希望' },
                  { value: 'NO', label_ko: '외벌이 선호', label_ja: '片働き希望' },
                  { value: 'FLEXIBLE', label_ko: '상황에 따름', label_ja: '柔軟に対応' },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setDualIncome(item.value)}
                    className={`py-3 rounded-xl border text-xs font-semibold transition-all ${
                      dualIncome === item.value
                        ? 'bg-[#FF8A80] text-black border-[#FF8A80]'
                        : 'bg-white/[0.03] text-white/70 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {lang === 'ko' ? item.label_ko : item.label_ja}
                  </button>
                ))}
              </div>
            </div>

            {/* 종교관 */}
            <div>
              <label className="text-white/40 text-[11px] uppercase tracking-widest block mb-3 font-semibold">
                {lang === 'ko' ? '3. 나의 종교 성향' : '3. 私の宗教的な傾向'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'NONE', label_ko: '무교', label_ja: '無宗教' },
                  { value: 'CHRISTIAN', label_ko: '개신교/천주교', label_ja: 'キリスト教' },
                  { value: 'BUDDHIST', label_ko: '불교', label_ja: '仏教' },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setReligion(item.value)}
                    className={`py-3 rounded-xl border text-xs font-semibold transition-all ${
                      religion === item.value
                        ? 'bg-[#FF8A80] text-black border-[#FF8A80]'
                        : 'bg-white/[0.03] text-white/70 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {lang === 'ko' ? item.label_ko : item.label_ja}
                  </button>
                ))}
              </div>
            </div>

            {/* 거주지 유연성 */}
            <div>
              <label className="text-white/40 text-[11px] uppercase tracking-widest block mb-3 font-semibold">
                {lang === 'ko' ? '4. 결혼 후 거주지 이동 유연성' : '4. 結婚後の移住柔軟性'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'ANY', label_ko: '상관없음', label_ja: 'こだわらない' },
                  { value: 'JAPAN', label_ko: '일본 이주 희망 🇯🇵', label_ja: '日本移住希望' },
                  { value: 'KOREA', label_ko: '한국 이주 희망 🇰🇷', label_ja: '韓国移住希望' },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setResidenceFlex(item.value)}
                    className={`py-3 rounded-xl border text-xs font-semibold transition-all ${
                      residenceFlex === item.value
                        ? 'bg-[#FF8A80] text-black border-[#FF8A80]'
                        : 'bg-white/[0.03] text-white/70 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {lang === 'ko' ? item.label_ko : item.label_ja}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-[52px] bg-white text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/95 active:scale-[0.98] transition-all disabled:opacity-50 mt-6 border-none cursor-pointer"
          >
            <Save size={16} />
            {saving ? 'Saving...' : lang === 'ko' ? '프로필 저장하기' : 'プロフィール保存'}
          </button>
        </form>
      </div>

      {/* 하트 충전 및 사용 상세 규칙 모달 */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setShowChargeModal(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg bg-[#181524] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            {/* 닫기 버튼 */}
            <button 
              onClick={() => setShowChargeModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
              <Coins className="text-yellow-500" size={24} />
              <h2 className="text-lg font-bold">
                {lang === 'ko' ? '하트 지갑 충전 및 이용 안내' : 'ハートチャージと利用規약'}
              </h2>
            </div>

            {/* 하트 차감 기준 설명서 (상세 페이지 역할) */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6 text-xs text-white/70 leading-relaxed flex flex-col gap-3">
              <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
                <AlertTriangle size={14} className="text-[#FF8A80]" />
                {lang === 'ko' ? '💖 하트 차감 및 정책 기준 안내' : '💖 ハート消費基準のご案内'}
              </h3>
              
              <ul className="flex flex-col gap-2 list-disc pl-4">
                <li>
                  <strong>{lang === 'ko' ? '1:1 일반 텍스트 대화' : '1:1 テキストメッセージ'}</strong>: 
                  {lang === 'ko' ? ' 메시지 전송 1건당 하트 1개 차감 (단, Basic 이상 결제 시 실시간 한-일 번역 무제한 무료)' : ' メッセージ送信1件につき1ハート消費（Basicプラン以上で日韓翻訳チャットが完全無料）'}
                </li>
                <li>
                  <strong>{lang === 'ko' ? '실시간 번역 영상/음성 통화' : '音声・ビデオ翻訳通話'}</strong>: 
                  {lang === 'ko' ? ' 통화 1분당 하트 1개 차감 (Pro 30일 패스 회원은 매일 60분 무료 제공, 소진 시 하트 차감)' : ' 通話1分につき1ハート消費（Proプランは毎日60分無料、超過後にハート消費）'}
                </li>
                <li>
                  <strong>{lang === 'ko' ? '신원 검증 배지 열람' : '本人確認バッジ閲覧'}</strong>: 
                  {lang === 'ko' ? ' 상호주의 원칙 동의 시 추가 차감 없이 무료 오픈' : ' 相互同意の上で追加消費なく開示'}
                </li>
              </ul>
            </div>

            {/* 결제 상품 리스트 */}
            <div className="flex flex-col gap-4">
              {/* 베이직 충전 */}
              <div className="border border-white/10 rounded-2xl p-4 flex flex-col gap-3 bg-white/[0.01]">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">Basic (베이직 하트 30개)</h4>
                    <p className="text-[11px] text-white/40 mt-1">
                      {lang === 'ko' ? '실시간 1:1 한-일 번역 채팅 무제한 활성화' : '日韓翻訳チャット無制限化'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">$29.99</p>
                    <p className="text-[10px] text-white/40">/ 39,900원</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <PayPalCheckoutButton
                    product={PRODUCTS[0]}
                    onSuccess={() => handlePaymentSuccess(PRODUCTS[0].id, PRODUCTS[0].price, false)}
                    onError={(err) => console.error('PayPal error:', err)}
                  />
                  <StripeCheckoutButton
                    product={STRIPE_PRODUCTS[0]}
                    onSuccess={() => handlePaymentSuccess(STRIPE_PRODUCTS[0].id, STRIPE_PRODUCTS[0].price.toString(), false)}
                    onError={(err) => console.error('Stripe error:', err)}
                  />
                </div>
              </div>

              {/* 프로 충전 */}
              <div className="border border-[#FF8A80]/30 rounded-2xl p-4 flex flex-col gap-3 bg-[#FF8A80]/[0.02]">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-[#FF8A80]">Pro (프로 30일 패스 + 100하트)</h4>
                    <p className="text-[11px] text-white/40 mt-1">
                      {lang === 'ko' ? '텍스트 번역 무제한 + 통화 매일 60분 무료 + 보너스 하트 100개 지급' : 'チャット無制限＋翻訳通話毎日60分無料＋ボーナス100ハート'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#FF8A80]">$99.99</p>
                    <p className="text-[10px] text-white/40">/ 129,000원</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <PayPalCheckoutButton
                    product={PRODUCTS[1]}
                    onSuccess={() => handlePaymentSuccess(PRODUCTS[1].id, PRODUCTS[1].price, true)}
                    onError={(err) => console.error('PayPal error:', err)}
                  />
                  <StripeCheckoutButton
                    product={STRIPE_PRODUCTS[1]}
                    onSuccess={() => handlePaymentSuccess(STRIPE_PRODUCTS[1].id, STRIPE_PRODUCTS[1].price.toString(), true)}
                    onError={(err) => console.error('Stripe error:', err)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
