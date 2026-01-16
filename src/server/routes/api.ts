import { Router } from 'express';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Generators
import { GeminiStoryGenerator } from '../../generators/GeminiStoryGenerator';
import { SubtitleGenerator } from '../../generators/SubtitleGenerator';

// Providers
import { PexelsImageProvider } from '../../providers/PexelsImageProvider';
import { KlipyGIFProvider } from '../../providers/KlipyGIFProvider';
import { RedditMemeProvider } from '../../providers/RedditMemeProvider';
import { ImgflipMemeProvider } from '../../providers/ImgflipMemeProvider';
import { GoogleImageProvider } from '../../providers/GoogleImageProvider';
import { TypecastTTSProvider } from '../../providers/TypecastTTSProvider';
import { ElevenLabsTTSProvider } from '../../providers/ElevenLabsTTSProvider';
import { MockTTSProvider } from '../../providers/MockTTSProvider';

// Renderers
import { FFmpegStoryRenderer } from '../../renderers/FFmpegStoryRenderer';

// Core
import { LayoutEngine } from '../../core/LayoutEngine';

// Orchestrator
import { StoryOrchestrator } from '../../StoryOrchestrator';

// Types & Config
import { StoryScript } from '../../../types/common';
import { IImageProvider } from '../../../types/interfaces';
import { getAudioDuration } from '../../utils/audio';

dotenv.config();

const router = Router();

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
const layoutEngine = new LayoutEngine();

// Image Providers
const pexelsProvider = new PexelsImageProvider(
  process.env.PEXELS_API_KEY || '',
);
const klipyProvider = new KlipyGIFProvider(
  process.env.KLIPY_API_KEY || '88888888',
); // Test Key
const redditProvider = new RedditMemeProvider();
const imgflipProvider = new ImgflipMemeProvider(
  process.env.IMGFLIP_USERNAME || '',
  process.env.IMGFLIP_PASSWORD || '',
);
const googleProvider = new GoogleImageProvider(
  process.env.GOOGLE_SEARCH_API_KEY || '',
  process.env.GOOGLE_SEARCH_CX || '',
);

const imageProviders: Record<string, IImageProvider> = {
  pexels: pexelsProvider,
  klipy: klipyProvider,
  reddit: redditProvider,
  imgflip: imgflipProvider,
  google: googleProvider,
};

// Default Image Provider for Orchestrator (used for automatic flow)
const defaultImageProvider = pexelsProvider;

// TTS Provider
let ttsProvider;
if (process.env.ELEVENLABS_API_KEY) {
  ttsProvider = new ElevenLabsTTSProvider(process.env.ELEVENLABS_API_KEY);
} else if (process.env.TYPECAST_API_KEY) {
  ttsProvider = new TypecastTTSProvider(
    process.env.TYPECAST_API_KEY,
    process.env.TYPECAST_ACTOR_ID || '60f669e4d5c41e973e8e4536',
  );
} else {
  console.warn('⚠️ No TTS API Key found. Using MockTTSProvider.');
  ttsProvider = new MockTTSProvider();
}

// Orchestrator
const orchestrator = new StoryOrchestrator(
  storyGenerator,
  defaultImageProvider,
  ttsProvider,
  subtitleGenerator,
  videoRenderer,
);

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');

// --- Routes ---

// 1. 대본 생성 (Draft Script)

router.post('/draft', async (req, res) => {
  try {
    const { topic, options } = req.body;

    console.log(`📝 Generating draft script for topic: ${topic}`);

    if (options) console.log(`   Options: ${JSON.stringify(options)}`);

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const script: StoryScript = await storyGenerator.generateStory(
      topic,
      options,
    );

    // 프론트엔드 포맷에 맞게 변환
    const formattedScript = script.sentences.map((s) => ({
      text: s.text,
      imageKeyword: s.keyword,
    }));

    res.json({
      topic: script.title,
      script: formattedScript,
    });
  } catch (error) {
    console.error('Error generating draft:', error);
    res.status(500).json({ error: 'Failed to generate draft' });
  }
});

// 1.5 추천 주제 생성 (Recommend Topics)
router.get('/recommend', async (req, res) => {
  try {
    console.log('💡 Generating recommended topics...');

    // 무작위성을 위한 테마 풀 (25개)
    const THEMES = [
      '미스터리',
      '공포/괴담',
      '역사 속 비밀',
      '우주/과학',
      '심해의 신비',
      '미래 기술',
      '흥미로운 심리학',
      '동물 퀴즈',
      '세계의 불가사의',
      '충격적인 실화',
      '밸런스 게임',
      '만약에 시리즈',
      '생활 꿀팁',
      '음식 월드컵',
      '여행지 추천',
      '성격 유형(MBTI)',
      '연애 심리',
      '도시 전설',
      '기묘한 발명품',
      '역설/딜레마',
      '초능력 상상',
      '좀비 아포칼립스',
      '시간 여행',
      '평행 우주',
      '꿈 해몽',
    ];

    // 랜덤하게 3개의 테마 선택
    const selectedThemes = THEMES.sort(() => 0.5 - Math.random()).slice(0, 3);

    // Gemini에게 요청할 프롬프트 구성
    const prompt = `
유튜브 쇼츠 영상으로 만들면 좋을 흥미로운 주제 5가지를 추천해줘.
특히 다음 키워드들과 관련된 참신한 주제를 섞어서 제안해줘: [${selectedThemes.join(', ')}]

다음 JSON 형식으로만 응답해줘:
[
  { "category": "카테고리(2~4글자)", "text": "주제 텍스트(20자 내외)" },
  ...
]

조건:
1. 20-30대 한국인이 클릭할 수밖에 없는 "어그로성" 있고 "흥미로운" 주제여야 해.
2. 뻔한 주제(예: 라면 먹기 vs 굶기)는 피하고, 구체적이고 자극적인 상황을 설정해줘.
3. 반드시 JSON 배열 포맷만 출력해. 마크다운이나 추가 설명 금지.
`;

    // Gemini 호출 (높은 Temperature로 다양성 확보)
    // generateStory 메서드는 StoryScript 형식을 반환하므로, 직접 model.generateContent를 호출해야 하지만,
    // 여기서는 편의상 storyGenerator 내부의 genAI 인스턴스에 접근할 수 없으므로
    // storyGenerator를 우회하거나, storyGenerator에 범용 메서드를 추가하는 것이 좋음.
    // 하지만 현재 구조상 직접 구현이 어려우므로 storyGenerator를 활용하되,
    // StoryGenerator가 IStoryGenerator 인터페이스를 따르므로, 임시로 로컬 인스턴스를 생성하거나
    // GoogleGenerativeAI를 직접 import해서 사용함.

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash', // 요청에 따라 gemini-2.5-flash 사용
      generationConfig: { temperature: 1.2 }, // 높은 창의성
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, '').trim();

    let recommendations;
    try {
      recommendations = JSON.parse(jsonStr);
    } catch (e) {
      // 파싱 실패 시 기본값 반환 (Fail-safe)
      console.error('Failed to parse Gemini recommendation:', e);
      recommendations = [
        {
          category: '오류',
          text: '주제 추천 생성에 실패했습니다. 다시 시도해주세요.',
        },
      ];
    }

    res.json({ topics: recommendations });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    // 에러 발생 시에도 빈 배열보다는 하드코딩된 백업 데이터 반환 가능
    res.status(500).json({ error: 'Failed to recommend topics' });
  }
});

// 2. 에셋 검색 (Search Assets)
router.post('/assets', async (req, res) => {
  try {
    const { keywords, provider = 'pexels' } = req.body;
    console.log(
      `🖼️ Searching assets via [${provider}] for keywords: ${keywords}`,
    );

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Keywords array is required' });
    }

    const targetProvider = imageProviders[provider] || imageProviders['pexels'];

    const results = await Promise.all(
      keywords.map(async (keyword) => {
        const images = await targetProvider.searchImages(keyword, 4);
        return {
          keyword,
          images,
        };
      }),
    );

    res.json({ results });
  } catch (error) {
    console.error('Error searching assets:', error);
    res.status(500).json({ error: 'Failed to search assets' });
  }
});

// 3. 렌더링 요청 (Render Video)
router.post('/render', async (req, res) => {
  try {
    const {
      topic,
      script,
      assetUrls,
      mockTtsSpeed,
      titleFont,
      subtitleFont,
      bgmFile,
      segments, // New
      manifest, // New: Phase 21
    } = req.body;
    console.log(`🎬 Requesting render for "${topic}"`);

    // MockTTSProvider 속도 설정
    if (ttsProvider instanceof MockTTSProvider && mockTtsSpeed) {
      console.log(`⚡ Setting Mock TTS speed to ${mockTtsSpeed}`);
      ttsProvider.speed = Number(mockTtsSpeed);
    }

    const jobId = `job-${Date.now()}`;

    // 초기 상태 저장
    jobStore.set(jobId, {
      status: 'processing',
      updatedAt: Date.now(),
    });

    // 비동기로 실행
    (async () => {
      try {
        console.log(`🚀 Starting background render job: ${jobId}`);
        let finalVideoPath: string;

        if (manifest) {
          // Phase 21: Manifest 기반 렌더링
          console.log('  Using Render Manifest...');
          finalVideoPath = await orchestrator.renderWithManifest(
            manifest,
            OUTPUT_DIR,
            { titleFont },
          );
        } else {
          // 기존 렌더링
          finalVideoPath = await orchestrator.generateStoryFromAssets(
            topic,
            script,
            assetUrls,
            OUTPUT_DIR,
            {
              titleFont,
              subtitleFont,
              bgmFile,
              editorSegments: segments, // 전달
            },
          );
        }

        const relativePath = path.relative(
          path.join(process.cwd(), 'output'),
          finalVideoPath,
        );
        const resultUrl = `/output/${relativePath}`;

        console.log(`✅ Job ${jobId} finished. URL: ${resultUrl}`);

        jobStore.set(jobId, {
          status: 'completed',
          resultPath: finalVideoPath,
          resultUrl: resultUrl,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.error(`❌ Job ${jobId} failed:`, err);
        jobStore.set(jobId, {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          updatedAt: Date.now(),
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

// 4.5. TTS 미리보기 (Preview TTS)
router.post('/preview/tts', async (req, res) => {
  try {
    const { text, character = 'narrator', speed = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // MockTTSProvider의 경우 속도 설정
    if (ttsProvider instanceof MockTTSProvider) {
      ttsProvider.speed = Number(speed);
    }

    const audioPath = await ttsProvider.generateAudio(text, character);

    // Duration 측정
    const duration = await getAudioDuration(audioPath);

    // URL 변환 (로컬 파일 경로 -> 웹 URL)
    const relativePath = path.relative(
      path.join(process.cwd(), 'output'),
      audioPath,
    );
    const audioUrl = `/output/${relativePath}`;

    res.json({
      audioUrl,
      duration,
    });
  } catch (error) {
    console.error('Error generating preview TTS:', error);
    res.status(500).json({ error: 'Failed to generate preview TTS' });
  }
});

// 4.6 렌더링 매니페스트 생성 (Render Manifest)
router.post('/render-manifest', (req, res) => {
  try {
    const { script, editorSegments } = req.body;

    if (!script || !editorSegments) {
      return res
        .status(400)
        .json({ error: 'Script and editorSegments are required' });
    }

    const manifest = layoutEngine.generateManifest(script, editorSegments);
    res.json(manifest);
  } catch (error) {
    console.error('Error generating render manifest:', error);
    res.status(500).json({ error: 'Failed to generate render manifest' });
  }
});

// 5. 서버 설정 상태 조회 (Config Check)
router.get('/config', (req, res) => {
  res.json({
    gemini: !!process.env.GEMINI_API_KEY,
    pexels: !!process.env.PEXELS_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    google:
      !!process.env.GOOGLE_SEARCH_API_KEY && !!process.env.GOOGLE_SEARCH_CX,
    klipy: !!process.env.KLIPY_API_KEY,
    typecast: !!process.env.TYPECAST_API_KEY,
    imgflip: !!process.env.IMGFLIP_USERNAME && !!process.env.IMGFLIP_PASSWORD,
  });
});

export default router;
