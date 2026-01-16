import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import {
  IStoryGenerator,
  IImageProvider,
  ITTSProvider,
  ISubtitleGenerator,
  IStoryVideoRenderer,
  EditorSegment,
} from '../types/interfaces';
import {
  StoryScriptWithAssets,
  StorySentence,
  SubtitleEvent,
} from '../types/common';
import type { RenderManifest } from '../types/rendering';

/**
 * 스토리 파이프라인 전용 오케스트레이터
 * Would You Rather와 독립적으로 스토리텔링 쇼츠를 생성합니다.
 */
export class StoryOrchestrator {
  constructor(
    private storyGenerator: IStoryGenerator,
    private imageProvider: IImageProvider,
    private ttsProvider: ITTSProvider,
    private subtitleGenerator: ISubtitleGenerator,
    private videoRenderer: IStoryVideoRenderer,
  ) {}

  /**
   * 주제를 받아 스토리텔링 쇼츠를 생성합니다. (CLI 모드)
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
        const uniqueId = `${Date.now()}_${process.hrtime()[1]}_${Math.random().toString(36).substring(7)}`;
        const downloadedImagePath = await this.imageProvider.downloadImage(
          sentence.keyword,
        );
        const ext = path.extname(downloadedImagePath);
        const imagePath = path.join(
          outputDir,
          'images',
          `story_${uniqueId}_${index}${ext}`,
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
          `story_${uniqueId}_${index}.mp3`,
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

    // 공통 렌더링 파이프라인 호출 (기본값 사용)
    return this._processPostAssets(
      script,
      sentencesWithAssets,
      outputDir,
      undefined,
    );
  }

  /**
   * (Interactive Mode) 확정된 대본과 선택된 이미지 URL로 영상을 생성합니다.
   */
  async generateStoryFromAssets(
    title: string,
    segments: { text: string; imageKeyword: string }[],
    imageUrls: string[],
    outputDir: string,
    options?: {
      titleFont?: string;
      subtitleFont?: string;
      bgmFile?: string;
      editorSegments?: EditorSegment[];
    },
  ): Promise<string> {
    console.log(`\n🎬 Generating interactive story shorts: "${title}"`);

    // 1. 대본 구조 복원
    const script = {
      title,
      sentences: segments.map((s) => ({
        text: s.text,
        keyword: s.imageKeyword,
      })),
    };

    // 2. 각 문장별 병렬 처리 (이미지 다운로드 + TTS)
    console.log('2️⃣ Downloading selected images and generating TTS...');
    const sentencesWithAssets = await Promise.all(
      script.sentences.map(async (sentence, index) => {
        let imageUrl = imageUrls[index];
        const uniqueId = `${Date.now()}_${index}`;

        // 2-1. 이미지 다운로드 (URL -> 파일)

        const imagePath = path.join(
          outputDir,
          'images',
          `interactive_${uniqueId}.jpg`,
        );
        const imageDir = path.dirname(imagePath);
        if (!fs.existsSync(imageDir))
          fs.mkdirSync(imageDir, { recursive: true });

        // imageUrl이 null이면 fallback 키워드로 재검색
        if (!imageUrl) {
          console.warn(
            `⚠️ No image URL for scene ${index + 1} (keyword: ${sentence.keyword}), using fallback keyword "abstract art"`,
          );
          try {
            const fallbackUrls = await this.imageProvider.searchImages(
              'abstract art',
              1,
            );
            if (fallbackUrls.length > 0) {
              imageUrl = fallbackUrls[0];
              console.log(`✅ Found fallback image: ${imageUrl}`);
            } else {
              throw new Error('No fallback images found');
            }
          } catch (fallbackError) {
            console.error('❌ Failed to get fallback image:', fallbackError);
            throw new Error(
              `Cannot proceed without image for scene ${index + 1}`,
            );
          }
        }

        // URL에서 이미지 다운로드
        console.log(
          `  - Downloading image for scene ${index + 1}: ${imageUrl}`,
        );
        try {
          const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
          });
          fs.writeFileSync(imagePath, response.data);
        } catch (e) {
          console.error(`  ❌ Failed to download image: ${imageUrl}`, e);
          // 실패 시 플레이스홀더나 재시도 로직이 필요하지만, 여기서는 에러 발생
          throw e;
        }

        // 2-2. TTS 생성
        // EditorSegment에 audioUrl이 있고 파일이 서버에 있다면 복사 가능하지만,
        // 경로 매핑이 복잡하므로 안전하게 다시 생성 (MockTTS는 빠름)
        const audioPath = path.join(
          outputDir,
          'audio',
          `interactive_${uniqueId}.mp3`,
        );
        const audioDir = path.dirname(audioPath);
        if (!fs.existsSync(audioDir))
          fs.mkdirSync(audioDir, { recursive: true });

        console.log(`  - Generating TTS for scene ${index + 1}`);
        const generatedAudioPath = await this.ttsProvider.generateAudio(
          sentence.text,
          'neutral',
        );
        fs.copyFileSync(generatedAudioPath, audioPath);

        // 2-3. 길이 추출
        const duration = await this.getAudioDuration(audioPath);

        return {
          ...sentence,
          imagePath,
          audioPath,
          duration,
        } as StorySentence;
      }),
    );

    // 공통 렌더링 파이프라인 호출
    return this._processPostAssets(
      script,
      sentencesWithAssets,
      outputDir,
      options,
    );
  }

  /**
   * 에셋 준비 이후의 공통 렌더링 파이프라인 (타임스탬프 -> 자막 -> 렌더링)
   */
  private async _processPostAssets(
    script: { title: string },
    sentencesWithAssets: StorySentence[],
    outputDir: string,
    options?: {
      titleFont?: string;
      subtitleFont?: string;
      bgmFile?: string;
      editorSegments?: EditorSegment[];
    },
  ): Promise<string> {
    // 3. 타임스탬프 계산
    console.log('3️⃣ Calculating timestamps...');
    let currentTime = 0;
    const sentencesWithTimestamps = sentencesWithAssets.map((s, idx) => {
      // EditorSegment 정보 반영 (Delay)
      const editorSeg = options?.editorSegments
        ? options.editorSegments[idx]
        : null;
      const delay = editorSeg?.delay || 0;

      const startTime = currentTime;
      const endTime = currentTime + (s.duration || 3) + delay; // 오디오 길이 + 딜레이
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
    console.log('4️⃣ Generating subtitle file with word-level chunking...');
    const subtitleEvents: SubtitleEvent[] = sentencesWithTimestamps.flatMap(
      (s) => this.splitSentenceIntoEvents(s),
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

    const finalVideoPath = await this.videoRenderer.render(
      scriptWithAssets,
      subtitlePath,
      outputPath,
      options?.titleFont,
      options?.bgmFile,
      options?.editorSegments, // 전달
    );

    console.log(`✅ Story shorts created: ${finalVideoPath}\n`);
    return finalVideoPath;
  }

  /**
   * (Phase 21) Manifest 기반 렌더링
   */
  async renderWithManifest(
    manifest: RenderManifest,
    outputDir: string,
    options?: {
      titleFont?: string;
    },
  ): Promise<string> {
    console.log('🎬 Rendering video from Manifest...');
    const outputPath = path.join(
      outputDir,
      'videos',
      `manifest_story_${Date.now()}.mp4`,
    );

    // FFmpegRenderer가 Manifest 모드를 지원한다고 가정
    if (this.videoRenderer.renderFromManifest) {
      return this.videoRenderer.renderFromManifest(
        manifest,
        outputPath,
        options?.titleFont,
      );
    } else {
      throw new Error('Video renderer does not support manifest rendering');
    }
  }

  /**
   * 문장을 더 작은 단위(청크)로 나누어 자막 이벤트를 생성합니다.
   * 영상의 템포를 빠르게 하기 위함입니다.
   */
  private splitSentenceIntoEvents(sentence: StorySentence): SubtitleEvent[] {
    const text = sentence.text.trim();
    const duration = sentence.endTime! - sentence.startTime!;

    // 1. 단순 단어 단위 분할 (공백 기준)
    const words = text.split(/\s+/);

    // 2. 청크 생성 (한 화면에 보여줄 단어 수)
    // 짧은 문장은 통째로, 긴 문장은 2~3단어씩 끊어서
    const chunks: string[] = [];
    let currentChunk: string[] = [];

    // 문장 길이에 따라 청크 사이즈 동적 조절
    // 아주 긴 문장은 2단어씩 빠르게, 짧은 문장은 3~4단어씩 여유있게
    const wordsPerChunk = words.length > 10 ? 2 : 3;

    for (const word of words) {
      currentChunk.push(word);

      // 구두점(., ?, !)으로 끝나면 무조건 청크 분리
      // 또는 설정된 단어 수에 도달하면 분리
      if (
        currentChunk.length >= wordsPerChunk ||
        word.endsWith('.') ||
        word.endsWith('?') ||
        word.endsWith('!') ||
        word.endsWith(',')
      ) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
      }
    }

    // 남은 단어 처리
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    // 3. 시간 배분 (글자 수 비율에 따라)
    const totalChars = text.replace(/\s/g, '').length; // 공백 제외 글자 수
    let currentStartTime = sentence.startTime!;

    return chunks.map((chunkText) => {
      const chunkChars = chunkText.replace(/\s/g, '').length;
      // 비율대로 시간 할당하되, 최소 시간(0.5초) 보장 등은 하지 않음 (자연스러운 흐름 위해)
      const chunkDuration = (chunkChars / totalChars) * duration;

      const event: SubtitleEvent = {
        start: currentStartTime,
        end: currentStartTime + chunkDuration,
        text: chunkText,
      };

      currentStartTime += chunkDuration;
      return event;
    });
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
