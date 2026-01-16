import React, { useMemo } from 'react';
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
import { ShortsComposition, ImageLayer, TextLayer } from '../types/schema';
import { 
  autoHighlightKeywords, 
  splitIntoLines, 
  parseTitle, 
  splitSentenceIntoChunks,
  FFMPEG_CONFIG 
} from '../utils/ffmpeg-simulator';

const { letterbox, title: titleConfig } = FFMPEG_CONFIG;

// --- Helper Components ---

const KenBurnsImage: React.FC<{ layer: ImageLayer }> = ({ layer }) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame; 

  const kb = layer.kenBurns || { fromScale: 1, toScale: 1, fromX: 0, toX: 0, fromY: 0, toY: 0 };

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

const AnimatedSubtitle: React.FC<{ layer: TextLayer }> = ({ layer }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // 1. 문장을 청크로 분할
  const chunks = useMemo(() => splitSentenceIntoChunks(layer.text), [layer.text]);
  
  // 2. 현재 시간에 해당하는 청크 찾기
  // frame은 Sequence 내부의 상대 시간이므로 0부터 시작
  const currentRatio = frame / layer.durationInFrames;
  
  // 약간의 오차 허용을 위해 find
  const currentChunk = chunks.find(
    c => currentRatio >= c.startRatio && currentRatio < c.endRatio
  );

  // 청크가 없으면(오차 등으로) 마지막 청크 보여주거나 숨김
  // 여기서는 부드러운 전환을 위해 null 처리
  if (!currentChunk) return null;

  // 3. Pop Animation (청크 시작 시점 기준)
  // 해당 청크의 시작 프레임 계산
  const chunkStartFrame = currentChunk.startRatio * layer.durationInFrames;
  const relativeFrameInChunk = frame - chunkStartFrame;
  
  const popScale = spring({
    frame: relativeFrameInChunk,
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.5 },
    from: 0.8,
    to: 1,
  });

  const opacity = interpolate(relativeFrameInChunk, [0, 3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: letterbox.bottom / 2 - 20, 
      textAlign: 'center',
      fontFamily: layer.style.fontFamily,
      fontSize: layer.style.fontSize,
      color: layer.style.color,
      whiteSpace: 'pre-wrap',
      textShadow: `
        -2px -2px 0 ${layer.style.strokeColor}, 
         2px -2px 0 ${layer.style.strokeColor}, 
        -2px  2px 0 ${layer.style.strokeColor}, 
         2px  2px 0 ${layer.style.strokeColor}
      `,
      transform: `scale(${popScale})`,
      opacity,
    }}>
      {currentChunk.text}
    </div>
  );
};

// --- Main Composition ---

export const ShortsVideo: React.FC<ShortsComposition> = ({ layers, title }) => {
  // Title Parsing
  const titleLines = useMemo(() => {
    if (!title) return [];
    const markedTitle = autoHighlightKeywords(title);
    return splitIntoLines(markedTitle, titleConfig.maxCharsPerLine);
  }, [title]);

  const baseY = titleLines.length > 1 
    ? titleConfig.y - titleConfig.lineSpacing / 2 
    : titleConfig.y;

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      
      {/* 1. Video Content (Middle Area) */}
      <AbsoluteFill style={{ 
        top: letterbox.top, 
        bottom: letterbox.bottom,
        overflow: 'hidden' 
      }}>
        {layers.filter(l => l.type === 'image').map((layer) => (
          <Sequence
            key={layer.id}
            from={layer.startFrame}
            durationInFrames={layer.durationInFrames}
          >
            <KenBurnsImage layer={layer as ImageLayer} />
          </Sequence>
        ))}
      </AbsoluteFill>

      {/* 2. Audio Layers */}
      {layers.filter(l => l.type === 'audio').map((layer) => (
        <Sequence
          key={layer.id}
          from={layer.startFrame}
          durationInFrames={layer.durationInFrames}
        >
          <Audio 
            src={(layer as any).src} 
            volume={(layer as any).volume} 
          />
        </Sequence>
      ))}

      {/* 3. Letterboxes (Top/Bottom Overlay) */}
      {/* 상단 레터박스 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: letterbox.top,
        backgroundColor: letterbox.color, zIndex: 10
      }}>
        {/* Title Rendering */}
        {titleLines.map((line, lineIndex) => {
          const segments = parseTitle(line);
          const yPosition = baseY + lineIndex * titleConfig.lineSpacing;
          
          return (
            <div 
              key={lineIndex}
              style={{
                position: 'absolute',
                top: yPosition,
                width: '100%',
                textAlign: 'center',
                fontFamily: titleConfig.fontFamily,
                fontSize: titleConfig.fontSize,
              }}
            >
              {segments.map((seg, segIndex) => (
                <span 
                  key={segIndex}
                  style={{
                    color: seg.isHighlight ? titleConfig.highlightColor : titleConfig.fontColor,
                    WebkitTextStroke: `${titleConfig.borderWidth}px ${titleConfig.borderColor}`,
                    paintOrder: 'stroke fill',
                  }}
                >
                  {seg.text}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {/* 하단 레터박스 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: letterbox.bottom,
        backgroundColor: letterbox.color, zIndex: 10
      }}>
        {/* Subtitles */}
        {layers.filter(l => l.type === 'text').map((layer) => (
          <Sequence
            key={layer.id}
            from={layer.startFrame}
            durationInFrames={layer.durationInFrames}
          >
            <AnimatedSubtitle layer={layer as TextLayer} />
          </Sequence>
        ))}
      </div>

    </AbsoluteFill>
  );
};