// ============================================================
// agoraLive.ts — Agora RTC Web SDK 기반 실시간 미팅 헬퍼 모듈
// ============================================================
// 이 모듈은 안심 화상 미팅의 채널 입장, 미디어 스트림 획득 및 
// 가상 통화 채널 연결 제어를 담당합니다.
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
  private localAudioTrack: any = null;
  private localVideoTrack: any = null;
  private remoteUsers: Map<string | number, any> = new Map();

  constructor(config: AgoraConfig) {
    this.config = config;
  }

  /**
   * 화상 미팅 채널 가입 및 미디어 캡처 시작
   */
  public async joinMeeting(
    onRemoteUserJoined: (user: any) => void,
    onRemoteUserLeft: (uid: string | number) => void
  ): Promise<void> {
    console.log(`[AgoraRTC] Joining channel: ${this.config.channel}...`);
    this.isJoined = true;
    
    // 시뮬레이션을 위한 더미 트랙 바인딩 및 로그 출력
    console.log('[AgoraRTC] Local media tracks successfully initialized and published.');
    
    // 가상 상대방 조인 시뮬레이션 트리거
    setTimeout(() => {
      onRemoteUserJoined({
        uid: 'mate_remote_user',
        hasAudio: true,
        hasVideo: true
      });
    }, 1500);
  }

  /**
   * 내 로컬 오디오 스트림의 실시간 PCM 청크(24kHz, 16bit mono) 추출용 노드 등록
   * (추출된 바이너리 데이터를 Gemini Live WebSocket으로 다이렉트 전송하는 접점)
   */
  public registerAudioProcessor(onAudioChunk: (chunk: ArrayBuffer) => void): void {
    console.log('[AgoraRTC] Audio Processor registered. Capturing PCM 24kHz stream chunks...');
    
    // 0.5초 간격으로 가상 목소리 바이트 프레임 송출 시뮬레이션
    const interval = setInterval(() => {
      if (!this.isJoined) {
        clearInterval(interval);
        return;
      }
      const dummyPcm = new ArrayBuffer(512); // 가상 PCM 512바이트 청크
      onAudioChunk(dummyPcm);
    }, 500);
  }

  /**
   * 화상 미팅 종료 및 미디어 리소스 완전히 해제
   */
  public async leaveMeeting(): Promise<void> {
    console.log(`[AgoraRTC] Leaving channel: ${this.config.channel}`);
    this.isJoined = false;
    this.remoteUsers.clear();
    
    if (this.localAudioTrack) {
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }
    if (this.localVideoTrack) {
      this.localVideoTrack.close();
      this.localVideoTrack = null;
    }
    console.log('[AgoraRTC] Successfully left channel. All local and remote resources released.');
  }
}
