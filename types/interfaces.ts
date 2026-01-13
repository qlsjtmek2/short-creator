import {
  WouldYouRatherQuestion,
  StoryScript,
  StoryScriptWithAssets,
  SubtitleEvent,
} from './common';

/**
 * Phase 5: 질문 생성 모듈 인터페이스
 * ChatGPT API를 사용하여 질문을 생성합니다.
 */
export interface IQuestionGenerator {
  generateQuestions(count: number): Promise<WouldYouRatherQuestion[]>;
}

/**
 * Phase 7: 이미지 제공 모듈 인터페이스
 * Pexels API 등을 사용하여 키워드 기반 이미지를 다운로드합니다.
 */
export interface IImageProvider {
  /**
   * 키워드로 이미지를 검색하고 로컬에 저장한 뒤 파일 경로를 반환합니다.
   * @param keyword 검색할 이미지 키워드
   */
  downloadImage(keyword: string): Promise<string>;
}

/**
 * Phase 6: TTS 모듈 인터페이스
 * 타입캐스트 등의 API를 사용하여 텍스트를 음성으로 변환합니다.
 */
export interface ITTSProvider {
  /**
   * 텍스트를 음성으로 변환하여 로컬에 저장한 뒤 파일 경로를 반환합니다.
   * @param text 변환할 텍스트
   * @param character 캐릭터 이름 또는 ID
   */
  generateAudio(text: string, character: string): Promise<string>;
}

/**
 * Phase 8: 프레임 생성 모듈 인터페이스
 * Canvas를 사용하여 영상의 각 프레임(이미지)을 생성합니다.
 */
export interface IFrameComposer {
  /**
   * 질문과 이미지를 조합하여 영상에 사용할 배경 프레임을 생성합니다.
   * @param question 선택지 텍스트가 포함된 질문 객체
   * @param imageAPath 빨강 배경(왼쪽/위)에 들어갈 이미지 경로
   * @param imageBPath 파랑 배경(오른쪽/아래)에 들어갈 이미지 경로
   */
  composeFrame(
    question: WouldYouRatherQuestion,
    imageAPath: string,
    imageBPath: string,
  ): Promise<string>;
}

/**
 * Phase 9: 영상 렌더링 모듈 인터페이스
 * FFmpeg를 사용하여 최종 영상을 생성합니다.
 */
export interface IVideoRenderer {
  /**
   * 준비된 에셋들을 합성하여 최종 MP4 파일을 생성합니다.
   * @param framePath IFrameComposer가 생성한 프레임 이미지 경로
   * @param audioPath ITTSProvider가 생성한 오디오 파일 경로
   * @param outputPath 최종 저장될 비디오 경로
   */
  renderVideo(
    framePath: string,
    audioPath: string,
    outputPath: string,
  ): Promise<string>;
}

/**
 * Phase 15: 스토리 생성 모듈 인터페이스
 * Google Gemini API를 사용하여 스토리텔링 대본을 생성합니다.
 */
export interface IStoryGenerator {
  generateStory(topic: string): Promise<StoryScript>;
}

/**
 * Phase 15: 자막 생성 모듈 인터페이스
 * ASS 자막 파일을 생성합니다.
 */
export interface ISubtitleGenerator {
  generateASS(events: SubtitleEvent[], outputPath: string): Promise<string>;
}

/**
 * Phase 15: 스토리 영상 렌더링 모듈 인터페이스
 * FFmpeg를 사용하여 스토리텔링 쇼츠를 생성합니다.
 */
export interface IStoryVideoRenderer {
  render(
    script: StoryScriptWithAssets,
    subtitlePath: string,
    outputPath: string,
    bgmPath?: string,
  ): Promise<string>;
}
