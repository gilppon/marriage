export type MeetingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface VideoCallReservation {
  reservationId: string;
  callerId: string;
  calleeId: string;
  proposedTimes: Date[]; // 최대 3개 후보 시간
  confirmedTime?: Date; // 확정 시간
  status: MeetingStatus;
  roomId: string; // 화상 미팅에 사용할 WebSocket 룸 ID
  createdAt: Date;
  useAiTranslation: boolean; // AI 실시간 통역 활성화 여부
}
