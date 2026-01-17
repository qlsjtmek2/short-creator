import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import {
  RenderManifest,
  ManifestImageElementSchema,
  ManifestTitleElementSchema,
  ManifestSubtitleChunkSchema,
  ManifestAudioElementSchema,
} from '../types/schema';
import { z } from 'zod';
import { RENDER_CONFIG } from '@/config/render-config';

type ManifestImageElement = z.infer<typeof ManifestImageElementSchema>;
type ManifestTitleElement = z.infer<typeof ManifestTitleElementSchema>;
type ManifestSubtitleChunk = z.infer<typeof ManifestSubtitleChunkSchema>;
type ManifestAudioElement = z.infer<typeof ManifestAudioElementSchema>;

const KenBurnsImage: React.FC<{ element: ManifestImageElement }> = ({
  element,
}) => {
  const frame = useCurrentFrame();
  const duration = element.endFrame - element.startFrame;
  const kb = element.kenBurns;

  const scale = interpolate(frame, [0, duration], [kb.fromScale, kb.toScale], {
    easing: Easing.linear,
    extrapolateRight: 'clamp',
  });

  const x = interpolate(frame, [0, duration], [kb.fromX, kb.toX], {
    easing: Easing.linear,
  });

  const y = interpolate(frame, [0, duration], [kb.fromY, kb.toY], {
    easing: Easing.linear,
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Img
        src={element.src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
        }}
      />
    </div>
  );
};

export const ShortsVideoManifest: React.FC<RenderManifest> = ({ elements }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* 1. Images */}
      <AbsoluteFill
        style={{
          top: RENDER_CONFIG.letterbox.top,
          bottom: RENDER_CONFIG.letterbox.bottom,
          overflow: 'hidden',
        }}
      >
        {elements
          .filter((e): e is ManifestImageElement => e.type === 'image')
          .map((element) => (
            <Sequence
              key={element.id}
              from={element.startFrame}
              durationInFrames={element.endFrame - element.startFrame}
            >
              <KenBurnsImage element={element} />
            </Sequence>
          ))}
      </AbsoluteFill>

      {/* 2. Audio */}
      {elements
        .filter((e): e is ManifestAudioElement => e.type === 'audio')
        .map((element) => (
          <Sequence
            key={element.id}
            from={element.startFrame}
            durationInFrames={element.endFrame - element.startFrame}
          >
            <Audio src={element.src} volume={element.volume} />
          </Sequence>
        ))}

      {/* 3. Letterboxes */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: RENDER_CONFIG.letterbox.top,
          backgroundColor: RENDER_CONFIG.letterbox.color,
          zIndex: 10,
        }}
      >
        {/* Title (Pre-calculated layout) */}
        {elements
          .filter((e): e is ManifestTitleElement => e.type === 'title_text')
          .map((element) => (
            <React.Fragment key={element.id}>
              {element.lines.map((line, lineIndex) => (
                <React.Fragment key={lineIndex}>
                  {line.segments.map((seg, segIndex) => (
                    <div
                      key={`${lineIndex}-${segIndex}`}
                      style={{
                        position: 'absolute',
                        left: seg.x,
                        top: line.y,
                        width: seg.width, // Optional, for debug
                        fontFamily: RENDER_CONFIG.title.fontFamily,
                        fontSize: RENDER_CONFIG.title.fontSize,
                        color: seg.isHighlight
                          ? RENDER_CONFIG.title.highlightColor
                          : RENDER_CONFIG.title.fontColor,
                        WebkitTextStroke: `${RENDER_CONFIG.title.borderWidth}px ${RENDER_CONFIG.title.borderColor}`,
                        paintOrder: 'stroke fill',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {seg.text}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: RENDER_CONFIG.letterbox.bottom,
          backgroundColor: RENDER_CONFIG.letterbox.color,
          zIndex: 10,
        }}
      >
        {/* Subtitles (Chunks) */}
        {elements
          .filter(
            (e): e is ManifestSubtitleChunk => e.type === 'subtitle_chunk',
          )
          .map((element) => {
            const duration = element.endFrame - element.startFrame;
            return (
              <Sequence
                key={element.id}
                from={element.startFrame}
                durationInFrames={duration}
              >
                <SubtitleChunkView text={element.text} fps={fps} />
              </Sequence>
            );
          })}
      </div>
    </AbsoluteFill>
  );
};

const SubtitleChunkView: React.FC<{
  text: string;
  fps: number;
}> = ({ text, fps }) => {
  const frame = useCurrentFrame();

  const popScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.5 },
    from: 0.8,
    to: 1,
  });

  const opacity = interpolate(frame, [0, 3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: RENDER_CONFIG.subtitle.y, // 고정된 y 좌표 사용
        textAlign: 'center',
        fontFamily: RENDER_CONFIG.subtitle.fontFamily || 'Pretendard-Bold',
        fontSize: RENDER_CONFIG.subtitle.fontSize,
        color: 'white',
        whiteSpace: 'pre-wrap',
        textShadow: `
        -2px -2px 0 black, 
         2px -2px 0 black, 
        -2px  2px 0 black, 
         2px  2px 0 black
      `,
        transform: `scale(${popScale})`,
        opacity,
      }}
    >
      {text}
    </div>
  );
};
