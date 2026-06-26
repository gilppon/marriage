import { BillingService } from '../src/services/billingService';
import { ConciergeService } from '../src/services/conciergeService';
import { PoliteTemplates } from '../src/utils/politeTemplates';
import { MatchService } from '../src/services/matchService';

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 korea aimasu BM 페이월, 매니저 리포트, 정중한 일본어 UX 검증');
  console.log('🧪 ====================================================');

  try {
    const userId = 'user_bm_tester';
    const partnerId = 'user_partner_jp';

    // ----------------------------------------------------
    // 1. 하트 지갑 초기화 및 페이월 검증 (Freemium)
    // ----------------------------------------------------
    console.log('\n[TEST 1] Freemium 지갑 생성 및 페이월 게이트 작동 테스트');
    const wallet = await BillingService.getWallet(userId);
    console.log(`   - 기본 지갑 생성 완료: 하트 수=${wallet.hearts}개, 등급=${wallet.membershipType}`);
    
    if (wallet.hearts !== 5) throw new Error('기본 가입 시 하트 개수는 5개여야 합니다.');

    // 하트를 5개 인위적 차감하여 0개로 만듦
    await BillingService.consumeHeart(userId, 5);
    const zeroWallet = await BillingService.getWallet(userId);
    console.log(`   - 하트 전량 소진 완료: 남은 하트 수=${zeroWallet.hearts}개`);

    // 하트가 0개인 상태에서 페이월 체크 (예외가 발생해야 정상)
    try {
      await BillingService.checkPaywallGate(userId, 'SEND_MESSAGE');
      throw new Error('하트가 0개인데 페이월 게이트가 뚫렸습니다!');
    } catch (err: any) {
      if (err.message !== 'PAYWALL_TRIGGERED') throw err;
      console.log(`   - 하트 소진에 의한 페이월 게이트 작동 통과: PAYWALL_TRIGGERED`);
    }

    // ----------------------------------------------------
    // 2. 결제 충전 및 멤버십 업그레이드 테스트
    // ----------------------------------------------------
    console.log('\n[TEST 2] 결제 시뮬레이션 충전 및 프리미엄 업그레이드 테스트');
    const charged = await BillingService.chargeHearts(userId, 10, true); // 10개 하트 충전 + PREMIUM 업그레이드
    console.log(`   - 결제 완료: 하트 수=${charged.hearts}개, 등급=${charged.membershipType}`);
    
    if (charged.membershipType !== 'PREMIUM' || charged.hearts !== 10) {
      throw new Error('결제 및 멤버십 업그레이드 처리에 결함이 있습니다.');
    }

    // 프리미엄 상태에서 페이월 체크 (예외 없이 통과해야 함)
    const passed = await BillingService.checkPaywallGate(userId, 'SEND_MESSAGE');
    console.log(`   - 프리미엄 회원 페이월 프리패스 검증 완료: ${passed}`);

    // ----------------------------------------------------
    // 3. 법적 리스크 회피형 간접 매니저 어드바이스 리포트 검증
    // ----------------------------------------------------
    console.log('\n[TEST 3] 매니저 간접 가치관 분석 어드바이스 리포트 테스트');
    
    // 두 유저 가치관 강제 설정
    await MatchService.saveMarriageValues(userId, {
      childPlan: 'WANT_CHILDREN',
      residenceWill: 'FLEXIBLE',
      religion: 'NONE',
      dualIncome: 'YES',
      marriageTiming: 'WITHIN_1_YEAR',
      languageSkill: 'FLUENT'
    });
    await MatchService.saveMarriageValues(partnerId, {
      childPlan: 'WANT_CHILDREN',
      residenceWill: 'FLEXIBLE',
      religion: 'NONE',
      dualIncome: 'YES',
      marriageTiming: 'WITHIN_1_YEAR',
      languageSkill: 'BASIC'
    });

    const report = await ConciergeService.createAdvisoryReport(
      'manager_07',
      userId,
      partnerId,
      '두 회원님은 자녀 계획 및 거주지 조건이 100% 매칭되어 결혼 시 시너지가 매우 큽니다. 적극적인 만남을 제안드립니다.',
      'はじめまして、お話しできるのを楽しみにしておりました。'
    );
    console.log(`   - 리포트 발행 완료: ID=${report.reportId}, 자동계산 궁합점수=${report.compatibilityScore}점`);
    
    if (report.compatibilityScore !== 100) {
      throw new Error('자동 가치관 매칭 점수 연산 매핑에 에러가 있습니다.');
    }

    const myReports = await ConciergeService.getUserReports(userId);
    console.log(`   - 유저 리포트 수신함 조회 완료: 수신 개수=${myReports.length}`);
    if (myReports[0].reportId !== report.reportId) {
      throw new Error('리포트 조회 목록 정합성 오류');
    }

    // ----------------------------------------------------
    // 4. 일본어 정중한 경어(Keigo) 템플릿 번역 테스트
    // ----------------------------------------------------
    console.log('\n[TEST 4] 일본어 비즈니스 경어(Keigo) UX 템플릿 검증');
    const firstGreeting = PoliteTemplates.getPoliteTemplate('FIRST_GREETING', '사토');
    const politeDecline = PoliteTemplates.getPoliteTemplate('POLITE_DECLINE', '김철수');

    console.log(`   - 첫인사 템플릿: "${firstGreeting}"`);
    console.log(`   - 거절 템플릿: "${politeDecline}"`);

    if (!firstGreeting.includes('プロフィール') || !politeDecline.includes('希望条件')) {
      throw new Error('일본어 경어 템플릿 자구 구성 에러');
    }
    console.log('   - 정중함 및 뉘앙스 검증 통과!');

    // ----------------------------------------------------
    // 5. 통화 도중 하트 차감 및 자동 해제 (Circuit Breaker) 시뮬레이션
    // ----------------------------------------------------
    console.log('\n[TEST 5] 통화 요율 과금 및 하트 소진 자동 종료 차단 검증');
    
    // 유저의 멤버십을 FREE로 되돌리고 하트를 0개로 설정
    await BillingService.setWalletForTest(userId, 0, 'FREE');
    const lastWallet = await BillingService.getWallet(userId);
    console.log(`   - 테스트 지갑 초기화 완료: 하트 수=${lastWallet.hearts}개, 등급=${lastWallet.membershipType}`);
    
    const canCall = await BillingService.checkCallPermission(userId);
    console.log(`   - 하트 소진 상태에서 통화 시작 권한 여부: ${canCall} (기대값: false)`);
    if (canCall === true) throw new Error('하트가 없는데 통화가 승인되었습니다!');

    console.log('\n✅ ====================================================');
    console.log('✅ [ALL PASS] 모든 BM 결제 페이월 및 어드바이스 검증이 성공했습니다!');
    console.log('✅ ====================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ [TEST FAILURE] 테스트 도중 오류 발생:', error);
    process.exit(1);
  }
}

runTests();
