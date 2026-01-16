export interface ScriptSegment {
  text: string;
  imageKeyword: string;
}

export interface AssetGroup {
  keyword: string;
  images: string[];
  selectedImage?: string;
}

export interface EditorSegment {
  id: string;
  text: string;
  imageKeyword: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  delay: number;
  sfx?: string;
  vfx?: string;
}

export interface JobStatus {
  status: 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
}
