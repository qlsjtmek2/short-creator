import { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Search, Film, Smile, Settings as SettingsIcon, Key, Zap, Check, ExternalLink } from 'lucide-react';
import { checkServerConfig } from '@/lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS = [
  { id: 'pexels', name: 'Pexels', desc: '고화질 사진', icon: ImageIcon },
  { id: 'google', name: 'Google', desc: '웹 이미지 검색', icon: Search },
  { id: 'reddit', name: 'Reddit', desc: '해외 밈/유머', icon: Smile },
  { id: 'klipy', name: 'Klipy', desc: 'GIF 애니메이션', icon: Film },
  { id: 'imgflip', name: 'Imgflip', desc: '밈 템플릿', icon: Smile },
];

const GEMINI_MODELS = [
  { id: 'gemini-3.0-pro', name: 'Gemini 3.0 Pro (High Perf)' },
  { id: 'gemini-3.0-flash', name: 'Gemini 3.0 Flash (Fastest)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Stable High)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Balanced)' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite (Efficient)' },
];

const TONES = [
  { id: 'humorous', name: '유머러스 (재미/드립)' },
  { id: 'serious', name: '진지함 (다큐/정보)' },
  { id: 'horror', name: '공포 (미스터리/기괴)' },
  { id: 'emotional', name: '감동 (힐링/위로)' },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'keys' | 'advanced'>('general');
  const [serverConfig, setServerConfig] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState({
    // General
    defaultProvider: 'pexels',
    
    // API Keys
    geminiKey: '',
    pexelsKey: '',
    elevenLabsKey: '',
    googleSearchKey: '',
    googleSearchCx: '',
    klipyKey: '',
    typecastKey: '',
    typecastActorId: '',
    imgflipUsername: '',
    imgflipPassword: '',
    
    // Advanced - AI
    geminiModel: 'gemini-2.0-flash',
    systemPrompt: '당신은 유튜브 쇼츠 대본 작가입니다. 흥미롭고 자극적인 내용을 짧고 굵게 작성하세요.',
    userPromptTemplate: '주제: {topic}\n\n위 주제로 쇼츠 영상을 만들기 위한 대본을 작성해줘. 3-4개의 문단으로 나누고, 각 문단에 어울리는 이미지 검색 키워드(영어)를 함께 적어줘.',
    
    // Advanced - Config
    titleMaxLength: 20,
    tone: 'humorous',
    
    // Config - Mock TTS
    mockTtsSpeed: 1.0,
  });

  useEffect(() => {
    // 1. Load Local Settings
    const savedSettings = localStorage.getItem('shorts-creator-settings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }

    // 2. Check Server Config
    if (isOpen) {
      checkServerConfig().then(setServerConfig).catch(console.error);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('shorts-creator-settings', JSON.stringify(settings));
    onClose();
  };

  if (!isOpen) return null;

  const TabButton = ({
    id,
    label,
    icon: Icon,
  }: {
    id: typeof activeTab;
    label: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id 
          ? 'border-purple-500 text-purple-400' 
          : 'border-transparent text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  // Status Badge Component
  const StatusBadge = ({ configured, label = 'Server Configured' }: { configured: boolean, label?: string }) => {
    if (!configured) return null;
    return (
      <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">
        <Check className="w-3 h-3" />
        {label}
      </span>
    );
  };

  // API Key Link Component
  const ApiLink = ({ href }: { href: string }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-[10px] text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 mt-1 ml-1 w-fit"
    >
      키 발급받기 <ExternalLink className="w-2.5 h-2.5" />
    </a>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">설정</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-zinc-800 bg-zinc-900/50">
          <TabButton id="general" label="기본 설정" icon={SettingsIcon} />
          <TabButton id="keys" label="API 키 관리" icon={Key} />
          <TabButton id="advanced" label="고급 설정" icon={Zap} />
        </div>
        
        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* --- TAB: GENERAL --- */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">기본 이미지 소스</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROVIDERS.map(provider => (
                    <label 
                      key={provider.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${settings.defaultProvider === provider.id
                          ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/20'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="defaultProvider"
                        value={provider.id}
                        checked={settings.defaultProvider === provider.id}
                        onChange={(e) => setSettings({...settings, defaultProvider: e.target.value})}
                        className="hidden"
                      />
                      <div className={`p-2 rounded-full ${settings.defaultProvider === provider.id ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                        <provider.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-200">{provider.name}</div>
                        <div className="text-xs text-zinc-500">{provider.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: API KEYS --- */}
          {activeTab === 'keys' && (
            <div className="space-y-8">
              {/* AI & Search */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2">AI & Search</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-zinc-300">Gemini API Key</label>
                    <StatusBadge configured={serverConfig.gemini} />
                  </div>
                  <input 
                    type="password" 
                    value={settings.geminiKey}
                    onChange={e => setSettings({...settings, geminiKey: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder={serverConfig.gemini ? "서버 환경변수 사용 중 (.env)" : "API Key를 입력하세요"}
                  />
                  <ApiLink href="https://aistudio.google.com/apikey" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-zinc-300">Pexels API Key</label>
                      <StatusBadge configured={serverConfig.pexels} label="Env" />
                    </div>
                    <input 
                      type="password" 
                      value={settings.pexelsKey}
                      onChange={e => setSettings({...settings, pexelsKey: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder={serverConfig.pexels ? "서버 값 사용 중" : "입력 필요"}
                    />
                    <ApiLink href="https://www.pexels.com/api/" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-zinc-300">Klipy API Key</label>
                      <StatusBadge configured={serverConfig.klipy} label="Env" />
                    </div>
                    <input 
                      type="password" 
                      value={settings.klipyKey}
                      onChange={e => setSettings({...settings, klipyKey: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder={serverConfig.klipy ? "서버 값 사용 중" : "입력 필요"}
                    />
                    <ApiLink href="https://partner.klipy.com" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-zinc-300">Google Search Key</label>
                      <StatusBadge configured={serverConfig.google} label="Env" />
                    </div>
                    <input 
                      type="password" 
                      value={settings.googleSearchKey}
                      onChange={e => setSettings({...settings, googleSearchKey: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder={serverConfig.google ? "서버 값 사용 중" : "입력 필요"}
                    />
                    <ApiLink href="https://console.cloud.google.com/apis/credentials" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-zinc-300">Google Search CX</label>
                      <StatusBadge configured={serverConfig.google} label="Env" />
                    </div>
                    <input 
                      type="text" 
                      value={settings.googleSearchCx}
                      onChange={e => setSettings({...settings, googleSearchCx: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder={serverConfig.google ? "서버 값 사용 중" : "입력 필요"}
                    />
                    <ApiLink href="https://programmablesearchengine.google.com/" />
                  </div>
                </div>
              </div>

              {/* TTS */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2">TTS (Voice)</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-zinc-300">ElevenLabs API Key</label>
                    <StatusBadge configured={serverConfig.elevenlabs} label="Env" />
                  </div>
                  <input 
                    type="password" 
                    value={settings.elevenLabsKey}
                    onChange={e => setSettings({...settings, elevenLabsKey: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder={serverConfig.elevenlabs ? "서버 값 사용 중" : "입력 필요"}
                  />
                  <ApiLink href="https://elevenlabs.io/app/settings/api-keys" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-zinc-300">Typecast API Key</label>
                      <StatusBadge configured={serverConfig.typecast} label="Env" />
                    </div>
                    <input 
                      type="password" 
                      value={settings.typecastKey}
                      onChange={e => setSettings({...settings, typecastKey: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder={serverConfig.typecast ? "서버 값 사용 중" : "입력 필요"}
                    />
                    <ApiLink href="https://typecast.ai/dashboard" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-zinc-300">Typecast Actor ID</label>
                      <StatusBadge configured={serverConfig.typecast} label="Env" />
                    </div>
                    <input 
                      type="text" 
                      value={settings.typecastActorId}
                      onChange={e => setSettings({...settings, typecastActorId: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder={serverConfig.typecast ? "서버 값 사용 중" : "입력 필요"}
                    />
                  </div>
                </div>

                {/* Mock TTS Speed */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <div className="flex justify-between text-sm text-zinc-300">
                    <label>Mock TTS Speed</label>
                    <span className="font-mono text-purple-400">x{settings.mockTtsSpeed?.toFixed(1) || '1.0'}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3.0" 
                    step="0.1" 
                    value={settings.mockTtsSpeed || 1.0}
                    onChange={e => setSettings({...settings, mockTtsSpeed: parseFloat(e.target.value)})
                    }
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <p className="text-xs text-zinc-500">
                    * API 키가 없을 때 사용되는 가상 음성의 속도입니다. (1.0 = 표준)
                  </p>
                </div>
              </div>

              {/* Other Services */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2">Other Services</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-zinc-300">Imgflip Username</label>
                      <StatusBadge configured={serverConfig.imgflip} label="Env" />
                    </div>
                    <input 
                      type="text" 
                      value={settings.imgflipUsername}
                      onChange={e => setSettings({...settings, imgflipUsername: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder={serverConfig.imgflip ? "서버 값 사용 중" : "입력 필요"}
                    />
                    <ApiLink href="https://imgflip.com/signup" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-zinc-300">Imgflip Password</label>
                      <StatusBadge configured={serverConfig.imgflip} label="Env" />
                    </div>
                    <input 
                      type="password" 
                      value={settings.imgflipPassword}
                      onChange={e => setSettings({...settings, imgflipPassword: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder={serverConfig.imgflip ? "서버 값 사용 중" : "입력 필요"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-zinc-300">Reddit Client ID (Optional)</label>
                  </div>
                  <input 
                    type="password" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Reddit Script App Client ID"
                  />
                  <ApiLink href="https://www.reddit.com/prefs/apps" />
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: ADVANCED --- */}
          {activeTab === 'advanced' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Gemini Model</h3>
                <div className="space-y-2">
                  {GEMINI_MODELS.map(model => (
                    <label key={model.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer">
                      <input
                        type="radio"
                        name="geminiModel"
                        value={model.id}
                        checked={settings.geminiModel === model.id}
                        onChange={(e) => setSettings({...settings, geminiModel: e.target.value})}
                        className="text-purple-500 focus:ring-purple-500 bg-zinc-900 border-zinc-700"
                      />
                      <span className="text-zinc-200">{model.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-zinc-300">
                  <label>Temperature (창의성)</label>
                  <span className="font-mono text-purple-400">{settings.temperature ?? 0.7}</span>
                </div>
                <input 
                  type="range" 
                  min="0.0" 
                  max="1.0" 
                  step="0.1" 
                  value={settings.temperature ?? 0.7}
                  onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-xs text-zinc-500">
                  * 높을수록 창의적이고 예측 불가능한 답변이 나옵니다. (0.0 ~ 1.0)
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Prompt & Content</h3>
                
                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">톤 (Tone)</label>
                  <select 
                    value={settings.tone}
                    onChange={e => setSettings({...settings, tone: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors text-white"
                  >
                    {TONES.map(tone => (
                      <option key={tone.id} value={tone.id}>{tone.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">제목 최대 길이 (Title Max Length)</label>
                  <input 
                    type="number"
                    value={settings.titleMaxLength}
                    onChange={e => setSettings({...settings, titleMaxLength: parseInt(e.target.value)})
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">System Prompt</label>
                  <textarea
                    value={settings.systemPrompt}
                    onChange={e => setSettings({...settings, systemPrompt: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm leading-relaxed focus:outline-none focus:border-purple-500 transition-colors min-h-[100px]"
                    placeholder="AI 시스템 지침..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">User Prompt Template</label>
                  <textarea
                    value={settings.userPromptTemplate}
                    onChange={e => setSettings({...settings, userPromptTemplate: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm leading-relaxed focus:outline-none focus:border-purple-500 transition-colors min-h-[100px]"
                    placeholder="{topic} 변수가 포함되어야 합니다."
                  />
                  <p className="text-xs text-zinc-500">* {'{topic}'} 부분에 사용자가 입력한 주제가 들어갑니다.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex justify-end bg-zinc-900 rounded-b-2xl">
          <button 
            onClick={handleSave}
            className="bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-lg"
          >
            <Save className="w-4 h-4" />
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}