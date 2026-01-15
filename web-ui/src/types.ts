export interface ScriptSegment {
  text: string;
  imageKeyword: string;
}

export interface AssetGroup {
  keyword: string;
  images: string[];
  selectedImage?: string;
}

export interface JobStatus {
  status: 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
}
