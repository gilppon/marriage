import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const PrivacyPolicy: React.FC = () => {
  const { lang } = useLanguage();
  const ko = lang === 'ko';

  return (
    <div className="space-y-6 text-left text-white/80 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-lg font-bold text-[#D4AF37]">
          {ko ? '개인정보 처리방침' : 'プライバシーポリシー'}
        </h2>
        <p className="text-xs text-white/40">Last Updated: 2026-07-22</p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '1. 수집하는 개인정보 항목' : '1. 収集する個人情報項目'}
        </h3>
        <p>
          {ko 
            ? '서비스 가입 및 eKYC 본인 인증 시 다음 정보를 수집합니다:' 
            : 'サービスへの加入およびeKYC本人確認の際、以下の情報を収集します:'}
        </p>
        <ul className="list-disc pl-5 space-y-1 text-white/70">
          <li>
            {ko 
              ? '이메일, 비밀번호, 닉네임, 생년월일, 거주 국가(KR/JP)' 
              : 'メールアドレス、パスワード、ニックネーム、生年月日、居住国(KR/JP)'}
          </li>
          <li>
            {ko 
              ? 'eKYC 검증용 신분증 이미지 (판독 즉시 마스킹 처리 및 안전 관리)' 
              : 'eKYC検証用の身分証明書画像（判定後直ちにマスキング処理および安全管理を行います）'}
          </li>
          <li>
            {ko 
              ? '결혼 가치관 데이터, 프로필 사진, 관심사 정보' 
              : '結婚価値観データ、プロフィール写真、興味関心情報'}
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '2. 실시간 AI 오디오 데이터의 처리' : '2. リアルタイムAIオーディオデータの処理'}
        </h3>
        <p>
          {ko 
            ? '실시간 화상 통화 시 제공되는 Gemini 3.5 Live AI 통역 및 유해성 보안 감시 기능의 수집 항목:' 
            : 'リアルタイムビデオ通話時に提供されるGemini 3.5 Live AI通訳および有害性セキュリティ監視機能の収集項目:'}
        </p>
        <ul className="list-disc pl-5 space-y-1 text-white/70">
          <li>
            {ko 
              ? '실시간 16kHz PCM 오디오 스트림 (통역 및 유해 스캠 텍스트 검출용)' 
              : 'リアルタイム16kHz PCMオーディオストリーム（通訳および有害・詐欺テキスト検出用）'}
          </li>
          <li>
            {ko 
              ? '수신된 오디오 스트림은 통역 및 가드 목적 이외에 영구 저장하지 않으며 실시간 릴레이 후 파기됩니다.' 
              : '受信されたオーディオストリームは、通訳および防犯目的以外で永久保存されることはなく、リアルタイムの中継後に破棄されます。'}
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '3. 개인정보의 제3자 제공' : '3. 個人情報の第三者提供'}
        </h3>
        <p>
          {ko 
            ? '원칙적으로 회원의 개인정보를 외부에 판매하거나 제공하지 않습니다. 단, 법령에 의한 수사기관의 적법한 요구가 있는 경우는 예외로 합니다.' 
            : '原則として会員の個人情報を外部に販売または提供することはありません。ただし、法令に基づく捜査機関の適法な要求がある場合は例外とします。'}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">
          {ko ? '4. 개인정보의 파기' : '4. 個人情報の破棄'}
        </h3>
        <p>
          {ko 
            ? '회원 탈퇴 요청 시 즉시 데이터베이스에서 파기되며, 법령 보존 의무가 있는 결제 기록 등은 수동 보관 기간 완료 후 파기됩니다.' 
            : '退会申請の際、直ちにデータベースから破棄され、法令に基づき保存義務がある決済記録などは、所定の保管期間終了後に破棄されます。'}
        </p>
      </section>

      <section className="pt-2 border-t border-white/10">
        <p className="text-xs text-white/40">
          {ko ? '개인정보 관리책임자' : '個人情報管理責任者'}: GILHO SHIN | support@next-haru.com
        </p>
      </section>
    </div>
  );
};
