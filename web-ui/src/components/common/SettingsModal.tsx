import { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Search, Film, Smile, Settings as SettingsIcon, Zap, Film as VideoIcon, RotateCcw, Palette, Type, Sparkles, Volume2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 기본 프롬프트 (prompts.json의 storytelling 기본값)
const DEFAULT_PROMPTS = {
  systemPrompt: '너는 디시인사이드, 펨코 같은 커뮤니티에서 활동하는 \'드립력 만렙\' 썰쟁이야. 뻔한 정보도 네가 말하면 개꿀잼 썰이 됨. 점잖은 척, 설명충 빙의 절대 금지. 친구한테 술자리에서 썰 풀듯이 시니컬하고 찰지게 \'음슴체\'로 말해. 과장 섞인 비유, 인터넷 드립, 현실적인 짜증을 적절히 섞어서 도파민 터지게 만드는 게 네 유일한 임무임.',
  userPromptTemplate: '"{topic}" 주제로 쇼츠 대본 좀 짜줘. 아래 가이드를 완벽하게 따라서 작성해.\n\n[제목 작성 지침]:\n- 본문은 거칠고 찰지게 써도 되지만, **제목은 간결하고 깔끔한 호기심 유발형**으로 지어야 함.\n- \'~~하는 이유\', \'~~의 충격적인 비밀\', \'~~가 벌어지는 과학적 원리\' 같은 정갈한 스타일 추천.\n- 강조할 핵심 키워드 양옆에 *표시 필수 (예: *우주*에서 *고기 냄새*가 나는 이유).\n\n[본문 작성 지침]:\n1. **말투**: 무조건 \'음슴체\'나 반말 (~함, ~임, ~냐고, ~셈). 존댓말/설명조 나오면 바로 탈락임.\n2. **표현**: \'전자를 잃습니다\' (X) -> \'니트가 니 몸뚱아리 전자를 삥 뜯어감\' (O). 눈에 그려지는 **\'구체적이고 과격한 비유\'**를 써.\n3. **문장 길이**: 억지로 짧게 쓰려고 하지 마. 드립 치고 빌드업 하려면 길게 써도 됨. 편집자가 자막은 알아서 쪼개줄 거임.\n\n[출력 형식 (JSON Only)]:\n{\n  "title": "제목",\n  "sentences": [\n    { "text": "문장 내용", "keyword": "시각적 묘사를 위한 구체적인 영문 키워드" },\n    ...\n  ]\n}',
};

const PROVIDERS = [
  { id: 'pexels', name: 'Pexels', desc: '고화질 사진', icon: ImageIcon },
  { id: 'google', name: 'Google', desc: '웹 이미지 검색', icon: Search },
  { id: 'reddit', name: 'Reddit', desc: '해외 밈/유머', icon: Smile },
  { id: 'klipy', name: 'Klipy', desc: 'GIF 애니메이션', icon: Film },
  { id: 'imgflip', name: 'Imgflip', desc: '밈 템플릿', icon: Smile },
];

const GEMINI_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (최신, 최고 성능)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash (빠르고 저렴)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (안정적 고성능)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (균형잡힌)' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite (경량)' },
];

const TONES = [
  { id: 'humorous', name: '유머러스 (재미/드립)' },
  { id: 'serious', name: '진지함 (다큐/정보)' },
  { id: 'horror', name: '공포 (미스터리/기괴)' },
  { id: 'emotional', name: '감동 (힐링/위로)' },
];

// Color Picker Component
const ColorPicker = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) => (
  <div className="space-y-2">
    <label className="text-sm text-zinc-300">{label}</label>
    <div className="flex gap-2 items-center">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 bg-zinc-950 border border-zinc-800 rounded cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors font-mono"
        placeholder="#FFFFFF"
      />
    </div>
  </div>
);

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'canvas' | 'text' | 'effects' | 'audio'>('general');
  const [settings, setSettings] = useState({
    // General
    defaultProvider: 'pexels',
    mockTtsSpeed: 1.0,

    // AI Settings
    geminiModel: 'gemini-3-pro-preview',
    temperature: 0.7,
    systemPrompt: DEFAULT_PROMPTS.systemPrompt,
    userPromptTemplate: DEFAULT_PROMPTS.userPromptTemplate,
    titleMaxLength: 25,
    sentenceCount: 8,
    sentenceMaxLength: 100,
    tone: 'humorous',

    // Canvas & Layout
    canvasWidth: 1080,
    canvasHeight: 1920,
    letterboxTop: 350,
    letterboxBottom: 350,
    letterboxColor: '#000000',

    // Title Settings
    titleFontSize: 100,
    titleFontColor: '#FFFFFF',
    titleHighlightColor: '#FFDB58',
    titleY: 150,
    titleBorderWidth: 2,
    titleBorderColor: '#000000',
    titleMaxCharsPerLine: 15,
    titleLineSpacing: 120,

    // Subtitle Settings
    subtitleFontSize: 100,
    subtitlePrimaryColor: '&H00FFFFFF',
    subtitleOutlineColor: '&H00000000',
    subtitleBackColor: '&H00000000',
    subtitleOutline: 8,
    subtitleShadow: 4,
    subtitleAlignment: 2,
    subtitleMarginV: 500,
    subtitleMaxCharsPerLine: 15,

    // Subtitle Wrapping
    subtitleWrappingEnabled: true,
    subtitleMarginL: 100,
    subtitleMarginR: 100,
    subtitleSafetyPadding: 40,
    subtitleMaxScalePercent: 120,
    subtitleFallbackCharsPerLine: 13,

    // Subtitle Animation
    subtitlePopInDuration: 100,
    subtitleScaleUpStart: 0,
    subtitleScaleUpEnd: 110,
    subtitleScaleDownStart: 0,
    subtitleScaleDownEnd: 0,
    subtitleFinalScale: 120,

    // Ken Burns Effect
    kenBurnsStartZoom: 1.0,
    kenBurnsEndZoom: 1.2,
    kenBurnsZoomIncrement: 0.0001,
    kenBurnsFps: 60,

    // Audio Settings
    ttsVolume: 1.0,
    bgmVolume: 0.10,

    // Rendering Settings
    videoCodec: 'libx264',
    preset: 'medium',
    crf: 23,
    pixelFormat: 'yuv420p',
    audioCodec: 'aac',
    audioBitrate: '192k',
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('shorts-creator-settings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('shorts-creator-settings', JSON.stringify(settings));
    onClose();
  };

  const handleResetPrompts = () => {
    if (confirm('프롬프트를 기본값으로 복구하시겠습니까?')) {
      setSettings({
        ...settings,
        systemPrompt: DEFAULT_PROMPTS.systemPrompt,
        userPromptTemplate: DEFAULT_PROMPTS.userPromptTemplate,
      });
    }
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
      className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === id
          ? 'border-purple-500 text-purple-400'
          : 'border-transparent text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">설정</h2>
            <p className="text-xs text-zinc-500 mt-1">API 키는 .env 파일에서 관리됩니다</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto">
          <TabButton id="general" label="기본" icon={SettingsIcon} />
          <TabButton id="ai" label="AI" icon={Zap} />
          <TabButton id="canvas" label="캔버스" icon={VideoIcon} />
          <TabButton id="text" label="텍스트" icon={Type} />
          <TabButton id="effects" label="효과" icon={Sparkles} />
          <TabButton id="audio" label="오디오" icon={Volume2} />
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

              {/* Mock TTS Speed */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-zinc-300">
                  <label>Mock TTS 속도 (API 키 없을 때)</label>
                  <span className="font-mono text-purple-400">x{settings.mockTtsSpeed?.toFixed(1) || '1.0'}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={settings.mockTtsSpeed || 1.0}
                  onChange={e => setSettings({...settings, mockTtsSpeed: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-xs text-zinc-500">
                  * TTS API 키가 없을 때 사용되는 가상 음성의 속도입니다.
                </p>
              </div>
            </div>
          )}

          {/* --- TAB: AI SETTINGS --- */}
          {activeTab === 'ai' && (
            <div className="space-y-8">
              {/* Gemini Model */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Gemini 모델</h3>
                <div className="space-y-2">
                  {GEMINI_MODELS.map(model => (
                    <label key={model.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors">
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

              {/* Temperature */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-zinc-300">
                  <label>Temperature (창의성)</label>
                  <span className="font-mono text-purple-400">{settings.temperature ?? 0.7}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={settings.temperature ?? 0.7}
                  onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-xs text-zinc-500">
                  * 높을수록 창의적이고 예측 불가능한 답변. 낮을수록 일관되고 정확한 답변. (0.0 ~ 2.0)
                </p>
              </div>

              {/* Tone */}
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

              {/* Content Length Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">콘텐츠 길이 설정</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">제목 최대 길이</label>
                    <input
                      type="number"
                      value={settings.titleMaxLength}
                      onChange={e => setSettings({...settings, titleMaxLength: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">문장 개수</label>
                    <input
                      type="number"
                      value={settings.sentenceCount}
                      onChange={e => setSettings({...settings, sentenceCount: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">문장 최대 길이</label>
                    <input
                      type="number"
                      value={settings.sentenceMaxLength}
                      onChange={e => setSettings({...settings, sentenceMaxLength: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Prompts Section */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">프롬프트 커스터마이징</h3>
                  <button
                    onClick={handleResetPrompts}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    기본값 복구
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">System Prompt</label>
                  <textarea
                    value={settings.systemPrompt}
                    onChange={e => setSettings({...settings, systemPrompt: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm leading-relaxed focus:outline-none focus:border-purple-500 transition-colors min-h-[120px]"
                    placeholder="AI 시스템 지침..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">User Prompt Template</label>
                  <textarea
                    value={settings.userPromptTemplate}
                    onChange={e => setSettings({...settings, userPromptTemplate: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm leading-relaxed focus:outline-none focus:border-purple-500 transition-colors min-h-[200px]"
                    placeholder="{topic} 변수가 포함되어야 합니다."
                  />
                  <p className="text-xs text-zinc-500">* {'{topic}'} 부분에 사용자가 입력한 주제가 들어갑니다.</p>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: CANVAS & LAYOUT --- */}
          {activeTab === 'canvas' && (
            <div className="space-y-8">
              {/* Canvas Size */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">캔버스 크기</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">너비 (Width)</label>
                    <input
                      type="number"
                      value={settings.canvasWidth}
                      onChange={e => setSettings({...settings, canvasWidth: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">높이 (Height)</label>
                    <input
                      type="number"
                      value={settings.canvasHeight}
                      onChange={e => setSettings({...settings, canvasHeight: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Letterbox */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">레터박스 (검정 띠)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">상단 높이</label>
                    <input
                      type="number"
                      value={settings.letterboxTop}
                      onChange={e => setSettings({...settings, letterboxTop: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">하단 높이</label>
                    <input
                      type="number"
                      value={settings.letterboxBottom}
                      onChange={e => setSettings({...settings, letterboxBottom: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <ColorPicker
                    label="배경 색상"
                    value={settings.letterboxColor}
                    onChange={color => setSettings({...settings, letterboxColor: color})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: TEXT (TITLE & SUBTITLE) --- */}
          {activeTab === 'text' && (
            <div className="space-y-8">
              {/* Title Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  타이틀 설정
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">폰트 크기</label>
                    <input
                      type="number"
                      value={settings.titleFontSize}
                      onChange={e => setSettings({...settings, titleFontSize: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Y 위치</label>
                    <input
                      type="number"
                      value={settings.titleY}
                      onChange={e => setSettings({...settings, titleY: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <ColorPicker
                    label="폰트 색상"
                    value={settings.titleFontColor}
                    onChange={color => setSettings({...settings, titleFontColor: color})}
                  />
                  <ColorPicker
                    label="강조 색상"
                    value={settings.titleHighlightColor}
                    onChange={color => setSettings({...settings, titleHighlightColor: color})}
                  />
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">테두리 두께</label>
                    <input
                      type="number"
                      value={settings.titleBorderWidth}
                      onChange={e => setSettings({...settings, titleBorderWidth: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <ColorPicker
                    label="테두리 색상"
                    value={settings.titleBorderColor}
                    onChange={color => setSettings({...settings, titleBorderColor: color})}
                  />
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">줄당 최대 글자 수</label>
                    <input
                      type="number"
                      value={settings.titleMaxCharsPerLine}
                      onChange={e => setSettings({...settings, titleMaxCharsPerLine: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">줄 간격</label>
                    <input
                      type="number"
                      value={settings.titleLineSpacing}
                      onChange={e => setSettings({...settings, titleLineSpacing: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitle Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-t border-zinc-800 pt-4">
                  <Type className="w-4 h-4" />
                  자막 설정
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">폰트 크기</label>
                    <input
                      type="number"
                      value={settings.subtitleFontSize}
                      onChange={e => setSettings({...settings, subtitleFontSize: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">테두리 두께</label>
                    <input
                      type="number"
                      value={settings.subtitleOutline}
                      onChange={e => setSettings({...settings, subtitleOutline: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">그림자 크기</label>
                    <input
                      type="number"
                      value={settings.subtitleShadow}
                      onChange={e => setSettings({...settings, subtitleShadow: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">하단 여백</label>
                    <input
                      type="number"
                      value={settings.subtitleMarginV}
                      onChange={e => setSettings({...settings, subtitleMarginV: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">줄당 최대 글자 수</label>
                    <input
                      type="number"
                      value={settings.subtitleMaxCharsPerLine}
                      onChange={e => setSettings({...settings, subtitleMaxCharsPerLine: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">정렬 (ASS Format)</label>
                    <input
                      type="number"
                      value={settings.subtitleAlignment}
                      onChange={e => setSettings({...settings, subtitleAlignment: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitle Wrapping */}
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">자막 줄바꿈</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.subtitleWrappingEnabled}
                        onChange={e => setSettings({...settings, subtitleWrappingEnabled: e.target.checked})}
                        className="text-purple-500 focus:ring-purple-500 bg-zinc-900 border-zinc-700 rounded"
                      />
                      <span className="text-sm text-zinc-300">자동 줄바꿈 활성화</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">좌측 여백</label>
                    <input
                      type="number"
                      value={settings.subtitleMarginL}
                      onChange={e => setSettings({...settings, subtitleMarginL: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">우측 여백</label>
                    <input
                      type="number"
                      value={settings.subtitleMarginR}
                      onChange={e => setSettings({...settings, subtitleMarginR: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">안전 패딩</label>
                    <input
                      type="number"
                      value={settings.subtitleSafetyPadding}
                      onChange={e => setSettings({...settings, subtitleSafetyPadding: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">최대 배율 (%)</label>
                    <input
                      type="number"
                      value={settings.subtitleMaxScalePercent}
                      onChange={e => setSettings({...settings, subtitleMaxScalePercent: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">폴백 글자 수</label>
                    <input
                      type="number"
                      value={settings.subtitleFallbackCharsPerLine}
                      onChange={e => setSettings({...settings, subtitleFallbackCharsPerLine: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: EFFECTS --- */}
          {activeTab === 'effects' && (
            <div className="space-y-8">
              {/* Subtitle Animation */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  자막 애니메이션
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Pop-In 지속시간 (ms)</label>
                    <input
                      type="number"
                      value={settings.subtitlePopInDuration}
                      onChange={e => setSettings({...settings, subtitlePopInDuration: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Scale Up 시작 (%)</label>
                    <input
                      type="number"
                      value={settings.subtitleScaleUpStart}
                      onChange={e => setSettings({...settings, subtitleScaleUpStart: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Scale Up 끝 (%)</label>
                    <input
                      type="number"
                      value={settings.subtitleScaleUpEnd}
                      onChange={e => setSettings({...settings, subtitleScaleUpEnd: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Scale Down 시작 (ms)</label>
                    <input
                      type="number"
                      value={settings.subtitleScaleDownStart}
                      onChange={e => setSettings({...settings, subtitleScaleDownStart: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Scale Down 끝 (ms)</label>
                    <input
                      type="number"
                      value={settings.subtitleScaleDownEnd}
                      onChange={e => setSettings({...settings, subtitleScaleDownEnd: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">최종 배율 (%)</label>
                    <input
                      type="number"
                      value={settings.subtitleFinalScale}
                      onChange={e => setSettings({...settings, subtitleFinalScale: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Ken Burns Effect */}
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Ken Burns 효과 (Zoom)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">시작 줌 (1.0 = 100%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.kenBurnsStartZoom}
                      onChange={e => setSettings({...settings, kenBurnsStartZoom: parseFloat(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">끝 줌</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.kenBurnsEndZoom}
                      onChange={e => setSettings({...settings, kenBurnsEndZoom: parseFloat(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">줌 증가량 (프레임당)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={settings.kenBurnsZoomIncrement}
                      onChange={e => setSettings({...settings, kenBurnsZoomIncrement: parseFloat(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">FPS</label>
                    <input
                      type="number"
                      value={settings.kenBurnsFps}
                      onChange={e => setSettings({...settings, kenBurnsFps: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: AUDIO & RENDERING --- */}
          {activeTab === 'audio' && (
            <div className="space-y-8">
              {/* Audio Volumes */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  오디오 볼륨
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-zinc-300">
                    <label>TTS 볼륨</label>
                    <span className="font-mono text-purple-400">{settings.ttsVolume?.toFixed(2) || '1.00'}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={settings.ttsVolume || 1.0}
                    onChange={e => setSettings({...settings, ttsVolume: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-zinc-300">
                    <label>BGM 볼륨</label>
                    <span className="font-mono text-purple-400">{settings.bgmVolume?.toFixed(2) || '0.10'}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.5"
                    step="0.01"
                    value={settings.bgmVolume || 0.10}
                    onChange={e => setSettings({...settings, bgmVolume: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>

              {/* Rendering Settings */}
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">렌더링 설정</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">비디오 코덱</label>
                    <input
                      type="text"
                      value={settings.videoCodec}
                      onChange={e => setSettings({...settings, videoCodec: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Preset</label>
                    <select
                      value={settings.preset}
                      onChange={e => setSettings({...settings, preset: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors text-white"
                    >
                      <option value="ultrafast">ultrafast (가장 빠름)</option>
                      <option value="superfast">superfast</option>
                      <option value="veryfast">veryfast</option>
                      <option value="faster">faster</option>
                      <option value="fast">fast</option>
                      <option value="medium">medium (균형)</option>
                      <option value="slow">slow</option>
                      <option value="slower">slower</option>
                      <option value="veryslow">veryslow (최고 화질)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">CRF (화질: 0-51)</label>
                    <input
                      type="number"
                      value={settings.crf}
                      onChange={e => setSettings({...settings, crf: parseInt(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <p className="text-xs text-zinc-500">* 낮을수록 고화질 (권장: 18-28)</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Pixel Format</label>
                    <input
                      type="text"
                      value={settings.pixelFormat}
                      onChange={e => setSettings({...settings, pixelFormat: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">오디오 코덱</label>
                    <input
                      type="text"
                      value={settings.audioCodec}
                      onChange={e => setSettings({...settings, audioCodec: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">오디오 비트레이트</label>
                    <input
                      type="text"
                      value={settings.audioBitrate}
                      onChange={e => setSettings({...settings, audioBitrate: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
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
