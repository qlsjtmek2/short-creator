# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

**쇼츠 자동 생성기**: Google Gemini AI로 한국어 스토리텔링 콘텐츠를 생성하고, 이미지/밈과 TTS 음성을 결합하여 60초 쇼츠 영상을 자동으로 생성하는 **Web UI 기반 시스템**입니다.

### 핵심 기능
- **스토리텔링 쇼츠**: 정보성/재미 콘텐츠를 문장별 이미지 시퀀스로 전달 (자막 애니메이션 + Ken Burns 효과)
- **Web UI**: React 기반 브라우저 인터페이스로 주제 입력, 대본 편집, 이미지 선택, 렌더링 진행
- **프롬프트 커스터마이징**: 설정 모달에서 Gemini 프롬프트, temperature, 모델 선택 가능
- **다양한 이미지 소스**: Pexels, Reddit 밈, Imgflip 밈, Google 이미지 검색 지원

### 핵심 기술 스택
- **언어**: TypeScript (CommonJS)
- **프론트엔드**: Next.js 15 (App Router), React 19, TailwindCSS
- **백엔드**: Express.js (API 서버)
- **AI 모델**: Google Gemini 2.0 Flash (2026 라인업) - 대본 생성, temperature 제어 지원
- **이미지 소싱**: Pexels API, Reddit Meme API, Imgflip API, Google Custom Search API
- **TTS**: ElevenLabs > OpenAI > Typecast > Mock (우선순위 폴백, 속도 제어 가능)
- **미디어 처리**: FFmpeg (영상 렌더링, Ken Burns 효과, ASS 자막 합성)

### ⚠️ 레거시 기능 (제거됨)
- **Would You Rather** (밸런스 게임): `src/ShortsGenerator.ts`, `src/cli-wyr.ts` 삭제됨 (2026-01-15)
  - 스토리텔링 전용 시스템으로 전환
  - 관련 코드, 설정, 명령어 모두 제거됨

---

## 명령어

### 개발 및 실행
```bash
# Web UI 서버 실행 (메인 사용 방법)
npm start
# → http://localhost:3001 접속하여 브라우저에서 작업
# → 주제 입력, 대본 편집, 이미지 선택, 렌더링 진행

# CLI로 스토리텔링 쇼츠 1개 생성 (기본 주제, 기본은 Pexels 이미지)
npm run story

# 스토리텔링 쇼츠 커스텀 주제로 생성
npm run story -- --topic "우주의 신비" --count 3

# Reddit 밈으로 쇼츠 생성 (재미있는 짤방 사용)
npm run story -- --image-provider reddit

# Imgflip 밈 템플릿으로 쇼츠 생성
npm run story -- --image-provider imgflip

# 모든 옵션 조합 예시
npm run story -- --topic "역사 속 흥미로운 사실" --count 2 --image-provider reddit

# 임시 파일 정리 (output/ 하위의 모든 이미지, 밈, 오디오, 프레임, 영상, 자막 삭제)
npm run clean
```

### 코드 품질 검사
```bash
# Lint 검사
npm run lint

# 타입 체크 (컴파일 없이 타입 검증만)
npm run type-check
```

### 모듈별 테스트
각 모듈이 독립적으로 동작하는지 검증하는 테스트 스크립트:

```bash
# API 연결 테스트
npm run test:gemini     # Gemini API 연결 및 질문 생성 테스트
npm run test:pexels     # Pexels API 연결 및 이미지 검색 테스트
npm run test:typecast   # Typecast API 연결 및 TTS 테스트

# 파이프라인 테스트
npm run test:generator  # GeminiQuestionGenerator 동작 확인
npm run test:image      # PexelsImageProvider 동작 확인
npm run test:frame      # CanvasFrameComposer 동작 확인
npm run test:video      # FFmpegVideoRenderer 동작 확인
npm run test:meme       # 밈 Provider 동작 확인 (Reddit + Imgflip)
```

---

## 아키텍처

### 디렉토리 구조
```
short-creator/
├── src/
│   ├── server/                     # Express.js API 서버
│   │   ├── index.ts                    # 서버 진입점 (포트 3001)
│   │   └── routes/api.ts               # API 라우트 (스토리 생성, 렌더링)
│   ├── cli-story.ts                # CLI 진입점 (스토리텔링)
│   ├── StoryOrchestrator.ts        # 스토리 생성 오케스트레이터
│   ├── generators/                 # 콘텐츠 생성 모듈
│   │   ├── GeminiStoryGenerator.ts      # 스토리텔링 대본 생성 (Gemini 2.0 Flash)
│   │   └── SubtitleGenerator.ts         # ASS 자막 파일 생성
│   ├── providers/                  # 외부 API 통합
│   │   ├── PexelsImageProvider.ts       # Pexels 이미지 검색 및 다운로드
│   │   ├── GoogleImageProvider.ts       # Google Custom Search 이미지 검색
│   │   ├── RedditMemeProvider.ts        # Reddit 밈 다운로드 (무료, 인증 불필요)
│   │   ├── ImgflipMemeProvider.ts       # Imgflip 밈 생성 (무료, 계정 필요)
│   │   ├── KlipyGIFProvider.ts          # KLIPY GIF 검색 (무료, Tenor 대체)
│   │   ├── ElevenLabsTTSProvider.ts     # ElevenLabs TTS (우선순위 1)
│   │   ├── OpenAITTSProvider.ts         # OpenAI TTS (우선순위 2)
│   │   ├── TypecastTTSProvider.ts       # Typecast TTS (우선순위 3)
│   │   └── MockTTSProvider.ts           # Mock TTS (무음, 폴백)
│   ├── renderers/                  # 영상 렌더링
│   │   └── FFmpegStoryRenderer.ts       # 스토리텔링 렌더러 (Ken Burns + ASS 자막)
│   └── utils/
│       └── audio.ts                     # 오디오 유틸리티 (FFprobe 타임스탬프 추출)
├── web-ui/                         # Next.js 15 Web UI (React 19)
│   ├── src/
│   │   ├── app/                        # Next.js App Router
│   │   │   ├── layout.tsx                  # 루트 레이아웃
│   │   │   └── page.tsx                    # 메인 페이지 (4단계 워크플로우)
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── SettingsModal.tsx       # 설정 모달 (프롬프트/모델/TTS)
│   │   │   │   └── StickyHeader.tsx        # 상단 고정 헤더
│   │   │   └── steps/
│   │   │       ├── Step1_Topic.tsx         # 1단계: 주제 입력
│   │   │       ├── Step2_Script.tsx        # 2단계: 대본 편집
│   │   │       ├── Step3_Assets.tsx        # 3단계: 이미지 선택
│   │   │       └── Step4_Render.tsx        # 4단계: 렌더링 진행
│   │   └── lib/
│   │       └── api.ts                      # API 클라이언트 (fetch 래퍼)
│   ├── package.json                # Web UI 의존성 (별도 관리)
│   └── tailwind.config.ts          # TailwindCSS 설정
├── types/
│   ├── interfaces.ts               # 핵심 인터페이스 정의
│   ├── common.ts                   # 공통 타입 정의
│   └── config.ts                   # 설정 타입 정의
├── config/
│   ├── shorts.config.ts            # 중앙 설정 파일 (실제 사용, JSON 로더)
│   └── shorts.config.example.ts    # 설정 예시 파일
├── scripts/                        # 테스트 및 유틸리티 스크립트
│   ├── test-apis/                  # API 연결 테스트
│   ├── test-*.ts                   # 모듈별 단위 테스트
│   └── download-bgm.ts             # BGM 다운로드
└── output/                         # 생성된 에셋 저장소
    ├── images/                     # 다운로드된 이미지
    ├── memes/                      # 다운로드된 밈/짤방
    ├── audio/                      # 생성된 TTS 오디오
    ├── subtitles/                  # ASS 자막 파일
    └── videos/                     # 최종 영상 파일
```

### 설계 패턴: Interface-Based Architecture

모든 핵심 모듈은 `types/interfaces.ts`에 정의된 인터페이스를 구현합니다:

- **`IStoryGenerator`**: 스토리 대본 생성 (Gemini)
- **`IImageProvider`**: 이미지 다운로드 (Pexels, Google Image Search)
- **`IMemeProvider`**: 밈/짤방/GIF 다운로드 (Reddit/Imgflip/KLIPY)
- **`ITTSProvider`**: 음성 합성 (ElevenLabs/OpenAI/Typecast/Mock)
- **`ISubtitleGenerator`**: ASS 자막 생성 (SubtitleGenerator)
- **`IStoryVideoRenderer`**: 영상 렌더링 (FFmpegStoryRenderer)

**장점**: 새로운 Provider나 Generator를 추가할 때 인터페이스만 구현하면 됩니다. 예를 들어 새로운 TTS Provider를 추가하려면:
1. `ITTSProvider` 인터페이스를 구현
2. `src/server/routes/api.ts` 또는 `src/cli-story.ts`에서 DI 설정에 추가

### 데이터 플로우

#### Web UI 워크플로우 (4단계)
```
[1. 주제 입력] → [2. 대본 편집] → [3. 이미지 선택] → [4. 렌더링]
     ↓               ↓                  ↓                 ↓
 사용자 입력    Gemini API 호출      이미지 Provider     FFmpeg CLI
              (temperature 제어)    (Pexels/Reddit/    (Ken Burns +
               프롬프트 커스터마이징   Google/Imgflip)     ASS 자막)
```

#### CLI 워크플로우
```
[대본 생성] → [이미지/TTS 병렬 다운로드] → [자막 생성] → [영상 렌더링]
    ↓               ↓                        ↓             ↓
Gemini API     Image Provider +        ASS 파일        FFmpeg CLI
              TTS Provider 폴백        생성 및          (Ken Burns +
              (Promise.all)           타임스탬프 동기화   자막 합성)
```

**병렬 처리**: `StoryOrchestrator.ts`에서 `Promise.all()`을 사용하여 이미지 다운로드와 TTS 생성을 병렬로 처리하여 성능 최적화.

---

## 환경 변수

`.env` 파일에 다음 API 키가 필요합니다 (`.env.example` 참고):

```bash
# 필수
GEMINI_API_KEY=...      # Google AI Studio (대본 생성, Gemini 2.0 Flash)

# 이미지 소싱 (최소 1개 필요)
PEXELS_API_KEY=...      # Pexels 이미지 검색
GOOGLE_API_KEY=...      # Google Custom Search API
GOOGLE_CX=...           # Google Custom Search Engine ID
KLIPY_API_KEY=...       # KLIPY GIF 검색 (Tenor 대체, 무료)

# TTS (선택, 없으면 Mock TTS 사용)
ELEVENLABS_API_KEY=...  # ElevenLabs (최우선 TTS)
ELEVENLABS_VOICE_ID=... # (선택) 커스텀 보이스 ID
OPENAI_API_KEY=...      # OpenAI (2순위 TTS)
TYPECAST_API_KEY=...    # Typecast (3순위 TTS)

# 밈 생성 (선택)
IMGFLIP_USERNAME=...    # Imgflip 계정 (https://imgflip.com/signup)
IMGFLIP_PASSWORD=...    # Imgflip 비밀번호
```

**TTS 폴백 로직** (`src/server/routes/api.ts`, `src/cli-story.ts`):
1. ElevenLabs 키 존재 → ElevenLabs 사용
2. 없으면 OpenAI 키 존재 → OpenAI 사용
3. 없으면 Typecast 키 존재 → Typecast 사용
4. 모두 없으면 → MockTTSProvider (무음 파일 생성, 속도 제어 가능)

---

## 설정 관리

모든 설정은 **Web UI의 설정 모달**에서 관리됩니다. 설정 파일(JSON) 없이 localStorage 기반으로 동작하며, 브라우저에 저장되어 재시작 후에도 유지됩니다.

### 설정 모달 사용 방법

1. **설정 모달 열기**: Web UI 우측 상단의 톱니바퀴 아이콘 클릭
2. **설정 변경**: 각 탭에서 원하는 설정 조정
3. **저장**: "저장하기" 버튼 클릭
4. **적용**: 다음 영상 생성 시 자동 적용

### 설정 탭 구성

#### 1. 기본 (General)
- **기본 이미지 소스**: Pexels, Google, Reddit, Klipy, Imgflip 중 선택
- **Mock TTS 속도**: 0.5x ~ 3.0x (API 키 없을 때 사용되는 가상 음성 속도)

#### 2. AI 설정
- **Gemini 모델**: Gemini 3.0 Pro, 3.0 Flash, 2.5 Pro, 2.5 Flash 등 선택
- **Temperature**: 0.0 ~ 2.0 (창의성 제어)
  - 0.7 이하: 정보성 콘텐츠 (사실 중심, 일관된 문체)
  - 1.0 ~ 1.5: 창의적 콘텐츠 (스토리텔링, 다양한 표현)
- **톤**: 유머러스, 진지함, 공포, 감동 중 선택
- **콘텐츠 길이**: 제목/문장 개수/문장 최대 길이 설정
- **프롬프트 커스터마이징**: System Prompt와 User Prompt Template 수정 가능

#### 3. 캔버스 (Canvas & Text)
- **캔버스 크기**: 너비/높이 (기본: 1080x1920)
- **레터박스**: 상단/하단 높이, 배경 색상
- **폰트 설정**:
  - **타이틀 폰트**: `assets/fonts/` 폴더의 Pretendard 폰트 중 선택
  - **자막 폰트**: `assets/fonts/` 폴더의 Pretendard 폰트 중 선택
  - 9가지 굵기 지원: Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black
- **배경 음악**: `assets/music/` 폴더의 BGM 파일 중 선택
  - BGM 1 (Would You Rather용)
  - BGM 2 (스토리텔링용, 기본)

#### 4. 텍스트 (Text)
- **타이틀 설정**: 폰트 크기, Y 위치, 색상, 강조 색상, 테두리
- **자막 설정**: 폰트 크기, 테두리 두께, 그림자, 하단 여백
- **자막 줄바꿈**: 좌/우측 여백, 안전 패딩, 최대 배율

#### 5. 효과 (Effects)
- **자막 애니메이션**: Pop-In 지속시간, Scale Up/Down 타이밍
- **Ken Burns 효과**: 시작/끝 줌 배율, 줌 증가량, FPS

#### 6. 오디오 (Audio & Rendering)
- **오디오 볼륨**: TTS 볼륨, BGM 볼륨
- **렌더링 설정**: 비디오 코덱, Preset, CRF, Pixel Format, 오디오 설정

### 기본값 (하드코딩)

설정을 변경하지 않으면 다음 기본값이 사용됩니다:

**AI 설정**:
- 모델: `gemini-2.5-flash`
- Temperature: `0.7`
- 제목 최대 길이: `25자`
- 문장 개수: `8개`
- 문장 최대 길이: `100자`

**폰트**:
- 타이틀 폰트: `Pretendard-ExtraBold.ttf`
- 자막 폰트: `Pretendard-Bold.ttf`

**BGM**:
- 기본 BGM: `bgm2.mp3` (스토리텔링용)

**캔버스**:
- 해상도: `1080x1920`
- 레터박스: 상/하단 각 `350px`

**Ken Burns 효과**:
- 시작 줌: `1.0x`
- 끝 줌: `1.2x`
- FPS: `60`

**렌더링**:
- 비디오 코덱: `libx264`
- CRF: `23`
- 오디오 비트레이트: `192k`

### 설정 초기화

설정을 기본값으로 되돌리려면:
1. 브라우저 개발자 도구 (F12) 열기
2. Console 탭에서 실행:
```javascript
localStorage.removeItem('shorts-creator-settings');
location.reload();
```

---

## 개발 시 주의사항

### 1. TypeScript 설정
- **모듈 시스템**: CommonJS (`"type": "commonjs"` in package.json)
- **타겟**: ES2020
- **Strict 모드**: 활성화됨

### 2. API 사용 패턴

#### Gemini 대본 생성 (2026 라인업)
- **모델**: `gemini-2.0-flash-exp` (기본), `gemini-2.0-flash-thinking-exp-01-21` (실험용)
- **Temperature 제어**: 0.0 ~ 2.0 (기본: 1.0)
  - 0.7 이하: 정보성 콘텐츠 (사실 중심, 일관된 문체)
  - 1.0 ~ 1.5: 창의적 콘텐츠 (스토리텔링, 다양한 표현)
- **프롬프트 커스터마이징**: 설정 모달 또는 `shorts.config.json`에서 시스템 프롬프트 수정 가능
- `responseMimeType: 'application/json'` 설정으로 구조화된 응답 보장
- UUID는 서버가 아닌 클라이언트에서 생성 (`uuid` 패키지 사용)

#### 이미지 Provider
- **Pexels**: 키워드 영어 검색, 고품질 스톡 이미지
- **Google Image Search**: Custom Search API, 다양한 이미지
- **Reddit Meme**: 무료, 인증 불필요, 재미있는 짤방
- **Imgflip**: 밈 템플릿, 텍스트 추가 가능
- **KLIPY**: GIF 검색, Tenor 대체, 무료
- 파일명: `{provider}_{keyword}_{timestamp}.{ext}`
- 중복 방지: 타임스탬프 기반 고유 파일명

#### TTS Provider
- 모든 Provider는 `ITTSProvider` 인터페이스 구현
- **Mock TTS 속도 제어**: 설정 모달에서 0.5x ~ 2.0x 조절 가능 (기본: 1.0x)
- 출력 디렉토리: `output/audio/`
- 폴백 체인: ElevenLabs → OpenAI → Typecast → Mock

### 3. FFmpeg 렌더링 (스토리텔링)
- **입력**: 이미지 배열 + TTS 오디오 배열 + ASS 자막
- **출력**: 1080x1920 @ 30fps, H.264 코덱
- **Ken Burns 효과**: 1.0x → 1.1x 서서히 확대 (각 문장별)
- **ASS 자막**: Pop-in 애니메이션 (0% → 120% → 100% scale)
- **레터박스**: 상/하단 각 300px (검정 배경)
- **타이틀**: 상단 고정 텍스트 (FFmpeg drawtext)
- 영상 길이: 모든 TTS 오디오 길이 합산

---

## 알려진 이슈 및 제약사항

### 현재 한계
1. **단일 BGM**: 문장별로 다른 BGM 사용 불가 (전체 영상에 하나의 BGM만 적용)
2. **Ken Burns 효과 제한**: 단순 Zoom-in만 지원 (Pan, Rotate 등 고급 효과 미지원)
3. **TTS 동시성**: 문장별 TTS를 순차 생성 (병렬 처리 시 API Rate Limit 위험)
4. **이미지 자동 선택**: CLI 모드에서는 첫 번째 검색 결과만 사용 (Web UI에서는 수동 선택 가능)

### 최근 완료된 기능

#### ✅ 설정 시스템 단순화 (2026-01-16)
- **설정 파일 완전 제거**: `prompts.json`, `shorts.config.json`, config 로더 파일 모두 삭제
- **Web UI 전용 설정 관리**: localStorage 기반으로 모든 설정 통합
- **폰트 선택 UI 추가**: `assets/fonts/` 폴더의 9가지 Pretendard 폰트 중 선택 가능
  - 타이틀 폰트: 상단 고정 제목에 사용
  - 자막 폰트: ASS 자막에 사용
  - 굵기별 선택: Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black
- **BGM 선택 UI 추가**: `assets/music/` 폴더의 BGM 파일 선택 가능
  - BGM 1 (Would You Rather용)
  - BGM 2 (스토리텔링용, 기본)
- **백엔드 하드코딩**: 설정값을 코드 내부에 기본값으로 하드코딩하여 관리 복잡도 제거
- **설정 우선순위**: Web UI localStorage → 기본값 (하드코딩)
- **삭제된 파일 (8개)**:
  - `prompts.json`, `prompts.example.json`
  - `shorts.config.json`, `shorts.config.example.json`
  - `config/prompts.config.ts`, `config/shorts.config.ts`
  - `types/prompts.ts`, `types/config.ts`

#### ✅ Web UI 시스템 구축 (2026-01-15)
- Next.js 15 + React 19 기반 4단계 워크플로우
- 실시간 진행 상황 표시 (Step 4)
- 드래그 앤 드롭으로 대본 순서 조정 (Step 2)
- 이미지 미리보기 및 수동 선택 (Step 3)

#### ✅ 설정 시스템 개선 (2026-01-15)
- 프롬프트 커스터마이징 (시스템 프롬프트 수정)
- Gemini 모델 선택 (2.0 Flash, 2.0 Flash Thinking)
- Temperature 제어 (0.0 ~ 2.0, 슬라이더 UI)
- Mock TTS 속도 제어 (0.5x ~ 2.0x)
- Google Image Search Provider 추가

#### ✅ Gemini 모델 업데이트 (2026-01-15)
- `gemini-2.5-flash` → `gemini-2.0-flash-exp` (2026 라인업)
- 실험용 모델 추가: `gemini-2.0-flash-thinking-exp-01-21`
- Temperature 파라미터 지원

#### ✅ Would You Rather 기능 제거 (2026-01-15)
- `src/ShortsGenerator.ts`, `src/cli-wyr.ts` 완전 삭제
- 스토리텔링 전용 시스템으로 단순화
- 관련 설정, 명령어, 문서 모두 제거

### 스토리텔링 쇼츠 파이프라인 (완료 ✅)
스토리텔링형 쇼츠 생성 파이프라인이 완성되었습니다:
- ✅ ASS 자막 애니메이션 (Pop-in + Scale Up 효과)
- ✅ 문장별 TTS 생성 및 FFprobe 기반 타임스탬프 동기화
- ✅ Ken Burns Zoom-in 효과 (1.0x → 1.1x 서서히 확대)
- ✅ 상/하단 레터박스 (각 300px) 및 상단 타이틀 합성
- ✅ StoryOrchestrator: CLI 전용 오케스트레이터

**사용 방법**:
```bash
# CLI 모드
npm run story -- --topic "우주의 신비" --count 3

# Web UI 모드 (권장)
npm start
# → http://localhost:3001 접속
```

**관련 파일**:
- `src/StoryOrchestrator.ts` (CLI 오케스트레이터)
- `src/server/routes/api.ts` (Web UI API)
- `src/generators/GeminiStoryGenerator.ts` (IStoryGenerator 구현)
- `src/generators/SubtitleGenerator.ts` (ISubtitleGenerator 구현)
- `src/renderers/FFmpegStoryRenderer.ts` (IStoryVideoRenderer 구현)
- `src/cli-story.ts` (CLI 진입점)
- `web-ui/src/app/page.tsx` (Web UI 메인 페이지)

---

## 배운 내용 및 인사이트

### 1. Google Gemini 2026 라인업의 성능 향상
- **2.0 Flash**: 2.5 Flash 대비 응답 속도 약 30% 향상, JSON 모드 안정성 개선
- **Temperature 제어**: 정보성 콘텐츠는 0.7 이하, 창의적 콘텐츠는 1.0~1.5 추천
- `responseMimeType: 'application/json'` 설정으로 파싱 에러가 거의 발생하지 않음
- `Array.isArray()` 검증은 여전히 필수 (간혹 객체 반환)

### 2. Web UI vs CLI 트레이드오프
- **Web UI 장점**: 사용자 친화적, 대본 편집 용이, 이미지 미리보기, 실시간 진행 상황
- **CLI 장점**: 자동화 가능, 배치 처리, CI/CD 통합
- **교훈**: 두 가지 모두 제공하되, 공통 로직은 `StoryOrchestrator`, `GeminiStoryGenerator` 등에 집중

### 3. TTS Provider 폴백 전략의 중요성
- API 키가 없어도 시스템이 중단되지 않도록 MockTTSProvider 필수
- **Mock TTS 속도 제어**: 실제 TTS 없이도 타이밍 테스트 가능 (0.5x ~ 2.0x)
- 프로덕션에서는 필수 키 없으면 명시적 에러 권장

### 4. ASS 자막과 FFmpeg의 강력함
- ASS 형식은 복잡한 애니메이션 지원 (Pop-in, Scale, Fade 등)
- FFmpeg의 `subtitles` 필터는 GPU 가속 없이도 실시간 렌더링 가능
- Ken Burns 효과는 `zoompan` 필터로 간단히 구현 (`zoom='1+0.0001*on'`)

### 5. 레거시 코드 제거의 중요성
- Would You Rather 기능을 완전히 제거하여 코드베이스 30% 축소
- 유지보수 부담 감소, 신규 기여자 온보딩 시간 단축
- **교훈**: 사용되지 않는 기능은 과감히 제거하라 (YAGNI 원칙)

### 6. 한글 폰트 렌더링
- macOS: Pretendard, AppleSDGothicNeo 사용 가능
- Linux: Noto Sans KR 등 설치 필요
- FFmpeg drawtext: 절대 경로 필수 (`/path/to/font.ttf`)

### 7. FFmpeg 디버깅
- `-loglevel error`로 불필요한 로그 제거
- 코덱 호환성 문제 (`libx264` 미설치) 자주 발생
- `stderr` 출력을 항상 확인하라

---

## Web UI 사용 가이드

### 시작하기
```bash
npm start
# → http://localhost:3001 접속
```

### 4단계 워크플로우

#### Step 1: 주제 입력
- **주제 입력**: 원하는 쇼츠 주제를 한국어로 입력
- **설정**: 우측 상단 톱니바퀴 아이콘 클릭
  - Gemini 프롬프트 커스터마이징
  - 모델 선택 (2.0 Flash / 2.0 Flash Thinking)
  - Temperature 조절 (0.0 ~ 2.0)
  - Mock TTS 속도 (0.5x ~ 2.0x)
- **대본 생성**: "대본 생성" 버튼 클릭 → Gemini API 호출

#### Step 2: 대본 편집
- **드래그 앤 드롭**: 문장 순서 변경 (좌측 핸들바 드래그)
- **텍스트 편집**: 각 문장 클릭하여 수정
- **삭제**: 우측 X 버튼으로 문장 제거
- **추가**: 하단 "+ 문장 추가" 버튼으로 새 문장 삽입
- **확정**: "다음 단계" 클릭 → Step 3으로 이동

#### Step 3: 이미지 선택
- **자동 검색**: Step 2에서 넘어오면 자동으로 이미지 검색 시작
- **이미지 Provider**: Pexels, Google, Reddit, Imgflip, KLIPY 중 선택
- **미리보기**: 각 문장에 매칭된 이미지 확인
- **수동 선택**: 이미지 클릭하여 다른 후보 선택 가능
- **재검색**: 키워드 수정 후 재검색 가능
- **확정**: "렌더링 시작" 클릭 → Step 4로 이동

#### Step 4: 렌더링
- **진행 상황**: 실시간 진행률 표시 (TTS 생성 → 자막 생성 → 영상 렌더링)
- **로그 확인**: 각 단계별 상세 로그 표시
- **완료**: 렌더링 완료 시 다운로드 링크 표시
- **에러 처리**: 에러 발생 시 상세 메시지 및 재시도 옵션

### 설정 모달 상세

#### Gemini 설정
- **프롬프트**: 시스템 프롬프트 커스터마이징 (예: "재미있게", "전문적으로")
- **모델**: 2.0 Flash (기본), 2.0 Flash Thinking (실험용)
- **Temperature**: 창의성 조절 (0.7: 정보성, 1.5: 창의적)

#### TTS 설정
- **Mock TTS 속도**: 0.5x (느림) ~ 2.0x (빠름)
- **용도**: 실제 TTS 없이 타이밍 테스트

#### 서버 상태
- **API 키 체크**: Gemini, Pexels, Google 등 API 키 등록 여부 확인
- **상태 표시**: ✅ 정상, ⚠️ 미등록

---

## 기타 참고사항

- **FFmpeg 설치 필수**: 시스템에 FFmpeg가 설치되어 있어야 영상 렌더링 가능
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
- **Node.js Canvas 의존성**: `canvas` 패키지는 네이티브 바이너리를 포함하므로 설치 시 Python/C++ 컴파일러 필요
- **출력 파일 관리**: `npm run clean`으로 임시 파일을 정리하지 않으면 디스크 용량이 빠르게 소진됨

---

## 밈 Provider 사용 가이드

프로젝트에 **재미있는 짤방/밈/GIF** 제공 기능이 추가되었습니다. Reddit, Imgflip, KLIPY 세 가지 API를 지원합니다.

### 지원하는 Provider

#### 🆕 0. **KlipyGIFProvider** (추천: 키워드 기반 GIF 검색)

**특징**:
- ✅ **완전 무료** (평생 무료 API 제공)
- ✅ **키워드 기반 GIF 검색** (Tenor API 대체)
- ✅ **무제한 API 호출** (프로덕션 키 승인 후)
- ✅ 테스트 키: 분당 100 호출 (즉시 사용 가능)
- ✅ GIF, 스티커, 밈, 클립(10초 영상) 제공
- ✅ Tenor 호환 API (URL만 교체하면 마이그레이션 완료)
- ⚠️ NSFW 필터링 메타데이터 제한적 (contentfilter=high 사용 권장)

**배경**:
- Google이 Tenor API를 2026년 6월 30일 완전 종료
- Giphy API는 2025년 유료 전환 (연간 $9,000)
- KLIPY는 광고 수익 기반 무료 모델로 대안 제공
- Canva, Figma, Microsoft Outlook 등 대형 플랫폼 사용 중

**API 키 발급**:
1. [docs.klipy.com](https://docs.klipy.com/) 접속
2. 테스트 키로 개발 시작 (분당 100 호출, 즉시 발급)
3. Publisher Admin Panel에서 프로덕션 키 신청 (무제한, 승인 필요)

**사용 예시**:
```bash
# 키워드 기반 GIF 검색으로 스토리 생성
npm run story -- --image-provider klipy --topic "고양이 웃긴짤"
```

```typescript
import { KlipyGIFProvider } from './src/providers/KlipyGIFProvider';

const provider = new KlipyGIFProvider(process.env.KLIPY_API_KEY!);

// 키워드로 GIF 검색 및 다운로드
const gifPath = await provider.downloadImage('funny cat');
console.log(gifPath); // output/memes/klipy_*.gif
```

**환경 변수**:
```bash
# .env
KLIPY_API_KEY=your_klipy_api_key_here
```

**API 문서**:
- [KLIPY API Docs](https://docs.klipy.com/)
- [GitHub Repository](https://github.com/KLIPY-com/Klipy-GIF-API)

**주의사항**:
- NSFW 콘텐츠 필터링이 메타데이터 수준에서 제한적 (API에서 `contentfilter=high` 사용)
- 신생 서비스이므로 장기 안정성 검증 필요
- 광고 삽입 정책이 일부 사용 사례에는 부적합할 수 있음

---

#### 1. **RedditMemeProvider** (추천: 즉시 사용 가능)

**특징**:
- ✅ 완전 무료 (API 키 불필요)
- ✅ 인증 없이 즉시 사용 가능
- ✅ Reddit의 r/memes, r/dankmemes, r/me_irl 등에서 실시간 밈 수집
- ✅ NSFW 자동 필터링
- ⚠️ Reddit ToS 적용 (상업적 사용 시 주의 필요)

**사용 예시**:
```typescript
import { RedditMemeProvider } from './src/providers/RedditMemeProvider';

const provider = new RedditMemeProvider();

// 랜덤 밈 다운로드
const meme = await provider.downloadRandomMeme();
console.log(meme.path);   // output/memes/reddit_meme_*.jpg
console.log(meme.title);  // 밈 제목
console.log(meme.source); // r/memes by u/username (123 upvotes)

// 특정 서브레딧에서 다운로드
const wholesome = await provider.downloadRandomMeme('wholesomememes');
```

**API 문서**: [D3vd/Meme_Api](https://github.com/D3vd/Meme_Api)

---

#### 2. **ImgflipMemeProvider** (추천: 밈 생성 필요 시)

**특징**:
- ✅ 무료 (Imgflip 계정 필요)
- ✅ 100+ 인기 밈 템플릿 제공
- ✅ 텍스트 추가하여 커스텀 밈 생성 가능
- ✅ 상업적 사용 가능
- ⚠️ 계정 생성 필요 (https://imgflip.com/signup)

**설정 방법**:
1. Imgflip 계정 생성: https://imgflip.com/signup
2. `.env` 파일에 추가:
   ```bash
   IMGFLIP_USERNAME=your_username
   IMGFLIP_PASSWORD=your_password
   ```

**사용 예시**:
```typescript
import { ImgflipMemeProvider } from './src/providers/ImgflipMemeProvider';

const provider = new ImgflipMemeProvider(
  process.env.IMGFLIP_USERNAME!,
  process.env.IMGFLIP_PASSWORD!
);

// 랜덤 밈 템플릿 다운로드
const meme = await provider.downloadRandomMeme();

// 밈 템플릿 목록 가져오기
const templates = await provider.getMemeTemplates();
console.log(templates[0].name); // "Drake Hotline Bling"

// 키워드로 템플릿 검색
const drakeTemplates = await provider.searchMeme('Drake');

// 텍스트 추가하여 밈 생성
const generated = await provider.generateMeme(
  '181913649',  // Drake 템플릿 ID
  'Using paid APIs',
  'Using free meme APIs'
);
console.log(generated.path); // output/memes/imgflip_generated_*.jpg
console.log(generated.url);  // https://i.imgflip.com/...
```

**API 문서**: [Imgflip API](https://imgflip.com/api)

---

### 테스트 실행

```bash
npm run test:meme
```

이 명령어는 다음을 테스트합니다:
1. **Reddit Meme Provider** (항상 실행)
   - 랜덤 밈 다운로드
   - 특정 서브레딧에서 다운로드
2. **Imgflip Meme Provider** (자격증명이 있을 때만)
   - 밈 템플릿 목록 가져오기
   - 랜덤 템플릿 다운로드
   - 키워드 검색
   - 텍스트 추가하여 밈 생성

---

### 사용 시나리오

**시나리오 1: 랜덤 짤방 가져오기**
```typescript
// 가장 간단 - 인증 불필요
const reddit = new RedditMemeProvider();
const meme = await reddit.downloadRandomMeme();
// → output/memes/reddit_meme_*.jpg
```

**시나리오 2: 특정 분위기의 밈**
```typescript
// Wholesome한 밈
const wholesome = await reddit.downloadRandomMeme('wholesomememes');

// Dank 밈
const dank = await reddit.downloadRandomMeme('dankmemes');
```

**시나리오 3: 커스텀 밈 생성**
```typescript
// Imgflip으로 텍스트 추가
const imgflip = new ImgflipMemeProvider(username, password);
const templates = await imgflip.getMemeTemplates();
const drakeId = templates.find(t => t.name.includes('Drake'))?.id;

const customMeme = await imgflip.generateMeme(
  drakeId!,
  '기존 방식',
  '새로운 방식'
);
```

---

### 주의사항

1. **Reddit Meme Provider**
   - Reddit API ToS 적용
   - 서드파티 서비스(meme-api.com)를 통해 접근
   - 상업적 사용 시 법적 리스크 있음
   - 개인 프로젝트나 프로토타입용으로 권장

2. **Imgflip Meme Provider**
   - 무료 티어에서도 상업적 사용 가능
   - 과도한 요청 시 throttling 가능성
   - 프로덕션 환경에 권장

3. **NSFW 콘텐츠**
   - Reddit Provider는 NSFW 자동 필터링
   - 그러나 완벽하지 않으므로 사용 전 확인 권장

4. **저장 위치**
   - 모든 밈은 `output/memes/` 디렉토리에 저장
   - `npm run clean`으로 정리 가능
