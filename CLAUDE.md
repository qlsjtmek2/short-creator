# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

**쇼츠 자동 생성기**: Google Gemini AI로 한국어 콘텐츠를 생성하고, Pexels 이미지와 TTS 음성을 결합하여 60초 쇼츠 영상을 자동으로 생성하는 시스템입니다.

**2가지 유형의 쇼츠 지원**:
1. **Would You Rather**: 밸런스 게임 질문 기반 분할 화면 (빨강 vs 파랑)
2. **스토리텔링**: 정보성 콘텐츠를 문장별 이미지 시퀀스로 전달 (자막 애니메이션 + Ken Burns 효과)

### 핵심 기술 스택
- **언어**: TypeScript (CommonJS)
- **AI 모델**: Google Gemini 2.5 Flash (질문 생성)
- **이미지 소싱**: Pexels API
- **TTS**: ElevenLabs > OpenAI > Typecast > Mock (우선순위 폴백)
- **미디어 처리**: Node.js Canvas (프레임 합성), FFmpeg (영상 렌더링)

---

## 명령어

### 개발 및 실행
```bash
# Would You Rather 쇼츠 1개 생성 (기본)
npm start
# 또는
npm run wyr

# Would You Rather 쇼츠 여러 개 생성 (배치)
npm run wyr -- --count 5

# 스토리텔링 쇼츠 1개 생성 (기본 주제)
npm run story

# 스토리텔링 쇼츠 커스텀 주제로 생성
npm run story -- --topic "우주의 신비" --count 3

# 임시 파일 정리 (output/ 하위의 모든 이미지, 오디오, 프레임, 영상, 자막 삭제)
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
```

---

## 아키텍처

### 디렉토리 구조
```
short-creator/
├── src/
│   ├── index.ts                    # 진입점 (DI 설정 및 CLI 파싱)
│   ├── ShortsGenerator.ts          # 메인 오케스트레이터
│   ├── generators/                 # 콘텐츠 생성 모듈
│   │   ├── GeminiQuestionGenerator.ts   # Would You Rather 질문 생성
│   │   ├── GeminiStoryGenerator.ts      # 스토리텔링형 대본 생성
│   │   └── SubtitleGenerator.ts         # ASS 자막 파일 생성
│   ├── providers/                  # 외부 API 통합
│   │   ├── PexelsImageProvider.ts       # 이미지 검색 및 다운로드
│   │   ├── ElevenLabsTTSProvider.ts     # ElevenLabs TTS
│   │   ├── OpenAITTSProvider.ts         # OpenAI TTS
│   │   ├── TypecastTTSProvider.ts       # Typecast TTS
│   │   └── MockTTSProvider.ts           # Mock TTS (무음)
│   ├── composers/
│   │   └── CanvasFrameComposer.ts       # Canvas 프레임 합성
│   ├── renderers/                  # 영상 렌더링
│   │   ├── FFmpegVideoRenderer.ts       # Would You Rather 렌더러
│   │   └── FFmpegStoryRenderer.ts       # 스토리텔링 렌더러 (고도화)
│   └── utils/
│       └── audio.ts                     # 오디오 유틸리티
├── types/
│   ├── interfaces.ts               # 핵심 인터페이스 정의
│   └── common.ts                   # 공통 타입 정의
├── scripts/                        # 테스트 및 유틸리티 스크립트
│   ├── test-apis/                  # API 연결 테스트
│   ├── test-*.ts                   # 모듈별 단위 테스트
│   └── download-bgm.ts             # BGM 다운로드
└── output/                         # 생성된 에셋 저장소
    ├── images/                     # 다운로드된 이미지
    ├── audio/                      # 생성된 TTS 오디오
    ├── frames/                     # Canvas 프레임
    └── videos/                     # 최종 영상 파일
```

### 설계 패턴: Interface-Based Architecture

모든 핵심 모듈은 `types/interfaces.ts`에 정의된 인터페이스를 구현합니다:

- **`IQuestionGenerator`**: 질문 생성 (Gemini)
- **`IImageProvider`**: 이미지 다운로드 (Pexels)
- **`ITTSProvider`**: 음성 합성 (ElevenLabs/OpenAI/Typecast/Mock)
- **`IFrameComposer`**: 프레임 합성 (Canvas)
- **`IVideoRenderer`**: 영상 렌더링 (FFmpeg)

**장점**: 새로운 Provider나 Generator를 추가할 때 인터페이스만 구현하면 됩니다. 예를 들어 새로운 TTS Provider를 추가하려면:
1. `ITTSProvider` 인터페이스를 구현
2. `src/index.ts`에서 DI 설정에 추가

### 데이터 플로우

```
[질문 생성] → [이미지/TTS 병렬 다운로드] → [프레임 합성] → [영상 렌더링]
    ↓               ↓                          ↓                 ↓
Gemini API     Pexels + TTS API          Canvas API         FFmpeg CLI
```

**병렬 처리**: `ShortsGenerator.ts:42`에서 `Promise.all()`을 사용하여 이미지 2장과 TTS 음성을 병렬로 다운로드하여 성능 최적화.

---

## 환경 변수

`.env` 파일에 다음 API 키가 필요합니다 (`.env.example` 참고):

```bash
# 필수
GEMINI_API_KEY=...      # Google AI Studio (질문 생성)
PEXELS_API_KEY=...      # Pexels (이미지 소싱)

# 선택 (없으면 Mock TTS 사용)
ELEVENLABS_API_KEY=...  # ElevenLabs (최우선 TTS)
ELEVENLABS_VOICE_ID=... # (선택) 커스텀 보이스 ID
OPENAI_API_KEY=...      # OpenAI (2순위 TTS)
TYPECAST_API_KEY=...    # Typecast (3순위 TTS)
```

**TTS 폴백 로직** (`src/index.ts:40-54`):
1. ElevenLabs 키 존재 → ElevenLabs 사용
2. 없으면 OpenAI 키 존재 → OpenAI 사용
3. 없으면 Typecast 키 존재 → Typecast 사용
4. 모두 없으면 → MockTTSProvider (무음 파일 생성)

---

## 개발 시 주의사항

### 1. TypeScript 설정
- **모듈 시스템**: CommonJS (`"type": "commonjs"` in package.json)
- **타겟**: ES2020
- **Strict 모드**: 활성화됨

### 2. API 사용 패턴

#### Gemini 질문 생성
- 모델: `gemini-2.5-flash` (빠른 응답, JSON 출력)
- `responseMimeType: 'application/json'` 설정으로 구조화된 응답 보장
- UUID는 서버가 아닌 클라이언트에서 생성 (`uuid` 패키지 사용)

#### Pexels 이미지 다운로드
- 키워드는 영어로 검색 (`optionAKeyword`, `optionBKeyword`)
- 파일명: `pexels_{keyword}_{timestamp}.jpg`
- 중복 방지: 타임스탬프 기반 고유 파일명

#### TTS Provider
- 모든 Provider는 `ITTSProvider` 인터페이스 구현
- `character` 파라미터는 현재 사용되지 않음 (향후 확장용)
- 출력 디렉토리: `output/audio/`

### 3. Canvas 프레임 합성
- 해상도: **1080x1920** (세로형 쇼츠)
- 레이아웃: 빨강(왼쪽/위) vs 파랑(오른쪽/아래) 분할 화면
- 이미지 모드: Cover (비율 유지하며 가득 채우기)
- 한글 폰트: **Pretendard Bold** (시스템 폰트)

### 4. FFmpeg 렌더링
- 입력: 정적 프레임 1장 + 오디오 1개
- 출력: 1080x1920 @ 30fps, H.264 코덱
- 영상 길이: 오디오 길이에 맞춰 자동 조정

---

## 알려진 이슈 및 제약사항

### 현재 한계
1. **정적 프레임**: 현재는 1장의 프레임을 오디오 길이만큼 반복 (애니메이션 없음)
2. **단일 TTS**: 각 질문당 1개의 통합 음성만 생성 (선택지별 분리 음성 지원 안 함)
3. **고정 레이아웃**: 빨강/파랑 분할 화면만 지원 (커스터마이징 불가)

### Phase 15: 스토리텔링 쇼츠 고도화 (완료 ✅)
스토리텔링형 쇼츠 생성 파이프라인이 완성되었습니다:
- ✅ ASS 자막 애니메이션 (Pop-in + Scale Up 효과)
- ✅ 문장별 TTS 생성 및 FFprobe 기반 타임스탬프 동기화
- ✅ Ken Burns Zoom-in 효과 (1.0x → 1.1x 서서히 확대)
- ✅ 상/하단 레터박스 (각 300px) 및 상단 타이틀 합성
- ✅ StoryOrchestrator: 별도 파이프라인으로 Would You Rather와 분리

**사용 방법**:
```bash
npm run story -- --topic "우주의 신비" --count 3
```

**관련 파일**:
- `src/StoryOrchestrator.ts` (메인 오케스트레이터)
- `src/generators/GeminiStoryGenerator.ts` (IStoryGenerator 구현)
- `src/generators/SubtitleGenerator.ts` (ISubtitleGenerator 구현)
- `src/renderers/FFmpegStoryRenderer.ts` (IStoryVideoRenderer 구현)
- `src/cli-story.ts` (CLI 진입점)

---

## 배운 내용 및 인사이트

### 1. Google Gemini JSON 모드의 신뢰성
`responseMimeType: 'application/json'` 설정으로 파싱 에러가 거의 발생하지 않음. 다만 간혹 배열이 아닌 객체를 반환할 수 있으므로 `Array.isArray()` 검증은 필수.

### 2. TTS Provider 폴백 전략의 중요성
API 키가 없어도 시스템이 중단되지 않도록 MockTTSProvider를 두어 개발 및 테스트를 원활하게 함. 실제 프로덕션에서는 필수 키 없으면 명시적으로 에러를 던지는 것이 나음.

### 3. Canvas 한글 폰트 렌더링
시스템에 한글 폰트가 설치되어 있어야 함. macOS는 Pretendard/AppleSDGothicNeo 사용 가능. Linux 환경에서는 Noto Sans KR 등을 설치해야 함.

### 4. FFmpeg 디버깅
`-loglevel error`로 불필요한 로그를 숨기고, 에러 발생 시 `stderr` 출력을 확인하는 것이 중요. 특히 코덱 호환성 문제 (`libx264` 미설치 등)가 자주 발생함.

---

## 기타 참고사항

- **FFmpeg 설치 필수**: 시스템에 FFmpeg가 설치되어 있어야 영상 렌더링 가능
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
- **Node.js Canvas 의존성**: `canvas` 패키지는 네이티브 바이너리를 포함하므로 설치 시 Python/C++ 컴파일러 필요
- **출력 파일 관리**: `npm run clean`으로 임시 파일을 정리하지 않으면 디스크 용량이 빠르게 소진됨
