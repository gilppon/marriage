import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const RefundPolicy: React.FC = () => {
  const { lang } = useLanguage();
  const ko = lang === 'ko';

  return (
    <div className="space-y-6 text-left text-white/80 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-lg font-bold text-[#D4AF37]">
          {ko ? '환불 및 취소 규정' : '返금・キャンセルポリシー'}
        </h2>
        <p className="text-xs text-white/40">Last Updated: 2026-07-22</p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '1. 디지털 콘텐츠 및 하트 재화 원칙' : '1. デジタルコンテンツおよびハート通貨の原則'}
        </h3>
        <p>
          {ko 
            ? '본 서비스에서 제공되는 하트(Heart) 및 프리미엄 멤버십 구독 상품은 결제 완료 즉시 계정에 반영되는 전자적 디지털 서비스로서, 원칙적으로 결제 후 환불/취소가 불가능합니다.' 
            : '本サービスで提供されるハート（Heart）およびプレミアムメンバーシップ購読商品は、決済完了後直ちにアカウントに反映される電子的なデジタルサービスであり、原則として決済後の返金・キャンセルは不可能です。'}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '2. 예외적 환불 승인 조건' : '2. 例外的な返金承認条件'}
        </h3>
        <p>
          {ko 
            ? '다음의 사유에 해당하는 경우 결제 수단으로 예외 환불 조치가 승인될 수 있습니다:' 
            : '以下の事由に該当する場合、決済手段への例外的な返金措置が承認される場合があります:'}
        </p>
        <ul className="list-disc pl-5 space-y-1 text-white/70">
          <li>
            {ko 
              ? '시스템 결제 결함으로 인한 중복 결제 발생 시' 
              : 'システム決済の不具合による重複決済が発生した場合'}
          </li>
          <li>
            {ko 
              ? '결제 완료 후 시스템 장애로 하트 재화가 미지급되었고 복구가 불가능한 경우' 
              : '決済完了後にシステム障害でハートが未付与となり、復旧が不可能な場合'}
          </li>
          <li>
            {ko 
              ? '도용 또는 명의 도용으로 인한 부정한 결제가 증명된 경우' 
              : '不正利用または名義盗用による不正な決済が証明された場合'}
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '3. 환불 신청 기간 및 방법' : '3. 返金申請期間および方法'}
        </h3>
        <p>
          {ko 
            ? '결제일로부터 7일 이내에 아래 이메일로 결제 영수증 번호와 사유를 첨부하여 신청해주셔야 합니다.' 
            : '決済日から7日以内に、以下のメールアドレス宛てに決済領収書番号と事由を添付の上、申請していただく必要があります。'}
        </p>
        <p className="text-white/60">
          {ko ? '이메일' : 'メール'}: <a href="mailto:support@next-haru.com" className="text-[#D4AF37] hover:underline">support@next-haru.com</a>
        </p>
      </section>

      <section className="pt-2 border-t border-white/10">
        <p className="text-xs text-white/40">
          {ko 
            ? '처리 소요 기간: 승인 후 영업일 기준 5~10일 이내 카드사 결제 취소' 
            : '処理所要期間：承認後、営業日基準で5〜10日以内にカード会社経由で決済キャンセルが行われます'}
        </p>
      </section>
    </div>
  );
};
