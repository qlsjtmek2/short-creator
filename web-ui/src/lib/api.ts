import axios from 'axios';
import { ScriptSegment, JobStatus } from '../types';

// localhost 대신 127.0.0.1 사용 (Node.js 버전 간 IPv4/IPv6 충돌 방지)
const API_BASE_URL = 'http://127.0.0.1:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface DraftResponse {
  topic: string;
  script: ScriptSegment[];
}

export interface StoryGenerationOptions {
  modelName?: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  titleMaxLength?: number;
  sentenceCount?: number;
  sentenceMaxLength?: number;
  tone?: string;
  temperature?: number;
}

export const generateDraft = async (
  topic: string,
  options?: StoryGenerationOptions,
): Promise<DraftResponse> => {
  const response = await api.post('/draft', { topic, options });
  return response.data;
};

export const searchAssets = async (
  keywords: string[],
  provider: string = 'pexels',
) => {
  const response = await api.post('/assets', { keywords, provider });
  return response.data;
};

export const renderVideo = async (
  topic: string,
  script: ScriptSegment[],
  assetUrls: string[],
  options?: {
    mockTtsSpeed?: number;
    titleFont?: string;
    subtitleFont?: string;
    bgmFile?: string;
  },
) => {
  const response = await api.post('/render', {
    topic,
    script,
    assetUrls,
    ...options,
  });
  return response.data;
};

export const checkJobStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await api.get(`/status/${jobId}`);
  return response.data;
};

export const checkServerConfig = async () => {
  const response = await api.get('/config');
  return response.data as Record<string, boolean>;
};

export const fetchRecommendedTopics = async (): Promise<
  { category: string; text: string }[]
> => {
  const response = await api.get('/recommend');
  return response.data.topics;
};
