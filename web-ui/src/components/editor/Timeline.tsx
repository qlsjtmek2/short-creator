import React, { useRef, useEffect } from 'react';
import { EditorSegment } from '@/types';

interface TimelineProps {
  segments: EditorSegment[];
  currentFrame: number;
  durationInFrames: number;
  fps: number;
  onSeek: (frame: number) => void;
  onSelectSegment: (id: string) => void;
  selectedSegmentId: string | null;
}

const PX_PER_SEC = 100; // 1초당 100px (확대/축소 가능하도록 state로 관리 가능)
const TRACK_HEIGHT = 80;
const HEADER_HEIGHT = 30;

export const Timeline: React.FC<TimelineProps> = ({
  segments,
  currentFrame,
  durationInFrames,
  fps,
  onSeek,
  onSelectSegment,
  selectedSegmentId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const totalWidth = (durationInFrames / fps) * PX_PER_SEC + 500; // 여유 공간

  // Auto-scroll playhead into view (Optional)
  // useEffect(() => {
  //   if (!scrollContainerRef.current) return;
  //   const playheadX = (currentFrame / fps) * PX_PER_SEC;
  //   // Logic to scroll if playhead goes out of view...
  // }, [currentFrame, fps]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
    const time = Math.max(0, x / PX_PER_SEC);
    const frame = Math.round(time * fps);
    onSeek(frame);
  };

  let accumulatedTime = 0;

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-t border-zinc-800 select-none">
      {/* Toolbar / Zoom Controls could go here */}
      
      {/* Scrollable Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar"
      >
        <div 
          style={{ width: totalWidth, height: '100%' }}
          className="relative"
        >
          {/* Ruler */}
          <div 
            className="absolute top-0 left-0 right-0 h-[30px] border-b border-zinc-700 bg-zinc-900/90 z-10 cursor-pointer"
            onClick={handleTimelineClick}
          >
            {Array.from({ length: Math.ceil(durationInFrames / fps) + 5 }).map((_, sec) => (
              <div 
                key={sec} 
                className="absolute top-0 bottom-0 border-l border-zinc-700/50 text-[10px] text-zinc-500 pl-1 pt-1"
                style={{ left: sec * PX_PER_SEC }}
              >
                {new Date(sec * 1000).toISOString().substr(14, 5)}
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 pointer-events-none"
            style={{ left: (currentFrame / fps) * PX_PER_SEC }}
          >
            <div className="absolute -top-1 -left-[5px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500" />
          </div>

          {/* Tracks Container */}
          <div className="pt-[30px] p-4 space-y-2">
            
            {/* Track 1: Video/Image */}
            <div className="relative h-[80px] bg-zinc-800/30 rounded-lg border border-zinc-800/50">
              <div className="absolute left-[-80px] top-0 bottom-0 w-[80px] flex items-center justify-center text-xs text-zinc-500 font-bold tracking-wider rotate-[-90deg]">
                VIDEO
              </div>
              
              {segments.map((seg) => {
                const duration = (seg.audioDuration || 3) + (seg.delay || 0);
                const width = duration * PX_PER_SEC;
                const left = accumulatedTime * PX_PER_SEC;
                
                // Update time for next segment
                const currentLeft = accumulatedTime; 
                accumulatedTime += duration;

                return (
                  <div
                    key={seg.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSegment(seg.id);
                    }}
                    className={`absolute top-1 bottom-1 rounded-md overflow-hidden border-2 cursor-pointer transition-all hover:brightness-110 group
                      ${selectedSegmentId === seg.id ? 'border-purple-500 ring-2 ring-purple-500/30 z-10' : 'border-zinc-700 bg-zinc-800'}
                    `}
                    style={{ left, width }}
                  >
                    {/* Thumbnail Background */}
                    {seg.imageUrl && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity"
                        style={{ backgroundImage: `url(${seg.imageUrl})` }}
                      />
                    )}
                    
                    {/* Content */}
                    <div className="absolute inset-0 p-2 flex flex-col justify-between">
                      <div className="text-xs font-bold text-white truncate drop-shadow-md">
                        {seg.imageKeyword}
                      </div>
                      <div className="text-[10px] text-zinc-300 truncate opacity-80">
                        {duration.toFixed(1)}s
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Track 2: Audio (TTS) - Visualized same as video for now */}
            <div className="relative h-[40px] bg-zinc-800/30 rounded-lg border border-zinc-800/50 mt-1">
               <div className="absolute left-[-80px] top-0 bottom-0 w-[80px] flex items-center justify-center text-xs text-zinc-500 font-bold tracking-wider rotate-[-90deg]">
                AUDIO
              </div>
              {(() => {
                let audioTime = 0;
                return segments.map((seg) => {
                  const duration = (seg.audioDuration || 3) + (seg.delay || 0);
                  const width = duration * PX_PER_SEC;
                  const left = audioTime * PX_PER_SEC;
                  audioTime += duration;

                  return (
                    <div
                      key={`audio-${seg.id}`}
                      className="absolute top-1 bottom-1 bg-blue-900/40 border border-blue-700/50 rounded-md"
                      style={{ left, width }}
                    >
                      {/* Waveform visualization could go here */}
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-full h-[1px] bg-blue-500/50" />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
