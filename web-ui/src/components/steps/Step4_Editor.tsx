'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { RefreshCw, Wand2, Music, Play, Pause, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { EditorSegment, AssetGroup } from '../../types';
import { previewTTS } from '@/lib/api';
import { ShortsVideo } from '../../remotion/compositions/ShortsVideo';
import { ShortsComposition, VideoLayer } from '../../remotion/types/schema';
import { Timeline } from '../editor/Timeline';

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
  onBack,
}: Step4_EditorProps) {
  // State
  const [segments, setSegments] = useState<EditorSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Playback state
  
  const playerRef = useRef<PlayerRef>(null);

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

  // Sync Player State & Keyboard Listener
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current) {
        const frame = playerRef.current.getCurrentFrame();
        if (frame !== null) setCurrentFrame(frame);
        
        // Remotion Player 자체의 재생 상태와 React 상태 동기화 (선택사항)
        // 하지만 여기서는 우리가 제어하므로 생략 가능
      }
    }, 1000 / 30); 

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            togglePlay();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        clearInterval(interval);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying]); // Re-bind if needed, but togglePlay reference handles it

  const togglePlay = () => {
      if (playerRef.current) {
          if (playerRef.current.isPlaying()) {
              playerRef.current.pause();
              setIsPlaying(false);
          } else {
              playerRef.current.play();
              setIsPlaying(true);
          }
      }
  };

  // Remotion Composition Props
  const compositionProps: ShortsComposition = useMemo(() => {
    const layers: VideoLayer[] = [];
    let frameCursor = 0;

    segments.forEach((seg, idx) => {
      const durationSec = (seg.audioDuration || 3) + (seg.delay || 0);
      const durationFrames = Math.floor(durationSec * FPS);
      
      // 1. Image
      let kenBurns = undefined;
      if (seg.vfx === 'zoom-in') kenBurns = { fromScale: 1, toScale: 1.2, fromX: 0, toX: 0, fromY: 0, toY: 0 };
      else if (seg.vfx === 'zoom-out') kenBurns = { fromScale: 1.2, toScale: 1, fromX: 0, toX: 0, fromY: 0, toY: 0 };
      else if (seg.vfx === 'pan-left') kenBurns = { fromScale: 1.2, toScale: 1.2, fromX: 0, toX: 100, fromY: 0, toY: 0 };
      
      layers.push({
        id: `img-${seg.id}`,
        type: 'image',
        src: seg.imageUrl || '',
        startFrame: frameCursor,
        durationInFrames: durationFrames,
        transform: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
        kenBurns,
      });

      // 2. Text
      layers.push({
        id: `txt-${seg.id}`,
        type: 'text',
        text: seg.text,
        startFrame: frameCursor,
        durationInFrames: durationFrames,
        transform: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
        style: {
          fontFamily: 'Pretendard-Bold',
          fontSize: 60,
          color: 'white',
          textAlign: 'center',
          strokeColor: 'black',
          strokeWidth: 4,
        }
      });

      // 3. Audio (TTS)
      if (seg.audioUrl) {
        const audioSrc = seg.audioUrl.startsWith('http') 
            ? seg.audioUrl 
            : `http://127.0.0.1:3001${seg.audioUrl}`;
            
        layers.push({
            id: `tts-${seg.id}`,
            type: 'audio',
            src: audioSrc,
            startFrame: frameCursor,
            volume: 1.0,
        });
      }

      // 4. SFX
      if (seg.sfx) {
          layers.push({
              id: `sfx-${seg.id}`,
              type: 'audio',
              src: `http://127.0.0.1:3001/assets/sfx/${seg.sfx}.mp3`, 
              startFrame: frameCursor,
              volume: 0.8,
          });
      }

      frameCursor += durationFrames;
    });

    return {
      width: 1080,
      height: 1920,
      fps: FPS,
      durationInFrames: frameCursor || 1, 
      title: topic, 
      layers,
    };
  }, [segments, topic]);

  // Handlers
  const updateSegment = (id: string, updates: Partial<EditorSegment>) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleRegenerateTTS = async (id: string) => {
    const seg = segments.find(s => s.id === id);
    if (!seg) return;
    
    try {
        const { audioUrl, duration } = await previewTTS(seg.text);
        updateSegment(id, { audioUrl, audioDuration: duration });
    } catch (e) {
        alert('TTS 생성 실패');
    }
  };

  const handleSeek = useCallback((frame: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(frame);
    }
  }, []);

  const selectedSegment = segments.find(s => s.id === selectedSegmentId);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"/>
          <p className="text-zinc-400">에셋을 로딩하고 타임라인을 구성중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">{topic}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
            <Settings size={20} />
          </button>
          <button 
            onClick={() => onNext(segments)}
            className="bg-purple-600 hover:bg-purple-500 px-6 py-1.5 rounded-full font-bold text-sm transition-colors"
          >
            영상 추출하기
          </button>
        </div>
      </div>

      {/* Middle Area: Preview + Inspector */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Preview Area (Center) */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center p-8 relative">
          
          {/* Main Player */}
          <div className="relative h-full aspect-[9/16] shadow-2xl rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
            <Player
              ref={playerRef}
              component={ShortsVideo}
              inputProps={compositionProps}
              durationInFrames={compositionProps.durationInFrames}
              fps={FPS}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{ width: '100%', height: '100%' }}
              controls={false} 
              clickToPlay={false}
            />
          </div>

          {/* Floating Play Button (Optional overlay) */}
          {/* <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4"> ... </div> */}
        </div>

        {/* Inspector (Right Sidebar) */}
        <div className="w-[350px] bg-zinc-900 border-l border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-800 font-bold text-sm text-zinc-400 uppercase tracking-wider">
            Inspector
          </div>
          
          {selectedSegment ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Text Editor */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500">Subtitle / Script</label>
                <textarea 
                  value={selectedSegment.text}
                  onChange={(e) => updateSegment(selectedSegment.id, { text: e.target.value })}
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-sm focus:ring-purple-500 focus:border-purple-500 resize-none h-24"
                />
                <button 
                  onClick={() => handleRegenerateTTS(selectedSegment.id)}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw size={12} /> Re-generate TTS
                </button>
              </div>

              {/* Timing */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500">Timing</label>
                <div className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                  <span className="text-sm">Extra Delay</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" step="0.1" min="0"
                      value={selectedSegment.delay}
                      onChange={(e) => updateSegment(selectedSegment.id, { delay: parseFloat(e.target.value) })}
                      className="w-16 bg-zinc-900 border-none rounded text-right text-sm py-1"
                    />
                    <span className="text-xs text-zinc-500">sec</span>
                  </div>
                </div>
              </div>

              {/* VFX */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500">Visual Effects</label>
                <div className="grid grid-cols-2 gap-2">
                  {['zoom-in', 'zoom-out', 'pan-left', 'static'].map((effect) => (
                    <button
                      key={effect}
                      onClick={() => updateSegment(selectedSegment.id, { vfx: effect })}
                      className={`py-2 text-xs rounded-lg border ${
                        selectedSegment.vfx === effect 
                          ? 'bg-purple-600 border-purple-500 text-white' 
                          : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {effect}
                    </button>
                  ))}
                </div>
              </div>

              {/* SFX */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500">Sound Effect</label>
                <select 
                  value={selectedSegment.sfx || ''}
                  onChange={(e) => updateSegment(selectedSegment.id, { sfx: e.target.value })}
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2 text-sm"
                >
                  <option value="">None</option>
                  <option value="boom">Boom</option>
                  <option value="whoosh">Whoosh</option>
                  <option value="ding">Ding</option>
                </select>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
              <Wand2 className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a clip in the timeline to edit its properties.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="h-[250px] w-full flex flex-col">
        {/* Timeline Toolbar */}
        <div className="h-10 bg-zinc-900 border-t border-zinc-800 flex items-center px-4 gap-4">
            <button 
                onClick={togglePlay}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white transition-colors"
            >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <div className="text-xs font-mono text-zinc-500">
                {new Date(currentFrame / FPS * 1000).toISOString().substr(14, 8)} / {new Date(compositionProps.durationInFrames / FPS * 1000).toISOString().substr(14, 8)}
            </div>
        </div>

        <Timeline 
          segments={segments}
          currentFrame={currentFrame}
          durationInFrames={compositionProps.durationInFrames}
          fps={FPS}
          onSeek={handleSeek}
          onSelectSegment={setSelectedSegmentId}
          selectedSegmentId={selectedSegmentId}
        />
      </div>
    </div>
  );
}