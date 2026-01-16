'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ScriptSegment, AssetGroup } from '@/types';
import { searchAssets, renderVideo } from '@/lib/api';

// Components
import Step1_Topic from '@/components/steps/Step1_Topic';
import Step2_Script from '@/components/steps/Step2_Script';
import Step3_Assets from '@/components/steps/Step3_Assets';
import Step4_Render from '@/components/steps/Step4_Render';
import StickyHeader from '@/components/common/StickyHeader';
import SettingsModal from '@/components/common/SettingsModal';

export default function ShortCreator() {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState<ScriptSegment[]>([]);
  const [assets, setAssets] = useState<AssetGroup[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [defaultProvider, setDefaultProvider] = useState('pexels');

  // Load default provider
  useEffect(() => {
    const saved = localStorage.getItem('shorts-creator-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.defaultProvider) setDefaultProvider(parsed.defaultProvider);
    }
  }, [isSettingsOpen]); // 설정 닫힐 때 업데이트

  // Loading Helper
  const handleSetLoading = (isLoading: boolean, text: string) => {
    setLoading(isLoading);
    setLoadingText(text);
  };

  // Step 1 -> 2
  const handleDraftCreated = (newTopic: string, newScript: ScriptSegment[]) => {
    setTopic(newTopic);
    setScript(newScript);
    setStep(2);
  };

  // Step 2 -> 3
  const handleGoToAssets = async () => {
    handleSetLoading(
      true,
      `${defaultProvider === 'pexels' ? 'Pexels' : '이미지 소스'}에서 짤방을 찾고 있습니다...`,
    );
    try {
      const keywords = script.map((s) => s.imageKeyword);
      // 초기 검색은 defaultProvider 사용
      const res = await searchAssets(keywords, defaultProvider);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newAssets: AssetGroup[] = res.results.map((r: any) => ({
        keyword: r.keyword,
        images: r.images,
        selectedImage: r.images[0],
      }));

      setAssets(newAssets);
      setStep(3);
    } catch (error) {
      console.error(error);
      alert('이미지 검색에 실패했습니다.');
    } finally {
      handleSetLoading(false, '');
    }
  };

  // Step 3 -> 4
  const handleStartRender = async () => {
    handleSetLoading(true, '영상 렌더링을 시작합니다...');
    try {
      const assetUrls = assets.map(
        (group) => group.selectedImage || group.images[0],
      );

      // 설정 로드
      let mockTtsSpeed = 1.0;
      let titleFont = 'Pretendard-ExtraBold.ttf';
      let subtitleFont = 'Pretendard-Bold.ttf';
      let bgmFile = 'bgm2.mp3';

      const savedSettings = localStorage.getItem('shorts-creator-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.mockTtsSpeed) mockTtsSpeed = parsed.mockTtsSpeed;
        if (parsed.titleFont) titleFont = parsed.titleFont;
        if (parsed.subtitleFont) subtitleFont = parsed.subtitleFont;
        if (parsed.bgmFile) bgmFile = parsed.bgmFile;
      }

      const res = await renderVideo(topic, script, assetUrls, {
        mockTtsSpeed,
        titleFont,
        subtitleFont,
        bgmFile,
      });
      setJobId(res.jobId);
      setStep(4);
    } catch (error) {
      console.error(error);
      alert('렌더링 요청에 실패했습니다.');
    } finally {
      handleSetLoading(false, '');
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500/30">
      {/* Sticky Header (Visible from Step 2) */}
      {step > 1 && step < 4 && (
        <StickyHeader
          step={step}
          onBack={() => setStep(step - 1)}
          onNext={step === 2 ? handleGoToAssets : handleStartRender}
          nextLabel={step === 2 ? '짤방 선택' : '영상 만들기'}
        />
      )}

      {/* Main Content */}
      <div className={step === 1 ? 'container mx-auto px-4' : ''}>
        {step === 1 && (
          <Step1_Topic
            onNext={handleDraftCreated}
            setLoading={handleSetLoading}
            isLoading={loading}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {step === 2 && (
          <Step2_Script
            script={script}
            setScript={setScript}
            topic={topic}
            setTopic={setTopic}
          />
        )}

        {step === 3 && (
          <Step3_Assets
            script={script}
            setScript={setScript}
            assets={assets}
            setAssets={setAssets}
            defaultProvider={defaultProvider}
          />
        )}

        {step === 4 && jobId && (
          <Step4_Render
            jobId={jobId}
            onReset={() => window.location.reload()}
          />
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <Loader2 className="w-16 h-16 text-white animate-spin mb-6" />
          <p className="text-xl font-medium text-white">{loadingText}</p>
        </div>
      )}
    </main>
  );
}
