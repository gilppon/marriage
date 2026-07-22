import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageSquare, Lock, 
  Sparkles, CheckCircle2, Heart, ArrowRight, X 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Member {
  id: string;
  name: string;
  age: number;
  location: string;
  tier: 'Free' | 'Basic' | 'Pro';
  avatar: string;
  bio: string;
  bioJa: string;
  badges: string[];
  travelSchedule?: {
    destination: 'KR' | 'JP';
    city: string;
    dateRange: string;
  };
  styleTag?: string;
}

const EXPLORE_MEMBERS: Member[] = [
  {
    id: 'haruka',
    name: 'Haruka (하루카)',
    age: 26,
    location: 'Tokyo, Japan 🇯🇵',
    tier: 'Pro',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    bio: '도쿄에서 웹 디자이너로 일하고 있어요. 가치관이 맞는 따뜻한 인연을 만나 한국으로 이주할 준비가 되어 있습니다.',
    bioJa: '東京でウェブデザイナーとして働いています。価値観の合う温かいパートナーに出会い、韓国へ移住する準備ができています。',
    badges: ['identity', 'job', 'education'],
    travelSchedule: { destination: 'KR', city: 'Seoul', dateRange: '8/15 ~ 8/20' },
    styleTag: '청순함'
  },
  {
    id: 'yui',
    name: 'Yui (유이)',
    age: 25,
    location: 'Osaka, Japan 🇯🇵',
    tier: 'Basic',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200',
    bio: '요리와 산책을 좋아하는 간호사입니다. 서로 존중하며 평생을 함께할 동반자를 한국에서 찾고 싶어요.',
    bioJa: '料理と散歩が好きな看護師です。お互いを尊重し合い、生涯を共にするパートナーを韓国で探したいです。',
    badges: ['identity', 'education'],
    travelSchedule: { destination: 'KR', city: 'Busan', dateRange: '9/01 ~ 9/05' },
    styleTag: '친근함'
  },
  {
    id: 'minji',
    name: 'Minji (민지)',
    age: 27,
    location: 'Seoul, Korea 🇰🇷',
    tier: 'Free',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    bio: '밝고 긍정적인 성격의 한국인입니다. 일본 문화와 언어에 관심이 많아 도쿄 등 해외 생활 조율도 적극 찬성합니다.',
    bioJa: '明るくポジティブな性格の韓国人です。日本文化と言語に関心が高く、東京などの海外生活の調整も歓迎します。',
    badges: ['identity', 'job'],
    travelSchedule: { destination: 'JP', city: 'Tokyo', dateRange: '8/25 ~ 8/30' },
    styleTag: '지적임'
  },
  {
    id: 'kenji',
    name: 'Kenji (켄지)',
    age: 29,
    location: 'Yokohama, Japan 🇯🇵',
    tier: 'Pro',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    bio: 'IT 기업에서 엔지니어로 일하는 켄지입니다. 한국어 공부를 열심히 하고 있어 일상 대화가 가능합니다.',
    bioJa: 'IT企業でエンジニアとして働くケンジです。韓国語の勉強を熱心に行っており、日常会話が可能です。',
    badges: ['identity', 'job', 'education'],
    travelSchedule: { destination: 'KR', city: 'Seoul', dateRange: '9/10 ~ 9/15' },
    styleTag: 'K-Pop'
  },
  {
    id: 'yuki',
    name: 'Yuki (유키)',
    age: 24,
    location: 'Fukuoka, Japan 🇯🇵',
    tier: 'Free',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    bio: '후쿠오카에서 카페를 운영 중입니다. 다정다감하고 가치관이 통하는 인연을 기다립니다.',
    bioJa: '福岡でカフェを運営しています。思いやりがあり、価値観の通じ合えるパートナーを待っています。',
    badges: ['identity'],
    styleTag: '도회적'
  }
];

export default function ExplorePage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'explore' | 'chats'>('explore');
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [filterPremiumOnly, setFilterPremiumOnly] = useState(false);
  const [selectedStyleTag, setSelectedStyleTag] = useState<string>('ALL');
  const [travelFilterOnly, setTravelFilterOnly] = useState<boolean>(false);

  // 무료/유료 매칭 토글 제어
  const handleToggleFilter = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
    } else {
      setFilterPremiumOnly(!filterPremiumOnly);
    }
  };

  const handleUpgrade = () => {
    setIsPremium(true);
    setFilterPremiumOnly(true);
    setShowUpgradeModal(false);
  };

  const filteredMembers = EXPLORE_MEMBERS.filter(m => {
    if (filterPremiumOnly && m.tier === 'Free') return false;
    if (selectedStyleTag !== 'ALL' && m.styleTag !== selectedStyleTag) return false;
    if (travelFilterOnly && !m.travelSchedule) return false;
    return true;
  });

  const styleTags = ['ALL', 'K-Pop', '청순함', '지적임', '친근함', '도회적'];

  return (
    <div className="w-full min-h-screen bg-[#0D0B18] text-white pt-24 pb-16 px-4 md:px-8 flex flex-col items-center font-sans">
      
      {/* 타이틀 및 가치관 연동 상단 배너 */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="text-[#D4AF37]" size={26} />
            {lang === 'ko' ? '한일 파트너 탐색 피드' : '日韓パートナー探訪フィード'}
          </h1>
          <p className="text-xs text-white/50 mt-1">
            {lang === 'ko' 
              ? '가치관 인증을 완료한 진정성 있는 한일 매칭 파트너들을 만나보세요.' 
              : '価値観の認証を完了した信頼性の高い日韓マッチングパートナーに出会いましょう。'}
          </p>
        </div>

        {/* 멤버십 등급 칩 */}
        <div className="flex items-center gap-2.5 bg-[#141221] border border-white/5 rounded-full px-4 py-2">
          <span className="text-[10px] text-white/40 tracking-wider font-bold">MEMBERSHIP STATE</span>
          <button 
            onClick={() => setIsPremium(!isPremium)}
            className={`px-3 py-1 rounded text-[9.5px] font-bold transition-all shadow-md ${
              isPremium 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-[#0D0B18]' 
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
            }`}
          >
            {isPremium ? 'PRO MEMBER 💎' : 'FREE PASS 🔓'}
          </button>
        </div>
      </div>

      {/* 가치관 퀴즈 유도 배너 */}
      <div className="w-full max-w-5xl rounded-2xl bg-gradient-to-r from-[#141221] to-[#1C172E] border border-white/5 p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] text-[8px] font-bold uppercase tracking-wider">AI MATCHING</span>
            <Sparkles size={14} className="text-[#D4AF37] animate-pulse" />
          </div>
          <h2 className="text-sm font-bold text-white mb-1">
            {lang === 'ko' ? '아직 나의 가치관 진단을 받지 않으셨나요?' : 'まだ私の価値観診断を受けていませんか？'}
          </h2>
          <p className="text-[11px] text-white/60 leading-relaxed max-w-2xl">
            {lang === 'ko'
              ? '1분 가치관 검사(Marriage-MBTI)를 완료하시면, 인공지능이 매칭률 90% 이상의 이성들만 선별하여 AI 가치관 매칭 터널을 개통해 드립니다.'
              : '1分間の価値観診断を完了すると、AIがマッチング率90%以上の異性を厳選し、AI価値観マッチングトンネルを開通します。'}
          </p>
        </div>
        <button
          onClick={() => {
            if (!user) {
              alert(lang === 'ko' ? '⚠️ 결과 저장을 위해 로그인이 필요합니다. 화면 상단 우측의 [Sign In]을 통해 로그인해 주십시오.' : '⚠️ 結果保存のためにログインが必要です。画面右上の[Sign In]からログインしてください。');
              return;
            }
            navigate('/matching');
          }}
          className="relative z-10 shrink-0 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C29E30] text-[#0D0B18] font-bold text-[11px] flex items-center gap-1.5 shadow-lg transition-all"
        >
          {lang === 'ko' ? 'AI 가치관 진단하러 가기' : 'AI価値観診断に進む'}
          <ArrowRight size={12} />
        </button>
      </div>

      {/* 탭 내비게이션 & 필터링 정밀 스위치 */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
        {/* 탭 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'explore' 
                ? 'bg-[#D4AF37] text-[#0D0B18] font-bold' 
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Users size={14} />
            {lang === 'ko' ? '한일 파트너 목록' : '日韓パートナー一覧'}
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'chats' 
                ? 'bg-[#D4AF37] text-[#0D0B18] font-bold' 
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <MessageSquare size={14} />
            {lang === 'ko' ? '진행 중인 대화방' : '進行中の会話室'}
          </button>
        </div>

        {/* 필터 - Explore 탭일 때만 활성화 */}
        {activeTab === 'explore' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {/* 이상형 스타일 칩 바 */}
            <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
              {styleTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedStyleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                    selectedStyleTag === tag
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  {tag === 'ALL' ? (lang === 'ko' ? '스타일 전체' : 'スタイル全般') : `#${tag}`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs shrink-0">
              {/* 여행 일정 있는 유저만 보기 토글 */}
              <button
                onClick={() => setTravelFilterOnly(!travelFilterOnly)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1 ${
                  travelFilterOnly
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                <span>✈️</span>
                <span>{lang === 'ko' ? '방한/방일 일정 멤버만' : '渡韓・渡日メンバーのみ'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">{lang === 'ko' ? '유료 회원만' : '有料のみ'}</span>
                <button
                  onClick={handleToggleFilter}
                  className={`w-9 h-4 rounded-full p-0.5 transition-colors relative ${
                    filterPremiumOnly ? 'bg-[#D4AF37]' : 'bg-white/20'
                  }`}
                >
                  <div 
                    className={`w-3 h-3 rounded-full bg-[#0D0B18] shadow-md transition-transform transform ${
                      filterPremiumOnly ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 메인 리스트 컨텐츠 */}
      <div className="w-full max-w-5xl">
        {activeTab === 'explore' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMembers.map(member => (
              <div 
                key={member.id}
                className="bg-[#141221] rounded-2xl overflow-hidden border border-white/5 hover:border-[#D4AF37]/30 transition-all flex flex-col justify-between shadow-xl relative"
              >
                {/* 상단 대형 사진 영역 */}
                <div 
                  className="relative w-full h-56 overflow-hidden cursor-pointer"
                  onClick={() => {
                    if (!user) {
                      alert(lang === 'ko' ? '⚠️ 프로필 상세 열람을 하려면 로그인이 필요합니다. 화면 상단 우측의 [Sign In]을 통해 로그인해 주십시오.' : '⚠️ プロフィール詳細の閲覧にはログインが必要です。画面右上の[Sign In]からログインしてください。');
                      return;
                    }
                    if (!isPremium) {
                      setShowUpgradeModal(true);
                    }
                  }}
                >
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      !isPremium ? 'blur-md select-none pointer-events-none brightness-75 scale-105' : 'hover:scale-105'
                    }`}
                  />
                  
                  {/* ✈️ 방한/방일 일정 실시간 오버레이 뱃지 */}
                  {member.travelSchedule && (
                    <div className="absolute bottom-2 left-2 right-2 bg-[#0D0B18]/85 backdrop-blur-md border border-[#D4AF37]/30 px-2.5 py-1 rounded-xl text-[9px] text-white flex items-center justify-between shadow-lg z-10">
                      <span className="font-bold text-[#D4AF37] flex items-center gap-1">
                        <span>✈️</span>
                        <span>{member.travelSchedule.city}</span>
                      </span>
                      <span className="text-white/60 font-semibold">{member.travelSchedule.dateRange}</span>
                    </div>
                  )}

                  {/* 무료 유저 사진 잠금 오버레이 */}
                  {!isPremium && (
                    <div className="absolute inset-0 bg-[#0D0B18]/45 flex flex-col items-center justify-center text-center p-4">
                      <Lock size={20} className="text-[#D4AF37] mb-1.5 animate-pulse" />
                      <span className="text-[9px] font-bold text-[#D4AF37] tracking-wider uppercase">Photo Locked</span>
                    </div>
                  )}

                  {/* 우측 상단 등급 뱃지 */}
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider z-10 ${
                    member.tier === 'Pro' 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md' 
                      : member.tier === 'Basic'
                      ? 'bg-[#141221]/90 text-[#D4AF37] border border-[#D4AF37]/30 backdrop-blur-sm'
                      : 'bg-[#141221]/80 text-white/40 backdrop-blur-sm'
                  }`}>
                    {member.tier}
                  </span>
                </div>

                {/* 하단 텍스트 상세 영역 */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-white">
                        {member.name.split(' ')[0]}
                        <span className="text-[10px] sm:text-xs font-normal text-white/50">{member.age}세</span>
                      </h3>
                      {member.styleTag && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-[#D4AF37] font-semibold border border-[#D4AF37]/20">
                          #{member.styleTag}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-white/40 mt-0.5 mb-3">{member.location}</p>
                    
                    <p className="text-[11px] text-white/60 leading-relaxed mb-4 min-h-[50px] line-clamp-3">
                      {lang === 'ko' ? member.bio : member.bioJa}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-3.5 mt-2">
                    {/* 인증 배지 마크 목록 */}
                    <div className="flex gap-1">
                      {member.badges.map(b => (
                        <span 
                          key={b} 
                          className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-[#D4AF37]"
                          title={b === 'identity' ? '본인인증 완료' : b === 'job' ? '직업인증 완료' : '학력인증 완료'}
                        >
                          <CheckCircle2 size={9} />
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (!user) {
                          alert(lang === 'ko' ? '⚠️ 대화 신청을 하려면 로그인이 필요합니다. 화면 상단 우측의 [Sign In]을 통해 로그인해 주십시오.' : '⚠️ 会話申請をするにはログインが必要です。画面右上の[Sign In]からログインしてください。');
                          return;
                        }
                        navigate('/matching', { state: { targetMateId: member.id } });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] font-semibold text-[9px] flex items-center gap-1 border border-[#D4AF37]/20 transition-colors shrink-0"
                    >
                      <Heart size={9} className="text-[#D4AF37] fill-current" />
                      {lang === 'ko' ? '대화 신청하기 💌' : '会話申請する 💌'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 대화 목록 탭 */
          <div className="w-full bg-[#141221] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <MessageSquare size={36} className="text-[#D4AF37]/50 mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-white mb-1">
              {lang === 'ko' ? '대화방 기록 목록' : '会話室の履歴一覧'}
            </h3>
            <p className="text-xs text-white/40 max-w-md leading-relaxed mb-6">
              {lang === 'ko'
                ? '현재 가동 중인 실시간 암호화 대화방이 없습니다. 한일 파트너 탐색 탭에서 호감이 가는 이성에게 가치관 매칭 신청을 먼저 진행해 주세요.'
                : '現在稼働中の暗号化会話室はありません。日韓パートナー一覧から、好感のある異性に価値観マッチング申請を行ってください。'}
            </p>
            <button
              onClick={() => setActiveTab('explore')}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C29E30] text-[#0D0B18] font-bold text-xs shadow-lg transition-all"
            >
              {lang === 'ko' ? '인기 이성 둘러보기' : '異性を探しに行く'}
            </button>
          </div>
        )}
      </div>

      {/* 프리미엄 업그레이드 유도 모달 */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-black"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#141221] border border-white/20 p-6 rounded-2xl max-w-sm w-full z-10 text-center"
            >
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <Lock size={36} className="text-[#D4AF37] mx-auto mb-3.5 animate-bounce" />
              
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-1.5 justify-center">
                <span>{lang === 'ko' ? '🔒 베이직 이상 전용 필터' : '🔒 ベーシック以上専用フィルター'}</span>
              </h3>
              
              <p className="text-xs text-white/60 leading-relaxed mb-6">
                {lang === 'ko'
                  ? '진정성 있는 유료 결제 회원(Basic/Pro 등급)들만 정밀 탐색하여 허수 회원을 거르는 특권은 베이직 등급 회원 이상에게만 제공됩니다.'
                  : '信頼性の高い有料決済会員（Basic/Proランク）のみを精密検索し、サクラなどの偽装会員を排除する特権は、ベーシッククラス以上の会員のみに提供されます。'}
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors text-white"
                >
                  {lang === 'ko' ? '닫기' : '閉じる'}
                </button>
                <button
                  onClick={handleUpgrade}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-[#0D0B18] font-bold text-xs hover:opacity-95 transition-all shadow-md"
                >
                  {lang === 'ko' ? '체험용 즉시 등급 업 💎' : '体験用アップグレード 💎'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
