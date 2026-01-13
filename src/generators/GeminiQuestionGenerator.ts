import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { IQuestionGenerator } from '../../types/interfaces';
import { WouldYouRatherQuestion } from '../../types/common';
import { v4 as uuidv4 } from 'uuid';

export class GeminiQuestionGenerator implements IQuestionGenerator {
  private genAI: GoogleGenerativeAI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any;

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
      model: 'gemini-2.5-flash',
      generationConfig,
    });
  }

  async generateQuestions(count: number): Promise<WouldYouRatherQuestion[]> {
    const prompt = `
      한국의 20-30대 사이에서 유행할 만한 재미있고 논쟁적인 'Would You Rather'(밸런스 게임) 질문을 ${count}개 생성해줘.
      
      조건:
      1. 한국어로 작성할 것.
      2. 일상적이고 공감 가능한 주제(연애, 직장, 음식, 생활 습관 등)를 다룰 것.
      3. 두 선택지가 모두 장단점이 확실하여 선택하기 어려워야 함.
      4. 불쾌하거나 민감한 정치적/종교적 주제는 제외할 것.
      
      응답 형식:
      다음 구조의 JSON 배열로 응답해줘. id는 생성하지 말고 텍스트 내용만 채워줘.
      optionAKeyword와 optionBKeyword는 각 옵션에 어울리는 '이미지 검색용 영어 키워드'를 짧게(1~2단어) 작성해줘.
      [
        {
          "optionA": "선택지 A 내용",
          "optionB": "선택지 B 내용",
          "optionAKeyword": "English keyword for A",
          "optionBKeyword": "English keyword for B"
        }
      ]
    `;

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
