import { useEffect, useRef, useCallback, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
} from 'framer-motion';
import { ScrambleIn } from '../components/ScrambleText';
import PayPalCheckoutButton from '../components/payment/PayPalCheckoutButton';
import TossCheckoutButton from '../components/payment/TossCheckoutButton';
import { useAuth } from '../contexts/AuthContext';
import { createOrder } from '../lib/firestore';
import { PRODUCTS } from '../lib/paypal';
import { TOSS_PRODUCTS } from '../lib/toss';
import { VIDEO_URLS } from '../config/videos';
import { SITE_CONFIG } from '../config/content';
import { ConnectAILabLogo } from '../components/ConnectAILabLogo';
import { useLanguage } from '../contexts/LanguageContext';


export default function LandingPage() {
  const [entranceComplete, setEntranceComplete] = useState(false);
  const { user } = useAuth();
  const { lang } = useLanguage();

  /* ── PayPal 결제 완료 → Firestore 저장 ── */
  const handlePayPalSuccess = useCallback(
    async (details: any, productId: string, productName: string, amount: string) => {
      const orderId = details.id || `pp_${Date.now()}`;
      try {
        await createOrder({
          id: orderId,
          userId: user?.uid || 'anonymous',
          productId,
          productName,
          amount: parseFloat(amount),
          currency: 'USD',
          status: 'completed',
          paypalOrderId: orderId,
          paypalPayerId: details.payer?.payer_id || '',
        });
        console.log('[Firestore] Order saved:', orderId);
        alert(`✅ 결제 완료! Order: ${orderId}`);
      } catch (err) {
        console.error('[Firestore] Failed to save order:', err);
        alert(`결제는 완료되었지만 기록 저장에 실패했습니다. Order: ${orderId}`);
      }
    },
    [user]
  );

  /* ── Hero video mouse-scrub ── */
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const isSeekingRef = useRef(false);

  const handleSeeked = useCallback(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    isSeekingRef.current = false;
    if (Math.abs(video.currentTime - targetTimeRef.current) > 0.01) {
      isSeekingRef.current = true;
      video.currentTime = targetTimeRef.current;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const video = heroVideoRef.current;
      if (!video || !video.duration) return;
      const deltaX = e.movementX;
      const sensitivity = 0.8;
      const change = (deltaX / window.innerWidth) * video.duration * sensitivity;
      targetTimeRef.current = Math.max(
        0,
        Math.min(video.duration, targetTimeRef.current + change)
      );
      if (!isSeekingRef.current) {
        isSeekingRef.current = true;
        video.currentTime = targetTimeRef.current;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  /* ── Entrance delay ── */
  useEffect(() => {
    const timer = setTimeout(() => setEntranceComplete(true), 800);
    return () => clearTimeout(timer);
  }, []);

  /* ── Section 2 scroll-driven 3D text ── */
  const section2Ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: section2Ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 15,
    damping: 32,
    mass: 1.8,
  });
  const yScaleValue = useTransform(smoothProgress, [0, 1], [60, -120]);
  const textOpacity = useTransform(smoothProgress, [0.3, 0.5], [0, 1]);
  const transform3D = useMotionTemplate`rotateX(24deg) translateY(${yScaleValue}px) translateZ(15px)`;

  const { hero, cinematic, metrics, technology, architecture, footer } = SITE_CONFIG[lang];

  return (
    <div className="relative">
      {/* ════════════════ SECTION 1: HERO ════════════════ */}
      <section className="relative h-screen h-[100dvh] flex flex-col overflow-hidden">
        {/* Video background (mouse-scrubbed) */}
        {VIDEO_URLS.hero && (
          <video
            ref={heroVideoRef}
            src={VIDEO_URLS.hero}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            preload="auto"
            onSeeked={handleSeeked}
          />
        )}

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.05,
          }}
        />

        {/* Watermark text */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{ paddingTop: 50 }}
        >
          <span
            className="uppercase select-none"
            style={{
              fontFamily: '"Anton SC", sans-serif',
              fontSize: 'clamp(120px, 30vw, 521px)',
              letterSpacing: '-4px',
              opacity: 0.1,
              background:
                'radial-gradient(circle, rgba(142,127,148,0) 0%, #8E7F94 70%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              lineHeight: 1,
            }}
          >
            {hero.watermark}
          </span>
        </div>

        {/* Hero content */}
        <motion.div
          className="relative z-20 flex flex-col flex-1 px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: entranceComplete ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          <div className="flex-1" />

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            {/* Left column */}
            <div className="flex flex-col gap-4">
              <h1
                className="text-white font-light leading-[0.95] tracking-[-0.03em]"
                style={{ fontSize: 'clamp(40px, 10vw, 100px)' }}
              >
                <ScrambleIn text={hero.titleLeft[0]} delay={200} triggered={entranceComplete} />
                <br />
                <ScrambleIn text={hero.titleLeft[1]} delay={500} triggered={entranceComplete} />
              </h1>

              <motion.p
                className="max-w-sm text-[13px] sm:text-[15px] text-white/60 leading-relaxed"
                initial={{ opacity: 0, y: 25 }}
                animate={entranceComplete ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.9,
                  ease: [0.215, 0.61, 0.355, 1.0],
                  delay: 0.2,
                }}
              >
                {hero.description}
              </motion.p>
            </div>

            {/* Right heading */}
            <h1
              className="text-white font-light leading-[0.95] tracking-[-0.03em] text-left md:text-right"
              style={{ fontSize: 'clamp(40px, 10vw, 100px)' }}
            >
              <ScrambleIn text={hero.titleRight[0]} delay={700} triggered={entranceComplete} />
              <br />
              <ScrambleIn text={hero.titleRight[1]} delay={1000} triggered={entranceComplete} />
            </h1>
          </div>
        </motion.div>
      </section>

      {/* ════════════════ SECTION 2: CINEMATIC TEXT ════════════════ */}
      <section
        ref={section2Ref}
        className="relative h-screen h-[100dvh] flex items-center justify-center overflow-hidden"
      >
        {/* Video background */}
        {VIDEO_URLS.section2 && (
          <video
            src={VIDEO_URLS.section2}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        {/* Top gradient overlay */}
        <div
          className="absolute top-0 left-0 right-0 z-10"
          style={{
            height: 180,
            background: 'linear-gradient(to bottom, #010103, transparent)',
          }}
        />

        {/* 3D text content */}
        <div className="relative z-20 max-w-5xl mx-auto" style={{ perspective: 400 }}>
          <motion.p
            className="font-sans font-normal text-[22px] sm:text-[30px] md:text-[36px] lg:text-[42px] text-white leading-[1.35] tracking-[-0.02em] select-none px-6 sm:px-12 text-center"
            style={{
              transform: transform3D,
              opacity: textOpacity,
            }}
          >
            {cinematic.text}
          </motion.p>
        </div>
      </section>

      {/* ════════════════ SECTION 3: METRICS ════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video background */}
        {VIDEO_URLS.metrics && (
          <video
            src={VIDEO_URLS.metrics}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        <div className="relative z-20 pt-32 pb-32 px-6 max-w-6xl mx-auto w-full">
          <motion.p
            className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-20 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {metrics.subtitle}
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center">
            {metrics.items.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div
                  className="text-white font-light tracking-[-0.04em] leading-none"
                  style={{ fontSize: 'clamp(48px, 10vw, 96px)' }}
                >
                  {m.value}
                </div>
                <div className="text-white/40 text-[13px] sm:text-[15px] mt-4 tracking-wide">
                  {m.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ SECTION 4: TECHNOLOGY ════════════════ */}
      <section className="relative h-screen h-[100dvh] flex flex-col overflow-hidden">
        {/* Video background */}
        {VIDEO_URLS.technology && (
          <video
            src={VIDEO_URLS.technology}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        <div className="relative z-20 flex flex-col flex-1 px-8 sm:px-12 md:px-16 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <motion.h2
              className="text-white font-light leading-[0.95] tracking-[-0.03em]"
              style={{ fontSize: 'clamp(36px, 8vw, 72px)' }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {technology.title[0]}
              <br />
              {technology.title[1]}
            </motion.h2>

            <motion.p
              className="text-white/50 text-[13px] sm:text-[15px] leading-relaxed max-w-xs md:text-right md:pt-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {technology.description}
            </motion.p>
          </div>

          <div className="flex-1" />

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.3 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {technology.features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <h3 className="text-white text-[14px] sm:text-[16px] font-normal mb-2">
                  {f.title}
                </h3>
                <p className="text-white/40 text-[12px] sm:text-[14px] leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ SECTION 5: ARCHITECTURE ════════════════ */}
      <section className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-3xl mx-auto px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <p className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-8">
              {architecture.subtitle}
            </p>
            <h2
              className="text-white font-light leading-[1.15] tracking-[-0.02em] mb-10"
              style={{ fontSize: 'clamp(28px, 6vw, 56px)' }}
            >
              {architecture.heading}
            </h2>
            <p className="text-white/45 text-[15px] sm:text-[17px] leading-relaxed max-w-xl mx-auto">
              {architecture.description}
            </p>
          </motion.div>

          <motion.div
            className="mt-20 flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            viewport={{ once: true, amount: 0.4 }}
          >
            {architecture.layers.map((l) => (
              <div
                key={l.num}
                className="w-full max-w-md h-[72px] border border-white/10 rounded-lg flex items-center justify-between px-6"
              >
                <span className="text-white/30 text-[12px] tracking-[0.15em] uppercase">
                  Layer {l.num}
                </span>
                <span className="text-white text-[16px] sm:text-[18px] font-light">
                  {l.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ SECTION 6: PRICING ════════════════ */}
      <section className="min-h-screen bg-black py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <p className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-8">
              Pricing
            </p>
            <h2
              className="text-white font-light leading-[1.15] tracking-[-0.02em] mb-6"
              style={{ fontSize: 'clamp(28px, 6vw, 56px)' }}
            >
              Choose Your Plan
            </h2>
            <p className="text-white/45 text-[15px] sm:text-[17px] leading-relaxed max-w-xl mx-auto">
              Select the neural interface access tier that fits your needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* ── Free (일반) ── */}
            <motion.div
              className="border border-white/10 rounded-2xl p-8 flex flex-col"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <p className="text-white/40 text-[12px] tracking-[0.15em] uppercase mb-3">Free (일반)</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-white text-[42px] font-light tracking-tight">$0</span>
                <span className="text-white/30 text-[14px]">/기본 가입</span>
              </div>
              <p className="text-white/40 text-[13px] leading-relaxed mb-8">
                회원가입 후 기본 가치관 매칭 체험 및 실시간 채팅을 지원합니다.
              </p>
              <ul className="flex flex-col gap-3 mb-10 flex-1">
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> 신규 가입 기본 하트 5개 지급
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> 실시간 스캠 감시 1:1 텍스트 채팅
                </li>
                <li className="flex items-center gap-3 text-white/60/40 text-[13px]">
                  <span className="text-white/30">✗</span> 실시간 번역 기능 (번역 미지원)
                </li>
              </ul>
              <div className="flex flex-col gap-3">
                <button
                  disabled
                  className="w-full h-[50px] rounded-lg font-medium text-[15px] flex items-center justify-center gap-2 border border-white/10 bg-white/5 text-white/40 cursor-default"
                >
                  기본 활성화됨
                </button>
              </div>
            </motion.div>

            {/* ── Basic (베이직) ── */}
            <motion.div
              className="border border-white/10 rounded-2xl p-8 flex flex-col relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <p className="text-white/40 text-[12px] tracking-[0.15em] uppercase mb-3">Basic (베이직)</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-white text-[42px] font-light tracking-tight">$29.99</span>
                <span className="text-white/30 text-[14px]">/ 39,900원 (일회성)</span>
              </div>
              <p className="text-white/40 text-[13px] leading-relaxed mb-8">
                실시간 번역 채팅이 활성화되며 가치관 정밀 추천 매칭을 지원합니다.
              </p>
              <ul className="flex flex-col gap-3 mb-10 flex-1">
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> 활동용 하트 30개 충전
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> 실시간 한-일 1:1 자동 번역 채팅 활성화
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> AI 정밀 가치관 4분면 분석 제공
                </li>
              </ul>
              <div className="flex flex-col gap-3">
                <PayPalCheckoutButton
                  product={PRODUCTS[0]}
                  onSuccess={(details) => handlePayPalSuccess(details, PRODUCTS[0].id, PRODUCTS[0].name, PRODUCTS[0].price)}
                  onError={(err) => console.error('PayPal error:', err)}
                />
                <TossCheckoutButton
                  product={TOSS_PRODUCTS[0]}
                  onError={(err) => console.error('Toss error:', err)}
                />
              </div>
            </motion.div>

            {/* ── Pro (프로 / Featured) ── */}
            <motion.div
              className="border border-white/25 rounded-2xl p-8 flex flex-col relative bg-white/[0.03]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-white text-black text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-1.5 rounded-full">
                  Premium
                </span>
              </div>
              <p className="text-white/40 text-[12px] tracking-[0.15em] uppercase mb-3">Pro (프로)</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-white text-[42px] font-light tracking-tight">$99.99</span>
                <span className="text-white/30 text-[14px]">/ 129,000원 (30일)</span>
              </div>
              <p className="text-white/40 text-[13px] leading-relaxed mb-8">
                무제한 번역 채팅과 실시간 오디오/비디오 번역 통화, 그리고 보너스 하트 제공으로 언어 장벽을 완전히 허뭅니다.
              </p>
              <ul className="flex flex-col gap-3 mb-10 flex-1">
                <li className="flex items-center gap-3 text-[#FF8A80] text-[13px] font-bold">
                  <span className="text-[#FF8A80]">✓</span> 가입 즉시 보너스 하트 100개 지급
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> 1:1 실시간 텍스트 번역 채팅 30일 완전 무제한
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> 실시간 번역 영상/음성 통화 매일 60분 무료
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> 일일 무료 통화 초과 시 보너스 하트로 사용
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> 상호주의 신원 검증 배지 필터 잠금 해제
                </li>
              </ul>
              <div className="flex flex-col gap-3">
                <PayPalCheckoutButton
                  product={PRODUCTS[1]}
                  onSuccess={(details) => handlePayPalSuccess(details, PRODUCTS[1].id, PRODUCTS[1].name, PRODUCTS[1].price)}
                  onError={(err) => console.error('PayPal error:', err)}
                />
                <TossCheckoutButton
                  product={TOSS_PRODUCTS[1]}
                  onError={(err) => console.error('Toss error:', err)}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="bg-black overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[400px]">
          {/* Left: Video */}
          <div className="md:w-1/2 h-[300px] md:h-auto relative">
            {VIDEO_URLS.footer ? (
              <video
                src={VIDEO_URLS.footer}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <div className="absolute inset-0 bg-white/5" />
            )}
          </div>

          {/* Right: Content */}
          <div className="md:w-1/2 flex flex-col justify-between p-10 sm:p-16">
            <div>
              <div className="flex items-center gap-2.5 mb-8">
                <ConnectAILabLogo size={18} className="text-white/70" />
                <span className="text-[15px] font-medium text-white/70 tracking-tight">
                  {SITE_CONFIG[lang].brandName}
                </span>
              </div>
              <p className="text-white/40 text-[14px] sm:text-[15px] leading-relaxed max-w-sm">
                {footer.tagline}
              </p>
            </div>

            <p className="text-white/25 text-[12px] mt-12">
              {SITE_CONFIG[lang].copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
