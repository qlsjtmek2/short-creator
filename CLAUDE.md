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

# 스토리텔링 쇼츠 1개 생성 (기본 주제, 기본은 Pexels 이미지)
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
│   ├── index.ts                    # 진입점 (DI 설정 및 CLI 파싱)
│   ├── ShortsGenerator.ts          # 메인 오케스트레이터
│   ├── generators/                 # 콘텐츠 생성 모듈
│   │   ├── GeminiQuestionGenerator.ts   # Would You Rather 질문 생성
│   │   ├── GeminiStoryGenerator.ts      # 스토리텔링형 대본 생성
│   │   └── SubtitleGenerator.ts         # ASS 자막 파일 생성
│   ├── providers/                  # 외부 API 통합
│   │   ├── PexelsImageProvider.ts       # 이미지 검색 및 다운로드
│   │   ├── RedditMemeProvider.ts        # Reddit 밈 다운로드 (무료)
│   │   ├── ImgflipMemeProvider.ts       # Imgflip 밈 생성 (무료)
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
│   ├── common.ts                   # 공통 타입 정의
│   └── config.ts                   # 설정 타입 정의
├── config/
│   ├── shorts.config.ts            # 중앙 설정 파일 (실제 사용)
│   └── shorts.config.example.ts    # 설정 예시 파일
├── scripts/                        # 테스트 및 유틸리티 스크립트
│   ├── test-apis/                  # API 연결 테스트
│   ├── test-*.ts                   # 모듈별 단위 테스트
│   └── download-bgm.ts             # BGM 다운로드
└── output/                         # 생성된 에셋 저장소
    ├── images/                     # 다운로드된 이미지
    ├── memes/                      # 다운로드된 밈/짤방
    ├── audio/                      # 생성된 TTS 오디오
    ├── frames/                     # Canvas 프레임
    └── videos/                     # 최종 영상 파일
```

### 설계 패턴: Interface-Based Architecture

모든 핵심 모듈은 `types/interfaces.ts`에 정의된 인터페이스를 구현합니다:

- **`IQuestionGenerator`**: 질문 생성 (Gemini)
- **`IImageProvider`**: 이미지 다운로드 (Pexels)
- **`IMemeProvider`**: 밈/짤방 다운로드 (Reddit/Imgflip)
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

# 선택 (밈 생성 기능 사용 시)
IMGFLIP_USERNAME=...    # Imgflip 계정 (https://imgflip.com/signup)
IMGFLIP_PASSWORD=...    # Imgflip 비밀번호
```

**TTS 폴백 로직** (`src/index.ts:40-54`):
1. ElevenLabs 키 존재 → ElevenLabs 사용
2. 없으면 OpenAI 키 존재 → OpenAI 사용
3. 없으면 Typecast 키 존재 → Typecast 사용
4. 모두 없으면 → MockTTSProvider (무음 파일 생성)

---

## 설정 파일 커스터마이징

모든 시각적/오디오 설정은 **프로젝트 루트의 `shorts.config.json`** 파일에서 중앙 관리됩니다. 하드코딩된 값을 직접 수정하지 말고, 이 JSON 설정 파일을 통해 커스터마이징하세요.

### 설정 파일 위치
- **실제 설정 파일**: `shorts.config.json` (프로젝트 최상단)
- **예시 파일**: `shorts.config.example.json` (프로젝트 최상단)
- **타입 정의**: `types/config.ts`
- **로더**: `config/shorts.config.ts` (JSON 파일을 읽어옴)

### 주요 설정 항목

#### Would You Rather 쇼츠 설정 (`wouldYouRather`)

**캔버스 및 레이아웃**
- `canvas.width`, `canvas.height`: 영상 해상도 (기본: 1080x1920)
- `layout.imagePadding`: 이미지 영역 여백 (기본: 200px)
- `layout.textMaxWidthPadding`: 텍스트 최대 너비 여백 (기본: 100px)
- `layout.optionATextY`, `layout.optionBTextY`: 텍스트 Y 위치 비율 (기본: 0.25, 0.75)

**색상**
- `colors.optionA.start`, `colors.optionA.end`: 옵션 A 그라데이션 색상
- `colors.optionB.start`, `colors.optionB.end`: 옵션 B 그라데이션 색상
- `colors.text`: 텍스트 색상
- `colors.vsBadgeBackground`, `colors.vsBadgeBorder`, `colors.vsBadgeText`: VS 배지 색상

**폰트**
- `font.path`: 폰트 파일 경로 (기본: `assets/fonts/Pretendard-Bold.ttf`)
- `font.family`: 폰트 패밀리명 (기본: `Pretendard`)
- `font.size`: 텍스트 크기 (기본: 60px)
- `font.lineHeight`: 줄 간격 (기본: 80px)

**텍스트 그림자**
- `textShadow.color`, `textShadow.blur`, `textShadow.offsetX`, `textShadow.offsetY`

**VS 배지**
- `vsBadge.radius`: 배지 반지름 (기본: 80px)
- `vsBadge.borderWidth`: 테두리 두께 (기본: 10px)
- `vsBadge.fontSize`: "VS" 텍스트 크기 (기본: 80px)

**오디오**
- `audio.bgmPath`: BGM 파일 경로
- `audio.ttsVolume`: TTS 볼륨 (0-1, 기본: 1.0)
- `audio.bgmVolume`: BGM 볼륨 (0-1, 기본: 0.15)

#### 스토리텔링 쇼츠 설정 (`storytelling`)

**캔버스 및 레터박스**
- `canvas.width`, `canvas.height`: 영상 해상도
- `letterbox.top`, `letterbox.bottom`: 상/하단 레터박스 높이 (기본: 300px)
- `letterbox.color`: 레터박스 색상 (기본: `black`)

**타이틀 (상단 고정 제목)**
- `title.fontPath`: FFmpeg drawtext용 폰트 경로
- `title.fontSize`: 타이틀 크기 (기본: 48px)
- `title.fontColor`: 타이틀 색상 (기본: `white`)
- `title.y`: 상단에서의 Y 위치 (기본: 150px)
- `title.borderWidth`, `title.borderColor`: 텍스트 테두리

**자막 (ASS 파일)**
- `subtitle.fontName`: 자막 폰트명 (기본: `Pretendard ExtraBold`)
- `subtitle.fontSize`: 자막 크기 (기본: 60px)
- `subtitle.primaryColor`, `subtitle.outlineColor`, `subtitle.backColor`: ASS 색상 형식 (&H00BBGGRR)
- `subtitle.outline`, `subtitle.shadow`: 아웃라인 두께, 그림자 크기
- `subtitle.alignment`: 정렬 (5=중앙)
- `subtitle.marginV`: 하단 여백

**자막 애니메이션**
- `subtitle.animation.popInDuration`: 뿅 하고 나타나는 시간 (기본: 200ms)
- `subtitle.animation.scaleUpStart`, `subtitle.animation.scaleUpEnd`: 시작/최대 배율 (기본: 0%, 120%)
- `subtitle.animation.scaleDownStart`, `subtitle.animation.scaleDownEnd`: Scale down 타이밍 (기본: 200ms, 400ms)
- `subtitle.animation.finalScale`: 최종 배율 (기본: 100%)

**Ken Burns Zoom-in 효과**
- `kenBurns.startZoom`, `kenBurns.endZoom`: 시작/끝 줌 배율 (기본: 1.0, 1.1)
- `kenBurns.zoomIncrement`: 프레임당 줌 증가량 (기본: 0.0001)
- `kenBurns.fps`: 프레임레이트 (기본: 30)

**FFmpeg 렌더링**
- `rendering.videoCodec`: 비디오 코덱 (기본: `libx264`)
- `rendering.preset`: 인코딩 속도 (기본: `medium`)
- `rendering.crf`: 화질 (0-51, 낮을수록 고화질, 기본: 23)
- `rendering.pixelFormat`: 픽셀 포맷 (기본: `yuv420p`)
- `rendering.audioCodec`, `rendering.audioBitrate`: 오디오 설정

### 설정 파일 사용 방법

1. **설정 파일 확인**: `config/shorts.config.ts` 파일을 엽니다.
2. **값 수정**: 원하는 설정값을 변경합니다. (예: 폰트 크기를 60에서 70으로)
3. **저장 및 실행**: 파일을 저장하고 `npm start` 또는 `npm run story`를 실행합니다.
4. **결과 확인**: 변경된 설정이 영상에 반영됩니다.

**예시: 자막 크기 변경**
```typescript
// config/shorts.config.ts
storytelling: {
  subtitle: {
    fontSize: 70,  // 60 → 70으로 변경
    // ... 나머지 설정
  },
}
```

**예시: BGM 볼륨 조절**
```typescript
// config/shorts.config.ts
storytelling: {
  audio: {
    ttsVolume: 1.0,
    bgmVolume: 0.10,  // 0.15 → 0.10으로 줄이기 (더 조용하게)
  },
}
```

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
