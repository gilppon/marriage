export interface MarriageValues {
  childPlan: 'WANT_CHILDREN' | 'NO_CHILDREN' | 'DISCUSS';
  residenceWill: 'STAY_IN_KR' | 'STAY_IN_JP' | 'FLEXIBLE';
  religion: 'NONE' | 'CHRISTIAN' | 'BUDDHIST' | 'CATHOLIC' | 'OTHER';
  dualIncome: 'YES' | 'NO' | 'FLEXIBLE';
  marriageTiming: 'WITHIN_1_YEAR' | 'WITHIN_2_YEARS' | 'DEPENDS';
  languageSkill?: 'BASIC' | 'INTERMEDIATE' | 'FLUENT';
}

export interface MarriageCompatibilityScore {
  childPlanScore: number;  // 30점 만점 -> 20점
  residenceScore: number;  // 30점 만점 -> 25점
  religionScore: number;   // 20점 만점 -> 15점
  economicScore: number;   // 20점 만점 -> 15점
  languageScore: number;   // 25점 만점 (신설)
  aiAdvice?: string;       // 80점 미만 시 제공되는 Gemini 맞춤 조언
}

export interface MatchResult {
  score: number; // 0 ~ 100
  isBestMatch: boolean; // 80점 이상일 시 true
  matchDetails: {
    residenceMatch: boolean;
    childMatch: boolean;
    dualIncomeMatch: boolean;
    religionMatch: boolean;
    languageMatch: boolean;
  };
  compatibility?: MarriageCompatibilityScore; // 고도화된 매칭 스코어 상세
}

export interface Lifestyle {
  residenceType: string; // 거주 형태 (예: 자취, 본가, 기숙사 등)
  drinking: 'YES' | 'NO' | 'SOMETIMES'; // 음주 여부
  smoking: 'YES' | 'NO'; // 흡연 여부
}

export interface UserProfile {
  userId: string;
  userName: string;
  userRole: 'korean' | 'fan';
  religion: 'NONE' | 'CHRISTIAN' | 'BUDDHIST' | 'CATHOLIC' | 'OTHER'; // 종교 (필수)
  lifestyle: Lifestyle; // 라이프스타일 (필수)
  bloodType?: 'A' | 'B' | 'O' | 'AB'; // 혈액형 (선택)
  hobbies?: string[]; // 취미 (선택)
  languageSkill?: 'BASIC' | 'INTERMEDIATE' | 'FLUENT'; // 신설
  updatedAt?: Date;
}


