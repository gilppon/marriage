import { db } from '../config/firebase';
import { VideoCallReservation, MeetingStatus } from '../types/meetingTypes';

// 인메모리 가상 예약 DB (GCP 에러 Fallback)
const mockReservations = new Map<string, VideoCallReservation>();

export const MeetingService = {
  /**
   * 화상 미팅을 신청(제안)합니다.
   */
  createReservation: async (
    callerId: string,
    calleeId: string,
    proposedTimes: Date[],
    useAiTranslation: boolean
  ): Promise<VideoCallReservation> => {
    const reservationId = `meet_${Math.random().toString(36).substring(2, 11)}`;
    const roomId = `room_live_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();

    const reservationData: VideoCallReservation = {
      reservationId,
      callerId,
      calleeId,
      proposedTimes,
      status: 'PENDING',
      roomId,
      createdAt: now,
      useAiTranslation
    };

    try {
      if (!db) throw new Error('NO_DB');
      await db.collection('video_reservations').doc(reservationId).set(reservationData);
      return reservationData;
    } catch (error) {
      console.warn(`⚠️ [GCP MOCK FALLBACK] DB 연결 불가로 메모리에 화상 예약을 생성합니다. ID: ${reservationId}`);
      mockReservations.set(reservationId, reservationData);
      return reservationData;
    }
  },

  /**
   * 화상 미팅 제안 중 하나를 확정 수락합니다. (State Machine 상태 전이)
   */
  confirmReservation: async (
    reservationId: string,
    chosenTimeIndex: number,
    calleeId: string
  ): Promise<VideoCallReservation> => {
    let reservation: VideoCallReservation | undefined;

    try {
      if (!db) throw new Error('NO_DB');
      const docRef = db.collection('video_reservations').doc(reservationId);
      const snap = await docRef.get();
      if (!snap.exists) throw new Error('해당 예약 정보를 찾을 수 없습니다.');
      
      const data = snap.data() as VideoCallReservation;
      if (data.calleeId !== calleeId) throw new Error('이 예약을 확정할 권한이 없습니다.');
      if (data.status !== 'PENDING') throw new Error('대기 중인 예약만 확정할 수 있습니다.');
      if (chosenTimeIndex < 0 || chosenTimeIndex >= data.proposedTimes.length) {
        throw new Error('올바르지 않은 제안 시간 인덱스입니다.');
      }

      // Firestore의 Timestamp를 Date로 가공
      const proposedDates = data.proposedTimes.map((t: any) => typeof t.toDate === 'function' ? t.toDate() : new Date(t));
      const confirmedTime = proposedDates[chosenTimeIndex];

      await docRef.update({
        status: 'CONFIRMED',
        confirmedTime
      });

      const updated = await docRef.get();
      return {
        ...updated.data(),
        reservationId
      } as VideoCallReservation;

    } catch (error: any) {
      if (
        error.message === 'NO_DB' ||
        error.message.includes('Project Id') ||
        error.message.includes('credential') ||
        error.message.includes('auth')
      ) {
        reservation = mockReservations.get(reservationId);
        if (!reservation) throw new Error('해당 예약 정보를 찾을 수 없습니다.');
        if (reservation.calleeId !== calleeId) throw new Error('이 예약을 확정할 권한이 없습니다.');
        if (reservation.status !== 'PENDING') throw new Error('대기 중인 예약만 확정할 수 있습니다.');
        if (chosenTimeIndex < 0 || chosenTimeIndex >= reservation.proposedTimes.length) {
          throw new Error('올바르지 않은 제안 시간 인덱스입니다.');
        }

        const confirmedTime = new Date(reservation.proposedTimes[chosenTimeIndex]);
        reservation.status = 'CONFIRMED';
        reservation.confirmedTime = confirmedTime;

        mockReservations.set(reservationId, reservation);
        return reservation;
      }
      console.error('❌ 화상 예약 확정 실패:', error);
      throw error;
    }
  },

  /**
   * 예약을 취소합니다.
   */
  cancelReservation: async (reservationId: string, cancellerId: string): Promise<VideoCallReservation> => {
    try {
      if (!db) throw new Error('NO_DB');
      const docRef = db.collection('video_reservations').doc(reservationId);
      const snap = await docRef.get();
      if (!snap.exists) throw new Error('해당 예약 정보를 찾을 수 없습니다.');
      const data = snap.data() as VideoCallReservation;

      if (data.callerId !== cancellerId && data.calleeId !== cancellerId) {
        throw new Error('이 예약을 취소할 권한이 없습니다.');
      }

      await docRef.update({ status: 'CANCELLED' });

      const updated = await docRef.get();
      return { ...updated.data(), reservationId } as VideoCallReservation;
    } catch (error: any) {
      console.warn(`⚠️ [GCP MOCK FALLBACK] DB 연결 불가로 메모리에 예약을 취소합니다.`);
      const reservation = mockReservations.get(reservationId);
      if (!reservation) throw new Error('해당 예약 정보를 찾을 수 없습니다.');

      if (reservation.callerId !== cancellerId && reservation.calleeId !== cancellerId) {
        throw new Error('이 예약을 취소할 권한이 없습니다.');
      }

      reservation.status = 'CANCELLED';
      mockReservations.set(reservationId, reservation);
      return reservation;
    }
  }
};
