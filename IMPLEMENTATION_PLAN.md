# Phase 15: 스토리텔링 쇼츠 고도화 - 구현 계획

## 📋 개요

**목표**: Would You Rather 쇼츠와 별개로 스토리텔링형 정보 쇼츠를 생성하는 완전한 파이프라인 구축

**기간**: 2-3일 집중 개발

**사용자 선택사항**:
- ✅ 실행 방식: 별도 npm 스크립트 (`npm run story`, `npm run wyr`)
- ✅ TTS 방식: 각 문장마다 별도 API 호출 후 FFmpeg로 병합
- ✅ 이미지 효과: 기본 효과만 (Fade, Ken Burns Zoom-in)
- ✅ 자막 스타일: Pop-in + Scale Up (현재 구현 유지)

---

## 🎯 Phase 15-A: 타입 시스템 및 인터페이스 정비

### Task 1: 인터페이스 정의 추가 (types/interfaces.ts)

**현재 문제**: 스토리 파이프라인용 인터페이스가 정의되지 않음

**작업 내용**:
```typescript
// 1. IStoryGenerator 인터페이스 추가
export interface IStoryGenerator {
  generateStory(topic: string): Promise<StoryScript>;
}

// 2. ISubtitleGenerator 인터페이스 추가
export interface ISubtitleGenerator {
  generateASS(events: SubtitleEvent[], outputPath: string): Promise<string>;
}

// 3. IStoryVideoRenderer 인터페이스 추가
export interface IStoryVideoRenderer {
  render(
    script: StoryScriptWithAssets,  // 오디오/이미지 경로 포함
    subtitlePath: string,
    outputPath: string,
    bgmPath?: string
  ): Promise<string>;
}
```

**예상 시간**: 30분

---

### Task 2: 공통 타입 확장 (types/common.ts)

**현재 문제**: 타이밍 동기화를 위한 타임스탬프 정보 부족

**작업 내용**:
```typescript
// StorySentence 타입 확장
export interface StorySentence {
  text: string;
  keyword: string;
  imagePath?: string;        // 기존
  audioPath?: string;        // 추가: TTS 오디오 파일 경로
  duration?: number;         // 추가: 오디오 길이 (초 단위)
  startTime?: number;        // 추가: 영상 내 시작 시간
  endTime?: number;          // 추가: 영상 내 종료 시간
}

// StoryScriptWithAssets 타입 추가 (렌더링용)
export interface StoryScriptWithAssets extends StoryScript {
  sentences: StorySentence[];  // 모든 필드가 채워진 상태
  totalDuration: number;       // 전체 영상 길이
}

// SubtitleEvent 타입 추가
export interface SubtitleEvent {
  start: number;    // 시작 시간 (초)
  end: number;      // 종료 시간 (초)
  text: string;     // 자막 텍스트
}
```

**예상 시간**: 20분

---

## 🎯 Phase 15-B: 핵심 모듈 구현 및 수정

### Task 3: GeminiStoryGenerator 고도화

**파일**: `src/generators/GeminiStoryGenerator.ts`

**현재 문제**:
1. JSON 파싱 에러 핸들링 없음
2. IStoryGenerator 인터페이스 미구현

**작업 내용**:
1. IStoryGenerator 인터페이스 구현
2. JSON 파싱 에러 핸들링 추가
   ```typescript
   try {
     const result = JSON.parse(responseText);
     if (!result.title || !Array.isArray(result.sentences)) {
       throw new Error('Invalid story format');
     }
     return result;
   } catch (error) {
     console.error('Failed to parse Gemini response:', error);
     // 폴백: 기본 스토리 반환 또는 재시도
     throw new Error('Story generation failed');
   }
   ```
3. 프롬프트 최적화 (문장 길이 제한 강화)

**예상 시간**: 1시간

---

### Task 4: SubtitleGenerator 개선 및 인터페이스 구현

**파일**: `src/generators/SubtitleGenerator.ts`

**현재 문제**:
1. 인터페이스 미구현
2. 애니메이션 타이밍 하드코딩 (200-400ms)

**작업 내용**:
1. ISubtitleGenerator 인터페이스 구현
2. 애니메이션 타이밍을 설정 가능하도록 변경
   ```typescript
   export class SubtitleGenerator implements ISubtitleGenerator {
     private animationDuration = 400;  // ms
     private popInDuration = 200;      // ms

     generateASS(events: SubtitleEvent[], outputPath: string): Promise<string> {
       // 기존 로직 유지, 설정값 사용
     }
   }
   ```
3. 자막 위치 동적 조정 (선택사항)

**예상 시간**: 1시간

---

### Task 5: StoryOrchestrator 클래스 생성

**새 파일**: `src/StoryOrchestrator.ts`

**목적**: 스토리 파이프라인 전용 오케스트레이터 (ShortsGenerator와 분리)

**작업 내용**:
```typescript
export class StoryOrchestrator {
  constructor(
    private storyGenerator: IStoryGenerator,
    private imageProvider: IImageProvider,
    private ttsProvider: ITTSProvider,
    private subtitleGenerator: ISubtitleGenerator,
    private videoRenderer: IStoryVideoRenderer
  ) {}

  async generateStoryShorts(topic: string, outputDir: string): Promise<string> {
    // 1. 대본 생성
    const script = await this.storyGenerator.generateStory(topic);

    // 2. 각 문장별 병렬 처리 (이미지 + TTS)
    const sentencesWithAssets = await Promise.all(
      script.sentences.map(async (sentence, index) => {
        // 2-1. 이미지 다운로드
        const imagePath = await this.imageProvider.downloadImage(
          sentence.keyword,
          `${outputDir}/images/story_${Date.now()}_${index}.jpg`
        );

        // 2-2. TTS 생성
        const audioPath = await this.ttsProvider.generateAudio(
          sentence.text,
          'neutral',  // 캐릭터는 설정 가능
          `${outputDir}/audio/story_${Date.now()}_${index}.mp3`
        );

        // 2-3. 오디오 길이 추출 (FFprobe 사용)
        const duration = await this.getAudioDuration(audioPath);

        return {
          ...sentence,
          imagePath,
          audioPath,
          duration
        };
      })
    );

    // 3. 타임스탬프 계산
    let currentTime = 0;
    const sentencesWithTimestamps = sentencesWithAssets.map(s => {
      const startTime = currentTime;
      const endTime = currentTime + (s.duration || 3);
      currentTime = endTime;

      return {
        ...s,
        startTime,
        endTime
      };
    });

    const scriptWithAssets: StoryScriptWithAssets = {
      ...script,
      sentences: sentencesWithTimestamps,
      totalDuration: currentTime
    };

    // 4. 자막 파일 생성
    const subtitleEvents: SubtitleEvent[] = sentencesWithTimestamps.map(s => ({
      start: s.startTime!,
      end: s.endTime!,
      text: s.text
    }));

    const subtitlePath = `${outputDir}/subtitles/story_${Date.now()}.ass`;
    await this.subtitleGenerator.generateASS(subtitleEvents, subtitlePath);

    // 5. 영상 렌더링
    const outputPath = `${outputDir}/videos/story_${Date.now()}.mp4`;
    const bgmPath = 'assets/music/bgm.mp3';  // 선택사항

    return await this.videoRenderer.render(
      scriptWithAssets,
      subtitlePath,
      outputPath,
      bgmPath
    );
  }

  private async getAudioDuration(audioPath: string): Promise<number> {
    // FFprobe로 오디오 길이 추출
    // 또는 TTS Provider에서 직접 반환하도록 수정
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        audioPath
      ]);

      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          resolve(parseFloat(output.trim()));
        } else {
          reject(new Error(`FFprobe failed with code ${code}`));
        }
      });
    });
  }
}
```

**예상 시간**: 2-3시간

---

### Task 6: FFmpegStoryRenderer 완전 재작성

**파일**: `src/renderers/FFmpegStoryRenderer.ts`

**현재 문제**:
1. complexFilter 문법 오류
2. 오디오 concat 로직 누락
3. 이미지 전환 효과 미구현
4. 타이밍 동기화 메커니즘 없음

**작업 내용**:

#### 6-1. IStoryVideoRenderer 인터페이스 구현
```typescript
export class FFmpegStoryRenderer implements IStoryVideoRenderer {
  async render(
    script: StoryScriptWithAssets,
    subtitlePath: string,
    outputPath: string,
    bgmPath?: string
  ): Promise<string> {
    // 구현 내용 아래 참조
  }
}
```

#### 6-2. 오디오 병합 로직 구현
```typescript
// 모든 문장의 오디오를 concat
const audioInputs = script.sentences.map(s => s.audioPath!);
const audioListPath = `${path.dirname(outputPath)}/audio_list.txt`;

// FFmpeg concat 파일 생성
const audioListContent = audioInputs
  .map(p => `file '${path.resolve(p)}'`)
  .join('\n');

fs.writeFileSync(audioListPath, audioListContent);

// 오디오 병합
const mergedAudioPath = `${path.dirname(outputPath)}/merged_audio.mp3`;
await this.concatAudio(audioListPath, mergedAudioPath);
```

#### 6-3. 이미지 시퀀스 + 전환 효과 필터 체인
```typescript
// 각 이미지에 대해:
// 1. Scale + Crop (1080x1920)
// 2. Ken Burns Zoom-in 효과
// 3. Fade 전환

const filterParts: string[] = [];
const inputs = script.sentences.map(s => s.imagePath!);

inputs.forEach((imgPath, i) => {
  command.input(imgPath);

  const duration = script.sentences[i].duration!;

  // Scale + Crop
  filterParts.push(
    `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=PTS-STARTPTS[scaled${i}]`
  );

  // Ken Burns Zoom-in (시작 1.0 → 종료 1.1 배율)
  filterParts.push(
    `[scaled${i}]zoompan=z='min(zoom+0.0001,1.1)':d=${duration * 30}:s=1080x1920[zoomed${i}]`
  );
});

// 모든 이미지를 concat (fade 전환 포함)
const concatInputs = inputs.map((_, i) => `[zoomed${i}]`).join('');
filterParts.push(
  `${concatInputs}concat=n=${inputs.length}:v=1:a=0,format=yuv420p[video_base]`
);
```

#### 6-4. 레터박스 + 타이틀 합성
```typescript
// 상/하단 레터박스 (각 300px)
filterParts.push(
  `[video_base]drawbox=0:0:1080:300:black:t=fill,drawbox=0:1620:1080:300:black:t=fill[with_letterbox]`
);

// 상단 타이틀 (Pretendard ExtraBold)
const titleEscaped = script.title.replace(/'/g, "\\'").replace(/:/g, "\\:");
filterParts.push(
  `[with_letterbox]drawtext=fontfile=/System/Library/Fonts/Supplemental/Pretendard-ExtraBold.ttf:text='${titleEscaped}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=150[titled]`
);
```

#### 6-5. ASS 자막 오버레이
```typescript
// 자막 필터 (마지막 단계)
filterParts.push(
  `[titled]ass='${subtitlePath}'[final]`
);

// complexFilter 적용
command.complexFilter(filterParts, 'final');
```

#### 6-6. 오디오 믹싱 (TTS + BGM)
```typescript
if (bgmPath && fs.existsSync(bgmPath)) {
  command.input(bgmPath);
  command.audioFilters([
    '[0:a]volume=1.0[tts]',        // 병합된 TTS 오디오
    '[1:a]volume=0.15[bgm]',       // BGM
    '[tts][bgm]amix=inputs=2:duration=first'
  ]);
} else {
  command.outputOptions('-map', '0:a');  // TTS 오디오만 사용
}
```

#### 6-7. 최종 출력 설정
```typescript
command
  .outputOptions('-map', '[final]')
  .outputOptions('-c:v', 'libx264')
  .outputOptions('-preset', 'medium')
  .outputOptions('-crf', '23')
  .outputOptions('-r', '30')
  .output(outputPath)
  .on('end', () => resolve(outputPath))
  .on('error', (err) => reject(err))
  .run();
```

**예상 시간**: 4-5시간 (가장 복잡한 작업)

---

## 🎯 Phase 15-C: 통합 및 CLI 설정

### Task 7: DI Container 확장 (src/index.ts)

**작업 내용**:
1. 새 컴포넌트 등록
   ```typescript
   // Story 파이프라인용 컴포넌트
   const storyGenerator = new GeminiStoryGenerator(apiKey);
   const subtitleGenerator = new SubtitleGenerator();
   const storyRenderer = new FFmpegStoryRenderer();
   const storyOrchestrator = new StoryOrchestrator(
     storyGenerator,
     imageProvider,
     ttsProvider,
     subtitleGenerator,
     storyRenderer
   );
   ```

2. 기존 ShortsGenerator 유지 (Would You Rather용)

**예상 시간**: 30분

---

### Task 8: CLI 진입점 분리

**파일**: `src/index.ts`

**작업 내용**:
1. CLI 파라미터 파싱 로직 제거 (별도 스크립트로 이동)
2. 두 개의 진입점 생성:
   - `src/cli-story.ts`: 스토리 쇼츠 생성
   - `src/cli-wyr.ts`: Would You Rather 쇼츠 생성

**cli-story.ts 예시**:
```typescript
import { StoryOrchestrator } from './StoryOrchestrator';
// ... DI 설정

const topic = process.argv[2] || '흥미로운 과학 사실';
const count = parseInt(process.argv[3] || '1', 10);

(async () => {
  for (let i = 0; i < count; i++) {
    console.log(`[${i + 1}/${count}] Generating story shorts...`);
    const videoPath = await storyOrchestrator.generateStoryShorts(
      topic,
      'output'
    );
    console.log(`✅ Story shorts created: ${videoPath}`);
  }
})();
```

**cli-wyr.ts 예시**:
```typescript
import { ShortsGenerator } from './ShortsGenerator';
// ... 기존 로직 유지

const count = parseInt(process.argv[2] || '1', 10);

(async () => {
  await generator.generate(count);
})();
```

**예상 시간**: 1시간

---

### Task 9: package.json 스크립트 추가

**작업 내용**:
```json
{
  "scripts": {
    "start": "npm run wyr",
    "wyr": "tsx src/cli-wyr.ts",
    "story": "tsx src/cli-story.ts",
    "clean": "...",
    "lint": "...",
    "type-check": "..."
  }
}
```

**사용 예시**:
```bash
# Would You Rather 쇼츠 5개 생성
npm run wyr 5

# 스토리 쇼츠 1개 생성 (기본 주제)
npm run story

# 스토리 쇼츠 3개 생성 (커스텀 주제)
npm run story "우주의 신비" 3
```

**예상 시간**: 10분

---

## 🎯 Phase 15-D: 테스트 및 검증

### Task 10: 통합 테스트 스크립트 업데이트

**파일**: `scripts/test-story-generator.ts`

**작업 내용**:
1. 전체 스토리 파이프라인 e2e 테스트
2. 각 단계별 출력 검증
   - 대본 생성 성공 여부
   - 이미지 다운로드 성공 (N장)
   - TTS 생성 성공 (N개)
   - 오디오 길이 추출 정확성
   - 타임스탬프 계산 정확성
   - 자막 파일 생성 성공
   - 최종 영상 렌더링 성공

**예상 시간**: 2시간

---

### Task 11: 실제 영상 생성 및 품질 검증

**작업 내용**:
1. 다양한 주제로 5개 샘플 생성
2. 수동 검증:
   - 자막-음성 동기화 확인
   - 이미지 전환 효과 확인
   - 레터박스 및 타이틀 위치 확인
   - 전체 영상 길이 정확성 확인
3. 문제 발견 시 미세 조정

**예상 시간**: 2-3시간

---

## 🎯 Phase 15-E: 문서화

### Task 12: CLAUDE.md 업데이트

**작업 내용**:
1. 새로운 npm 스크립트 설명 추가
2. StoryOrchestrator 아키텍처 다이어그램 추가
3. 스토리 파이프라인 데이터 플로우 설명
4. 알려진 제약사항 업데이트

**예상 시간**: 1시간

---

### Task 13: README.md 업데이트

**작업 내용**:
1. 명령어 섹션에 `npm run story` 추가
2. 사용 예시 추가
3. 스토리 주제 추천 리스트 추가

**예상 시간**: 30분

---

## 📊 전체 작업 요약

| Phase | Task | 예상 시간 | 우선순위 |
|-------|------|----------|---------|
| 15-A | Task 1-2: 타입 시스템 정비 | 50분 | 극고 |
| 15-B | Task 3: GeminiStoryGenerator 고도화 | 1시간 | 고 |
| 15-B | Task 4: SubtitleGenerator 개선 | 1시간 | 중 |
| 15-B | Task 5: StoryOrchestrator 생성 | 2-3시간 | 극고 |
| 15-B | Task 6: FFmpegStoryRenderer 재작성 | 4-5시간 | 극고 |
| 15-C | Task 7-9: 통합 및 CLI | 1.7시간 | 고 |
| 15-D | Task 10-11: 테스트 및 검증 | 4-5시간 | 고 |
| 15-E | Task 12-13: 문서화 | 1.5시간 | 중 |

**총 예상 시간**: 16-19시간 (2-3일 집중 개발)

---

## 🚨 주요 위험 요소 및 대응 전략

### 위험 1: FFmpeg 필터 체인 복잡도
- **위험**: 이미지 전환 + 레터박스 + 자막을 동시에 처리하는 필터 체인이 복잡하여 디버깅 어려움
- **대응**: 단계별로 필터 추가 (먼저 이미지만 → 레터박스 추가 → 자막 추가)

### 위험 2: 오디오-비주얼 동기화 오차
- **위험**: FFprobe로 추출한 오디오 길이와 실제 재생 길이가 약간 차이날 수 있음
- **대응**: 0.1초 단위 버퍼 추가, 테스트 후 보정값 적용

### 위험 3: TTS API 호출 실패
- **위험**: 문장별 TTS를 여러 번 호출하므로 실패 가능성 증가
- **대응**: 재시도 로직 추가 (최대 3회), 실패 시 에러 메시지 명확화

### 위험 4: 메모리 사용량 증가
- **위험**: 여러 이미지와 오디오를 동시에 처리하면서 메모리 부족 가능
- **대응**: 이미지 처리 후 즉시 메모리 해제, 배치 크기 제한

---

## ✅ 완료 조건

Phase 15는 다음 조건이 모두 충족되면 완료로 간주합니다:

1. ✅ `npm run story` 명령어로 스토리 쇼츠 생성 가능
2. ✅ `npm run wyr` 명령어로 Would You Rather 쇼츠 생성 가능 (기존 기능 유지)
3. ✅ 생성된 스토리 쇼츠는 다음 요구사항 충족:
   - 자막과 음성이 정확히 동기화됨 (±0.2초 오차 허용)
   - 이미지 전환 효과 (Fade, Ken Burns Zoom-in) 적용됨
   - 상/하단 레터박스 및 상단 타이틀 표시됨
   - ASS 자막 애니메이션 (Pop-in + Scale Up) 작동함
4. ✅ 모든 타입 체크 통과 (`npm run type-check`)
5. ✅ 모든 Lint 검사 통과 (`npm run lint`)
6. ✅ 문서화 완료 (CLAUDE.md, README.md)

---

## 🔄 다음 단계 (Phase 16 이후)

Phase 15 완료 후 고려할 수 있는 추가 개선사항:

- **Phase 16**: 다국어 지원 (영어, 일본어 TTS 및 자막)
- **Phase 17**: 썸네일 자동 생성 (이미지 + 텍스트 오버레이)
- **Phase 18**: 유튜브/틱톡 자동 업로드 기능
- **Phase 19**: 웹 UI 대시보드 (Electron 또는 웹 기반)
- **Phase 20**: 성능 최적화 (병렬 처리, 캐싱 강화)

---

**작성일**: 2026-01-14
**작성자**: Claude Code
**승인 대기 중**
