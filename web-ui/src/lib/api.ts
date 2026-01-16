import axios from 'axios';
import { ScriptSegment, JobStatus, EditorSegment } from '../types';

// localhost 대신 127.0.0.1 사용 (Node.js 버전 간 IPv4/IPv6 충돌 방지)
const API_BASE_URL = 'http://127.0.0.1:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});
// ... (중략) ...
export const renderVideo = async (
  topic: string,
  script: ScriptSegment[],
  assetUrls: string[],
  options?: {
    mockTtsSpeed?: number;
    titleFont?: string;
    subtitleFont?: string;
    bgmFile?: string;
    segments?: EditorSegment[]; // New: Detailed segments from Editor
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

export const previewTTS = async (
  text: string,
  character?: string,
  speed?: number,
): Promise<{ audioUrl: string; duration: number }> => {
  const response = await api.post('/preview/tts', { text, character, speed });
  return response.data;
};
