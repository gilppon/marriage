import { db } from '../config/firebase';
import { ConciergeReport } from '../types/bmTypes';
import { MatchService } from './matchService';

// 가상 인메모리 리포트 저장소 (GCP 연결 불가 Fallback)
const mockReports = new Map<string, ConciergeReport>();

export const ConciergeService = {
  /**
   * 커플 매니저가 두 회원의 가치관을 분석하여 안전한 조언 리포트를 작성합니다.
   * (직접 미팅 일정을 지정하지 않아 법적 중개인 책임을 완벽하게 회피합니다.)
   */
  createAdvisoryReport: async (
    managerId: string,
    user1Id: string,
    user2Id: string,
    advisoryText: string,
    politeOpeningIcebreaker: string
  ): Promise<ConciergeReport> => {
    const reportId = `rep_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    // 두 사용자의 가치관에 따른 자동 적합도 점수 획득
    let compatibilityScore = 70; // 기본값
    const values1 = await MatchService.getMarriageValues(user1Id);
    const values2 = await MatchService.getMarriageValues(user2Id);
    if (values1 && values2) {
      const matchRes = await MatchService.calculateMatchScore(values1, values2);
      compatibilityScore = matchRes.score;
    }

    const reportData: ConciergeReport = {
      reportId,
      user1Id,
      user2Id,
      managerId,
      compatibilityScore,
      advisoryText,
      politeOpeningIcebreaker,
      createdAt: now
    };

    try {
      if (!db) throw new Error('NO_DB');
      await db.collection('concierge_reports').doc(reportId).set(reportData);
      return reportData;
    } catch (error) {
      console.warn(`⚠️ [GCP MOCK FALLBACK] DB 연결 불가로 메모리에 매니저 리포트를 저장합니다. ID: ${reportId}`);
      mockReports.set(reportId, reportData);
      return reportData;
    }
  },

  /**
   * 특정 사용자가 받은 매니저 매칭 코멘트 리포트 목록을 가져옵니다.
   */
  getUserReports: async (userId: string): Promise<ConciergeReport[]> => {
    let list: ConciergeReport[] = [];

    try {
      if (!db) throw new Error('NO_DB');
      
      // user1Id가 본인인 경우
      const snap1 = await db.collection('concierge_reports').where('user1Id', '==', userId).get();
      snap1.forEach(doc => {
        const data = doc.data();
        list.push({ ...data, reportId: doc.id, createdAt: data.createdAt ? data.createdAt.toDate() : new Date() } as ConciergeReport);
      });

      // user2Id가 본인인 경우
      const snap2 = await db.collection('concierge_reports').where('user2Id', '==', userId).get();
      snap2.forEach(doc => {
        const data = doc.data();
        // 중복 방지
        if (!list.some(r => r.reportId === doc.id)) {
          list.push({ ...data, reportId: doc.id, createdAt: data.createdAt ? data.createdAt.toDate() : new Date() } as ConciergeReport);
        }
      });
    } catch (error) {
      // GCP 에러 시 가상 인메모리 조회
      list = Array.from(mockReports.values()).filter(
        r => r.user1Id === userId || r.user2Id === userId
      );
    }

    // 최신 리포트 순 정렬
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
};
