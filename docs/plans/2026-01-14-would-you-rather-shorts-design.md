# Would You Rather 쇼츠 자동 생성 시스템 설계

**작성일**: 2026-01-14
**목표**: 한국어 Would You Rather 쇼츠를 자동으로 생성하는 시스템

---

## 📋 프로젝트 개요

### 목적
- 한국 20-30대 타겟 Would You Rather 쇼츠 자동 생성
- 높은 조회수와 참여율을 위한 바이럴 콘텐츠 제작
- 2주간 10-15개 영상 테스트 후 효과 검증

### 핵심 사양
- **콘텐츠 타입**: Would You Rather (일상적/현실적 선택)
- **타겟**: 한국 20-30대
- **플랫폼**: YouTube Shorts, TikTok, Instagram Reels
- **영상 길이**: 60초
- **해상도**: 1080x1920 (9:16 세로)

### 기술 스택
- **베이스**: [Would You Rather Shorts Generator](https://github.com/nachat-ayoub/wyr-shorts-generator) (Node.js)
- **TTS**: 타입캐스트 API (캐릭터 음성 - 박창수/개나리)
- **질문 생성**: ChatGPT API (재미있는 질문 자동 생성)
- **이미지 소싱**: Pexels API (무료 스톡)
- **폰트**: Pretendard (한글)
- **색상**: 빨강 vs 파랑 대비
- **영상 합성**: FFmpeg

---

## 🏗️ 시스템 아키텍처

### 전체 구조
```
질문 생성 → 이미지 소싱 → TTS 생성 → 프레임 합성 → 영상 렌더링
     ↓            ↓           ↓           ↓            ↓
  ChatGPT      Pexels     타입캐스트   Node Canvas    FFmpeg
```

### 5개 핵심 모듈
1. **질문 생성 모듈** (IQuestionGenerator)
2. **이미지 제공 모듈** (IImageProvider)
3. **TTS 모듈** (ITTSProvider)
4. **프레임 생성 모듈** (IFrameComposer)
5. **영상 렌더링 모듈** (IVideoRenderer)

---

## 📐 인터페이스 설계

### 1. IQuestionGenerator (질문 생성 인터페이스)

```typescript
interface Question {
  id: string;
  optionA: string;
  optionB: string;
  keywords: string[]; // 이미지 검색용
}

interface IQuestionGenerator {
  generate(count: number, params?: any): Promise<Question[]>;
}
```

**구현체:**
- `ChatGPTQuestionGenerator` - OpenAI GPT API 사용
- 프롬프트: "한국 20-30대가 진짜 고민할 만한 현실적이고 재미있는 Would You Rather 질문"

**교체 가능:**
- `ClaudeQuestionGenerator`
- `ManualQuestionGenerator` (JSON 파일)

---

### 2. IImageProvider (이미지 제공 인터페이스)

```typescript
interface ImageResult {
  path: string;        // 로컬 파일 경로
  source: string;      // 출처 (라이선스)
  keywords: string[];  // 검색 키워드
}

interface IImageProvider {
  fetchImage(keywords: string[]): Promise<ImageResult>;
  fetchImages(keywordsList: string[][]): Promise<ImageResult[]>;
}
```

**구현체:**
- `PexelsImageProvider` - Pexels API 사용, 무료

**교체 가능:**
- `UnsplashImageProvider`
- `AIImageProvider` (Midjourney/DALL-E)
- `LocalImageProvider` (로컬 이미지 폴더)

---

### 3. ITTSProvider (음성 합성 인터페이스)

```typescript
interface TTSResult {
  audioPath: string;   // 로컬 오디오 파일 경로
  duration: number;    // 초 단위
  format: string;      // mp3, wav 등
}

interface ITTSProvider {
  synthesize(text: string, options?: TTSOptions): Promise<TTSResult>;
}

interface TTSOptions {
  voice?: string;      // 캐릭터/음성 ID
  speed?: number;      // 0.5 ~ 2.0
  emotion?: string;    // neutral, happy, sad 등
}
```

**구현체:**
- `TypecastTTSProvider` - 타입캐스트 API
  - 캐릭터: 박창수(충청도) 또는 개나리(경상도)
  - 비용: $11/월 (20분)

**교체 가능:**
- `ElevenLabsTTSProvider` ($5/월, 30,000자)
- `ClovaTTSProvider` (네이버 CLOVA)
- `LocalTTSProvider` (오프라인 TTS)

---

### 4. IFrameComposer (프레임 생성 인터페이스)

```typescript
interface Frame {
  imagePath: string;   // 생성된 프레임 이미지 경로
  width: number;
  height: number;
}

interface ComposerOptions {
  question: Question;
  imageA: ImageResult;
  imageB: ImageResult;
  style: StyleConfig;
}

interface IFrameComposer {
  compose(options: ComposerOptions): Promise<Frame>;
}

interface StyleConfig {
  colorA: string;      // 빨강 계열 (#FF4444)
  colorB: string;      // 파랑 계열 (#4444FF)
  font: string;        // Pretendard
  fontSize: number;    // 80
  layout: 'split-vertical' | 'split-horizontal' | 'custom';
}
```

**구현체:**
- `CanvasSplitScreenComposer` - Node.js canvas 라이브러리
  - 1080x1920 캔버스
  - 왼쪽: 빨강 배경 + 이미지A + 텍스트A
  - 오른쪽: 파랑 배경 + 이미지B + 텍스트B
  - 중앙: 흰색 구분선 + "VS"

**교체 가능:**
- `RemotionComposer` (React 기반)
- `PythonPillowComposer` (Python)
- `CanvaAPIComposer` (Canva API)

---

### 5. IVideoRenderer (영상 렌더링 인터페이스)

```typescript
interface VideoResult {
  videoPath: string;   // 최종 영상 경로
  duration: number;
  resolution: string;  // "1080x1920"
  fileSize: number;    // bytes
}

interface RenderOptions {
  frame: Frame;
  audio: TTSResult;
  backgroundMusic?: string;
  duration: number;    // 초
  fps: number;
  format: 'mp4' | 'mov' | 'webm';
}

interface IVideoRenderer {
  render(options: RenderOptions): Promise<VideoResult>;
}
```

**구현체:**
- `FFmpegVideoRenderer` - FFmpeg 명령줄 도구
  - 프레임 이미지 60초 정지
  - TTS 음성 오버레이
  - 배경음악 낮은 볼륨
  - H.264 인코딩, 30fps

**교체 가능:**
- `RemotionRenderer` (React)
- `ShotStackRenderer` (클라우드 API)

---

## 🔄 데이터 플로우

### 전체 프로세스 (약 10분/10개 영상)

```
입력: "영상 10개 생성" 명령

Step 1: 질문 생성 (30초)
├─ ChatGPT API 호출
├─ "한국 20-30대 현실적 Would You Rather 질문 10개"
└─ questions.json 저장

Step 2: 이미지 소싱 (병렬, 1분)
├─ Pexels API 호출 (20개 동시)
├─ 각 선택지별 관련 이미지 다운로드
└─ images/ 폴더 저장

Step 3: TTS 생성 (병렬, 2분)
├─ 타입캐스트 API 호출 (10개 동시)
├─ "옵션A vs 옵션B. 당신이라면?" 음성 생성
└─ audio/ 폴더 저장 (.mp3)

Step 4: 분할 화면 생성 (병렬, 30초)
├─ Node.js canvas로 1080x1920 생성
├─ 빨강/파랑 배경 + 이미지 + 텍스트
└─ frames/ 폴더 저장 (.png)

Step 5: 영상 렌더링 (순차, 5분)
├─ FFmpeg로 프레임 + 음성 + 음악 합성
├─ 1080x1920, 30fps, H.264
└─ output/ 폴더 저장 (.mp4)

출력: 10개의 60초 쇼츠 영상
```

### 예상 비용 (10개 영상 기준)
- ChatGPT API: ~$0.05
- 타입캐스트: ~$1.10 (월 20분 플랜)
- Pexels: 무료
- **총**: ~$1.15/10개 영상

---

## 🎨 시각적 디자인

### 분할 화면 레이아웃 (1080x1920)

```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────┬─────────┐          │
│  │  빨강   │  파랑   │          │  상단 여백
│  │ 배경    │ 배경    │          │
│  │         │         │          │
│  ├─────────┼─────────┤          │
│  │ 이미지A │ 이미지B │          │
│  │ (400x  │ (400x   │          │  중앙 콘텐츠
│  │  400)  │  400)   │          │
│  ├─────────┼─────────┤          │
│  │         │         │          │
│  │ 연봉 2배│워라밸   │          │  텍스트
│  │         │ 완벽    │          │
│  │         │         │          │
│  └─────────┴─────────┘          │
│       VS (중앙)                 │
│                                 │
│  "당신이라면?"                  │  하단 텍스트
│                                 │
└─────────────────────────────────┘
```

### 색상 팔레트
- **선택지 A (왼쪽)**: #FF4444 (빨강) ~ #FF6666 (밝은 빨강)
- **선택지 B (오른쪽)**: #4444FF (파랑) ~ #6666FF (밝은 파랑)
- **구분선**: #FFFFFF (흰색)
- **텍스트**: #FFFFFF (흰색, 검정 테두리)

### 폰트
- **메인 폰트**: Pretendard Bold
- **크기**: 80px (선택지), 100px (VS), 60px (하단)
- **정렬**: 중앙 정렬

---

## 💻 메인 오케스트레이터

```typescript
class ShortsGenerator {
  constructor(
    private questionGen: IQuestionGenerator,
    private imageProvider: IImageProvider,
    private ttsProvider: ITTSProvider,
    private frameComposer: IFrameComposer,
    private videoRenderer: IVideoRenderer
  ) {}

  async generateShorts(count: number): Promise<VideoResult[]> {
    console.log(`🎬 ${count}개 쇼츠 생성 시작...`);

    // 1. 질문 생성
    console.log('📝 질문 생성 중...');
    const questions = await this.questionGen.generate(count);

    // 2. 이미지 병렬 가져오기
    console.log('🖼️ 이미지 소싱 중...');
    const images = await Promise.all(
      questions.map(q =>
        Promise.all([
          this.imageProvider.fetchImage(q.keywords),
          this.imageProvider.fetchImage(q.keywords)
        ])
      )
    );

    // 3. TTS 병렬 생성
    console.log('🔊 음성 생성 중...');
    const audios = await Promise.all(
      questions.map(q =>
        this.ttsProvider.synthesize(
          `${q.optionA} vs ${q.optionB}. 당신이라면?`
        )
      )
    );

    // 4. 프레임 생성
    console.log('🎨 프레임 생성 중...');
    const frames = await Promise.all(
      questions.map((q, i) =>
        this.frameComposer.compose({
          question: q,
          imageA: images[i][0],
          imageB: images[i][1],
          style: {
            colorA: '#FF4444',
            colorB: '#4444FF',
            font: 'Pretendard',
            fontSize: 80,
            layout: 'split-vertical'
          }
        })
      )
    );

    // 5. 영상 렌더링
    console.log('🎞️ 영상 렌더링 중...');
    const videos = await Promise.all(
      frames.map((frame, i) =>
        this.videoRenderer.render({
          frame,
          audio: audios[i],
          duration: 60,
          fps: 30,
          format: 'mp4'
        })
      )
    );

    console.log('✅ 완료!');
    return videos;
  }
}
```

---

## 🚀 구현 계획

### Phase 1: 초기 구조 (Day 1)
- [ ] GitHub 프로젝트 clone 및 분석
- [ ] 프로젝트 구조 재구성
- [ ] 인터페이스 정의 파일 작성
- [ ] 기본 의존성 설치

### Phase 2: 모듈 구현 (Day 1-2)
- [ ] ChatGPT 질문 생성 모듈
- [ ] 타입캐스트 TTS 모듈
- [ ] Pexels 이미지 제공 모듈
- [ ] Canvas 분할 화면 컴포저
- [ ] FFmpeg 영상 렌더러

### Phase 3: 통합 및 테스트 (Day 2)
- [ ] 메인 오케스트레이터 구현
- [ ] 첫 테스트 영상 생성
- [ ] 품질 확인 및 조정

### Phase 4: 자동화 및 최적화 (Day 3)
- [ ] 배치 생성 스크립트
- [ ] 에러 처리 및 로깅
- [ ] 성능 최적화 (병렬 처리)
- [ ] 첫 10개 영상 생성

---

## 📊 예상 성과

### 기술적 목표
- 10개 영상 생성 시간: 10분 이하
- 영상당 비용: $0.12 이하
- 자동화율: 95% (수동 검토 5%)

### 비즈니스 목표
- 첫 2주: 10-15개 영상 업로드
- 조회수 목표: 영상당 평균 10,000회
- 참여율 목표: 댓글 50개 이상/영상

---

## 🔧 확장 계획

### 단기 (1개월)
- C (가상 대화), H (충격 반전) 포맷 추가
- YouTube API 자동 업로드
- 분석 대시보드 (조회수, 참여율)

### 중기 (3개월)
- 멀티 플랫폼 (TikTok, Instagram) 자동 업로드
- A/B 테스트 (색상, 폰트, 음성)
- AI 기반 질문 최적화

### 장기 (6개월)
- 완전 자동화 워크플로우 (n8n)
- 여러 채널 운영
- 수익 다변화 (제휴, 스폰서)

---

## 📝 참고 자료

- [GitHub: Would You Rather Shorts Generator](https://github.com/nachat-ayoub/wyr-shorts-generator)
- [타입캐스트 API 문서](https://typecast.ai/)
- [OpenAI API 문서](https://platform.openai.com/docs)
- [Pexels API 문서](https://www.pexels.com/api/)
- [FFmpeg 문서](https://ffmpeg.org/documentation.html)
- 리서치 문서: 2025-2026 쇼츠 자동화 트렌드
