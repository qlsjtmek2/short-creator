export interface LayoutElement {
  type: 'image' | 'title_text' | 'subtitle_chunk' | 'audio';
  id: string;
}

export interface ImageElement extends LayoutElement {
  type: 'image';
  src: string;
  startFrame: number;
  endFrame: number;
  vfx: string;
  kenBurns: {
    fromScale: number;
    toScale: number;
    fromX: number;
    toX: number;
    fromY: number;
    toY: number;
  };
}

export interface TitleSegment {
  text: string;
  isHighlight: boolean;
  x: number;
  width: number;
}

export interface TitleLine {
  segments: TitleSegment[];
  y: number;
  totalWidth: number;
}

export interface TitleElement extends LayoutElement {
  type: 'title_text';
  lines: TitleLine[];
}

export interface SubtitleChunk extends LayoutElement {
  type: 'subtitle_chunk';
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface AudioElement extends LayoutElement {
  type: 'audio';
  src: string;
  startFrame: number;
  endFrame: number;
  volume: number;
}

export interface RenderManifest {
  version: string;
  canvas: {
    width: number;
    height: number;
  };
  elements: (ImageElement | TitleElement | SubtitleChunk | AudioElement)[];
  metadata: {
    totalFrames: number;
    fps: number;
    title: string;
  };
}
