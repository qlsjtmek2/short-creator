import { z } from 'zod';

// 기본 변환 속성 (위치, 크기, 회전, 투명도)
export const TransformSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  scale: z.number().default(1),
  rotate: z.number().default(0),
  opacity: z.number().default(1),
});

// Ken Burns 효과 설정
export const KenBurnsSchema = z.object({
  fromScale: z.number().default(1.0),
  toScale: z.number().default(1.2),
  fromX: z.number().default(0),
  toX: z.number().default(0),
  fromY: z.number().default(0),
  toY: z.number().default(0),
});

// 이미지 레이어
export const ImageLayerSchema = z.object({
  id: z.string(),
  type: z.literal('image'),
  src: z.string(),
  startFrame: z.number(),
  durationInFrames: z.number(),
  transform: TransformSchema,
  kenBurns: KenBurnsSchema.optional(),
});

// 자막(텍스트) 레이어
export const TextLayerSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  text: z.string(),
  startFrame: z.number(),
  durationInFrames: z.number(),
  style: z.object({
    fontFamily: z.string().default('Pretendard-Bold'),
    fontSize: z.number().default(60),
    color: z.string().default('white'),
    textAlign: z.enum(['left', 'center', 'right']).default('center'),
    strokeColor: z.string().default('black'),
    strokeWidth: z.number().default(0),
  }),
  transform: TransformSchema,
});

// 오디오 레이어 (TTS, SFX, BGM)
export const AudioLayerSchema = z.object({
  id: z.string(),
  type: z.literal('audio'),
  src: z.string(),
  startFrame: z.number(),
  durationInFrames: z.number().optional(), // 생략 시 파일 전체 길이
  volume: z.number().default(1.0),
});

// 전체 비디오 Composition 스키마
export const ShortsCompositionSchema = z.object({
  width: z.number().default(1080),
  height: z.number().default(1920),
  fps: z.number().default(30),
  durationInFrames: z.number(),
  title: z.string().default(''), // Added
  layers: z.array(z.discriminatedUnion('type', [
    ImageLayerSchema,
    TextLayerSchema,
    AudioLayerSchema,
  ])),
});

export type Transform = z.infer<typeof TransformSchema>;
export type KenBurns = z.infer<typeof KenBurnsSchema>;
export type ImageLayer = z.infer<typeof ImageLayerSchema>;
export type TextLayer = z.infer<typeof TextLayerSchema>;
export type AudioLayer = z.infer<typeof AudioLayerSchema>;
export type ShortsComposition = z.infer<typeof ShortsCompositionSchema>;
export type VideoLayer = ImageLayer | TextLayer | AudioLayer;

// --- Manifest Schema (SSOT Phase 21) ---

export const ManifestImageElementSchema = z.object({
  type: z.literal('image'),
  id: z.string(),
  src: z.string(),
  startFrame: z.number(),
  endFrame: z.number(),
  vfx: z.string().optional(),
  kenBurns: KenBurnsSchema,
});

export const ManifestTitleSegmentSchema = z.object({
  text: z.string(),
  isHighlight: z.boolean(),
  x: z.number(),
  width: z.number(),
});

export const ManifestTitleLineSchema = z.object({
  segments: z.array(ManifestTitleSegmentSchema),
  y: z.number(),
  totalWidth: z.number(),
});

export const ManifestTitleElementSchema = z.object({
  type: z.literal('title_text'),
  id: z.string(),
  lines: z.array(ManifestTitleLineSchema),
});

export const ManifestSubtitleChunkSchema = z.object({
  type: z.literal('subtitle_chunk'),
  id: z.string(),
  text: z.string(),
  startFrame: z.number(),
  endFrame: z.number(),
});

export const ManifestAudioElementSchema = z.object({
  type: z.literal('audio'),
  id: z.string(),
  src: z.string(),
  startFrame: z.number(),
  endFrame: z.number(),
  volume: z.number(),
});

export const RenderManifestSchema = z.object({
  version: z.string(),
  canvas: z.object({
    width: z.number(),
    height: z.number(),
  }),
  elements: z.array(z.discriminatedUnion('type', [
    ManifestImageElementSchema,
    ManifestTitleElementSchema,
    ManifestSubtitleChunkSchema,
    ManifestAudioElementSchema,
  ])),
  metadata: z.object({
    totalFrames: z.number(),
    fps: z.number(),
    title: z.string(),
  }),
});

export type RenderManifest = z.infer<typeof RenderManifestSchema>;
