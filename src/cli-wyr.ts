import * as dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { GeminiQuestionGenerator } from './generators/GeminiQuestionGenerator';
import { PexelsImageProvider } from './providers/PexelsImageProvider';
import { ElevenLabsTTSProvider } from './providers/ElevenLabsTTSProvider';
import { TypecastTTSProvider } from './providers/TypecastTTSProvider';
import { OpenAITTSProvider } from './providers/OpenAITTSProvider';
import { MockTTSProvider } from './providers/MockTTSProvider';
import { CanvasFrameComposer } from './composers/CanvasFrameComposer';
import { FFmpegVideoRenderer } from './renderers/FFmpegVideoRenderer';
import { ShortsGenerator } from './ShortsGenerator';
import * as path from 'path';
import { ITTSProvider } from '../types/interfaces';

dotenv.config();

async function bootstrap() {
  const argv = await yargs(hideBin(process.argv))
    .option('count', {
      alias: 'c',
      type: 'number',
      description: 'Number of Would You Rather shorts to generate',
      default: 1,
    })
    .help()
    .parse();

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const PEXELS_KEY = process.env.PEXELS_API_KEY;
  const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
  const TYPECAST_KEY = process.env.TYPECAST_API_KEY;
  const OPENAI_KEY = process.env.OPENAI_API_KEY;

  if (!GEMINI_KEY || !PEXELS_KEY) {
    console.error(
      '❌ Required API keys are missing in .env (GEMINI_API_KEY, PEXELS_API_KEY)',
    );
    process.exit(1);
  }

  // TTS Provider 선택 (ElevenLabs > OpenAI > Typecast > Mock)
  let ttsProvider: ITTSProvider;
  if (ELEVENLABS_KEY) {
    console.log('🎙️ Using ElevenLabs TTS Provider');
    ttsProvider = new ElevenLabsTTSProvider(ELEVENLABS_KEY);
  } else if (OPENAI_KEY) {
    console.log('🎙️ Using OpenAI TTS Provider');
    ttsProvider = new OpenAITTSProvider(OPENAI_KEY);
  } else if (TYPECAST_KEY) {
    console.log('🎙️ Using Typecast TTS Provider');
    ttsProvider = new TypecastTTSProvider(TYPECAST_KEY);
  } else {
    console.log('⚠️ No TTS API Key found. Using Mock TTS Provider.');
    ttsProvider = new MockTTSProvider();
  }

  // DI (Dependency Injection)
  const generator = new ShortsGenerator({
    questionGenerator: new GeminiQuestionGenerator(GEMINI_KEY),
    imageProvider: new PexelsImageProvider(PEXELS_KEY),
    ttsProvider: ttsProvider,
    frameComposer: new CanvasFrameComposer(),
    videoRenderer: new FFmpegVideoRenderer(),
    outputDir: path.join(process.cwd(), 'output/videos'),
  });

  try {
    console.log(`\n🎬 Generating ${argv.count} Would You Rather shorts...\n`);
    await generator.generate(argv.count);
    console.log('\n✨ All Would You Rather shorts generated successfully!');
  } catch (error) {
    console.error('\n💥 Critical error during generation:', error);
    process.exit(1);
  }
}

bootstrap();
