// ============================================================
// agoraLive.ts — Agora RTC Web SDK 기반 실시간 미팅 헬퍼 모듈
// ============================================================
// 이 모듈은 안심 화상 미팅의 채널 입장, 미디어 스트림 획득 및 
// 가상 통화 채널 연결 제어와 로컬 마이크 실시간 16kHz PCM 추출을 담당합니다.
// ============================================================

export interface AgoraConfig {
  appId: string;
  channel: string;
  token?: string | null;
  uid?: string | number | null;
}

export class AgoraLiveManager {
  private config: AgoraConfig;
  private isJoined: boolean = false;
  private localStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;

  constructor(config: AgoraConfig) {
    this.config = config;
  }

  /**
   * 화상 미팅 채널 가입 및 미디어 캡처 시작 (여기서는 실제 Agora Web SDK 대신 브라우저 MediaStream 획득으로 통합)
   */
  public async joinMeeting(
    onRemoteUserJoined: (user: any) => void,
    _onRemoteUserLeft: (uid: string | number) => void
  ): Promise<void> {
    console.log(`[AgoraRTC] Joining channel: ${this.config.channel}...`);
    this.isJoined = true;
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 320, height: 240, frameRate: 15 }
      });
      console.log('[AgoraRTC] Local media stream successfully initialized.');
      
      // 가상 상대방 조인 시뮬레이션
      setTimeout(() => {
        onRemoteUserJoined({
          uid: 'mate_remote_user',
          hasAudio: true,
          hasVideo: true
        });
      }, 1500);
    } catch (err) {
      console.error('[AgoraRTC] Failed to get user media:', err);
      throw err;
    }
  }

  /**
   * 내 로컬 오디오 스트림의 실시간 PCM 청크(16kHz, 16bit mono) 추출용 노드 등록
   * 추출 후 Base64 인코딩하여 onAudioChunk 콜백에 전달합니다.
   */
  public registerAudioProcessor(onAudioChunk: (pcmBase64: string) => void): void {
    if (!this.localStream) {
      console.warn('[AgoraRTC] Local stream not ready. Call joinMeeting first.');
      return;
    }

    console.log('[AgoraRTC] Initializing 16kHz PCM Audio Processor...');

    try {
      // 16000Hz로 강제 다운샘플링하여 AudioContext 생성
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.audioSource = this.audioCtx.createMediaStreamSource(this.localStream);

      // 4096 버퍼 사이즈를 가지는 ScriptProcessorNode 생성
      this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isJoined) return;

        const inputData = e.inputBuffer.getChannelData(0); // Float32 단일 채널 데이터
        const pcmBuffer = new ArrayBuffer(inputData.length * 2);
        const pcmView = new DataView(pcmBuffer);

        // Float32 [-1.0, 1.0] -> Int16 [-32768, 32767] 변환
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
          pcmView.setInt16(i * 2, val, true); // 리틀 엔디안 보존
        }

        // ArrayBuffer -> Base64 변환
        const base64Audio = this.arrayBufferToBase64(pcmBuffer);
        onAudioChunk(base64Audio);
      };

      this.audioSource.connect(this.processorNode);
      this.processorNode.connect(this.audioCtx.destination);
      console.log('[AgoraRTC] Audio Processor registered and running.');
    } catch (e) {
      console.error('[AgoraRTC] Error in registerAudioProcessor:', e);
    }
  }

  /**
   * 화상 미팅 종료 및 미디어 리소스 완전히 해제
   */
  public async leaveMeeting(): Promise<void> {
    console.log(`[AgoraRTC] Leaving channel: ${this.config.channel}`);
    this.isJoined = false;
    
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }
    if (this.audioCtx) {
      await this.audioCtx.close();
      this.audioCtx = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    console.log('[AgoraRTC] Successfully left channel. All local and remote resources released.');
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

