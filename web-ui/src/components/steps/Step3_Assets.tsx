import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  CheckCircle2,
  Image as ImageIcon,
  Smile,
  Film,
} from 'lucide-react';
import { AssetGroup, ScriptSegment } from '@/types';
import { searchAssets } from '@/lib/api';

interface Step3Props {
  script: ScriptSegment[];
  assets: AssetGroup[];
  setAssets: (assets: AssetGroup[]) => void;
  setScript: (script: ScriptSegment[]) => void;
  defaultProvider: string;
}

const PROVIDERS = [
  { id: 'pexels', name: 'Pexels (사진)', icon: ImageIcon },
  { id: 'google', name: 'Google (검색)', icon: Search },
  { id: 'klipy', name: 'Klipy (GIF)', icon: Film },
  { id: 'reddit', name: 'Reddit (밈)', icon: Smile },
  { id: 'imgflip', name: 'Imgflip (짤방)', icon: Smile },
];

export default function Step3_Assets({
  script,
  assets,
  setAssets,
  setScript,
  defaultProvider,
}: Step3Props) {
  const [loadingIndices, setLoadingIndices] = useState<number[]>([]);
  // 각 씬별 선택된 Provider 상태 관리 (초기값: defaultProvider)
  const [sceneProviders, setSceneProviders] = useState<Record<number, string>>(
    {},
  );

  // 초기화
  useEffect(() => {
    const initialProviders: Record<number, string> = {};
    script.forEach((_, idx) => {
      initialProviders[idx] = defaultProvider;
    });
    setSceneProviders(initialProviders);
  }, [script.length, defaultProvider]);

  const handleProviderChange = (index: number, provider: string) => {
    setSceneProviders((prev) => ({ ...prev, [index]: provider }));
  };

  // 개별 씬 키워드 수정 및 재검색
  const handleRefreshAsset = async (index: number, newKeyword: string) => {
    if (!newKeyword) return;

    // 로딩 상태 설정
    setLoadingIndices((prev) => [...prev, index]);
    const currentProvider = sceneProviders[index] || defaultProvider;

    try {
      // 키워드 업데이트 (대본에도 반영)
      const newScript = [...script];
      newScript[index].imageKeyword = newKeyword;
      setScript(newScript);

      // API 호출 (Provider 지정)
      const res = await searchAssets([newKeyword], currentProvider);
      const newImages = res.results[0].images;

      // Assets 업데이트
      const newAssets = [...assets];
      newAssets[index] = {
        keyword: newKeyword,
        images: newImages,
        selectedImage: newImages[0], // 첫 번째 이미지 자동 선택
      };
      setAssets(newAssets);
    } catch (error) {
      console.error(error);
      alert('이미지 검색에 실패했습니다.');
    } finally {
      setLoadingIndices((prev) => prev.filter((i) => i !== index));
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
        const currentProvider = sceneProviders[index] || defaultProvider;

        if (!assetGroup)
          return (
            <div key={index} className="text-zinc-500">
              Scene {index + 1}: 이미지를 불러오는 중...
            </div>
          );

        return (
          <div
            key={index}
            className="space-y-4 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 md:p-8"
          >
            {/* Header: Text & Controls */}
            <div className="flex flex-col md:flex-row md:items-start gap-6 justify-between">
              <div className="flex items-start gap-4 flex-1">
                <span className="bg-zinc-800 text-zinc-400 text-xs font-mono px-2 py-1 rounded mt-1 shrink-0">
                  Scene {index + 1}
                </span>
                <p className="text-lg font-medium text-zinc-200 leading-relaxed break-keep">
                  "{segment.text}"
                </p>
              </div>

              {/* Controls: Provider Select + Keyword Input */}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                {/* Provider Selector */}
                <div className="relative">
                  <select
                    value={currentProvider}
                    onChange={(e) =>
                      handleProviderChange(index, e.target.value)
                    }
                    className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 pr-8 text-sm focus:outline-none focus:border-purple-500/50 text-zinc-300 w-full sm:w-auto h-full cursor-pointer hover:bg-zinc-900 transition-colors"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>

                {/* Keyword Search Bar */}
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all w-full md:min-w-[250px]">
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
                    placeholder="검색어..."
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget
                        .previousSibling as HTMLInputElement;
                      handleRefreshAsset(index, input.value);
                    }}
                    disabled={isLoading}
                    className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
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
                    ${
                      assetGroup.selectedImage === imgUrl
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
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`loading-${i}`}
                    className="aspect-[9/16] rounded-xl bg-zinc-800 animate-pulse"
                  />
                ))}

              {!isLoading && assetGroup.images.length === 0 && (
                <div className="col-span-2 md:col-span-4 py-8 text-center text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>이미지를 찾을 수 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
