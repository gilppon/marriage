import { MatchService } from '../src/services/matchService';
import { MarriageValues } from '../src/types/matchTypes';

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 결혼 준비도 및 가치관 가중치 매칭 + Gemini AI 조언 검증');
  console.log('🧪 ====================================================');

  try {
    // 1. 가치관이 상이한 두 가상 유저 데이터 설정 (80점 미만 유도)
    const user1Values: MarriageValues = {
      childPlan: 'WANT_CHILDREN',     // 자녀 계획함 (30점 획득 가능하나 상대는 NO_CHILDREN)
      residenceWill: 'STAY_IN_KR',   // 한국 거주 희망 (상대는 STAY_IN_JP -> 0점)
      religion: 'CHRISTIAN',          // 기독교 (상대는 BUDDHIST -> 5점)
      dualIncome: 'YES',              // 맞벌이 선호 (상대는 NO -> 5점)
      marriageTiming: 'WITHIN_1_YEAR'
    };

    const user2Values: MarriageValues = {
      childPlan: 'NO_CHILDREN',       // 자녀 원치 않음 (자녀 매칭 실패 -> 0점)
      residenceWill: 'STAY_IN_JP',   // 일본 거주 희망 (거주지 매칭 실패 -> 0점)
      religion: 'BUDDHIST',           // 불교 (종교 매칭 실패 -> 5점)
      dualIncome: 'NO',               // 외벌이 선호 (맞벌이 매칭 실패 -> 5점)
      marriageTiming: 'DEPENDS'
    };

    console.log('\n[TEST 1] 불일치 가치관 남녀의 가중치 매칭 점수 연산 검사');
    const result = await MatchService.calculateMatchScore(user1Values, user2Values);
    
    // 예상 점수:
    // 자녀계획: 0점 (WANT vs NO)
    // 거주지: 0점 (STAY_IN_KR vs STAY_IN_JP)
    // 종교: 5점 (CHRISTIAN vs BUDDHIST)
    // 맞벌이: 5점 (YES vs NO)
    // 언어: 5점 (기본값 BASIC vs BASIC)
    // 합계: 15점
    console.log(`   - 계산된 매칭 점수: ${result.score}점 (BestMatch: ${result.isBestMatch})`);
    if (result.score !== 15) {
      throw new Error(`매칭 가중치 합산 오류: 기대값 15점, 실제값 ${result.score}점`);
    }

    if (result.isBestMatch === true) {
      throw new Error('15점 매칭 결과인데 BestMatch로 인정되었습니다.');
    }

    // 2. Gemini AI 조언 생성 여부 검사 (80점 미만이므로 aiAdvice가 채워져 있어야 함)
    console.log('\n[TEST 2] Gemini AI 가치관 조정 조언(aiAdvice) 생성 및 리턴 검사');
    const comp = result.compatibility;
    if (!comp) {
      throw new Error('compatibility 상세 결과 데이터가 누락되었습니다.');
    }

    console.log(`   - 자녀계획 점수: ${comp.childPlanScore} / 20`);
    console.log(`   - 거주지 점수: ${comp.residenceScore} / 25`);
    console.log(`   - 언어능력 점수: ${comp.languageScore} / 25`);
    console.log(`   - 종교관 점수: ${comp.religionScore} / 15`);
    console.log(`   - 경제관 점수: ${comp.economicScore} / 15`);

    if (!comp.aiAdvice) {
      throw new Error('80점 미만 저점 매칭임에도 AI 조언(aiAdvice)이 생성되지 않았습니다.');
    }

    console.log('\n💬 [AI ADVICE GENERATED OUTPUT]:');
    console.log('----------------------------------------------------');
    console.log(comp.aiAdvice);
    console.log('----------------------------------------------------');

    if (comp.aiAdvice.includes('결정적 영향') || comp.aiAdvice.length < 10) {
      throw new Error('생성된 AI 조언 내용이 부실하거나 로컬 폴백 메시지보다 짧습니다.');
    }
    console.log('   - Gemini 가치관 대화 가이드 생성 정합성 통과!');

    console.log('\n✅ ====================================================');
    console.log('✅ [ALL PASS] 가중치 매칭 및 Gemini AI 가치관 조언 검증 성공!');
    console.log('✅ ====================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ [TEST FAILURE] 테스트 도중 오류 발생:', error);
    process.exit(1);
  }
}

runTests();
