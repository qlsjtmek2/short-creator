import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, registerFont } from 'canvas';
import { IStoryVideoRenderer } from '../../types/interfaces';
import { StoryScriptWithAssets } from '../../types/common';
import { getStoryConfig } from '../../config/shorts.config';

/**
 * 타이틀 텍스트 세그먼트 (일반 텍스트 또는 강조 텍스트)
 */
interface TitleSegment {
  text: string;
  isHighlight: boolean;
}

/**
 * FFmpeg를 사용하여 스토리텔링 쇼츠를 렌더링합니다.
 * - 이미지 시퀀스 + Ken Burns Zoom-in 효과
 * - 상/하단 레터박스
 * - 상단 타이틀 텍스트 (자동 줄바꿈 + 키워드 강조)
 * - ASS 자막 오버레이
 * - 문장별 오디오 병합 + BGM 믹싱
 */
export class FFmpegStoryRenderer implements IStoryVideoRenderer {
  private config = getStoryConfig();
  /**
   * 스토리 스크립트를 영상으로 렌더링합니다.
   */
  async render(
    script: StoryScriptWithAssets,
    subtitlePath: string,
    outputPath: string,
    bgmPath?: string,
  ): Promise<string> {
    console.log('  🎬 Starting FFmpeg rendering...');

    // 출력 디렉토리가 없으면 생성
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. 오디오 병합 (문장별 오디오들을 하나로 concat)
    const mergedAudioPath = path.join(
      path.dirname(outputPath),
      `merged_audio_${Date.now()}.mp3`,
    );
    await this.concatAudio(
      script.sentences.map((s) => s.audioPath!),
      mergedAudioPath,
    );
    console.log('  ✓ Audio files merged');

    // 2. 영상 렌더링 (이미지 시퀀스 + 효과)
    await this.renderVideo(
      script,
      mergedAudioPath,
      subtitlePath,
      outputPath,
      bgmPath,
    );
    console.log('  ✓ Video rendering complete');

    // 임시 파일 정리
    if (fs.existsSync(mergedAudioPath)) {
      fs.unlinkSync(mergedAudioPath);
    }

    return outputPath;
  }

  /**
   * 문장별 오디오 파일들을 하나로 병합합니다.
   */
  private async concatAudio(
    audioPaths: string[],
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // FFmpeg concat 파일 생성
      const concatListPath = path.join(
        path.dirname(outputPath),
        `concat_list_${Date.now()}.txt`,
      );
      const concatContent = audioPaths
        .map((p) => `file '${path.resolve(p)}'`)
        .join('\n');
      fs.writeFileSync(concatListPath, concatContent);

      const command = ffmpeg();
      command
        .input(concatListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('end', () => {
          // 임시 파일 정리
          if (fs.existsSync(concatListPath)) {
            fs.unlinkSync(concatListPath);
          }
          resolve();
        })
        .on('error', (err: Error) => {
          reject(new Error(`Audio concat failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * 이미지 시퀀스와 오디오를 결합하여 최종 영상을 생성합니다.
   */
  private async renderVideo(
    script: StoryScriptWithAssets,
    audioPath: string,
    subtitlePath: string,
    outputPath: string,
    bgmPath?: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      // 이미지 입력 추가 (GIF 길이 제한 포함)
      script.sentences.forEach((s) => {
        const duration = s.duration || 3;
        const isGif = s.imagePath?.toLowerCase().endsWith('.gif');

        if (isGif) {
          // GIF: 무한 루프 + 시간 제한으로 동영상 스트림 생성
          command.input(s.imagePath!).inputOptions([
            '-stream_loop',
            '-1', // Loop infinitely
            '-t',
            duration.toString(),
          ]);
        } else {
          // 정적 이미지: 단일 프레임 입력 (zoompan 필터가 길이를 생성함)
          // -loop 1을 쓰면 zoompan이 각 프레임마다 적용되어 길이가 폭발함 (30분 영상의 원인)
          command.input(s.imagePath!);
        }
      });

      // 오디오 입력
      command.input(audioPath);

      // BGM 입력 (선택사항)
      if (bgmPath && fs.existsSync(bgmPath)) {
        command.input(bgmPath);
      }

      // 복잡한 필터 체인 구성
      const filterComplex = this.buildFilterComplex(
        script,
        subtitlePath,
        !!bgmPath && fs.existsSync(bgmPath),
      );

      const ffmpegCommand = command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map',
          '[final_video]',
          '-map',
          '[final_audio]',
          '-c:v',
          this.config.rendering.videoCodec,
          '-preset',
          this.config.rendering.preset,
          '-crf',
          this.config.rendering.crf.toString(),
          '-r',
          this.config.kenBurns.fps.toString(),
          '-pix_fmt',
          this.config.rendering.pixelFormat,
          '-c:a',
          this.config.rendering.audioCodec,
          '-b:a',
          this.config.rendering.audioBitrate,
        ])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .output(outputPath) as any;

      ffmpegCommand
        .on('start', (cmd: string) => {
          console.log('  📹 FFmpeg command:', cmd);
        })
        .on('progress', (progress: { percent?: number }) => {
          if (progress.percent) {
            process.stdout.write(
              `\r  Progress: ${progress.percent.toFixed(1)}%`,
            );
          }
        })
        .on('end', () => {
          process.stdout.write('\r');
          resolve();
        })
        .on('error', (err: Error, stdout?: string, stderr?: string) => {
          console.error('FFmpeg error:', err.message);
          console.error('FFmpeg stderr:', stderr);
          reject(new Error(`Video rendering failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * FFmpeg 복잡 필터 체인을 구성합니다.
   * - 이미지 스케일링 + Ken Burns Zoom-in (정적 이미지만)
   * - 이미지 시퀀스 concat
   * - 레터박스 추가
   * - 타이틀 텍스트 (자동 줄바꿈 + 키워드 강조)
   * - ASS 자막 오버레이
   */
  private buildFilterComplex(
    script: StoryScriptWithAssets,
    subtitlePath: string,
    hasBGM: boolean,
  ): string[] {
    const filters: string[] = [];
    const imageCount = script.sentences.length;

    // Step 1: 각 이미지 스케일링 + Ken Burns Zoom-in 효과
    const canvas = this.config.canvas;
    const kb = this.config.kenBurns;

    script.sentences.forEach((s, i) => {
      const duration = s.duration || 3;
      const totalFrames = Math.floor(duration * kb.fps);
      const isGif = s.imagePath?.toLowerCase().endsWith('.gif');

      if (isGif) {
        // GIF: 스케일링만 적용 (zoompan 제외)
        // 움직이는 GIF에 zoompan을 적용하면 프레임이 튀거나 정지됨
        filters.push(
          `[${i}:v]scale=${canvas.width}:${canvas.height}:force_original_aspect_ratio=increase,crop=${canvas.width}:${canvas.height},setsar=1[zoomed${i}]`,
        );
      } else {
        // 정적 이미지: 스케일링 + Ken Burns Zoom-in
        // 단일 프레임을 입력받아 totalFrames만큼 늘림 (d=totalFrames)
        filters.push(
          `[${i}:v]scale=${canvas.width}:${canvas.height}:force_original_aspect_ratio=increase,crop=${canvas.width}:${canvas.height},setsar=1[scaled${i}]`,
        );

        filters.push(
          `[scaled${i}]zoompan=z='min(zoom+${kb.zoomIncrement},${kb.endZoom})':d=${totalFrames}:s=${canvas.width}x${canvas.height}:fps=${kb.fps}[zoomed${i}]`,
        );
      }
    });

    // Step 2: 이미지 시퀀스 concat (Fade 전환 효과는 생략, 단순 concat)
    const concatInputs = script.sentences
      .map((_, i) => `[zoomed${i}]`)
      .join('');
    filters.push(`${concatInputs}concat=n=${imageCount}:v=1:a=0[concat_video]`);

    // Step 3: 레터박스 추가
    const lb = this.config.letterbox;
    filters.push(
      `[concat_video]drawbox=x=0:y=0:w=${canvas.width}:h=${lb.top}:color=${lb.color}:t=fill,drawbox=x=0:y=${canvas.height - lb.bottom}:w=${canvas.width}:h=${lb.bottom}:color=${lb.color}:t=fill[with_letterbox]`,
    );

    // Step 4: 타이틀 텍스트 추가 (자동 줄바꿈 + 키워드 강조)
    const titleFilters = this.buildTitleFilters(
      script.title,
      'with_letterbox',
      'titled',
    );
    filters.push(...titleFilters);

    // Step 5: ASS 자막 오버레이
    const subtitlePathEscaped = subtitlePath
      .replace(/\\/g, '/')
      .replace(/:/g, '\\:');
    filters.push(`[titled]ass='${subtitlePathEscaped}'[final_video]`);

    // Step 6: 오디오 믹싱 (TTS + BGM)
    const audioInputIndex = imageCount; // 이미지 다음 인덱스가 오디오
    const audio = this.config.audio;
    if (hasBGM) {
      const bgmInputIndex = audioInputIndex + 1;
      filters.push(
        `[${audioInputIndex}:a]volume=${audio.ttsVolume}[tts];[${bgmInputIndex}:a]volume=${audio.bgmVolume},aloop=loop=-1:size=2e+09[bgm_loop];[tts][bgm_loop]amix=inputs=2:duration=first[final_audio]`,
      );
    } else {
      filters.push(
        `[${audioInputIndex}:a]volume=${audio.ttsVolume}[final_audio]`,
      );
    }

    return filters;
  }

  /**
   * FFmpeg 텍스트를 이스케이프합니다.
   */
  private escapeFFmpegText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:')
      .replace(/\n/g, '\\n');
  }

  /**
   * 시스템 폰트 경로를 반환합니다.
   * 설정 파일에 지정된 폰트를 우선 사용하고, 없으면 시스템 폰트로 폴백
   */
  private getFontPath(): string {
    // 설정 파일에 지정된 폰트 경로 우선
    const configuredFontPath = this.config.title.fontPath;
    if (fs.existsSync(configuredFontPath)) {
      return configuredFontPath;
    }

    // macOS 기본 한글 폰트
    const appleSDGothicPath = '/System/Library/Fonts/AppleSDGothicNeo.ttc';
    if (fs.existsSync(appleSDGothicPath)) {
      return appleSDGothicPath;
    }

    // Linux 한글 폰트
    const notoPath = '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc';
    if (fs.existsSync(notoPath)) {
      return notoPath;
    }

    // 폴백: Arial (한글 미지원)
    const arialPath = '/System/Library/Fonts/Supplemental/Arial.ttf';
    if (fs.existsSync(arialPath)) {
      return arialPath;
    }

    // 최종 폴백 (프로젝트 내 폰트)
    return path.join(process.cwd(), 'assets', 'fonts', 'Pretendard-Bold.ttf');
  }

  /**
   * 제목에서 중요한 키워드를 자동으로 감지하여 마크업합니다.
   * - 숫자가 포함된 단어 (예: "3가지", "10년")
   * - 2-6글자의 한글 명사
   * - 영문 단어
   */
  private autoHighlightKeywords(title: string): string {
    // 기존 별표 마크업을 모두 제거 (Gemini가 추가한 것일 수 있음)
    const cleanTitle = title.replace(/\*/g, '');

    // 키워드 패턴 정의
    const patterns = [
      /\d+[가-힣]+/g, // 숫자+한글 (예: "3가지", "10년")
      /[A-Za-z]+/g, // 영문 단어
      /[가-힣]{2,6}/g, // 2-6글자 한글 명사
    ];

    // 키워드 후보 추출
    const keywords = new Set<string>();
    for (const pattern of patterns) {
      const matches = cleanTitle.match(pattern);
      if (matches) {
        matches.forEach((m) => {
          // 너무 짧거나 불용어는 제외
          if (m.length >= 2 && !this.isStopWord(m)) {
            keywords.add(m);
          }
        });
      }
    }

    // 너무 많으면 앞의 2-3개만 선택
    const keywordArray = Array.from(keywords);
    const selectedKeywords = keywordArray.slice(0, 3);

    // 제목에 마크업 추가
    let markedTitle = cleanTitle;
    for (const keyword of selectedKeywords) {
      // 정규식 특수문자 이스케이프
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 한글 키워드 매칭 (이미 별표로 둘러싸이지 않은 경우만)
      // \b는 한글에서 작동하지 않으므로 제거
      const regex = new RegExp(`(?<!\\*)${escapedKeyword}(?!\\*)`, 'g');
      markedTitle = markedTitle.replace(regex, `*${keyword}*`);
    }

    return markedTitle;
  }

  /**
   * 불용어인지 확인합니다.
   */
  private isStopWord(word: string): boolean {
    const stopWords = [
      '것',
      '수',
      '때',
      '곳',
      '등',
      '및',
      '또는',
      '또한',
      '하지만',
      '그리고',
      '그러나',
      '에서',
      '에게',
      '으로',
      '를',
      '을',
      '가',
      '이',
      '의',
      '도',
      '만',
      '에',
      '와',
      '과',
    ];
    return stopWords.includes(word);
  }

  /**
   * 타이틀 텍스트를 파싱하여 세그먼트로 분할합니다.
   * *키워드* 형태로 마크업된 텍스트를 강조 세그먼트로 처리합니다.
   */
  private parseTitle(title: string): TitleSegment[] {
    const segments: TitleSegment[] = [];
    const regex = /\*([^*]+)\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(title)) !== null) {
      // 강조 텍스트 이전의 일반 텍스트
      if (match.index > lastIndex) {
        const normalText = title.substring(lastIndex, match.index);
        if (normalText) {
          segments.push({ text: normalText, isHighlight: false });
        }
      }

      // 강조 텍스트 (별표 제거)
      segments.push({ text: match[1], isHighlight: true });
      lastIndex = regex.lastIndex;
    }

    // 마지막 남은 일반 텍스트
    if (lastIndex < title.length) {
      const normalText = title.substring(lastIndex);
      if (normalText) {
        segments.push({ text: normalText, isHighlight: false });
      }
    }

    return segments.length > 0
      ? segments
      : [{ text: title, isHighlight: false }];
  }

  /**
   * 텍스트를 두 줄로 분할합니다.
   * maxCharsPerLine을 초과하면 적절한 공백 위치에서 줄바꿈합니다.
   */
  private splitIntoLines(text: string, maxCharsPerLine: number): string[] {
    // 마크업 제거한 순수 텍스트 길이 체크
    const plainText = text.replace(/\*/g, '');
    if (plainText.length <= maxCharsPerLine) {
      return [text];
    }

    // 중간 지점 찾기
    const midPoint = Math.floor(plainText.length / 2);

    // 중간 지점 근처의 공백 찾기
    let splitIndex = plainText.indexOf(' ', midPoint);
    if (splitIndex === -1 || splitIndex > plainText.length * 0.7) {
      // 공백이 없거나 너무 뒤에 있으면 앞쪽에서 찾기
      splitIndex = plainText.lastIndexOf(' ', midPoint);
    }
    if (splitIndex === -1) {
      // 공백이 아예 없으면 중간에서 강제 분할
      splitIndex = midPoint;
    }

    // 원본 텍스트에서 마크업을 고려하여 분할 위치 찾기
    let actualIndex = 0;
    let plainIndex = 0;
    while (plainIndex < splitIndex && actualIndex < text.length) {
      if (text[actualIndex] === '*') {
        actualIndex++;
        continue;
      }
      plainIndex++;
      actualIndex++;
    }

    // Fix: 마크업 종료 태그(*)가 분리 지점에 있는 경우 포함시킴
    // 예: "*WORD* Next"에서 공백으로 자를 때, actualIndex가 마지막 *를 가리키고 멈출 수 있음
    while (actualIndex < text.length && text[actualIndex] === '*') {
      actualIndex++;
    }

    const line1 = text.substring(0, actualIndex).trim();
    const line2 = text.substring(actualIndex).trim();

    return [line1, line2];
  }

  /**
   * 타이틀 텍스트를 렌더링하기 위한 FFmpeg 필터를 생성합니다.
   * Canvas API를 사용해 텍스트 너비를 측정하여 정확한 위치에 배치합니다.
   */
  private buildTitleFilters(
    title: string,
    inputLabel: string,
    outputLabel: string,
  ): string[] {
    const filters: string[] = [];
    const fontFile = this.getFontPath();
    const titleConfig = this.config.title;
    const canvas = this.config.canvas;

    // 자동 키워드 강조 적용
    const markedTitle = this.autoHighlightKeywords(title);

    // 타이틀 줄 분할
    const lines = this.splitIntoLines(markedTitle, titleConfig.maxCharsPerLine);

    // Y 위치 계산 (한 줄이면 설정값 사용, 두 줄이면 위로 올림)
    const isTwoLines = lines.length > 1;
    const baseY = isTwoLines
      ? titleConfig.y - titleConfig.lineSpacing / 2
      : titleConfig.y;

    let currentLabel = inputLabel;
    let filterIndex = 0;

    lines.forEach((line, lineIndex) => {
      const segments = this.parseTitle(line);
      const yPosition = baseY + lineIndex * titleConfig.lineSpacing;

      // 각 세그먼트의 X 위치를 계산하기 위해 실제 텍스트 너비 측정
      const lineWidths = this.measureTextWidths(
        segments,
        titleConfig.fontSize,
        fontFile,
      );
      const totalWidth = lineWidths.reduce((sum, w) => sum + w, 0);
      const startX = (canvas.width - totalWidth) / 2;

      let currentX = startX;

      segments.forEach((segment, segmentIndex) => {
        const isLastSegment = segmentIndex === segments.length - 1;
        const nextLabel =
          isLastSegment && lineIndex === lines.length - 1
            ? outputLabel
            : `title_temp${filterIndex}`;

        const color = segment.isHighlight
          ? titleConfig.highlightColor
          : titleConfig.fontColor;

        const escapedText = this.escapeFFmpegText(segment.text);

        filters.push(
          `[${currentLabel}]drawtext=fontfile='${fontFile}':text='${escapedText}':fontcolor=${color}:fontsize=${titleConfig.fontSize}:x=${Math.round(currentX)}:y=${yPosition}:borderw=${titleConfig.borderWidth}:bordercolor=${titleConfig.borderColor}[${nextLabel}]`,
        );

        currentX += lineWidths[segmentIndex];
        currentLabel = nextLabel;
        filterIndex++;
      });
    });

    return filters;
  }

  /**
   * Canvas API를 사용하여 실제 텍스트 너비를 정확하게 측정합니다.
   */
  private measureTextWidths(
    segments: TitleSegment[],
    fontSize: number,
    fontFile: string,
  ): number[] {
    // 폰트 파일별로 고유한 패밀리 이름 생성 (캐싱 효과 및 충돌 방지)
    const uniqueFamily = `Font_${path.basename(fontFile, path.extname(fontFile))}`;

    // 커스텀 폰트 등록 (파일이 존재하는 경우)
    if (fs.existsSync(fontFile)) {
      try {
        registerFont(fontFile, { family: uniqueFamily });
      } catch (error) {
        console.warn(
          `Warning: Failed to register font ${fontFile}:`,
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }

    // Canvas 생성 (크기는 중요하지 않음, 측정만 하므로)
    const canvas = createCanvas(100, 100);
    const ctx = canvas.getContext('2d');

    // 폰트 설정
    // 주의: 이미 ExtraBold 등의 폰트 파일을 사용 중이므로 'bold'를 추가하면 
    // 실제 FFmpeg 렌더링보다 더 넓게 측정될 수 있음 (중복 적용 방지)
    ctx.font = `${fontSize}px "${uniqueFamily}"`;

    return segments.map((segment) => {
      const metrics = ctx.measureText(segment.text);
      // 미세한 오차 보정을 위해 약간의 여유값(1%)을 줄 수 있으나, 
      // 일단 정확한 값을 반환하고 관찰
      return metrics.width;
    });
  }

  /**
   * 폰트 파일 경로에서 폰트 패밀리 이름을 추출합니다.
   */
  private extractFontFamily(fontFile: string): string {
    const fileName = path.basename(fontFile, path.extname(fontFile));
    // "Pretendard-ExtraBold" -> "Pretendard"
    return fileName.split('-')[0];
  }
}
