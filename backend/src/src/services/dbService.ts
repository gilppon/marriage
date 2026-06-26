import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { UserProfile } from '../types/matchTypes';

export interface UserStatus {
  isBanned: boolean;
  bannedUntil?: Date;
  banReason?: string;
  scamScore: number;
}

// 가상 인메모리 유저 프로필 맵 (Firebase 비활성화 시 Fallback)
const mockUserProfiles = new Map<string, UserProfile>();

/**
 * Firestore를 이용한 사용자 스캠 점수 및 차단(Ban) 상태 관리 서비스
 */
export const DbService = {
  /**
   * 사용자의 누적 스캠 스코어 증가 및 임계값 초과 시 즉각 Ban 처리
   * @param userId 유저 고유 ID
   * @param score 추가할 위험 점수
   * @returns 현재 유저의 상태 및 즉각 차단 여부
   */
  incrementScamScore: async (userId: string, score: number, reason: string): Promise<UserStatus> => {
    console.log(`🛡️ AI 가드 스캠 탐지: 유저 [${userId}]의 위험 점수 +${score} (사유: ${reason})`);
    
    const defaultStatus: UserStatus = { isBanned: false, scamScore: score };

    if (!db) {
      // Firebase가 로컬 가상 Mock 모드일 때의 Fallback 처리
      console.warn('⚠️ Firebase DB가 비활성화 상태입니다. 메모리 모드로 처리합니다.');
      return defaultStatus;
    }

    try {
      const userRef = db.collection('users').doc(userId);
      const doc = await userRef.get();
      
      let currentScore = score;
      let isBanned = false;
      let bannedUntil: Date | undefined;

      if (doc.exists) {
        const data = doc.data();
        currentScore = (data?.scamScore || 0) + score;
        isBanned = data?.isBanned || false;
      }

      // 스캠 점수 80점 이상일 경우 자동 임시 24시간 차단(Circuit Breaker 패턴)
      if (currentScore >= 80 && !isBanned) {
        isBanned = true;
        const banPeriod = 24 * 60 * 60 * 1000; // 24시간
        bannedUntil = new Date(Date.now() + banPeriod);
        
        await userRef.set({
          scamScore: currentScore,
          isBanned: true,
          bannedUntil,
          banReason: `AI 실시간 안전 감시 자동 차단: ${reason} (누적 스캠 스코어 ${currentScore}점 초과)`
        }, { merge: true });
        
        console.log(`🚨 [AUTO BAN] 유저 [${userId}]가 누적 점수 ${currentScore}점으로 인해 24시간 임시 차단되었습니다.`);
      } else {
        await userRef.set({
          scamScore: currentScore
        }, { merge: true });
      }

      return {
        isBanned,
        bannedUntil,
        banReason: isBanned ? `누적 위험 스코어 초과` : undefined,
        scamScore: currentScore
      };

    } catch (error) {
      console.error('❌ Firestore 사용자 점수 갱신 실패:', error);
      return defaultStatus;
    }
  },

  /**
   * 유저가 현재 차단(Ban)된 상태인지 Firestore 조회
   */
  checkUserStatus: async (userId: string): Promise<UserStatus> => {
    const defaultStatus: UserStatus = { isBanned: false, scamScore: 0 };
    
    if (!db) return defaultStatus;

    try {
      const doc = await db.collection('users').doc(userId).get();
      if (!doc.exists) return defaultStatus;

      const data = doc.data();
      const isBanned = data?.isBanned || false;
      const bannedUntilVal = data?.bannedUntil;
      
      let bannedUntil: Date | undefined;
      if (bannedUntilVal) {
        // Firestore Timestamp 처리
        bannedUntil = typeof bannedUntilVal.toDate === 'function' ? bannedUntilVal.toDate() : new Date(bannedUntilVal);
      }

      // 차단 기한 만료 검사
      if (isBanned && bannedUntil && bannedUntil.getTime() < Date.now()) {
        console.log(`🔓 유저 [${userId}]의 차단 기한이 만료되어 자동으로 차단 해제 처리합니다.`);
        await db.collection('users').doc(userId).set({
          isBanned: false,
          bannedUntil: null,
          banReason: null
        }, { merge: true });
        
        return { isBanned: false, scamScore: data?.scamScore || 0 };
      }

      return {
        isBanned,
        bannedUntil,
        banReason: data?.banReason,
        scamScore: data?.scamScore || 0
      };
    } catch (error) {
      console.error('❌ Firestore 사용자 상태 확인 실패:', error);
      return defaultStatus;
    }
  },

  /**
   * 사용자 상세 프로필을 유효성 검사 후 Firestore 또는 Mock DB에 저장합니다.
   */
  saveUserProfile: async (userId: string, profileData: any): Promise<UserProfile> => {
    const { userName, userRole, religion, lifestyle, bloodType, hobbies, languageSkill } = profileData;

    if (!userName || !userRole || !religion || !lifestyle) {
      throw new Error('MISSING_REQUIRED_FIELDS');
    }

    if (userRole !== 'korean' && userRole !== 'fan') {
      throw new Error('INVALID_USER_ROLE');
    }

    // 종교 값 체크
    const validReligions = ['NONE', 'CHRISTIAN', 'BUDDHIST', 'CATHOLIC', 'OTHER'];
    if (!validReligions.includes(religion)) {
      throw new Error('INVALID_RELIGION_VALUE');
    }

    // 라이프스타일 체크
    const { residenceType, drinking, smoking } = lifestyle || {};
    if (!residenceType || !drinking || !smoking) {
      throw new Error('MISSING_LIFESTYLE_FIELDS');
    }

    const validDrinking = ['YES', 'NO', 'SOMETIMES'];
    const validSmoking = ['YES', 'NO'];
    if (!validDrinking.includes(drinking) || !validSmoking.includes(smoking)) {
      throw new Error('INVALID_LIFESTYLE_VALUES');
    }

    // 혈액형 체크 (선택 사항)
    if (bloodType) {
      const validBloodTypes = ['A', 'B', 'O', 'AB'];
      if (!validBloodTypes.includes(bloodType)) {
        throw new Error('INVALID_BLOOD_TYPE');
      }
    }

    // 취미 체크 (선택 사항)
    if (hobbies) {
      if (!Array.isArray(hobbies) || hobbies.some(h => typeof h !== 'string')) {
        throw new Error('INVALID_HOBBIES_FORMAT');
      }
      if (hobbies.length > 10) {
        throw new Error('TOO_MANY_HOBBIES');
      }
    }

    // 상대방 언어 수준 체크 (선택 사항)
    if (languageSkill) {
      const validLangSkills = ['BASIC', 'INTERMEDIATE', 'FLUENT'];
      if (!validLangSkills.includes(languageSkill)) {
        throw new Error('INVALID_LANGUAGE_SKILL');
      }
    }

    const now = new Date();
    const updatedProfile: UserProfile = {
      userId,
      userName,
      userRole,
      religion,
      lifestyle,
      bloodType,
      hobbies,
      languageSkill,
      updatedAt: now
    };

    try {
      if (!db) throw new Error('NO_DB');
      
      const firestoreData: any = {
        ...updatedProfile,
        updatedAt: admin.firestore.Timestamp.fromDate(now)
      };
      await db.collection('user_profiles').doc(userId).set(firestoreData);
      return updatedProfile;
    } catch (error: any) {
      console.warn('⚠️ [GCP MOCK FALLBACK] DB 연결 불가로 메모리에 상세 프로필을 저장합니다. User:', userId);
      mockUserProfiles.set(userId, updatedProfile);
      return updatedProfile;
    }
  },

  /**
   * 사용자 상세 프로필을 로드합니다.
   */
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    try {
      if (!db) throw new Error('NO_DB');
      const snap = await db.collection('user_profiles').doc(userId).get();
      if (!snap.exists) return null;
      
      const data = snap.data();
      return {
        ...data,
        updatedAt: data?.updatedAt ? data.updatedAt.toDate() : undefined
      } as UserProfile;
    } catch (error) {
      const profile = mockUserProfiles.get(userId);
      return profile || null;
    }
  }
};
