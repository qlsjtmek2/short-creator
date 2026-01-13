import { GoogleGenerativeAI } from '@google/generative-ai';
import { StoryScript } from '../../types/common';
import { IStoryGenerator } from '../../types/interfaces';
import * as dotenv from 'dotenv';

dotenv.config();

export class GeminiStoryGenerator implements IStoryGenerator {
  private genAI: GoogleGenerativeAI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateStory(topic: string): Promise<StoryScript> {
    const prompt = `
      "${topic}"에 대한 흥미로운 지식이나 짧은 스토리를 숏폼 영상 대본으로 작성해줘.
      다음 조건을 반드시 지켜줘:
      1. 제목은 시청자의 호기심을 자극하도록 간결하게 작성해 (10자 이내).
      2. 대본은 5~7개의 짧은 문장으로 구성해.
      3. 각 문장은 15자 이내로 작성해 (숏폼 형식에 최적화).
      4. 각 문장마다 그 문장에 가장 잘 어울리는 이미지 검색 키워드(영문)를 하나씩 추천해줘.
      5. 결과는 반드시 다음과 같은 JSON 형식으로만 출력해:
      {
        "title": "제목",
        "sentences": [
          { "text": "문장 1", "keyword": "image search keyword in English" },
          ...
        ]
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // JSON 추출 (코드 블록 제거)
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      // 검증: title과 sentences 필드가 있는지 확인
      if (!parsed.title || !Array.isArray(parsed.sentences)) {
        throw new Error('Invalid story format: missing title or sentences');
      }

      // 검증: 각 sentence가 text와 keyword를 가지고 있는지 확인
      for (const sentence of parsed.sentences) {
        if (!sentence.text || !sentence.keyword) {
          throw new Error('Invalid sentence format: missing text or keyword');
        }
      }

      return parsed as StoryScript;
    } catch (error) {
      console.error('Failed to generate or parse story:', error);
      throw new Error(
        `Story generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
