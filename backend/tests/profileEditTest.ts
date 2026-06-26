import { DbService } from '../src/services/dbService';

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 사용자 상세 프로필(혈액형, 취미, 종교, 라이프스타일) 검증');
  console.log('🧪 ====================================================');

  try {
    const userId = 'user_profile_tester';

    // ----------------------------------------------------
    // [TEST 1] 필수 정보 누락 검사
    // ----------------------------------------------------
    console.log('\n[TEST 1] 필수 정보 누락 시 예외 발생 검사');
    try {
      await DbService.saveUserProfile(userId, {
        userName: '김철수',
        userRole: 'korean'
        // religion, lifestyle 누락
      });
      throw new Error('필수 정보가 없는데 저장이 완료되었습니다!');
    } catch (err: any) {
      if (err.message !== 'MISSING_REQUIRED_FIELDS') throw err;
      console.log('   - 필수 필드 누락 예외 포착 성공: MISSING_REQUIRED_FIELDS');
    }

    // ----------------------------------------------------
    // [TEST 2] 유효하지 않은 종교 값 검사
    // ----------------------------------------------------
    console.log('\n[TEST 2] 잘못된 종교 값 입력 검사');
    try {
      await DbService.saveUserProfile(userId, {
        userName: '김철수',
        userRole: 'korean',
        religion: 'HINDUISM', // 지원되지 않는 종교
        lifestyle: {
          residenceType: '자취',
          drinking: 'NO',
          smoking: 'NO'
        }
      });
      throw new Error('잘못된 종교 값인데 저장이 성공했습니다.');
    } catch (err: any) {
      if (err.message !== 'INVALID_RELIGION_VALUE') throw err;
      console.log('   - 잘못된 종교 값 예외 포착 성공: INVALID_RELIGION_VALUE');
    }

    // ----------------------------------------------------
    // [TEST 3] 라이프스타일 필드 정합성 검사
    // ----------------------------------------------------
    console.log('\n[TEST 3] 라이프스타일 필수 속성 누락 및 잘못된 값 검사');
    // 속성 누락
    try {
      await DbService.saveUserProfile(userId, {
        userName: '김철수',
        userRole: 'korean',
        religion: 'NONE',
        lifestyle: {
          residenceType: '자취'
          // drinking, smoking 누락
        }
      });
      throw new Error('라이프스타일 속성이 누락되었는데 성공했습니다.');
    } catch (err: any) {
      if (err.message !== 'MISSING_LIFESTYLE_FIELDS') throw err;
      console.log('   - 라이프스타일 속성 누락 예외 포착 성공: MISSING_LIFESTYLE_FIELDS');
    }

    // 잘못된 값
    try {
      await DbService.saveUserProfile(userId, {
        userName: '김철수',
        userRole: 'korean',
        religion: 'NONE',
        lifestyle: {
          residenceType: '자취',
          drinking: 'SO_MUCH', // 잘못된 값
          smoking: 'NO'
        }
      });
      throw new Error('라이프스타일 값이 비정상인데 성공했습니다.');
    } catch (err: any) {
      if (err.message !== 'INVALID_LIFESTYLE_VALUES') throw err;
      console.log('   - 라이프스타일 이상 값 예외 포착 성공: INVALID_LIFESTYLE_VALUES');
    }

    // ----------------------------------------------------
    // [TEST 4] 혈액형 및 취미 태그 에러 검사
    // ----------------------------------------------------
    console.log('\n[TEST 4] 잘못된 혈액형 및 취미 규격 초과 검사');
    // 혈액형
    try {
      await DbService.saveUserProfile(userId, {
        userName: '김철수',
        userRole: 'korean',
        religion: 'NONE',
        lifestyle: { residenceType: '자취', drinking: 'NO', smoking: 'NO' },
        bloodType: 'RH-' // 이상 혈액형
      });
      throw new Error('잘못된 혈액형 정보가 통과되었습니다.');
    } catch (err: any) {
      if (err.message !== 'INVALID_BLOOD_TYPE') throw err;
      console.log('   - 잘못된 혈액형 예외 포착 성공: INVALID_BLOOD_TYPE');
    }

    // 취미 수 초과 (11개)
    try {
      await DbService.saveUserProfile(userId, {
        userName: '김철수',
        userRole: 'korean',
        religion: 'NONE',
        lifestyle: { residenceType: '자취', drinking: 'NO', smoking: 'NO' },
        hobbies: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
      });
      throw new Error('취미가 10개를 초과했는데 통과되었습니다.');
    } catch (err: any) {
      if (err.message !== 'TOO_MANY_HOBBIES') throw err;
      console.log('   - 취미 초과 등록 차단 예외 포착 성공: TOO_MANY_HOBBIES');
    }

    // ----------------------------------------------------
    // [TEST 5] 정상 프로필 등록 및 로드 통합 E2E 검증
    // ----------------------------------------------------
    console.log('\n[TEST 5] 정상 프로필 데이터 저장 및 복원 검사');
    const validProfile = {
      userName: '타나카',
      userRole: 'fan',
      religion: 'BUDDHIST',
      lifestyle: {
        residenceType: '본가',
        drinking: 'SOMETIMES',
        smoking: 'NO'
      },
      bloodType: 'AB',
      hobbies: ['요리', '한국어공부', '애니메이션']
    };

    const saved = await DbService.saveUserProfile(userId, validProfile);
    console.log(`   - 프로필 저장 완료: 업데이트일자=${saved.updatedAt}`);

    const loaded = await DbService.getUserProfile(userId);
    if (!loaded) throw new Error('저장된 유저 상세 프로필을 찾을 수 없습니다.');
    console.log(`   - 프로필 로드 성공: 이름=${loaded.userName}, 종교=${loaded.religion}, 혈액형=${loaded.bloodType}`);
    
    if (loaded.userName !== '타나카' || loaded.lifestyle.drinking !== 'SOMETIMES' || loaded.bloodType !== 'AB') {
      throw new Error('불러온 프로필 정보와 저장했던 정보가 서로 일치하지 않습니다!');
    }
    if (!loaded.hobbies || loaded.hobbies.length !== 3 || loaded.hobbies[1] !== '한국어공부') {
      throw new Error('취미 태그 배열 복원 정합성 에러');
    }

    console.log('\n✅ ====================================================');
    console.log('✅ [ALL PASS] 상세 프로필 입력 및 유효성 검사 E2E 성공!');
    console.log('✅ ====================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ [TEST FAILURE] 테스트 도중 에러:', error);
    process.exit(1);
  }
}

runTests();
