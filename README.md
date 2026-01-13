# 🎬 Would You Rather 쇼츠 자동 생성기

**AI를 활용하여 밸런스 게임(Would You Rather) 쇼츠 영상을 자동으로 생성하는 도구입니다.**
Gemini가 질문을 만들고, Pexels에서 이미지를 찾고, TTS로 음성을 입혀 60초 분량의 쇼츠 영상을 완성합니다.

## ✨ 주요 기능

*   **🤖 질문 자동 생성**: Google Gemini AI가 한국어 밸런스 게임 질문을 무한 생성합니다.
*   **🖼️ 이미지 자동 소싱**: 질문 내용에 맞는 고화질 이미지를 Pexels에서 찾아옵니다.
*   **🎙️ AI 음성 합성**: ElevenLabs, Typecast API를 지원하며, 키가 없으면 Mock(무음) 모드로 동작합니다.
*   **🎨 동적 프레임 생성**: Canvas를 활용해 빨강/파랑 그라데이션 배경의 분할 화면을 만듭니다.
*   **🎥 고속 렌더링**: FFmpeg를 사용하여 1080x1920(9:16) FHD 영상을 빠르게 합성합니다.
*   **📦 배치 생성**: 한 번의 명령으로 10개, 100개의 영상을 연속 생성할 수 있습니다.

---

## 🚀 시작하기

### 1. 필수 요구사항
이 프로젝트를 실행하려면 다음 도구들이 설치되어 있어야 합니다.

*   **Node.js** (v18 이상 권장)
*   **FFmpeg** (영상 렌더링 필수)
    *   macOS: `brew install ffmpeg`
    *   Windows: [FFmpeg 다운로드](https://ffmpeg.org/download.html) 후 환경변수 등록

### 2. 설치
프로젝트를 클론하고 패키지를 설치합니다.

```bash
git clone https://github.com/qlsjtmek2/short-creator.git
cd short-creator
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 API 키를 입력합니다.

```bash
cp .env.example .env
```

`.env` 파일 내용:
```env
# Google Gemini API (필수) - 질문 생성용
GEMINI_API_KEY=your_gemini_api_key

# Pexels API (필수) - 이미지 검색용
PEXELS_API_KEY=your_pexels_api_key

# ElevenLabs API (선택) - 고품질 AI 음성
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id (옵션)

# Typecast API (선택) - 한국어 특화 음성
TYPECAST_API_KEY=your_typecast_key
```

*   **Gemini 키 발급**: [Google AI Studio](https://aistudio.google.com/)
*   **Pexels 키 발급**: [Pexels API](https://www.pexels.com/api/)
*   **ElevenLabs 키 발급**: [ElevenLabs](https://elevenlabs.io/)

---

## 🎮 사용 방법

### 영상 생성 (기본)
1개의 쇼츠 영상을 생성합니다. 결과물은 `output/videos/`에 저장됩니다.

```bash
npm start
```

### 배치 생성 (여러 개)
`--count` 옵션을 사용하여 한 번에 여러 개의 영상을 생성합니다.

```bash
npm start -- --count 5
```

### 임시 파일 정리
생성 과정에서 다운로드된 이미지, 오디오, 프레임 파일을 삭제합니다.

```bash
npm run clean
```

### 모듈별 테스트
각 기능이 정상 동작하는지 개별적으로 테스트할 수 있습니다.

```bash
npm run test:generator  # Gemini 질문 생성 테스트
npm run test:image      # Pexels 이미지 다운로드 테스트
npm run test:frame      # Canvas 프레임 합성 테스트
npm run test:video      # FFmpeg 영상 렌더링 테스트
```

---

## 🛠️ 기술 스택

*   **언어**: TypeScript, Node.js
*   **AI 모델**: Google Gemini Pro/Flash
*   **미디어 처리**: Canvas (이미지), FFmpeg (비디오)
*   **TTS**: ElevenLabs, Typecast (지원 예정)
*   **CI/CD**: GitHub Actions

## 📝 라이선스
MIT License