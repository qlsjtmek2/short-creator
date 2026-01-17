import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, registerFont } from 'canvas';
import { IStoryVideoRenderer } from '../../types/interfaces';
import { RENDER_CONFIG } from '../config/render-config';
import {
  RenderManifest,
  ImageElement,
  TitleElement,
  SubtitleChunk,
  AudioElement,
} from '../../types/rendering';

/**
 * FFmpeg를 사용하여 RenderManifest 기반으로 스토리텔링 쇼츠를 렌더링합니다.
 */
export class FFmpegStoryRenderer implements IStoryVideoRenderer {
  private config = { ...RENDER_CONFIG };

  /**
   * (Standardized) RenderManifest를 사용하여 영상을 렌더링합니다.
   */
  async renderFromManifest(
    manifest: RenderManifest,
    outputPath: string,
    titleFont?: string,
  ): Promise<string> {
    const titleFontFile = titleFont || 'Pretendard-ExtraBold.ttf';
    this.config.title.fontPath = path.resolve(process.cwd(), 'assets/fonts', titleFontFile);

    console.log('  🎬 Starting FFmpeg rendering from Manifest...');

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      const imageElements = manifest.elements.filter((e) => e.type === 'image') as ImageElement[];
      const audioElements = manifest.elements.filter((e) => e.type === 'audio') as AudioElement[];

      // 1. Inputs (Images/Gifs)
      imageElements.forEach((el) => {
        const isGif = el.src.toLowerCase().endsWith('.gif');
        const duration = (el.endFrame - el.startFrame) / manifest.metadata.fps;
        const inputPath = path.resolve(process.cwd(), el.src.startsWith('/') ? el.src.substring(1) : el.src);

        if (isGif) {
          command.input(inputPath).inputOptions(['-stream_loop', '-1', '-t', duration.toString()]);
        } else {
          command.input(inputPath);
        }
      });

      // 2. Inputs (Audio)
      audioElements.forEach((el) => {
        const inputPath = path.resolve(process.cwd(), el.src.startsWith('/') ? el.src.substring(1) : el.src);
        command.input(inputPath);
      });

      // 3. Complex Filter Build
      const filterComplex = this.buildFilterComplexFromManifest(manifest, imageElements.length);

      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[final_video]',
          '-map', '[final_audio]',
          '-c:v', this.config.rendering.videoCodec,
          '-preset', this.config.rendering.preset,
          '-crf', this.config.rendering.crf.toString(),
          '-r', manifest.metadata.fps.toString(),
          '-pix_fmt', this.config.rendering.pixelFormat,
          '-c:a', this.config.rendering.audioCodec,
          '-b:a', this.config.rendering.audioBitrate,
        ])
        .output(outputPath)
        .on('start', (cmd: string) => console.log('  📹 FFmpeg command:', cmd))
        .on('end', () => resolve(outputPath))
        .on('error', (err: Error) => reject(new Error(`Video rendering failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * (Legacy Compatibility) 기존 인터페이스 유지를 위해 남겨두되 manifest 모드로 위임합니다.
   */
  async render(
    script: any,
    subtitlePath: string,
    outputPath: string,
    titleFont?: string,
  ): Promise<string> {
    console.warn('⚠️ render() is deprecated. Please use StoryOrchestrator to generate a manifest and call renderFromManifest().');
    // 이 메서드는 이제 StoryOrchestrator 수준에서 Manifest를 생성하여 처리되므로
    // 직접 호출될 일이 거의 없어야 합니다.
    throw new Error('Deprecated: Use renderFromManifest instead.');
  }

  private buildFilterComplexFromManifest(manifest: RenderManifest, imageCount: number): string[] {
    const filters: string[] = [];
    const { canvas, metadata } = manifest;
    const { fps } = metadata;
    const lb = this.config.letterbox;

    // Step 1: Images + Ken Burns
    const imageElements = manifest.elements.filter((e) => e.type === 'image') as ImageElement[];
    imageElements.forEach((el, i) => {
      const durationFrames = el.endFrame - el.startFrame;
      const isGif = el.src.toLowerCase().endsWith('.gif');
      const { fromScale, toScale } = el.kenBurns;
      const zExpr = `${fromScale}+(${toScale}-${fromScale})*on/${durationFrames}`;

      const vfxFilter = `zoompan=z='${zExpr}':d=${durationFrames}:s=${canvas.width}x${canvas.height}:fps=${fps}`;
      
      filters.push(`[${i}:v]scale=${canvas.width}:${canvas.height}:force_original_aspect_ratio=increase,crop=${canvas.width}:${canvas.height},setsar=1[scaled${i}]`);
      if (isGif) {
        filters.push(`[scaled${i}]null[zoomed${i}]`);
      } else {
        filters.push(`[scaled${i}]${vfxFilter}[zoomed${i}]`);
      }
    });

    // Step 2: Concat Video
    const concatInputs = imageElements.map((_, i) => `[zoomed${i}]`).join('');
    filters.push(`${concatInputs}concat=n=${imageCount}:v=1:a=0[concat_video]`);

    // Step 3: Letterbox
    filters.push(`[concat_video]drawbox=x=0:y=0:w=${canvas.width}:h=${lb.top}:color=${lb.color}:t=fill,drawbox=x=0:y=${canvas.height - lb.bottom}:w=${canvas.width}:h=${lb.bottom}:color=${lb.color}:t=fill[with_letterbox]`);

    // Step 4: Title & Subtitles
    let currentLabel = 'with_letterbox';
    let textFilterIdx = 0;
    const fontPath = this.getFontPath();

    // Title
    const titleElement = manifest.elements.find((e) => e.type === 'title_text') as TitleElement;
    if (titleElement) {
      titleElement.lines.forEach((line) => {
        line.segments.forEach((seg) => {
          const nextLabel = `txt_${textFilterIdx++}`;
          const color = seg.isHighlight ? this.config.title.highlightColor : this.config.title.fontColor;
          filters.push(`[${currentLabel}]drawtext=fontfile='${fontPath}':text='${this.escapeFFmpegText(seg.text)}':fontcolor=${color}:fontsize=${this.config.title.fontSize}:x=${Math.round(seg.x)}:y=${Math.round(line.y)}:borderw=${this.config.title.borderWidth}:bordercolor=${this.config.title.borderColor}[${nextLabel}]`);
          currentLabel = nextLabel;
        });
      });
    }

    // Subtitles
    const subtitleChunks = manifest.elements.filter((e) => e.type === 'subtitle_chunk') as SubtitleChunk[];
    subtitleChunks.forEach((chunk, i) => {
      const nextLabel = (i === subtitleChunks.length - 1) ? 'final_video' : `txt_${textFilterIdx++}`;
      const startT = chunk.startFrame / fps;
      const endT = chunk.endFrame / fps;
      const baseFontSize = this.config.subtitle.fontSize;
      const popExpr = `if(lt(t-${startT},0.1),${baseFontSize}*(0.8+0.2*((t-${startT})/0.1)),${baseFontSize})`;

      filters.push(`[${currentLabel}]drawtext=fontfile='${fontPath}':text='${this.escapeFFmpegText(chunk.text)}':fontcolor=white:fontsize='${popExpr}':x=(w-text_w)/2:y=${this.config.subtitle.y}:enable='between(t,${startT},${endT})':borderw=2:bordercolor=black[${nextLabel}]`);
      currentLabel = nextLabel;
    });

    if (subtitleChunks.length === 0) filters.push(`[${currentLabel}]null[final_video]`);

    // Step 5: Audio Mix
    const audioElements = manifest.elements.filter((e) => e.type === 'audio') as AudioElement[];
    const mixInputs: string[] = [];
    const audioInputBase = imageCount;

    audioElements.forEach((el, i) => {
      const inputIdx = audioInputBase + i;
      const delayMs = Math.round((el.startFrame / fps) * 1000);
      const label = `aud_${i}`;

      if (el.id === 'bgm') {
        filters.push(`[${inputIdx}:a]volume=${el.volume},aloop=loop=-1:size=2e+09[${label}]`);
      } else {
        filters.push(`[${inputIdx}:a]adelay=${delayMs}|${delayMs},volume=${el.volume}[${label}]`);
      }
      mixInputs.push(`[${label}]`);
    });

    if (mixInputs.length > 1) {
      filters.push(`${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first[final_audio]`);
    } else if (mixInputs.length === 1) {
      filters.push(`${mixInputs[0]}copy[final_audio]`);
    } else {
      filters.push(`anullsrc=channel_layout=stereo:sample_rate=44100[final_audio]`);
    }

    return filters;
  }

  private escapeFFmpegText(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/'/g, "'\\''").replace(/:/g, '\\:');
  }

  private getFontPath(): string {
    return fs.existsSync(this.config.title.fontPath) ? this.config.title.fontPath : path.join(process.cwd(), 'assets/fonts/Pretendard-Bold.ttf');
  }
}
