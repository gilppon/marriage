import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, CheckCircle2, HeartHandshake, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface VisaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisaGuideModal: React.FC<VisaGuideModalProps> = ({ isOpen, onClose }) => {
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

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#141221] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[85vh] flex flex-col overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <HeartHandshake className="text-[#D4AF37]" size={24} />
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'ko' ? '💍 한일 혼인신고 4단계 및 F-6 비자 안내서' : '💍 日韓婚姻届4ステップ＆F-6ビザ案内書'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto py-5 pr-2 space-y-6 text-xs sm:text-sm text-white/80 scrollbar-thin leading-relaxed">
            
            {/* 4단계 가이드 */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} />
                <span>{lang === 'ko' ? '📌 한일 양국 혼인신고 4단계 절차 (선 한국 / 후 일본 기준)' : '📌 日韓婚姻届 4つの手続き'}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="text-[10px] font-bold text-emerald-400 block mb-1">STEP 1. 서류 발급</span>
                  <p className="text-xs text-white/90 font-bold mb-1">한국인: 혼인관계증명서 / 기본증명서</p>
                  <p className="text-[11px] text-white/50">일본인: 호적등본(戸籍謄本) 및 일본 공증 문서 발급</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="text-[10px] font-bold text-emerald-400 block mb-1">STEP 2. 한국 구청 혼인신고</span>
                  <p className="text-xs text-white/90 font-bold mb-1">한국 시·구청에 혼인신고서 제출</p>
                  <p className="text-[11px] text-white/50">신고 후 약 3~5일 이내 혼인관계증명서 등재 완료</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="text-[10px] font-bold text-emerald-400 block mb-1">STEP 3. 일본 대사관/구약소 보고</span>
                  <p className="text-xs text-white/90 font-bold mb-1">주한 일본대사관 또는 일본 구약소 신고</p>
                  <p className="text-[11px] text-white/50">한국 수리증명서 번역본 첨부하여 일본 호적 등재</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="text-[10px] font-bold text-emerald-400 block mb-1">STEP 4. F-6 결혼이민 비자 신청</span>
                  <p className="text-xs text-white/90 font-bold mb-1">대한민국 출입국·외국인관서 또는 대사관</p>
                  <p className="text-[11px] text-white/50">소득 요건, 주거 요건, 의사소통 요건 증빙 제출</p>
                </div>
              </div>
            </div>

            {/* F-6 비자 필수 서류 체크리스트 */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>{lang === 'ko' ? '🛡️ F-6 (결혼이민) 비자 필수 3대 요건' : '🛡️ F-6ビザ 必須3大要件'}</span>
              </h4>

              <ul className="space-y-2 text-xs text-white/70 list-disc pl-4">
                <li>
                  <strong className="text-white">1. 소득요건 (Income Requirement):</strong> 한국인 배우자의 과거 1년간 연간 소득 기준 충족 (원천징수영수증, 소득금액증명원)
                </li>
                <li>
                  <strong className="text-white">2. 의사소통요건 (Language Requirement):</strong> 한국어능력시험(TOPIK) 1급 이상, 세종학당 이수 또는 지정 언어 입증 서류 (※ 본 앱의 Gemini AI 통역 대화 이력 제출 활용 가능)
                </li>
                <li>
                  <strong className="text-white">3. 주거요건 (Housing Requirement):</strong> 한국인 배우자 명의의 임대차계약서 또는 자가 등기사항전부증명서
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400/80 flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0" />
              <span>
                {lang === 'ko' 
                  ? 'Korea Aimasu 제휴 행정사 네트워크를 통해 성사 커플 서류 대행 할인 혜택을 받으실 수 있습니다.'
                  : 'Korea Aimasu提携行政書士ネットワークを通じて、書類作成の優待サポートを受けることができます。'}
              </span>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
