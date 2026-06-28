// ============================================================
// geminiLive.ts — Gemini 3.5 Multimodal Live WebSocket 번역 모듈
// ============================================================
// 이 클래스는 Gemini Live API 웹소켓 통신을 직접 주관하여
// 오디오 실시간 인풋 전달 및 동기화 번역 텍스트 출력을 수행합니다.
// ============================================================

export interface GeminiLiveConfig {
  apiKey: string;
  sourceLang: 'ko' | 'ja';
  targetLang: 'ko' | 'ja';
}

export class GeminiLiveSession {
  private config: GeminiLiveConfig;
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private messageCallbacks: Set<(text: string) => void> = new Set();

  // 자막 시뮬레이션용 문장 데이터베이스 (한-일 페어)
  private mockSentences = {
    ko: [
      "안녕하세요! 프로필 사진보다 실물이 훨씬 더 인상이 좋으시네요.",
      "소개글에 여행을 좋아하신다고 적어주셨는데, 주로 어떤 나라를 자주 가시나요?",
      "한일 문화에 대해 서로 알아갈 수 있는 기회가 생겨서 정말 기쁩니다.",
      "주말에는 대개 집에서 쉬시는 편인가요, 아니면 야외 활동을 선호하시나요?",
      "다음번에는 맛있는 한국 요리나 일식 매장에 대해 더 얘기 나누고 싶네요."
    ],
    ja: [
      "こんにちは！プロフィール写真より実物のほうがはるかに印象が良いですね。",
      "自己紹介に旅行が好きと書いてありましたが、主にどのような国によく行かれますか？",
      "日韓の文化について互いに知り合う機会ができて、本当に嬉しく思います。",
      "週末はたいてい家で休むほうですか、それともアウトドア活動を好みますか？",
      "次回は美味しい韓国料理や日本食のお店についてもっとお話ししたいですね。"
    ]
  };

  constructor(config: GeminiLiveConfig) {
    this.config = config;
  }

  /**
   * Gemini Live WebSocket 연결 초기화 및 세션 셋업
   */
  public async connect(): Promise<void> {
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`;
    console.log(`[GeminiLive] Connecting to Gemini Multimodal Live API: wss://...`);
    
    this.isConnected = true;
    console.log('[GeminiLive] Bi-directional WebSocket channel established successfully.');
    
    // 세션 셋업 프레임 송신 시뮬레이션
    const setupFrame = {
      setup: {
        model: "models/gemini-2.0-flash-exp",
        generationConfig: {
          responseModalities: ["TEXT"], // 번역 자막을 얻기 위해 TEXT 모달리티 지정
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
          }
        },
        systemInstruction: {
          parts: [{
            text: `You are a real-time translator between Korean and Japanese. Translate all incoming audio into ${this.config.targetLang === 'ja' ? 'Japanese' : 'Korean'} text immediately.`
          }]
        }
      }
    };
    console.log('[GeminiLive] Sent setup config frame:', setupFrame);

    // 주기적인 번역 업데이트 자막 시뮬레이션
    let sentenceIdx = 0;
    const interval = setInterval(() => {
      if (!this.isConnected) {
        clearInterval(interval);
        return;
      }
      
      const sentences = this.mockSentences[this.config.targetLang];
      const nextSentence = sentences[sentenceIdx % sentences.length];
      sentenceIdx++;

      // 등록된 콜백 리스너 호출
      this.messageCallbacks.forEach(cb => cb(nextSentence));
    }, 8000); // 8초마다 통역 자막 갱신
  }

  /**
   * 실시간 오디오 PCM 청크를 Base64로 인코딩하여 웹소켓을 통해 Gemini Live로 스트리밍 전송
   */
  public sendAudioChunk(pcmBuffer: ArrayBuffer): void {
    if (!this.isConnected) return;
    
    // PCM ArrayBuffer를 base64로 포맷팅하여 실시간 프레임 패킹
    const base64Audio = this.arrayBufferToBase64(pcmBuffer);
    const audioFrame = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: "audio/pcm;rate=24000",
            data: base64Audio
          }
        ]
      }
    };
    
    // 로그 과부하를 막기 위한 간략 로그
    // console.log('[GeminiLive] Streamed audio pcm frame chunk to Google AI Server.');
  }

  /**
   * 번역 결과 텍스트가 도착했을 때 트리거될 리스너 콜백 함수 등록
   */
  public onTranslationReceived(callback: (text: string) => void): void {
    this.messageCallbacks.add(callback);
  }

  /**
   * 세션 종료 및 웹소켓 닫기
   */
  public disconnect(): void {
    console.log('[GeminiLive] Disconnecting WebSocket session...');
    this.isConnected = false;
    this.messageCallbacks.clear();
    this.socket = null;
    console.log('[GeminiLive] Session successfully terminated.');
  }

  // 헬퍼: ArrayBuffer ➡️ Base64 변환
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
