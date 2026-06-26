import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Firebase Admin SDK 초기화
// 로컬 환경 또는 프로덕션 자격 증명이 주입되지 않은 상황을 방지하기 위한 안전 장치 (Circuit Breaker 및 Fallback 패턴 적용)
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    console.log('🟢 Firebase Admin SDK가 서비스 계정 자격을 사용하여 성공적으로 활성화되었습니다.');
  } else {
    // 환경변수가 없을 경우 기본 환경 정보로 활성화를 재시도하거나 모의(Mock) 연결 수행
    admin.initializeApp();
    console.log('🟢 Firebase Admin SDK가 기본 애플리케이션 자격 증명으로 활성화되었습니다.');
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK 초기화 실패: 로컬 가상 Mock 모드로 작동합니다. DB 연결이 필요한 API는 실패할 수 있습니다.', error);
}

export const db = admin.apps.length > 0 ? admin.firestore() : null;
export const auth = admin.apps.length > 0 ? admin.auth() : null;
export const storage = admin.apps.length > 0 ? admin.storage() : null;
