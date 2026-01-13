import * as dotenv from "dotenv";
import { GeminiQuestionGenerator } from "./generators/GeminiQuestionGenerator";
import { PexelsImageProvider } from "./providers/PexelsImageProvider";
import { MockTTSProvider } from "./providers/MockTTSProvider";
import { CanvasFrameComposer } from "./composers/CanvasFrameComposer";
import { FFmpegVideoRenderer } from "./renderers/FFmpegVideoRenderer";
import { ShortsGenerator } from "./ShortsGenerator";
import * as path from "path";

dotenv.config();

async function bootstrap() {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const PEXELS_KEY = process.env.PEXELS_API_KEY;

  if (!GEMINI_KEY || !PEXELS_KEY) {
    console.error("❌ Required API keys are missing in .env (GEMINI_API_KEY, PEXELS_API_KEY)");
    process.exit(1);
  }

  // DI (Dependency Injection)
  const generator = new ShortsGenerator({
    questionGenerator: new GeminiQuestionGenerator(GEMINI_KEY),
    imageProvider: new PexelsImageProvider(PEXELS_KEY),
    ttsProvider: new MockTTSProvider(), // Currently using Mock
    frameComposer: new CanvasFrameComposer(),
    videoRenderer: new FFmpegVideoRenderer(),
    outputDir: path.join(process.cwd(), "output/videos")
  });

  try {
    // 1개의 쇼츠를 생성해봅니다.
    await generator.generate(1);
    console.log("\n✨ All tasks finished successfully!");
  } catch (error) {
    console.error("\n💥 Critical error during generation:", error);
  }
}

bootstrap();
