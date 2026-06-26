export type ProfileVisibility = 'ALL' | 'VERIFIED_ONLY' | 'MATCHED_ONLY' | 'NONE';
export type AgeVisibility = 'PUBLIC' | 'BLURRED' | 'PRIVATE';
export type JobVisibility = 'PUBLIC' | 'INDUSTRY_ONLY' | 'PRIVATE';
export type IncomeVisibility = 'PUBLIC' | 'VERIFIED_ONLY' | 'PRIVATE';
export type RealNameVisibility = 'MATCHED_ONLY' | 'PRIVATE';

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  ageVisibility: AgeVisibility;
  jobVisibility: JobVisibility;
  incomeVisibility: IncomeVisibility;
  realNameVisibility: RealNameVisibility;
  blockCountry: ('KR' | 'JP')[]; // 특정 국가 회원 대상 매칭/노출 차단 설정
  consentCompatibilityOpen: boolean; // 결혼 적합도 상세 공개 여부 상호 동의
  excludeRegions: string[];         // 검색 제외 지역 키워드 리스트
  excludeJobs: string[];            // 검색 제외 직업 키워드 리스트
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: 'ALL',
  ageVisibility: 'PUBLIC',
  jobVisibility: 'PUBLIC',
  incomeVisibility: 'VERIFIED_ONLY',
  realNameVisibility: 'MATCHED_ONLY',
  blockCountry: [],
  consentCompatibilityOpen: false,
  excludeRegions: [],
  excludeJobs: []
};

/**
 * 진지한 관계(Serious Relationship)로 발전하여 서비스를 종료/탈퇴 시의 개인정보 보존 및 파기 정책 (GDPR 및 한일 개인정보보호법 준수)
 * 
 * 1. 즉시 파기 대상 (Disposal):
 *    - 채팅 이력, 실시간 음성 통화 로그, eKYC 안면 대조용 원본 셀피 이미지 및 서류 원본 파일.
 *    - 매칭 알고리즘 점수 및 가치관 데이터.
 * 
 * 2. 법적 의무에 따른 보존 대상 (Retention):
 *    - 결제 이력 및 환불 기록: 한국 전자상거래법에 의거 5년 보존.
 *    - 본인 인증 성공 이력 (이름, 연령 정보, eKYC 매칭 성공 결과 코드): 부정이용 방지 및 규제 당국 제출용으로 탈퇴 후 6개월 보존.
 */
export type PersonalDataPolicyType = 'IMMEDIATE_DISPOSAL' | 'LEGAL_RETENTION';

export const DISPOSAL_RETENTION_POLICY = {
  immediateDisposal: [
    'chat_history',
    'voice_call_logs',
    'selfie_image_files',
    'original_verification_documents',
    'matching_scores',
    'marriage_values'
  ],
  legalRetention: [
    { category: 'billing_and_payment_records', retentionPeriodYears: 5, basis: 'Korean Electronic Commerce Act' },
    { category: 'verification_history_metadata', retentionPeriodMonths: 6, basis: 'Anti-fraud and regulatory submission requirements' }
  ]
};
