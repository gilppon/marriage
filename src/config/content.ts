// ============================================================
// Site Content Configuration — 텍스트/데이터 관리 (다국어 지원)
// ============================================================
// 한국어(ko)와 일본어(ja) 번역 데이터를 관리합니다.
// ============================================================

export const SITE_CONFIG = {
  ko: {
    brandName: 'Best-Saiko Marriage Match',
    copyright: '© 2026 Next-haru. All rights reserved.',

    // 히어로 섹션
    hero: {
      titleLeft: ['Best-Saiko', '결혼'],
      titleRight: ['완벽한', '매칭'],
      watermark: 'BEST-SAIKO',
      description:
        '한국과 일본을 잇는 프리미엄 가치관 분석 결혼 정보 매칭 서비스. 신뢰할 수 있는 신원 인증 체계와 매칭 알고리즘을 통해 일생의 동반자를 찾아드립니다.',
    },

    // 시네마틱 텍스트 섹션
    cinematic: {
      text: '인공지능 기반의 성향 예측 모델과 신원 검증 시스템의 융합. Best-Saiko 매칭은 단순한 조건 만남을 넘어 가치관, 생활 습관, 미래 설계를 종합 분석합니다. 모든 프로필과 핵심 인증 배지는 상호 동의 하에 안전하게 교환됩니다.',
    },

    // 성능 지표 섹션
    metrics: {
      subtitle: 'Service Metrics',
      items: [
        { value: '87.4%', label: '매칭 만족도' },
        { value: '100%', label: '본인 신원 검증 완료' },
        { value: '12.4K', label: '실시간 활동 회원' },
      ],
    },

    // 기술 섹션
    technology: {
      title: ['검증되고', '과학적인'],
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
      heading: '안전한 연결을 위한 3단계 프로세스',
      description:
        '철저한 검증을 통과한 회원 등록, 가치관 분석 매칭 신청, 그리고 상호 동의 기반의 프라이빗 만남 진행까지 안전하고 매끄럽게 연결됩니다.',
      layers: [
        { num: 1, name: '신원 검증' },
        { num: 2, name: '가치관 분석 매칭' },
        { num: 3, name: '보안 정보 교환' },
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
        { label: '소개', scrollMultiplier: 1 },
        { label: '지표', scrollMultiplier: 2 },
      ],
      downloadLabel: '매칭 시작하기',
    },
  },
  ja: {
    brandName: 'Best-Saiko Marriage Match',
    copyright: '© 2026 Best-Saiko Match. All rights reserved.',

    // 히어로 섹션
    hero: {
      titleLeft: ['日韓', '結婚'],
      titleRight: ['最高の', 'マッチング'],
      watermark: 'BEST-SAIKO',
      description:
        '日韓を結ぶプレミアム価値観分析結婚マッチングサービス。信頼できる本人確認システムとマッチングアルゴリズムを通じて、生涯의伴侶をお探しします。',
    },

    // 시네마틱 텍스트 섹션
    cinematic: {
      text: '人工知能ベースの傾向予測モデルと本人確認システムの融合。Best-Saikoマッチングは単なる条件の出会いを超え、価値観、生活習慣、将来設計を総合分析します。すべてのプロフィールと核心認証バッジは、相互同意のもとで安全に交換されます。',
    },

    // 성능 지표 섹션
    metrics: {
      subtitle: 'Service Metrics',
      items: [
        { value: '87.4%', label: 'マッチング満足度' },
        { value: '100%', label: '本人確認済み' },
        { value: '12.4K', label: 'アクティブメンバー' },
      ],
    },

    // 기술 섹션
    technology: {
      title: ['検証済み ＆', 'サイエンス'],
      description:
        'お客様の独身認証、職場、学歴などの重要バッジをブラインド処理してセキュリティを確保し、マッチング同意時にスムーズに交換する独自のプロトコルを搭載しました。',
      features: [
        {
          title: '価値観分析マッチング',
          desc: '結婚観、金銭観、生活パターンの適合度を分析する科学的アルゴリズム。',
        },
        {
          title: '身元検証バッジ',
          desc: '独身、職業、学歴など公的書類に基づく徹底した認証。',
        },
        {
          title: '安心マスクプロトコル',
          desc: '相互同意の前まで個人情報を安全にマスク（ぼかし）保護。',
        },
        {
          title: '敬語公開リクエスト',
          desc: '相手にマナー正しく丁寧なトーン＆マナーで情報交換を要請。',
        },
      ],
    },

    // 아키텍처 섹션
    architecture: {
      subtitle: 'Process',
      heading: '安全な接続のための3段階プロセス',
      description:
        '徹底した検証を通過した会員登録、価値観分析マッチング의 신청、그리고 相互同意에 기반한 프라이빗한 만남 진행까지 안전하고 매끄럽게 연결됩니다.',
      layers: [
        { num: 1, name: '身元検証' },
        { num: 2, name: '価値観マッチング' },
        { num: 3, name: '安全な情報交換' },
      ],
    },

    // 푸터
    footer: {
      tagline:
        '日韓のオピニオンリーダーとプレミアムシングルのための高品格な出会いの場。生涯最高の選択を共にします。',
    },

    // 네비게이션
    nav: {
      links: [
        { label: '紹介', scrollMultiplier: 1 },
        { label: '指標', scrollMultiplier: 2 },
      ],
      downloadLabel: 'マッチング開始',
    },
  },
};
