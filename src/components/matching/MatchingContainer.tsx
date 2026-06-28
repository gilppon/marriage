import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Lock, Unlock, Phone, Heart, Users, RefreshCw, Send, 
  AlertTriangle, Eye, Compass, X, Calendar, Video, UserCheck, 
  Volume2, VideoOff, MicOff, Clock 
} from 'lucide-react';
import Matter from 'matter-js';
import { useLanguage } from '../../contexts/LanguageContext';
import { GeminiLiveSession } from '../../lib/geminiLive';
import { AgoraLiveManager } from '../../lib/agoraLive';

// 번역 데이터 (ko / ja)
const TRANSLATIONS = {
  ko: {
    matchingTitle: 'AI 가치관 매칭 터널',
    searching: '가치관 부합 대상 탐색 중...',
    matchSuccess: '🎉 매칭 성공! 신원 검증 메이트 연결됨',
    compatScore: '가치관 호합도',
    radarTitle: '📊 4분면 가치관 부합 분석',
    aiAdvice: '💡 AI 매칭 분석 조언',
    badgeTitle: '🛡️ 상대 메이트의 신뢰 배지',
    badgeRequest: '🔒 상호주의 정보 공개 요청',
    badgeDesc: '상대방에게 배지 잠금 해제 동의 요청을 발송합니다. 상호주의 원칙에 따라 본인의 배지도 공개됩니다.',
    sendRequest: '공손한 경어체로 요청 발송 🚀',
    cancel: '취소',
    verified: '검증 완료',
    masked: '상호 동의 후 공개',
    chatPlaceholder: '대화를 입력하세요 (AI 실시간 스캠 감시 작동 중)',
    send: '전송',
    scamWarning: '🚨 AI 실시간 감시: 금전 정보 요구 및 양도 절대 금지!',
    burnoutTitle: '소개팅 앱 번아웃 원인과 Best-Saiko 대안 (드래그해 보세요)',
    upgradeBtn: '프리미엄 회원 업그레이드 (인증 배지 필터 활성화)',
    premiumStatus: '👑 프리미엄 회원 활성화됨',
    startMatchingBtn: '매칭 풀 대기열 합류하기',
    matchingQueueDesc: 'Firebase 인증 및 본인 확인 검증 완료 회원 대상 실시간 매칭',
    videoCallReservation: '영상통화 약속 잡기 🗓️',
    makeReservation: '영상통화 예약하기',
    enterVideoMeeting: '안심 영상 미팅 입장하기 📹',
    videoMeetingStatus: '안심 영상 미팅 (Assured Video Meeting)',
    privacySafe: '프라이버시 안전 보호 중',
    encryptedAlert: '영상 및 오디오 종단간 암호화 적용 중',
    bgBlurAlert: '배경 흐림(Background Blur) 모드 가동 중',
    requestIntermission: '잠시 휴식 요청 ☕',
    endRespectfully: '정중하게 통화 종료 👋',
    reservationCompleted: '🗓️ [영상통화 예약 완료] 상대방과 영상통화 약속이 체결되었습니다.',
  },
  ja: {
    matchingTitle: 'AI 価値観マッチングトンネル',
    searching: '価値観適合メンバーを探索中...',
    matchSuccess: '🎉 マッチング成立！本人確認済みメイト接続',
    compatScore: '価値観適合度',
    radarTitle: '📊 4象限価値観適合度分析',
    aiAdvice: '💡 AIマッチングアドバイス',
    badgeTitle: '🛡️ 相手メイトの信頼バッジ',
    badgeRequest: '🔒 相互主義バッジ公開リクエスト',
    badgeDesc: '相手にバッジロック解除同意リクエストを送信します。相互主義の原則に基づき、自身のバッジも公開されます。',
    sendRequest: '敬語でリクエスト送信 🚀',
    cancel: 'キャンセル',
    verified: '検証済み',
    masked: '相互同意後に開示',
    chatPlaceholder: 'メッセージを入力してください（AIスキャン監視作動中）',
    send: '送信',
    scamWarning: '🚨 AI監視: 金銭のやり取りや個人情報の受け渡しは固く禁じられています！',
    burnoutTitle: 'マッチングアプリのバーンアウト原因と解決策 (ドラッグ可能)',
    upgradeBtn: 'プレミアム会員アップグレード (認証バッジフィルター有効化)',
    premiumStatus: '👑 プレミアム会員アクティブ',
    startMatchingBtn: 'マッチングプール待機列に合流',
    matchingQueueDesc: 'Firebase認証および本人確認審査済みの会員対象リアルタイムマッチング',
  }
};

const MOCK_MATES = [
  {
    id: 'haruka',
    name: 'Haruka (하루카)',
    age: 26,
    location: 'Tokyo, Japan 🇯🇵',
    matchRate: 94,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    aiAdvice: '거주지(일본 이주)에 대해 약간의 조율이 필요하나, 자녀 계획과 종교관이 극도로 일치합니다. 상대방에게 따뜻하게 먼저 인사를 건네보세요.',
    aiAdviceJa: '居住地（日本移住）について少し調整が必要ですが、将来設計と宗教観が非常に一致しています。相手に温かく話しかけてみてください。',
    badges: [
      { id: 'identity', label: '미혼 인증 (Single)', key: 'maritalStatusVerified', expired: '3개월' },
      { id: 'job', label: '직장 인증 (Job)', key: 'employmentVerified', expired: '6개월' },
      { id: 'education', label: '학력 인증 (Education)', key: 'educationVerified', expired: '무제한' },
    ],
    radar: {
      x1: 85,
      y1: 90,
      x2: 75,
      y2: 88,
    }
  },
  {
    id: 'yui',
    name: 'Yui (유이)',
    age: 25,
    location: 'Osaka, Japan 🇯🇵',
    matchRate: 89,
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200',
    aiAdvice: '의사소통 성향과 문화적 호환성이 뛰어나며, 맞벌이 계획에 대한 서로의 가치관이 일치하여 훌륭한 대화가 예상됩니다.',
    aiAdviceJa: 'コミュニケーション傾向と文化的互換性に優れており、共働きの将来設計に対するお互いの価値観が一致しています。',
    badges: [
      { id: 'identity', label: '미혼 인증 (Single)', key: 'maritalStatusVerified', expired: '3개월' },
      { id: 'education', label: '학력 인증 (Education)', key: 'educationVerified', expired: '무제한' },
    ],
    radar: {
      x1: 90,
      y1: 85,
      x2: 80,
      y2: 92,
    }
  },
  {
    id: 'minji',
    name: 'Minji (민지)',
    age: 27,
    location: 'Seoul, Korea 🇰🇷',
    matchRate: 85,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    aiAdvice: '종교관과 미래 설계 선호도가 매우 조화롭습니다. 서울-도쿄 간 장거리 소통 방식에 대해 이야기를 나누어 보세요.',
    aiAdviceJa: '宗教観と将来設計の好みが非常に調和しています。ソウル-東京間の遠距離コミュニケーションについて話し合ってみてください。',
    badges: [
      { id: 'identity', label: '미혼 인증 (Single)', key: 'maritalStatusVerified', expired: '3개월' },
      { id: 'job', label: '직장 인증 (Job)', key: 'employmentVerified', expired: '6개월' },
    ],
    radar: {
      x1: 80,
      y1: 82,
      x2: 88,
      y2: 84,
    }
  }
];

interface MatchingContainerProps {
  user: any;
}

export default function MatchingContainer({ user: _user }: MatchingContainerProps) {
  const { lang } = useLanguage();
  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [activeMateIndex, setActiveMateIndex] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [badgesUnlocked, setBadgesUnlocked] = useState<Record<string, boolean>>({});
  
  // 모달 상태
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  
  // 영상통화 약속 & 미팅 스크린 상태
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('2026-06-30');
  const [bookingTime, setBookingTime] = useState('20:00');
  const [isBooked, setIsBooked] = useState(false);
  const [showMeetingScreen, setShowMeetingScreen] = useState(false);
  const [meetingTimeElapsed, setMeetingTimeElapsed] = useState(0);
  const [liveSubtitles, setLiveSubtitles] = useState('');

  // 채팅 상태
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'mate' | 'system', text: string }>>([]);
  const [inputVal, setInputVal] = useState('');
  const [scamAlert, setScamAlert] = useState(false);

  // Matter.js 및 미디어 통신 관련 ref
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const timerRef = useRef<any>(null);
  const agoraManagerRef = useRef<AgoraLiveManager | null>(null);
  const geminiSessionRef = useRef<GeminiLiveSession | null>(null);

  const t = (key: keyof typeof TRANSLATIONS.ko) => {
    return TRANSLATIONS[lang][key] || TRANSLATIONS.ko[key];
  };

  // 통화 미팅 타이머 효과 & 실시간 미디어 스트림 파이프라인 개설
  useEffect(() => {
    if (showMeetingScreen) {
      setMeetingTimeElapsed(0);
      setLiveSubtitles(lang === 'ko' ? '초저지연 Gemini 3.5 Live 실시간 통역 세션을 개설 중입니다...' : '超低遅延 Gemini 3.5 Live リアルタイム通訳セッションを開設中...');

      // 1. 타이머 가동
      timerRef.current = setInterval(() => {
        setMeetingTimeElapsed(prev => prev + 1);
      }, 1000);

      // 2. Agora RTC 및 Gemini Live WebSocket 연동 개설
      const targetLang = lang === 'ko' ? 'ja' : 'ko'; // 내 언어 기준 상대방 번역 타겟 언어 자동 설정
      
      const agora = new AgoraLiveManager({
        appId: 'agora_demo_app_id_123',
        channel: 'meeting_channel_best_saiko_777'
      });
      const gemini = new GeminiLiveSession({
        apiKey: 'AIzaSyDemoKey_Gemini35LiveApi_2026',
        sourceLang: lang,
        targetLang: targetLang
      });

      agoraManagerRef.current = agora;
      geminiSessionRef.current = gemini;

      const initStreaming = async () => {
        try {
          // A. 제미나이 웹소켓 서버 접속
          await gemini.connect();
          
          // B. 번역 수신 수신기 연결
          gemini.onTranslationReceived((translatedText) => {
            setLiveSubtitles(translatedText);
          });

          // C. 아고라 채널 합류 및 내 음성(PCM) 획득
          await agora.joinMeeting(
            (remoteUser) => {
              console.log('[App] Remote Mate User successfully joined Agora session:', remoteUser);
            },
            (remoteUid) => {
              console.log('[App] Remote Mate User left Agora session:', remoteUid);
            }
          );

          // D. 아고라 PCM 청크 ➡️ 제미나이 실시간 번역 웹소켓 다이렉트 스트림 전송 결합
          agora.registerAudioProcessor((pcmChunk) => {
            gemini.sendAudioChunk(pcmChunk);
          });

        } catch (err) {
          console.error('[App] Failed to establish real-time translation pipelines:', err);
        }
      };

      initStreaming();

    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      
      // 통화 해제 및 소켓 리소스 반환
      if (agoraManagerRef.current) {
        agoraManagerRef.current.leaveMeeting();
        agoraManagerRef.current = null;
      }
      if (geminiSessionRef.current) {
        geminiSessionRef.current.disconnect();
        geminiSessionRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (agoraManagerRef.current) {
        agoraManagerRef.current.leaveMeeting();
      }
      if (geminiSessionRef.current) {
        geminiSessionRef.current.disconnect();
      }
    };
  }, [showMeetingScreen]);

  // 영상 통화 예약 시뮬레이션
  const handleBookCall = () => {
    setIsBooked(true);
    setShowBookingModal(false);
    
    // 시스템 알림 및 상대 반응 추가
    setMessages(prev => [
      ...prev,
      { sender: 'system', text: `🗓️ [예약 완료] ${bookingDate} ${bookingTime}에 영상통화 미팅이 매칭 상대방과 확정되었습니다.` },
      { sender: 'mate', text: lang === 'ko' ? '약속 시간에 늦지 않게 접속할게요! 그때 봬요 😊' : '約束の時間に遅れないように接続しますね！その時にお会いしましょう 😊' }
    ]);
  };

  // 매칭 검색 시뮬레이션
  const startSearch = () => {
    if (!_user) {
      alert(lang === 'ko' 
        ? '⚠️ 로그인이 필요한 서비스입니다. 상단 우측의 [Sign In] 버튼을 통해 로그인 후 대기열에 합류할 수 있습니다.' 
        : '⚠️ ログインが必要なサービスです。右上隅 of [Sign In] 버튼을 통해 로그인 후 대기열에 합류할 수 있습니다.'
      );
      return;
    }

    setIsSearching(true);
    setMatchFound(false);
    setIsBooked(false);
    setShowMeetingScreen(false);

    setBadgesUnlocked({});
    setScamAlert(false);
    setMessages([]);
    
    setTimeout(() => {
      setIsSearching(false);
      setMatchFound(true);
      setMessages([
        { sender: 'system', text: lang === 'ko' ? '🔒 안전한 종단간 암호화 터널이 활성화되었습니다.' : '🔒 安全なエンドツーエンド暗号化トンネルが有効化されました。' },
        { sender: 'mate', text: lang === 'ko' ? '안녕하세요! 반갑습니다. 가치관 매칭으로 연결되었네요 😊' : 'こんにちは！はじめまして。価値観マッチングで繋がりましたね 😊' }
      ]);
    }, 3000);
  };

  // 채팅 전송
  const sendMessage = () => {
    if (!inputVal.trim()) return;
    const userMsg = inputVal.toLowerCase();
    
    const newMsgs = [...messages, { sender: 'user' as const, text: inputVal }];
    setMessages(newMsgs);
    setInputVal('');

    // 실시간 AI 스캠 감시 기능 (금전 유도 감지)
    if (userMsg.includes('돈') || userMsg.includes('계좌') || userMsg.includes('송금') || userMsg.includes('money') || userMsg.includes('bank') || userMsg.includes('gift') || userMsg.includes('기프트')) {
      setScamAlert(true);
    }

    // 상대방 자동 답변 시뮬레이션
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { sender: 'mate', text: lang === 'ko' ? '가치관 분석 그래프를 봤는데 저희 성향이 정말 비슷하게 나왔어요!' : '価値観分析グラフを見ましたが、私たちの相性が本当にそっくりですね！' }
      ]);
    }, 1500);
  };

  // 배지 공개 동의 요청 발송
  const sendBadgeRequest = () => {
    if (!selectedBadge) return;
    setBadgesUnlocked(prev => ({ ...prev, [selectedBadge.id]: true }));
    setRequestModalOpen(false);
    
    // 시스템 알림 메시지 추가
    setMessages(prev => [
      ...prev,
      { sender: 'system', text: `🔓 [상호주의] 상대방과 나의 '${selectedBadge.label}' 정보가 교환되어 잠금 해제되었습니다.` }
    ]);
  };

  // Matter.js 피지컬 샌드박스 설정
  useEffect(() => {
    if (!sceneRef.current) return;

    // 기존 DOM 및 엔진 청소
    sceneRef.current.innerHTML = '';
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, false);
      Matter.Engine.clear(engineRef.current);
    }

    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

    const width = sceneRef.current.clientWidth || 600;
    const height = 300;

    const engine = Engine.create({
      gravity: { y: 0.8 }
    });
    engineRef.current = engine;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#181524',
      }
    });

    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);

    // 경계 벽 생성
    const wallOptions = { isStatic: true, render: { visible: false } };
    const ground = Bodies.rectangle(width / 2, height + 30, width * 2, 60, wallOptions);
    const leftWall = Bodies.rectangle(-30, height / 2, 60, height * 2, wallOptions);
    const rightWall = Bodies.rectangle(width + 30, height / 2, 60, height * 2, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -30, width * 2, 60, wallOptions);

    Composite.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // 번아웃 원인 블록 (빨간색/보라색 톤)
    const burnoutItems = [
      { text: lang === 'ko' ? '성비 8:2 스와이프 피로' : '性比8:2スワイプ疲労', fill: '#FF5252' },
      { text: lang === 'ko' ? '외모/스펙 줄세우기' : '外見・スペック並べ', fill: '#E040FB' },
      { text: lang === 'ko' ? '가짜 프로필/스캠' : 'サクラ・ロマンス詐欺', fill: '#FF1744' },
    ];

    // Best-Saiko 대안 블록 (사쿠라 코랄 핑크 & 에메랄드 톤)
    const alternativeItems = [
      { text: lang === 'ko' ? '미혼/재직 서류 인증' : '独身・仕事公認書類認証', fill: '#FF8A80' },
      { text: lang === 'ko' ? '가치관 세미 블라인드' : '価値観ブラインドマッチ', fill: '#00E5FF' },
      { text: lang === 'ko' ? '상호주의 배지 공개' : '相互主義バッジ開示', fill: '#69F0AE' },
    ];

    const blocks: Matter.Body[] = [];

    // 블록 생성 함수
    const createBlock = (text: string, x: number, y: number, color: string) => {
      const w = text.length * 12 + 20;
      const h = 40;
      const block = Bodies.rectangle(x, y, w, h, {
        restitution: 0.6,
        friction: 0.3,
        render: {
          fillStyle: color,
          strokeStyle: '#ffffff',
          lineWidth: 1
        }
      });
      // 렌더링 시 텍스트 보존을 위한 속성 추가
      (block as any).customText = text;
      return block;
    };

    burnoutItems.forEach((item, idx) => {
      const block = createBlock(item.text, width / 4 + idx * 40, 50, item.fill);
      blocks.push(block);
    });

    alternativeItems.forEach((item, idx) => {
      const block = createBlock(item.text, (width * 3) / 4 - idx * 40, 80, item.fill);
      blocks.push(block);
    });

    Composite.add(engine.world, blocks);

    // 마우스 드래그 컨트롤 추가
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });

    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // Matter.js 캔버스 위에 글자 그리기 이벤트 연동
    Matter.Events.on(render, 'afterRender', () => {
      const context = render.context;
      context.font = 'bold 12px monospace';
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      const bodies = Composite.allBodies(engine.world);
      bodies.forEach(body => {
        const text = (body as any).customText;
        if (text) {
          context.save();
          context.translate(body.position.x, body.position.y);
          context.rotate(body.angle);
          context.fillStyle = '#0D0B14'; // 다크 텍스트로 블록 내부 선명도 증가
          context.fillText(text, 0, 0);
          context.restore();
        }
      });
    });

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, [lang]);

  return (
    <div className="w-full min-h-screen bg-md3-background text-white px-4 py-8 flex flex-col items-center">
      {/* 상단 랭귀지 토글 & 멤버십 현황 */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Shield className="text-md3-primary animate-pulse" size={24} />
          <h1 className="text-xl font-bold tracking-tight uppercase">{t('matchingTitle')}</h1>
        </div>
        <div className="flex items-center gap-4">
          
          <button
            onClick={() => setIsPremium(p => !p)}
            className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-all ${
              isPremium 
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black' 
                : 'bg-md3-surface text-white border border-white/20 hover:border-md3-primary'
            }`}
          >
            {isPremium ? t('premiumStatus') : t('upgradeBtn')}
          </button>
        </div>
      </div>

      {/* 실시간 매칭 상태 창 */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* 왼쪽 영역: 매칭 검색기 & 상대방 매칭 정보 카드 */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* 매칭 컨트롤러 */}
          <div className="p-6 rounded-2xl bg-md3-surface border border-white/10 flex flex-col items-center text-center">
            <Compass className={`text-md3-accent mb-4 ${isSearching ? 'animate-spin' : ''}`} size={44} />
            <h2 className="text-lg font-medium mb-2">{isSearching ? t('searching') : t('matchingTitle')}</h2>
            <p className="text-xs text-white/50 mb-6 max-w-md">{t('matchingQueueDesc')}</p>
            
            <button
              onClick={startSearch}
              disabled={isSearching}
              className="px-8 py-3 rounded-lg bg-md3-primary text-black font-semibold hover:bg-md3-primary/80 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={isSearching ? 'animate-spin' : ''} />
              {t('startMatchingBtn')}
            </button>
          </div>

          {/* 추천 매칭된 회원 목록 */}
          {matchFound && (
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none w-full max-w-full">
              {MOCK_MATES.map((mate, idx) => (
                <button
                  key={mate.id}
                  onClick={() => setActiveMateIndex(idx)}
                  className={`flex items-center gap-3 p-3 rounded-xl border shrink-0 text-left cursor-pointer transition-all ${
                    activeMateIndex === idx
                      ? 'bg-md3-primary/10 border-md3-primary/50 ring-1 ring-md3-primary/30'
                      : 'bg-md3-surface border-white/10 hover:bg-white/5'
                  }`}
                >
                  <img
                    src={mate.avatar}
                    alt={mate.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/15"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {mate.name.split(' ')[0]}
                      <span className="text-[10px] text-white/50">{mate.age}세</span>
                    </h4>
                    <span className="text-[9px] text-md3-accent font-semibold">{mate.matchRate}% Match</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 상대방 매칭 카드 */}
          {matchFound && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-md3-surface border border-white/20 flex flex-col gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-md3-accent text-black font-bold px-4 py-1.5 rounded-bl-xl text-sm flex items-center gap-1">
                <Heart size={14} className="fill-current" />
                {MOCK_MATES[activeMateIndex].matchRate}%
              </div>

              {/* 기본 프로필 */}
              <div className="flex gap-4 items-center">
                <img 
                  src={MOCK_MATES[activeMateIndex].avatar} 
                  alt={MOCK_MATES[activeMateIndex].name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-md3-primary"
                />
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {MOCK_MATES[activeMateIndex].name}
                    <span className="text-sm font-normal text-white/60">{MOCK_MATES[activeMateIndex].age}세</span>
                  </h3>
                  <p className="text-xs text-white/40">{MOCK_MATES[activeMateIndex].location}</p>
                </div>
              </div>

              {/* AI 조언 */}
              <div className="p-4 rounded-xl bg-md3-background border border-white/5">
                <h4 className="text-xs font-semibold text-md3-accent uppercase tracking-wider mb-1">{t('aiAdvice')}</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  {lang === 'ko' ? MOCK_MATES[activeMateIndex].aiAdvice : MOCK_MATES[activeMateIndex].aiAdviceJa}
                </p>
              </div>

              {/* 4분면 SVG 레이더 호합도 차트 */}
              <div className="p-4 rounded-xl bg-md3-background border border-white/5 flex flex-col items-center">
                <h4 className="text-xs font-semibold text-white/60 mb-4">{t('radarTitle')}</h4>
                <div className="relative w-48 h-48 border border-white/10 rounded-full flex items-center justify-center">
                  {/* 축 표시 */}
                  <div className="absolute w-full h-[1px] bg-white/10" />
                  <div className="absolute h-full w-[1px] bg-white/10" />
                  
                  {/* 라벨 */}
                  <span className="absolute -top-5 text-[9px] text-white/40">가치관</span>
                  <span className="absolute -bottom-5 text-[9px] text-white/40">미래설계</span>
                  <span className="absolute -left-10 text-[9px] text-white/40">의사소통</span>
                  <span className="absolute -right-12 text-[9px] text-white/40">문화호환</span>

                  {/* 레이더 도형 그리기 */}
                  <svg className="absolute w-full h-full pointer-events-none" viewBox="0 0 200 200">
                    <polygon
                      points={`
                        100,${100 - MOCK_MATES[activeMateIndex].radar.x1 * 0.8} 
                        ${100 + MOCK_MATES[activeMateIndex].radar.y2 * 0.8},100 
                        100,${100 + MOCK_MATES[activeMateIndex].radar.y1 * 0.8} 
                        ${100 - MOCK_MATES[activeMateIndex].radar.x2 * 0.8},100
                      `}
                      fill="rgba(255, 138, 128, 0.25)"
                      stroke="#FF8A80"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              {/* 신뢰 배지 세션 */}
              <div>
                <h4 className="text-xs font-semibold text-white/60 mb-3">{t('badgeTitle')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MOCK_MATES[activeMateIndex].badges.map(badge => {
                    const isUnlocked = badgesUnlocked[badge.id];
                    return (
                      <div 
                        key={badge.id} 
                        className={`p-3 rounded-lg border flex flex-col justify-between h-20 transition-all ${
                          isUnlocked 
                            ? 'bg-md3-primary/10 border-md3-primary' 
                            : 'bg-md3-surface border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-medium text-white/80">{badge.label}</span>
                          {isUnlocked ? (
                            <Unlock size={12} className="text-md3-primary" />
                          ) : (
                            <Lock size={12} className="text-white/40" />
                          )}
                        </div>
                        
                        {isUnlocked ? (
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-md3-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-md3-primary animate-ping" />
                            {t('verified')} ({badge.expired})
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedBadge(badge);
                              setRequestModalOpen(true);
                            }}
                            className="w-full py-1 mt-2 rounded bg-white/5 border border-white/10 text-[9px] hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                          >
                            <Eye size={10} />
                            {t('badgeRequest')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}

        </div>

        {/* 오른쪽 영역: 실시간 보안 안심 대화 터널 (채팅창) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="h-full min-h-[490px] rounded-2xl bg-md3-surface border border-white/10 flex flex-col overflow-hidden relative">
            
            {/* 채팅 헤더 */}
            <div className="px-6 py-4 border-b border-white/10 bg-md3-background flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-semibold tracking-wider text-white/60">SECURE TUNNEL</span>
              </div>
              <div className="flex gap-2 items-center">
                {matchFound && (
                  <>
                    {isBooked ? (
                      <button
                        onClick={() => setShowMeetingScreen(true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Video size={12} />
                        {t('enterVideoMeeting')}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowBookingModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1.5 transition-all border border-white/10"
                      >
                        <Calendar size={12} className="text-md3-primary" />
                        {t('videoCallReservation')}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 채팅 내용 영역 */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 max-h-[390px]">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-white/30 my-auto">
                  {lang === 'ko' ? '매칭 대기열에 합류하여 대화를 나누어보세요.' : 'マッチング待機列に参加して会話を始めてみましょう。'}
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex flex-col ${
                      msg.sender === 'user' 
                        ? 'items-end' 
                        : msg.sender === 'system' 
                        ? 'items-center' 
                        : 'items-start'
                    }`}
                  >
                    {msg.sender === 'system' ? (
                      <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[9px] text-white/50 text-center">
                        {msg.text}
                      </div>
                    ) : (
                      <div 
                        className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-md3-primary text-black font-medium rounded-tr-none'
                            : 'bg-md3-background text-white rounded-tl-none border border-white/10'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* AI 스캠 경고 배너 */}
            {scamAlert && (
              <div className="bg-red-500/10 border-y border-red-500/20 px-4 py-2 flex items-center gap-2">
                <AlertTriangle className="text-red-500 shrink-0" size={16} />
                <span className="text-[10px] text-red-400 font-medium">{t('scamWarning')}</span>
              </div>
            )}

            {/* 채팅 입력 */}
            <div className="p-4 bg-md3-background border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder={t('chatPlaceholder')}
                disabled={!matchFound}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-md3-surface border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-md3-primary disabled:opacity-50 text-white"
              />
              <button
                onClick={sendMessage}
                disabled={!matchFound}
                className="p-2.5 rounded-lg bg-md3-primary text-black disabled:opacity-50 hover:bg-md3-primary/80 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* 하단부: Matter.js 피지컬 샌드박스 영역 */}
      <div className="w-full max-w-5xl rounded-2xl bg-md3-surface border border-white/10 p-6">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Users size={14} />
          {t('burnoutTitle')}
        </h3>
        
        <div 
          ref={sceneRef} 
          className="w-full h-[300px] rounded-xl overflow-hidden border border-white/10 relative"
        />
      </div>

      {/* 상호주의 정보 공개 요청 모달 */}
      <AnimatePresence>
        {requestModalOpen && selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 백드롭 */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setRequestModalOpen(false)}
              className="absolute inset-0 bg-black"
            />
            
            {/* 다이얼로그 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-md3-surface border border-white/20 p-6 rounded-2xl max-w-md w-full z-10"
            >
              <button 
                onClick={() => setRequestModalOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                <Lock size={16} className="text-md3-primary" />
                {t('badgeRequest')}
              </h3>

              <div className="p-3 bg-md3-primary/10 rounded-lg text-md3-primary text-xs font-semibold mb-4">
                요청 배지: {selectedBadge.label}
              </div>

              <p className="text-xs text-white/60 leading-relaxed mb-6">
                {t('badgeDesc')}
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setRequestModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                >
                  {t('cancel')}
                </button>
                
                <button
                  onClick={sendBadgeRequest}
                  className="px-5 py-2 rounded-lg bg-md3-primary text-black font-semibold text-xs hover:bg-md3-primary/80 transition-colors"
                >
                  {t('sendRequest')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 영상통화 약속 예약 모달 */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-black"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-md3-surface border border-white/20 p-6 rounded-2xl max-w-sm w-full z-10"
            >
              <button 
                onClick={() => setShowBookingModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-md3-primary" />
                {t('videoCallReservation')}
              </h3>

              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-bold block mb-1.5">Date (날짜)</label>
                  <input 
                    type="date" 
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full bg-[#181524] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-white focus:border-md3-primary"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-bold block mb-1.5">Time (시간)</label>
                  <input 
                    type="time" 
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="w-full bg-[#181524] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-white focus:border-md3-primary"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* 프라이버시/하트 공지 */}
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-white/50 leading-normal mb-6 flex gap-2">
                <Shield size={16} className="text-emerald-400 shrink-0" />
                <p>
                  안심 영상 미팅 시 자동 배경 흐림과 영상 암호화가 적용됩니다. 
                  (Pro 회원은 일일 60분 무료, 일반회원은 통화 시 분당 하트 1개가 차감됩니다.)
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleBookCall}
                  className="px-5 py-2 rounded-lg bg-md3-primary text-black font-semibold text-xs hover:bg-md3-primary/80 transition-colors"
                >
                  {t('makeReservation')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📹 안심 영상 미팅 전체화면 시네마틱 오버레이 (Assured Video Meeting Fullscreen Modal) */}
      <AnimatePresence>
        {showMeetingScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#07050A] flex flex-col font-sans overflow-hidden"
          >
            {/* 1. 상단 타임 바 및 보안 헤더 */}
            <div className="w-full bg-[#110E18]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <Shield size={14} />
                  <span>{t('videoMeetingStatus')}</span>
                </div>
                <span className="hidden sm:inline text-xs text-white/40">|</span>
                <span className="hidden sm:inline text-xs text-white/60 font-medium">{t('encryptedAlert')}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#1A1626] border border-white/5 px-3 py-1.5 rounded-lg text-white/70 text-xs font-semibold">
                  <Clock size={12} className="text-[#FF8A80]" />
                  <span>Slot: 30 Mins</span>
                </div>
                <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-red-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>
                    {Math.floor(meetingTimeElapsed / 60)}:
                    {String(meetingTimeElapsed % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. 메인 스크린 영역: 데스크톱 기준 65% : 35% 가로분할 레이아웃 */}
            <div className="flex-1 w-full flex flex-col lg:flex-row p-6 gap-6 overflow-hidden max-w-7xl mx-auto items-stretch">
              
              {/* 좌측 패널: 상대방 카메라 화면 (65% 비율) */}
              <div className="flex-1 lg:flex-[1.8] relative rounded-3xl overflow-hidden border border-white/10 bg-[#120F1D] flex flex-col justify-end shadow-2xl">
                {/* 실물 영상 묘사 배경 이미지 */}
                <img 
                  src={MOCK_MATES[activeMateIndex].avatar} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover opacity-80 filter brightness-90 transition-transform duration-1000 scale-105"
                />
                
                {/* 비디오 프레임 오버레이 그라데이션 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* 상대방 이름 및 프로필 배지 */}
                <div className="absolute top-6 left-6 z-10 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full border border-white/20 overflow-hidden">
                    <img src={MOCK_MATES[activeMateIndex].avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">{MOCK_MATES[activeMateIndex].name}</p>
                    <p className="text-[9px] text-[#FF8A80] font-semibold mt-1">{t('verified')}</p>
                  </div>
                </div>

                {/* 실시간 와이드 자막 번역 인터페이스 */}
                <div className="relative z-10 w-full p-6">
                  <div className="w-full bg-black/60 backdrop-blur-lg border border-white/15 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF8A80]">AI Live Translation</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A80] animate-pulse" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-400 leading-relaxed">
                      🤖 {liveSubtitles}
                    </p>
                  </div>
                </div>
              </div>

              {/* 우측 패널: 내 카메라 화면 (35% 비율 - 오프셋 프레임 디자인) */}
              <div className="lg:flex-[1] relative rounded-3xl overflow-hidden border border-white/10 bg-[#141122] flex flex-col justify-end shadow-2xl">
                {/* 나의 가상 카메라 비디오 스트림 (Unsplash 남성/여성 중립 프로필 활용) */}
                <img 
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300"
                  alt="My Camera Stream"
                  className="absolute inset-0 w-full h-full object-cover filter blur-md opacity-70 transition-all duration-700 hover:blur-none"
                />

                {/* 흐림 효과 오버레이 및 경계 */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" />

                {/* 우측 상단 실시간 LIVE 및 보안 배지 */}
                <div className="absolute top-6 right-6 z-10 flex gap-1.5 items-center">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    LIVE
                  </span>
                </div>

                {/* 내 비디오 채널 라벨 및 상태 */}
                <div className="relative z-10 p-6 text-left bg-gradient-to-t from-black/90 via-black/35 to-transparent w-full">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UserCheck size={14} className="text-md3-primary" />
                    <span>My Stream (나)</span>
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <span>●</span>
                    <span>{t('privacySafe')}</span>
                  </p>
                  <p className="text-[9px] text-white/40 mt-1 leading-relaxed">
                    {t('bgBlurAlert')}
                  </p>
                </div>
              </div>

            </div>

            {/* 3. 하단 컨트롤 플로팅 컨트롤러 바 */}
            <div className="w-full bg-[#110E18]/90 backdrop-blur-lg border-t border-white/10 px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              
              {/* 왼쪽: 오디오/비디오 간편 토글 단축키 */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => alert(lang === 'ko' ? '마이크가 음소거되었습니다.' : 'マイクがミュートされました。')}
                  className="p-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition-all shadow-lg"
                >
                  <MicOff size={16} />
                </button>
                <button 
                  onClick={() => alert(lang === 'ko' ? '비디오 송출을 일시 중단합니다.' : 'ビデオ送出を一時中断します。')}
                  className="p-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition-all shadow-lg"
                >
                  <VideoOff size={16} />
                </button>
              </div>

              {/* 오른쪽: 격식있고 존중하는 액션 제어 버튼 */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    alert(lang === 'ko' ? '☕ 상대방에게 공손하게 잠시 휴식 시간(Intermission)을 요청합니다.' : '☕ 相手に丁寧に一時的な休憩(Intermission)を要請します。');
                  }}
                  className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg"
                >
                  <Volume2 size={14} className="text-emerald-400" />
                  {t('requestIntermission')}
                </button>
                
                <button
                  onClick={() => setShowMeetingScreen(false)}
                  className="px-6 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
                >
                  <VideoOff size={14} />
                  {t('endRespectfully')}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
