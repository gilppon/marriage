import { MatchService } from '../src/services/matchService';
import { PrivacyService } from '../src/services/privacyService';
import { MarriageValues } from '../src/types/matchTypes';
import { DEFAULT_PRIVACY_SETTINGS } from '../src/types/privacyTypes';

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 korea aimasu 개인정보 세부 통제 및 검색 제외(Exclusion) E2E 검증');
  console.log('🧪 ====================================================');

  try {
    const userA_Samsung = 'user_a_samsung';
    const userB_ExcludeSamsung = 'user_b_exclude_samsung';
    const userC_Osaka = 'user_c_osaka';
    const userD_ExcludeOsaka = 'user_d_exclude_osaka';

    const defaultValues: MarriageValues = {
      childPlan: 'WANT_CHILDREN',
      residenceWill: 'FLEXIBLE',
      religion: 'NONE',
      dualIncome: 'YES',
      marriageTiming: 'WITHIN_2_YEARS'
    };

    // ----------------------------------------------------
    // 1. 특정 직업군 검색 제외 (Exclusion List - Jobs)
    // ----------------------------------------------------
    console.log('\n[TEST 1] 특정 직업군(삼성) 검색 제외 양방향 필터링 검증');
    
    // User A: 삼성전자 소프트웨어 엔지니어
    const profileA = {
      id: userA_Samsung,
      nickname: '삼성맨A',
      country: 'KR',
      region: 'Seoul',
      job: 'Software Engineer',
      company: '삼성전자',
      industry: 'IT/Electronics',
      marriageValues: defaultValues
    };
    
    // User B: 가치관은 성립하나 직업군에 "삼성"이 들어가면 제외하길 바람
    const settingsB = {
      ...DEFAULT_PRIVACY_SETTINGS,
      excludeJobs: ['삼성']
    };

    // 테스트 환경 강제 모킹 주입
    await PrivacyService.updatePrivacySettings(userB_ExcludeSamsung, settingsB);
    await MatchService.saveMarriageValues(userA_Samsung, defaultValues);
    await MatchService.saveMarriageValues(userB_ExcludeSamsung, defaultValues);

    const isExcluded = PrivacyService.isUserExcluded(profileA, settingsB);
    console.log(`   - 삼성맨 A가 삼성 제외 설정 B에게 필터링되는지 여부: ${isExcluded} (Expected: true)`);
    if (!isExcluded) {
      throw new Error('직업 키워드 검색 제외 필터가 작동하지 않았습니다.');
    }
    console.log('   - [TEST 1 PASS] 직업군 부분일치 검색 제외 검증 성공!');

    // ----------------------------------------------------
    // 2. 특정 지역 검색 제외 (Exclusion List - Regions)
    // ----------------------------------------------------
    console.log('\n[TEST 2] 특정 지역(Osaka) 검색 제외 양방향 필터링 검증');

    // User C: 오사카 거주
    const profileC = {
      id: userC_Osaka,
      nickname: '오사카스시',
      country: 'JP',
      region: 'Osaka',
      marriageValues: defaultValues
    };

    // User D: 오사카 거주자는 피하고 싶음
    const settingsD = {
      ...DEFAULT_PRIVACY_SETTINGS,
      excludeRegions: ['Osaka']
    };

    await PrivacyService.updatePrivacySettings(userD_ExcludeOsaka, settingsD);

    const isRegionExcluded = PrivacyService.isUserExcluded(profileC, settingsD);
    console.log(`   - 오사카 거주 C가 오사카 제외 설정 D에게 필터링되는지 여부: ${isRegionExcluded} (Expected: true)`);
    if (!isRegionExcluded) {
      throw new Error('지역 키워드 검색 제외 필터가 작동하지 않았습니다.');
    }
    console.log('   - [TEST 2 PASS] 지역 검색 제외 검증 성공!');

    // ----------------------------------------------------
    // 3. 결혼 적합도 상세 매칭 결과 마스킹 검증 (매칭 성사 전)
    // ----------------------------------------------------
    console.log('\n[TEST 3] 매칭 성사 전 결혼 적합도 데이터(compatibility) 마스킹 검증');

    const sampleMatchResult = {
      score: 90,
      isBestMatch: true,
      matchDetails: {
        residenceMatch: true,
        childMatch: true,
        dualIncomeMatch: true,
        religionMatch: true,
        languageMatch: true
      },
      compatibility: {
        childPlanScore: 20,
        residenceScore: 25,
        religionScore: 15,
        economicScore: 15,
        languageScore: 15,
        aiAdvice: '훌륭한 매칭입니다.'
      }
    };

    const userX = 'user_x';
    const userY = 'user_y';

    // 매칭 전 상태 (status === 'NONE')
    await PrivacyService.setMatchForTest(userX, userY, 'NONE');

    const maskedBeforeMatch = await PrivacyService.getMaskedMatchResult(sampleMatchResult, userX, userY);
    console.log(`   - 매칭 전 점수 노출 여부: Score=${maskedBeforeMatch.score} (Expected: 0)`);
    console.log(`   - 매칭 전 가치관 상세 정보 노출 여부: ${maskedBeforeMatch.compatibility === undefined ? '비공개(마스킹)' : '노출'}`);

    if (maskedBeforeMatch.score !== 0) {
      throw new Error('매칭 성사 전에는 적합도 점수가 0점으로 마스킹되어야 합니다.');
    }
    if (maskedBeforeMatch.compatibility !== undefined) {
      throw new Error('매칭 성사 전에는 상세 가치관 점수(compatibility)가 완전히 비공개여야 합니다.');
    }
    console.log('   - [TEST 3 PASS] 매칭 전 적합도 마스킹 가드 완벽 작동 확인!');

    // ----------------------------------------------------
    // 4. 결혼 적합도 상세 매칭 결과 마스킹 검증 (매칭 성사 후 + 상호동의 단계)
    // ----------------------------------------------------
    console.log('\n[TEST 4] 매칭 성사 후 및 상호 동의 여부에 따른 적합도 노출 검증');

    // 1) 매칭 성사 (status === 'MATCHED')이나 둘 다 비동의 상태
    await PrivacyService.setMatchForTest(userX, userY, 'MATCHED');
    await PrivacyService.updatePrivacySettings(userX, { ...DEFAULT_PRIVACY_SETTINGS, consentCompatibilityOpen: false });
    await PrivacyService.updatePrivacySettings(userY, { ...DEFAULT_PRIVACY_SETTINGS, consentCompatibilityOpen: false });

    const maskedBothDecline = await PrivacyService.getMaskedMatchResult(sampleMatchResult, userX, userY);
    console.log(`   - 매칭 후 (양측 동의 전) 상세 정보 노출 여부: ${maskedBothDecline.compatibility === undefined ? '비공개(마스킹)' : '노출'}`);
    if (maskedBothDecline.compatibility !== undefined) {
      throw new Error('상호 동의 전에는 상세 가치관 점수가 공개되면 안 됩니다.');
    }

    // 2) 한쪽만 동의한 상태
    await PrivacyService.updatePrivacySettings(userX, { ...DEFAULT_PRIVACY_SETTINGS, consentCompatibilityOpen: true });
    
    const maskedOneAccept = await PrivacyService.getMaskedMatchResult(sampleMatchResult, userX, userY);
    console.log(`   - 매칭 후 (한쪽만 동의) 상세 정보 노출 여부: ${maskedOneAccept.compatibility === undefined ? '비공개(마스킹)' : '노출'}`);
    if (maskedOneAccept.compatibility !== undefined) {
      throw new Error('한쪽만 동의한 상태에서는 상세 가치관 점수가 공개되면 안 됩니다.');
    }

    // 3) 양쪽 모두 동의한 상태
    await PrivacyService.updatePrivacySettings(userY, { ...DEFAULT_PRIVACY_SETTINGS, consentCompatibilityOpen: true });

    const fullyOpenResult = await PrivacyService.getMaskedMatchResult(sampleMatchResult, userX, userY);
    console.log(`   - 매칭 후 (양측 모두 동의) 상세 정보 노출 여부: ${fullyOpenResult.compatibility !== undefined ? '노출(공개)' : '비공개'}`);
    console.log(`   - 양측 동의 시 AI 조언: "${fullyOpenResult.compatibility?.aiAdvice}"`);

    if (fullyOpenResult.compatibility === undefined) {
      throw new Error('양측 모두 동의하였음에도 상세 가치관 점수가 마스킹 처리되어 있습니다.');
    }
    if (fullyOpenResult.compatibility.aiAdvice !== '훌륭한 매칭입니다.') {
      throw new Error('조언 문구가 누락되었습니다.');
    }

    console.log('   - [TEST 4 PASS] 상호 동의 여부에 따른 단계적 프로그레시브 노출 가드 검증 성공!');

    console.log('\n✅ ====================================================');
    console.log('✅ [ALL PASS] 개인정보 세부 통제 및 검색 제외(Exclusion) 검증 통과!');
    console.log('✅ ====================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ [TEST FAILURE] 테스트 중 오류 발생:', error);
    process.exit(1);
  }
}

runTests();
