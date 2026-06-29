import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Heart, ArrowRight, Check } from 'lucide-react';

interface MarriageValues {
  childPlan: 'WANT_CHILDREN' | 'NO_CHILDREN' | 'DISCUSS';
  residenceWill: 'STAY_IN_KR' | 'STAY_IN_JP' | 'FLEXIBLE';
  religion: 'NONE' | 'CHRISTIAN' | 'BUDDHIST' | 'CATHOLIC' | 'OTHER';
  dualIncome: 'YES' | 'NO' | 'FLEXIBLE';
  marriageTiming: 'WITHIN_1_YEAR' | 'WITHIN_2_YEARS' | 'DEPENDS';
  languageSkill?: 'BASIC' | 'INTERMEDIATE' | 'FLUENT';
  mbtiType?: string;
  testedAt?: Date;
}

interface MarriageTestProps {
  lang: 'ko' | 'ja';
  userId: string | null;
  onComplete: (values: MarriageValues) => void;
  onOpenAuthModal?: () => void;
}

interface Question {
  id: number;
  category: 'child' | 'residence' | 'economy' | 'timing';
  textKo: string;
  textJa: string;
  type: 'positive' | 'negative' | 'neutral'; // 점수 연산 방향 지시용
}

const QUESTIONS: Question[] = [
  // 1. 자녀관 (child)
  { id: 1, category: 'child', textKo: '결혼 후 자녀(아이)는 우리 가정에 반드시 있어야 한다고 생각한다.', textJa: '結婚後、子供は私たちの家庭に必ず必要だと思う。', type: 'positive' },
  { id: 2, category: 'child', textKo: '자녀가 없는 부부만의 삶(딩크족)도 충분히 행복할 수 있다.', textJa: '子供のいない夫婦だけの生活（ディンクス）も十分に幸せになれると思う。', type: 'negative' },
  { id: 3, category: 'child', textKo: '자녀 계획은 정해두기보다 배우자와 충분한 시간을 갖고 상의해 결정할 문제다.', textJa: '家族計画はあらかじめ決めるより、配偶者と十分な時間をかけて相談し決定すべき問題だ。', type: 'neutral' },
  
  // 2. 거주지 (residence)
  { id: 4, category: 'residence', textKo: '사랑하는 배우자를 위해서라면 한국이든 일본이든 유연하게 이주할 수 있다.', textJa: '愛する配偶者のためなら、韓国であれ日本であれ柔軟に移住できる。', type: 'positive' },
  { id: 5, category: 'residence', textKo: '결혼 후 주거 및 생활 터전은 무조건 한국이어야만 한다.', textJa: '結婚後の住居や生活拠点は、何があっても韓国であるべきだ。', type: 'negative' },
  { id: 6, category: 'residence', textKo: '결혼 후 주거 및 생활 터전은 무조건 일본이어야만 한다.', textJa: '結婚後の住居や生活拠点は、何があっても日本であるべきだ。', type: 'neutral' },

  // 3. 경제관 (economy)
  { id: 7, category: 'economy', textKo: '결혼 후에도 맞벌이를 하며 각자의 직업과 커리어를 계속 유지하고 싶다.', textJa: '結婚後も共働きをして、お互いの仕事やキャリアを継続して維持したい。', type: 'positive' },
  { id: 8, category: 'economy', textKo: '한 사람이 경제 활동을 전담하고 다른 사람은 가사 및 육아에 전념하는 편이 이상적이다.', textJa: '一方が経済活動を専念し、もう一方が家事や育児に専念する形が理想的だ。', type: 'negative' },
  { id: 9, category: 'economy', textKo: '경제적 상황과 육아 환경에 따라 맞벌이와 외벌이를 탄력적으로 유연하게 조정할 수 있다.', textJa: '経済的状況や育児環境に応じて、共働きと片働きを弾力的に調整できる。', type: 'neutral' },

  // 4. 결혼 시기 (timing)
  { id: 10, category: 'timing', textKo: '서로 마음이 맞는 파트너를 찾으면 1년 이내에 빠르게 식을 올리고 싶다.', textJa: '気の合うパートナーを見つけたら、1年以内にスピーディーに挙式したい。', type: 'positive' },
  { id: 11, category: 'timing', textKo: '서로를 깊이 알아가는 시간이 필요하므로 최소 2년 이상의 연애 기간이 필요하다.', textJa: 'お互いを深く知る時間が必要なため、少なくとも2年以上の交際期間が必要だ。', type: 'negative' },
  { id: 12, category: 'timing', textKo: '결혼식 타이밍은 기한을 두기보다 자연스럽게 준비가 다 되었을 때 결정하고 싶다.', textJa: '結婚のタイミングは期限を設けるより、自然と準備が整った時に決定したい。', type: 'neutral' },
];

export default function MarriageTest({ lang, userId, onComplete, onOpenAuthModal }: MarriageTestProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(-1); // -1: 시작화면
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [resultValues, setResultValues] = useState<MarriageValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const t = (ko: string, ja: string) => (lang === 'ko' ? ko : ja);

  // 리커트 선택 항목
  const OPTIONS = [
    { value: 5, labelKo: '매우 그렇다', labelJa: '強くそう思う', color: 'bg-md3-primary text-black' },
    { value: 4, labelKo: '그렇다', labelJa: 'そう思う', color: 'bg-md3-primary/70 text-black' },
    { value: 3, labelKo: '보통이다', labelJa: 'どちらとも言えない', color: 'bg-white/10 text-white hover:bg-white/20' },
    { value: 2, labelKo: '아니다', labelJa: 'そう思わない', color: 'bg-red-500/50 text-white' },
    { value: 1, labelKo: '매우 아니다', labelJa: '強くそう思わない', color: 'bg-red-500 text-white' },
  ];

  // 답변 제출 및 다음 질문 이동
  const handleSelectAnswer = (value: number) => {
    const qId = QUESTIONS[currentIdx].id;
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);

    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // 퀴즈 결과 점수 연산 및 MBTI 형 도출
      calculateAndShowResult(newAnswers);
    }
  };

  // 영역별 가중치 합산 및 MarriageValues 맵핑
  const calculateAndShowResult = (finalAnswers: Record<number, number>) => {
    // 1. 자녀관 매핑
    const q1 = finalAnswers[1];
    const q2 = finalAnswers[2];
    const q3 = finalAnswers[3];
    const childWant = q1 + (6 - q2) + (6 - q3);
    const childNo = (6 - q1) + q2 + (6 - q3);
    const childDiscuss = (6 - q1) + (6 - q2) + q3;
    
    let childPlan: MarriageValues['childPlan'] = 'DISCUSS';
    if (childWant > childNo && childWant > childDiscuss) childPlan = 'WANT_CHILDREN';
    else if (childNo > childWant && childNo > childDiscuss) childPlan = 'NO_CHILDREN';

    // 2. 거주지 매핑
    const q4 = finalAnswers[4];
    const q5 = finalAnswers[5];
    const q6 = finalAnswers[6];
    const resFlex = q4 + (6 - q5) + (6 - q6);
    const resKr = (6 - q4) + q5 + (6 - q6);
    const resJp = (6 - q4) + (6 - q5) + q6;

    let residenceWill: MarriageValues['residenceWill'] = 'FLEXIBLE';
    if (resKr > resFlex && resKr > resJp) residenceWill = 'STAY_IN_KR';
    else if (resJp > resFlex && resJp > resKr) residenceWill = 'STAY_IN_JP';

    // 3. 경제관 매핑
    const q7 = finalAnswers[7];
    const q8 = finalAnswers[8];
    const q9 = finalAnswers[9];
    const ecoYes = q7 + (6 - q8) + (6 - q9);
    const ecoNo = (6 - q7) + q8 + (6 - q9);
    const ecoFlex = (6 - q7) + (6 - q8) + q9;

    let dualIncome: MarriageValues['dualIncome'] = 'FLEXIBLE';
    if (ecoYes > ecoNo && ecoYes > ecoFlex) dualIncome = 'YES';
    else if (ecoNo > ecoYes && ecoNo > ecoFlex) dualIncome = 'NO';

    // 4. 결혼 시기 매핑
    const q10 = finalAnswers[10];
    const q11 = finalAnswers[11];
    const q12 = finalAnswers[12];
    const time1Y = q10 + (6 - q11) + (6 - q12);
    const time2Y = (6 - q10) + q11 + (6 - q12);
    const timeDepends = (6 - q10) + (6 - q11) + q12;

    let marriageTiming: MarriageValues['marriageTiming'] = 'DEPENDS';
    if (time1Y > time2Y && time1Y > timeDepends) marriageTiming = 'WITHIN_1_YEAR';
    else if (time2Y > time1Y && time2Y > timeDepends) marriageTiming = 'WITHIN_2_YEARS';

    // 5. MBTI 성향 유형 분석
    let mbtiType = '합리적 조율자형 (Rational Coordinator)';
    if (residenceWill === 'FLEXIBLE' && dualIncome === 'YES') {
      mbtiType = '글로벌 개척자형 (Global Pioneer)';
    } else if (childPlan === 'WANT_CHILDREN' && dualIncome === 'NO') {
      mbtiType = '가정 중심 동반자형 (Family-First Partner)';
    } else if ((residenceWill === 'STAY_IN_KR' || residenceWill === 'STAY_IN_JP') && marriageTiming === 'WITHIN_1_YEAR') {
      mbtiType = '평온한 정착가형 (Serene Settler)';
    }

    const result: MarriageValues = {
      childPlan,
      residenceWill,
      religion: 'NONE', // 기본값 매핑
      dualIncome,
      marriageTiming,
      mbtiType,
      testedAt: new Date(),
    };

    setResultValues(result);
    setCurrentIdx(QUESTIONS.length); // 결과 화면으로 이동
  };

  // 백엔드 연동 및 최종 매칭 탭 연결
  const handleSaveResult = async () => {
    if (!resultValues) return;
    
    if (!userId) {
      // 로그인 유도 모달 띄우기
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        alert(t(
          '⚠️ 결과 저장을 위해 로그인이 필요합니다. 화면 상단 우측의 [Sign In]을 통해 로그인해 주십시오.',
          '⚠️ 結果保存のためにログインが必要です。画面右上の [Sign In] からログインしてください。'
        ));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3000/api/match/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          marriageValues: resultValues
        })
      });
      if (response.ok) {
        onComplete(resultValues);
      } else {
        throw new Error('API_ERROR');
      }
    } catch (err) {
      console.warn('⚠️ [GCP Fallback Mode] 서버와의 연결 실패로 메모리에 임시 보관 후 즉시 매칭으로 전환합니다.');
      onComplete(resultValues);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 성향 유형 설명 및 카드 디자인
  const getMbtiDetails = (type: string) => {
    if (type.includes('Pioneer')) {
      return {
        title: t('🌍 글로벌 개척자형 (Global Pioneer)', '🌍 グローバル開拓者型 (Global Pioneer)'),
        desc: t(
          '한국과 일본 양국을 넘나들며 유연하게 거주지를 이동할 수 있고, 진취적인 커리어 라이프를 추구합니다. 열린 가치관을 가진 매력적인 개방파입니다.',
          '韓国と日本の両国を行き来しながら柔軟に移住でき、進取的なキャリアライフを追求します。オープンな価値観を持つ魅力的な開放派です。'
        ),
        color: 'border-cyan-400 bg-cyan-950/20 text-cyan-200'
      };
    }
    if (type.includes('Partner')) {
      return {
        title: t('🏡 가정 중심 동반자형 (Family-First Partner)', '🏡 家庭中心の伴侶型 (Family-First Partner)'),
        desc: t(
          '가족의 화목함과 안정된 육아 환경을 최우선으로 생각합니다. 상대를 존중하고 가정을 따뜻하게 가꾸어 나갈 성실하고 헌신적인 성향입니다.',
          '家族の和睦と安定した育児環境を最優先に考えます。相手を尊重し、家庭を温かく築き上げる誠実で献身的なタイプです。'
        ),
        color: 'border-rose-400 bg-rose-950/20 text-rose-200'
      };
    }
    if (type.includes('Settler')) {
      return {
        title: t('🌳 평온한 정착가형 (Serene Settler)', '🌳 平穏な定着家型 (Serene Settler)'),
        desc: t(
          '안정적인 주거 환경과 명확한 미래 계획 하에 결혼 생활을 시작하고 싶어 합니다. 1년 이내의 진지한 정착형 만남에 최적화되어 있습니다.',
          '安定した住居環境と明確な未来計画のもと、結婚生活を始めたいと考えています。1年以内の真剣な定着型の出会いに最適化されています。'
        ),
        color: 'border-emerald-400 bg-emerald-950/20 text-emerald-200'
      };
    }
    return {
      title: t('⚖️ 합리적 조율자형 (Rational Coordinator)', '⚖️ 合理的調整者型 (Rational Coordinator)'),
      desc: t(
        '자녀 계획, 맞벌이 비율 등에서 배우자와의 이성적이고 평등한 합의를 핵심으로 삼습니다. 높은 공감과 커뮤니케이션 능력을 보유하고 있습니다.',
        '家族計画や共働きの割合など、配偶者との理性的かつ平等な合意を核心としています。高い共感能力とコミュニケーション能力を備えています。'
      ),
      color: 'border-amber-400 bg-amber-950/20 text-amber-200'
    };
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-md3-surface border border-white/10 p-6 shadow-2xl relative overflow-hidden">
      {/* 백그라운드 디자인 패턴 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-md3-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* 시작 화면 */}
      {currentIdx === -1 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-md3-primary/10 flex items-center justify-center mx-auto mb-6 border border-md3-primary/20">
            <Sparkles className="text-md3-primary animate-pulse" size={28} />
          </div>
          <h2 className="text-xl font-bold mb-3 tracking-tight">
            {t('💍 1분 결혼 가치관 검사 (Marriage-MBTI)', '💍 1分間結婚価値観テスト (Marriage-MBTI)')}
          </h2>
          <p className="text-xs text-white/60 mb-8 leading-relaxed max-w-md mx-auto">
            {t(
              '한일 커플의 성공적인 결실을 위해 거주지, 자녀 계획, 경제관, 결혼 시기 등 매칭에 필요한 4대 가치관을 진단합니다. 정직하게 답변해 주실수록 딱 맞는 매칭 상대를 추천받으실 수 있습니다.',
              '日韓カップルの成功的な結実のために、居住地、家族計画、経済観、結婚時期などマッチングに必要な4大価値観を診断します。正直にお答えいただくほど、ピッタリなマッチング相手を推薦できます。'
            )}
          </p>
          <button
            onClick={() => setCurrentIdx(0)}
            className="px-8 py-3 rounded-lg bg-md3-primary text-black font-semibold hover:bg-md3-primary/80 transition-colors flex items-center gap-2 mx-auto text-sm"
          >
            {t('진단 시작하기 🚀', '診断を始める 🚀')}
          </button>
        </div>
      )}

      {/* 퀴즈 진행 화면 */}
      {currentIdx >= 0 && currentIdx < QUESTIONS.length && (
        <div>
          {/* 상단 프로그레스 바 */}
          <div className="flex justify-between items-center mb-6 text-xs text-white/40">
            <span>{t('가치관 진단 진행도', '価値観診断の進行度')}</span>
            <span className="font-semibold text-md3-primary">{currentIdx + 1} / {QUESTIONS.length}</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
            <motion.div 
              className="h-full bg-md3-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* 질문 카드 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="min-h-[120px] flex flex-col justify-center text-center px-4"
            >
              <span className="text-[10px] text-md3-accent uppercase tracking-widest font-bold mb-2">
                {QUESTIONS[currentIdx].category.toUpperCase()} VALUE
              </span>
              <p className="text-base font-medium leading-relaxed text-white/95">
                "{t(QUESTIONS[currentIdx].textKo, QUESTIONS[currentIdx].textJa)}"
              </p>
            </motion.div>
          </AnimatePresence>

          {/* 5점 척도 선택 버튼 */}
          <div className="mt-8 flex flex-col gap-3">
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelectAnswer(opt.value)}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-semibold border border-white/5 hover:scale-[1.01] hover:border-white/10 active:scale-[0.99] transition-all flex items-center justify-between group ${opt.color}`}
              >
                <span>{t(opt.labelKo, opt.labelJa)}</span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 결과 진단 화면 */}
      {currentIdx === QUESTIONS.length && resultValues && (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Check className="text-emerald-400" size={24} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {t('🎉 가치관 진단 완료!', '🎉 価値観診断完了！')}
          </h3>
          <p className="text-xs text-white/40 mb-6">
            {t('당신의 답변 분석 결과가 도출되었습니다.', 'あなたの回答分析結果が算出されました。')}
          </p>

          {/* 유형 분석 요약 카드 */}
          {(() => {
            const details = getMbtiDetails(resultValues.mbtiType || '');
            return (
              <div className={`p-5 rounded-2xl border text-left mb-6 ${details.color}`}>
                <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                  <Shield size={16} />
                  {details.title}
                </h4>
                <p className="text-xs leading-relaxed opacity-85">
                  {details.desc}
                </p>
              </div>
            );
          })()}

          {/* 내비게이션 및 백엔드 저장 버튼 */}
          <button
            onClick={handleSaveResult}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-lg bg-gradient-to-r from-md3-primary to-emerald-400 hover:from-md3-primary/90 hover:to-emerald-400/90 text-black font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart size={14} className="fill-current" />
            )}
            {t('결과 저장하고 가치관 맞춤 상대 추천받기 💖', '結果を保存して価値観マッチング相手を見る 💖')}
          </button>
        </div>
      )}
    </div>
  );
}
