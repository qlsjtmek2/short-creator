import { GoogleGenerativeAI } from '@google/generative-ai';
import { StoryScript } from '../../types/common';
import { IStoryGenerator } from '../../types/interfaces';
import * as dotenv from 'dotenv';
import { getStoryPrompts } from '../../config/prompts.config';

dotenv.config();

export class GeminiStoryGenerator implements IStoryGenerator {
  private genAI: GoogleGenerativeAI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any;
  private promptConfig = getStoryPrompts();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateStory(topic: string): Promise<StoryScript> {
    // JSON에서 로드한 프롬프트 템플릿 사용
    const prompt = this.promptConfig.userPromptTemplate
      .replace('{topic}', topic)
      .replace('{titleMaxLength}', this.promptConfig.titleMaxLength.toString())
      .replace('{sentenceCount}', this.promptConfig.sentenceCount)
      .replace(
        '{sentenceMaxLength}',
        this.promptConfig.sentenceMaxLength.toString(),
      );

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
