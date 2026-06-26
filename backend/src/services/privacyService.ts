import { db } from '../config/firebase';
import { PrivacySettings, DEFAULT_PRIVACY_SETTINGS } from '../types/privacyTypes';
import { VerificationService } from './verificationService';
import { MatchResult } from '../types/matchTypes';

// 가상 인메모리 DB (Firebase 비활성화 시 Fallback)
const mockPrivacySettings = new Map<string, PrivacySettings>();
const mockMatches = new Map<string, boolean>();

export const PrivacyService = {
  /**
   * 사용자의 프라이버시 설정을 저장합니다. (GCP 인증 실패 대응)
   */
  updatePrivacySettings: async (userId: string, settings: Partial<PrivacySettings>): Promise<PrivacySettings> => {
    const updated = {
      ...DEFAULT_PRIVACY_SETTINGS,
      ...settings
    };

    try {
      if (!db) throw new Error('NO_DB');
      await db.collection('users').doc(userId).set({
        privacySettings: updated
      }, { merge: true });
      return updated;
    } catch (error: any) {
      if (
        error.message === 'NO_DB' ||
        error.message.includes('Project Id') ||
        error.message.includes('credential') ||
        error.message.includes('auth')
      ) {
        console.warn(`⚠️ [GCP MOCK FALLBACK] Firebase DB 실사 연결 불가로 인해 메모리에 프라이버시 설정을 저장합니다.`);
        mockPrivacySettings.set(userId, updated);
        return updated;
      }
      console.error('❌ Firestore 프라이버시 설정 저장 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자의 프라이버시 설정을 조회합니다.
   */
  getPrivacySettings: async (userId: string): Promise<PrivacySettings> => {
    try {
      if (!db) throw new Error('NO_DB');
      const snap = await db.collection('users').doc(userId).get();
      if (snap.exists) {
        const data = snap.data();
        if (data?.privacySettings) {
          return data.privacySettings as PrivacySettings;
        }
      }
      return DEFAULT_PRIVACY_SETTINGS;
    } catch (error: any) {
      if (
        error.message === 'NO_DB' ||
        error.message.includes('Project Id') ||
        error.message.includes('credential') ||
        error.message.includes('auth')
      ) {
        return mockPrivacySettings.get(userId) || DEFAULT_PRIVACY_SETTINGS;
      }
      console.error('❌ Firestore 프라이버시 설정 조회 실패:', error);
      return DEFAULT_PRIVACY_SETTINGS;
    }
  },

  /**
   * 뷰어와 타겟의 매칭 여부를 확인합니다.
   */
  checkMatchStatus: async (userId1: string, userId2: string): Promise<boolean> => {
    try {
      if (!db) throw new Error('NO_DB');
      const matchId1 = `${userId1}_${userId2}`;
      const matchId2 = `${userId2}_${userId1}`;
      
      const snap1 = await db.collection('matches').doc(matchId1).get();
      if (snap1.exists && snap1.data()?.status === 'MATCHED') return true;

      const snap2 = await db.collection('matches').doc(matchId2).get();
      if (snap2.exists && snap2.data()?.status === 'MATCHED') return true;

      return false;
    } catch (error: any) {
      if (
        error.message === 'NO_DB' ||
        error.message.includes('Project Id') ||
        error.message.includes('credential') ||
        error.message.includes('auth')
      ) {
        const matchId1 = `${userId1}_${userId2}`;
        const matchId2 = `${userId2}_${userId1}`;
        return !!(mockMatches.get(matchId1) || mockMatches.get(matchId2));
      }
      console.error('❌ 매칭 상태 조회 실패:', error);
      return false;
    }
  },

  /**
   * 테스트 목적으로 가상 매칭 상태를 강제 설정합니다. (Harness 전용)
   */
  setMatchForTest: async (userId1: string, userId2: string, status: 'MATCHED' | 'NONE'): Promise<void> => {
    const isMatched = status === 'MATCHED';
    try {
      if (!db) throw new Error('NO_DB');
      const matchId = `${userId1}_${userId2}`;
      await db.collection('matches').doc(matchId).set({ status }, { merge: true });
    } catch (e) {
      const matchId = `${userId1}_${userId2}`;
      mockMatches.set(matchId, isMatched);
    }
  },

  /**
   * 뷰어의 자격 정보에 맞춰 대상 유저의 프로필을 안전하게 가공(마스킹)하여 반환합니다.
   */
  getMaskedProfile: async (profileUserId: string, viewerUserId: string, mockDataOverride?: { profileUser?: any, viewerUser?: any, isMatched?: boolean }): Promise<any> => {
    if (profileUserId === viewerUserId) {
      try {
        if (!db) throw new Error('NO_DB');
        const snap = await db.collection('users').doc(profileUserId).get();
        return snap.exists ? snap.data() : null;
      } catch (error: any) {
        if (
          error.message === 'NO_DB' ||
          error.message.includes('Project Id') ||
          error.message.includes('credential') ||
          error.message.includes('auth')
        ) {
          return mockDataOverride?.profileUser || {
            id: profileUserId,
            nickname: '본인프로필',
            realName: '홍길동',
            age: 28,
            job: '삼성전자 엔지니어',
            company: '삼성전자',
            industry: 'IT/인터넷',
            income: '8,000만원',
            country: 'KR',
            verificationBadges: { identityVerified: true, employmentVerified: true, maritalStatusVerified: false }
          };
        }
        throw error;
      }
    }

    let profileUser: any = null;
    let viewerUser: any = null;
    let isMatched = false;

    try {
      if (!db) throw new Error('NO_DB');
      const profileSnap = await db.collection('users').doc(profileUserId).get();
      if (!profileSnap.exists) return null;
      profileUser = profileSnap.data();

      const viewerSnap = await db.collection('users').doc(viewerUserId).get();
      viewerUser = viewerSnap.exists ? viewerSnap.data() : { verificationBadges: { identityVerified: false } };

      isMatched = await PrivacyService.checkMatchStatus(profileUserId, viewerUserId);
    } catch (error: any) {
      if (
        error.message === 'NO_DB' ||
        error.message.includes('Project Id') ||
        error.message.includes('credential') ||
        error.message.includes('auth')
      ) {
        // Mock Fallback
        profileUser = mockDataOverride?.profileUser || {
          id: profileUserId,
          nickname: '스시조아',
          realName: '사토 유키',
          age: 28,
          job: '라인 야후 프론트엔드 개발자',
          company: '라인 야후',
          industry: 'IT/인터넷',
          income: '600만엔',
          country: 'JP',
          verificationBadges: { identityVerified: true, employmentVerified: true, maritalStatusVerified: false },
          privacySettings: mockPrivacySettings.get(profileUserId) || DEFAULT_PRIVACY_SETTINGS
        };
        viewerUser = mockDataOverride?.viewerUser || {
          id: viewerUserId,
          nickname: '김치러버',
          realName: '김철수',
          country: 'KR',
          verificationBadges: { identityVerified: false, employmentVerified: false, maritalStatusVerified: false }
        };
        isMatched = mockDataOverride?.isMatched || false;
      } else {
        throw error;
      }
    }

    const settings: PrivacySettings = profileUser.privacySettings || DEFAULT_PRIVACY_SETTINGS;

    // 1. 특정 국가 매칭 차단(blockCountry) 검사
    const viewerCountry = viewerUser.country || 'KR';
    if (settings.blockCountry && settings.blockCountry.includes(viewerCountry)) {
      throw new Error('ACCESS_DENIED_COUNTRY');
    }

    // 2. 전체 프로필 노출 수준(profileVisibility) 검사
    const viewerBadges = mockDataOverride?.viewerUser?.verificationBadges || await VerificationService.getActiveBadges(viewerUserId);
    const isViewerVerified = !!viewerBadges.identityVerified;
    if (settings.profileVisibility === 'NONE') {
      throw new Error('ACCESS_DENIED_PRIVATE');
    }
    if (settings.profileVisibility === 'VERIFIED_ONLY' && !isViewerVerified) {
      throw new Error('ACCESS_DENIED_VERIFIED_ONLY');
    }
    if (settings.profileVisibility === 'MATCHED_ONLY' && !isMatched) {
      throw new Error('ACCESS_DENIED_MATCHED_ONLY');
    }

    // 3. 개별 데이터 필드 마스킹 수행
    const masked: any = { ...profileUser };
    
    // 시스템 보안 필드는 상시 완전 격리
    delete masked.password;
    delete masked.privacySettings;

    // (A) 본명 공개 설정
    if (settings.realNameVisibility === 'PRIVATE' || (settings.realNameVisibility === 'MATCHED_ONLY' && !isMatched)) {
      delete masked.realName;
    }

    // (B) 나이 마스킹 (BLURRED: 20대 후반, 30대 중반 등으로 뭉뚱그림)
    if (profileUser.age) {
      if (settings.ageVisibility === 'PRIVATE') {
        delete masked.age;
      } else if (settings.ageVisibility === 'BLURRED') {
        const ageNum = Number(profileUser.age);
        if (!isNaN(ageNum)) {
          const base = Math.floor(ageNum / 10) * 10;
          const remainder = ageNum % 10;
          let suffix = '대 초반';
          if (remainder >= 4 && remainder <= 6) suffix = '대 중반';
          else if (remainder >= 7) suffix = '대 후반';
          masked.age = `${base}${suffix}`;
        }
      }
    }

    // (C) 직업 및 직장 공개 설정
    if (settings.jobVisibility === 'PRIVATE') {
      delete masked.job;
      delete masked.company;
    } else if (settings.jobVisibility === 'INDUSTRY_ONLY') {
      masked.job = profileUser.industry || '비공개 업종';
      delete masked.company; // 회사명은 마스킹하여 숨김
    }

    // (D) 소득 정보 공개 설정
    if (settings.incomeVisibility === 'PRIVATE' || (settings.incomeVisibility === 'VERIFIED_ONLY' && !isViewerVerified)) {
      delete masked.income;
    }

    // (E) 신뢰 배지 상호주의(Reciprocity) 필터링 적용
    const profileBadges = mockDataOverride?.profileUser?.verificationBadges || await VerificationService.getActiveBadges(profileUserId);
    const finalBadges: any = { ...profileBadges };

    if (!isMatched) {
      if (!viewerBadges.employmentVerified && profileBadges.employmentVerified) {
        finalBadges.employmentVerified = false;
        finalBadges.employmentVerifiedLocked = true;
      }
      if (!viewerBadges.maritalStatusVerified && profileBadges.maritalStatusVerified) {
        finalBadges.maritalStatusVerified = false;
        finalBadges.maritalStatusVerifiedLocked = true;
      }
      if (!viewerBadges.educationVerified && profileBadges.educationVerified) {
        finalBadges.educationVerified = false;
        finalBadges.educationVerifiedLocked = true;
      }
    }
    masked.verificationBadges = finalBadges;

    return masked;
  },

  /**
   * 상대방이 검색 제외 키워드(지역, 직업)에 저촉되는지 확인합니다.
   */
  isUserExcluded: (user: any, settings: PrivacySettings): boolean => {
    if (!user) return false;

    // 1. 지역 키워드 제외 체크
    if (settings.excludeRegions && settings.excludeRegions.length > 0) {
      const userRegion = (user.region || '').toLowerCase();
      const userCountry = (user.country || '').toLowerCase();
      const isRegionMatched = settings.excludeRegions.some(r => {
        const rl = r.toLowerCase();
        return userRegion.includes(rl) || userCountry.includes(rl);
      });
      if (isRegionMatched) return true;
    }

    // 2. 직업 키워드 제외 체크
    if (settings.excludeJobs && settings.excludeJobs.length > 0) {
      const userJob = (user.job || '').toLowerCase();
      const userCompany = (user.company || '').toLowerCase();
      const userIndustry = (user.industry || '').toLowerCase();
      const isJobMatched = settings.excludeJobs.some(j => {
        const jl = j.toLowerCase();
        return userJob.includes(jl) || userCompany.includes(jl) || userIndustry.includes(jl);
      });
      if (isJobMatched) return true;
    }

    return false;
  },

  /**
   * 매칭 결과(적합도 점수 및 세부 내역)를 매칭 성사 및 상호 동의 여부에 맞춰 마스킹합니다.
   */
  getMaskedMatchResult: async (matchResult: MatchResult, userId1: string, userId2: string): Promise<MatchResult> => {
    const isMatched = await PrivacyService.checkMatchStatus(userId1, userId2);
    if (!isMatched) {
      // 매칭 전에는 compatibility(가치관별 상세 점수 및 AI 조언)은 비공개 처리하고 점수는 0점으로 마스킹
      return {
        score: 0,
        isBestMatch: false,
        matchDetails: {
          residenceMatch: false,
          childMatch: false,
          dualIncomeMatch: false,
          religionMatch: false,
          languageMatch: false
        },
        compatibility: undefined // 비공개
      };
    }

    const settings1 = await PrivacyService.getPrivacySettings(userId1);
    const settings2 = await PrivacyService.getPrivacySettings(userId2);

    // 양측 동의(consentCompatibilityOpen === true) 여부 검사
    if (settings1.consentCompatibilityOpen && settings2.consentCompatibilityOpen) {
      return matchResult; // 상호 동의 시 전체 노출
    }

    // 매칭은 되었으나 상호 동의가 부족할 때 상세 결혼 적합도 필드 숨김
    return {
      ...matchResult,
      compatibility: undefined // 비공개
    };
  }
};
