export interface WouldYouRatherQuestion {
  id: string;
  optionA: string;
  optionB: string;
  optionAKeyword: string;
  optionBKeyword: string;
}

export interface GeneratedAsset {
  type: 'image' | 'audio' | 'video';
  path: string;
}

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
}

export interface StorySentence {
  text: string;
  keyword: string;
  duration?: number;
  audioPath?: string;
  imagePath?: string;
  startTime?: number; // 영상 내 시작 시간 (초)
  endTime?: number; // 영상 내 종료 시간 (초)
}

export interface StoryScript {
  title: string;
  sentences: StorySentence[];
}

export interface StoryScriptWithAssets extends StoryScript {
  sentences: StorySentence[]; // 모든 필드가 채워진 상태
  totalDuration: number; // 전체 영상 길이 (초)
}

export interface SubtitleEvent {
  start: number; // 시작 시간 (초)
  end: number; // 종료 시간 (초)
  text: string; // 자막 텍스트
}
