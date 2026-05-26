import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, RefreshCw, Download, Crown, ArrowLeft, Check, CreditCard } from 'lucide-react';
import { nameDatabase } from './names.ts';
import { useImageDownloader } from './hooks/useImageDownloader';

// 定義意境與性別的聯集型別
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
  bamboo: { 
    image: 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?q=80&w=1000&auto=format&fit=crop', 
    localPath: '/1.jpg',
    labelTw: '竹林幽谷', 
    labelEn: 'Bamboo', 
    color: 'from-green-950/85 to-emerald-900/40', 
    tag: '竹' 
  },
  jiangnan: { 
    image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=1000&auto=format&fit=crop', 
    localPath: '/2.jpg',
    labelTw: '煙雨江南', 
    labelEn: 'Jiangnan', 
    color: 'from-blue-950/85 to-cyan-900/40', 
    tag: '江' 
  },
  mountain: { 
    image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=1000&auto=format&fit=crop', 
    localPath: '/3.jpg',
    labelTw: '高山流水', 
    labelEn: 'Mountain', 
    color: 'from-slate-900/85 to-slate-800/40', 
    tag: '山' 
  },
  desert: { 
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000&auto=format&fit=crop', 
    localPath: '/4.jpg',
    labelTw: '大漠孤煙', 
    labelEn: 'Desert', 
    color: 'from-orange-950/90 to-amber-900/40', 
    tag: '漠' 
  }
};

interface FontStyleItem {
  font: string;
  label: string;
  labelEn: string;
}

const fontStyles: Record<string, FontStyleItem> = {
  cursive: { font: "'Liu Jian Mao Cao', cursive", label: '草書', labelEn: 'Cursive' },
  brush: { font: "'Ma Shan Zheng', cursive", label: '楷書', labelEn: 'Brush' },
  scholar: { font: "'ZCOOL XiaoWei', serif", label: '行楷', labelEn: 'Scholar' }
};

// ★ 智慧型備援：手刻傳統「硃砂紅篆刻印章」 (保留東方美學) ★
const TraditionalSealFallback: React.FC<{ size?: string }> = ({ size = "w-16 h-16" }) => {
  return (
    <div className={`border-[3px] border-[#b22222] p-0.5 flex flex-wrap justify-center items-center text-[#b22222] bg-[#FDFBF7] select-none rounded-[3px] shadow-[inset_0_0_8px_rgba(178,34,34,0.15),0_2px_6px_rgba(0,0,0,0.15)] ${size}`}>
      <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[13px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>餘</div>
      <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[13px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>悠</div>
      <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[13px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>閒</div>
      <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[13px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>然</div>
    </div>
  );
};

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback: React.ReactNode;
}

// ★ 智慧型圖片載入元件 ★
const SafeImage: React.FC<SafeImageProps> = ({ src, alt, fallback, className, ...props }) => {
  const [error, setError] = useState(false);
  if (error) return <>{fallback}</>;
  return <img src={src} alt={alt} onError={() => setError(true)} className={className} {...props} />;
};

// ★ 優化：右下角的 LOGO 落款 ★
const LogoTagStamp: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}>
    <div className="absolute inset-0 bg-amber-50/10 rounded-full blur-md"></div>
    <SafeImage
      src="/LOGO.jpg"
      alt="悠然餘閒"
      className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
      style={{ filter: 'brightness(1.1) contrast(1.1)' }}
      fallback={<TraditionalSealFallback size="w-full h-full max-w-[60px] max-h-[60px]" />}
    />
  </div>
);

interface RitualLoaderProps {
  isGenerating: boolean;
}

// ★ 充滿儀式感的渲染動畫元件 (英文化) ★
const RitualLoader: React.FC<RitualLoaderProps> = ({ isGenerating }) => {
  return (
    <div
      className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/95 backdrop-blur-md transition-all duration-1000 ease-in-out ${
        isGenerating ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}
    >
      <div className="absolute w-48 h-48 bg-amber-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="relative z-10 flex flex-col items-center animate-[pulse_2.5s_ease-in-out_infinite]">
        <SafeImage
          src="/LOGO.png"
          alt="推演中"
          className="w-20 h-20 object-contain mb-6 drop-shadow-[0_0_15px_rgba(217,119,6,0.5)]"
          fallback={
            <div className="mb-6 scale-110 transform drop-shadow-[0_0_12px_rgba(178,34,34,0.4)]">
              <TraditionalSealFallback size="w-14 h-14" />
            </div>
          }
        />
        <div className="w-[1px] h-10 bg-gradient-to-b from-amber-500/60 to-transparent mb-4"></div>
        <p className="text-amber-500/90 tracking-[0.6em] font-light text-xs ml-2 font-serif uppercase">
          Seeking Destiny...
        </p>
      </div>
    </div>
  );
};

export default function App() {
  const [activeScenery, setActiveScenery] = useState<SceneryType>('bamboo');
  const [genderFilter, setGenderFilter] = useState<GenderType>('neutral');
  const [currentName, setCurrentName] = useState<NameItem>(nameDatabase[359] || nameDatabase[0]);
  const [fontStyle, setFontStyle] = useState<string>('cursive');
  const [isSimp, setIsSimp] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true); 
  const [showCheckout, setShowCheckout] = useState<boolean>(false); 
  
  const cardRef = useRef<HTMLDivElement>(null);
  const { downloadCard } = useImageDownloader();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.async = true;
    document.body.appendChild(script);

    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 2800);

    return () => {
      document.body.removeChild(script);
      clearTimeout(timer);
    };
  }, []);

  const pickName = (scenery: SceneryType, gender: GenderType, currentObj?: NameItem): NameItem => {
    let pool = nameDatabase.filter(n => n.scenery === scenery && n.gender === gender);
    if (pool.length === 0) pool = nameDatabase.filter(n => n.scenery === scenery);
    const others = pool.filter(n => n.nameTw !== currentObj?.nameTw);
    if (others.length > 0) return others[Math.floor(Math.random() * others.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const triggerGeneration = (action: () => void) => {
    setIsGenerating(true);
    setTimeout(() => {
      action();
      setTimeout(() => setIsGenerating(false), 300);
    }, 2800);
  };

  const regenerate = () => triggerGeneration(() => setCurrentName(pickName(activeScenery, genderFilter, currentName)));
  const switchScenery = (s: SceneryType) => { setActiveScenery(s); triggerGeneration(() => setCurrentName(pickName(s, genderFilter))); };
  const switchGender = (g: GenderType) => { setGenderFilter(g); triggerGeneration(() => setCurrentName(pickName(activeScenery, g))); };

  // ★ 優化手機端發音機制：確保喚醒與防呆處理 ★
  const speak = useCallback(() => {
    if (!window.speechSynthesis) {
      alert("Your browser does not support text-to-speech.");
      return;
    }
    
    // 取消先前的發音序列，避免手機端列隊卡死
    window.speechSynthesis.cancel();
    
    const textToSpeak = isSimp ? currentName.nameCn : currentName.nameTw;
    const utt = new SpeechSynthesisUtterance(textToSpeak);
    utt.lang = isSimp ? 'zh-CN' : 'zh-TW';
    utt.rate = 0.85;
    utt.volume = 1; // 確保音量開啟
    
    window.speechSynthesis.speak(utt);
  }, [currentName, isSimp]);

  const cfg = sceneryConfig[activeScenery];
  const font = fontStyles[fontStyle];

  const handleStripeCheckout = (priceId: string) => {
    alert(`Redirecting to Stripe checkout...\nPlan ID: ${priceId}`);
  };

  return (
    // ★ 優化：使用 h-[100dvh] 與 overflow-y-auto 解決手機版高度被工具列遮擋的問題 ★
    <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto bg-[#EAE5DA] text-[#3A352E] font-sans flex flex-col items-center justify-between p-2 sm:p-3 select-none pb-4 sm:pb-6">

      <header className="text-center w-full max-w-md mt-1 flex flex-col items-center shrink-0">
        <p className="text-sm sm:text-base tracking-[0.25em] sm:tracking-[0.35em] text-stone-900 font-bold uppercase mb-1 whitespace-nowrap">
          Aesthetic Traditional Name
        </p>
      </header>

      {!showCheckout ? (
        <>
          <section className="w-full max-w-[300px] xs:max-w-[325px] sm:max-w-[340px] flex items-stretch gap-2 sm:gap-3 my-1 shrink-0">
            <div className="w-[30%] sm:w-[32%] relative flex flex-col items-center justify-center p-2 bg-stone-900/5 rounded-xl border border-stone-800/10 shadow-inner">
              <SafeImage
                src="/LOGO.png"
                alt="Yuran Yuxian"
                className="w-full h-full max-h-[140px] object-contain mix-blend-multiply"
                fallback={
                  <div className="py-2 flex flex-col items-center justify-center h-full">
                    <h1 className="text-lg font-semibold tracking-widest text-stone-800 font-serif" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>悠然餘閒</h1>
                  </div>
                }
              />
            </div>

            <div className="flex-1 flex flex-col justify-between gap-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(sceneryConfig) as SceneryType[]).map((key) => {
                  const s = sceneryConfig[key];
                  return (
                    <button key={key} onClick={() => switchScenery(key)} className={`relative rounded-lg overflow-hidden h-10 transition-all duration-300 border ${activeScenery === key ? 'border-amber-700/80 scale-[1.03] shadow-md z-20' : 'border-stone-400/20 opacity-60 grayscale'}`}>
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
                {(['male', 'female', 'neutral'] as GenderType[]).map((g) => {
                  const label = g === 'male' ? 'YANG (M)' : g === 'female' ? 'YIN (F)' : 'ZEN (N)';
                  return (
                    <button key={g} onClick={() => switchGender(g)} className={`flex-1 py-1.5 rounded-md text-[9px] tracking-widest transition-all uppercase ${genderFilter === g ? 'bg-[#3A352E] text-[#EAE5DA] font-medium shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}>
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-1.5 justify-center">
                {Object.entries(fontStyles).map(([k, v]) => (
                  <button key={k} onClick={() => setFontStyle(k)} className={`flex-1 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all border shadow-sm ${fontStyle === k ? 'bg-amber-800 border-amber-800 text-white scale-102 shadow-md' : 'bg-white/60 border-stone-300 text-stone-700 hover:border-amber-700'}`} style={{ fontFamily: v.font }}>
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

              <RitualLoader isGenerating={isGenerating} />

              <div className="w-full flex justify-between items-start z-10">
                <div data-html2canvas-ignore="true" className="bg-stone-950/30 backdrop-blur-md border border-white/10 rounded-full p-0.5 flex text-[9px] shadow-sm tracking-wider uppercase">
                  <button onClick={() => setIsSimp(false)} className={`px-2 py-0.5 rounded-full transition-colors ${!isSimp ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-white/50 hover:text-white/80'}`}>Trad.</button>
                  <button onClick={() => setIsSimp(true)} className={`px-2 py-0.5 rounded-full transition-colors ${isSimp ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-white/50 hover:text-white/80'}`}>Simp.</button>
                </div>
                <span className="text-white/30 text-[8px] tracking-widest uppercase pt-1">{cfg.labelEn} Concept</span>
              </div>

              <div className={`relative text-center z-10 my-auto transition-all duration-1000 delay-100 ${isGenerating ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
                <div id="download-qr-code" style={{ display: 'none' }} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-20">
                   <div className="bg-white/95 p-1 rounded-md shadow-2xl">
                     <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://yourwebsite.com" alt="QR Code" className="w-12 h-12 opacity-95" />
                   </div>
                </div>

                <p className="leading-none text-5xl sm:text-6xl tracking-[0.15em] pl-[0.15em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] text-amber-50" style={{ fontFamily: font.font }}>
                  {isSimp ? currentName.nameCn : currentName.nameTw}
                </p>
              </div>

              <div className="w-full z-10 flex flex-col gap-3 relative">
                <div className={`flex justify-center transition-all duration-700 delay-200 ${isGenerating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                   {/* ★ 優化：大幅增加手機端發音按鈕的觸控區域(padding)與文字大小 ★ */}
                   <button data-html2canvas-ignore="true" onClick={speak} className="flex items-center gap-2 bg-amber-600/80 backdrop-blur-md hover:bg-amber-500 text-white px-6 py-2.5 sm:px-4 sm:py-1.5 rounded-full shadow-lg transition-transform active:scale-95">
                      <Volume2 size={16} />
                      <span className="text-[10px] sm:text-[9px] font-medium tracking-wider uppercase">PRONUNCIATION</span>
                      <span className="text-[9px] sm:text-[8px] opacity-70">({currentName.pinyin})</span>
                   </button>
                </div>

                <div className="w-full flex items-stretch gap-2 transition-all duration-700 delay-300">
                  <div className={`flex-1 backdrop-blur-md bg-stone-950/60 border border-white/5 rounded-xl p-3 shadow-xl flex flex-col justify-center relative min-h-[75px] ${isGenerating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                    <p className="text-amber-500 text-[8px] tracking-[0.25em] uppercase mb-1 font-medium">AESTHETIC CONCEPT</p>
                    <p className="text-stone-200 text-[10px] leading-relaxed font-light tracking-wide" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                      {currentName.storyEn}
                    </p>
                  </div>

                  <div className={`w-[65px] sm:w-[75px] backdrop-blur-md bg-stone-950/40 border border-white/5 rounded-xl shadow-xl flex-shrink-0 flex items-center justify-center overflow-hidden opacity-85 hover:opacity-100 ${isGenerating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '400ms' }}>
                     <LogoTagStamp className="w-full h-full p-2" />
                  </div>
                </div>

                <div className="w-full text-center opacity-60">
                  <p className="text-[7px] text-white/60 tracking-[0.25em] font-light uppercase">
                    — YURAN YUXIAN • EXCLUSIVE CUSTOM —
                  </p>
                </div>
              </div>
            </div>
          </section>

          <footer className="w-full max-w-[300px] xs:max-w-[325px] sm:max-w-[340px] grid grid-cols-12 gap-1.5 mt-0.5 shrink-0">
            <button onClick={regenerate} disabled={isGenerating} className="col-span-3 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 text-[9px] font-medium tracking-wider uppercase shadow-sm active:scale-98 disabled:opacity-50">
              <RefreshCw size={14} className={`text-amber-700 ${isGenerating ? 'animate-spin' : ''}`} />
              REGENERATE
            </button>

            <button onClick={() => setShowCheckout(true)} disabled={isGenerating} className="col-span-6 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 text-[10px] font-bold tracking-widest uppercase shadow-lg active:scale-98 hover:brightness-105 border border-amber-600/50">
              <Crown size={14} className="text-white animate-pulse" />
              UNLOCK PREMIUM
            </button>

            <button onClick={() => downloadCard(cardRef, 'YuranYuxian-AestheticName.jpg')} disabled={isGenerating} className="col-span-3 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-[#3A352E] text-[#EAE5DA] text-[9px] font-medium tracking-wider uppercase shadow-md active:scale-98 disabled:opacity-50">
              <Download size={14} className="text-amber-500" />
              SAVE ART
            </button>
          </footer>

          <div className="w-full max-w-[300px] xs:max-w-[325px] sm:max-w-[340px] h-[45px] sm:h-[50px] mt-1.5 rounded-lg border border-stone-300/80 border-dashed bg-black/5 flex items-center justify-center shrink-0">
             <span className="text-[9px] text-stone-500 tracking-widest uppercase">ADVERTISEMENT SPACE</span>
          </div>
        </>
      ) : (
        /* =========================================
           結帳畫面 (Checkout View)
           ========================================= */
        <section className="w-full max-w-[300px] xs:max-w-[325px] sm:max-w-[340px] flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 my-2">
          
          <button onClick={() => setShowCheckout(false)} className="self-start flex items-center gap-1 text-stone-500 hover:text-stone-800 text-xs mb-3 font-medium transition-colors">
            <ArrowLeft size={14} />
            Return to Meditation
          </button>

          <h2 className="text-2xl font-serif text-stone-900 mb-1 text-center">Unlock Your Destiny</h2>
          <p className="text-xs text-stone-600 text-center mb-5 tracking-wide px-2">
            Discover the ancient soul behind your name. Choose your journey below.
          </p>

          <div className="flex flex-col gap-4">
            
            {/* 方案一: $1.99 */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">The Aesthetic Scroll</h3>
                  <p className="text-[10px] text-stone-500 italic">I just want the beautiful art.</p>
                </div>
                <span className="text-lg font-serif font-bold text-amber-700">$1.99</span>
              </div>
              <ul className="text-[10px] text-stone-600 space-y-1.5 mb-4">
                <li className="flex items-center gap-1.5"><Check size={12} className="text-amber-600" /> High-Res Artwork without watermarks</li>
                <li className="flex items-center gap-1.5"><Check size={12} className="text-amber-600" /> Print-ready master file (300 DPI)</li>
              </ul>
              <button onClick={() => handleStripeCheckout('price_1_99')} className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors">
                <CreditCard size={14} /> Pay $1.99
              </button>
            </div>

            {/* 方案二: $4.99 (主打) */}
            <div className="bg-gradient-to-b from-stone-900 to-stone-950 rounded-2xl p-4 border border-amber-500/50 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                Most Popular
              </div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <Crown size={14} /> The Zen Awakening
                  </h3>
                  <p className="text-[10px] text-stone-400 italic mt-0.5">I want to understand the ancient soul.</p>
                </div>
                <span className="text-lg font-serif font-bold text-white">$4.99</span>
              </div>
              
              <ul className="text-[10px] text-stone-300 space-y-1.5 mb-4">
                <li className="flex items-center gap-1.5"><Check size={12} className="text-amber-400" /> Everything in The Aesthetic Scroll</li>
                <li className="flex items-start gap-1.5">
                  <Check size={12} className="text-amber-400 mt-0.5 shrink-0" /> 
                  <span><strong className="text-amber-200">The Book of Name:</strong> A 3-page dual-language PDF reading.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check size={12} className="text-amber-400 mt-0.5 shrink-0" /> 
                  <span>Deep philosophy & personalized Zen prescription.</span>
                </li>
              </ul>
              <button onClick={() => handleStripeCheckout('price_4_99')} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 shadow-lg transition-all active:scale-95">
                <CreditCard size={14} /> Pay $4.99
              </button>
            </div>

          </div>

          <div className="mt-4 flex flex-col items-center opacity-60">
             <p className="text-[9px] text-stone-500 uppercase tracking-widest mb-1">Secured by</p>
             <div className="flex items-center gap-1 text-stone-600 font-bold text-xs tracking-tighter">
                stripe
             </div>
          </div>
        </section>
      )}

    </div>
  );
}