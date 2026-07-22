import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const Tokushoho: React.FC = () => {
  const { lang } = useLanguage();
  const ko = lang === 'ko';

  const rows = [
    {
      label: ko ? '사업자 명칭' : '事業者の名称',
      value: 'Next-Haru Inc. (next-haru.com)',
    },
    {
      label: ko ? '운영 총괄 책임자' : '運営統括責任者',
      value: 'GILHO SHIN (신길호)',
    },
    {
      label: ko ? '소재지' : '所在地',
      value: (
        <>
          〒257-0034 神奈川県秦野市大秦町1-7
          <br />
          1-7 Daishincho, Hadano-shi, Kanagawa 257-0034, Japan
        </>
      ),
    },
    {
      label: ko ? '연락처 이메일' : '連絡先メール',
      value: (
        <a href="mailto:support@next-haru.com" className="text-[#D4AF37] hover:underline">
          support@next-haru.com
        </a>
      ),
    },
    {
      label: ko ? '전화번호' : '電話番号',
      value: '+81 80-8879-0002 (080-8879-0002)',
    },
    {
      label: ko ? '판매 가격' : '販売価格',
      value: ko
        ? '각 구독 플랜 및 하트 상품 페이지에 표시'
        : '各プラン・ハート購入ページに表示',
    },
    {
      label: ko ? '상품 대금 외 필요 비용' : '商品代金以外の必要料金',
      value: ko
        ? '인터넷 접속료 및 데이터 통신비는 이용자 부담입니다.'
        : 'インターネット接続料金・パケット通信料等はお客様の負担となります。',
    },
    {
      label: ko ? '결제 방법' : '支払方法',
      value: ko
        ? '신용카드 결제 (PayPal, Stripe 경유)'
        : 'クレジットカード決済（PayPal, Stripe経由）',
    },
    {
      label: ko ? '결제 시기' : '支払時期',
      value: ko
        ? '구매 시점에 즉시 결제됩니다.'
        : 'ご購入時に即時決済されます。',
    },
    {
      label: ko ? '서비스 제공 시기' : '役務の提供時期',
      value: ko
        ? '결제 완료 후 즉시 이용 가능합니다.'
        : '決済完了後、直ちにご利用いただけます。',
    },
    {
      label: ko ? '준거 법령' : '準拠法令',
      value: ko
        ? '대한민국 결혼중개업의 관리에 관한 법률 (만 19세 이상) / 일본 インターネット異性紹介事業利用法 (만 18세 이상)'
        : '韓国 結婚仲介業法（満19歳以上） / 日本 インターネット異性紹介事業利用法（満18歳以上）',
    },
    {
      label: ko ? '반품 및 취소 특약' : '返品・キャンセルに関する特約',
      value: ko
        ? '디지털 서비스 특성상 제공 후 환불 불가 (환불 규정 참조)'
        : 'デジタル役務の性質上、購入後のキャンセル・返金は原則不可（返金規定参照）',
    },
  ];

  return (
    <div className="space-y-6 text-left text-white/80 text-sm">
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-lg font-bold text-[#D4AF37]">
          {ko ? '특정상거래법에 따른 표시' : '特定商取引法に基づく表記'}
        </h2>
        <p className="text-xs text-white/40">Specified Commercial Transactions Act</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs sm:text-sm">
        {rows.map((row, idx) => (
          <React.Fragment key={idx}>
            <div className="font-semibold text-white/60 sm:col-span-1 border-b border-white/5 pb-1 sm:border-none sm:pb-0">
              {row.label}
            </div>
            <div className="sm:col-span-2 text-white/90 border-b border-white/5 pb-2 sm:border-none sm:pb-0">
              {row.value}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
