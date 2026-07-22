import React, { useState } from 'react';
import { LegalModal, type LegalTab } from './legal/LegalModal';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield } from 'lucide-react';

import { VisaGuideModal } from './legal/VisaGuideModal';

export const Footer: React.FC = () => {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [visaModalOpen, setVisaModalOpen] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState<LegalTab>('tokushoho');
  const { lang } = useLanguage();

  const openLegal = (tab: LegalTab) => {
    setActiveLegalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <>
      <footer className="w-full bg-[#090710] border-t border-white/10 text-white/50 text-xs py-10 px-6 font-sans mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-6 text-center md:text-left">
          {/* 브랜드 및 정보 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-sm">
              <Shield size={16} className="text-[#D4AF37]" />
              <span>Best Saiko (Marriage Match)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-white/40 max-w-md">
              한일 양국 간 진지한 가치관 매칭 및 AI 실시간 통역 화상 플랫폼.
              <br />
              대한민국 결혼중개업법 및 일본 이성소개사업법 준수 공인 신원 검증 서비스.
            </p>
            <p className="text-[10px] text-white/30 mt-1">
              © 2026 Next-Haru Inc. All Rights Reserved. 運営統括責任者: GILHO SHIN
            </p>
          </div>

          {/* 법률 링크 바 */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs text-white/70">
            <button
              onClick={() => setVisaModalOpen(true)}
              className="text-[#D4AF37] font-bold hover:underline transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1"
            >
              <span>💍</span>
              <span>{lang === 'ko' ? '혼인신고 & F-6비자 가이드' : '婚姻届・ビザガイド'}</span>
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={() => openLegal('tokushoho')}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer bg-transparent border-none"
            >
              {lang === 'ko' ? '특정상거래법 표시' : '特定商取引法に基づく表記'}
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={() => openLegal('terms')}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer bg-transparent border-none"
            >
              {lang === 'ko' ? '이용약관' : '利用規約'}
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={() => openLegal('privacy')}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer bg-transparent border-none"
            >
              {lang === 'ko' ? '개인정보 처리방침' : 'プライバシーポリシー'}
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={() => openLegal('refund')}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer bg-transparent border-none"
            >
              {lang === 'ko' ? '환불 규정' : '返金ポリシー'}
            </button>
          </div>
        </div>
      </footer>

      {/* 법률 모달 */}
      <LegalModal
        isOpen={legalModalOpen}
        initialTab={activeLegalTab}
        onClose={() => setLegalModalOpen(false)}
      />

      {/* 혼인신고 및 F-6 비자 행정 가이드 모달 */}
      <VisaGuideModal
        isOpen={visaModalOpen}
        onClose={() => setVisaModalOpen(false)}
      />
    </>
  );
};
