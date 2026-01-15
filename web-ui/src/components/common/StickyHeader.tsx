import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';

interface StickyHeaderProps {
  step: number;
  title: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  canGoNext?: boolean;
  onOpenSettings?: () => void;
}

export default function StickyHeader({ 
  step, 
  title, 
  onBack, 
  onNext, 
  nextLabel = '다음', 
  canGoNext = true,
  onOpenSettings 
}: StickyHeaderProps) {
  const steps = ['주제', '대본', '짤방', '완료'];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-white leading-tight truncate max-w-[200px] md:max-w-md">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {steps.map((s, i) => (
                <span key={i} className={i + 1 === step ? 'text-purple-400 font-medium' : ''}>
                  {s} {i < steps.length - 1 && '›'}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenSettings}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {onNext && (
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-1 transition-all"
            >
              {nextLabel}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
