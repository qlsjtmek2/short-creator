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

// Manifest Types (Phase 21)
export interface ManifestElement {
  id: string;
  type: 'image' | 'title_text' | 'subtitle_chunk' | 'audio';
  startFrame: number;
  endFrame: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow other props for now or define strictly
}

export interface RenderManifest {
  version: string;
  canvas: {
    width: number;
    height: number;
  };
  elements: ManifestElement[];
  metadata: {
    totalFrames: number;
    fps: number;
    title: string;
  };
}
