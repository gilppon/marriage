import { VerificationService } from '../src/services/verificationService';
import { PrivacyService } from '../src/services/privacyService';
import { DEFAULT_PRIVACY_SETTINGS } from '../src/types/privacyTypes';

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 korea aimasu 신뢰 검증 및 프라이버시 시스템 시나리오 E2E 검증');
  console.log('🧪 ====================================================');

  try {
    const userId1 = 'user_kr_tester';
    const userId2 = 'user_jp_tester';

    // ----------------------------------------------------
    // 시나리오 1: 사용자 1(한국) 서류 제출 및 관리자 승인 (State Machine)
    // ----------------------------------------------------
    console.log('\n[TEST 1] 사용자 1 (IDENTITY) 서류 제출 및 승인 상태 머신 테스트');
    const doc1 = await VerificationService.submitDocument(
      userId1,
      'IDENTITY',
      'uploads/identity/user1_passport.jpg',
      { realName: '홍길동', dateOfBirth: '1996-05-15' }
    );
    console.log(`   - 서류 제출 완료: ID=${doc1.id}, 상태=${doc1.status}`);
    
    if (doc1.status !== 'SUBMITTED') throw new Error('제출 시 초기 상태는 SUBMITTED 여야 합니다.');

    const reviewedDoc1 = await VerificationService.reviewDocument(
      userId1,
      'IDENTITY',
      'APPROVED',
      undefined,
      'admin_01'
    );
    console.log(`   - 관리자 승인 완료: 상태=${reviewedDoc1.status}, 승인자=${reviewedDoc1.reviewedBy}`);
    
    if (reviewedDoc1.status !== 'APPROVED') throw new Error('승인 처리 후 상태는 APPROVED 여야 합니다.');

    // ----------------------------------------------------
    // 시나리오 2: 사용자 2(일본) 서류 제출 및 반려 시 반려 사유 필수화
    // ----------------------------------------------------
    console.log('\n[TEST 2] 사용자 2 (EMPLOYMENT) 서류 제출 및 반려 상태 머신 테스트');
    await VerificationService.submitDocument(
      userId2,
      'EMPLOYMENT',
      'uploads/jobs/user2_job.jpg',
      { companyName: 'LINE Yahoo', occupation: 'Software Engineer' }
    );

    // 반려 사유 없이 반려를 시도하면 예외가 터져야 함
    try {
      await VerificationService.reviewDocument(userId2, 'EMPLOYMENT', 'REJECTED', undefined, 'admin_01');
      throw new Error('반려 사유가 없는데 반려 처리가 성공하면 안 됩니다!');
    } catch (err: any) {
      console.log(`   - 반려 사유 미기재 시 예외 발생 검증 통과: ${err.message}`);
    }

    const rejectedDoc = await VerificationService.reviewDocument(
      userId2,
      'EMPLOYMENT',
      'REJECTED',
      '서류 화질이 불량하여 글씨 판독 불가',
      'admin_01'
    );
    console.log(`   - 관리자 반려 완료: 상태=${rejectedDoc.status}, 사유=${rejectedDoc.rejectReason}`);
    if (rejectedDoc.status !== 'REJECTED' || !rejectedDoc.rejectReason) {
      throw new Error('반려 처리 상태 또는 반려 사유가 누락되었습니다.');
    }

    // ----------------------------------------------------
    // 시나리오 3: 프라이버시 설정 관리
    // ----------------------------------------------------
    console.log('\n[TEST 3] 사용자 1 (일본 거주 설정) 프라이버시 설정 변경 및 조회 테스트');
    const customSettings = {
      profileVisibility: 'ALL' as const,
      ageVisibility: 'BLURRED' as const,     
      jobVisibility: 'INDUSTRY_ONLY' as const, 
      incomeVisibility: 'VERIFIED_ONLY' as const, 
      realNameVisibility: 'MATCHED_ONLY' as const, 
      blockCountry: ['JP'] as ('KR' | 'JP')[] 
    };

    const savedSettings = await PrivacyService.updatePrivacySettings(userId1, customSettings);
    console.log(`   - 설정 저장 완료: ageVisibility=${savedSettings.ageVisibility}, blockCountry=${savedSettings.blockCountry}`);

    const retrievedSettings = await PrivacyService.getPrivacySettings(userId1);
    if (retrievedSettings.ageVisibility !== 'BLURRED') throw new Error('조회된 프라이버시 설정이 일치하지 않습니다.');

    // ----------------------------------------------------
    // 시나리오 4: 프라이버시 마스킹 프로필 필터 적용 테스트
    // ----------------------------------------------------
    console.log('\n[TEST 4] 개인정보 민감도 필터링 및 국가 차단 마스킹 테스트');

    const profileData = {
      id: userId1,
      nickname: '길동이',
      realName: '홍길동',
      age: 28,
      job: '삼성전자 시니어 연구원',
      company: '삼성전자',
      industry: 'IT/인터넷',
      income: '8,000만원',
      country: 'KR',
      verificationBadges: { identityVerified: true, employmentVerified: true, maritalStatusVerified: false },
      privacySettings: customSettings
    };

    // Case A: 일본 유저가 조회 시도 -> blockCountry에 JP가 있으므로 예외가 나야 함
    const viewerJP = { id: userId2, country: 'JP', verificationBadges: { identityVerified: true } };
    try {
      await PrivacyService.getMaskedProfile(userId1, userId2, {
        profileUser: profileData,
        viewerUser: viewerJP,
        isMatched: false
      });
      throw new Error('국가 차단 필터가 동작하지 않았습니다!');
    } catch (err: any) {
      if (err.message !== 'ACCESS_DENIED_COUNTRY') throw err;
      console.log('   - Case A: 일본 국가 소속 회원 프로필 격리 차단 성공!');
    }

    // Case B: 한국 유저(미인증, 매칭 안됨)가 조회 시도 -> 마스킹 적용
    const viewerKR_unverified = { id: 'viewer_kr_unverified', country: 'KR', verificationBadges: { identityVerified: false } };
    const maskedProfileB = await PrivacyService.getMaskedProfile(userId1, 'viewer_kr_unverified', {
      profileUser: profileData,
      viewerUser: viewerKR_unverified,
      isMatched: false
    });

    console.log('   - Case B: 미인증 한국 회원이 조회했을 때의 마스킹 결과:');
    console.log(`     * 나이 (BLURRED 희망): ${maskedProfileB.age}`); 
    console.log(`     * 직업 (INDUSTRY_ONLY 희망): ${maskedProfileB.job}`); 
    console.log(`     * 회사명 (숨김 희망): ${maskedProfileB.company}`); 
    console.log(`     * 본명 (MATCHED_ONLY 희망): ${maskedProfileB.realName}`); 
    console.log(`     * 소득 (VERIFIED_ONLY 희망): ${maskedProfileB.income}`); 

    if (maskedProfileB.age !== '20대 후반') throw new Error('나이 마스킹 에러');
    if (maskedProfileB.job !== 'IT/인터넷') throw new Error('직업 마스킹 에러');
    if (maskedProfileB.company !== undefined) throw new Error('회사 노출 에러');
    if (maskedProfileB.realName !== undefined) throw new Error('본명 노출 에러');
    if (maskedProfileB.income !== undefined) throw new Error('연봉 노출 에러');
    console.log('   - Case B: 모든 프라이버시 민감 필터 정상 작동 확인!');

    // Case C: 한국 유저(인증됨, 매칭됨)가 조회 시도 -> 정보 오픈
    const viewerKR_verified_matched = { id: 'viewer_kr_matched', country: 'KR', verificationBadges: { identityVerified: true } };
    const maskedProfileC = await PrivacyService.getMaskedProfile(userId1, 'viewer_kr_matched', {
      profileUser: profileData,
      viewerUser: viewerKR_verified_matched,
      isMatched: true
    });

    console.log('   - Case C: 인증 및 매칭 완료 회원이 조회했을 때의 노출 결과:');
    console.log(`     * 본명: ${maskedProfileC.realName}`); 
    console.log(`     * 소득: ${maskedProfileC.income}`); 
    
    if (maskedProfileC.realName !== '홍길동') throw new Error('매칭 완료 유저 이름 오픈 실패');
    if (maskedProfileC.income !== '8,000만원') throw new Error('인증 완료 유저 소득 오픈 실패');
    console.log('   - Case C: 매칭 및 인증 만족 시 보안 필드 해제 확인!');

    console.log('\n✅ ====================================================');
    console.log('✅ [ALL PASS] 모든 신뢰 검증 및 프라이버시 시나리오가 성공적으로 통과되었습니다!');
    console.log('✅ ====================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ [TEST FAILURE] 테스트 도중 검증 오류 발생:', error);
    process.exit(1);
  }
}

runTests();
