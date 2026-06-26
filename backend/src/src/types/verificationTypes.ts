export type VerificationStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type DocumentType = 'IDENTITY' | 'EMPLOYMENT' | 'MARITAL_STATUS' | 'EDUCATION';

export interface VerificationBadgeInfo {
  identityVerified: boolean;
  identityExpiredAt?: Date;
  employmentVerified: boolean;
  employmentExpiredAt?: Date;
  maritalStatusVerified: boolean;
  maritalStatusExpiredAt?: Date;
  educationVerified: boolean;
  educationExpiredAt?: Date;
  verifiedAt?: Date;
}

export interface SecureDocument {
  id: string; // userId_documentType
  userId: string;
  documentType: DocumentType;
  fileStoragePath: string; // Firebase Storage 내 파일 경로
  status: VerificationStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // 관리자 ID
  rejectReason?: string; // 반려 사유 (REJECTED 상태 시 필수)
  extractedData?: {
    realName?: string;
    dateOfBirth?: string;
    companyName?: string;
    occupation?: string;
    idNumber?: string; // eKYC 및 보안 암호화를 위한 고유식별정보 필드
    ekycSimilarity?: number; // eKYC 안면 유사도 점수 저장
  };
}
