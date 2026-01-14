import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  IStoryGenerator,
  IImageProvider,
  ITTSProvider,
  ISubtitleGenerator,
  IStoryVideoRenderer,
} from '../types/interfaces';
import {
  StoryScriptWithAssets,
  StorySentence,
  SubtitleEvent,
} from '../types/common';
import { getStoryConfig } from '../config/shorts.config';

/**
 * 스토리 파이프라인 전용 오케스트레이터
 * Would You Rather와 독립적으로 스토리텔링 쇼츠를 생성합니다.
 */
export class StoryOrchestrator {
  private config = getStoryConfig();
  constructor(
    private storyGenerator: IStoryGenerator,
    private imageProvider: IImageProvider,
    private ttsProvider: ITTSProvider,
    private subtitleGenerator: ISubtitleGenerator,
    private videoRenderer: IStoryVideoRenderer,
  ) {}

  /**
   * 주제를 받아 스토리텔링 쇼츠를 생성합니다.
   * @param topic 스토리 주제
   * @param outputDir 출력 디렉토리
   * @returns 생성된 영상 파일 경로
   */
  async generateStoryShorts(topic: string, outputDir: string): Promise<string> {
    console.log(`\n📖 Generating story shorts for topic: "${topic}"`);

    // 1. 대본 생성
    console.log('1️⃣ Generating story script with Gemini...');
    const script = await this.storyGenerator.generateStory(topic);
    console.log(
      `✅ Generated story: "${script.title}" with ${script.sentences.length} sentences`,
    );

    // 2. 각 문장별 병렬 처리 (이미지 + TTS)
    console.log(
      '2️⃣ Downloading images and generating TTS for each sentence...',
    );
    const sentencesWithAssets = await Promise.all(
      script.sentences.map(async (sentence, index) => {
        console.log(
          `  - Processing sentence ${index + 1}/${script.sentences.length}: "${sentence.text}"`,
        );

        // 2-1. 이미지 다운로드
        const imagePath = path.join(
          outputDir,
          'images',
          `story_${Date.now()}_${index}.jpg`,
        );
        const downloadedImagePath = await this.imageProvider.downloadImage(
          sentence.keyword,
        );

        // 이미지 파일을 지정된 경로로 복사
        const imageDir = path.dirname(imagePath);
        if (!fs.existsSync(imageDir)) {
          fs.mkdirSync(imageDir, { recursive: true });
        }
        fs.copyFileSync(downloadedImagePath, imagePath);

        // 2-2. TTS 생성
        const audioPath = path.join(
          outputDir,
          'audio',
          `story_${Date.now()}_${index}.mp3`,
        );
        const generatedAudioPath = await this.ttsProvider.generateAudio(
          sentence.text,
          'neutral', // 캐릭터는 설정 가능
        );

        // 오디오 파일을 지정된 경로로 복사
        const audioDir = path.dirname(audioPath);
        if (!fs.existsSync(audioDir)) {
          fs.mkdirSync(audioDir, { recursive: true });
        }
        fs.copyFileSync(generatedAudioPath, audioPath);

        // 2-3. 오디오 길이 추출
        const duration = await this.getAudioDuration(audioPath);
        console.log(
          `    ✓ Image: ${sentence.keyword}, Audio: ${duration.toFixed(2)}s`,
        );

        return {
          ...sentence,
          imagePath,
          audioPath,
          duration,
        } as StorySentence;
      }),
    );

    console.log('✅ All assets downloaded and TTS generated');

    // 3. 타임스탬프 계산
    console.log('3️⃣ Calculating timestamps...');
    let currentTime = 0;
    const sentencesWithTimestamps = sentencesWithAssets.map((s) => {
      const startTime = currentTime;
      const endTime = currentTime + (s.duration || 3);
      currentTime = endTime;

      return {
        ...s,
        startTime,
        endTime,
      } as StorySentence;
    });

    const scriptWithAssets: StoryScriptWithAssets = {
      ...script,
      sentences: sentencesWithTimestamps,
      totalDuration: currentTime,
    };

    console.log(`✅ Total duration: ${currentTime.toFixed(2)}s`);

    // 4. 자막 파일 생성
    console.log('4️⃣ Generating subtitle file...');
    const subtitleEvents: SubtitleEvent[] = sentencesWithTimestamps.map(
      (s) => ({
        start: s.startTime!,
        end: s.endTime!,
        text: s.text,
      }),
    );

    const subtitlePath = path.join(
      outputDir,
      'subtitles',
      `story_${Date.now()}.ass`,
    );
    await this.subtitleGenerator.generateASS(subtitleEvents, subtitlePath);
    console.log(`✅ Subtitle file created: ${subtitlePath}`);

    // 5. 영상 렌더링
    console.log('5️⃣ Rendering final video with FFmpeg...');
    const outputPath = path.join(
      outputDir,
      'videos',
      `story_${Date.now()}.mp4`,
    );
    const bgmPath = this.config.audio.bgmPath;

    const finalVideoPath = await this.videoRenderer.render(
      scriptWithAssets,
      subtitlePath,
      outputPath,
      fs.existsSync(bgmPath) ? bgmPath : undefined,
    );

    console.log(`✅ Story shorts created: ${finalVideoPath}\n`);
    return finalVideoPath;
  }

  /**
   * FFprobe를 사용하여 오디오 파일의 길이를 추출합니다.
   * @param audioPath 오디오 파일 경로
   * @returns 오디오 길이 (초 단위)
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        audioPath,
      ]);

      let output = '';
      let errorOutput = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          const duration = parseFloat(output.trim());
          if (isNaN(duration)) {
            reject(
              new Error(
                `Failed to parse duration from FFprobe output: ${output}`,
              ),
            );
          } else {
            resolve(duration);
          }
        } else {
          reject(
            new Error(
              `FFprobe failed with code ${code}: ${errorOutput || 'Unknown error'}`,
            ),
          );
        }
      });

      ffprobe.on('error', (err) => {
        reject(new Error(`Failed to spawn FFprobe: ${err.message}`));
      });
    });
  }
}
