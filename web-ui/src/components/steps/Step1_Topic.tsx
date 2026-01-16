import { useState, useEffect } from 'react';
import { Wand2, Loader2, Zap, Settings, RefreshCw } from 'lucide-react';
import { generateDraft, fetchRecommendedTopics } from '@/lib/api';
import { ScriptSegment } from '@/types';

interface Step1Props {
  onNext: (topic: string, script: ScriptSegment[]) => void;
  setLoading: (loading: boolean, text: string) => void;
  isLoading: boolean;
  onOpenSettings: () => void;
}

const COLORS = [
  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'bg-red-500/20 text-red-300 border-red-500/30',
  'bg-green-500/20 text-green-300 border-green-500/30',
  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'bg-teal-500/20 text-teal-300 border-teal-500/30',
];

const DEFAULT_TOPICS = [
  { category: '미스터리', text: '세계 7대 불가사의의 진실' },
  { category: '공포', text: '절대 가면 안 되는 흉가 TOP 3' },
  { category: '지식', text: '우리가 몰랐던 우주의 크기' },
  { category: '유머', text: '한국인이 참지 못하는 순간들' },
  { category: '상상', text: '만약 지구가 멈춘다면?' },
  { category: '역사', text: '조선시대 왕들의 비밀' },
  { category: '동물', text: '세상에서 가장 귀여운 동물 TOP 5' },
  { category: '음식', text: '한국인이 가장 사랑하는 야식 월드컵' },
  { category: '여행', text: '죽기 전에 꼭 가봐야 할 여행지' },
  { category: '생활', text: '자취생을 위한 다이소 꿀템 BEST 5' },
];

export default function Step1_Topic({
  onNext,
  setLoading,
  isLoading,
  onOpenSettings,
}: Step1Props) {
  const [topic, setTopic] = useState('');
  const [isRecLoading, setIsRecLoading] = useState(false);
  
  // 초기값: 빈 배열 (Hydration Mismatch 방지)
  const [recommendedTopics, setRecommendedTopics] = useState<any[]>([]);

  useEffect(() => {
    // 컴포넌트 마운트 후 클라이언트에서만 랜덤 주제 생성
    const shuffled = [...DEFAULT_TOPICS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setRecommendedTopics(shuffled.map(t => ({
      ...t,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    })));
  }, []);

  const loadRecommendations = async () => {
    setIsRecLoading(true);
    try {
      const topics = await fetchRecommendedTopics();
      // 색상 랜덤 할당
      const topicsWithColor = topics.map((t) => ({
        ...t,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
      setRecommendedTopics(topicsWithColor);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      // 에러 시 로컬 풀에서 다시 랜덤 추천
      const shuffled = [...DEFAULT_TOPICS].sort(() => 0.5 - Math.random()).slice(0, 5);
      setRecommendedTopics(shuffled.map(t => ({
        ...t,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      })));
    } finally {
      setIsRecLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true, 'Gemini가 대본을 작성하고 있습니다...');
    try {
      // 설정 로드
      let options = {};
      const savedSettings = localStorage.getItem('shorts-creator-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        options = {
          modelName: parsed.geminiModel,
          temperature: parsed.temperature,
          systemPrompt: parsed.systemPrompt,
          userPromptTemplate: parsed.userPromptTemplate,
          titleMaxLength: parsed.titleMaxLength,
          sentenceCount: parsed.sentenceCount,
          sentenceMaxLength: parsed.sentenceMaxLength,
          tone: parsed.tone,
        };
      }

      const res = await generateDraft(topic, options);
      onNext(res.topic, res.script);
    } catch (error) {
      console.error(error);
      alert('대본 생성에 실패했습니다.');
    } finally {
      setLoading(false, '');
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 animate-in fade-in zoom-in duration-500">
      {/* Settings Button (Top Right) */}
      <button
        onClick={onOpenSettings}
        className="absolute top-6 right-6 p-2 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        <Settings className="w-6 h-6" />
      </button>

      <div className="w-full max-w-2xl flex flex-col items-center gap-12 -mt-20">
        {/* Title Section */}
        <div className="text-center space-y-4">
          <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
            어떤 쇼츠를 만들까요?
          </h2>
          <p className="text-zinc-400 text-xl font-light">
            주제를 입력하면 AI가 대본부터 짤방 선택까지 도와드립니다.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full space-y-8">
          <div className="relative group w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex gap-2 p-2 bg-zinc-900 ring-1 ring-zinc-800 rounded-2xl shadow-2xl">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: 세상에서 가장 무서운 동물 TOP 3"
                className="flex-1 bg-transparent px-6 py-4 text-xl focus:outline-none placeholder:text-zinc-600 text-white font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                autoFocus
              />
              <button
                onClick={handleGenerate}
                disabled={isLoading || !topic}
                className="bg-zinc-100 hover:bg-white text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
                <span className="hidden md:inline">생성하기</span>
              </button>
            </div>
          </div>

          {/* Recommended Topics */}
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium pl-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>오늘의 추천 주제</span>
              <button
                onClick={loadRecommendations}
                disabled={isRecLoading}
                className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 underline ml-2 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRecLoading ? 'animate-spin' : ''}`}
                />
                AI로 새로고침
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3 min-h-[100px]">
              {isRecLoading || recommendedTopics.length === 0 ? (
                // 스켈레톤 로딩 UI
                Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-10 bg-zinc-800/50 rounded-full animate-pulse"
                    style={{ width: `${100 + (idx * 30) % 100}px` }}
                  />
                ))
              ) : (
                // 실제 데이터
                recommendedTopics.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTopic(item.text)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all hover:scale-105 active:scale-95 text-left shadow-sm ${item.color}`}
                  >
                    <span className="opacity-70 text-xs mr-2 font-bold">
                      #{item.category}
                    </span>
                    {item.text}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
