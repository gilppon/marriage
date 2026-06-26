import { VerificationService } from '../src/services/verificationService';
import { encrypt, decrypt } from '../src/utils/crypto';
import { EkycService } from '../src/services/ekycService';

// 회원가입 나이 검증 헬퍼 (server.ts와 동일한 연산 로직 검증)
function checkSignupAge(birthdate: string, country: 'KR' | 'JP'): boolean {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (country === 'KR' && age < 19) return false;
  if (country === 'JP' && age < 18) return false;
  return true;
}

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 규제 준수(eKYC), 암호화 및 PWA 보안 아키텍처 E2E 검증');
  console.log('🧪 ====================================================');

  try {
    const userId = 'user_security_tester';

    // ----------------------------------------------------
    // 1. 회원가입 한일 법적 연령 제한 필터링 검증
    // ----------------------------------------------------
    console.log('\n[TEST 1] 한국(만 19세) 및 일본(만 18세) 연령 차단 가드 테스트');
    
    // 한국 미성년자 (만 17세 가정)
    const krMinor = checkSignupAge('2009-06-01', 'KR');
    console.log(`   - 한국 2009년생 가입 승인 여부: ${krMinor} (기대값: false)`);
    if (krMinor !== false) throw new Error('한국 미성년자가 나이 제한 게이트를 뚫었습니다.');

    // 한국 성인 (만 25세 가정)
    const krAdult = checkSignupAge('2001-01-15', 'KR');
    console.log(`   - 한국 2001년생 가입 승인 여부: ${krAdult} (기대값: true)`);
    if (krAdult !== true) throw new Error('한국 성인의 가입이 제한되었습니다.');

    // 일본 미성년자 (만 16세 가정)
    const jpMinor = checkSignupAge('2010-02-10', 'JP');
    console.log(`   - 일본 2010년생 가입 승인 여부: ${jpMinor} (기대값: false)`);
    if (jpMinor !== false) throw new Error('일본 미성년자가 나이 제한 게이트를 뚫었습니다.');

    // 일본 성인 (만 20세 가정)
    const jpAdult = checkSignupAge('2006-03-20', 'JP');
    console.log(`   - 일본 2006년생 가입 승인 여부: ${jpAdult} (기대값: true)`);
    if (jpAdult !== true) throw new Error('일본 성인의 가입이 제한되었습니다.');

    console.log('   - 나이 제한 가드 검증 통과!');

    // ----------------------------------------------------
    // 2. 민감 개인정보(여권번호) AES-256 양방향 암호화 검증
    // ----------------------------------------------------
    console.log('\n[TEST 2] AES-256-CBC 고유식별정보 암호화 및 복호화 검증');
    const rawIdNumber = 'M987654321';
    
    // 암복호화 정합성 테스트
    const encrypted = encrypt(rawIdNumber);
    const decrypted = decrypt(encrypted);
    console.log(`   - 원본: ${rawIdNumber} ➡️ 암호화: ${encrypted} ➡️ 복호화: ${decrypted}`);
    
    if (encrypted === rawIdNumber) throw new Error('암호화가 진행되지 않고 평문 그대로 보관되었습니다.');
    if (decrypted !== rawIdNumber) throw new Error('복호화 결과 원본 데이터와 일치하지 않습니다.');

    // DB 제출 시 자동 암호화 검사
    const doc = await VerificationService.submitDocument(
      userId,
      'IDENTITY',
      'uploads/identity/passport.jpg',
      { idNumber: rawIdNumber, realName: '김보안' }
    );
    
    const dbIdNumber = (doc.extractedData as any).idNumber;
    console.log(`   - DB 저장 여권번호 필드: ${dbIdNumber}`);
    if (dbIdNumber === rawIdNumber) throw new Error('서류 제출 시 여권번호가 암호화되지 않았습니다.');
    
    const decryptedDbValue = decrypt(dbIdNumber);
    if (decryptedDbValue !== rawIdNumber) throw new Error('DB 암호화 데이터 복호화 복원 실패');
    console.log('   - 민감 개인정보 암호화 격리 통과!');

    // ----------------------------------------------------
    // 3. AI eKYC 안면 대조 유사도 기반 자동 승인 (Similarity >= 90%)
    // ----------------------------------------------------
    console.log('\n[TEST 3] AI eKYC 안면 대조 유사도 90% 이상 자동 승인 테스트');
    
    const autoPassDoc = await VerificationService.submitDocument(
      'user_ekyc_pass',
      'IDENTITY',
      'uploads/identity/pass_card.jpg',
      { realName: '타나카' },
      'uploads/selfie/selfie_auto_pass.jpg' // eKYC 유사도 95% 유도
    );

    console.log(`   - eKYC 자동 통과 문서 상태: ${autoPassDoc.status}, eKYC 유사도: ${(autoPassDoc.extractedData as any).ekycSimilarity}%`);
    if (autoPassDoc.status !== 'APPROVED') throw new Error('안면 유사도가 90% 이상인데 자동 승인(APPROVED)이 되지 않았습니다.');
    if (autoPassDoc.reviewedBy !== 'ai_ekyc') throw new Error('심사자 식별이 ai_ekyc로 표기되지 않았습니다.');

    // ----------------------------------------------------
    // 4. AI eKYC 안면 대조 유사도 미달 수동 이송 (Similarity < 90%)
    // ----------------------------------------------------
    console.log('\n[TEST 4] AI eKYC 안면 대조 유사도 90% 미만 수동 심사 이송 테스트');

    const autoFailDoc = await VerificationService.submitDocument(
      'user_ekyc_fail',
      'IDENTITY',
      'uploads/identity/fail_card.jpg',
      { realName: '김철수' },
      'uploads/selfie/selfie_auto_fail.jpg' // eKYC 유사도 78% 유도
    );

    console.log(`   - eKYC 유사도 부족 문서 상태: ${autoFailDoc.status}, eKYC 유사도: ${(autoFailDoc.extractedData as any).ekycSimilarity}%`);
    if (autoFailDoc.status !== 'SUBMITTED') throw new Error('유사도가 90% 미만인데 즉각 승인이 나거나 비정상 상태입니다.');
    if (autoFailDoc.reviewedBy !== undefined) throw new Error('수동 대기 문서인데 심사자가 이미 지정되어 있습니다.');

    console.log('   - AI eKYC State Machine 흐름 검증 통과!');

    console.log('\n✅ ====================================================');
    console.log('✅ [ALL PASS] 한일 법규 규제 및 eKYC 보안 아키텍처 검증 성공!');
    console.log('✅ ====================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ [TEST FAILURE] 테스트 도중 오류 발생:', error);
    process.exit(1);
  }
}

runTests();
