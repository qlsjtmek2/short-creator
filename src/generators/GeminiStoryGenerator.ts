import { GoogleGenerativeAI } from '@google/generative-ai';
import { StoryScript } from '../../types/common';
import { IStoryGenerator } from '../../types/interfaces';
import * as dotenv from 'dotenv';
import { getStoryPrompts, getGeminiConfig } from '../../config/prompts.config';

dotenv.config();

export interface StoryGenerationOptions {
  modelName?: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  titleMaxLength?: number;
  tone?: string;
}

export class GeminiStoryGenerator implements IStoryGenerator {
  private genAI: GoogleGenerativeAI;
  private promptConfig = getStoryPrompts();
  private geminiConfig = getGeminiConfig();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateStory(topic: string, options?: StoryGenerationOptions): Promise<StoryScript> {
    // 1. 모델 선택 (옵션 > 설정파일 > 기본값)
    const modelName = options?.modelName || this.geminiConfig.modelName || 'gemini-pro';
    const model = this.genAI.getGenerativeModel({ model: modelName });

    console.log(`🤖 Using Gemini Model: ${modelName}`);

    // 2. 프롬프트 구성
    const titleMaxLength = options?.titleMaxLength || this.promptConfig.titleMaxLength;
    const tone = options?.tone || 'humorous';
    
    // 톤에 따른 지시사항 추가
    let toneInstruction = "";
    if (tone === 'humorous') toneInstruction = "유머러스하고 재치 있는 톤으로 작성해줘. 인터넷 밈이나 드립을 적절히 섞어도 좋아.";
    else if (tone === 'serious') toneInstruction = "진지하고 정보 전달에 집중하는 다큐멘터리 톤으로 작성해줘.";
    else if (tone === 'horror') toneInstruction = "무섭고 기괴한 분위기를 풍기는 공포 미스터리 톤으로 작성해줘.";
    else if (tone === 'emotional') toneInstruction = "따뜻하고 감동적인 힐링 톤으로 작성해줘.";

    // 템플릿 선택 (옵션 > 설정파일)
    let promptTemplate = options?.userPromptTemplate || this.promptConfig.userPromptTemplate;
    
    // 템플릿이 비어있으면 기본값 복구
    if (!promptTemplate) {
        promptTemplate = `주제: {topic}

위 주제로 쇼츠 영상을 만들기 위한 대본을 작성해줘.
다음 JSON 형식으로 출력해줘:
{
  "title": "영상 제목 (최대 {titleMaxLength}자)",
  "sentences": [
    { "text": "첫 번째 문장 내레이션", "keyword": "image search keyword (English)" },
    { "text": "두 번째 문장 내레이션", "keyword": "image search keyword (English)" },
    ...
  ]
}

조건:
1. 총 {sentenceCount}개의 문장으로 구성해줘.
2. 각 문장은 {sentenceMaxLength}자 이내로 짧게 작성해.
3. {toneInstruction}
4. 키워드는 반드시 영어 단어로 작성해줘 (이미지 검색용).
`;
    }

    const prompt = promptTemplate
      .replace('{topic}', topic)
      .replace('{titleMaxLength}', titleMaxLength.toString())
      .replace('{sentenceCount}', this.promptConfig.sentenceCount)
      .replace('{sentenceMaxLength}', this.promptConfig.sentenceMaxLength.toString())
      .replace('{toneInstruction}', toneInstruction);

    // 시스템 프롬프트가 있다면 적용 (Gemini는 systemInstruction 옵션 지원)
    // 하지만 현재 GoogleGenerativeAI 라이브러리 버전에 따라 지원 방식이 다를 수 있음.
    // 안전하게 유저 프롬프트 앞단에 붙이는 방식 사용.
    const fullPrompt = options?.systemPrompt 
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt;

    try {
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // JSON 추출
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (!parsed.title || !Array.isArray(parsed.sentences)) {
        throw new Error('Invalid story format: missing title or sentences');
      }

      return parsed as StoryScript;
    } catch (error) {
      console.error('Failed to generate story:', error);
      throw new Error(
        `Story generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}