import { useState } from 'react';
import { RefreshCw, Search, CheckCircle2 } from 'lucide-react';
import { AssetGroup, ScriptSegment } from '@/types';
import { searchAssets } from '@/lib/api';

interface Step3Props {
  script: ScriptSegment[];
  assets: AssetGroup[];
  setAssets: (assets: AssetGroup[]) => void;
  setScript: (script: ScriptSegment[]) => void;
}

export default function Step3_Assets({ script, assets, setAssets, setScript }: Step3Props) {
  const [loadingIndices, setLoadingIndices] = useState<number[]>([]);

  // 개별 씬 키워드 수정 및 재검색
  const handleRefreshAsset = async (index: number, newKeyword: string) => {
    if (!newKeyword) return;
    
    // 로딩 상태 설정
    setLoadingIndices(prev => [...prev, index]);
    
    try {
      // 키워드 업데이트 (대본에도 반영)
      const newScript = [...script];
      newScript[index].imageKeyword = newKeyword;
      setScript(newScript);

      // API 호출
      const res = await searchAssets([newKeyword]);
      const newImages = res.results[0].images;

      // Assets 업데이트
      const newAssets = [...assets];
      newAssets[index] = {
        keyword: newKeyword,
        images: newImages,
        selectedImage: newImages[0] // 첫 번째 이미지 자동 선택
      };
      setAssets(newAssets);

    } catch (error) {
      console.error(error);
      alert('이미지 검색에 실패했습니다.');
    } finally {
      setLoadingIndices(prev => prev.filter(i => i !== index));
    }
  };

  const handleSelectImage = (groupIndex: number, imageUrl: string) => {
    const newAssets = [...assets];
    newAssets[groupIndex].selectedImage = imageUrl;
    setAssets(newAssets);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {script.map((segment, index) => {
        const assetGroup = assets[index];
        const isLoading = loadingIndices.includes(index);
        
        // assetGroup이 없을 경우 (씬이 추가되었는데 아직 검색 안 함) - 예외 처리
        if (!assetGroup) return (
            <div key={index} className="text-zinc-500">Scene {index + 1}: 이미지를 불러오는 중...</div>
        );

        return (
          <div key={index} className="space-y-4 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 md:p-8">
            {/* Header: Text & Keyword Search */}
            <div className="flex flex-col md:flex-row md:items-start gap-6 justify-between">
              <div className="flex items-start gap-4 flex-1">
                <span className="bg-zinc-800 text-zinc-400 text-xs font-mono px-2 py-1 rounded mt-1 shrink-0">
                  Scene {index + 1}
                </span>
                <p className="text-lg font-medium text-zinc-200 leading-relaxed break-keep">
                  "{segment.text}"
                </p>
              </div>

              {/* Keyword Search Bar */}
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-full px-4 py-2 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all w-full md:w-auto md:min-w-[300px]">
                <Search className="w-4 h-4 text-zinc-500" />
                <input 
                  type="text"
                  defaultValue={assetGroup.keyword}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRefreshAsset(index, e.currentTarget.value);
                    }
                  }}
                  className="bg-transparent border-none focus:outline-none text-sm text-zinc-200 w-full placeholder:text-zinc-600"
                  placeholder="검색어 변경 후 Enter..."
                />
                <button 
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    handleRefreshAsset(index, input.value);
                  }}
                  disabled={isLoading}
                  className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {assetGroup.images.map((imgUrl, imgIdx) => (
                <div 
                  key={imgIdx}
                  onClick={() => handleSelectImage(index, imgUrl)}
                  className={`
                    relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300
                    ${assetGroup.selectedImage === imgUrl 
                      ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-zinc-900 scale-[1.02] shadow-xl shadow-purple-900/20 z-10' 
                      : 'opacity-60 hover:opacity-100 hover:scale-[1.02] hover:z-10 bg-zinc-800'
                    }
                  `}
                >
                  <img 
                    src={imgUrl} 
                    alt={`Candidate ${imgIdx}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {assetGroup.selectedImage === imgUrl && (
                    <div className="absolute inset-0 bg-purple-500/10 flex items-center justify-center">
                      <div className="bg-purple-600 rounded-full p-1.5 shadow-lg animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Empty/Loading State Placeholders if less than 4 images */}
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <div key={`loading-${i}`} className="aspect-[9/16] rounded-xl bg-zinc-800 animate-pulse" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
