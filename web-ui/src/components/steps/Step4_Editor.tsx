'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import {
  RefreshCw,
  Wand2,
  Play,
  Pause,
  ChevronLeft,
  Settings,
  Loader2,
} from 'lucide-react';
import { EditorSegment, AssetGroup, RenderManifest } from '../../types';
import { previewTTS, getRenderManifest } from '@/lib/api';
import { ShortsVideoManifest } from '../../remotion/compositions/ShortsVideoManifest';
import { ShortsComposition } from '../../remotion/types/schema';
import { Timeline } from '../editor/Timeline';

interface Step4_EditorProps {
  topic: string;
  assets: AssetGroup[];
  script: { text: string; imageKeyword: string }[];
  onNext: (segments: EditorSegment[], manifest?: RenderManifest) => void;
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
  const [manifest, setManifest] = useState<RenderManifest | null>(null);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    null,
  );
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
          const asset = assets.find((a) => a.keyword === s.imageKeyword);
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
  }, []);

  // Update Manifest (Phase 21: SSOT)
  useEffect(() => {
    if (segments.length === 0) return;

    const updateManifest = async () => {
      setManifestLoading(true);
      try {
        const scriptData = {
          title: topic,
          sentences: segments.map((s) => ({
            text: s.text,
            imagePath: s.imageUrl?.replace(
              'http://127.0.0.1:3001/output',
              'output',
            ),
            audioPath: s.audioUrl?.replace(
              'http://127.0.0.1:3001/output',
              'output',
            ),
            duration: s.audioDuration,
          })),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = await getRenderManifest(scriptData as any, segments);
        setManifest(m);
      } catch (e) {
        console.error('Failed to get manifest:', e);
      } finally {
        setManifestLoading(false);
      }
    };

    const timer = setTimeout(updateManifest, 500); // Debounce
    return () => clearTimeout(timer);
  }, [segments, topic]);

  // Sync Player State & Keyboard Listener
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current) {
        const frame = playerRef.current.getCurrentFrame();
        if (frame !== null) setCurrentFrame(frame);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = useCallback(() => {
    if (playerRef.current) {
      if (playerRef.current.isPlaying()) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play();
        setIsPlaying(true);
      }
    }
  }, []);

  // Handlers
  const updateSegment = (id: string, updates: Partial<EditorSegment>) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const handleRegenerateTTS = async (id: string) => {
    const seg = segments.find((s) => s.id === id);
    if (!seg) return;

    try {
      const { audioUrl, duration } = await previewTTS(seg.text);
      updateSegment(id, { audioUrl, audioDuration: duration });
    } catch (e) {
      console.error(e);
      alert('TTS 생성 실패');
    }
  };

  const handleSeek = useCallback((frame: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(frame);
    }
  }, []);

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400">
            에셋을 로딩하고 타임라인을 구성중입니다...
          </p>
        </div>
      </div>
    );
  }

  // Calculate duration from manifest or fallback
  const durationInFrames = manifest?.metadata.totalFrames || 300;

  // Needed for fallback composition props (if manifest fails)
  const compositionProps: ShortsComposition = {
    width: 1080,
    height: 1920,
    fps: FPS,
    durationInFrames,
    title: topic,
    layers: [], // Fallback empty
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-800 rounded-full"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">{topic}</span>
        </div>
        <div className="flex items-center gap-2">
          {manifestLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
          )}
          <button className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
            <Settings size={20} />
          </button>
          <button
            onClick={() => onNext(segments, manifest || undefined)}
            className="bg-purple-600 hover:bg-purple-500 px-6 py-1.5 rounded-full font-bold text-sm transition-colors disabled:opacity-50"
            disabled={manifestLoading || !manifest}
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
            {manifest ? (
              <Player
                ref={playerRef}
                component={ShortsVideoManifest}
                inputProps={manifest}
                durationInFrames={manifest.metadata.totalFrames}
                fps={manifest.metadata.fps}
                compositionWidth={manifest.canvas.width}
                compositionHeight={manifest.canvas.height}
                style={{ width: '100%', height: '100%' }}
                controls={false}
                clickToPlay={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
              </div>
            )}
          </div>
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
                <label className="text-xs font-bold text-zinc-500">
                  Subtitle / Script
                </label>
                <textarea
                  value={selectedSegment.text}
                  onChange={(e) =>
                    updateSegment(selectedSegment.id, { text: e.target.value })
                  }
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
                <label className="text-xs font-bold text-zinc-500">
                  Timing
                </label>
                <div className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                  <span className="text-sm">Extra Delay</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={selectedSegment.delay}
                      onChange={(e) =>
                        updateSegment(selectedSegment.id, {
                          delay: parseFloat(e.target.value),
                        })
                      }
                      className="w-16 bg-zinc-900 border-none rounded text-right text-sm py-1"
                    />
                    <span className="text-xs text-zinc-500">sec</span>
                  </div>
                </div>
              </div>

              {/* VFX */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500">
                  Visual Effects
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['zoom-in', 'zoom-out', 'pan-left', 'static'].map(
                    (effect) => (
                      <button
                        key={effect}
                        onClick={() =>
                          updateSegment(selectedSegment.id, { vfx: effect })
                        }
                        className={`py-2 text-xs rounded-lg border ${
                          selectedSegment.vfx === effect
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        {effect}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* SFX */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500">
                  Sound Effect
                </label>
                <select
                  value={selectedSegment.sfx || ''}
                  onChange={(e) =>
                    updateSegment(selectedSegment.id, { sfx: e.target.value })
                  }
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
            {isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
          </button>
          <div className="text-xs font-mono text-zinc-500">
            {new Date((currentFrame / FPS) * 1000).toISOString().substr(14, 8)}{' '}
            /{' '}
            {new Date((durationInFrames / FPS) * 1000)
              .toISOString()
              .substr(14, 8)}
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
