"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const http = __importStar(require("http"));
const express_1 = __importDefault(require("express"));
// 임시 테스트용 서버 가동
const app = (0, express_1.default)();
const server = http.createServer(app);
const wss = new ws_1.default.Server({ server });
const activeCalls = new Map();
wss.on('connection', (ws) => {
    let currentRoomId = null;
    let currentUserId = null;
    ws.on('message', (message) => {
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
                    if (!currentRoomId || !currentUserId || !data)
                        return;
                    const currentSession = activeCalls.get(currentRoomId);
                    if (!currentSession)
                        return;
                    currentSession.clients.forEach((clientSocket, clientId) => {
                        if (clientId !== currentUserId && clientSocket.readyState === ws_1.default.OPEN) {
                            clientSocket.send(JSON.stringify({
                                event: 'audio_stream',
                                senderId: currentUserId,
                                data
                            }));
                        }
                    });
                    break;
            }
        }
        catch (e) { }
    });
    ws.on('close', () => {
        if (currentRoomId && currentUserId) {
            const session = activeCalls.get(currentRoomId);
            if (session) {
                session.clients.delete(currentUserId);
                if (session.clients.size === 0)
                    activeCalls.delete(currentRoomId);
            }
        }
    });
});
// 테스트 실행 메인 함수
async function runLatencyTest() {
    return new Promise((resolve, reject) => {
        server.listen(0, '127.0.0.1', () => {
            const addr = server.address();
            const port = addr.port;
            const wsUrl = `ws://127.0.0.1:${port}`;
            console.log(`🧪 테스트용 WebSocket 릴레이 서버 기동: ${wsUrl}`);
            const clientA = new ws_1.default(wsUrl);
            const clientB = new ws_1.default(wsUrl);
            let peerConnectedCount = 0;
            let latencySamples = [];
            let sampleCount = 0;
            let pingInterval;
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
                            }
                            else {
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
            clientA.on('message', (message) => {
                const payload = JSON.parse(message.toString());
                if (payload.event === 'peer_connected') {
                    checkStart();
                }
            });
            // Client B 이벤트 바인딩
            clientB.on('open', () => {
                clientB.send(JSON.stringify({ event: 'join_call', roomId: 'test-room', userId: 'client-b' }));
            });
            clientB.on('message', (message) => {
                const payload = JSON.parse(message.toString());
                if (payload.event === 'peer_connected') {
                    checkStart();
                }
                else if (payload.event === 'audio_stream') {
                    // B가 수신한 오디오 데이터에서 timestamp 파싱
                    const dataStr = payload.data;
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
