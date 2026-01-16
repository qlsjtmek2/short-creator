import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StickyHeaderProps {
  step: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  canGoNext?: boolean;
}

export default function StickyHeader({
  step,
  onBack,
  onNext,
  nextLabel = '다음',
  canGoNext = true,
}: StickyHeaderProps) {
  const steps = ['주제', '대본', '짤방', '편집', '완료'];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Back & Steps */}
        <div className="flex items-center gap-6">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div className="flex items-center gap-3 text-sm">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <span
                  className={`
                  ${i + 1 === step ? 'text-white font-bold' : 'text-zinc-600'}
                  ${i + 1 < step ? 'text-zinc-400' : ''}
                `}
                >
                  {s}
                </span>
                {i < steps.length - 1 && (
                  <span className="text-zinc-700 mx-2">›</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {onNext && (
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-black px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-1.5 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
