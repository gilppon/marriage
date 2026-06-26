import { VerificationService } from '../src/services/verificationService';
import { PrivacyService } from '../src/services/privacyService';
import { DEFAULT_PRIVACY_SETTINGS } from '../src/types/privacyTypes';

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 korea aimasu 신뢰 배지 만료 및 상호주의(Reciprocity) E2E 검증');
  console.log('🧪 ====================================================');

  try {
    const testerId = 'user_badge_expiry_tester';
    const profileUserId = 'profile_user_badge_reciprocity';
    const viewerNoEduId = 'viewer_no_edu_badge';
    const viewerWithEduId = 'viewer_with_edu_badge';

    // ----------------------------------------------------
    // 1. 유효기간 계산 및 저장 검증
    // ----------------------------------------------------
    console.log('\n[TEST 1] 직업 인증서 승인 시 1년 유효기간 자동 계산 검증');
    const doc = await VerificationService.submitDocument(
      testerId,
      'EMPLOYMENT',
      'uploads/jobs/tester_job.jpg',
      { companyName: 'Google Korea', occupation: 'Software Engineer' }
    );
    
    const approvedDoc = await VerificationService.reviewDocument(
      testerId,
      'EMPLOYMENT',
      'APPROVED',
      undefined,
      'admin_01'
    );

    const activeBadgesBefore = await VerificationService.getActiveBadges(testerId);
    console.log(`   - 승인 직후 재직 인증 상태: ${activeBadgesBefore.employmentVerified}`);
    console.log(`   - 재직인증 만료시점: ${activeBadgesBefore.employmentExpiredAt}`);

    if (!activeBadgesBefore.employmentVerified) {
      throw new Error('승인 처리 후 직업인증 배지가 활성화되어야 합니다.');
    }
    if (!activeBadgesBefore.employmentExpiredAt) {
      throw new Error('직업인증 배지의 만료 기간이 지정되어야 합니다.');
    }

    // 만료 시점이 현재로부터 대략 1년(365일) 후인지 검증
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const diffHours = Math.abs(activeBadgesBefore.employmentExpiredAt.getTime() - oneYearFromNow.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
      throw new Error(`만료 기간 연산이 잘못되었습니다. 기댓값: 약 1년 후, 실측 시점: ${activeBadgesBefore.employmentExpiredAt}`);
    }
    console.log('   - [TEST 1 PASS] 승인 시 만료 시간 연산 완벽 작동 확인!');

    // ----------------------------------------------------
    // 2. 만료 배지 자동 필터링 및 DB 자가치유(Self-Healing) 검증
    // ----------------------------------------------------
    console.log('\n[TEST 2] 만료 시점 경과 배지 자동 비활성화(자가치유) 검증');
    
    // 만료일이 2일 전인 상태로 배지 정보 강제 모킹
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const expiredBadges = {
      identityVerified: true,
      identityExpiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1년 후 만료
      employmentVerified: true,
      employmentExpiredAt: pastDate, // 2일 전 이미 만료됨
      maritalStatusVerified: false,
      educationVerified: false
    };

    await VerificationService.setBadgesForTest(testerId, expiredBadges);

    // getActiveBadges를 통해 조회할 때 자동으로 employment가 false로 격하되는지 검증
    const sanitizedBadges = await VerificationService.getActiveBadges(testerId);
    console.log(`   - 자가치유 후 재직인증 상태: ${sanitizedBadges.employmentVerified} (Expected: false)`);
    console.log(`   - 자가치유 후 신원인증 상태: ${sanitizedBadges.identityVerified} (Expected: true)`);

    if (sanitizedBadges.employmentVerified) {
      throw new Error('만료 기간이 지난 배지가 여전히 활성 상태로 판독되었습니다.');
    }
    if (!sanitizedBadges.identityVerified) {
      throw new Error('만료 기간이 지나지 않은 신원인증 배지가 비활성화되었습니다.');
    }
    console.log('   - [TEST 2 PASS] 만료 배지 자가치유 필터링 검증 통과!');

    // ----------------------------------------------------
    // 3. 일본 유저 특화 상호주의(Reciprocity) 가드 검증
    // ----------------------------------------------------
    console.log('\n[TEST 3] 상호주의(Reciprocity) 가드 기반 상대방 배지 마스킹 검증');

    const profileUserBadges = {
      identityVerified: true,
      identityExpiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      employmentVerified: false,
      maritalStatusVerified: false,
      educationVerified: true, // 학력 인증 완료
      educationExpiredAt: undefined
    };

    // 프로필 유저 설정
    await VerificationService.setBadgesForTest(profileUserId, profileUserBadges);

    // Case A: 뷰어가 학력인증을 하지 않은 경우 (Viewer: No Education Verified)
    const viewerNoEduBadges = {
      identityVerified: true,
      educationVerified: false
    };
    await VerificationService.setBadgesForTest(viewerNoEduId, viewerNoEduBadges);

    const maskedProfileA = await PrivacyService.getMaskedProfile(profileUserId, viewerNoEduId, {
      profileUser: { id: profileUserId, nickname: '프로필유저', country: 'JP', verificationBadges: profileUserBadges },
      viewerUser: { id: viewerNoEduId, country: 'JP', verificationBadges: viewerNoEduBadges },
      isMatched: false
    });

    console.log(`   - Case A (학력인증 미제출 뷰어): 상대방 학력 배지 노출=${maskedProfileA.verificationBadges?.educationVerified}, 잠금여부=${maskedProfileA.verificationBadges?.educationVerifiedLocked}`);
    if (maskedProfileA.verificationBadges?.educationVerified) {
      throw new Error('상호주의 위반: 학력 인증을 완료하지 않은 사용자에게 상대의 학력 배지가 노출되었습니다.');
    }
    if (!maskedProfileA.verificationBadges?.educationVerifiedLocked) {
      throw new Error('상호주의 위반: 뷰어가 미인증인 경우 배지 상태가 Locked로 플래깅되어야 합니다.');
    }

    // Case B: 뷰어가 학력인증을 완료한 경우 (Viewer: Education Verified)
    const viewerWithEduBadges = {
      identityVerified: true,
      educationVerified: true
    };
    await VerificationService.setBadgesForTest(viewerWithEduId, viewerWithEduBadges);

    const maskedProfileB = await PrivacyService.getMaskedProfile(profileUserId, viewerWithEduId, {
      profileUser: { id: profileUserId, nickname: '프로필유저', country: 'JP', verificationBadges: profileUserBadges },
      viewerUser: { id: viewerWithEduId, country: 'JP', verificationBadges: viewerWithEduBadges },
      isMatched: false
    });

    console.log(`   - Case B (학력인증 완료 뷰어): 상대방 학력 배지 노출=${maskedProfileB.verificationBadges?.educationVerified}, 잠금여부=${maskedProfileB.verificationBadges?.educationVerifiedLocked}`);
    if (!maskedProfileB.verificationBadges?.educationVerified) {
      throw new Error('상호주의 충족: 학력 인증을 서로 완료한 상태인데 상대의 학력 배지가 노출되지 않았습니다.');
    }
    if (maskedProfileB.verificationBadges?.educationVerifiedLocked) {
      throw new Error('상호주의 충족: 상호 인증 상태인데 배지가 잠겨있습니다.');
    }

    // Case C: 뷰어가 학력인증을 하지 않았으나 매칭된 경우 (Viewer: No Edu but Matched)
    const maskedProfileC = await PrivacyService.getMaskedProfile(profileUserId, viewerNoEduId, {
      profileUser: { id: profileUserId, nickname: '프로필유저', country: 'JP', verificationBadges: profileUserBadges },
      viewerUser: { id: viewerNoEduId, country: 'JP', verificationBadges: viewerNoEduBadges },
      isMatched: true // 매칭 성공
    });

    console.log(`   - Case C (학력인증 미제출이나 매칭 성공): 상대방 학력 배지 노출=${maskedProfileC.verificationBadges?.educationVerified}, 잠금여부=${maskedProfileC.verificationBadges?.educationVerifiedLocked}`);
    if (!maskedProfileC.verificationBadges?.educationVerified) {
      throw new Error('매칭 우회 성공: 매칭이 완료된 유저인데 상대방의 학력 배지가 노출되지 않았습니다.');
    }
    if (maskedProfileC.verificationBadges?.educationVerifiedLocked) {
      throw new Error('매칭 우회 성공: 매칭 완료 유저임에도 배지가 잠겨있습니다.');
    }

    console.log('\n✅ ====================================================');
    console.log('✅ [ALL PASS] 신뢰 배지 유효기간 만료 및 상호주의 검증 통과!');
    console.log('✅ ====================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ [TEST FAILURE] 테스트 중 에러 발생:', error);
    process.exit(1);
  }
}

runTests();
