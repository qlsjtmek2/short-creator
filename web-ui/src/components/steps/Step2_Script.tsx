import { useRef, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Info } from 'lucide-react';
import { ScriptSegment } from '@/types';

interface Step2Props {
  script: ScriptSegment[];
  setScript: (script: ScriptSegment[]) => void;
  topic: string;
  setTopic: (topic: string) => void;
}

// Auto-resizing textarea component
const AutoResizeTextarea = ({ 
  value, 
  onChange, 
  className, 
  placeholder 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  className?: string; 
  placeholder?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      rows={1}
      style={{ overflow: 'hidden' }}
    />
  );
};

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
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title Editor */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Title</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-sm"
        />
      </div>

      {/* Helper Tip (Simplified) */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-900/50 w-fit px-4 py-2 rounded-full border border-zinc-800/50">
        <span className="font-semibold text-zinc-400">Tip</span>
        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
        <span>줄바꿈을 하면 자막도 줄바꿈됩니다. 문장이 길면 자동으로 나뉩니다.</span>
      </div>

      {/* Script Editor */}
      <div className="space-y-6">
        {script.map((segment, index) => (
          <div key={index} className="group relative flex gap-6 items-start">
            
            {/* Number */}
            <div className="flex flex-col items-center pt-5 gap-3">
              <span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400 shadow-sm">
                {index + 1}
              </span>
              <div className="text-zinc-700 opacity-0 group-hover:opacity-100 cursor-grab transition-opacity">
                <GripVertical className="w-5 h-5" />
              </div>
            </div>

            {/* Editor Box */}
            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-600 hover:bg-zinc-900 transition-all focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 relative shadow-sm">
              <AutoResizeTextarea
                value={segment.text}
                onChange={(e) => handleTextChange(index, e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-xl resize-none text-zinc-100 placeholder:text-zinc-600 leading-relaxed min-h-[60px]"
                placeholder="내레이션 내용을 입력하세요..."
              />
              
              {/* Action Buttons (Absolute) */}
              <div className="absolute -right-4 -bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                <button 
                  onClick={() => handleDeleteSegment(index)}
                  className="p-2.5 bg-zinc-800 border border-zinc-700 text-red-400 rounded-full shadow-lg hover:bg-red-500/10 hover:border-red-500/30 hover:scale-110 transition-all"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleAddSegment(index)}
                  className="p-2.5 bg-zinc-800 border border-zinc-700 text-green-400 rounded-full shadow-lg hover:bg-green-500/10 hover:border-green-500/30 hover:scale-110 transition-all"
                  title="아래에 추가"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Add Button at bottom */}
        <button
          onClick={() => handleAddSegment(script.length - 1)}
          className="w-full py-6 border-2 border-dashed border-zinc-800/50 rounded-3xl text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/30 transition-all flex items-center justify-center gap-2 font-medium group"
        >
          <div className="p-2 rounded-full bg-zinc-800/50 group-hover:bg-zinc-800 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          마지막에 문단 추가하기
        </button>
      </div>
    </div>
  );
}