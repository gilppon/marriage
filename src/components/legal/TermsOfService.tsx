import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const TermsOfService: React.FC = () => {
  const { lang } = useLanguage();
  const ko = lang === 'ko';

  return (
    <div className="space-y-6 text-left text-white/80 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-lg font-bold text-[#D4AF37]">
          {ko ? '서비스 이용약관' : '利用規約'}
        </h2>
        <p className="text-xs text-white/40">Last Updated: 2026-07-22</p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '1. 연령 제한 및 관계법령 준수' : '1. 年齢制限および関連法令の遵守'}
        </h3>
        <p>
          {ko
            ? '본 서비스(Best Saiko)는 성인 전용 글로벌 한일 매칭 플랫폼입니다.'
            : '本サービス（Best Saiko）は成人専用のグローバル日韓マッチングプラットフォームです。'}
        </p>
        <ul className="list-disc pl-5 space-y-1 text-white/70">
          <li>
            <strong>{ko ? '대한민국 거주 회원:' : '韓国居住会員：'}</strong>{' '}
            {ko
              ? '[결혼중개업의 관리에 관한 법률]에 따라 만 19세 미만 미성년자의 가입 및 이용이 엄격히 금지됩니다.'
              : '「結婚仲介業法」に基づき、満19歳未満の未成年者の加入および利用は厳禁です。'}
          </li>
          <li>
            <strong>{ko ? '일본 거주 회원:' : '日本居住会員：'}</strong>{' '}
            {ko
              ? '[インターネット異性紹介事業利用法]에 따라 만 18세 미만 미성년자의 이용이 금지되며, 공인 신분증을 통한 연령 증명이 필수입니다.'
              : '「インターネット異性紹介事業利用法」に基づき、満18歳未満の未成年者の利用は禁止されており、公的身分証による年齢確認が必須です。'}
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '2. 신원 인증 및 eKYC' : '2. 本人確認およびeKYC'}
        </h3>
        <p>
          {ko
            ? '모든 회원은 안전하고 신뢰할 수 있는 매칭 환경을 위해 본인인증(여권, 주민등록증, 마이넘버카드 등)을 거쳐야 합니다. 허위 신원 제출 시 서비스 이용이 즉시 정지(Ban)됩니다.'
            : 'すべての会員は安全で信頼できるマッチング環境のため、本人確認（パスポート、住民票、マイナンバーカード等）が必要です。虚偽の身元提出が判明した場合、即時利用停止（Ban）となります。'}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '3. 금지 행위 및 AI 실시간 가드' : '3. 禁止行為およびAIリアルタイムガード'}
        </h3>
        <p>
          {ko
            ? '다음 행위 적발 시 AI 보안 가드 시스템에 의해 통화/대화가 즉시 강제 종료되며 법적 조치를 받을 수 있습니다.'
            : '以下の行為が検出された場合、AIセキュリティガードシステムにより通話・会話が即時強制終了され、法的措置を受ける可能性があります。'}
        </p>
        <ul className="list-disc pl-5 space-y-1 text-white/70">
          <li>
            {ko
              ? '금전 요구, 계좌 이체 유도, 암호화폐 거래 권유 등 스캠(Scam) 행위'
              : '金銭要求、口座振込誘導、暗号資産取引勧誘などの詐欺（Scam）行為'}
          </li>
          <li>
            {ko
              ? '성희롱, 언어폭력, 인종차별 및 부적절한 이미지 송출'
              : 'セクハラ、暴言、人種差別および不適切な画像の送信'}
          </li>
          <li>
            {ko
              ? '외부 메신저(카카오톡, 라인 등)로의 비정상적 유도 행위'
              : '外部メッセンジャー（KakaoTalk、LINE等）への不正誘導行為'}
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '4. 유료 결제 및 하트 재화' : '4. 有料決済およびハート通貨'}
        </h3>
        <p>
          {ko
            ? '유료 멤버십 및 하트 재화는 Stripe 및 PayPal의 안전한 결제 모듈을 통해 처리되며, 결제 완료 즉시 효력이 발생합니다.'
            : '有料メンバーシップおよびハート通貨はStripeおよびPayPalの安全な決済モジュールを通じて処理され、決済完了と同時に有効となります。'}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '5. 면책 조항' : '5. 免責事項'}
        </h3>
        <p>
          {ko
            ? '회사는 회원 간의 상호 대화나 개인적 만남에서 발생하는 개인적 분쟁에 대해 직접적인 책임을 지지 않으나, 신고 접수 시 엄격히 진상을 조사하여 제재합니다.'
            : '当社は会員間の相互会話や個人的な出会いから生じる個人的紛争について直接的な責任を負いませんが、通報を受けた場合は厳正に調査し制裁措置を取ります。'}
        </p>
      </section>

      <section className="pt-2 border-t border-white/10">
        <p className="text-xs text-white/40">
          {ko ? '문의사항' : 'お問い合わせ'}: support@next-haru.com | {ko ? '운영 총괄 책임자' : '運営統括責任者'}: GILHO SHIN
        </p>
      </section>
    </div>
  );
};
