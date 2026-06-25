// ============================================================
// Site Content Configuration — 텍스트/데이터 관리
// ============================================================
// 사이트에 표시되는 모든 텍스트를 여기서 수정할 수 있습니다.
// ============================================================

export const SITE_CONFIG = {
  // 브랜드
  brandName: 'Hana-Il Marriage Match',
  copyright: '© 2026 Hana-Il Match. All rights reserved.',

  // 히어로 섹션
  hero: {
    titleLeft: ['Hana-Il', 'Marriage'],
    titleRight: ['Perfect', 'Match'],
    watermark: 'HANA-IL',
    description:
      '한국과 일본을 잇는 프리미엄 가치관 분석 결혼 정보 매칭 서비스. 신뢰할 수 있는 신원 인증 체계와 매칭 알고리즘을 통해 일생의 동반자를 찾아드립니다.',
  },

  // 시네마틱 텍스트 섹션
  cinematic: {
    text: '인공지능 기반의 성향 예측 모델과 신원 검증 시스템의 융합. 하나-일 매칭은 단순한 조건 만남을 넘어 가치관, 생활 습관, 미래 설계를 종합 분석합니다. 모든 프로필과 핵심 인증 배지는 상호 동의 하에 안전하게 교환됩니다.',
  },

  // 성능 지표 섹션
  metrics: {
    subtitle: 'Service Metrics',
    items: [
      { value: '87.4%', label: 'Match Satisfaction' },
      { value: '100%', label: 'Identity Verified' },
      { value: '12.4K', label: 'Active Members' },
    ],
  },

  // 기술 섹션
  technology: {
    title: ['Verified &', 'Scientific'],
    description:
      '회원님의 미혼 인증, 직장, 학력 등 중요 배지를 블러 처리하여 보안을 확보하고, 매칭 수락 시 매끄럽게 교환하는 독자적 프로토콜을 탑재했습니다.',
    features: [
      {
        title: '가치관 분석 매칭',
        desc: '결혼관, 재정관, 생활 패턴 적합도를 분석하는 과학적 알고리즘.',
      },
      {
        title: '신원 검증 배지',
        desc: '미혼, 직업, 학력 등 국가 공인 서류 기반의 철저한 인증.',
      },
      {
        title: '안심 마스킹 프로토콜',
        desc: '상호 동의 전까지 개인 정보를 안전하게 블러(Blur) 보호.',
      },
      {
        title: '경어체 공개 요청',
        desc: '상대방에게 매너 있고 공손한 톤앤매너로 정보 교환을 요청.',
      },
    ],
  },

  // 아키텍처 섹션
  architecture: {
    subtitle: 'Process',
    heading: 'Three Steps. Secure Connection.',
    description:
      '철저한 검증을 통과한 회원 등록, 가치관 분석 매칭 신청, 그리고 상호 동의 기반의 프라이빗 만남 진행까지 안전하고 매끄럽게 연결됩니다.',
    layers: [
      { num: 1, name: 'Identity Verify' },
      { num: 2, name: 'Value Matching' },
      { num: 3, name: 'Secure Exchange' },
    ],
  },

  // 푸터
  footer: {
    tagline:
      '한-일 최고의 오피니언 리더들과 프리미엄 싱글들을 위한 고품격 만남의 장. 생애 최고의 선택을 함께합니다.',
  },

  // 네비게이션
  nav: {
    links: [
      { label: 'About', scrollMultiplier: 1 },
      { label: 'Metrics', scrollMultiplier: 2 },
    ],
    downloadLabel: 'Start Match',
  },
};
