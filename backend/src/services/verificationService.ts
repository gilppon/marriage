import { db, storage } from '../config/firebase';
import * as admin from 'firebase-admin';
import { SecureDocument, DocumentType, VerificationStatus, VerificationBadgeInfo } from '../types/verificationTypes';
import { encrypt } from '../utils/crypto';
import { EkycService } from './ekycService';

// 가상 인메모리 DB (Firebase 비활성화 시 Fallback)
const mockSecureDocuments = new Map<string, SecureDocument>();
const mockBadges = new Map<string, VerificationBadgeInfo>();

export const VerificationService = {
  /**
   * 인증 서류 유형별 만료일자 계산 함수 (본인: 5년, 직업: 1년, 혼인: 3개월, 학력: 영구)
   */
  calculateExpirationDate: (documentType: DocumentType, approvedAt: Date): Date | undefined => {
    const expired = new Date(approvedAt);
    if (documentType === 'IDENTITY') {
      expired.setFullYear(expired.getFullYear() + 5);
      return expired;
    }
    if (documentType === 'EMPLOYMENT') {
      expired.setFullYear(expired.getFullYear() + 1);
      return expired;
    }
    if (documentType === 'MARITAL_STATUS') {
      expired.setMonth(expired.getMonth() + 3);
      return expired;
    }
    if (documentType === 'EDUCATION') {
      return undefined; // 학력인증은 평생 유효 (만료 없음)
    }
    return undefined;
  },

  /**
   * 사용자가 인증 서류를 제출합니다. (GCP 인증 에러 대비 Mock Fallback 내장)
   */
  submitDocument: async (
    userId: string,
    documentType: DocumentType,
    fileStoragePath: string,
    extractedData?: SecureDocument['extractedData'] & { idNumber?: string },
    selfiePath?: string
  ): Promise<SecureDocument> => {
    const docId = `${userId}_${documentType}`;
    const now = new Date();

    // 1. 민감 개인정보(여권/주민번호) AES-256 양방향 암호화 처리 (보안 규제)
    const processedData = extractedData ? { ...extractedData } : {};
    if (processedData.idNumber) {
      processedData.idNumber = encrypt(processedData.idNumber);
    }

    let finalStatus: VerificationStatus = 'SUBMITTED';
    let reviewedAt: Date | undefined = undefined;
    let reviewedBy: string | undefined = undefined;

    // 2. IDENTITY 서류일 경우 실시간 AI eKYC(안면대조) 엔진 작동
    if (documentType === 'IDENTITY' && selfiePath) {
      const similarity = await EkycService.compareFaces(fileStoragePath, selfiePath);
      processedData.ekycSimilarity = similarity;
      
      if (similarity >= 90) {
        finalStatus = 'APPROVED';
        reviewedAt = now;
        reviewedBy = 'ai_ekyc';
      }
    }

    const docData: SecureDocument = {
      id: docId,
      userId,
      documentType,
      fileStoragePath,
      status: finalStatus,
      submittedAt: now,
      extractedData: processedData as any
    };
    if (reviewedAt) docData.reviewedAt = reviewedAt;
    if (reviewedBy) docData.reviewedBy = reviewedBy;

    try {
      if (!db) throw new Error('NO_DB');
      
      // 서류 컬렉션 저장 (Firestore는 undefined 값이 있으면 에러를 뱉으므로 conditional assign)
      const firestoreData: any = {
        id: docId,
        userId,
        documentType,
        fileStoragePath,
        status: finalStatus,
        submittedAt: admin.firestore.Timestamp.fromDate(now),
        extractedData: processedData
      };
      if (reviewedAt) firestoreData.reviewedAt = admin.firestore.Timestamp.fromDate(reviewedAt);
      if (reviewedBy) firestoreData.reviewedBy = reviewedBy;

      await db.collection('secure_documents').doc(docId).set(firestoreData);

      // 만약 AI eKYC로 자동 승인된 경우 유저 테이블의 인증 배지도 동시 갱신
      if (finalStatus === 'APPROVED') {
        const userRef = db.collection('users').doc(userId);
        const updateFields: any = {};
        const expiredAt = VerificationService.calculateExpirationDate(documentType, now);
        
        if (documentType === 'IDENTITY') {
          updateFields['verificationBadges.identityVerified'] = true;
          if (expiredAt) updateFields['verificationBadges.identityExpiredAt'] = admin.firestore.Timestamp.fromDate(expiredAt);
        }
        if (documentType === 'EMPLOYMENT') {
          updateFields['verificationBadges.employmentVerified'] = true;
          if (expiredAt) updateFields['verificationBadges.employmentExpiredAt'] = admin.firestore.Timestamp.fromDate(expiredAt);
        }
        if (documentType === 'MARITAL_STATUS') {
          updateFields['verificationBadges.maritalStatusVerified'] = true;
          if (expiredAt) updateFields['verificationBadges.maritalStatusExpiredAt'] = admin.firestore.Timestamp.fromDate(expiredAt);
        }
        if (documentType === 'EDUCATION') {
          updateFields['verificationBadges.educationVerified'] = true;
          if (expiredAt) updateFields['verificationBadges.educationExpiredAt'] = admin.firestore.Timestamp.fromDate(expiredAt);
        }
        updateFields['verificationBadges.verifiedAt'] = admin.firestore.Timestamp.fromDate(now);
        await userRef.set(updateFields, { merge: true });
      }

      return docData;
    } catch (error: any) {
      if (
        error.message === 'NO_DB' ||
        error.message.includes('Project Id') ||
        error.message.includes('credential') ||
        error.message.includes('auth')
      ) {
        console.warn(`⚠️ [GCP MOCK FALLBACK] Firebase DB 실사 연결 불가로 인해 메모리 모드로 백업 작동합니다.`);
        mockSecureDocuments.set(docId, docData);

        // 메모리 배지 업데이트 (eKYC 자동 승인 시)
        if (finalStatus === 'APPROVED') {
          let badges = mockBadges.get(userId) || { 
            identityVerified: false, 
            employmentVerified: false, 
            maritalStatusVerified: false,
            educationVerified: false
          };
          const expiredAt = VerificationService.calculateExpirationDate(documentType, now);
          
          if (documentType === 'IDENTITY') {
            badges.identityVerified = true;
            badges.identityExpiredAt = expiredAt;
          }
          if (documentType === 'EMPLOYMENT') {
            badges.employmentVerified = true;
            badges.employmentExpiredAt = expiredAt;
          }
          if (documentType === 'MARITAL_STATUS') {
            badges.maritalStatusVerified = true;
            badges.maritalStatusExpiredAt = expiredAt;
          }
          if (documentType === 'EDUCATION') {
            badges.educationVerified = true;
            badges.educationExpiredAt = expiredAt;
          }
          badges.verifiedAt = now;
          mockBadges.set(userId, badges);
        }

        return docData;
      }
      console.error('❌ Firestore 서류 제출 실패:', error);
      throw error;
    }
  },
  
  /**
   * 관리자가 서류를 심사하여 승인 또는 반려합니다. (State Machine 상태 전이)
   */
  reviewDocument: async (
    userId: string,
    documentType: DocumentType,
    status: 'APPROVED' | 'REJECTED',
    rejectReason?: string,
    adminId?: string
  ): Promise<SecureDocument> => {
    const docId = `${userId}_${documentType}`;
    const now = new Date();

    if (status === 'REJECTED' && !rejectReason) {
      throw new Error('반려 시에는 반드시 반려 사유를 입력해야 합니다.');
    }

    try {
      if (!db) throw new Error('NO_DB');
      const docRef = db.collection('secure_documents').doc(docId);
      const snap = await docRef.get();
      if (!snap.exists) {
        throw new Error('해당 서류를 찾을 수 없습니다.');
      }

      await docRef.update({
        status,
        reviewedAt: admin.firestore.Timestamp.fromDate(now),
        reviewedBy: adminId || 'admin',
        rejectReason: rejectReason || null
      });

      // 사용자 정보 테이블의 인증 배지 동기화
      const userRef = db.collection('users').doc(userId);
      const isApproved = status === 'APPROVED';

      const updateFields: any = {};
      const expiredAt = isApproved ? VerificationService.calculateExpirationDate(documentType, now) : null;

      if (documentType === 'IDENTITY') {
        updateFields['verificationBadges.identityVerified'] = isApproved;
        updateFields['verificationBadges.identityExpiredAt'] = expiredAt ? admin.firestore.Timestamp.fromDate(expiredAt) : null;
      }
      if (documentType === 'EMPLOYMENT') {
        updateFields['verificationBadges.employmentVerified'] = isApproved;
        updateFields['verificationBadges.employmentExpiredAt'] = expiredAt ? admin.firestore.Timestamp.fromDate(expiredAt) : null;
      }
      if (documentType === 'MARITAL_STATUS') {
        updateFields['verificationBadges.maritalStatusVerified'] = isApproved;
        updateFields['verificationBadges.maritalStatusExpiredAt'] = expiredAt ? admin.firestore.Timestamp.fromDate(expiredAt) : null;
      }
      if (documentType === 'EDUCATION') {
        updateFields['verificationBadges.educationVerified'] = isApproved;
        updateFields['verificationBadges.educationExpiredAt'] = expiredAt ? admin.firestore.Timestamp.fromDate(expiredAt) : null;
      }
      updateFields['verificationBadges.verifiedAt'] = admin.firestore.Timestamp.fromDate(now);

      await userRef.set(updateFields, { merge: true });

      const updatedSnap = await docRef.get();
      const rawData = updatedSnap.data();
      
      return {
        ...rawData,
        id: docId,
        submittedAt: rawData?.submittedAt ? rawData.submittedAt.toDate() : now,
        reviewedAt: rawData?.reviewedAt ? rawData.reviewedAt.toDate() : now,
      } as SecureDocument;
    } catch (error: any) {
      if (
        error.message === 'NO_DB' ||
        error.message.includes('Project Id') ||
        error.message.includes('credential') ||
        error.message.includes('auth')
      ) {
        console.warn(`⚠️ [GCP MOCK FALLBACK] Firebase DB 실사 연결 불가로 인해 메모리에서 심사 처리를 진행합니다.`);
        
        const existingDoc = mockSecureDocuments.get(docId);
        if (!existingDoc) {
          throw new Error('해당 서류를 찾을 수 없습니다.');
        }
        existingDoc.status = status;
        existingDoc.reviewedAt = now;
        existingDoc.reviewedBy = adminId || 'admin';
        existingDoc.rejectReason = rejectReason;
        mockSecureDocuments.set(docId, existingDoc);

        // 가상 인증 배지 업데이트
        let badges = mockBadges.get(userId) || { 
          identityVerified: false, 
          employmentVerified: false, 
          maritalStatusVerified: false,
          educationVerified: false
        };
        const isApproved = status === 'APPROVED';
        const expiredAt = isApproved ? VerificationService.calculateExpirationDate(documentType, now) : undefined;
        
        if (documentType === 'IDENTITY') {
          badges.identityVerified = isApproved;
          badges.identityExpiredAt = expiredAt;
        }
        if (documentType === 'EMPLOYMENT') {
          badges.employmentVerified = isApproved;
          badges.employmentExpiredAt = expiredAt;
        }
        if (documentType === 'MARITAL_STATUS') {
          badges.maritalStatusVerified = isApproved;
          badges.maritalStatusExpiredAt = expiredAt;
        }
        if (documentType === 'EDUCATION') {
          badges.educationVerified = isApproved;
          badges.educationExpiredAt = expiredAt;
        }
        badges.verifiedAt = now;
        mockBadges.set(userId, badges);

        return existingDoc;
      }
      console.error('❌ Firestore 서류 심사 실패:', error);
      throw error;
    }
  },

  /**
   * 관리자 열람을 위한 보안 일회용 다운로드 URL(Signed URL)을 발급합니다.
   */
  getDocumentSignedUrl: async (
    userId: string,
    documentType: DocumentType,
    adminId?: string
  ): Promise<string> => {
    const docId = `${userId}_${documentType}`;
    let fileStoragePath = '';

    try {
      if (!db) throw new Error('NO_DB');
      const snap = await db.collection('secure_documents').doc(docId).get();
      if (!snap.exists) throw new Error('서류를 찾을 수 없습니다.');
      fileStoragePath = (snap.data() as SecureDocument).fileStoragePath;

      if (!storage) throw new Error('NO_STORAGE');
      const bucket = storage.bucket();
      const file = bucket.file(fileStoragePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 10 * 60 * 1000
      });
      return url;
    } catch (error: any) {
      if (
        error.message === 'NO_DB' ||
        error.message === 'NO_STORAGE' ||
        error.message.includes('Project Id') ||
        error.message.includes('credential') ||
        error.message.includes('storage') ||
        error.message.includes('auth')
      ) {
        const doc = mockSecureDocuments.get(docId);
        fileStoragePath = doc ? doc.fileStoragePath : 'unknown_path';
        return `https://mock-storage.googleapis.com/download/${fileStoragePath}?token=mock-expired-in-10m&admin=${adminId || 'admin'}`;
      }
      console.error('❌ Storage Signed URL 생성 실패:', error);
      return `https://mock-storage.googleapis.com/download/${fileStoragePath}?fallback=true`;
    }
  },

  /**
   * 테스트 목적으로 유저의 인증 배지를 강제 설정합니다. (Harness 전용)
   */
  setBadgesForTest: async (userId: string, badges: any): Promise<void> => {
    try {
      if (!db) throw new Error('NO_DB');
      await db.collection('users').doc(userId).set({ verificationBadges: badges }, { merge: true });
    } catch (e) {
      mockBadges.set(userId, badges);
    }
  },

  /**
   * 만료 기간을 검증하여 유효한 신뢰 배지만 반환합니다. (Self-Healing 패턴)
   */
  getActiveBadges: async (userId: string): Promise<VerificationBadgeInfo> => {
    const now = new Date();
    const defaultBadges: VerificationBadgeInfo = {
      identityVerified: false,
      employmentVerified: false,
      maritalStatusVerified: false,
      educationVerified: false
    };

    try {
      if (!db) throw new Error('NO_DB');
      
      const userRef = db.collection('users').doc(userId);
      const snap = await userRef.get();
      if (!snap.exists) return defaultBadges;

      const data = snap.data();
      const badges: VerificationBadgeInfo = data?.verificationBadges || { ...defaultBadges };

      const parseDate = (val: any): Date | undefined => {
        if (!val) return undefined;
        return typeof val.toDate === 'function' ? val.toDate() : new Date(val);
      };

      const identityExpiredAt = parseDate(badges.identityExpiredAt);
      const employmentExpiredAt = parseDate(badges.employmentExpiredAt);
      const maritalStatusExpiredAt = parseDate(badges.maritalStatusExpiredAt);
      const educationExpiredAt = parseDate(badges.educationExpiredAt);

      let needsUpdate = false;
      const updatedBadges = { ...badges };

      // 1. IDENTITY 만료 검증
      if (badges.identityVerified && identityExpiredAt && identityExpiredAt.getTime() < now.getTime()) {
        updatedBadges.identityVerified = false;
        needsUpdate = true;
      }
      // 2. EMPLOYMENT 만료 검증
      if (badges.employmentVerified && employmentExpiredAt && employmentExpiredAt.getTime() < now.getTime()) {
        updatedBadges.employmentVerified = false;
        needsUpdate = true;
      }
      // 3. MARITAL_STATUS 만료 검증
      if (badges.maritalStatusVerified && maritalStatusExpiredAt && maritalStatusExpiredAt.getTime() < now.getTime()) {
        updatedBadges.maritalStatusVerified = false;
        needsUpdate = true;
      }
      // 4. EDUCATION 만료 검증
      if (badges.educationVerified && educationExpiredAt && educationExpiredAt.getTime() < now.getTime()) {
        updatedBadges.educationVerified = false;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await userRef.set({ verificationBadges: updatedBadges }, { merge: true });
      }

      return {
        identityVerified: updatedBadges.identityVerified,
        identityExpiredAt,
        employmentVerified: updatedBadges.employmentVerified,
        employmentExpiredAt,
        maritalStatusVerified: updatedBadges.maritalStatusVerified,
        maritalStatusExpiredAt,
        educationVerified: updatedBadges.educationVerified,
        educationExpiredAt,
        verifiedAt: parseDate(updatedBadges.verifiedAt)
      };

    } catch (error: any) {
      // Mock Fallback
      let badges = mockBadges.get(userId) || { ...defaultBadges };
      let needsUpdate = false;
      const updatedBadges = { ...badges };

      const parseDate = (val: any): Date | undefined => {
        if (!val) return undefined;
        return val instanceof Date ? val : new Date(val);
      };

      const identityExpiredAt = parseDate(badges.identityExpiredAt);
      const employmentExpiredAt = parseDate(badges.employmentExpiredAt);
      const maritalStatusExpiredAt = parseDate(badges.maritalStatusExpiredAt);
      const educationExpiredAt = parseDate(badges.educationExpiredAt);

      if (badges.identityVerified && identityExpiredAt && identityExpiredAt.getTime() < now.getTime()) {
        updatedBadges.identityVerified = false;
        needsUpdate = true;
      }
      if (badges.employmentVerified && employmentExpiredAt && employmentExpiredAt.getTime() < now.getTime()) {
        updatedBadges.employmentVerified = false;
        needsUpdate = true;
      }
      if (badges.maritalStatusVerified && maritalStatusExpiredAt && maritalStatusExpiredAt.getTime() < now.getTime()) {
        updatedBadges.maritalStatusVerified = false;
        needsUpdate = true;
      }
      if (badges.educationVerified && educationExpiredAt && educationExpiredAt.getTime() < now.getTime()) {
        updatedBadges.educationVerified = false;
        needsUpdate = true;
      }

      if (needsUpdate) {
        mockBadges.set(userId, updatedBadges);
      }

      return {
        identityVerified: updatedBadges.identityVerified,
        identityExpiredAt,
        employmentVerified: updatedBadges.employmentVerified,
        employmentExpiredAt,
        maritalStatusVerified: updatedBadges.maritalStatusVerified,
        maritalStatusExpiredAt,
        educationVerified: updatedBadges.educationVerified,
        educationExpiredAt,
        verifiedAt: parseDate(updatedBadges.verifiedAt)
      };
    }
  }
};
