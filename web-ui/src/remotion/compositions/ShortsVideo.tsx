import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import { ShortsComposition, ImageLayer, TextLayer } from '../types/schema';

// Helper component for Ken Burns Effect
const KenBurnsImage: React.FC<{ layer: ImageLayer }> = ({ layer }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // 상대적 프레임 (Sequence 내부이므로 0부터 시작)
  const relativeFrame = frame; 

  const kb = layer.kenBurns || {
    fromScale: 1, toScale: 1, fromX: 0, toX: 0, fromY: 0, toY: 0
  };

  const scale = interpolate(
    relativeFrame,
    [0, layer.durationInFrames],
    [kb.fromScale, kb.toScale],
    { easing: Easing.linear, extrapolateRight: 'clamp' }
  );

  const x = interpolate(
    relativeFrame,
    [0, layer.durationInFrames],
    [kb.fromX, kb.toX],
    { easing: Easing.linear }
  );

  const y = interpolate(
    relativeFrame,
    [0, layer.durationInFrames],
    [kb.fromY, kb.toY],
    { easing: Easing.linear }
  );

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      transform: `scale(${layer.transform.scale}) rotate(${layer.transform.rotate}deg)`,
      opacity: layer.transform.opacity,
    }}>
      <Img
        src={layer.src}
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

// Helper component for Text
const AnimatedText: React.FC<{ layer: TextLayer }> = ({ layer }) => {
  return (
    <div style={{
      position: 'absolute',
      left: layer.transform.x,
      top: layer.transform.y,
      width: '100%', // 또는 layer.width
      textAlign: layer.style.textAlign,
      fontFamily: layer.style.fontFamily,
      fontSize: layer.style.fontSize,
      color: layer.style.color,
      transform: `scale(${layer.transform.scale}) rotate(${layer.transform.rotate}deg)`,
      opacity: layer.transform.opacity,
      textShadow: layer.style.strokeWidth > 0 
        ? `-1px -1px 0 ${layer.style.strokeColor}, 1px -1px 0 ${layer.style.strokeColor}, -1px 1px 0 ${layer.style.strokeColor}, 1px 1px 0 ${layer.style.strokeColor}`
        : 'none',
      whiteSpace: 'pre-wrap',
    }}>
      {layer.text}
    </div>
  );
};

export const ShortsVideo: React.FC<ShortsComposition> = ({ layers }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {layers.map((layer) => {
        if (layer.type === 'image') {
          return (
            <Sequence
              key={layer.id}
              from={layer.startFrame}
              durationInFrames={layer.durationInFrames}
            >
              <KenBurnsImage layer={layer} />
            </Sequence>
          );
        }
        if (layer.type === 'text') {
          return (
            <Sequence
              key={layer.id}
              from={layer.startFrame}
              durationInFrames={layer.durationInFrames}
            >
              <AnimatedText layer={layer} />
            </Sequence>
          );
        }
        if (layer.type === 'audio') {
          return (
            <Sequence
              key={layer.id}
              from={layer.startFrame}
              durationInFrames={layer.durationInFrames}
            >
              <Audio src={layer.src} volume={layer.volume} />
            </Sequence>
          );
        }
        return null;
      })}
    </AbsoluteFill>
  );
};
