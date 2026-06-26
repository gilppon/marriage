export type MembershipType = 'FREE' | 'PREMIUM';
export type ConciergeMatchStatus = 'ASSIGNED' | 'PROPOSING' | 'ARRANGED' | 'COMPLETED';

export interface UserWallet {
  userId: string;
  hearts: number; // 기본 가입 시 5개 부여
  membershipType: MembershipType;
}

export interface ConciergeReport {
  reportId: string;
  user1Id: string;
  user2Id: string;
  managerId: string; // 담당 매니저 ID
  compatibilityScore: number;
  advisoryText: string; // 가치관 분석 코멘트
  politeOpeningIcebreaker: string; // 첫인사 추천 일본어 템플릿
  createdAt: Date;
}
