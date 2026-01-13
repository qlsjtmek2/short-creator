import * as dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { GeminiStoryGenerator } from './generators/GeminiStoryGenerator';
import { SubtitleGenerator } from './generators/SubtitleGenerator';
import { PexelsImageProvider } from './providers/PexelsImageProvider';
import { ElevenLabsTTSProvider } from './providers/ElevenLabsTTSProvider';
import { TypecastTTSProvider } from './providers/TypecastTTSProvider';
import { OpenAITTSProvider } from './providers/OpenAITTSProvider';
import { MockTTSProvider } from './providers/MockTTSProvider';
import { FFmpegStoryRenderer } from './renderers/FFmpegStoryRenderer';
import { StoryOrchestrator } from './StoryOrchestrator';
import * as path from 'path';
import { ITTSProvider } from '../types/interfaces';

dotenv.config();

async function bootstrap() {
  const argv = await yargs(hideBin(process.argv))
    .option('topic', {
      alias: 't',
      type: 'string',
      description: 'Story topic',
      default: '흥미로운 과학 사실',
    })
    .option('count', {
      alias: 'c',
      type: 'number',
      description: 'Number of story shorts to generate',
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
  const storyOrchestrator = new StoryOrchestrator(
    new GeminiStoryGenerator(),
    new PexelsImageProvider(PEXELS_KEY),
    ttsProvider,
    new SubtitleGenerator(),
    new FFmpegStoryRenderer(),
  );

  try {
    console.log(
      `\n📖 Generating ${argv.count} story shorts on topic: "${argv.topic}"\n`,
    );

    for (let i = 0; i < argv.count; i++) {
      console.log(`\n[${i + 1}/${argv.count}] ======================`);
      const videoPath = await storyOrchestrator.generateStoryShorts(
        argv.topic,
        path.join(process.cwd(), 'output'),
      );
      console.log(`✅ Story shorts created: ${videoPath}`);
    }

    console.log('\n✨ All story shorts generated successfully!');
  } catch (error) {
    console.error('\n💥 Critical error during generation:', error);
    process.exit(1);
  }
}

bootstrap();
