# Short Creator 🎬

> **AI 기반 쇼츠 자동 생성기 (Interactive Director Mode 포함)**
>
> Gemini AI가 대본을 쓰고, Pexels가 이미지를 찾고, ElevenLabs가 목소리를 입혀 고퀄리티 쇼츠를 만듭니다.

![Short Creator Banner](https://via.placeholder.com/800x200?text=Short+Creator)

## ✨ 주요 기능

- **🤖 AI 대본 생성**: Google Gemini가 흥미로운 주제(미스터리, 밸런스 게임, 유머 등)로 대본을 작성합니다.
- **🎨 Interactive Director Mode**: 웹 UI에서 대본을 직접 수정하고, 마음에 드는 짤방을 선택할 수 있습니다.
- **🖼️ 자동 에셋 소싱**: 대본 키워드에 맞춰 Pexels(고화질), Reddit(밈)에서 이미지를 찾아옵니다.
- **🎙️ 고품질 TTS**: ElevenLabs, Typecast를 지원하여 자연스러운 내레이션을 생성합니다.
- **🎥 다이내믹 렌더링**: Ken Burns 효과(줌인), 팝업 자막, 배경음악이 포함된 1080x1920 영상을 생성합니다.

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

### 밸런스 게임(Would You Rather) 생성
```bash
npm run wyr -- --count 5
```

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express
- **AI**: Google Gemini Pro
- **Media**: FFmpeg, Canvas, Pexels API, ElevenLabs API

## 📂 결과물
생성된 영상은 `output/videos/` 폴더에 저장됩니다.

---

## 📝 라이선스
ISC
