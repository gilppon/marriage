import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import { Tokushoho } from './Tokushoho';
import { TermsOfService } from './TermsOfService';
import { PrivacyPolicy } from './PrivacyPolicy';
import { RefundPolicy } from './RefundPolicy';
import { useLanguage } from '../../contexts/LanguageContext';

export type LegalTab = 'tokushoho' | 'terms' | 'privacy' | 'refund';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, initialTab = 'tokushoho', onClose }) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const { lang } = useLanguage();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-[#141221] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#D4AF37]" size={22} />
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'ko' ? '법률 고지 및 규정' : '法的表記および規約'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex gap-2 border-b border-white/10 py-3 overflow-x-auto shrink-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('tokushoho')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'tokushoho'
                  ? 'bg-[#D4AF37] text-black font-bold'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {lang === 'ko' ? '특정상거래법 표시' : '特定商取引法に基づく表記'}
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'terms'
                  ? 'bg-[#D4AF37] text-black font-bold'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {lang === 'ko' ? '이용약관' : '利用規約'}
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'privacy'
                  ? 'bg-[#D4AF37] text-black font-bold'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {lang === 'ko' ? '개인정보 처리방침' : 'プライバシーポリシー'}
            </button>
            <button
              onClick={() => setActiveTab('refund')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'refund'
                  ? 'bg-[#D4AF37] text-black font-bold'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {lang === 'ko' ? '환불 규정' : '返金ポリシー'}
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto py-5 pr-2 scrollbar-thin">
            {activeTab === 'tokushoho' && <Tokushoho />}
            {activeTab === 'terms' && <TermsOfService />}
            {activeTab === 'privacy' && <PrivacyPolicy />}
            {activeTab === 'refund' && <RefundPolicy />}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
