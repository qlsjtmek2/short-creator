import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { IQuestionGenerator } from '../../types/interfaces';
import { WouldYouRatherQuestion } from '../../types/common';
import { v4 as uuidv4 } from 'uuid';
import { getWYRPrompts, getGeminiConfig } from '../../config/prompts.config';

export class GeminiQuestionGenerator implements IQuestionGenerator {
  private genAI: GoogleGenerativeAI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any;
  private promptConfig = getWYRPrompts();
  private geminiConfig = getGeminiConfig();

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    const generationConfig: GenerationConfig = {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    };

    this.model = this.genAI.getGenerativeModel({
      model: this.geminiConfig.modelName,
      generationConfig,
    });
  }

  async generateQuestions(count: number): Promise<WouldYouRatherQuestion[]> {
    // JSON에서 로드한 프롬프트 템플릿 사용
    const prompt = this.promptConfig.userPromptTemplate.replace(
      '{count}',
      count.toString(),
    );

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const parsedData = JSON.parse(text);

      if (!Array.isArray(parsedData)) {
        throw new Error('Invalid response format: expected an array');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parsedData.map((item: any) => ({
        id: uuidv4(),
        optionA: item.optionA,
        optionB: item.optionB,
        optionAKeyword: item.optionAKeyword || 'people',
        optionBKeyword: item.optionBKeyword || 'people',
      }));
    } catch (error) {
      console.error('Failed to generate questions via Gemini:', error);
      throw error;
    }
  }
}
