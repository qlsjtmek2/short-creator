import { useRef, useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { ScriptSegment } from '@/types';

interface Step2Props {
  script: ScriptSegment[];
  setScript: (script: ScriptSegment[]) => void;
  topic: string;
  setTopic: (topic: string) => void;
}

// Auto-resizing textarea
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleTextChange = (index: number, newText: string) => {
    const newScript = [...script];
    newScript[index].text = newText;
    setScript(newScript);
  };

  // 특정 인덱스 뒤에 추가 (index가 -1이면 맨 앞에 추가)
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

  // Drag & Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Optional: Add visual feedback logic here
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newScript = [...script];
    const [draggedItem] = newScript.splice(draggedIndex, 1);
    newScript.splice(index, 0, draggedItem);
    
    setScript(newScript);
    setDraggedIndex(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title Editor */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Title</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-sm"
        />
      </div>

      <div className="space-y-4">
        {/* Helper Tip */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-900/30 w-full px-4 py-3 rounded-xl border border-zinc-800/30">
          <span className="font-semibold text-zinc-400">💡 Tip</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
          <span>줄바꿈을 하면 자막도 줄바꿈됩니다. 문장이 길면 자동으로 나뉩니다.</span>
        </div>

        {/* Script Editor List */}
        <div className="space-y-0"> {/* Remove gap for better inserter UX */}
          
          {/* Top Inserter */}
          <div className="h-4 -my-2 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10 relative group cursor-pointer"
               onClick={() => handleAddSegment(-1)}>
            <div className="w-full h-0.5 bg-purple-500/50 group-hover:bg-purple-500 transition-colors absolute"></div>
            <div className="bg-purple-600 text-white rounded-full p-1 shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
          </div>

          {script.map((segment, index) => (
            <div key={index} className="relative group/item">
              
              {/* Draggable Item */}
              <div 
                className={`flex gap-6 items-start p-4 rounded-3xl transition-all duration-200 
                  ${draggedIndex === index ? 'opacity-50 scale-95 bg-zinc-800 border-dashed border-2 border-zinc-600' : 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
              >
                
                {/* Number & Drag Handle */}
                <div className="flex flex-col items-center pt-2 gap-2">
                  <span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400 shadow-sm select-none">
                    {index + 1}
                  </span>
                  <div className="text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing p-1 transition-colors" title="드래그하여 순서 변경">
                    <GripVertical className="w-5 h-5" />
                  </div>
                </div>

                {/* Editor Box */}
                <div className="flex-1 relative">
                  <AutoResizeTextarea
                    value={segment.text}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none text-xl resize-none text-zinc-100 placeholder:text-zinc-600 leading-relaxed min-h-[40px] py-2"
                    placeholder="내레이션 내용을 입력하세요..."
                  />
                  
                  {/* Delete Button (Visible on hover) */}
                  <div className="absolute -right-2 top-0 opacity-0 group-hover/item:opacity-100 transition-all duration-200">
                    <button 
                      onClick={() => handleDeleteSegment(index)}
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Inserter (Except for last item, which uses the big button) */}
              {index < script.length - 1 && (
                <div 
                  className="h-6 -my-3 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10 relative group/inserter cursor-pointer"
                  onClick={() => handleAddSegment(index)}
                >
                  <div className="w-full h-0.5 bg-purple-500/30 group-hover/inserter:bg-purple-500 transition-colors absolute"></div>
                  <div className="bg-zinc-900 border border-purple-500/50 text-purple-400 rounded-full p-1 shadow-lg transform scale-0 group-hover/inserter:scale-100 transition-transform">
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Big Add Button at bottom */}
        <button
          onClick={() => handleAddSegment(script.length - 1)}
          className="w-full py-4 mt-4 border-2 border-dashed border-zinc-800/50 rounded-2xl text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/30 transition-all flex items-center justify-center gap-2 font-medium group"
        >
          <div className="p-1.5 rounded-full bg-zinc-800/50 group-hover:bg-zinc-800 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          마지막에 문단 추가하기
        </button>
      </div>
    </div>
  );
}
