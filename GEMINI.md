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

## Architecture (Refactored Phase 21)

- **Web UI (`web-ui/`):** 전문적인 영상 편집기 클라이언트.
  - `src/remotion/`: 미리보기용 비디오 컴포넌트 및 FFmpeg 시뮬레이터.
  - `src/types/`, `src/config/`: 루트의 공통 타입 및 설정을 심볼릭 링크로 공유 (SSOT).
- **Core Services (`src/services/`):** Orchestrator의 책임을 분산한 전문 서비스 레이어.
  - `AssetManager`: 이미지/오디오 에셋의 다운로드, 로컬 저장 및 파일 시스템 관리.
  - `SubtitleService`: 자막의 정밀한 분할(Chunking) 및 타이밍 계산.
- **Layout Engine (`src/core/LayoutEngine.ts`):** 비주얼 레이아웃(타이틀, Ken Burns) 계산 및 `RenderManifest` 생성 전담.
- **Story Orchestrator (`src/StoryOrchestrator.ts`):** 서비스들을 조립하여 전체 흐름을 제어하고 최종 `RenderManifest`를 도출하는 조율자.
- **Renderers (`src/renderers/`):** `FFmpegStoryRenderer`가 `RenderManifest`를 입력받아 최종 영상을 합성.

## Development Guidelines (Phase 21+)

1.  **Standardized Rendering (Manifest-First):** 모든 영상 효과와 배치는 `RenderManifest`를 통해 정의되어야 합니다. 렌더러에 직접 필터를 추가하기보다 `Manifest`에 새로운 엘리먼트 타입을 정의하고 `LayoutEngine`에서 이를 계산하는 방식을 지향합니다.
2.  **Service Responsibility:**
    - 파일 시스템 작업(복사, 생성, 삭제)은 `AssetManager`에서만 수행합니다.
    - 비주얼 계산 로직은 `LayoutEngine`에 집중시키고, 프론트엔드(`web-ui`)와 공유할 수 있도록 설계합니다.
    - `StoryOrchestrator`는 비즈니스 로직(순서, 조립)만 담당하며 저수준 API 호출은 지양합니다.
3.  **Single Source of Truth (SSOT):**
    - `RENDER_CONFIG`나 공통 타입은 반드시 루트(`src/config/`, `types/`)에서 수정합니다. `web-ui`는 심볼릭 링크를 통해 이를 자동으로 반영합니다.
4.  **FFmpeg Renderer Simplicity:** `FFmpegStoryRenderer`는 `RenderManifest`를 해석하여 FFmpeg 명령어로 변환하는 "컴파일러" 역할만 수행해야 합니다. 복잡한 타이밍 계산이나 텍스트 레이아웃 로직을 렌더러 내부에 두지 마십시오.

## Directory Structure

```
/
├── assets/           # Fonts, Music, SFX
├── types/            # Common Interfaces (Shared with web-ui via symlink)
├── src/
│   ├── config/       # Shared RENDER_CONFIG (Shared with web-ui via symlink)
│   ├── core/         # LayoutEngine (Visual layout logic)
│   ├── services/     # AssetManager, SubtitleService (Domain logic)
│   ├── generators/   # Gemini, Subtitle ASS generators
│   ├── providers/    # TTS, Image providers (External APIs)
│   ├── renderers/    # FFmpeg renderer (Manifest-based)
│   └── StoryOrchestrator.ts
└── web-ui/           # Next.js 15 Frontend
```

## Project Status

- **Phase 21 Completion:** 2026-01-17 완료.
- **Refactoring:** 오케스트레이터 경량화 및 Manifest 기반 렌더링 단일화 달성.
- **Key Update:** 백엔드/프론트엔드 간 설정 및 타입 동기화(Symlink) 적용.
