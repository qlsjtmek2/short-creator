# Short Creator - Project Context

## Project Overview

**Short Creator**는 한국 20-30대를 타겟으로 하는 **스토리텔링 기반 정보성 쇼츠 영상** 자동 생성 도구입니다. AI를 활용하여 대본 생성, 자산 수집, 음성 합성 및 최종 영상 렌더링까지의 전 과정을 자동화하며, 사용자가 직접 개입하여 퀄리티를 높일 수 있는 **Interactive Editor Mode**를 지원합니다.

2026년 1월, 영상 편집기 기능을 고도화하여 타임라인 기반의 전문적인 편집 환경을 구축했으며, 현재 Phase 20(Video Editor Expansion)이 완료된 상태입니다.

### Key Features

- **Professional Video Editor (GUI):** Next.js 15 + Remotion 기반의 5단계 워크플로우(주제 -> 대본 -> 자산 -> 편집 -> 렌더링)를 제공합니다. Movavi 스타일의 멀티트랙 타임라인 인터페이스를 지원합니다.
- **WYSIWYG Preview (Remotion):** 최종 렌더링 결과와 100% 일치하는 프레임 단위 미리보기를 지원합니다. 자막 Pop-in 애니메이션, Ken Burns 효과, 오디오 싱크를 실시간으로 확인할 수 있습니다.
- **Advanced Subtitles:** 문장별 단어 단위 자동 분할 및 쫀득한 Pop-in 애니메이션을 지원하며, 백엔드 FFmpeg 렌더러와 시각적으로 완벽하게 동기화됩니다.
- **Shared Rendering Config:** `RENDER_CONFIG`를 통해 백엔드(FFmpeg)와 프론트엔드(Remotion)의 좌표, 크기, 폰트, 타이밍 설정을 중앙 관리하여 결과물의 일관성을 보장합니다.
- **AI Script Generation:** Gemini 모델을 활용한 타겟 최적화 시나리오 생성을 지원합니다.
- **Multi-Source Assets:** Pexels, Google Search, Klipy(GIF), Reddit/Imgflip(Meme) 등 다양한 소스 에셋 수집을 지원합니다.

### Tech Stack

- **Frontend:** Next.js 15, React 19, Remotion (Video Engine), Tailwind CSS, Lucide React
- **Backend:** Node.js (Express.ts)
- **Language:** TypeScript
- **Media Processing:** FFmpeg (Final Render), Remotion Player (Preview), Node Canvas, FFprobe

## Architecture

- **Web UI (`web-ui/`):** 전문적인 영상 편집기 클라이언트.
  - `src/remotion/`: 미리보기용 비디오 컴포넌트 및 FFmpeg 시뮬레이터.
  - `src/components/editor/`: 타임라인 및 인스펙터 UI 컴포넌트.
- **API Server (`src/server/`):** 오디오 미리보기(TTS) 및 렌더링 작업 관리.
- **Shared Config (`src/config/`, `web-ui/src/config/`):** 렌더링 엔진 간 격차 해소를 위한 통합 설정 (`render-config.ts`).
- **Story Orchestrator (`src/StoryOrchestrator.ts`):** 편집된 데이터(`EditorSegment`)를 반영한 타임라인 계산 및 렌더링 파이프라인 관리.
- **Renderers (`src/renderers/`):** `FFmpegStoryRenderer`를 통한 고속 영상 합성 및 VFX/SFX 적용.

## Building and Running

### Prerequisites

- Node.js v18+
- FFmpeg 필수 설치 (`brew install ffmpeg`)
- `.env` 파일에 API Key 설정 (Gemini, Pexels 등)

### Running GUI Mode (Recommended)

1.  **Backend:** `npm run server` (Port: 3001)
2.  **Frontend:** `cd web-ui && npm run dev` (Port: 3000)
3.  브라우저에서 `http://localhost:3000` 접속

## Directory Structure

```
/
├── assets/           # Fonts (Pretendard), Music (BGM), SFX
├── src/              # Backend source code
│   ├── config/       # Shared rendering configuration (SSOT)
│   ├── generators/   # Gemini, Subtitle generators
│   ├── providers/    # TTS, Image, Meme providers
│   ├── renderers/    # FFmpeg story renderer (with VFX/SFX support)
│   ├── server/       # Express API server
│   └── StoryOrchestrator.ts
├── web-ui/           # Next.js 15 Frontend
│   ├── src/config/   # Synced rendering configuration
│   └── src/remotion/ # Video preview components & assets
└── types/            # EditorSegment & common interfaces
```

## Project Status

- **Phase 20 Completion:** 2026-01-16 완료.
- **Maintenance Mode:** 영상 편집기 및 WYSIWYG 미리보기 기능 안정화.
- **Key Update:** FFmpeg 렌더링과 Remotion 미리보기 간의 100% 시각적 동기화 달성.
