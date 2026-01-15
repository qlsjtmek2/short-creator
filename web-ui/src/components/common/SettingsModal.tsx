import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState({
    geminiKey: '',
    pexelsKey: '',
    elevenLabsKey: '',
    defaultProvider: 'pexels'
  });

  useEffect(() => {
    // Load from localStorage
    const savedSettings = localStorage.getItem('shorts-creator-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('shorts-creator-settings', JSON.stringify(settings));
    onClose();
    // In a real app, you might want to trigger a re-fetch or context update
    alert('설정이 저장되었습니다. (API Key는 서버가 아닌 브라우저에 저장됩니다)');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">설정</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">API Keys</h3>
            
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Gemini API Key</label>
              <input 
                type="password" 
                value={settings.geminiKey}
                onChange={e => setSettings({...settings, geminiKey: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="AI Studio API Key"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Pexels API Key</label>
              <input 
                type="password" 
                value={settings.pexelsKey}
                onChange={e => setSettings({...settings, pexelsKey: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Pexels API Key"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-300">ElevenLabs API Key (Optional)</label>
              <input 
                type="password" 
                value={settings.elevenLabsKey}
                onChange={e => setSettings({...settings, elevenLabsKey: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="ElevenLabs API Key"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Preferences</h3>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">기본 이미지 소스</label>
              <select 
                value={settings.defaultProvider}
                onChange={e => setSettings({...settings, defaultProvider: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors text-white"
              >
                <option value="pexels">Pexels (고화질 사진)</option>
                <option value="reddit">Reddit (밈/유머)</option>
                {/* <option value="tenor">Tenor (GIF)</option> */}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
