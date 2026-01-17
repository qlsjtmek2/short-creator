import { EditorSegment as SharedEditorSegment } from './types/interfaces';
import { RenderManifest as SharedRenderManifest } from './types/rendering';

export interface ScriptSegment {
  text: string;
  imageKeyword: string;
}

export interface AssetGroup {
  keyword: string;
  images: string[];
  selectedImage?: string;
}

export type EditorSegment = SharedEditorSegment;

export interface JobStatus {
  status: 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
}

export type RenderManifest = SharedRenderManifest;