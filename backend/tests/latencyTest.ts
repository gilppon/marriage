import WebSocket from 'ws';
import * as http from 'http';
import express from 'express';
import { AddressInfo } from 'net';

// 임시 테스트용 서버 가동
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

interface CallSession {
  roomId: string;
  clients: Map<string, WebSocket>;
}
const activeCalls = new Map<string, CallSession>();

wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  ws.on('message', (message: WebSocket.Data) => {
    try {
      const payload = JSON.parse(message.toString());
      const { event, roomId, userId, data } = payload;

      switch (event) {
        case 'join_call':
          currentRoomId = roomId;
          currentUserId = userId;
          let session = activeCalls.get(roomId);
          if (!session) {
            session = { roomId, clients: new Map() };
            activeCalls.set(roomId, session);
          }
          session.clients.set(userId, ws);
          ws.send(JSON.stringify({ event: 'joined' }));

          if (session.clients.size > 1) {
            session.clients.forEach((clientSocket, clientId) => {
              if (clientId !== userId) {
                clientSocket.send(JSON.stringify({ event: 'peer_connected', peerId: userId }));
                ws.send(JSON.stringify({ event: 'peer_connected', peerId: clientId }));
              }
            });
          }
          break;

        case 'audio_data':
          if (!currentRoomId || !currentUserId || !data) return;
          const currentSession = activeCalls.get(currentRoomId);
          if (!currentSession) return;

          currentSession.clients.forEach((clientSocket, clientId) => {
            if (clientId !== currentUserId && clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(JSON.stringify({
                event: 'audio_stream',
                senderId: currentUserId,
                data
              }));
            }
          });
          break;
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    if (currentRoomId && currentUserId) {
      const session = activeCalls.get(currentRoomId);
      if (session) {
        session.clients.delete(currentUserId);
        if (session.clients.size === 0) activeCalls.delete(currentRoomId);
      }
    }
  });
});

// 테스트 실행 메인 함수
async function runLatencyTest() {
  return new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      const port = addr.port;
      const wsUrl = `ws://127.0.0.1:${port}`;
      console.log(`🧪 테스트용 WebSocket 릴레이 서버 기동: ${wsUrl}`);

      const clientA = new WebSocket(wsUrl);
      const clientB = new WebSocket(wsUrl);

      let peerConnectedCount = 0;
      let latencySamples: number[] = [];
      let sampleCount = 0;
      let pingInterval: NodeJS.Timeout;

      const checkStart = () => {
        peerConnectedCount++;
        if (peerConnectedCount === 2) {
          console.log('🟢 가상 클라이언트 A와 B 매칭 성공. 지연 시간(RTT) 측정 시작...');
          
          // 50ms 마다 오디오 프레임 전송 테스트
          pingInterval = setInterval(() => {
            if (sampleCount >= 20) {
              clearInterval(pingInterval);
              clientA.close();
              clientB.close();
              server.close();
              
              const avgLatency = latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length;
              console.log(`📊 RTT 지연 분석 결과 (샘플 20회):`);
              console.log(`   - 최소 RTT: ${Math.min(...latencySamples).toFixed(2)}ms`);
              console.log(`   - 최대 RTT: ${Math.max(...latencySamples).toFixed(2)}ms`);
              console.log(`   - 평균 RTT: ${avgLatency.toFixed(2)}ms`);
              
              if (avgLatency < 50) {
                console.log('🟢 [PASS] 평균 지연 시간이 50ms 미만으로 초저지연 오디오 릴레이 스펙을 만족합니다.');
                resolve();
              } else {
                console.warn('⚠️ [WARN] 지연 시간이 임계치를 초과했습니다.');
                reject(new Error('Latency too high'));
              }
              return;
            }

            const timestamp = Date.now();
            // A가 보낸 오디오 데이터를 B가 받을 때까지의 RTT 측정
            clientA.send(JSON.stringify({
              event: 'audio_data',
              roomId: 'test-room',
              userId: 'client-a',
              data: `TIMESTAMP:${timestamp}`
            }));
            sampleCount++;
          }, 50);
        }
      };

      // Client A 이벤트 바인딩
      clientA.on('open', () => {
        clientA.send(JSON.stringify({ event: 'join_call', roomId: 'test-room', userId: 'client-a' }));
      });

      clientA.on('message', (message: WebSocket.Data) => {
        const payload = JSON.parse(message.toString());
        if (payload.event === 'peer_connected') {
          checkStart();
        }
      });

      // Client B 이벤트 바인딩
      clientB.on('open', () => {
        clientB.send(JSON.stringify({ event: 'join_call', roomId: 'test-room', userId: 'client-b' }));
      });

      clientB.on('message', (message: WebSocket.Data) => {
        const payload = JSON.parse(message.toString());
        if (payload.event === 'peer_connected') {
          checkStart();
        } else if (payload.event === 'audio_stream') {
          // B가 수신한 오디오 데이터에서 timestamp 파싱
          const dataStr = payload.data as string;
          if (dataStr.startsWith('TIMESTAMP:')) {
            const sendTime = parseInt(dataStr.split(':')[1]);
            const rtt = Date.now() - sendTime;
            latencySamples.push(rtt);
          }
        }
      });
    });
  });
}

runLatencyTest().catch((err) => {
  console.error('❌ 지연 테스트 오류:', err);
  process.exit(1);
});
