export interface WouldYouRatherQuestion {
  id: string;
  optionA: string;
  optionB: string;
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
