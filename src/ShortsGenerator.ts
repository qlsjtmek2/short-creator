import { 
  IQuestionGenerator, 
  IImageProvider, 
  ITTSProvider, 
  IFrameComposer, 
  IVideoRenderer 
} from "../types/interfaces";
import * as path from "path";
import * as fs from "fs";

export interface ShortsGeneratorConfig {
  questionGenerator: IQuestionGenerator;
  imageProvider: IImageProvider;
  ttsProvider: ITTSProvider;
  frameComposer: IFrameComposer;
  videoRenderer: IVideoRenderer;
  outputDir: string;
}

export class ShortsGenerator {
  constructor(private config: ShortsGeneratorConfig) {
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
  }

  async generate(count: number = 1) {
    console.log(`🚀 Starting Shorts Generation (Count: ${count})`);

    // 1. 질문 생성
    const questions = await this.config.questionGenerator.generateQuestions(count);

    for (const question of questions) {
      try {
        console.log(`\n💎 Processing Question: ${question.optionA} VS ${question.optionB}`);

        // 2. 이미지 및 TTS (병렬 처리)
        console.log("⏳ Gathering assets...");
        const [imgA, imgB, audio] = await Promise.all([
          this.config.imageProvider.downloadImage(question.optionAKeyword),
          this.config.imageProvider.downloadImage(question.optionBKeyword),
          this.config.ttsProvider.generateAudio(`${question.optionA}와 ${question.optionB}, 당신의 선택은?`, "박창수")
        ]);

        // 3. 프레임 생성
        console.log("⏳ Composing frame...");
        const frame = await this.config.frameComposer.composeFrame(question, imgA, imgB);

        // 4. 영상 렌더링
        const outputVideoPath = path.join(this.config.outputDir, `shorts_${question.id}.mp4`);
        await this.config.videoRenderer.renderVideo(frame, audio, outputVideoPath);

        console.log(`✅ Generation Complete: ${outputVideoPath}`);
      } catch (error) {
        console.error(`❌ Failed to generate shorts for question ${question.id}:`, error);
      }
    }
  }
}
