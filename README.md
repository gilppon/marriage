# 🌸 Best-Saiko Match (Premium Korea-Japan Matching Service)

> **Best-Saiko Match**는 대한민국과 일본의 프리미엄 싱글들을 위한 가치관 분석 기반의 1:1 매칭 웹 애플리케이션입니다. 
> 고도의 신원 인증 체계(eKYC), 실시간 대화 감시(AI Shield), 초저지연 WebSocket 통화 게이트웨이 및 글로벌 다국어(한국어/일본어) 환경을 단일 모놀리식 서버 구조에서 제공합니다.

---

## 🚀 주요 기능 (Key Features)

### 1. 🌐 글로벌 실시간 다국어 지원 (Dynamic Localization)
- 헤더의 **KR | JP 토글**을 통해 페이지 새로고침 없이 메인 화면과 매칭 화면의 모든 UI 텍스트가 실시간 한국어/일본어로 스위칭됩니다.

### 2. 🛡️ 상호주의 기반 신원 검증 배지 (eKYC & Reciprocity Badge)
- 미혼 인증(Single), 직장 인증(Job), 학력 인증(Education), 신원(Identity) 검증 서류 제출 프로세스 탑재.
- **상호주의(Reciprocity) 원칙**에 의해, 나 또한 서류 인증을 받아 배지가 활성화되어야만 상대방의 배지 정보를 잠금 해제하여 열람할 수 있습니다.

### 📊 3. 과학적 가치관 분석 매칭 & 물리 엔진 시각화
- 결혼관, 재정관, 자녀 계획, 거주지 유연성에 대한 다차원 호합도 점수 산출 및 AI 코칭 리포트 발행.
- **Matter.js** 기반의 인터랙티브 물리 엔진 캔버스를 통해 기존 소개팅 앱의 피로(성비 불균형, 외모 줄 세우기) 및 Best-Saiko의 대안 가치를 시각적으로 드래그하며 체험할 수 있습니다.

### 💬 4. 실시간 WebSocket 채팅 & AI 세이프가드 (Gemini Guard)
- 동일 포트에서 구동되는 초저지연 WebSocket 서버를 활용하여 1:1 실시간 대화 및 통화 릴레이 지원.
- 대화 중 계좌 유도, 송금 요구 등의 금전 사기 패턴 감지 시 **AI 실시간 스캠 경고 배너**가 즉각 가동됩니다.

### 💳 5. Toss Payments & PayPal 이중 결제 연동
- 국내 유저를 위한 **토스페이먼츠(카드, 계좌이체)** 및 해외/일본 유저를 위한 **PayPal** 일회성 상품 및 Pro 멤버십 업그레이드 결제 모듈이 완벽히 가동됩니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
- **React 18 + TypeScript**
- **Vite** (초고속 빌드 및 HMR)
- **Tailwind CSS + Framer Motion** (프리미엄 애니메이션 및 반응형 레이아웃)
- **React Router DOM** (멀티페이지 라우팅)
- **Firebase Client SDK** (인증 및 주문 이력 저장)

### Backend (Monolith)
- **Node.js + Express**
- **TypeScript (tsc)**
- **ws (WebSocket)** (실시간 통화 및 대화 제어)
- **Firebase Admin SDK** (서버 측 데이터 검증 및 연령 검증 가드)
- **Google Gemini Generative AI SDK** (대화 세이프가드 분석)

---

## 📂 디렉토리 구조 (Directory Structure)

```text
marriage/
├── backend/            # Express 백엔드 API & WebSocket 서버
│   ├── src/
│   │   ├── config/     # Firebase Admin SDK 설정
│   │   ├── services/   # DB 관리, 매칭 점수, 서류 심사, Gemini 서비스 로직
│   │   ├── types/      # 공통 TS 타입 정의
│   │   ├── utils/      # 톤앤매너 번역 사전 등 유틸리티
│   │   └── server.ts   # 백엔드 게이트웨이 메인 엔트리
│   ├── tsconfig.json
│   └── package.json
├── src/                # Vite React 웹 프론트엔드
│   ├── components/     # 네비게이션, 결제 모듈, 매칭 컨테이너 컴포넌트
│   ├── contexts/       # Auth 및 글로벌 Language Context
│   ├── config/         # 다국어 리소스 사전 (content.ts)
│   ├── pages/          # 메인 랜딩 페이지 및 주요 뷰
│   ├── App.tsx         # 클라이언트 라우터 및 글로벌 레이아웃
│   └── main.tsx
├── dist/               # 프론트엔드 빌드 결과물 (Express가 서빙)
├── vite.config.ts      # 개발 시 백엔드로의 API/WS 프록시 설정
├── package.json
└── README.md
```

---

## ⚙️ 실행 및 배포 가이드 (Getting Started)

### 1. 환경 변수 설정
`backend/.env` 파일을 생성하고 다음 값을 구성합니다.
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key
```

### 2. 패키지 설치
* **루트(프론트엔드)** 패키지 설치:
  ```bash
  npm install
  ```
* **백엔드** 패키지 설치:
  ```bash
  cd backend
  npm install
  cd ..
  ```

### 3. 개발(Dev) 모드 구동
프론트엔드와 백엔드를 각각 가동하여 독립적으로 개발을 진행할 수 있습니다. `vite.config.ts` 프록시 설정에 의해 프론트엔드의 `/api` 및 `/ws` 호출은 백엔드 포트(3000)로 자동 우회됩니다.

* **백엔드 실행 (Port 3000)**:
  ```bash
  cd backend
  npm run dev
  ```
* **프론트엔드 실행 (Port 5173)**:
  ```bash
  # 루트 디렉토리에서
  npm run dev
  ```

### 4. 프로덕션 빌드 및 단일 포트 통합 실행 (Monolith)
프로덕션 환경에서는 프론트엔드를 빌드한 후, Express 서버 1개만 실행하면 모든 웹 리소스와 API, WebSocket이 동일 포트(3000)에서 통합 가동됩니다.

1. **프론트엔드 빌드**:
   ```bash
   npm run build
   # 빌드 결과물이 루트의 /dist 폴더에 생성됩니다.
   ```
2. **백엔드 빌드**:
   ```bash
   cd backend
   npm run build
   ```
3. **통합 서버 실행**:
   ```bash
   npm start
   # 또는 node dist/server.js
   ```
   이후 브라우저에서 `http://localhost:3000`으로 접속하여 웹사이트 및 서비스를 이용합니다.
