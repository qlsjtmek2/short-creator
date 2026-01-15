import { Plus, Trash2, GripVertical, AlertCircle, Info } from 'lucide-react';
import { ScriptSegment } from '@/types';

interface Step2Props {
  script: ScriptSegment[];
  setScript: (script: ScriptSegment[]) => void;
  topic: string;
  setTopic: (topic: string) => void;
}

export default function Step2_Script({ script, setScript, topic, setTopic }: Step2Props) {
  
  const handleTextChange = (index: number, newText: string) => {
    const newScript = [...script];
    newScript[index].text = newText;
    setScript(newScript);
  };

  const handleAddSegment = (index: number) => {
    const newScript = [...script];
    newScript.splice(index + 1, 0, { text: '', imageKeyword: '' });
    setScript(newScript);
  };

  const handleDeleteSegment = (index: number) => {
    if (script.length <= 1) {
      alert('최소 하나의 문단은 있어야 합니다.');
      return;
    }
    const newScript = script.filter((_, i) => i !== index);
    setScript(newScript);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title Editor */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Title</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
        />
      </div>

      {/* Helper Tip */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 text-sm text-blue-200">
        <Info className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <p className="font-semibold mb-1">💡 편집 팁</p>
          <ul className="list-disc list-inside space-y-1 text-blue-200/80">
            <li>줄바꿈을 하면 자막도 줄바꿈됩니다.</li>
            <li>문장이 너무 길면 자동으로 나뉩니다.</li>
          </ul>
        </div>
      </div>

      {/* Script Editor */}
      <div className="space-y-4">
        {script.map((segment, index) => (
          <div key={index} className="group relative flex gap-4 items-start">
            
            {/* Number & Drag Handle (Visual only for now) */}
            <div className="flex flex-col items-center pt-4 gap-2">
              <span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400">
                {index + 1}
              </span>
              <div className="text-zinc-700 opacity-0 group-hover:opacity-100 cursor-grab">
                <GripVertical className="w-5 h-5" />
              </div>
            </div>

            {/* Editor Box */}
            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-colors focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 relative">
              <textarea
                value={segment.text}
                onChange={(e) => handleTextChange(index, e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-lg resize-none text-zinc-100 placeholder:text-zinc-600 leading-relaxed min-h-[80px]"
                placeholder="내레이션 내용을 입력하세요..."
              />
              
              {/* Action Buttons (Absolute) */}
              <div className="absolute -right-3 -bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDeleteSegment(index)}
                  className="p-2 bg-zinc-800 text-red-400 rounded-full shadow-lg hover:bg-red-500/20 hover:scale-110 transition-all"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleAddSegment(index)}
                  className="p-2 bg-zinc-800 text-green-400 rounded-full shadow-lg hover:bg-green-500/20 hover:scale-110 transition-all"
                  title="아래에 추가"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty State / Add Button at bottom */}
        <button
          onClick={() => handleAddSegment(script.length - 1)}
          className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          마지막에 문단 추가하기
        </button>
      </div>
    </div>
  );
}
