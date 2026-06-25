// ============================================================
// Video Configuration — 영상 URL 관리
// ============================================================
// 여기서 각 섹션의 배경 영상을 관리합니다.
// 
// 영상 교체 방법:
// 1. public/ 폴더에 MP4 파일을 넣고 '/파일명.mp4' 로 경로 지정
// 2. 또는 외부 호스팅 URL (CloudFront, S3 등)을 직접 입력
//
// 예시:
//   hero: '/my-hero-video.mp4',         ← public/my-hero-video.mp4
//   hero: 'https://cdn.example.com/v.mp4', ← 외부 URL
//   hero: '',                            ← 영상 없이 검정 배경
// ============================================================

export const VIDEO_URLS = {
  // 히어로 섹션 — 마우스 움직임으로 스크럽되는 영상 (자동재생 X)
  hero: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_083515_290e5a10-0b95-41af-a5e2-32b6389baa4d.mp4',

  // 시네마틱 텍스트 섹션 — 자동재생, 음소거, 반복
  section2: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_092455_089c54f8-3b03-4966-9df1-e9746063d0ef.mp4',

  // 성능 지표 섹션 — 자동재생, 음소거, 반복
  metrics: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_095810_ecea3dd2-fc5e-4e41-8696-4219290b6589.mp4',

  // 기술/적응형 지능 섹션 — 자동재생, 음소거, 반복
  technology: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_095750_32a52ce0-2005-45c9-9093-41f03fde9530.mp4',

  // 푸터 — 자동재생, 음소거, 반복
  footer: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_080203_fd7f4f85-3a86-4837-8192-85e7bfe68e75.mp4',
};
