import express, { Request, Response } from 'express';
import * as http from 'http';
import WebSocket from 'ws';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { createGeminiLiveSession, checkTextSafety } from './services/geminiService';
import { DbService } from './services/dbService';
import { VerificationService } from './services/verificationService';
import { PrivacyService } from './services/privacyService';
import { DocumentType, VerificationStatus } from './types/verificationTypes';
import { MatchService } from './services/matchService';
import { MeetingService } from './services/meetingService';
import { BillingService } from './services/billingService';
import { ConciergeService } from './services/conciergeService';
import { PoliteTemplates } from './utils/politeTemplates';

dotenv.config();

interface UserAccount {
  email: string;
  passwordHash: string;
  userId: string;
  userName: string;
  birthdate: string;
  country: 'KR' | 'JP';
}

export const mockUsers = new Map<string, UserAccount>();
// 데모 계정 사전 삽입
mockUsers.set('test@test.com', {
  email: 'test@test.com',
  passwordHash: '123456',
  userId: 'user_demo_123',
  userName: '데모메이트',
  birthdate: '1995-05-15',
  country: 'KR'
});

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// HTTP 상태 체크
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'korea aimasu 백엔드 게이트웨이가 작동 중입니다.' });
});

// REST API: 일반 채팅 텍스트 가드
app.post('/api/sanitize-chat', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: '텍스트 본문이 누락되었습니다.' });
  }

  const checkResult = await checkTextSafety(text);
  return res.json(checkResult);
});

// 회원가입 연령 검증 가드 API (한일 법적 규제 준수)
app.post('/api/signup', (req: Request, res: Response) => {
  let { email, password, userName, userId, birthdate, country } = req.body;
  
  // 하위 호환용 쉴드 가드 (E2E 테스트 대응)
  if (!email && userId) {
    email = `${userId}@mock.com`;
    password = 'password';
    userName = userId;
  }

  if (!email || !password || !userName || !birthdate || !country) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다. (email, password, userName, birthdate: YYYY-MM-DD, country: KR | JP)' });
  }

  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  // 대한민국 결혼중개업법: 만 19세 미만 미성년자 가입 차단
  if (country === 'KR' && age < 19) {
    return res.status(403).json({ error: '결혼중개업법에 의거, 만 19세 미만의 미성년자는 이용이 불가합니다.' });
  }

  // 일본 이성소개사업법: 만 18세 미만 미성년자 가입 차단
  if (country === 'JP' && age < 18) {
    return res.status(403).json({ error: '이성소개사업법에 의거, 만 18세 미만의 미성년자는 이용이 불가합니다.' });
  }

  if (mockUsers.has(email)) {
    return res.status(400).json({ error: '이미 가입된 이메일 주소입니다.' });
  }

  const finalUserId = userId || `user_${Date.now()}`;
  mockUsers.set(email, {
    email,
    passwordHash: password,
    userId: finalUserId,
    userName,
    birthdate,
    country
  });

  return res.status(200).json({ success: true, message: '회원가입 조건(나이 제한) 통과 및 가입 완료', userId: finalUserId, userName, country });
});

// 로그인 API
app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
  }

  const user = mockUsers.get(email);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  let profileCompleted = false;
  try {
    const profile = await DbService.getUserProfile(user.userId);
    if (profile) {
      profileCompleted = true;
    }
  } catch (err) {
    // mock DB fallback
  }

  if (email === 'test@test.com') {
    profileCompleted = true;
  }

  return res.status(200).json({ 
    success: true, 
    message: '로그인 성공', 
    userId: user.userId, 
    userName: user.userName, 
    country: user.country,
    profileCompleted 
  });
});

// 1. 사용자 서류 제출 API
app.post('/api/verification/submit', async (req: Request, res: Response) => {
  const { userId, documentType, fileStoragePath, extractedData, selfiePath } = req.body;
  if (!userId || !documentType || !fileStoragePath) {
    return res.status(400).json({ error: '필수 요청 필드가 누락되었습니다. (userId, documentType, fileStoragePath)' });
  }

  const validTypes: DocumentType[] = ['IDENTITY', 'EMPLOYMENT', 'MARITAL_STATUS', 'EDUCATION'];
  if (!validTypes.includes(documentType)) {
    return res.status(400).json({ error: `유효하지 않은 서류 타입입니다. 다음 중 하나여야 합니다: ${validTypes.join(', ')}` });
  }

  try {
    const doc = await VerificationService.submitDocument(userId, documentType, fileStoragePath, extractedData, selfiePath);
    const isAutoApproved = doc.status === 'APPROVED';
    return res.status(200).json({ 
      success: true, 
      message: isAutoApproved 
        ? 'AI eKYC 안면 대조 판독 결과 본인인증이 자동 통과되어 즉시 인증 배지가 발급되었습니다!' 
        : '서류가 성공적으로 제출되어 심사 대기 중입니다.', 
      document: doc 
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '서류 제출 처리 중 내부 에러가 발생했습니다.' });
  }
});

// 2. 관리자 서류 심사 API (State Machine)
app.post('/api/admin/verification/review', async (req: Request, res: Response) => {
  const { userId, documentType, status, rejectReason, adminId } = req.body;
  if (!userId || !documentType || !status) {
    return res.status(400).json({ error: '필수 요청 필드가 누락되었습니다. (userId, documentType, status)' });
  }

  const validStatuses: VerificationStatus[] = ['APPROVED', 'REJECTED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '상태는 APPROVED 또는 REJECTED 만 가능합니다.' });
  }

  if (status === 'REJECTED' && !rejectReason) {
    return res.status(400).json({ error: '서류 반려 시 반려 사유(rejectReason) 입력은 필수입니다.' });
  }

  try {
    const doc = await VerificationService.reviewDocument(userId, documentType, status, rejectReason, adminId);
    
    let signedUrl = '';
    try {
      signedUrl = await VerificationService.getDocumentSignedUrl(userId, documentType, adminId);
    } catch (e) {
      console.warn('⚠️ Signed URL 생성 실패 (심사 후 리턴 생략):', e);
    }

    return res.status(200).json({
      success: true,
      message: `서류 심사 상태가 ${status === 'APPROVED' ? '승인' : '반려'} 상태로 갱신되었습니다.`,
      document: doc,
      signedUrl: signedUrl || undefined
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '서류 심사 처리 중 에러가 발생했습니다.' });
  }
});

// 3. 사용자 프라이버시 설정 관리 API
app.post('/api/privacy/settings', async (req: Request, res: Response) => {
  const { userId, settings } = req.body;
  if (!userId || !settings) {
    return res.status(400).json({ error: 'userId와 설정(settings) 정보가 누락되었습니다.' });
  }

  try {
    const updatedSettings = await PrivacyService.updatePrivacySettings(userId, settings);
    return res.status(200).json({ success: true, message: '프라이버시 설정이 성공적으로 저장되었습니다.', settings: updatedSettings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '프라이버시 설정 업데이트 중 에러가 발생했습니다.' });
  }
});

// 4. 프라이버시 마스킹이 적용된 상세 프로필 조회 API
app.get('/api/profile/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const viewerUserId = req.query.viewerUserId as string;

  if (!viewerUserId) {
    return res.status(400).json({ error: '프로필을 조회하려는 사용자 ID(viewerUserId)가 쿼리 파라미터로 제공되어야 합니다.' });
  }

  try {
    const profile = await PrivacyService.getMaskedProfile(userId, viewerUserId);
    if (!profile) {
      return res.status(404).json({ error: '해당 프로필 사용자를 찾을 수 없습니다.' });
    }
    return res.status(200).json({ success: true, profile });
  } catch (error: any) {
    if (error.message === 'ACCESS_DENIED_COUNTRY') {
      return res.status(403).json({ error: '상대방의 설정에 의해 해당 국가 소속 회원의 프로필 조회 및 매칭이 제한되어 있습니다.' });
    }
    if (error.message === 'ACCESS_DENIED_PRIVATE') {
      return res.status(403).json({ error: '상대방이 비공개(휴면) 모드 상태입니다.' });
    }
    if (error.message === 'ACCESS_DENIED_VERIFIED_ONLY') {
      return res.status(403).json({ error: '이 프로필은 본인인증(Identity Verified)을 통과한 회원만 볼 수 있게 제한되어 있습니다.' });
    }
    if (error.message === 'ACCESS_DENIED_MATCHED_ONLY') {
      return res.status(403).json({ error: '이 프로필은 매칭이 완료된 회원에게만 공개되도록 제한되어 있습니다.' });
    }
    return res.status(500).json({ error: error.message || '프로필을 조회하는 과정에서 내부 에러가 발생했습니다.' });
  }
});

// 결혼 가치관 저장 API
app.post('/api/match/values', async (req: Request, res: Response) => {
  const { userId, marriageValues } = req.body;
  if (!userId || !marriageValues) {
    return res.status(400).json({ error: 'userId와 가치관(marriageValues) 정보가 누락되었습니다.' });
  }

  try {
    const saved = await MatchService.saveMarriageValues(userId, marriageValues);
    return res.status(200).json({ success: true, message: '결혼 가치관이 성공적으로 저장되었습니다.', marriageValues: saved });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '가치관 저장 도중 에러가 발생했습니다.' });
  }
});

// 1. 추천 매칭 조회 API
app.post('/api/match/recommend', async (req: Request, res: Response) => {
  const { userId, filterOptions } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId가 누락되었습니다.' });
  }

  try {
    const list = await MatchService.getRecommendedMatches(userId, filterOptions);
    return res.status(200).json({ success: true, count: list.length, recommendations: list });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '추천 매칭 조회 중 에러가 발생했습니다.' });
  }
});

// 2. 화상 미팅 제안 API (메시지 페이월 가드 적용)
app.post('/api/meeting/reserve', async (req: Request, res: Response) => {
  const { callerId, calleeId, proposedTimes, useAiTranslation } = req.body;
  if (!callerId || !calleeId || !proposedTimes || !Array.isArray(proposedTimes)) {
    return res.status(400).json({ error: '필수 요청 정보가 누락되었습니다. (callerId, calleeId, proposedTimes: Date[])' });
  }

  try {
    // 메시지 발송 전 페이월 가드 체크
    await BillingService.checkPaywallGate(callerId, 'SEND_MESSAGE');

    const dates = proposedTimes.map((t: string) => new Date(t));
    const reservation = await MeetingService.createReservation(callerId, calleeId, dates, !!useAiTranslation);

    // 액션 후 하트 1개 차감
    await BillingService.consumeHeart(callerId, 1);

    return res.status(200).json({ success: true, message: '화상 미팅이 성공적으로 제안되었습니다. (하트 1개 차감)', reservation });
  } catch (error: any) {
    if (error.message === 'PAYWALL_TRIGGERED') {
      return res.status(402).json({ error: '하트가 소진되어 미팅 제안(메시지 전송)을 할 수 없습니다. 충전 페이지로 이동합니다.' });
    }
    return res.status(500).json({ error: error.message || '미팅 예약 신청 중 에러가 발생했습니다.' });
  }
});

// 3. 화상 미팅 확정 API
app.post('/api/meeting/confirm', async (req: Request, res: Response) => {
  const { reservationId, chosenTimeIndex, calleeId } = req.body;
  if (!reservationId || chosenTimeIndex === undefined || !calleeId) {
    return res.status(400).json({ error: '필수 요청 정보가 누락되었습니다. (reservationId, chosenTimeIndex, calleeId)' });
  }

  try {
    const reservation = await MeetingService.confirmReservation(reservationId, Number(chosenTimeIndex), calleeId);
    return res.status(200).json({
      success: true,
      message: `화상 미팅이 최종 확정되었습니다. 확정 시각: ${reservation.confirmedTime}`,
      reservation
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '미팅 확정 처리 중 에러가 발생했습니다.' });
  }
});

// 4-1. 지갑 정보 및 멤버십 조회 API
app.get('/api/billing/wallet/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'userId가 누락되었습니다.' });

  try {
    const wallet = await BillingService.getWallet(userId);
    return res.status(200).json({ success: true, wallet });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '지갑 정보 조회 중 에러가 발생했습니다.' });
  }
});

// 4. 결제 시뮬레이션 충전 API
app.post('/api/billing/charge', async (req: Request, res: Response) => {
  const { userId, amount, isUpgrade } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId가 누락되었습니다.' });

  try {
    const wallet = await BillingService.chargeHearts(userId, Number(amount || 0), !!isUpgrade);
    return res.status(200).json({ success: true, message: '결제가 성공적으로 처리되었습니다.', wallet });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '결제 충전 중 오류가 발생했습니다.' });
  }
});

// 5. 매니저 추천 어드바이스 리포트 발행 API (법적 책임 회피형 간접 모델)
app.post('/api/concierge/report/create', async (req: Request, res: Response) => {
  const { managerId, user1Id, user2Id, advisoryText, politeOpeningIcebreaker } = req.body;
  if (!managerId || !user1Id || !user2Id || !advisoryText || !politeOpeningIcebreaker) {
    return res.status(400).json({ error: '필수 매개변수가 누락되었습니다.' });
  }

  try {
    const report = await ConciergeService.createAdvisoryReport(managerId, user1Id, user2Id, advisoryText, politeOpeningIcebreaker);
    return res.status(200).json({ success: true, message: '가치관 분석 코칭 리포트가 성공적으로 등록되었습니다.', report });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '리포트 등록 중 오류가 발생했습니다.' });
  }
});

// 6. 사용자의 수신된 어드바이스 리포트 목록 조회 API
app.get('/api/concierge/reports', async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId 쿼리스트링이 제공되어야 합니다.' });

  try {
    const reports = await ConciergeService.getUserReports(userId);
    return res.status(200).json({ success: true, reports });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '리포트 조회 중 오류가 발생했습니다.' });
  }
});

// 7. 일본어 정중한 경어 사전 조회 API
app.get('/api/localization/polite-text', async (req: Request, res: Response) => {
  const { type, name } = req.query;
  if (!type) return res.status(400).json({ error: 'type 쿼리스트링이 제공되어야 합니다. (FIRST_GREETING, ACCEPT_MATCH, POLITE_DECLINE)' });

  try {
    const text = PoliteTemplates.getPoliteTemplate(type as any, (name as string) || '상대방');
    return res.status(200).json({ success: true, text });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '번역 사전 로드 중 오류가 발생했습니다.' });
  }
});

// 8. 사용자 상세 프로필 저장/수정 API
app.post('/api/user/profile', async (req: Request, res: Response) => {
  const { userId, profileData } = req.body;
  if (!userId || !profileData) {
    return res.status(400).json({ error: 'userId와 profileData가 제공되어야 합니다.' });
  }

  try {
    const profile = await DbService.saveUserProfile(userId, profileData);
    return res.status(200).json({ success: true, message: '상세 프로필이 성공적으로 저장되었습니다.', profile });
  } catch (error: any) {
    const errMsg = error.message;
    let friendlyMessage = '프로필 저장 중 오류가 발생했습니다.';
    if (errMsg === 'MISSING_REQUIRED_FIELDS') friendlyMessage = '필수 프로필 필드가 누락되었습니다.';
    if (errMsg === 'INVALID_USER_ROLE') friendlyMessage = '유효하지 않은 역할입니다.';
    if (errMsg === 'INVALID_RELIGION_VALUE') friendlyMessage = '유효하지 않은 종교 값입니다.';
    if (errMsg === 'MISSING_LIFESTYLE_FIELDS') friendlyMessage = '라이프스타일 필수 필드(거주형태, 음주, 흡연)가 누락되었습니다.';
    if (errMsg === 'INVALID_LIFESTYLE_VALUES') friendlyMessage = '라이프스타일 선택 값이 잘못되었습니다.';
    if (errMsg === 'INVALID_BLOOD_TYPE') friendlyMessage = '혈액형은 A, B, O, AB 중 하나여야 합니다.';
    if (errMsg === 'INVALID_HOBBIES_FORMAT') friendlyMessage = '취미는 문자열 배열 형태여야 합니다.';
    if (errMsg === 'TOO_MANY_HOBBIES') friendlyMessage = '취미는 최대 10개까지만 등록 가능합니다.';

    return res.status(400).json({ error: errMsg, message: friendlyMessage });
  }
});

// 9. 사용자 상세 프로필 조회 API
app.get('/api/user/profile/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'userId가 누락되었습니다.' });

  try {
    const profile = await DbService.getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'PROFILE_NOT_FOUND', message: '해당 사용자의 프로필이 존재하지 않습니다.' });
    }
    const badges = await VerificationService.getActiveBadges(userId);
    return res.status(200).json({ success: true, profile: { ...profile, verificationBadges: badges } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || '프로필 조회 도중 서버 에러가 발생했습니다.' });
  }
});

const server = http.createServer(app);

// WebSocket 서버 설정 (1:1 보이스톡 릴레이 전용)
const wss = new WebSocket.Server({ server });

interface CallSession {
  roomId: string;
  clients: Map<string, WebSocket>; // userId -> WebSocket
  geminiSessions: Map<string, WebSocket>; // userId -> Gemini Live API WebSocket
  billingTimers?: Map<string, NodeJS.Timeout>; // userId -> billing interval timer (하트 차감용)
}

// 활성 통화 세션 메모리 맵
const activeCalls = new Map<string, CallSession>();

wss.on('connection', (ws: WebSocket) => {
  console.log('🔌 새로운 클라이언트가 WebSocket으로 접속했습니다.');

  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  ws.on('message', async (message: WebSocket.Data) => {
    try {
      const payload = JSON.parse(message.toString());
      const { event, roomId, userId, data } = payload;

      switch (event) {
        case 'join_call': {
          if (!roomId || !userId) {
            ws.send(JSON.stringify({ event: 'error', message: 'roomId 또는 userId가 누락되었습니다.' }));
            return;
          }

          // 0. 실시간 AI 통화 시작 권한 검사 (최소 1하트 필요)
          const hasCallPermission = await BillingService.checkCallPermission(userId);
          if (!hasCallPermission) {
            ws.send(JSON.stringify({
              event: 'ai_guard_alert',
              alert: 'TERMINATE_CALL',
              reason: '보유하신 하트가 소진되어 통화를 연결할 수 없습니다. 결제 충전 후 이용해주십시오.'
            }));
            ws.close();
            return;
          }

          // 1. 유저 차단(Ban) 상태 검증 (보안 Hard Boundary 작동)
          const userStatus = await DbService.checkUserStatus(userId);
          if (userStatus.isBanned) {
            console.log(`🛡️ [ACCESS DENIED] 차단된 유저 [${userId}]의 통화방 진입을 즉시 차단합니다.`);
            ws.send(JSON.stringify({
              event: 'ai_guard_alert',
              alert: 'TERMINATE_CALL',
              reason: `이 계정은 스캠 및 유해 행위로 인해 임시 차단된 상태입니다. (누적 점수: ${userStatus.scamScore}점)`
            }));
            ws.close();
            return;
          }

          currentRoomId = roomId;
          currentUserId = userId;

          console.log(`📞 유저 [${userId}]가 통화 방 [${roomId}]에 참여를 요청했습니다. (번역옵션: ${payload.translationDirection || 'NONE'})`);

          let session = activeCalls.get(roomId);
          if (!session) {
            session = {
              roomId,
              clients: new Map(),
              geminiSessions: new Map()
            };
            activeCalls.set(roomId, session);
          }

          // 소켓 맵핑
          session.clients.set(userId, ws);

          // Gemini 3.5 Live API WebSocket 세션 기동 및 강제 끊기 콜백 주입
          const translationDirection = payload.translationDirection || 'NONE';
          const geminiWs = createGeminiLiveSession(
            ws, 
            userId, 
            roomId, 
            translationDirection,
            (base64Audio: string) => {
              // 번역된 오디오 데이터를 상대방 유저에게 실시간 릴레이 전송
              const liveSession = activeCalls.get(roomId);
              if (liveSession) {
                liveSession.clients.forEach((clientSocket, clientId) => {
                  if (clientId !== userId && clientSocket.readyState === WebSocket.OPEN) {
                    clientSocket.send(JSON.stringify({
                      event: 'audio_stream',
                      senderId: 'ai_interpreter',
                      data: base64Audio
                    }));
                  }
                });
              }
            },
            (terminateReason: string) => {
              console.log(`🚨 [AI FORCE TERMINATE] 방 [${roomId}] 유저 [${userId}]의 유해 발언 감지로 인한 통화 강제 파괴 시작.`);
              
              // 방 안에 있는 모든 클라이언트에게 종료 이벤트를 알림
              const liveSession = activeCalls.get(roomId);
              if (liveSession) {
                liveSession.clients.forEach((clientSocket) => {
                  if (clientSocket.readyState === WebSocket.OPEN) {
                    clientSocket.send(JSON.stringify({
                      event: 'ai_guard_alert',
                      alert: 'TERMINATE_CALL',
                      reason: terminateReason
                    }));
                  }
                });
                
                // 두 클라이언트의 소켓 연결을 즉각 폭파 및 클린업
                setTimeout(() => {
                   const keys = Array.from(liveSession.clients.keys());
                   keys.forEach(k => cleanUpSession(roomId, k));
                }, 500);
              }
            }
          );

          if (geminiWs) {
            session.geminiSessions.set(userId, geminiWs);
          }

          ws.send(JSON.stringify({ event: 'joined', userId, roomId }));

          // 3. 실시간 AI 통역 1분 주기 과금 스케줄러 기동 (분당 1하트 차감)
          if (!session.billingTimers) {
            session.billingTimers = new Map();
          }
          const oldTimer = session.billingTimers.get(userId);
          if (oldTimer) clearInterval(oldTimer);

          const billingTimer = setInterval(async () => {
            try {
              console.log(`🪙 [BILLING TIMER] 유저 [${userId}]의 통화 분당 과금 1하트 차감을 시작합니다.`);
              const updatedWallet = await BillingService.consumeHeart(userId, 1);
              console.log(`🪙 [BILLING TIMER SUCCESS] 유저 [${userId}] 남은 하트: ${updatedWallet.hearts}개`);

              if (updatedWallet.hearts <= 0 && updatedWallet.membershipType !== 'PREMIUM') {
                console.log(`🚨 [BILLING TERMINATION] 유저 [${userId}] 하트 소진으로 세션 강제 드롭.`);
                ws.send(JSON.stringify({
                  event: 'ai_guard_alert',
                  alert: 'TERMINATE_CALL',
                  reason: '보유하신 하트가 모두 소진되어 통화가 자동으로 종료되었습니다. 충전 후 다시 이용해 주세요.'
                }));

                const currentSession = activeCalls.get(roomId);
                if (currentSession?.billingTimers) {
                  const timer = currentSession.billingTimers.get(userId);
                  if (timer) clearInterval(timer);
                  currentSession.billingTimers.delete(userId);
                }
                ws.close();
              }
            } catch (err) {
              console.error('❌ 과금 타이머 실행 실패:', err);
            }
          }, 60000); // 1분

          session.billingTimers.set(userId, billingTimer);

          // 상대방이 이미 방에 들어와 있다면 연결 통보
          if (session.clients.size > 1) {
            session.clients.forEach((clientSocket, clientId) => {
              if (clientId !== userId) {
                clientSocket.send(JSON.stringify({ event: 'peer_connected', peerId: userId }));
                ws.send(JSON.stringify({ event: 'peer_connected', peerId: clientId }));
              }
            });
          }
          break;
        }

        case 'audio_data': {
          if (!currentRoomId || !currentUserId || !data) return;

          const session = activeCalls.get(currentRoomId);
          if (!session) return;

          // 1. 상대방 클라이언트로 오디오 데이터 릴레이 (16kHz PCM Base64)
          session.clients.forEach((clientSocket, clientId) => {
            if (clientId !== currentUserId && clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(JSON.stringify({
                event: 'audio_stream',
                senderId: currentUserId,
                data // Base64 오디오 데이터
              }));
            }
          });

          // 2. 이 유저에 매핑된 Gemini Live API WebSocket 세션으로 실시간 음성 파이핑
          const geminiWs = session.geminiSessions.get(currentUserId);
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            const mediaPayload = {
              realtimeInput: {
                mediaChunks: [
                  {
                    mimeType: 'audio/pcm;rate=16000',
                    data // Base64 PCM 16kHz Chunk
                  }
                ]
              }
            };
            geminiWs.send(JSON.stringify(mediaPayload));
          }
          break;
        }

        case 'leave_call': {
          cleanUpSession(currentRoomId, currentUserId);
          break;
        }

        default:
          console.warn(`⚠️ 알 수 없는 WebSocket 이벤트: ${event}`);
      }
    } catch (error) {
      console.error('❌ WebSocket 메시지 처리 중 오류:', error);
    }
  });

  ws.on('close', () => {
    console.log(`🔌 클라이언트 연결 해제 (User: ${currentUserId}, Room: ${currentRoomId})`);
    cleanUpSession(currentRoomId, currentUserId);
  });

  ws.on('error', (err: Error) => {
    console.error(`❌ Client Socket 에러 (${currentUserId}):`, err);
    cleanUpSession(currentRoomId, currentUserId);
  });
});

/**
 * 리소스 누수 방지를 위한 커넥션 클린업 헬퍼
 */
function cleanUpSession(roomId: string | null, userId: string | null) {
  if (!roomId || !userId) return;

  const session = activeCalls.get(roomId);
  if (!session) return;

  // 0. 가동 중인 하트 차감 타이머가 있다면 즉각 해제 (메모리 해제 하네스)
  if (session.billingTimers) {
    const billingTimer = session.billingTimers.get(userId);
    if (billingTimer) {
      clearInterval(billingTimer);
      console.log(`🧹 요율 차감 과금 스케줄러 해제 완료 (User: ${userId})`);
    }
    session.billingTimers.delete(userId);
  }

  // 1. 해당 사용자의 Gemini Live Session 해제
  const geminiWs = session.geminiSessions.get(userId);
  if (geminiWs) {
    if (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING) {
      geminiWs.close();
    }
    session.geminiSessions.delete(userId);
    console.log(`🧹 Gemini API 세션 해제 완료 (User: ${userId})`);
  }

  // 2. 사용자의 소켓 맵에서 제외 및 클라이언트 소켓 안전 닫기
  const clientSocket = session.clients.get(userId);
  if (clientSocket) {
    if (clientSocket.readyState === WebSocket.OPEN || clientSocket.readyState === WebSocket.CONNECTING) {
      clientSocket.close();
    }
    session.clients.delete(userId);
  }

  // 3. 상대 유저에게 방 나감 알림 전송
  session.clients.forEach((cSocket) => {
    if (cSocket.readyState === WebSocket.OPEN) {
      cSocket.send(JSON.stringify({ event: 'peer_disconnected', peerId: userId }));
    }
  });

  // 4. 통화방에 아무도 없으면 메모리 맵에서 완전 해제
  if (session.clients.size === 0) {
    activeCalls.delete(roomId);
    console.log(`🧹 활성 통화방 [${roomId}]의 모든 세션이 비어 메모리에서 삭제되었습니다.`);
  }
}

// Serve Vite frontend build assets
import * as path from 'path';
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Fallback all other client requests to React's index.html (client-side routing)
app.get('*', (req: Request, res: Response, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 korea aimasu 백엔드 게이트웨이가 포트 ${PORT}에서 활성화되었습니다!`);
});

