import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Download, AlertCircle, Video } from 'lucide-react';
import { checkJobStatus, JobStatus } from '@/lib/api';

interface Step4Props {
  jobId: string;
  onReset: () => void;
}

export default function Step4_Render({ jobId, onReset }: Step4Props) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  // Polling logic moved here to keep page.tsx clean
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (jobId && (!jobStatus || jobStatus.status === 'processing')) {
      // Initial check
      checkJobStatus(jobId).then(setJobStatus).catch(console.error);

      intervalId = setInterval(async () => {
        try {
          const status = await checkJobStatus(jobId);
          setJobStatus(status);
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error('Failed to poll job status:', error);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, jobStatus]); // jobStatus dependency added to stop polling when done

  if (!jobStatus || jobStatus.status === 'processing') {
    return (
      <div className="text-center py-20 animate-in fade-in duration-500">
        <div className="inline-block relative mb-8">
          <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative z-10 bg-zinc-900 rounded-full p-6 ring-1 ring-zinc-800">
            <Video className="w-12 h-12 text-zinc-500" />
            <Loader2 className="w-12 h-12 text-purple-500 absolute top-6 left-6 -translate-x-1/2 -translate-y-1/2 animate-spin" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          영상을 만들고 있습니다
        </h2>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
          AI가 대본을 읽고, 자막을 입히고, 영상을 합성하고 있습니다.<br/>
          잠시만 기다려주세요. (약 1-2분 소요)
        </p>
        
        <div className="w-full max-w-xs mx-auto bg-zinc-800 rounded-full h-1.5 overflow-hidden mb-6">
          <div className="bg-purple-600 h-full w-1/3 animate-pulse rounded-full shadow-[0_0_10px_rgba(147,51,234,0.5)]"></div>
        </div>
        <p className="text-xs text-zinc-600 font-mono">Job ID: {jobId}</p>
      </div>
    );
  }

  if (jobStatus.status === 'completed') {
    return (
      <div className="text-center py-10 animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto">
        <div className="inline-block relative mb-8">
          <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20"></div>
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto ring-1 ring-green-500/20">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4 text-white">영상 제작 완료!</h2>
        <p className="text-zinc-400 mb-10">
          쇼츠 영상이 성공적으로 생성되었습니다.
        </p>
        
        {jobStatus.resultUrl && (
          <div className="space-y-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="aspect-[9/16] max-h-[600px] mx-auto bg-black rounded-lg overflow-hidden shadow-2xl">
              <video 
                src={`http://127.0.0.1:3001${jobStatus.resultUrl}`} 
                controls 
                className="w-full h-full object-contain"
                autoPlay
                loop
                muted
              />
            </div>
            <a 
              href={`http://127.0.0.1:3001${jobStatus.resultUrl}`}
              download
              className="block w-full bg-white hover:bg-zinc-200 text-black px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              영상 다운로드
            </a>

            <button 
              onClick={onReset}
              className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-md"
            >
              새로운 쇼츠 만들기
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-20 animate-in fade-in duration-500">
      <div className="inline-block relative mb-8">
        <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20"></div>
        <AlertCircle className="w-20 h-20 text-red-500 relative z-10" />
      </div>
      <h2 className="text-3xl font-bold mb-4 text-red-500">렌더링 실패</h2>
      <p className="text-zinc-400 mb-8 max-w-md mx-auto">
        영상 생성 중 오류가 발생했습니다.<br/>
        <span className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 px-3 py-1.5 rounded mt-4 inline-block font-mono">
          Error: {jobStatus.error}
        </span>
      </p>
      <button 
        onClick={onReset} // In a real app, maybe go back to Step 3
        className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
      >
        다시 시도하기
      </button>
    </div>
  );
}
