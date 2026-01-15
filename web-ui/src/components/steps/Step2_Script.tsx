import { useRef, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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

// Reusable Inserter Component for gaps
const Inserter = ({ onClick, height = "h-12" }: { onClick: () => void, height?: string }) => (
  <div 
    className={`${height} relative flex items-center justify-center group cursor-pointer z-10`}
    onClick={onClick}
  >
    {/* Hover Line - Centered vertically */}
    <div className="absolute w-full h-px bg-transparent group-hover:bg-purple-500/50 transition-colors"></div>
    
    {/* Button - Scaled and Centered */}
    <div className="z-20 bg-zinc-900 border border-zinc-800 text-zinc-500 group-hover:text-white group-hover:border-purple-500 rounded-full p-2 shadow-xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200">
      <Plus className="w-6 h-6" />
    </div>
  </div>
);

export default function Step2_Script({ script, setScript, topic, setTopic }: Step2Props) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // 드래그 이미지 설정 (선택적)
    e.dataTransfer.effectAllowed = 'move';
    
    // 드래그 시 고스트 이미지를 깔끔하게 하기 위해 부모 요소를 투명하게 하거나 스타일링 할 수 있음
    // 하지만 브라우저 기본 동작으로도 충분
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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
    <div className="max-w-3xl mx-auto pt-6 pb-16 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
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

      <div className="space-y-0">
        {/* Helper Tip */}
        <div className="text-sm text-zinc-500 bg-zinc-900/30 w-full px-4 py-3 rounded-xl border border-zinc-800/30 mb-4">
          <div className="flex gap-3">
            <span className="font-semibold text-zinc-400 shrink-0 mt-0.5">Tip</span>
            <div className="flex flex-col gap-1.5 text-zinc-500 font-medium">
              <p>줄바꿈을 하면 자막도 줄바꿈됩니다. 문장이 길면 자동으로 나뉩니다.</p>
              <p>강조할 단어는 <strong className="text-zinc-300">[대괄호]</strong>로 묶어주세요. (예: [중요]한 내용)</p>
            </div>
          </div>
        </div>

        {/* Script Editor List */}
        <div className="flex flex-col">
          
          <Inserter onClick={() => handleAddSegment(-1)} height="h-10" />

          {script.map((segment, index) => (
            <div key={index} className="flex flex-col">
              
              {/* Item Container */}
              <div 
                className={`relative group/item flex gap-6 items-start p-6 rounded-3xl transition-all duration-200 z-0
                  ${draggedIndex === index ? 'opacity-50 scale-95 bg-zinc-800 border-dashed border-2 border-zinc-600' : 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'}`}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
              >
                
                {/* Drag Handle (Number Area) - Only this part is draggable */}
                <div 
                  className="flex flex-col items-center pt-1.5 cursor-grab active:cursor-grabbing hover:bg-zinc-800/50 rounded-lg p-1 -m-1 transition-colors"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  title="드래그하여 순서 변경"
                >
                  <span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 shadow-sm select-none pointer-events-none">
                    {index + 1}
                  </span>
                </div>

                {/* Editor Box */}
                <div className="flex-1 relative">
                  <AutoResizeTextarea
                    value={segment.text}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none text-lg resize-none text-zinc-100 placeholder:text-zinc-600 leading-relaxed min-h-[40px] py-1 font-medium"
                    placeholder="내레이션 내용을 입력하세요..."
                  />
                  
                  {/* Delete Button */}
                  <div className="absolute -right-2 top-0 opacity-0 group-hover/item:opacity-100 transition-all duration-200">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSegment(index);
                      }}
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Inserter - Centered in the expanded gap */}
              <Inserter onClick={() => handleAddSegment(index)} height="h-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}