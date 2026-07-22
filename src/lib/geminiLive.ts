// ============================================================
// geminiLive.ts — Gemini 3.5 Multimodal Live WebSocket 연동 모듈
// ============================================================
// 이 클래스는 백엔드 Express WebSocket Gateway(ws://localhost:3000)와 연결하여
// 실시간 번역 자막 및 통역 오디오 스트림 수신을 주관합니다.
// ============================================================

export interface GeminiLiveConfig {
  apiKey?: string; // 클라이언트 키는 더이상 필수 아님 (백엔드 키 사용)
  sourceLang: 'ko' | 'ja';
  targetLang: 'ko' | 'ja';
  roomId: string;
  userId: string;
}

export class GeminiLiveSession {
  private config: GeminiLiveConfig;
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private messageCallbacks: Set<(text: string) => void> = new Set();
  private alertCallbacks: Set<(alertType: string, reason: string) => void> = new Set();

  // Web Audio API 재생용 멤버
  private audioCtx: AudioContext | null = null;
  private nextPlayTime: number = 0;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
  }

  /**
   * 백엔드 WebSocket Gateway 연결 초기화 및 세션 셋업
   */
  public async connect(): Promise<void> {
    const wsUrl = `ws://localhost:3000`;
    console.log(`[GeminiLive] Connecting to Backend WebSocket Gateway: ${wsUrl}`);
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.isConnected = true;
      console.log('[GeminiLive] WebSocket connection established.');

      // 통역 방향 정의
      let translationDirection: 'KR_TO_JP' | 'JP_TO_KR' | 'NONE' = 'NONE';
      if (this.config.sourceLang === 'ko' && this.config.targetLang === 'ja') {
        translationDirection = 'KR_TO_JP';
      } else if (this.config.sourceLang === 'ja' && this.config.targetLang === 'ko') {
        translationDirection = 'JP_TO_KR';
      }

      // join_call 이벤트 송신
      const joinPayload = {
        event: 'join_call',
        roomId: this.config.roomId,
        userId: this.config.userId,
        translationDirection
      };
      
      this.socket?.send(JSON.stringify(joinPayload));
      console.log('[GeminiLive] Sent join_call payload:', joinPayload);

      // Web Audio Context 초기화
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.nextPlayTime = this.audioCtx.currentTime;
    };

    this.socket.onmessage = async (event) => {
      try {
        const payload = JSON.parse(event.data.toString());
        const { event: evType, senderId: _senderId, data, alert, reason } = payload;

        if (evType === 'audio_stream') {
          // 번역 오디오 재생 (16kHz PCM Base64)
          if (data) {
            this.playBase64Audio(data);
          }
        } else if (evType === 'ai_guard_alert') {
          // AI 보안 정책 위반 경보 전파
          console.warn(`[GeminiLive] AI Guard Alert: ${alert} - ${reason}`);
          this.alertCallbacks.forEach(cb => cb(alert, reason));
        } else if (evType === 'joined') {
          console.log(`[GeminiLive] Successfully joined room: ${this.config.roomId}`);
        } else if (evType === 'peer_connected') {
          console.log(`[GeminiLive] Peer connected: ${payload.peerId}`);
        }
      } catch (err) {
        // 비-JSON 메시지 처리 스킵
      }
    };

    this.socket.onerror = (err) => {
      console.error('[GeminiLive] WebSocket error:', err);
    };

    this.socket.onclose = () => {
      console.log('[GeminiLive] WebSocket connection closed.');
      this.isConnected = false;
    };
  }

  /**
   * 실시간 오디오 PCM 청크를 백엔드 Gateway로 전송
   */
  public sendAudioChunk(pcmBase64: string): void {
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    
    const audioPayload = {
      event: 'audio_data',
      roomId: this.config.roomId,
      userId: this.config.userId,
      data: pcmBase64
    };

    this.socket.send(JSON.stringify(audioPayload));
  }

  /**
   * 실시간 번역 자막 수신 콜백 등록 (텍스트 번역도 필요한 경우 대응)
   */
  public onTranslationReceived(callback: (text: string) => void): void {
    this.messageCallbacks.add(callback);
  }

  /**
   * AI 가드 경고 콜백 등록
   */
  public onAlertReceived(callback: (alertType: string, reason: string) => void): void {
    this.alertCallbacks.add(callback);
  }

  /**
   * 세션 종료 및 웹소켓 닫기
   */
  public disconnect(): void {
    console.log('[GeminiLive] Disconnecting WebSocket session...');
    this.isConnected = false;
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      this.socket = null;
    }
    this.messageCallbacks.clear();
    this.alertCallbacks.clear();

    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    console.log('[GeminiLive] Session successfully terminated.');
  }

  /**
   * Base64 16kHz PCM 오디오 데이터 디코딩 및 재생 스케줄링
   */
  private playBase64Audio(base64: string): void {
    if (!this.audioCtx) return;

    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }

      // 16kHz, mono 채널 AudioBuffer 생성
      const audioBuffer = this.audioCtx.createBuffer(1, float32Data.length, 16000);
      audioBuffer.copyToChannel(float32Data, 0);

      const bufferSource = this.audioCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(this.audioCtx.destination);

      // 재생 오버랩 방지를 위한 순차 재생 스케줄링
      const startTime = Math.max(this.audioCtx.currentTime, this.nextPlayTime);
      bufferSource.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;
    } catch (e) {
      console.error('[GeminiLive] Audio play failed:', e);
    }
  }
}
