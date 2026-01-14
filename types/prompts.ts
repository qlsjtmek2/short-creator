/**
 * AI 프롬프트 설정 타입 정의
 */

export interface WouldYouRatherPromptConfig {
  /** 시스템 프롬프트 (AI의 역할 정의) */
  systemPrompt: string;
  /** 사용자 프롬프트 템플릿 ({count}는 질문 개수로 치환됨) */
  userPromptTemplate: string;
  /** 질문 생성 조건 목록 */
  conditions: string[];
  /** 타겟 오디언스 */
  targetAudience: string;
  /** 톤 앤 매너 */
  tone: string;
}

export interface StorytellingPromptConfig {
  /** 시스템 프롬프트 (AI의 역할 정의) */
  systemPrompt: string;
  /** 사용자 프롬프트 템플릿 ({topic}, {titleMaxLength}, {sentenceCount}, {sentenceMaxLength}가 치환됨) */
  userPromptTemplate: string;
  /** 대본 작성 조건 목록 */
  conditions: string[];
  /** 제목 최대 길이 (자) */
  titleMaxLength: number;
  /** 문장 개수 (범위 문자열, 예: "5~7") */
  sentenceCount: string;
  /** 문장 최대 길이 (자) */
  sentenceMaxLength: number;
  /** 톤 앤 매너 */
  tone: string;
}

export interface GeminiConfig {
  /** Gemini 모델 이름 */
  modelName: string;
}

export interface PromptsConfig {
  /** Would You Rather 프롬프트 설정 */
  wouldYouRather: WouldYouRatherPromptConfig;
  /** 스토리텔링 프롬프트 설정 */
  storytelling: StorytellingPromptConfig;
  /** Gemini 관련 설정 */
  geminiConfig: GeminiConfig;
}
