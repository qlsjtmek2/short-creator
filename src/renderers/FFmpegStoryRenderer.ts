import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, registerFont } from 'canvas';
import { IStoryVideoRenderer, EditorSegment } from '../../types/interfaces';
import { StoryScriptWithAssets } from '../../types/common';
import { RENDER_CONFIG } from '../config/render-config';
import {
  RenderManifest,
  ImageElement,
  TitleElement,
  SubtitleChunk,
  AudioElement,
} from '../../types/rendering';

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
  // RENDER_CONFIG 사용
  private config = { ...RENDER_CONFIG };

  /**
   * 스토리 스크립트를 영상으로 렌더링합니다.
   */
  async render(
    script: StoryScriptWithAssets,
    subtitlePath: string,
    outputPath: string,
    titleFont?: string,
    bgmFile?: string,
    editorSegments?: EditorSegment[],
  ): Promise<string> {
    // 파일명으로부터 절대 경로 생성
    const titleFontFile = titleFont || 'Pretendard-ExtraBold.ttf';
    const bgmFileName = bgmFile || 'bgm2.mp3';

    this.config.title.fontPath = path.resolve(
      process.cwd(),
      'assets/fonts',
      titleFontFile,
    );
    this.config.audio.bgmPath = path.resolve(
      process.cwd(),
      'assets/music',
      bgmFileName,
    );

    const bgmPath = this.config.audio.bgmPath;
    console.log('  🎬 Starting FFmpeg rendering...');

    // 출력 디렉토리가 없으면 생성
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const mergedAudioPath = path.join(
      path.dirname(outputPath),
      `merged_audio_${Date.now()}.mp3`,
    );

    await this.concatAudioWithDelay(
      script.sentences.map((s, idx) => ({
        path: s.audioPath!,
        delay: editorSegments ? editorSegments[idx]?.delay || 0 : 0,
      })),
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
      editorSegments,
    );
    console.log('  ✓ Video rendering complete');

    // 임시 파일 정리
    if (fs.existsSync(mergedAudioPath)) {
      fs.unlinkSync(mergedAudioPath);
    }

    return outputPath;
  }

  /**
   * (Phase 21) RenderManifest를 사용하여 영상을 렌더링합니다. (SSOT)
   */
  async renderFromManifest(
    manifest: RenderManifest,
    outputPath: string,
    titleFont?: string,
  ): Promise<string> {
    const titleFontFile = titleFont || 'Pretendard-ExtraBold.ttf';
    this.config.title.fontPath = path.resolve(
      process.cwd(),
      'assets/fonts',
      titleFontFile,
    );

    console.log('  🎬 Starting FFmpeg rendering from Manifest...');

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      const inputs: string[] = [];
      const imageElements = manifest.elements.filter(
        (e) => e.type === 'image',
      ) as ImageElement[];
      const audioElements = manifest.elements.filter(
        (e) => e.type === 'audio',
      ) as AudioElement[];

      // 1. Image Inputs
      imageElements.forEach((el) => {
        const isGif = el.src.toLowerCase().endsWith('.gif');
        const duration = (el.endFrame - el.startFrame) / manifest.metadata.fps;

        if (isGif) {
          command
            .input(el.src)
            .inputOptions(['-stream_loop', '-1', '-t', duration.toString()]);
        } else {
          command.input(el.src);
        }
        inputs.push(`[${inputs.length}:v]`);
      });

      // 2. Audio Inputs
      audioElements.forEach((el) => {
        command.input(el.src);
        inputs.push(`[${inputs.length}:a]`);
      });

      // 3. Filter Complex
      const filterComplex = this.buildFilterComplexFromManifest(
        manifest,
        imageElements.length,
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
          manifest.metadata.fps.toString(),
          '-pix_fmt',
          this.config.rendering.pixelFormat,
          '-c:a',
          this.config.rendering.audioCodec,
          '-b:a',
          this.config.rendering.audioBitrate,
        ])
        .output(outputPath);

      ffmpegCommand
        .on('start', (cmd: string) => console.log('  📹 FFmpeg command:', cmd))
        .on('end', () => {
          console.log('  ✓ Video rendering complete');
          resolve(outputPath);
        })
        .on('error', (err: Error) => {
          console.error('FFmpeg error:', err.message);
          reject(new Error(`Video rendering failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * 문장별 오디오 파일들을 하나로 병합합니다. (딜레이 포함)
   */
  private async concatAudioWithDelay(
    audioSegments: { path: string; delay: number }[],
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempDir = path.dirname(outputPath);
      const concatContent = audioSegments
        .map((s) => `file '${path.resolve(s.path)}'`)
        .join('\n');

      const concatListPath = path.join(
        tempDir,
        `concat_list_${Date.now()}.txt`,
      );
      fs.writeFileSync(concatListPath, concatContent);

      const command = ffmpeg();
      command
        .input(concatListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('end', () => {
          if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath);
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
    editorSegments?: EditorSegment[],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      // 1. 이미지 입력
      script.sentences.forEach((s, idx) => {
        // 딜레이가 포함된 전체 지속 시간
        const editorSeg = editorSegments ? editorSegments[idx] : null;
        const delay = editorSeg?.delay || 0;
        const duration = (s.duration || 3) + delay;

        const isGif = s.imagePath?.toLowerCase().endsWith('.gif');

        if (isGif) {
          command
            .input(s.imagePath!)
            .inputOptions(['-stream_loop', '-1', '-t', duration.toString()]);
        } else {
          command.input(s.imagePath!); // Static image
        }
      });

      // 2. 오디오 입력 (Merged TTS)
      command.input(audioPath);

      // 3. BGM 입력
      if (bgmPath && fs.existsSync(bgmPath)) {
        command.input(bgmPath);
      }

      // 4. SFX 입력 (있다면)
      const sfxInputs: { index: number; type: string; startTime: number }[] =
        [];

      // 현재 입력 개수 계산 (이미지 + TTS + BGM?)
      let currentInputIndex = script.sentences.length + 1; // Images + TTS
      if (bgmPath && fs.existsSync(bgmPath)) {
        currentInputIndex++; // BGM
      }

      if (editorSegments) {
        editorSegments.forEach((seg, idx) => {
          if (seg.sfx) {
            const sfxPath = path.resolve(
              process.cwd(),
              `assets/sfx/${seg.sfx}.mp3`,
            );
            // 파일이 존재한다고 가정 (혹은 체크)
            if (fs.existsSync(sfxPath)) {
              command.input(sfxPath);
              sfxInputs.push({
                index: currentInputIndex,
                type: seg.sfx,
                startTime: script.sentences[idx].startTime || 0,
              });
              currentInputIndex++;
            }
          }
        });
      }

      // 복잡한 필터 체인 구성
      const filterComplex = this.buildFilterComplex(
        script,
        subtitlePath,
        !!bgmPath && fs.existsSync(bgmPath),
        editorSegments,
        sfxInputs,
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
   */
  private buildFilterComplex(
    script: StoryScriptWithAssets,
    subtitlePath: string,
    hasBGM: boolean,
    editorSegments?: EditorSegment[],
    sfxInputs?: { index: number; type: string; startTime: number }[],
  ): string[] {
    const filters: string[] = [];
    const imageCount = script.sentences.length;

    const canvas = this.config.canvas;
    const kb = this.config.kenBurns;

    // Step 1: 각 이미지 스케일링 + VFX 적용
    script.sentences.forEach((s, i) => {
      // 딜레이 포함된 지속 시간 사용
      const editorSeg = editorSegments ? editorSegments[i] : null;
      const delay = editorSeg?.delay || 0;
      const duration = (s.duration || 3) + delay;

      const totalFrames = Math.floor(duration * kb.fps);
      const isGif = s.imagePath?.toLowerCase().endsWith('.gif');
      const vfx = editorSeg?.vfx || 'zoom-in';

      let vfxFilter = '';
      switch (vfx) {
        case 'zoom-in':
          vfxFilter = `zoompan=z='min(zoom+${kb.zoomIncrement},${kb.endZoom})':d=${totalFrames}:s=${canvas.width}x${canvas.height}:fps=${kb.fps}`;
          break;
        case 'zoom-out':
          // 1.2 -> 1.0
          vfxFilter = `zoompan=z='max(1.2-${kb.zoomIncrement}*on,1.0)':d=${totalFrames}:s=${canvas.width}x${canvas.height}:fps=${kb.fps}`;
          break;
        case 'pan-left':
          // x 이동 (중심 -> 왼쪽)
          vfxFilter = `zoompan=z=${kb.endZoom}:x='x+1':d=${totalFrames}:s=${canvas.width}x${canvas.height}:fps=${kb.fps}`;
          break;
        case 'pan-right':
          vfxFilter = `zoompan=z=${kb.endZoom}:x='x-1':d=${totalFrames}:s=${canvas.width}x${canvas.height}:fps=${kb.fps}`;
          break;
        case 'shake':
          // x='x+random(1)*10-5':y='y+random(1)*10-5'
          vfxFilter = `zoompan=z=${kb.endZoom}:x='x+random(1)*20-10':y='y+random(1)*20-10':d=${totalFrames}:s=${canvas.width}x${canvas.height}:fps=${kb.fps}`;
          break;
        default: // static
          vfxFilter = `zoompan=z=1.0:d=${totalFrames}:s=${canvas.width}x${canvas.height}:fps=${kb.fps}`;
      }

      if (isGif) {
        filters.push(
          `[${i}:v]scale=${canvas.width}:${canvas.height}:force_original_aspect_ratio=increase,crop=${canvas.width}:${canvas.height},setsar=1[zoomed${i}]`,
        );
      } else {
        filters.push(
          `[${i}:v]scale=${canvas.width}:${canvas.height}:force_original_aspect_ratio=increase,crop=${canvas.width}:${canvas.height},setsar=1[scaled${i}]`,
        );
        filters.push(`[scaled${i}]${vfxFilter}[zoomed${i}]`);
      }
    });

    // Step 2: 이미지 시퀀스 concat
    const concatInputs = script.sentences
      .map((_, i) => `[zoomed${i}]`)
      .join('');
    filters.push(`${concatInputs}concat=n=${imageCount}:v=1:a=0[concat_video]`);

    // Step 3: 레터박스
    const lb = this.config.letterbox;
    filters.push(
      `[concat_video]drawbox=x=0:y=0:w=${canvas.width}:h=${lb.top}:color=${lb.color}:t=fill,drawbox=x=0:y=${canvas.height - lb.bottom}:w=${canvas.width}:h=${lb.bottom}:color=${lb.color}:t=fill[with_letterbox]`,
    );

    // Step 4: 타이틀
    const titleFilters = this.buildTitleFilters(
      script.title,
      'with_letterbox',
      'titled',
    );
    filters.push(...titleFilters);

    // Step 5: 자막
    const subtitlePathEscaped = subtitlePath
      .replace(/\\/g, '/')
      .replace(/:/g, '\\:');
    filters.push(`[titled]ass='${subtitlePathEscaped}'[final_video]`);

    // Step 6: 오디오 믹싱 (TTS + BGM + SFX)
    const audioInputIndex = imageCount; // TTS
    const bgmInputIndex = audioInputIndex + 1; // BGM
    const audio = this.config.audio;

    // TTS 볼륨 조절
    filters.push(`[${audioInputIndex}:a]volume=${audio.ttsVolume}[tts]`);

    const mixInputs = ['[tts]'];

    // BGM
    if (hasBGM) {
      filters.push(
        `[${bgmInputIndex}:a]volume=${audio.bgmVolume},aloop=loop=-1:size=2e+09[bgm_loop]`,
      );
      mixInputs.push('[bgm_loop]');
    }

    // SFX
    if (sfxInputs && sfxInputs.length > 0) {
      sfxInputs.forEach((sfx, idx) => {
        const label = `sfx${idx}`;
        // 딜레이 적용 (adelay)
        // adelay=1000|1000 (ms 단위, 스테레오 채널 모두 적용)
        const delayMs = Math.round(sfx.startTime * 1000);
        filters.push(
          `[${sfx.index}:a]adelay=${delayMs}|${delayMs},volume=${audio.sfxVolume}[${label}]`,
        );
        mixInputs.push(`[${label}]`);
      });
    }

    // Final Mix
    filters.push(
      `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first[final_audio]`,
    );

    return filters;
  }

  private buildFilterComplexFromManifest(
    manifest: RenderManifest,
    imageCount: number,
  ): string[] {
    const filters: string[] = [];
    const canvas = manifest.canvas;
    const fps = manifest.metadata.fps;

    // Step 1: Images + Ken Burns
    const imageElements = manifest.elements.filter(
      (e) => e.type === 'image',
    ) as ImageElement[];
    imageElements.forEach((el, i) => {
      const durationFrames = el.endFrame - el.startFrame;
      const isGif = el.src.toLowerCase().endsWith('.gif');
      const { fromScale, toScale } = el.kenBurns;

      // Ken Burns 수식
      // zoompan의 x, y, z는 프레임 단위로 계산됨 (on: output frame number)
      // linear interpolation: start + (end - start) * on / duration
      const zExpr = `${fromScale}+(${toScale}-${fromScale})*on/${durationFrames}`;

      // FFmpeg zoompan 좌표계 보정 (중심 기준이 아님, 좌상단 기준)
      // 하지만 여기서는 단순화를 위해 zoompan 기본 동작 사용 (중앙 중심)
      // 정확한 좌표 매핑을 위해서는 x, y 수식 검증 필요.
      // LayoutEngine에서 계산된 값은 Remotion 기준(px)이므로 FFmpeg 좌표계로 변환해야 함.
      // 일단 간단한 Zoom In/Out만 구현.

      const vfxFilter = `zoompan=z='${zExpr}':d=${durationFrames}:s=${canvas.width}x${canvas.height}:fps=${fps}`;
      if (isGif) {
        filters.push(
          `[${i}:v]scale=${canvas.width}:${canvas.height}:force_original_aspect_ratio=increase,crop=${canvas.width}:${canvas.height},setsar=1[zoomed${i}]`,
        );
      } else {
        filters.push(
          `[${i}:v]scale=${canvas.width}:${canvas.height}:force_original_aspect_ratio=increase,crop=${canvas.width}:${canvas.height},setsar=1[scaled${i}]`,
        );
        filters.push(`[scaled${i}]${vfxFilter}[zoomed${i}]`);
      }
    });

    // Step 2: Concat Video
    const concatInputs = imageElements.map((_, i) => `[zoomed${i}]`).join('');
    filters.push(`${concatInputs}concat=n=${imageCount}:v=1:a=0[concat_video]`);

    // Step 3: Letterbox
    const lb = this.config.letterbox;
    filters.push(
      `[concat_video]drawbox=x=0:y=0:w=${canvas.width}:h=${lb.top}:color=${lb.color}:t=fill,drawbox=x=0:y=${canvas.height - lb.bottom}:w=${canvas.width}:h=${lb.bottom}:color=${lb.color}:t=fill[with_letterbox]`,
    );

    // Step 4: Title (using drawtext based on Manifest)
    const titleElement = manifest.elements.find(
      (e) => e.type === 'title_text',
    ) as TitleElement;
    let currentLabel = 'with_letterbox';
    let filterIdx = 0;
    const fontPath = this.getFontPath();

    if (titleElement) {
      titleElement.lines.forEach((line) => {
        line.segments.forEach((seg) => {
          const nextLabel = `title_${filterIdx++}`;
          const color = seg.isHighlight
            ? this.config.title.highlightColor
            : this.config.title.fontColor;
          const escapedText = this.escapeFFmpegText(seg.text);

          filters.push(
            `[${currentLabel}]drawtext=fontfile='${fontPath}':text='${escapedText}':fontcolor=${color}:fontsize=${this.config.title.fontSize}:x=${Math.round(seg.x)}:y=${Math.round(line.y)}:borderw=${this.config.title.borderWidth}:bordercolor=${this.config.title.borderColor}[${nextLabel}]`,
          );
          currentLabel = nextLabel;
        });
      });
    }

    // Step 5: Subtitles (Chunks using drawtext)
    // 성능 이슈가 있을 수 있으나 SSOT 검증을 위해 drawtext 사용
    // enable='between(n, start, end)' 사용
    const subtitleChunks = manifest.elements.filter(
      (e) => e.type === 'subtitle_chunk',
    ) as SubtitleChunk[];
    const subFontPath = this.getFontPath(); // 제목 폰트와 동일하다고 가정 (설정 분리 필요)

    subtitleChunks.forEach((chunk, i) => {
      const nextLabel =
        i === subtitleChunks.length - 1 ? 'final_video' : `sub_${i}`;
      const escapedText = this.escapeFFmpegText(chunk.text);
      // 중앙 정렬을 위해 x=(w-text_w)/2
      // y 좌표는 하단 레터박스 중앙
      const yPos = canvas.height - lb.bottom / 2 - 20;

      // Pop-in 애니메이션은 FFmpeg drawtext로 구현하기 매우 복잡하므로
      // 여기서는 단순 표시(enable)만 구현하거나, 복잡한 수식을 써야 함.
      // 일단 단순 표시로 구현.
      filters.push(
        `[${currentLabel}]drawtext=fontfile='${subFontPath}':text='${escapedText}':fontcolor=white:fontsize=${this.config.subtitle.fontSize}:x=(w-text_w)/2:y=${yPos}:enable='between(n,${chunk.startFrame},${chunk.endFrame})':borderw=2:bordercolor=black[${nextLabel}]`,
      );
      currentLabel = nextLabel;
    });

    if (subtitleChunks.length === 0) {
      filters.push(`[${currentLabel}]null[final_video]`);
    }

    // Step 6: Audio Mix
    const audioElements = manifest.elements.filter(
      (e) => e.type === 'audio',
    ) as AudioElement[];
    const mixInputs: string[] = [];

    // 오디오 입력 인덱스는 이미지 개수 이후부터 시작
    const audioInputBase = imageCount;

    audioElements.forEach((el, i) => {
      const inputIdx = audioInputBase + i;
      const delayMs = Math.round((el.startFrame / fps) * 1000);
      const label = `aud_${i}`;

      // adelay & volume
      // BGM인 경우 loop 처리 로직이 필요할 수 있으나, Manifest에는 'audio'로 통합됨.
      // ID로 구분하거나 별도 타입 필요. 일단은 단순 믹싱.

      if (el.id === 'bgm') {
        filters.push(
          `[${inputIdx}:a]volume=${el.volume},aloop=loop=-1:size=2e+09[${label}]`,
        );
      } else {
        filters.push(
          `[${inputIdx}:a]adelay=${delayMs}|${delayMs},volume=${el.volume}[${label}]`,
        );
      }
      mixInputs.push(`[${label}]`);
    });

    if (mixInputs.length > 0) {
      filters.push(
        `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first[final_audio]`,
      );
    } else {
      filters.push(
        `anullsrc=channel_layout=stereo:sample_rate=44100[final_audio]`,
      );
    }

    return filters;
  }

  private escapeFFmpegText(text: string): string {
    return text
      .replace(/\\/g, '\\')
      .replace(/'/g, "'\\")
      .replace(/:/g, '\\:')
      .replace(/\n/g, '\\n');
  }

  private getFontPath(): string {
    const configuredFontPath = this.config.title.fontPath;
    if (fs.existsSync(configuredFontPath)) return configuredFontPath;
    const fallbackPath = '/System/Library/Fonts/Supplemental/Arial.ttf';
    if (fs.existsSync(fallbackPath)) {
      return fallbackPath;
    }
    return path.join(process.cwd(), 'assets', 'fonts', 'Pretendard-Bold.ttf');
  }

  private autoHighlightKeywords(title: string): string {
    const cleanTitle = title.replace(/\*/g, '');
    const patterns = [/\d+[가-힣]+/g, /[A-Za-z]+/g, /[가-힣]{2,6}/g];
    const keywords = new Set<string>();
    for (const pattern of patterns) {
      const matches = cleanTitle.match(pattern);
      if (matches) {
        matches.forEach((m) => {
          if (m.length >= 2 && !this.isStopWord(m)) keywords.add(m);
        });
      }
    }
    const selectedKeywords = Array.from(keywords).slice(0, 3);
    let markedTitle = cleanTitle;
    for (const keyword of selectedKeywords) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\\]/g, '\\$&');
      const regex = new RegExp(`(?<!\\*)${escapedKeyword}(?!\\*)`, 'g');
      markedTitle = markedTitle.replace(regex, `*${keyword}*`);
    }
    return markedTitle;
  }

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

  private parseTitle(title: string): TitleSegment[] {
    const segments: TitleSegment[] = [];
    const regex = /\*([^*]+)\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(title)) !== null) {
      if (match.index > lastIndex) {
        const normalText = title.substring(lastIndex, match.index);
        if (normalText.length > 0)
          segments.push({ text: normalText, isHighlight: false });
      }
      segments.push({ text: match[1], isHighlight: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < title.length) {
      const normalText = title.substring(lastIndex);
      if (normalText.length > 0)
        segments.push({ text: normalText, isHighlight: false });
    }
    return segments.length > 0
      ? segments
      : [{ text: title, isHighlight: false }];
  }

  private splitIntoLines(text: string, maxCharsPerLine: number): string[] {
    const plainText = text.replace(/\*/g, '');
    if (plainText.length <= maxCharsPerLine) return [text];
    const midPoint = Math.floor(plainText.length / 2);
    let splitIndex = plainText.indexOf(' ', midPoint);
    if (splitIndex === -1 || splitIndex > plainText.length * 0.7)
      splitIndex = plainText.lastIndexOf(' ', midPoint);
    if (splitIndex === -1) splitIndex = midPoint;
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
    while (actualIndex < text.length && text[actualIndex] === '*')
      actualIndex++;
    while (actualIndex < text.length && text[actualIndex] === ' ')
      actualIndex++;
    return [
      text.substring(0, actualIndex).trimEnd(),
      text.substring(actualIndex).trimStart(),
    ];
  }

  private buildTitleFilters(
    title: string,
    inputLabel: string,
    outputLabel: string,
  ): string[] {
    const filters: string[] = [];
    const fontFile = this.getFontPath();
    const titleConfig = this.config.title;
    const canvas = this.config.canvas;
    const markedTitle = this.autoHighlightKeywords(title);
    const lines = this.splitIntoLines(markedTitle, titleConfig.maxCharsPerLine);
    const baseY =
      lines.length > 1
        ? titleConfig.y - titleConfig.lineSpacing / 2
        : titleConfig.y;
    let currentLabel = inputLabel;
    let filterIndex = 0;

    lines.forEach((line, lineIndex) => {
      const segments = this.parseTitle(line);
      const yPosition = baseY + lineIndex * titleConfig.lineSpacing;
      const lineWidths = this.measureTextWidths(
        segments,
        titleConfig.fontSize,
        fontFile,
      );
      const totalWidth = lineWidths.reduce((sum, w) => sum + w, 0);
      let currentX = (canvas.width - totalWidth) / 2;
      const isLastLine = lineIndex === lines.length - 1;

      segments.forEach((segment, segmentIndex) => {
        const trimmedText = segment.text.trim();
        if (trimmedText === '') {
          currentX += lineWidths[segmentIndex];
          return;
        }
        const leadingSpaces = segment.text.match(/^\s*/)?.[0].length || 0;
        const trailingSpaces = segment.text.match(/\s*$/)?.[0].length || 0;
        const spaceWidth = this.measureTextWidths(
          [{ text: ' ', isHighlight: false }],
          titleConfig.fontSize,
          fontFile,
        )[0];
        currentX += leadingSpaces * spaceWidth;

        const isLastSegment = segmentIndex === segments.length - 1;
        const nextLabel =
          isLastSegment && isLastLine
            ? outputLabel
            : `title_temp${filterIndex}`;
        const color = segment.isHighlight
          ? titleConfig.highlightColor
          : titleConfig.fontColor;
        const escapedText = this.escapeFFmpegText(trimmedText);

        filters.push(
          `[${currentLabel}]drawtext=fontfile='${fontFile}':text='${escapedText}':fontcolor=${color}:fontsize=${titleConfig.fontSize}:x=${Math.round(currentX)}:y=${yPosition}:borderw=${titleConfig.borderWidth}:bordercolor=${titleConfig.borderColor}[${nextLabel}]`,
        );

        const trimmedWidth = this.measureTextWidths(
          [{ text: trimmedText, isHighlight: segment.isHighlight }],
          titleConfig.fontSize,
          fontFile,
        )[0];
        currentX += trimmedWidth + trailingSpaces * spaceWidth;
        currentLabel = nextLabel;
        filterIndex++;
      });
      if (isLastLine && currentLabel !== outputLabel)
        filters.push(`[${currentLabel}]null[${outputLabel}]`);
    });
    return filters;
  }

  private measureTextWidths(
    segments: TitleSegment[],
    fontSize: number,
    fontFile: string,
  ): number[] {
    const uniqueFamily = `Font_${path.basename(fontFile, path.extname(fontFile))}`;
    if (fs.existsSync(fontFile)) {
      try {
        registerFont(fontFile, { family: uniqueFamily });
      } catch {
        /* ignore */
      }
    }
    const canvas = createCanvas(100, 100);
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px "${uniqueFamily}"`;
    return segments.map((segment) => ctx.measureText(segment.text).width);
  }
}
