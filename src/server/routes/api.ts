import { Router } from 'express';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Generators
import { GeminiStoryGenerator } from '../../generators/GeminiStoryGenerator';
import { SubtitleGenerator } from '../../generators/SubtitleGenerator';

// Providers
import { PexelsImageProvider } from '../../providers/PexelsImageProvider';
import { TypecastTTSProvider } from '../../providers/TypecastTTSProvider';
import { ElevenLabsTTSProvider } from '../../providers/ElevenLabsTTSProvider';
import { MockTTSProvider } from '../../providers/MockTTSProvider';

// Renderers
import { FFmpegStoryRenderer } from '../../renderers/FFmpegStoryRenderer';

// Orchestrator
import { StoryOrchestrator } from '../../StoryOrchestrator';

// Types & Config
import { StoryScript } from '../../../types/common';
import { getStoryConfig } from '../../../config/shorts.config';

dotenv.config();

const router = Router();
const storyConfig = getStoryConfig();

// --- Job Management ---
interface JobStatus {
  status: 'processing' | 'completed' | 'failed';
  resultUrl?: string; // 클라이언트에서 접근 가능한 URL
  resultPath?: string; // 서버 로컬 경로
  error?: string;
  updatedAt: number;
}

const jobStore = new Map<string, JobStatus>();

// --- Initialize Components ---
const storyGenerator = new GeminiStoryGenerator();
const subtitleGenerator = new SubtitleGenerator();
const videoRenderer = new FFmpegStoryRenderer();

// Image Provider (Default: Pexels)
const pexelsApiKey = process.env.PEXELS_API_KEY || '';
const imageProvider = new PexelsImageProvider(pexelsApiKey);

// TTS Provider
let ttsProvider;
if (process.env.ELEVENLABS_API_KEY) {
  ttsProvider = new ElevenLabsTTSProvider(process.env.ELEVENLABS_API_KEY);
} else if (process.env.TYPECAST_API_KEY) {
  ttsProvider = new TypecastTTSProvider(
    process.env.TYPECAST_API_KEY,
    process.env.TYPECAST_ACTOR_ID || '60f669e4d5c41e973e8e4536'
  );
} else {
  console.warn('⚠️ No TTS API Key found. Using MockTTSProvider.');
  ttsProvider = new MockTTSProvider();
}

// Orchestrator
const orchestrator = new StoryOrchestrator(
  storyGenerator,
  imageProvider,
  ttsProvider,
  subtitleGenerator,
  videoRenderer
);

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');

// --- Routes ---

// 1. 대본 생성 (Draft Script)
router.post('/draft', async (req, res) => {
  try {
    const { topic } = req.body;
    console.log(`📝 Generating draft script for topic: ${topic}`);
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const script: StoryScript = await storyGenerator.generateStory(topic);
    
    // 프론트엔드 포맷에 맞게 변환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedScript = script.sentences.map((s: any) => ({
      text: s.text,
      imageKeyword: s.keyword
    }));

    res.json({ 
      topic: script.title,
      script: formattedScript 
    });
  } catch (error) {
    console.error('Error generating draft:', error);
    res.status(500).json({ error: 'Failed to generate draft' });
  }
});

// 2. 에셋 검색 (Search Assets)
router.post('/assets', async (req, res) => {
  try {
    const { keywords } = req.body;
    console.log(`🖼️ Searching assets for keywords: ${keywords}`);

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Keywords array is required' });
    }

    const results = await Promise.all(keywords.map(async (keyword) => {
      const images = await imageProvider.searchImages(keyword, 4);
      return {
        keyword,
        images
      };
    }));

    res.json({ results });
  } catch (error) {
    console.error('Error searching assets:', error);
    res.status(500).json({ error: 'Failed to search assets' });
  }
});

// 3. 렌더링 요청 (Render Video)
router.post('/render', async (req, res) => {
  try {
    const { topic, script, assetUrls } = req.body;
    console.log(`🎬 Requesting render for "${topic}"`);

    const jobId = `job-${Date.now()}`;
    
    // 초기 상태 저장
    jobStore.set(jobId, {
      status: 'processing',
      updatedAt: Date.now()
    });
    
    // 비동기로 실행
    (async () => {
      try {
        console.log(`🚀 Starting background render job: ${jobId}`);
        const finalVideoPath = await orchestrator.generateStoryFromAssets(
          topic,
          script,
          assetUrls,
          OUTPUT_DIR
        );
        
        // 절대 경로를 상대 경로 URL로 변환
        // 예: /User/.../short-creator/output/videos/file.mp4 -> /output/videos/file.mp4
        const relativePath = path.relative(path.join(process.cwd(), 'output'), finalVideoPath);
        const resultUrl = `/output/${relativePath}`; // Static serving path

        console.log(`✅ Job ${jobId} finished. URL: ${resultUrl}`);
        
        jobStore.set(jobId, {
          status: 'completed',
          resultPath: finalVideoPath,
          resultUrl: resultUrl,
          updatedAt: Date.now()
        });
      } catch (err) {
        console.error(`❌ Job ${jobId} failed:`, err);
        jobStore.set(jobId, {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          updatedAt: Date.now()
        });
      }
    })();
    
    res.json({ message: 'Rendering started', jobId });
  } catch (error) {
    console.error('Error starting render:', error);
    res.status(500).json({ error: 'Failed to start rendering' });
  }
});

// 4. 작업 상태 조회 (Job Status)
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const status = jobStore.get(jobId);

  if (!status) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(status);
});

export default router;