# -*- coding: utf-8 -*-
import subprocess
import sys
import os

def run_command(command, description):
    print(f"\n[RUNNING] {description}...")
    print(f"   Command: {command}")
    
    result = subprocess.run(command, shell=True, capture_output=True, text=True, encoding='utf-8')
    
    if result.returncode == 0:
        print(f"[SUCCESS] {description} 통과!")
        return True, result.stdout
    else:
        print(f"[FAILURE] {description} 실패!")
        print(f"--- ERROR LOG ---")
        print(result.stdout)
        print(result.stderr)
        print(f"-----------------")
        return False, result.stderr

def main():
    # Windows 콘솔 인코딩 대응을 위해 stdout 인코딩 재설정 시도
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass # 구형 python 버전 예외 방지

    print("====================================================")
    print("SOP - korea aimasu Backend Integration Verification Gate")
    print("====================================================")
    
    # 1단계: TypeScript 정적 컴파일 빌드 검사
    build_success, build_log = run_command("npm run build", "TypeScript 소스코드 정적 빌드 검증")
    if not build_success:
        print("\n[Verification Blocked] 빌드 실패로 인해 검증을 조기 종료합니다.")
        sys.exit(1)
        
    # 2단계: 16kHz PCM WebSocket 오디오 릴레이 지연 속도 검증 (E2E RTT 테스트)
    latency_success, latency_log = run_command("npx ts-node tests/latencyTest.ts", "16kHz PCM 오디오 릴레이 RTT 지연 실사 검증 (E2E)")
    if not latency_success:
        print("\n[Verification Blocked] 지연 속도 검증 실패!")
        sys.exit(1)
        
    # 3단계: AI 안전 가드 및 자동 차단 비즈니스 시나리오 검사 (E2E 가드 테스트)
    guard_success, guard_log = run_command("npx ts-node tests/aiGuardTest.ts", "AI 가드 탐지 및 스캠 스코어 자동 BAN 시나리오 검증 (E2E)")
    if not guard_success:
        print("\n[Verification Blocked] AI 가드 시나리오 검증 실패!")
        sys.exit(1)

    # 4단계: 신뢰 기반 검증 및 프라이버시 설정 시나리오 검증
    verif_success, verif_log = run_command("npx ts-node tests/verificationTest.ts", "신뢰 검증 및 프라이버시 프로필 마스킹 E2E 검증")
    if not verif_success:
        print("\n[Verification Blocked] 신뢰 검증 및 프라이버시 검증 실패!")
        sys.exit(1)

    # 5단계: 매칭 알고리즘 및 화상 예약 캘린더 시나리오 검증
    match_success, match_log = run_command("npx ts-node tests/matchMeetingTest.ts", "결혼 가치관 매칭 및 화상 미팅 E2E 검증")
    if not match_success:
        print("\n[Verification Blocked] 매칭 및 화상 미팅 검증 실패!")
        sys.exit(1)

    # 6단계: BM 페이월, 매니저 리포트, 일본어 UX 템플릿 검증
    bm_success, bm_log = run_command("npx ts-node tests/bmConciergeTest.ts", "BM 페이월, 매니저 리포트 및 일본어 경어 E2E 검증")
    if not bm_success:
        print("\n[Verification Blocked] BM 및 매니저 어드바이스 검증 실패!")
        sys.exit(1)
        
    # 7단계: 한일 법규 규제 준수, eKYC 및 보안 암호화 검증
    security_success, security_log = run_command("npx ts-node tests/complianceSecurityTest.ts", "한일 규제 준수, eKYC 안면대조 및 보안 암호화 E2E 검증")
    if not security_success:
        print("\n[Verification Blocked] 규제 준수 및 eKYC 검증 실패!")
        sys.exit(1)

    # 8단계: 상세 프로필 입력 및 유효성 검사 E2E 검증
    profile_success, profile_log = run_command("npx ts-node tests/profileEditTest.ts", "상세 프로필 입력 및 유효성 검사 E2E 검증")
    if not profile_success:
        print("\n[Verification Blocked] 상세 프로필 검증 실패!")
        sys.exit(1)

    # 9단계: 가치관 가중치 매칭 및 Gemini AI 조언 E2E 검증
    advice_success, advice_log = run_command("npx ts-node tests/marriageMatchAdviceTest.ts", "가치관 가중치 매칭 및 Gemini AI 조언 E2E 검증")
    if not advice_success:
        print("\n[Verification Blocked] AI 가치관 조언 검증 실패!")
        sys.exit(1)

    # 10단계: 신뢰 배지 유효기간 및 상호주의 E2E 검증
    trust_success, trust_log = run_command("npx ts-node tests/trustBadgeExpiryTest.ts", "신뢰 배지 유효기간 및 상호주의 E2E 검증")
    if not trust_success:
        print("\n[Verification Blocked] 신뢰 배지 검증 실패!")
        sys.exit(1)

    # 11단계: 개인정보 세부 통제 및 검색 제외 E2E 검증
    privacy_success, privacy_log = run_command("npx ts-node tests/privacyExclusionTest.ts", "개인정보 세부 통제 및 검색 제외 E2E 검증")
    if not privacy_success:
        print("\n[Verification Blocked] 개인정보 통제 검증 실패!")
        sys.exit(1)
        
    print("\n====================================================")
    print("[ALL PASS] 모든 Verification SOP 게이트를 성공적으로 통과했습니다!")
    print("   - 빌드 무결성: OK")
    print("   - RTT 레이턴시: OK (< 50ms)")
    print("   - AI 가드 격리 징계: OK")
    print("   - 신뢰 검증 및 프라이버시: OK")
    print("   - 가치관 매칭 및 미팅 예약: OK")
    print("   - BM 페이월 및 매니저 리포트: OK")
    print("   - 한일 규제 준수 및 eKYC 보안: OK")
    print("   - 상세 프로필 및 가치관: OK")
    print("   - 가치관 가중치 및 AI 조언: OK")
    print("   - 신뢰 배지 및 상호주의: OK")
    print("   - 개인정보 세부 통제 및 검색 제외: OK")
    print("====================================================")
    sys.exit(0)

if __name__ == "__main__":
    main()
