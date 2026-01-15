import { useState } from 'react';
import { Wand2, Loader2, Zap } from 'lucide-react';
import { generateDraft } from '@/lib/api';
import { ScriptSegment } from '@/types';

interface Step1Props {
  onNext: (topic: string, script: ScriptSegment[]) => void;
  setLoading: (loading: boolean, text: string) => void;
  isLoading: boolean;
}

const RECOMMENDED_TOPICS = [
  { category: '밸런스', text: '평생 라면만 먹기 vs 평생 탄산만 마시기', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { category: '미스터리', text: '세계 7대 불가사의의 진실', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { category: '공포', text: '절대 가면 안 되는 흉가 TOP 3', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { category: '지식', text: '우리가 몰랐던 우주의 크기', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { category: '유머', text: '한국인이 참지 못하는 순간들', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
];

export default function Step1_Topic({ onNext, setLoading, isLoading }: Step1Props) {
  const [topic, setTopic] = useState('');

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true, 'Gemini가 대본을 작성하고 있습니다...');
    try {
      const res = await generateDraft(topic);
      onNext(res.topic, res.script);
    } catch (error) {
      console.error(error);
      alert('대본 생성에 실패했습니다.');
    } finally {
      setLoading(false, '');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4 mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          어떤 쇼츠를 만들까요?
        </h2>
        <p className="text-zinc-400 text-lg">
          주제를 입력하면 AI가 대본부터 짤방 선택까지 도와드립니다.
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex gap-2 p-2 bg-zinc-900 ring-1 ring-zinc-800 rounded-2xl">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 세상에서 가장 무서운 동물 TOP 3"
              className="flex-1 bg-transparent px-6 py-4 text-xl focus:outline-none placeholder:text-zinc-600 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              autoFocus
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !topic}
              className="bg-zinc-100 hover:bg-white text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              <span className="hidden md:inline">생성하기</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>추천 주제</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {RECOMMENDED_TOPICS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setTopic(item.text)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all hover:scale-105 active:scale-95 text-left ${item.color}`}
              >
                <span className="opacity-70 text-xs mr-2">#{item.category}</span>
                {item.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
