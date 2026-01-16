'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RefreshCw, Wand2, Music, Image as ImageIcon } from 'lucide-react';
import { EditorSegment, AssetGroup } from '../../types';
import { previewTTS } from '@/lib/api';

interface Step4_EditorProps {
  topic: string;
  assets: AssetGroup[];
  script: { text: string; imageKeyword: string }[];
  onNext: (segments: EditorSegment[]) => void;
  onBack: () => void;
}

export default function Step4_Editor({
  topic,
  assets,
  script,
  onNext,
}: Step4_EditorProps) {
  // State
  const [segments, setSegments] = useState<EditorSegment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Segments (First load only)
  useEffect(() => {
    const initSegments = async () => {
      if (segments.length > 0) return; // 이미 초기화됨

      setLoading(true);
      try {
        const newSegments: EditorSegment[] = [];
        
        // 병렬 처리로 모든 TTS 미리 생성 (초기 로딩 시간 발생하지만 편집 경험 향상)
        // 실제 프로덕션에서는 Lazy Loading이나 개별 생성 권장
        for (let i = 0; i < script.length; i++) {
          const s = script[i];
          const asset = assets.find(a => a.keyword === s.imageKeyword);
          const imageUrl = asset?.selectedImage || asset?.images[0] || '';
          
          // TTS 생성 요청
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
            vfx: 'zoom-in', // 기본값
          });
        }
        setSegments(newSegments);
      } catch (error) {
        console.error('Failed to initialize segments:', error);
        alert('편집기 초기화 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    initSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Player Logic
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleAudioEnded = () => {
    if (currentSegmentIndex < segments.length - 1) {
      // 다음 세그먼트로 자동 이동
      setCurrentSegmentIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setCurrentSegmentIndex(0);
    }
  };
  
  // Effect to play next audio automatically when index changes while playing
  useEffect(() => {
    if (isPlaying && audioRef.current) {
        audioRef.current.src = `http://127.0.0.1:3001${segments[currentSegmentIndex]?.audioUrl}`;
        audioRef.current.play();
    }
  }, [currentSegmentIndex, segments]); // segments 의존성 추가 (오디오 URL 변경 대응)


  const currentSegment = segments[currentSegmentIndex];

  if (loading || segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400">편집기를 준비하고 있습니다...<br/>TTS 음성을 생성 중입니다.</p>
      </div>
    );
  }

  // Handle TTS Regeneration
  const handleRegenerateTTS = async (index: number) => {
    const seg = segments[index];
    try {
      const { audioUrl, duration } = await previewTTS(seg.text);
      
      const newSegments = [...segments];
      newSegments[index] = {
        ...newSegments[index],
        audioUrl,
        audioDuration: duration
      };
      setSegments(newSegments);
      alert('TTS가 재생성되었습니다.');
    } catch (error) {
      console.error(error);
      alert('TTS 생성 실패');
    }
  };

  // Handle Image Cycling
  const handleNextImage = (index: number) => {
    const seg = segments[index];
    const assetGroup = assets.find(a => a.keyword === seg.imageKeyword);
    
    if (!assetGroup || !assetGroup.images.length) return;

    // 현재 이미지의 인덱스 찾기
    const currentImgIdx = assetGroup.images.indexOf(seg.imageUrl || '');
    const nextImgIdx = (currentImgIdx + 1) % assetGroup.images.length;
    
    const newSegments = [...segments];
    newSegments[index].imageUrl = assetGroup.images[nextImgIdx];
    setSegments(newSegments);
  };

  // VFX Styles Mapping
  const getVfxStyle = (vfx?: string) => {
    switch (vfx) {
      case 'zoom-in': return 'scale-125 transition-transform duration-[10s] ease-out';
      case 'zoom-out': return 'scale-100 transition-transform duration-[10s] ease-out origin-center'; // scale-125에서 시작해야 함 (구현 한계)
      case 'pan-left': return '-translate-x-10 transition-transform duration-[10s] ease-linear';
      case 'pan-right': return 'translate-x-10 transition-transform duration-[10s] ease-linear';
      case 'shake': return 'animate-pulse';
      default: return 'scale-100';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 animate-in fade-in duration-500">
      {/* Left: Preview Player (Sticky) */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          <div className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 group">
            {/* Background Image with VFX */}
            {currentSegment?.imageUrl && (
              <div className="w-full h-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={currentSegment.imageUrl} 
                  alt="Preview" 
                  className={`w-full h-full object-cover transition-all ${
                    isPlaying ? getVfxStyle(currentSegment.vfx) : ''
                  }`}
                  style={{ transformOrigin: 'center center' }}
                />
              </div>
            )}
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />

            {/* Subtitle */}
            <div className="absolute bottom-16 left-4 right-4 text-center z-10">
              <p className="text-white font-bold text-xl leading-relaxed drop-shadow-md break-keep">
                {currentSegment?.text}
              </p>
            </div>

            {/* Audio Element (Hidden) */}
            <audio 
              ref={audioRef}
              src={`http://127.0.0.1:3001${currentSegment?.audioUrl}`} 
              onEnded={handleAudioEnded}
            />
          </div>

          {/* Controls */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <div className="text-sm text-zinc-400">
              #{currentSegmentIndex + 1} / {segments.length}
            </div>
            <div className="text-sm font-mono text-zinc-500">
              {currentSegment?.audioDuration?.toFixed(1)}s
            </div>
          </div>
        </div>
      </div>

      {/* Right: Segment Editor List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">상세 편집</h2>
          <button 
            onClick={() => onNext(segments)}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-full font-bold transition-all shadow-lg shadow-purple-900/20"
          >
            렌더링 단계로 이동 &rarr;
          </button>
        </div>

        <div className="space-y-4">
          {segments.map((seg, idx) => (
            <div 
              key={seg.id}
              onClick={() => {
                setCurrentSegmentIndex(idx);
                setIsPlaying(false);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                currentSegmentIndex === idx 
                  ? 'bg-zinc-900 border-purple-500 ring-1 ring-purple-500/50' 
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex gap-4">
                {/* Thumbnail (Click to cycle images) */}
                <div 
                  className="w-24 h-24 flex-shrink-0 bg-black rounded-lg overflow-hidden relative group"
                  onClick={(e) => {
                    e.stopPropagation(); // 부모 클릭 방지
                    handleNextImage(idx);
                  }}
                  title="클릭하여 이미지 변경"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={seg.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon size={20} className="text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <textarea
                      value={seg.text}
                      onChange={(e) => {
                        const newSegments = [...segments];
                        newSegments[idx].text = e.target.value;
                        setSegments(newSegments);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-transparent border-none p-0 text-zinc-100 font-medium focus:ring-0 resize-none"
                      rows={2}
                    />
                  </div>
                  
                  {/* Tools */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegenerateTTS(idx);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
                    >
                      <RefreshCw size={12} /> TTS
                    </button>
                    
                    {/* Delay Input */}
                    <div 
                      className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Delay</span>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0"
                        value={seg.delay} 
                        onChange={(e) => {
                          const newSegments = [...segments];
                          newSegments[idx].delay = parseFloat(e.target.value);
                          setSegments(newSegments);
                        }}
                        className="w-10 bg-transparent border-none p-0 text-center text-zinc-100 text-xs focus:ring-0 appearance-none"
                      />
                      <span>s</span>
                    </div>

                    {/* SFX Selector */}
                    <div className="relative group/select" onClick={e => e.stopPropagation()}>
                        <select
                            value={seg.sfx || ''}
                            onChange={(e) => {
                                const newSegments = [...segments];
                                newSegments[idx].sfx = e.target.value;
                                setSegments(newSegments);
                            }}
                            className="appearance-none pl-7 pr-4 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors cursor-pointer focus:ring-1 focus:ring-purple-500 border-none"
                        >
                            <option value="">No SFX</option>
                            <option value="boom">Boom</option>
                            <option value="whoosh">Whoosh</option>
                            <option value="ding">Ding</option>
                        </select>
                        <Music size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>

                    {/* VFX Selector */}
                    <div className="relative group/select" onClick={e => e.stopPropagation()}>
                        <select
                            value={seg.vfx || 'zoom-in'} // Default vfx
                            onChange={(e) => {
                                const newSegments = [...segments];
                                newSegments[idx].vfx = e.target.value;
                                setSegments(newSegments);
                            }}
                            className="appearance-none pl-7 pr-4 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors cursor-pointer focus:ring-1 focus:ring-purple-500 border-none"
                        >
                            <option value="">No VFX</option>
                            <option value="zoom-in">Zoom In</option>
                            <option value="zoom-out">Zoom Out</option>
                            <option value="pan-left">Pan Left</option>
                            <option value="pan-right">Pan Right</option>
                            <option value="shake">Shake</option>
                        </select>
                        <Wand2 size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}