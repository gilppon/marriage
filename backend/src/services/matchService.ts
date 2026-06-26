import { db } from '../config/firebase';
import { MarriageValues, MatchResult } from '../types/matchTypes';
import { generateMatchAdvice } from './geminiService';
import { PrivacyService } from './privacyService';
import { VerificationService } from './verificationService';

const mockMarriageValues = new Map<string, MarriageValues>();

// 가상 유저 가치관 더미 데이터 (추천 목록용)
const mockUsersForRecommendation = [
  {
    id: 'user_rec_01',
    nickname: '도쿄새댁',
    country: 'JP',
    region: 'Tokyo',
    age: 28,
    job: 'UI Designer',
    company: 'Sony',
    industry: 'Electronics',
    languageSkill: 'FLUENT' as const,
    marriageValues: {
      childPlan: 'WANT_CHILDREN' as const,
      residenceWill: 'FLEXIBLE' as const,
      religion: 'NONE' as const,
      dualIncome: 'YES' as const,
      marriageTiming: 'WITHIN_1_YEAR' as const,
      languageSkill: 'FLUENT' as const
    }
  },
  {
    id: 'user_rec_02',
    nickname: '오사카김군',
    country: 'JP',
    region: 'Osaka',
    age: 32,
    job: 'Sales Representative',
    company: 'Keyence',
    industry: 'Manufacturing',
    languageSkill: 'INTERMEDIATE' as const,
    marriageValues: {
      childPlan: 'DISCUSS' as const,
      residenceWill: 'STAY_IN_JP' as const,
      religion: 'CHRISTIAN' as const,
      dualIncome: 'FLEXIBLE' as const,
      marriageTiming: 'WITHIN_2_YEARS' as const,
      languageSkill: 'INTERMEDIATE' as const
    }
  },
  {
    id: 'user_rec_03',
    nickname: '서울의 봄',
    country: 'KR',
    region: 'Seoul',
    age: 41,
    job: 'Software Engineer',
    company: 'Samsung Electronics',
    industry: 'IT/Electronics',
    languageSkill: 'BASIC' as const,
    marriageValues: {
      childPlan: 'NO_CHILDREN' as const,
      residenceWill: 'STAY_IN_KR' as const,
      religion: 'NONE' as const,
      dualIncome: 'NO' as const,
      marriageTiming: 'DEPENDS' as const,
      languageSkill: 'BASIC' as const
    }
  }
];

export const MatchService = {
  /**
   * 두 사용자의 결혼 가치관을 비교해 100점 만점의 가중치 기반 매칭 점수(Compatibility Score)를 계산합니다.
   * 80점 미만 시 Gemini AI를 구동해 가치관 조정 조언을 실시간 생성합니다.
   */
  calculateMatchScore: async (u1: MarriageValues, u2: MarriageValues): Promise<MatchResult> => {
    let childPlanScore = 0;
    let residenceScore = 0;
    let religionScore = 0;
    let economicScore = 0;
    let languageScore = 0;

    // 1. 거주지/이주 의지 (25% 가중치 - 25점 만점)
    let residenceMatch = false;
    if (u1.residenceWill === u2.residenceWill || u1.residenceWill === 'FLEXIBLE' || u2.residenceWill === 'FLEXIBLE') {
      residenceScore = 25;
      residenceMatch = true;
    } else {
      residenceScore = 0;
      residenceMatch = false;
    }

    // 2. 언어 소통 능력 (25% 가중치 - 25점 만점)
    let languageMatch = false;
    const l1 = u1.languageSkill || 'BASIC';
    const l2 = u2.languageSkill || 'BASIC';
    if (l1 === 'FLUENT' || l2 === 'FLUENT') {
      languageScore = 25;
      languageMatch = true;
    } else if (l1 === 'INTERMEDIATE' && l2 === 'INTERMEDIATE') {
      languageScore = 25;
      languageMatch = true;
    } else if (
      (l1 === 'INTERMEDIATE' && l2 === 'BASIC') || 
      (l1 === 'BASIC' && l2 === 'INTERMEDIATE')
    ) {
      languageScore = 15;
      languageMatch = true;
    } else {
      languageScore = 5;
      languageMatch = false;
    }

    // 3. 자녀 계획 (20% 가중치 - 20점 만점)
    let childMatch = false;
    if (u1.childPlan === u2.childPlan) {
      childPlanScore = 20;
      childMatch = true;
    } else if (u1.childPlan === 'DISCUSS' || u2.childPlan === 'DISCUSS') {
      childPlanScore = 15;
      childMatch = true;
    } else {
      childPlanScore = 0;
      childMatch = false;
    }

    // 4. 종교관 (15% 가중치 - 15점 만점)
    let religionMatch = false;
    if (u1.religion === u2.religion || u1.religion === 'NONE' || u2.religion === 'NONE') {
      religionScore = 15;
      religionMatch = true;
    } else {
      religionScore = 5;
      religionMatch = false;
    }

    // 5. 경제관/맞벌이 (15% 가중치 - 15점 만점)
    let dualIncomeMatch = false;
    if (u1.dualIncome === u2.dualIncome || u1.dualIncome === 'FLEXIBLE' || u2.dualIncome === 'FLEXIBLE') {
      economicScore = 15;
      dualIncomeMatch = true;
    } else {
      economicScore = 5;
      dualIncomeMatch = false;
    }

    const score = childPlanScore + residenceScore + religionScore + economicScore + languageScore;
    const isBestMatch = score >= 80;

    const compDetails = {
      childPlanScore,
      residenceScore,
      religionScore,
      economicScore,
      languageScore
    };

    let aiAdvice: string | undefined = undefined;
    if (score < 80) {
      aiAdvice = await generateMatchAdvice(u1, u2, score, compDetails);
    }

    return {
      score,
      isBestMatch,
      matchDetails: {
        residenceMatch,
        childMatch,
        dualIncomeMatch,
        religionMatch,
        languageMatch
      },
      compatibility: {
        ...compDetails,
        aiAdvice
      }
    };
  },

  /**
   * 사용자의 가치관 설정을 저장합니다.
   */
  saveMarriageValues: async (userId: string, values: MarriageValues): Promise<MarriageValues> => {
    try {
      if (!db) throw new Error('NO_DB');
      await db.collection('users').doc(userId).set({
        marriageValues: values
      }, { merge: true });
      return values;
    } catch (error: any) {
      console.warn(`⚠️ [GCP MOCK FALLBACK] DB 연결 불가로 메모리에 가치관을 저장합니다. User: ${userId}`);
      mockMarriageValues.set(userId, values);
      return values;
    }
  },

  /**
   * 사용자의 가치관을 조회합니다.
   */
  getMarriageValues: async (userId: string): Promise<MarriageValues | null> => {
    try {
      if (!db) throw new Error('NO_DB');
      const snap = await db.collection('users').doc(userId).get();
      if (snap.exists && snap.data()?.marriageValues) {
        return snap.data()?.marriageValues as MarriageValues;
      }
      return null;
    } catch (error: any) {
      return mockMarriageValues.get(userId) || null;
    }
  },

  /**
   * 특정 유저에게 가치관 적합도가 높은 순서대로 추천 회원 목록을 반환합니다. (비동기 병렬 루프)
   */
  getRecommendedMatches: async (userId: string, filterOptions?: any): Promise<any[]> => {
    let myValues = await MatchService.getMarriageValues(userId);
    if (!myValues) {
      myValues = {
        childPlan: 'WANT_CHILDREN',
        residenceWill: 'FLEXIBLE',
        religion: 'NONE',
        dualIncome: 'YES',
        marriageTiming: 'WITHIN_2_YEARS'
      };
    }

    const filterAge = filterOptions?.filterAge || 'all';
    const filterLocFlex = filterOptions?.filterLocFlex || 'any';
    const filterLanguage = filterOptions?.filterLanguage || 'any';
    const filterVerifiedOnly = filterOptions?.filterVerifiedOnly === true;

    let candidates: any[] = [];

    try {
      if (!db) throw new Error('NO_DB');
      const snap = await db.collection('users').get();
      snap.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== userId && data.marriageValues) {
          candidates.push({
            id: doc.id,
            nickname: data.nickname || '익명회원',
            age: data.age,
            country: data.country,
            region: data.region,
            job: data.job,
            company: data.company,
            industry: data.industry,
            languageSkill: data.languageSkill || data.marriageValues.languageSkill,
            marriageValues: data.marriageValues
          });
        }
      });
    } catch (error: any) {
      candidates = [...mockUsersForRecommendation];
    }

    // Fetch viewer user profile data to check exclusion list criteria on B's side
    let viewerUser: any = null;
    try {
      if (!db) throw new Error('NO_DB');
      const viewerSnap = await db.collection('users').doc(userId).get();
      viewerUser = viewerSnap.exists ? viewerSnap.data() : {};
    } catch (e) {
      // In mock/test mode, look for viewer inside mockRecommendation or default
      const mockViewer = mockUsersForRecommendation.find(u => u.id === userId);
      viewerUser = mockViewer || { id: userId, country: 'KR', region: 'Seoul', job: 'Software Engineer', company: 'Samsung Electronics', industry: 'IT/Electronics' };
    }

    const mySettings = await PrivacyService.getPrivacySettings(userId);

    // Filter candidates bidirectionally using isUserExcluded
    const filteredCandidates: any[] = [];
    for (const c of candidates) {
      // 1. Check if viewer A excludes candidate B
      const isExcludedByMe = PrivacyService.isUserExcluded(c, mySettings);
      
      // 2. Check if candidate B excludes viewer A
      const candidateSettings = await PrivacyService.getPrivacySettings(c.id);
      const isExcludedByCandidate = PrivacyService.isUserExcluded(viewerUser, candidateSettings);

      if (isExcludedByMe || isExcludedByCandidate) {
        continue;
      }

      // [Hard Filter 1] 나이대 조건 검증
      if (c.age !== undefined) {
        if (filterAge === '20s' && (c.age < 20 || c.age >= 30)) continue;
        if (filterAge === '30s' && (c.age < 30 || c.age >= 40)) continue;
        if (filterAge === '40s' && (c.age < 40 || c.age >= 50)) continue;
      }

      // [Hard Filter 2] 거주지 이동 유연성 조건 검증
      if (filterLocFlex === 'japan') {
        const isLocMatch = c.country === 'JP' || c.marriageValues?.residenceWill === 'STAY_IN_JP' || c.marriageValues?.residenceWill === 'FLEXIBLE';
        if (!isLocMatch) continue;
      } else if (filterLocFlex === 'korea') {
        const isLocMatch = c.country === 'KR' || c.marriageValues?.residenceWill === 'STAY_IN_KR' || c.marriageValues?.residenceWill === 'FLEXIBLE';
        if (!isLocMatch) continue;
      }

      // [Hard Filter 3] 상대방 언어 수준 조건 검증
      const cLang = c.languageSkill || c.marriageValues?.languageSkill || 'BASIC';
      if (filterLanguage === 'FLUENT' && cLang !== 'FLUENT') continue;
      if (filterLanguage === 'INTERMEDIATE' && cLang !== 'FLUENT' && cLang !== 'INTERMEDIATE') continue;
      if (filterLanguage === 'BASIC' && cLang !== 'FLUENT' && cLang !== 'INTERMEDIATE' && cLang !== 'BASIC') continue;

      // [Hard Filter 4] 신원 인증 완료 조건 검증 (Premium 전용 필터)
      if (filterVerifiedOnly) {
        let hasBadge = false;
        try {
          if (c.id.startsWith('user_rec_')) {
            hasBadge = true; // 가상 유저는 무조건 인증된 회원으로 처리
          } else {
            const badges = await VerificationService.getActiveBadges(c.id);
            hasBadge = Object.values(badges).some(b => b === true);
          }
        } catch (e) {
          hasBadge = c.id.startsWith('user_rec_');
        }
        if (!hasBadge) continue;
      }

      filteredCandidates.push(c);
    }

    const results = await Promise.all(filteredCandidates.map(async (c) => {
      const matchResult = await MatchService.calculateMatchScore(myValues!, c.marriageValues);
      const maskedMatchResult = await PrivacyService.getMaskedMatchResult(matchResult, userId, c.id);
      return {
        userId: c.id,
        nickname: c.nickname,
        age: c.age,
        country: c.country,
        matchResult: maskedMatchResult
      };
    }));

    return results.sort((a, b) => b.matchResult.score - a.matchResult.score);
  }
};
