'use client';

import { useState, useEffect, useMemo } from 'react';
import { Player } from '@remotion/player';
import { RefreshCw, Wand2, Music, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { EditorSegment, AssetGroup } from '../../types';
import { previewTTS } from '@/lib/api';
import { ShortsVideo } from '../../remotion/compositions/ShortsVideo';
import { ShortsComposition, VideoLayer } from '../../remotion/types/schema';

interface Step4_EditorProps {
  topic: string;
  assets: AssetGroup[];
  script: { text: string; imageKeyword: string }[];
  onNext: (segments: EditorSegment[]) => void;
  onBack: () => void;
}

const FPS = 30;

export default function Step4_Editor({
  topic,
  assets,
  script,
  onNext,
}: Step4_EditorProps) {
  // State
  const [segments, setSegments] = useState<EditorSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Initialize Segments
  useEffect(() => {
    const initSegments = async () => {
      if (segments.length > 0) return;

      setLoading(true);
      try {
        const newSegments: EditorSegment[] = [];
        for (let i = 0; i < script.length; i++) {
          const s = script[i];
          const asset = assets.find(a => a.keyword === s.imageKeyword);
          const imageUrl = asset?.selectedImage || asset?.images[0] || '';
          
          const { audioUrl, duration } = await previewTTS(s.text);

          newSegments.push({
            id: crypto.randomUUID(),
            text: s.text,
            imageKeyword: s.imageKeyword,
            imageUrl,
            audioUrl,
            audioDuration: duration,
            delay: 0,
            sfx: '',
            vfx: 'zoom-in',
          });
        }
        setSegments(newSegments);
        if (newSegments.length > 0) setSelectedSegmentId(newSegments[0].id);
      } catch (error) {
        console.error(error);
        alert('초기화 실패');
      } finally {
        setLoading(false);
      }
    };
    initSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Convert Segments to Remotion Composition Props
  const compositionProps: ShortsComposition = useMemo(() => {
    const layers: VideoLayer[] = [];
    let currentFrame = 0;

    segments.forEach((seg, idx) => {
      const durationSec = (seg.audioDuration || 3) + (seg.delay || 0);
      const durationFrames = Math.floor(durationSec * FPS);
      
      // 1. Image Layer
      let kenBurns = undefined;
      if (seg.vfx === 'zoom-in') kenBurns = { fromScale: 1, toScale: 1.2, fromX: 0, toX: 0, fromY: 0, toY: 0 };
      if (seg.vfx === 'zoom-out') kenBurns = { fromScale: 1.2, toScale: 1, fromX: 0, toX: 0, fromY: 0, toY: 0 };
      if (seg.vfx === 'pan-left') kenBurns = { fromScale: 1.2, toScale: 1.2, fromX: 0, toX: 100, fromY: 0, toY: 0 };
      
      layers.push({
        id: `img-${seg.id}`,
        type: 'image',
        src: seg.imageUrl || '',
        startFrame: currentFrame,
        durationInFrames: durationFrames,
        transform: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
        kenBurns,
      });

      // 2. Text Layer (Subtitle)
      layers.push({
        id: `txt-${seg.id}`,
        type: 'text',
        text: seg.text,
        startFrame: currentFrame,
        durationInFrames: durationFrames,
        transform: { x: 0, y: 1400, scale: 1, rotate: 0, opacity: 1 }, // 하단 배치
        style: {
          fontFamily: 'Pretendard-Bold',
          fontSize: 60,
          color: 'white',
          textAlign: 'center',
          strokeColor: 'black',
          strokeWidth: 4,
        }
      });

      // 3. Audio Layer (TTS)
      // Proxy URL 사용 (http://127.0.0.1:3001...)
      if (seg.audioUrl) {
        layers.push({
            id: `tts-${seg.id}`,
            type: 'audio',
            src: `http://127.0.0.1:3001${seg.audioUrl}`,
            startFrame: currentFrame,
            // durationInFrames 생략 시 전체 재생
            volume: 1.0,
        });
      }

      // 4. SFX Layer
      if (seg.sfx) {
          layers.push({
              id: `sfx-${seg.id}`,
              type: 'audio',
              src: `/assets/sfx/${seg.sfx}.mp3`, // public folder or API proxy needed
              startFrame: currentFrame,
              volume: 0.8,
          });
      }

      currentFrame += durationFrames;
    });

    return {
      width: 1080,
      height: 1920,
      fps: FPS,
      durationInFrames: currentFrame || 1, // 최소 1프레임
      layers,
    };
  }, [segments]);

  // Handlers
  const updateSegment = (index: number, updates: Partial<EditorSegment>) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], ...updates };
    setSegments(newSegments);
  };

  const handleRegenerateTTS = async (index: number) => {
    try {
        const seg = segments[index];
        const { audioUrl, duration } = await previewTTS(seg.text);
        updateSegment(index, { audioUrl, audioDuration: duration });
    } catch (e) {
        alert('TTS 생성 실패');
    }
  };

  if (loading) return <div className="p-20 text-center">Loading Editor...</div>;

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 p-4 overflow-hidden">
      {/* Left: Player */}
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 rounded-2xl p-4 shadow-xl border border-zinc-800">
        <div className="relative w-full h-full max-h-[800px] aspect-[9/16] shadow-2xl overflow-hidden rounded-lg">
          <Player
            component={ShortsVideo}
            inputProps={compositionProps}
            durationInFrames={compositionProps.durationInFrames}
            fps={FPS}
            compositionWidth={1080}
            compositionHeight={1920}
            style={{
              width: '100%',
              height: '100%',
            }}
            controls
            loop
            autoPlay
          />
        </div>
      </div>

      {/* Right: Inspector / Timeline */}
      <div className="w-[400px] flex flex-col gap-4 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Timeline / Layers</h2>
            <button 
                onClick={() => onNext(segments)}
                className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-bold text-sm"
            >
                Render
            </button>
        </div>
        
        <div className="space-y-3">
          {segments.map((seg, idx) => (
            <div 
              key={seg.id}
              onClick={() => setSelectedSegmentId(seg.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedSegmentId === seg.id 
                  ? 'bg-zinc-800 border-purple-500 ring-1 ring-purple-500' 
                  : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <div className="flex gap-3 mb-2">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={seg.imageUrl} alt="" className="w-16 h-16 object-cover rounded bg-black" />
                <div className="flex-1 min-w-0">
                    <textarea 
                        value={seg.text}
                        onChange={(e) => updateSegment(idx, { text: e.target.value })}
                        className="w-full bg-transparent text-sm border-none p-0 focus:ring-0 resize-none"
                        rows={2}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
              </div>
              
              {selectedSegmentId === seg.id && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-700 animate-in slide-in-from-top-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRegenerateTTS(idx); }}
                        className="flex items-center justify-center gap-1 text-xs bg-zinc-700 p-1.5 rounded hover:bg-zinc-600"
                      >
                          <RefreshCw size={12}/> Regen TTS
                      </button>
                      <div className="flex items-center gap-1 text-xs bg-zinc-700 p-1.5 rounded">
                          <span>Delay</span>
                          <input 
                            type="number" step="0.1" 
                            value={seg.delay}
                            onChange={(e) => updateSegment(idx, { delay: parseFloat(e.target.value) })}
                            className="w-full bg-transparent text-center border-none p-0 focus:ring-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                      </div>
                      <select 
                        value={seg.vfx}
                        onChange={(e) => updateSegment(idx, { vfx: e.target.value })}
                        className="col-span-1 text-xs bg-zinc-700 border-none rounded p-1.5 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                          <option value="zoom-in">Zoom In</option>
                          <option value="zoom-out">Zoom Out</option>
                          <option value="pan-left">Pan Left</option>
                          <option value="static">Static</option>
                      </select>
                      <select 
                        value={seg.sfx}
                        onChange={(e) => updateSegment(idx, { sfx: e.target.value })}
                        className="col-span-1 text-xs bg-zinc-700 border-none rounded p-1.5 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                          <option value="">No SFX</option>
                          <option value="boom">Boom</option>
                          <option value="whoosh">Whoosh</option>
                      </select>
                  </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
