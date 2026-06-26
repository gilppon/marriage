import WebSocket from 'ws';
import * as http from 'http';
import express from 'express';
import { AddressInfo } from 'net';
import { DbService } from '../src/services/dbService';

// 테스트 서버 인프라 가동
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

interface CallSession {
  roomId: string;
  clients: Map<string, WebSocket>;
  geminiSessions: Map<string, WebSocket>;
}
const activeCalls = new Map<string, CallSession>();

wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  ws.on('message', async (message: WebSocket.Data) => {
    try {
      const payload = JSON.parse(message.toString());
      const { event, roomId, userId, mockAiAlert, mockReason } = payload;

      switch (event) {
        case 'join_call':
          currentRoomId = roomId;
          currentUserId = userId;
          
          let session = activeCalls.get(roomId);
          if (!session) {
            session = { roomId, clients: new Map(), geminiSessions: new Map() };
            activeCalls.set(roomId, session);
          }
          session.clients.set(userId, ws);
          ws.send(JSON.stringify({ event: 'joined' }));
          break;

        case 'trigger_mock_ai_alert':
          // AI 가드가 경고를 탐지한 상황을 모킹하는 이벤트 핸들러
          if (!currentRoomId || !currentUserId) return;
          
          if (mockAiAlert === 'WARN_SCAM') {
            const status = await DbService.incrementScamScore(currentUserId, 30, mockReason);
            ws.send(JSON.stringify({
              event: 'ai_guard_alert',
              alert: 'WARN_SCAM',
              reason: `${mockReason} (위험 누적: ${status.scamScore}점)`
            }));

            if (status.isBanned) {
              triggerForceDisconnect(currentRoomId, currentUserId, '누적 임계치 초과 차단');
            }
          } else if (mockAiAlert === 'TERMINATE_CALL') {
            await DbService.incrementScamScore(currentUserId, 80, mockReason);
            triggerForceDisconnect(currentRoomId, currentUserId, mockReason);
          }
          break;
      }
    } catch (e) {}
  });
});

function triggerForceDisconnect(roomId: string, userId: string, reason: string) {
  const session = activeCalls.get(roomId);
  if (session) {
    session.clients.forEach((clientSocket) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          event: 'ai_guard_alert',
          alert: 'TERMINATE_CALL',
          reason
        }));
      }
    });

    // 강제 커넥션 제거
    setTimeout(() => {
      session.clients.forEach((ws) => ws.close());
      activeCalls.delete(roomId);
    }, 100);
  }
}

// AI 가드 시나리오 검증 메인 스레드
async function runAiGuardTest() {
  return new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      const wsUrl = `ws://127.0.0.1:${addr.port}`;
      console.log(`🧪 AI 가드 테스트 서버 가동 완료: ${wsUrl}`);

      const client = new WebSocket(wsUrl);
      let step = 0;

      client.on('open', () => {
        // 1단계: 가상 가입 및 통화 룸 참여
        client.send(JSON.stringify({ event: 'join_call', roomId: 'guard-room', userId: 'scammer_test_123' }));
      });

      client.on('message', (message: WebSocket.Data) => {
        const payload = JSON.parse(message.toString());
        
        if (payload.event === 'joined' && step === 0) {
          console.log('🟢 가상 스캐머가 통화에 조인했습니다. 1차 스캠 발언(WARN) 유도 중...');
          step = 1;
          client.send(JSON.stringify({
            event: 'trigger_mock_ai_alert',
            mockAiAlert: 'WARN_SCAM',
            mockReason: '환전 및 비트코인 투자 권유 단어 언급'
          }));
        } 
        
        else if (payload.event === 'ai_guard_alert' && payload.alert === 'WARN_SCAM' && step === 1) {
          console.log(`🟢 [PASS] 1차 스캠 경고 수신 완료: ${payload.reason}`);
          
          // 2단계: 80점 초과를 유도하여 즉시 강제 밴 기동을 테스트하기 위해 폭언(TERMINATE) 유도
          console.log('🟢 2차 폭언 및 심각한 정책 위반(TERMINATE) 유도 중...');
          step = 2;
          client.send(JSON.stringify({
            event: 'trigger_mock_ai_alert',
            mockAiAlert: 'TERMINATE_CALL',
            mockReason: '심각한 욕설 및 금전 송금 강요'
          }));
        } 
        
        else if (payload.event === 'ai_guard_alert' && payload.alert === 'TERMINATE_CALL' && step === 2) {
          console.log(`🟢 [PASS] AI 강제 차단 및 통화 종료 명령 수신 완료: ${payload.reason}`);
          step = 3;
        }
      });

      client.on('close', () => {
        server.close();
        if (step === 3) {
          console.log('🟢 [PASS] AI 가드 징계로 인해 소켓 커넥션이 백엔드에서 강제 종료되었습니다.');
          resolve();
        } else {
          reject(new Error('Test ended prematurely'));
        }
      });
    });
  });
}

runAiGuardTest().catch((err) => {
  console.error('❌ AI 가드 테스트 실패:', err);
  process.exit(1);
});
