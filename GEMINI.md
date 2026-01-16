# Short Creator - Project Context

## Project Overview

**Short Creator**는 한국 20-30대를 타겟으로 하는 **스토리텔링 기반 정보성 쇼츠 영상** 자동 생성 도구입니다. AI를 활용하여 대본 생성, 자산 수집, 음성 합성 및 최종 영상 렌더링까지의 전 과정을 자동화하며, 사용자가 직접 개입하여 퀄리티를 높일 수 있는 **Interactive Director Mode**를 지원합니다.

2026년 1월, Would You Rather(밸런스 게임) 기능을 제거하고 스토리텔링 엔진에 집중하도록 개편되었으며, 현재 Phase 19까지 완료되어 안정적인 서비스 제공이 가능한 **유지보수(Maintenance) 단계**에 있습니다.

### Key Features
*   **Interactive Director Mode V2 (GUI):** Next.js 15 기반의 웹 인터페이스를 통해 4단계 워크플로우(주제 -> 대본 -> 자산 -> 렌더링)를 제공합니다.
*   **AI Script Generation (Gemini 2.x/3.x):** 최신 Gemini 모델을 활용하여 타겟 최적화 시나리오를 생성합니다. Temperature, 톤, 프롬프트 템플릿 등 상세 설정이 가능합니다.
*   **Multi-Source Assets:** Pexels, Google Search, Klipy(GIF), Reddit/Imgflip(Meme) 등 다양한 소스에서 영상 목적에 맞는 이미지를 수집합니다.
*   **High-Quality TTS:** ElevenLabs, OpenAI, Typecast 및 Mock TTS를 지원하며, 오디오 길이에 맞춘 자동 자막 동기화를 지원합니다.
*   **Professional Rendering:** FFmpeg 기반의 Ken Burns 효과(Zoom-in), 중앙 정렬 Pop-in 자막 애니메이션, 배경 음악 믹싱을 통해 고품질 쇼츠 영상을 제작합니다.

### Tech Stack
*   **Frontend:** Next.js 15, React 19, Tailwind CSS, Lucide React
*   **Backend:** Node.js (Express.js)
*   **Language:** TypeScript (CommonJS)
*   **AI/API:** Google Gemini (2.5 Flash), Pexels, Google Search, ElevenLabs, OpenAI, Typecast, Reddit, Imgflip, Klipy
*   **Media Processing:** FFmpeg, Node Canvas, FFprobe

## Architecture

*   **Web UI (`web-ui/`):** React 기반의 디렉터 모드 클라이언트. LocalStorage를 사용하여 사용자 설정을 관리합니다.
*   **API Server (`src/server/`):** 프론트엔드와 생성 엔진을 연결하는 브릿지 역할을 수행합니다.
*   **Story Orchestrator (`src/StoryOrchestrator.ts`):** 시나리오 생성부터 최종 렌더링까지의 CLI 파이프라인을 관리합니다.
*   **Generators (`src/generators/`):** `GeminiStoryGenerator`(대본), `SubtitleGenerator`(ASS 자막) 등 핵심 생성 모듈.
*   **Providers (`src/providers/`):** 이미지, 밈, 음성 등 외부 에셋 공급 모듈. 인터페이스 기반 설계로 확장이 용이합니다.
*   **Renderers (`src/renderers/`):** `FFmpegStoryRenderer`를 통한 영상 합성 및 시각 효과 적용.

## Building and Running

### Prerequisites
*   Node.js v18+
*   FFmpeg 필수 설치 (`brew install ffmpeg`)
*   `.env` 파일에 API Key 설정 (Gemini, Pexels 등)

### Running GUI Mode (Recommended)
1.  **Backend:** `npm run server` (Port: 3001)
2.  **Frontend:** `cd web-ui && npm run dev` (Port: 3000)
3.  브라우저에서 `http://localhost:3000` 접속

### Running CLI Mode
*   **Single Story:** `npm run story -- --topic "주제"`
*   **Custom Provider:** `npm run story -- --image-provider reddit`

## Directory Structure

```
/
├── .gemini/          # Gemini agent configuration & skills
├── assets/           # Fonts (Pretendard), BGM (bgm2.mp3)
├── config/           # Centralized configuration (legacy removed)
├── output/           # Generated artifacts (images, audio, video)
├── scripts/          # Test & Utility scripts (test-apis/, test-*.ts)
├── src/              # Backend source code
│   ├── generators/   # Gemini, Subtitle generators
│   ├── providers/    # TTS, Image, Meme providers
│   ├── renderers/    # FFmpeg story renderer
│   ├── server/       # Express API server
│   ├── utils/        # Audio/FFprobe utilities
│   ├── StoryOrchestrator.ts
│   └── index.ts      # CLI Entry
├── web-ui/           # Next.js 15 Frontend
└── types/            # TypeScript interfaces & common types
```

## Project Status
- **Phase 19 Completion:** 2026-01-15 완료.
- **Maintenance Mode:** 핵심 기능 안정화 완료 및 유지보수 단계 진입.
- **Key Update:** Would You Rather 기능 완전 제거 및 스토리텔링 최적화.