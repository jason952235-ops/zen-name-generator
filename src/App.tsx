import React, { useState, useRef, useCallback, useEffect } from 'react';
// 修改後（請直接複製這兩行，取代原本的第 2 行與第 3 行）：
import { Volume2, RefreshCw, Download, Crown, ArrowLeft, Check, CreditCard, Palette, BookOpen } from 'lucide-react';
import { nameDatabase } from './names';
import { useImageDownloader } from './hooks/useImageDownloader';
import WallpaperPreview from './components/WallpaperPreview';
import GalleryArtPreview from './components/GalleryArtPreview';
import StencilPreview from './components/StencilPreview';
import BookletPreview from './components/BookletPreview';

const hideScrollbarStyle = `
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  /* 强化移动端滑动体验 */
  .swipe-container {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    overscroll-behavior-x: contain;
  }
  .swipe-container > * {
    scroll-snap-align: center;
    flex-shrink: 0;
  }
`;

type SceneryType = 'bamboo' | 'jiangnan' | 'mountain' | 'desert';
type GenderType = 'male' | 'female' | 'neutral';

interface NameItem {
  scenery: SceneryType;
  gender: GenderType;
  nameTw: string;
  nameCn: string;
  pinyin: string;
  nameEn?: string;
  storyEn?: string;
}

interface SceneryConfigItem {
  image: string;
  localPath: string;
  labelTw: string;
  labelEn: string;
  color: string;
  tag: string;
}

const sceneryConfig: Record<SceneryType, SceneryConfigItem> = {
  bamboo: { image: 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?q=80&w=1000&auto=format&fit=crop', localPath: '/1.jpg', labelTw: '竹林幽谷', labelEn: 'Bamboo', color: 'from-green-950/85 to-emerald-900/40', tag: '竹' },
  jiangnan: { image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=1000&auto=format&fit=crop', localPath: '/2.jpg', labelTw: '煙雨江南', labelEn: 'Jiangnan', color: 'from-blue-950/85 to-cyan-900/40', tag: '江' },
  mountain: { image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=1000&auto=format&fit=crop', localPath: '/3.jpg', labelTw: '高山流水', labelEn: 'Mountain', color: 'from-slate-900/85 to-slate-800/40', tag: '山' },
  desert: { image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000&auto=format&fit=crop', localPath: '/4.jpg', labelTw: '大漠孤煙', labelEn: 'Desert', color: 'from-orange-950/90 to-amber-900/40', tag: '漠' }
};

const fontStyles: Record<string, { font: string; label: string; labelEn: string }> = {
  cursive: { font: "'Liu Jian Mao Cao', 'Kaiti TC', 'BiauKai', 'DFKai-SB', cursive", label: '草書', labelEn: 'Cursive' },
  brush: { font: "'Ma Shan Zheng', 'Kaiti TC', 'BiauKai', 'DFKai-SB', cursive", label: '楷書', labelEn: 'Brush' },
  scholar: { font: "'ZCOOL XiaoWei', 'Noto Serif TC', 'PMingLiU', serif", label: '行楷', labelEn: 'Scholar' }
};

const TraditionalSealFallback: React.FC<{ size?: string }> = ({ size = "w-[70px] h-[70px]" }) => (
  <div className={`border-[3px] border-[#b22222] p-0.5 flex flex-wrap justify-center items-center text-[#b22222] bg-[#FDFBF7] select-none rounded-[3px] shadow-[inset_0_0_8px_rgba(178,34,34,0.15),0_2px_6px_rgba(0,0,0,0.15)] ${size}`}>
    <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[14px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>餘</div>
    <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[14px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>悠</div>
    <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[14px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>閒</div>
    <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[14px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>然</div>
  </div>
);

const SafeImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { fallback: React.ReactNode }> = ({ src, alt, fallback, className, ...props }) => {
  const [error, setError] = useState(false);
  if (error) return <>{fallback}</>;
  return <img src={src} alt={alt} onError={() => setError(true)} className={className} {...props} />;
};

const LogoTagStamp: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}>
    <div className="absolute inset-0 bg-amber-50/10 rounded-full blur-md"></div>
    <SafeImage src="/LOGO.jpg" alt="悠然餘閒" className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" style={{ filter: 'brightness(1.1) contrast(1.1)' }} fallback={<TraditionalSealFallback size="w-full h-full max-w-[66px] max-h-[66px]" />} />
  </div>
);

const RitualLoader: React.FC<{ isGenerating: boolean }> = ({ isGenerating }) => (
  <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/95 backdrop-blur-md transition-all duration-1000 ease-in-out ${isGenerating ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
    <div className="absolute w-48 h-48 bg-amber-600/10 rounded-full blur-3xl animate-pulse"></div>
    <div className="relative z-10 flex flex-col items-center animate-[pulse_2.5s_ease-in-out_infinite]">
      <SafeImage src="/LOGO.png" alt="推演中" className="w-20 h-20 object-contain mb-6 drop-shadow-[0_0_15px_rgba(217,119,6,0.5)] scale-110" fallback={<div className="mb-6 scale-110 transform drop-shadow-[0_0_12px_rgba(178,34,34,0.4)]"><TraditionalSealFallback size="w-[62px] h-[62px]" /></div>} />
      <div className="w-[1px] h-10 bg-gradient-to-b from-amber-500/60 to-transparent mb-4"></div>
      <p className="text-amber-500/90 tracking-[0.6em] font-light text-xs ml-2 font-serif uppercase">Seeking Destiny...</p>
    </div>
  </div>
);

export default function App() {
  const [activeScenery, setActiveScenery] = useState<SceneryType>('bamboo');
  const [genderFilter, setGenderFilter] = useState<GenderType>('neutral');
  
  const [currentName, setCurrentName] = useState<NameItem>(
    nameDatabase.length > 0 
      ? nameDatabase[Math.floor(Math.random() * nameDatabase.length)] 
      : { scenery: 'desert', gender: 'neutral', nameTw: '漠無跡', nameCn: '漠无迹', pinyin: 'Mò Wú-jì', storyEn: 'Means leaving no trace like shifting sands.' }
  );
  
  const [fontStyle, setFontStyle] = useState<string>('cursive');
  const [isSimp, setIsSimp] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true); 
  const [showCheckout, setShowCheckout] = useState<boolean>(false); 
  const [showQR, setShowQR] = useState<boolean>(false);
  
  const [activeTier, setActiveTier] = useState<number>(1);
  const [isMintingPDF, setIsMintingPDF] = useState(false); 
  
  const [showRedeem, setShowRedeem] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  const [toastMessage, setToastMessage] = useState<string>('');

  const cardRef = useRef<HTMLDivElement>(null);
  const { downloadCard } = useImageDownloader();

  useEffect(() => {
    const timer = setTimeout(() => setIsGenerating(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const pickName = (scenery: SceneryType, gender: GenderType, currentObj?: NameItem): NameItem => {
    let pool = nameDatabase.filter(n => n.scenery === scenery && n.gender === gender);
    if (pool.length === 0) pool = nameDatabase.filter(n => n.scenery === scenery);
    const others = pool.filter(n => n.nameTw !== currentObj?.nameTw);
    if (others.length > 0) return others[Math.floor(Math.random() * others.length)];
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : currentName;
  };

  const triggerGeneration = (action: () => void) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setTimeout(() => { action(); setTimeout(() => setIsGenerating(false), 300); }, 2800);
  };

  const regenerate = () => triggerGeneration(() => setCurrentName(pickName(activeScenery, genderFilter, currentName)));
  const switchScenery = (s: SceneryType) => { setActiveScenery(s); triggerGeneration(() => setCurrentName(pickName(s, genderFilter))); };
  const switchGender = (g: GenderType) => { setGenderFilter(g); triggerGeneration(() => setCurrentName(pickName(activeScenery, g))); };

  const handleDownloadClick = () => {
    if (isGenerating) return;
    setShowQR(true);
    setTimeout(() => { downloadCard(cardRef, 'YuranYuxian-AestheticName.jpg'); setTimeout(() => setShowQR(false), 2000); }, 200);
  };

  const speak = useCallback(() => {
    if (!window.speechSynthesis) { showToast("Your browser does not support text-to-speech."); return; }
    window.speechSynthesis.cancel();
    const textToSpeak = isSimp ? currentName.nameCn : currentName.nameTw;
    const utt = new SpeechSynthesisUtterance(textToSpeak);
    utt.lang = isSimp ? 'zh-CN' : 'zh-TW';
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }, [currentName, isSimp]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const newIndex = Math.round(scrollLeft / width) + 1;
    setActiveTier(newIndex);
  };

  const handleGenerateBooklet = async () => {
    setIsMintingPDF(true); 
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: isSimp ? currentName.nameCn : currentName.nameTw,
          scenery: sceneryConfig[activeScenery].labelEn, 
          concept: currentName.storyEn 
        })
      });
      if (!response.ok) throw new Error('API 回應失敗');
      const aiData = await response.json();
      console.log("AI 產生的專屬內容：", aiData);
      showToast('AI 生成成功！準備連接 PDF 引擎。');
    } catch (error) {
      console.error('API 測試失敗：', error);
      showToast('API 呼叫失敗，請確定已經執行 vercel dev。');
    } finally {
      setIsMintingPDF(false);
    }
  };

  const cfg = sceneryConfig[activeScenery];
  const font = fontStyles[fontStyle];
  const displayName = isSimp ? currentName.nameCn : currentName.nameTw;
  const uniqueIpId = `IP ID: YR-${Math.floor(10000 + Math.random() * 90000)}`;

  return (
    <>
      <style>{hideScrollbarStyle}</style>
      
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-stone-900/90 backdrop-blur-md text-amber-50 text-xs px-4 py-2 rounded-full shadow-lg border border-stone-700 font-medium tracking-wide">
          {toastMessage}
        </div>
      </div>

      <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto bg-[#EAE5DA] text-[#3A352E] font-sans flex flex-col items-center justify-between p-2 sm:p-3 select-none pb-4 sm:pb-6 relative">

        <header className="text-center w-full max-w-md mt-1 flex flex-col items-center shrink-0">
          <p className="text-sm sm:text-base tracking-[0.25em] sm:tracking-[0.35em] text-stone-900 font-bold uppercase mb-1 whitespace-nowrap">
            Aesthetic Traditional Name
          </p>
        </header>

        {!showCheckout ? (
          <>
            <section className="w-full max-w-[300px] xs:max-w-[325px] sm:max-w-[340px] flex items-stretch gap-2 sm:gap-3 my-1 shrink-0">
              <div className="w-[30%] sm:w-[32%] relative flex flex-col items-center justify-center p-1 overflow-hidden bg-stone-900/5 rounded-xl border border-stone-800/10 shadow-inner">
                <SafeImage src="/LOGO.png" alt="Yuran Yuxian" className="w-full h-full max-h-[160px] object-contain mix-blend-multiply scale-[1.5] transform transition-transform" fallback={<div className="py-2 flex flex-col items-center justify-center h-full"><h1 className="text-lg font-semibold tracking-widest text-stone-800 font-serif" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>悠然餘閒</h1></div>} />
              </div>
              <div className="flex-1 flex flex-col justify-between gap-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(sceneryConfig) as SceneryType[]).map((key) => {
                    const s = sceneryConfig[key];
                    return (
                      <button 
                        key={key} 
                        onClick={() => switchScenery(key)} 
                        disabled={isGenerating}
                        className={`relative rounded-lg overflow-hidden h-10 transition-all duration-300 border disabled:cursor-not-allowed ${activeScenery === key ? 'border-amber-700/80 scale-[1.03] shadow-md z-20' : 'border-stone-400/20 opacity-60 grayscale hover:opacity-80'}`}
                      >
                        <img src={s.image} alt={s.labelEn} className="absolute inset-0 w-full h-full object-cover" />
                        <div className={`absolute inset-0 bg-gradient-to-t ${s.color}`} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs font-light text-white drop-shadow" style={{ fontFamily: "'Liu Jian Mao Cao', cursive" }}>{s.tag}</span>
                          <span className="text-[7px] text-white/90 scale-90 tracking-widest mt-0.5 uppercase">{s.labelEn}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-center items-center gap-1 bg-stone-900/5 p-0.5 rounded-lg border border-stone-800/10 shadow-inner">
                  {(['male', 'female', 'neutral'] as GenderType[]).map((g) => (
                    <button 
                      key={g} 
                      onClick={() => switchGender(g)} 
                      disabled={isGenerating}
                      className={`flex-1 py-1.5 rounded-md text-[9px] tracking-widest transition-all uppercase disabled:cursor-not-allowed ${genderFilter === g ? 'bg-[#3A352E] text-[#EAE5DA] font-medium shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      {g === 'male' ? 'MALE' : g === 'female' ? 'FEMALE' : 'NEUTRAL'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 justify-center">
                  {Object.entries(fontStyles).map(([k, v]) => (
                    <button 
                      key={k} 
                      onClick={() => setFontStyle(k)} 
                      disabled={isGenerating}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all border shadow-sm disabled:cursor-not-allowed ${fontStyle === k ? 'bg-amber-800 border-amber-800 text-white scale-[1.02] shadow-md' : 'bg-white/60 border-stone-300 text-stone-700 hover:border-amber-700'}`} 
                      style={{ fontFamily: v.font }}
                    >
                      {v.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="w-full max-w-[300px] xs:max-w-[325px] sm:max-w-[340px] my-1 shrink-0">
              <div ref={cardRef} className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-xl bg-stone-950 border border-stone-800/50 flex flex-col justify-between p-4 sm:p-5">
                <img src={cfg.image} alt={cfg.labelEn} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className={`absolute inset-0 bg-gradient-to-b ${cfg.color} via-stone-950/40 to-stone-950/95`} />
                <div className={`absolute top-5 right-5 z-20 w-12 h-12 bg-white/95 p-1 rounded-md shadow-lg transition-opacity duration-200 ${showQR ? 'opacity-85' : 'opacity-0 pointer-events-none'}`}><img src="/qrcode.png" alt="QR" className="w-full h-full object-contain" /></div>
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden"><p className="text-white/10 text-2xl sm:text-3xl font-black uppercase tracking-[0.3em] whitespace-nowrap -rotate-12 select-none drop-shadow-md" style={{ fontFamily: "'Noto Serif', serif" }}>ZEN AESTHETIC NAMING</p></div>
                <RitualLoader isGenerating={isGenerating} />
                <div className="w-full flex justify-between items-start z-10">
                  <div data-html2canvas-ignore="true" className="bg-stone-950/30 backdrop-blur-md border border-white/10 rounded-full p-0.5 flex text-[9px] shadow-sm tracking-wider uppercase">
                    <button onClick={() => setIsSimp(false)} className={`px-2 py-0.5 rounded-full transition-colors ${!isSimp ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-white/50 hover:text-white/80'}`}>TRAD.</button>
                    <button onClick={() => setIsSimp(true)} className={`px-2 py-0.5 rounded-full transition-colors ${isSimp ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-white/50 hover:text-white/80'}`}>SIMP.</button>
                  </div>
                  <span className="text-white/30 text-[8px] tracking-widest uppercase pt-1">{cfg.labelEn} Concept</span>
                </div>
                <div className={`relative flex flex-col items-center justify-center z-10 my-auto transition-all duration-1000 delay-100 ${isGenerating ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
                  <p className="leading-none text-5xl sm:text-6xl tracking-[0.15em] pl-[0.15em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] text-amber-50 whitespace-nowrap break-keep" style={{ fontFamily: font.font, wordBreak: 'keep-all' }}>{displayName}</p>
                  <p className="mt-4 text-amber-100/70 text-xs sm:text-sm tracking-[0.4em] font-light uppercase drop-shadow-md" style={{ fontFamily: "'Noto Serif', serif" }}>{currentName.pinyin}</p>
                </div>
                <div className="w-full z-10 flex flex-col gap-3 relative">
                  <div className={`flex justify-center transition-all duration-700 delay-200 ${isGenerating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                     <button data-html2canvas-ignore="true" onClick={speak} className="flex items-center gap-2 bg-amber-600/80 backdrop-blur-md hover:bg-amber-500 text-white px-6 py-2.5 sm:px-4 sm:py-1.5 rounded-full shadow-lg transition-transform active:scale-[0.95]"><Volume2 size={16} /><span className="text-[10px] sm:text-[9px] font-medium tracking-wider uppercase">PRONUNCIATION</span></button>
                  </div>
                  <div className="w-full flex items-stretch gap-2 transition-all duration-700 delay-300">
                    <div className={`flex-1 backdrop-blur-md bg-stone-950/60 border border-white/5 rounded-xl p-3 shadow-xl flex flex-col justify-center relative min-h-[75px] ${isGenerating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                      <p className="text-amber-500 text-[8px] tracking-[0.25em] uppercase mb-1 font-medium">AESTHETIC CONCEPT</p>
                      <p className="text-stone-200 text-[10px] leading-relaxed font-light tracking-wide" style={{ fontFamily: "'Noto Serif SC', serif" }}>{currentName.storyEn}</p>
                    </div>
                    <div className={`w-[65px] sm:w-[75px] backdrop-blur-md bg-stone-950/40 border border-white/5 rounded-xl shadow-xl flex-shrink-0 flex items-center justify-center overflow-hidden opacity-85 hover:opacity-100 ${isGenerating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '400ms' }}><LogoTagStamp className="w-full h-full p-2" /></div>
                  </div>
                  <div className="w-full text-center opacity-60"><p className="text-[7px] text-white/60 tracking-[0.25em] font-light uppercase">— YURAN YUXIAN • EXCLUSIVE CUSTOM —</p></div>
                </div>
              </div>
            </section>

            <footer className="w-full max-w-[300px] xs:max-w-[325px] sm:max-w-[340px] grid grid-cols-12 gap-1.5 mt-0.5 shrink-0">
              <button onClick={regenerate} disabled={isGenerating} className="col-span-3 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 text-[9px] font-medium tracking-wider uppercase shadow-sm active:scale-[0.98] disabled:opacity-50"><RefreshCw size={14} className={`text-amber-700 ${isGenerating ? 'animate-spin' : ''}`} />REGENERATE</button>
              <button onClick={() => setShowCheckout(true)} disabled={isGenerating} className="col-span-6 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 text-[10px] font-bold tracking-widest uppercase shadow-lg active:scale-[0.98] hover:brightness-105 border border-amber-600/50 disabled:opacity-80"><Crown size={14} className="text-white animate-pulse" />UNLOCK PREMIUM</button>
              <button onClick={handleDownloadClick} disabled={isGenerating} className="col-span-3 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-[#3A352E] text-[#EAE5DA] text-[9px] font-medium tracking-wider uppercase shadow-md active:scale-[0.98] disabled:opacity-50"><Download size={14} className="text-amber-500" />SAVE ART</button>
            </footer>

            <div className="w-full max-w-[300px] xs:max-w-[325px] sm:max-w-[340px] h-[45px] sm:h-[50px] mt-1.5 rounded-lg border border-stone-300/80 border-dashed bg-black/5 flex items-center justify-center shrink-0">
               <span className="text-[9px] text-stone-500 tracking-widest uppercase">ADVERTISEMENT SPACE</span>
            </div>
          </>
        ) : (
          <section className="w-full max-w-[340px] sm:max-w-[380px] flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 my-2">
            
            <button onClick={() => setShowCheckout(false)} className="self-start flex items-center gap-1 text-stone-500 hover:text-stone-800 text-xs mb-4 font-medium transition-colors">
              <ArrowLeft size={14} /> Return to Meditation
            </button>

            <h2 className="text-2xl font-serif text-stone-900 mb-1 text-center">Unlock Your Destiny</h2>
            <p className="text-xs text-stone-600 text-center mb-4 tracking-wide px-2">
              Swipe to explore premium deliverables.
            </p>

            <div className="flex justify-center items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTier === 1 ? 'bg-stone-800 scale-125' : 'bg-stone-300'}`} />
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTier === 2 ? 'bg-amber-500 scale-125' : 'bg-stone-300'}`} />
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTier === 3 ? 'bg-stone-800 scale-125' : 'bg-stone-300'}`} />
            </div>

            {/* 修正滑动容器：使用 swipe-container class 并加上强制内联样式 */}
            <div 
              className="w-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-4 swipe-container"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
                overflowY: 'hidden'
              }}
              onScroll={handleScroll}
            >
              
              {/* 卡片 1：$1.99 */}
              <div className="min-w-full snap-center flex flex-col bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden relative">
                <div className="bg-stone-100 py-6 px-4 flex justify-center items-end gap-5 border-b border-stone-200">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-[85px] aspect-[4/5] rounded-lg overflow-hidden shadow-sm border border-white bg-stone-900">
                      <img src={cfg.image} alt="Bg" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      <div className={`absolute inset-0 bg-gradient-to-b ${cfg.color} via-stone-950/40 to-stone-950/90`} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="leading-none text-2xl tracking-[0.1em] drop-shadow-md text-amber-50 whitespace-nowrap break-keep" style={{ fontFamily: font.font, wordBreak: 'keep-all' }}>{displayName}</p>
                      </div>
                      <div className="absolute bottom-1 right-1 w-4 h-4 opacity-80">
                        <SafeImage src="/LOGO.png" alt="Logo" fallback={<TraditionalSealFallback size="w-full h-full" />} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <span className="text-[7px] text-stone-500 uppercase tracking-widest font-medium">Clean Art</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div style={{ width: 390 * 0.25, height: 844 * 0.25 }} className="relative">
                      <div className="absolute top-0 left-0 origin-top-left transform scale-[0.25] shadow-sm overflow-hidden rounded-[2.5rem] border-[4px] border-stone-800 pointer-events-none">
                        <WallpaperPreview chineseName={displayName} englishDesc={currentName.storyEn} ipId={uniqueIpId} fontFamily={font.font} />
                      </div>
                    </div>
                    <span className="text-[7px] text-stone-500 uppercase tracking-widest font-medium">Wallpaper</span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">The Scroll</h3>
                      <p className="text-[10px] text-stone-500 italic">Basic digital art set.</p>
                    </div>
                    <span className="text-lg font-serif font-bold text-stone-800">$1.99</span>
                  </div>
                  <ul className="text-[10px] text-stone-600 space-y-2 mb-6 flex-1">
                    <li className="flex items-center gap-2"><Check size={14} className="text-green-600" /> High-Res Clean Artwork</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-green-600" /> High-Res Mobile Wallpaper</li>
                  </ul>
                  <a 
                    href={`https://jasonwave356.gumroad.com/l/zvhwrw?Aesthetic%20Name=${displayName}`} 
                    data-gumroad-overlay-checkout="true"
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full py-3 rounded-xl bg-stone-900 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors shadow-md"
                  >
                    <CreditCard size={16} /> Unlock for $1.99
                  </a>
                </div>
              </div>

              {/* 卡片 2：$4.99 */}
              <div className="min-w-full snap-center flex flex-col bg-stone-900 rounded-3xl border border-amber-500/40 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg z-10">Most Popular</div>
                <div className="bg-stone-950/50 py-6 px-4 flex justify-center items-center gap-5 border-b border-stone-800">
                  <div className="flex flex-col items-center gap-2">
                    <div style={{ width: 280 * 0.35, height: 420 * 0.35 }} className="relative shadow-2xl">
                      <div className="absolute top-0 left-0 origin-top-left transform scale-[0.35] pointer-events-none">
                        <GalleryArtPreview chineseName={displayName} englishDesc={currentName.storyEn} fontFamily={font.font} />
                      </div>
                    </div>
                    <span className="text-[7px] text-amber-200/70 uppercase tracking-widest font-medium">Gallery Art</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div style={{ width: 280 * 0.35, height: 280 * 0.35 }} className="relative shadow-lg rounded-xl overflow-hidden border border-stone-700">
                      <div className="absolute top-0 left-0 origin-top-left transform scale-[0.35] pointer-events-none">
                        <StencilPreview chineseName={displayName} fontFamily={font.font} />
                      </div>
                    </div>
                    <span className="text-[7px] text-amber-200/70 uppercase tracking-widest font-medium flex items-center gap-1"><Palette size={8}/> Tattoo Stencil</span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1"><Crown size={14} /> The Awakening</h3>
                      <p className="text-[10px] text-stone-400 italic mt-0.5">Physical & Creator upgrades.</p>
                    </div>
                    <span className="text-lg font-serif font-bold text-white">$4.99</span>
                  </div>
                  <ul className="text-[10px] text-stone-300 space-y-2 mb-6 flex-1">
                    <li className="flex items-center gap-2 opacity-70"><Check size={14} className="text-amber-500" /> Includes $1.99 Scroll</li>
                    <li className="flex items-start gap-2"><Check size={14} className="text-amber-400 shrink-0 mt-0.5" /> <span><strong className="text-amber-200">Tattoo Stencil:</strong> Transparent PNG.</span></li>
                    <li className="flex items-start gap-2"><Check size={14} className="text-amber-400 shrink-0 mt-0.5" /> <span><strong className="text-amber-200">Gallery Art:</strong> Framing-ready PDF.</span></li>
                  </ul>
                  <a 
                    href={`https://jasonwave356.gumroad.com/l/rzlgdp?Aesthetic%20Name=${displayName}`}
                    data-gumroad-overlay-checkout="true"
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full py-3 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors shadow-md active:scale-[0.95]"
                  >
                    <CreditCard size={16} /> Unlock for $4.99
                  </a>
                </div>
              </div>

              {/* 卡片 3：$9.99 */}
              <div className="min-w-full snap-center flex flex-col bg-[#FCFAF5] rounded-3xl border border-[#D9D0B8] shadow-md overflow-hidden relative">
                
                <div className="bg-[#F5F2EB] py-8 px-4 flex justify-center items-center border-b border-[#E8E5DD] relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <img src="/LOGO.png" alt="Decoration" className="w-32 h-32 object-contain" />
                  </div>
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div style={{ width: 360 * 0.7, height: 240 * 0.7 }} className="relative shadow-xl">
                      <div className="absolute top-0 left-0 origin-top-left transform scale-[0.7] pointer-events-none">
                        <BookletPreview chineseName={displayName} pinyin={currentName.pinyin} fontFamily={font.font} />
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[7px] text-stone-600 uppercase tracking-[0.2em] font-bold text-center mt-2">
                      <BookOpen size={10} /> Personal Zen Booklet (PDF)
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#8A7356] uppercase tracking-widest flex items-center gap-1">
                        The Enlightenment
                      </h3>
                      <p className="text-[10px] text-stone-500 italic mt-0.5">Ultimate Personal IP & Philosophy.</p>
                    </div>
                    <span className="text-lg font-serif font-bold text-stone-900">$9.99</span>
                  </div>
                  <ul className="text-[10px] text-stone-600 space-y-2 mb-6 flex-1">
                    <li className="flex items-center gap-2 opacity-70"><Check size={14} className="text-[#8A7356]" /> Includes $1.99 & $4.99 sets</li>
                    <li className="flex items-start gap-2"><Check size={14} className="text-[#8A7356] shrink-0 mt-0.5" /> <span><strong className="text-stone-800">Name Deconstruction:</strong> Elements & Roots.</span></li>
                    <li className="flex items-start gap-2"><Check size={14} className="text-[#8A7356] shrink-0 mt-0.5" /> <span><strong className="text-stone-800">AI Zen Poetry:</strong> Exclusive bilingual poem generated for you.</span></li>
                  </ul>
                  
                  <a 
                    href={`https://jasonwave356.gumroad.com/l/zen-enlightenment?Aesthetic%20Name=${displayName}`}
                    data-gumroad-overlay-checkout="true"
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.95] bg-stone-900 text-[#EAE5DA] hover:bg-stone-800"
                  >
                    <CreditCard size={16} /> Unlock for $9.99
                  </a>

                  <div className="mt-3 flex flex-col items-center w-full">
                    <button 
                      onClick={() => setShowRedeem(!showRedeem)} 
                      className="text-[9px] text-stone-500 uppercase tracking-widest hover:text-stone-800 underline underline-offset-2 transition-colors"
                    >
                      Already purchased? Redeem here
                    </button>
                    
                    {showRedeem && (
                      <div className="w-full mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <input 
                          type="text" 
                          placeholder="Enter Order ID" 
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                          className="flex-1 bg-stone-100 border border-stone-300 text-stone-800 text-[10px] px-3 py-2.5 rounded-lg focus:outline-none focus:border-stone-500 font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
                        />
                        <button 
                          onClick={handleGenerateBooklet}
                          disabled={isMintingPDF || !orderId} 
                          className={`px-3 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                            isMintingPDF || !orderId
                              ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                              : 'bg-amber-600 text-white hover:bg-amber-500 shadow-md active:scale-[0.95]'
                          }`}
                        >
                          {isMintingPDF ? 'Wait...' : 'Generate'}
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
            
            <div className="mt-2 flex flex-col items-center opacity-60">
               <p className="text-[9px] text-stone-500 uppercase tracking-widest mb-1">Secured by</p>
               <div className="flex items-center gap-1 text-stone-600 font-bold text-xs tracking-tighter">Gumroad</div>
            </div>

          </section>
        )}
      </div>
    </>
  );
}