# Short Creator 🎬

> **AI 기반 쇼츠 자동 생성기 (Unified Rendering Engine 탑재)**
>
> Gemini AI가 대본을 쓰고, Pexels가 이미지를 찾고, ElevenLabs가 목소리를 입혀 고퀄리티 쇼츠를 만듭니다.
> 웹 에디터와 최종 렌더링 결과물이 픽셀 단위로 완벽하게 일치합니다.

![Short Creator Banner](https://via.placeholder.com/800x200?text=Short+Creator)

## ✨ 주요 기능

- **🤖 AI 대본 생성**: Google Gemini가 흥미로운 주제(미스터리, 밸런스 게임, 유머 등)로 대본을 작성합니다.
- **🎨 Interactive Director Mode**: 웹 UI에서 대본 수정, 이미지 교체, 타이밍 조절, 오디오 미리듣기가 가능합니다.
- **📐 Unified Rendering Engine (SSOT)**:
  - `LayoutEngine`이 계산한 **단일 진실 공급원(Render Manifest)**을 사용합니다.
  - 웹 미리보기와 FFmpeg 최종 렌더링 결과가 **100% 시각적으로 일치**합니다.
  - 텍스트 줄바꿈, 폰트 렌더링, Ken Burns 효과의 미세한 오차를 제거했습니다.
- **🖼️ 자동 에셋 소싱**: 대본 키워드에 맞춰 Pexels(고화질), Reddit(밈)에서 이미지를 찾아옵니다.
- **🎙️ 고품질 TTS**: ElevenLabs, Typecast를 지원하여 자연스러운 내레이션을 생성합니다.
- **🎥 다이내믹 렌더링**: Ken Burns 효과(줌인/아웃/팬), 팝업 자막, 배경음악, SFX가 포함된 영상을 생성합니다.

## 🚀 빠른 시작 (Interactive Mode)

가장 쉽고 강력한 방법은 웹 UI를 사용하는 것입니다.

### 1. 환경 설정

`.env.example` 파일을 복사하여 `.env`를 생성하고 API 키를 입력하세요.

```bash
cp .env.example .env
# .env 파일 편집 (GEMINI_API_KEY, PEXELS_API_KEY 필수)
```

### 2. 백엔드 서버 실행

API 서버를 실행하여 AI 및 렌더링 엔진을 대기시킵니다.

```bash
npm install
npm run server
```

### 3. 프론트엔드 실행 (새 터미널)

웹 인터페이스를 실행합니다.

```bash
cd web-ui
npm install
npm run dev
```

### 4. 접속

브라우저에서 **[http://localhost:3000](http://localhost:3000)** 으로 접속하여 나만의 쇼츠를 만들어보세요!

---

## 💻 CLI 모드 사용법

터미널에서 바로 자동 생성할 수도 있습니다.

### 스토리텔링 쇼츠 생성

```bash
npm run story -- --topic "세상에서 가장 무서운 장소"
```

옵션:

- `--image-provider`: `pexels` (기본), `reddit`, `imgflip`, `klipy`
- `--count`: 생성할 영상 개수

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, Remotion (Preview Player), Tailwind CSS
- **Backend**: Node.js, Express, FFmpeg (Final Rendering)
- **Core**: LayoutEngine (Node-Canvas based SSOT)
- **AI**: Google Gemini Pro
- **Media**: Pexels API, ElevenLabs API

## 📂 결과물

생성된 영상은 `output/videos/` 폴더에 저장됩니다.

---

## 📝 라이선스

ISC
