import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { IStoryVideoRenderer } from '../../types/interfaces';
import { StoryScriptWithAssets } from '../../types/common';

/**
 * FFmpeg를 사용하여 스토리텔링 쇼츠를 렌더링합니다.
 * - 이미지 시퀀스 + Ken Burns Zoom-in 효과
 * - 상/하단 레터박스 (각 300px)
 * - 상단 타이틀 텍스트
 * - ASS 자막 오버레이
 * - 문장별 오디오 병합 + BGM 믹싱
 */
export class FFmpegStoryRenderer implements IStoryVideoRenderer {
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
    // 타이틀 텍스트 파일 생성
    const titleFilePath = path.join(
      path.dirname(subtitlePath),
      `title_${Date.now()}.txt`,
    );
    fs.writeFileSync(titleFilePath, script.title, 'utf-8');

    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      // 이미지 입력 추가
      script.sentences.forEach((s) => {
        command.input(s.imagePath!);
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
        titleFilePath,
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
          'libx264',
          '-preset',
          'medium',
          '-crf',
          '23',
          '-r',
          '30',
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
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
          // 타이틀 임시 파일 정리
          if (fs.existsSync(titleFilePath)) {
            fs.unlinkSync(titleFilePath);
          }
          resolve();
        })
        .on('error', (err: Error, stdout?: string, stderr?: string) => {
          console.error('FFmpeg error:', err.message);
          console.error('FFmpeg stderr:', stderr);
          // 타이틀 임시 파일 정리
          if (fs.existsSync(titleFilePath)) {
            fs.unlinkSync(titleFilePath);
          }
          reject(new Error(`Video rendering failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * FFmpeg 복잡 필터 체인을 구성합니다.
   * - 이미지 스케일링 + Ken Burns Zoom-in
   * - 이미지 시퀀스 concat
   * - 레터박스 추가
   * - 타이틀 텍스트
   * - ASS 자막 오버레이
   */
  private buildFilterComplex(
    script: StoryScriptWithAssets,
    subtitlePath: string,
    titleFilePath: string,
    hasBGM: boolean,
  ): string[] {
    const filters: string[] = [];
    const imageCount = script.sentences.length;

    // Step 1: 각 이미지 스케일링 + Ken Burns Zoom-in 효과
    script.sentences.forEach((s, i) => {
      const duration = s.duration || 3;
      const fps = 30;
      const totalFrames = Math.floor(duration * fps);

      // 이미지를 1080x1920으로 스케일 + 크롭
      filters.push(
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[scaled${i}]`,
      );

      // Ken Burns Zoom-in 효과 (1.0 → 1.1 배율로 서서히 확대)
      // zoompan 필터: z='min(zoom+0.0001,1.1)' -> 매 프레임마다 0.0001씩 증가, 최대 1.1배
      filters.push(
        `[scaled${i}]zoompan=z='min(zoom+0.0001,1.1)':d=${totalFrames}:s=1080x1920:fps=${fps}[zoomed${i}]`,
      );
    });

    // Step 2: 이미지 시퀀스 concat (Fade 전환 효과는 생략, 단순 concat)
    const concatInputs = script.sentences
      .map((_, i) => `[zoomed${i}]`)
      .join('');
    filters.push(`${concatInputs}concat=n=${imageCount}:v=1:a=0[concat_video]`);

    // Step 3: 레터박스 추가 (상단 300px, 하단 300px 검은색)
    filters.push(
      `[concat_video]drawbox=x=0:y=0:w=1080:h=300:color=black:t=fill,drawbox=x=0:y=1620:w=1080:h=300:color=black:t=fill[with_letterbox]`,
    );

    // Step 4: 타이틀 텍스트 추가 (상단 중앙)
    const fontFile = this.getFontPath();
    const titleFileEscaped = titleFilePath
      .replace(/\\/g, '/')
      .replace(/:/g, '\\:');
    filters.push(
      `[with_letterbox]drawtext=fontfile='${fontFile}':textfile='${titleFileEscaped}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=150:borderw=2:bordercolor=black[titled]`,
    );

    // Step 5: ASS 자막 오버레이
    const subtitlePathEscaped = subtitlePath
      .replace(/\\/g, '/')
      .replace(/:/g, '\\:');
    filters.push(`[titled]ass='${subtitlePathEscaped}'[final_video]`);

    // Step 6: 오디오 믹싱 (TTS + BGM)
    const audioInputIndex = imageCount; // 이미지 다음 인덱스가 오디오
    if (hasBGM) {
      const bgmInputIndex = audioInputIndex + 1;
      filters.push(
        `[${audioInputIndex}:a]volume=1.0[tts];[${bgmInputIndex}:a]volume=0.15,aloop=loop=-1:size=2e+09[bgm_loop];[tts][bgm_loop]amix=inputs=2:duration=first[final_audio]`,
      );
    } else {
      filters.push(`[${audioInputIndex}:a]volume=1.0[final_audio]`);
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
   * macOS: /System/Library/Fonts/Supplemental/Arial.ttf 또는 Pretendard
   * Linux: /usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc
   */
  private getFontPath(): string {
    // macOS 기본 한글 폰트
    const appleSDGothicPath = '/System/Library/Fonts/AppleSDGothicNeo.ttc';
    if (fs.existsSync(appleSDGothicPath)) {
      return appleSDGothicPath;
    }

    // macOS Pretendard 폰트 경로 (설치되어 있다면)
    const pretendardPath =
      '/System/Library/Fonts/Supplemental/Pretendard-Bold.ttf';
    if (fs.existsSync(pretendardPath)) {
      return pretendardPath;
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
}
