import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, RefreshCw, Download, Crown, ArrowLeft, Check, CreditCard, BookOpen } from 'lucide-react';
import { nameDatabase } from './names';

const hideScrollbarStyle = `
  .hide-scrollbar::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
  .swipe-container {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
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

type Html2Canvas = (
  element: HTMLElement,
  options: { useCORS: boolean; scale: number; backgroundColor: string; onclone?: (clonedDoc: Document) => void }
) => Promise<HTMLCanvasElement>;

declare global {
  interface Window {
    html2canvas?: Html2Canvas;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const initialUniqueIpId = `IP ID: YR-${Math.floor(10000 + Math.random() * 90000)}`;
const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

function getNamePool(scenery: SceneryType, gender: GenderType) {
  const exactPool = nameDatabase.filter((name) => name.scenery === scenery && name.gender === gender);
  if (exactPool.length > 0) return exactPool;
  return nameDatabase.filter((name) => name.scenery === scenery);
}

function pickUniqueNames(scenery: SceneryType, gender: GenderType, count: number, excludeNameTw?: string) {
  const pool = getNamePool(scenery, gender).filter((name) => name.nameTw !== excludeNameTw);
  const candidates = pool.length > 0 ? [...pool] : [...nameDatabase];
  const selected: NameItem[] = [];

  while (selected.length < count && candidates.length > 0) {
    const index = Math.floor(Math.random() * candidates.length);
    const [name] = candidates.splice(index, 1);
    selected.push(name);
  }

  return selected;
}

function getIdentityInsight(name: NameItem) {
  const sceneryInsights: Record<SceneryType, { imagery: string; personality: string; bestFor: string }> = {
    bamboo: {
      imagery: 'Bamboo suggests integrity, humility, resilience, and quiet confidence in Chinese culture.',
      personality: 'A calm learner or professional who wants to appear thoughtful, steady, and sincere.',
      bestFor: 'Students, language learners, educators, and people who want a gentle but dignified identity.'
    },
    jiangnan: {
      imagery: 'Jiangnan evokes mist, water towns, poetry, elegance, and refined cultural taste.',
      personality: 'A graceful communicator who wants a soft, artistic, and approachable Chinese identity.',
      bestFor: 'Travelers, creatives, culture lovers, and people who want a refined social name.'
    },
    mountain: {
      imagery: 'Mountains represent stability, ambition, inner discipline, and long-term strength.',
      personality: 'A focused person who wants a name that feels grounded, mature, and dependable.',
      bestFor: 'Business professionals, founders, consultants, and people working with Chinese companies.'
    },
    desert: {
      imagery: 'Wind and sand suggest freedom, courage, distance, and a strong independent spirit.',
      personality: 'An adventurous person who wants a memorable identity with movement and individuality.',
      bestFor: 'Travelers, explorers, creators, and people who want a distinctive personal brand.'
    }
  };

  const genderFit: Record<GenderType, string> = {
    male: 'It keeps a masculine tone without sounding aggressive or hard to pronounce.',
    female: 'It keeps a graceful tone without becoming overly delicate or difficult to use.',
    neutral: 'It works well as a balanced Chinese name for foreigners because it feels natural, clear, and easy to introduce.'
  };

  const insight = sceneryInsights[name.scenery];
  return {
    meaning: name.storyEn || 'A poetic Chinese name designed to feel natural, memorable, and culturally grounded.',
    imagery: insight.imagery,
    personality: insight.personality,
    bestFor: insight.bestFor,
    foreignerFit: genderFit[name.gender]
  };
}

function initAnalytics() {
  if (!gaMeasurementId || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', gaMeasurementId, { send_page_view: false });
}

function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (!gaMeasurementId || !window.gtag) return;
  window.gtag('event', eventName, params);
}

const sceneryConfig: Record<SceneryType, SceneryConfigItem> = {
  bamboo: { image: 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?q=80&w=1000&auto=format&fit=crop', localPath: '/1.jpg', labelTw: 'Bamboo', labelEn: 'Bamboo', color: 'from-green-950/85 to-emerald-900/40', tag: 'B' },
  jiangnan: { image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=1000&auto=format&fit=crop', localPath: '/2.jpg', labelTw: 'Jiangnan', labelEn: 'Jiangnan', color: 'from-blue-950/85 to-cyan-900/40', tag: 'J' },
  mountain: { image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=1000&auto=format&fit=crop', localPath: '/3.jpg', labelTw: 'Mountain', labelEn: 'Mountain', color: 'from-slate-900/85 to-slate-800/40', tag: 'M' },
  desert: { image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000&auto=format&fit=crop', localPath: '/4.jpg', labelTw: 'Desert', labelEn: 'Desert', color: 'from-orange-950/90 to-amber-900/40', tag: 'D' }
};

const fontStyles: Record<string, { font: string; label: string; labelEn: string }> = {
  cursive: { font: "'Liu Jian Mao Cao', 'Kaiti TC', 'BiauKai', 'DFKai-SB', cursive", label: '?', labelEn: 'Cursive' },
  brush: { font: "'Ma Shan Zheng', 'Kaiti TC', 'BiauKai', 'DFKai-SB', cursive", label: '璆瑟', labelEn: 'Brush' },
  scholar: { font: "'ZCOOL XiaoWei', 'Noto Serif TC', 'PMingLiU', serif", label: '銵扑', labelEn: 'Scholar' }
};

const TraditionalSealFallback = ({ size = "w-[70px] h-[70px]" }: { size?: string }) => (
  <div className={`border-[3px] border-[#b22222] p-0.5 flex flex-wrap justify-center items-center text-[#b22222] bg-[#FDFBF7] select-none rounded-[3px] shadow-[inset_0_0_8px_rgba(178,34,34,0.15),0_2px_6px_rgba(0,0,0,0.15)] ${size}`}>
    <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[11px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>ZEN</div>
    <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[11px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>NAME</div>
    <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[11px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>ID</div>
    <div className="w-1/2 h-1/2 flex items-center justify-center font-bold text-[11px] border-[0.5px] border-[#b22222]/10" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>SEAL</div>
  </div>
);

const SafeImage = ({ src, alt, fallback, className, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fallback: React.ReactNode }) => {
  const [error, setError] = useState(false);
  if (error) return <>{fallback}</>;
  return <img src={src} alt={alt} onError={() => setError(true)} className={className} {...props} />;
};

const LogoTagStamp = ({ className = "" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}>
    <div className="absolute inset-0 bg-amber-50/10 rounded-full blur-md"></div>
    <SafeImage src="/LOGO.jpg" alt="?擗?" className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" style={{ filter: 'brightness(1.1) contrast(1.1)' }} fallback={<TraditionalSealFallback size="w-full h-full max-w-[66px] max-h-[66px]" />} />
  </div>
);

const RitualLoader = ({ isGenerating }: { isGenerating: boolean }) => (
  <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-stone-950/95 backdrop-blur-md transition-all duration-1000 ease-in-out ${isGenerating ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
    <div className="absolute w-48 h-48 bg-amber-600/10 rounded-full blur-3xl animate-pulse"></div>
    <div className="relative z-10 flex flex-col items-center animate-[pulse_2.5s_ease-in-out_infinite]">
      <SafeImage src="/LOGO.png" alt="Generating identity" className="w-20 h-20 object-contain mb-6 drop-shadow-[0_0_15px_rgba(217,119,6,0.5)] scale-110" fallback={<div className="mb-6 scale-110 transform drop-shadow-[0_0_12px_rgba(178,34,34,0.4)]"><TraditionalSealFallback size="w-[62px] h-[62px]" /></div>} />
      <div className="w-[1px] h-10 bg-gradient-to-b from-amber-500/60 to-transparent mb-4"></div>
      <p className="text-amber-500/90 tracking-[0.6em] font-light text-xs ml-2 font-serif uppercase">Seeking Destiny...</p>
    </div>
  </div>
);

const initialPremiumNameSet = pickUniqueNames('bamboo', 'neutral', 20);
const initialFreeNameSet = initialPremiumNameSet.slice(0, 3);
const fallbackName: NameItem = {
  scenery: 'bamboo',
  gender: 'neutral',
  nameTw: 'An Ran',
  nameCn: 'An Ran',
  pinyin: 'An Ran',
  storyEn: 'A calm bamboo-inspired name that suggests peace, natural confidence, and quiet cultural elegance.'
};
const initialDisplayName = initialFreeNameSet[0] ?? nameDatabase[0] ?? fallbackName;

export default function App() {
  const [activeScenery, setActiveScenery] = useState<SceneryType>('bamboo');
  const [genderFilter, setGenderFilter] = useState<GenderType>('neutral');
  
  const [currentName, setCurrentName] = useState<NameItem>(initialDisplayName);
  
  const [freeNames, setFreeNames] = useState<NameItem[]>(() => {
    return initialFreeNameSet.length > 0 ? initialFreeNameSet : [initialDisplayName];
  });
  const [premiumNames, setPremiumNames] = useState<NameItem[]>(() => {
    return initialPremiumNameSet.length > 0 ? initialPremiumNameSet : [initialDisplayName];
  });

  const [fontStyle, setFontStyle] = useState<string>('cursive');
  const [isSimp, setIsSimp] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true); 
  const [, setShowCheckout] = useState<boolean>(false);
  const [showQR, setShowQR] = useState<boolean>(false);
  const [isPremiumUnlocked] = useState<boolean>(false);
  
  const [activeTier, setActiveTier] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string>('');

  const [uniqueIpId] = useState(initialUniqueIpId);
  const cardRef = useRef<HTMLDivElement>(null);
  const downloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsGenerating(false), 2800);
    return () => {
      clearTimeout(timer);
      if (downloadTimerRef.current) clearTimeout(downloadTimerRef.current);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  useEffect(() => {
    initAnalytics();
    trackEvent('page_view', { page_path: window.location.pathname });
  }, []);

  const refreshFreeNames = useCallback((scenery: SceneryType, gender: GenderType, currentObj?: NameItem) => {
    const names = pickUniqueNames(scenery, gender, 20, currentObj?.nameTw);
    if (names.length === 0) return;
    setPremiumNames(names);
    setFreeNames(names.slice(0, 3));
    setCurrentName(names[0]);
  }, []);

  const openGumroadCheckout = useCallback(() => {
    trackEvent('premium_clicked', { price: 4.99, currency: 'USD' });
    trackEvent('checkout_started', { price: 4.99, currency: 'USD' });
    window.open(
      "https://jasonwave356.gumroad.com/l/rzlgdp",
      "_blank"
    );
  }, []);

  const triggerGeneration = useCallback((action: () => void) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setTimeout(() => { 
      action(); 
      setTimeout(() => setIsGenerating(false), 300); 
    }, 2800);
  }, [isGenerating]);

  const regenerate = useCallback(() => {
    trackEvent('generate_clicked', {
      scenery: activeScenery,
      gender: genderFilter
    });
    triggerGeneration(() => refreshFreeNames(activeScenery, genderFilter, currentName));
  }, [activeScenery, genderFilter, currentName, refreshFreeNames, triggerGeneration]);

  const switchScenery = useCallback((s: SceneryType) => { 
    setActiveScenery(s); 
    triggerGeneration(() => refreshFreeNames(s, genderFilter)); 
  }, [genderFilter, refreshFreeNames, triggerGeneration]);

  const switchGender = useCallback((g: GenderType) => { 
    setGenderFilter(g); 
    triggerGeneration(() => refreshFreeNames(activeScenery, g)); 
  }, [activeScenery, refreshFreeNames, triggerGeneration]);

  const handleDownloadClick = () => {
    if (isGenerating || !cardRef.current) return;
    if (isPremiumUnlocked) {
      trackEvent('pdf_downloaded', { report_type: 'premium_identity_report' });
    }
    const targetCard = cardRef.current;
    setShowQR(true);
    showToast('Saving Art...');
    
    downloadTimerRef.current = setTimeout(() => {
      const loadHtml2Canvas = () => {
        if (window.html2canvas) return Promise.resolve(window.html2canvas);
        
        const existingScript = document.querySelector('script[src*="html2canvas.min.js"]');
        if (existingScript) {
          return new Promise<Html2Canvas>((resolve) => {
            existingScript.addEventListener('load', () => {
              if (window.html2canvas) resolve(window.html2canvas);
            });
          });
        }

        return new Promise<Html2Canvas>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          script.onload = () => {
            if (window.html2canvas) resolve(window.html2canvas);
          };
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      loadHtml2Canvas().then((html2canvas) => {
        html2canvas(targetCard, { useCORS: true, scale: 2, backgroundColor: '#0c0a09' }).then((canvas: HTMLCanvasElement) => {
          const link = document.createElement('a');
          link.download = 'YuranYuxian-AestheticName.jpg';
          link.href = canvas.toDataURL('image/jpeg', 0.9);
          link.click();
          setShowQR(false);
        });
      }).catch(() => {
        showToast('Download failed. Please check network.');
        setShowQR(false);
      });
    }, 400);
  };

  const speak = useCallback(() => {
    if (!window.speechSynthesis) { showToast("Your browser does not support text-to-speech."); return; }
    window.speechSynthesis.cancel();
    const textToSpeak = isSimp ? currentName.nameCn : currentName.nameTw;
    const utt = new SpeechSynthesisUtterance(textToSpeak);
    utt.lang = isSimp ? 'zh-CN' : 'zh-TW';
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }, [currentName, isSimp, showToast]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const newIndex = Math.round(scrollLeft / width) + 1;
    setActiveTier(newIndex);
  };

  const cfg = sceneryConfig[activeScenery];
  const font = fontStyles[fontStyle];
  const displayName = isSimp ? currentName.nameCn : currentName.nameTw;
  const identityInsight = getIdentityInsight(currentName);
  const lockedPreviewCount = 7;
  const useMainCheckoutOnly = true;

  return (
    <>
      <style>{hideScrollbarStyle}</style>
      
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-stone-900/90 backdrop-blur-md text-amber-50 text-xs px-4 py-2 rounded-full shadow-lg border border-stone-700 font-medium tracking-wide">
          {toastMessage}
        </div>
      </div>

      <div className="mx-auto max-w-[375px] w-full min-h-[100dvh] h-[100dvh] overflow-hidden bg-[#EAE5DA] text-[#3A352E] font-sans flex flex-col items-center py-4 select-none relative shadow-[0_0_50px_rgba(0,0,0,0.15)]">
        {useMainCheckoutOnly ? (
          <>
            <header className="text-center w-full flex flex-col items-center shrink-0 px-8 mb-3">
              <p className="text-[8px] tracking-[0.24em] text-amber-800 font-bold uppercase mb-1">
                Chinese Cultural Identity Generator
              </p>
              <h1 className="text-xl font-serif text-stone-950 leading-tight">
                Discover Your Chinese Identity
              </h1>
              <p className="text-[9px] text-stone-600 leading-relaxed mt-1 max-w-[300px]">
                More than a name ??receive meaning, pronunciation, story, and cultural insight in Chinese.
              </p>
            </header>

            <section className="w-full flex items-stretch gap-3 shrink-0 px-8 mb-4">
              <div className="w-[22%] relative flex flex-col items-center justify-center p-1.5 overflow-hidden bg-stone-900/5 rounded-xl border border-stone-800/10 shadow-inner">
                <SafeImage src="/LOGO.png" alt="Yuran Yuxian" className="w-full h-full max-h-[80px] object-contain mix-blend-multiply" fallback={<div className="py-2 flex flex-col items-center justify-center h-full"><h1 className="text-sm font-semibold tracking-widest text-stone-800 font-serif" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>?擗?</h1></div>} />
              </div>
              <div className="flex-1 flex flex-col justify-between gap-1">
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(sceneryConfig) as SceneryType[]).map((key) => {
                    const s = sceneryConfig[key];
                    return (
                      <button 
                        key={key} 
                        onClick={() => switchScenery(key)} 
                        disabled={isGenerating}
                        className={`relative rounded-lg overflow-hidden h-9 transition-all duration-300 border disabled:cursor-not-allowed ${activeScenery === key ? 'border-amber-700/80 shadow-md z-20' : 'border-stone-400/20 opacity-60 grayscale hover:opacity-80'}`}
                      >
                        <img src={s.image} alt={s.labelEn} className="absolute inset-0 w-full h-full object-cover" />
                        <div className={`absolute inset-0 bg-gradient-to-t ${s.color}`} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-light text-white drop-shadow" style={{ fontFamily: "'Liu Jian Mao Cao', cursive" }}>{s.tag}</span>
                          <span className="text-[6px] text-white/90 scale-90 tracking-widest uppercase">{s.labelEn}</span>
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
                      className={`flex-1 py-1 rounded-md text-[8px] tracking-widest transition-all uppercase disabled:cursor-not-allowed ${genderFilter === g ? 'bg-[#3A352E] text-[#EAE5DA] font-medium shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
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
                      className={`flex-1 py-1 rounded-lg text-[9px] uppercase tracking-wider transition-all border shadow-sm disabled:cursor-not-allowed ${fontStyle === k ? 'bg-amber-800 border-amber-800 text-white shadow-md' : 'bg-white/60 border-stone-300 text-stone-700 hover:border-amber-700'}`} 
                      style={{ fontFamily: v.font }}
                    >
                      {v.labelEn}
                    </button>
                  ))}
                </div>
              </div>

            </section>

            <section className="w-full flex-1 min-h-0 px-8 mb-4 flex flex-col gap-3 overflow-y-auto hide-scrollbar">
              <div ref={cardRef} className="relative w-full min-h-[360px] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-stone-950 border border-stone-800/50 flex flex-col justify-between p-4 sm:p-5 shrink-0">
                <img src={cfg.image} alt={cfg.labelEn} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className={`absolute inset-0 bg-gradient-to-b ${cfg.color} via-stone-950/40 to-stone-950/95`} />
                <div className={`absolute top-5 right-5 z-20 w-12 h-12 bg-white/95 p-1 rounded-md shadow-lg transition-opacity duration-200 ${showQR ? 'opacity-85' : 'opacity-0 pointer-events-none'}`}><img src="/qrcode.png" alt="QR" className="w-full h-full object-contain" /></div>
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden"><p className="text-white/10 text-2xl font-black uppercase tracking-[0.3em] whitespace-nowrap -rotate-12 select-none drop-shadow-md" style={{ fontFamily: "'Noto Serif', serif" }}>CHINESE IDENTITY</p></div>
                <RitualLoader isGenerating={isGenerating} />
                <div className="w-full flex justify-between items-start z-10">
                  <div data-html2canvas-ignore="true" className="bg-stone-950/30 backdrop-blur-md border border-white/10 rounded-full p-0.5 flex text-[9px] shadow-sm tracking-wider uppercase">
                    <button onClick={() => setIsSimp(false)} className={`px-2 py-0.5 rounded-full transition-colors ${!isSimp ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-white/50 hover:text-white/80'}`}>TRAD.</button>
                    <button onClick={() => setIsSimp(true)} className={`px-2 py-0.5 rounded-full transition-colors ${isSimp ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-white/50 hover:text-white/80'}`}>SIMP.</button>
                  </div>
                  <span className="text-white/30 text-[8px] tracking-widest uppercase pt-1">{cfg.labelEn} Concept</span>
                </div>
                <div className={`relative flex flex-col items-center justify-center z-10 my-auto transition-all duration-1000 delay-100 ${isGenerating ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
                  <p className="leading-none text-5xl tracking-[0.15em] pl-[0.15em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] text-amber-50 whitespace-nowrap break-keep" style={{ fontFamily: font.font, wordBreak: 'keep-all' }}>{displayName}</p>
                  <p className="mt-4 text-amber-100/70 text-xs tracking-[0.4em] font-light uppercase drop-shadow-md" style={{ fontFamily: "'Noto Serif', serif" }}>{currentName.pinyin}</p>
                </div>
                <div className="w-full z-10 flex flex-col gap-3 relative">
                  <div className={`flex justify-center transition-all duration-700 delay-200 ${isGenerating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                     <button data-html2canvas-ignore="true" onClick={speak} className="flex items-center gap-2 bg-amber-600/80 backdrop-blur-md hover:bg-amber-500 text-white px-6 py-2.5 rounded-full shadow-lg transition-transform active:scale-[0.95]"><Volume2 size={16} /><span className="text-[10px] font-medium tracking-wider uppercase">PRONUNCIATION</span></button>
                  </div>
                  <div className="w-full flex items-stretch gap-2 transition-all duration-700 delay-300">
                    <div className={`flex-1 backdrop-blur-md bg-stone-950/60 border border-white/5 rounded-xl p-3 shadow-xl flex flex-col justify-center relative min-h-[70px] ${isGenerating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                      <p className="text-amber-500 text-[8px] tracking-[0.25em] uppercase mb-1 font-medium">NAME STORY</p>
                      <p className="text-stone-200 text-[9px] leading-relaxed font-light tracking-wide" style={{ fontFamily: "'Noto Serif SC', serif" }}>{currentName.storyEn}</p>
                    </div>
                    <div className={`w-[60px] backdrop-blur-md bg-stone-950/40 border border-white/5 rounded-xl shadow-xl flex-shrink-0 flex items-center justify-center overflow-hidden opacity-85 hover:opacity-100 ${isGenerating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '400ms' }}><LogoTagStamp className="w-full h-full p-2" /></div>
                  </div>
                  <div className="w-full text-center opacity-60"><p className="text-[6px] text-white/60 tracking-[0.25em] font-light uppercase">YURAN YUXIAN - EXCLUSIVE CUSTOM IDENTITY</p></div>
                </div>
              </div>

              <div className="w-full bg-white/70 border border-stone-300/70 rounded-2xl p-3 shadow-sm shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[8px] tracking-[0.28em] text-amber-800 font-bold uppercase">Free Identity Preview</p>
                    <h2 className="text-sm font-serif text-stone-900">3 complete Chinese names for free</h2>
                  </div>
                  <span className="text-[9px] text-stone-500">3 unlocked / 20</span>
                </div>
                <p className="text-[9px] text-stone-600 leading-relaxed mb-3">
                  Each free result includes the Chinese name, pinyin, basic meaning, and a short identity story.
                </p>

                <div className="space-y-2">
                  {freeNames.map((name, index) => {
                    const nameText = isSimp ? name.nameCn : name.nameTw;
                    return (
                      <button
                        key={`${name.nameTw}-${index}`}
                        onClick={() => setCurrentName(name)}
                        className={`w-full text-left rounded-xl border p-3 transition-all ${currentName.nameTw === name.nameTw ? 'bg-stone-900 text-amber-50 border-stone-900 shadow-md' : 'bg-[#FDFBF7] text-stone-800 border-stone-200 hover:border-amber-700/60'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-amber-700/15 text-amber-800 text-[10px] flex items-center justify-center font-bold shrink-0">{index + 1}</span>
                            <div className="min-w-0">
                              <p className="text-xl tracking-[0.12em] whitespace-nowrap" style={{ fontFamily: font.font }}>{nameText}</p>
                              <p className={`text-[9px] tracking-[0.18em] uppercase mt-0.5 ${currentName.nameTw === name.nameTw ? 'text-amber-100/70' : 'text-stone-500'}`}>{name.pinyin}</p>
                            </div>
                          </div>
                          <span className={`text-[8px] uppercase tracking-widest shrink-0 ${currentName.nameTw === name.nameTw ? 'text-amber-200' : 'text-amber-700'}`}>Preview</span>
                        </div>
                        <p className={`mt-2 text-[9px] leading-relaxed line-clamp-2 ${currentName.nameTw === name.nameTw ? 'text-stone-200' : 'text-stone-600'}`}>{name.storyEn}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full bg-[#FDFBF7] border border-amber-800/20 rounded-2xl p-4 shadow-sm shrink-0">
                <p className="text-[8px] tracking-[0.28em] text-amber-800 font-bold uppercase mb-1">Why This Name?</p>
                <h2 className="text-base font-serif text-stone-900 mb-3">
                  Why {displayName} works as a Chinese identity
                </h2>
                <div className="space-y-2 text-[10px] leading-relaxed text-stone-700">
                  <p><strong className="text-stone-950">Meaning:</strong> {identityInsight.meaning}</p>
                  <p><strong className="text-stone-950">Cultural image:</strong> {identityInsight.imagery}</p>
                  <p><strong className="text-stone-950">Personality symbol:</strong> {identityInsight.personality}</p>
                  <p><strong className="text-stone-950">Best for:</strong> {identityInsight.bestFor}</p>
                  <p><strong className="text-stone-950">Foreigner fit:</strong> {identityInsight.foreignerFit}</p>
                </div>
              </div>

              {isPremiumUnlocked ? (
              <div className="w-full bg-stone-950 text-stone-100 rounded-2xl p-4 shadow-xl border border-amber-500/40 shrink-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[8px] tracking-[0.28em] text-amber-400 font-bold uppercase">Premium Results Unlocked</p>
                    <h2 className="text-base font-serif text-white mt-1">Your full 20-name identity report</h2>
                    <p className="text-[9px] text-stone-400 mt-1">Review every name, then choose the one you want to use in China.</p>
                  </div>
                  <Check size={18} className="text-emerald-400 shrink-0" />
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto hide-scrollbar pr-1">
                  {premiumNames.map((name, index) => {
                    const nameText = isSimp ? name.nameCn : name.nameTw;
                    return (
                      <button
                        key={`${name.nameTw}-premium-${index}`}
                        onClick={() => setCurrentName(name)}
                        className={`w-full text-left rounded-xl border p-3 transition-all ${currentName.nameTw === name.nameTw ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md' : 'bg-white/[0.06] text-stone-100 border-white/10 hover:border-amber-400/70'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-stone-950/30 text-[10px] flex items-center justify-center font-bold shrink-0">{index + 1}</span>
                            <div className="min-w-0">
                              <p className="text-lg tracking-[0.12em] whitespace-nowrap" style={{ fontFamily: font.font }}>{nameText}</p>
                              <p className={`text-[9px] tracking-[0.18em] uppercase mt-0.5 ${currentName.nameTw === name.nameTw ? 'text-stone-800' : 'text-stone-400'}`}>{name.pinyin}</p>
                            </div>
                          </div>
                          <span className="text-[8px] uppercase tracking-widest shrink-0">Full</span>
                        </div>
                        <p className={`mt-2 text-[9px] leading-relaxed line-clamp-2 ${currentName.nameTw === name.nameTw ? 'text-stone-800' : 'text-stone-300'}`}>{name.storyEn}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              ) : (
              <div className="w-full bg-stone-950 text-stone-100 rounded-2xl p-4 shadow-xl border border-stone-800 shrink-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[8px] tracking-[0.28em] text-amber-400 font-bold uppercase">+{lockedPreviewCount} Starter Names Locked</p>
                    <h2 className="text-base font-serif text-white mt-1">Chinese Name Starter Pack</h2>
                    <p className="text-[9px] text-stone-400 mt-1">10 personalized Chinese names with Best Match recommendation.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Crown size={18} className="text-amber-400 ml-auto mb-1" />
                    <span className="text-amber-300 text-sm font-bold">US$4.99</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-[76px] rounded-xl border border-white/10 bg-white/[0.06] p-2 overflow-hidden relative">
                      <div className="absolute inset-0 backdrop-blur-[2px] bg-stone-950/20"></div>
                      <div className="relative z-10 opacity-45">
                        <div className="h-3 w-10 bg-amber-100/50 rounded mb-2"></div>
                        <div className="h-2 w-full bg-white/30 rounded mb-1.5"></div>
                        <div className="h-2 w-4/5 bg-white/20 rounded"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] tracking-widest text-amber-200 font-bold uppercase">Locked</div>
                    </div>
                  ))}
                </div>

                <ul className="text-[10px] text-stone-300 space-y-2 mb-4">
                  <li className="flex items-start gap-2"><Check size={12} className="text-amber-400 shrink-0 mt-0.5" /> 10 personalized Chinese names</li>
                  <li className="flex items-start gap-2"><Check size={12} className="text-amber-400 shrink-0 mt-0.5" /> Pinyin, English meanings, and name stories</li>
                  <li className="flex items-start gap-2"><Check size={12} className="text-amber-400 shrink-0 mt-0.5" /> Best Match recommendation for your Chinese identity</li>
                </ul>

                <button
                  onClick={openGumroadCheckout}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 py-3 rounded-xl text-[10px] font-bold tracking-[0.16em] uppercase flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-70"
                >
                  <Crown size={14} /> Unlock Starter Pack – US$4.99
                </button>
              </div>
              )}
            </section>

            <footer className="w-full grid grid-cols-12 gap-2 shrink-0 px-8 mb-3">
              <button onClick={regenerate} disabled={isGenerating} className="col-span-6 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-700 text-[8px] font-medium tracking-wider uppercase shadow-sm active:scale-[0.98] disabled:opacity-50"><RefreshCw size={12} className={`text-amber-700 ${isGenerating ? 'animate-spin' : ''}`} />REGENERATE</button>
              <button onClick={handleDownloadClick} disabled={isGenerating} className="col-span-6 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl bg-[#3A352E] text-[#EAE5DA] text-[8px] font-medium tracking-wider uppercase shadow-md active:scale-[0.98] disabled:opacity-50"><Download size={12} className="text-amber-500" />SAVE ART</button>
            </footer>

            <div className="w-full px-8 shrink-0 pb-1">
               <div className="w-full h-[40px] rounded-lg border border-stone-300/80 border-dashed bg-black/5 flex items-center justify-center">
                  <span className="text-[8px] text-stone-500 tracking-widest uppercase">ADVERTISEMENT SPACE</span>
               </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-full flex flex-col items-center flex-1 overflow-y-auto hide-scrollbar pb-6 pt-2 relative">
              
              <div className="flex flex-col items-center mb-6 w-full px-4 shrink-0">
                <h2 className="text-[10px] tracking-[0.25em] font-bold text-stone-800 uppercase mb-4 text-center mt-1">
                  Aesthetic Traditional Name
                </h2>
                <button 
                  onClick={() => setShowCheckout(false)} 
                  className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors mb-5 font-medium"
                >
                  <ArrowLeft size={12} /> Return to Meditation
                </button>
                
                <h1 className="text-2xl font-serif text-stone-800 mb-2 text-center" style={{ fontFamily: "'Noto Serif', serif" }}>
                  Unlock Your Destiny
                </h1>
                <p className="text-[10px] text-stone-500">Swipe to explore premium deliverables.</p>
              </div>

              <div className="flex justify-center gap-1.5 mb-5 shrink-0">
                {[1, 2, 3].map(dot => (
                  <div key={dot} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTier === dot ? 'bg-stone-800' : 'bg-stone-300'}`} />
                ))}
              </div>

              <div className="w-full relative shrink-0">
                <div className="swipe-container hide-scrollbar w-full items-center px-6" onScroll={handleScroll}>
                  
                  {/* ====== Tier 1: THE SCROLL ====== */}
                  <div className="w-full min-w-full flex-shrink-0 snap-center flex justify-center">
                    <div className="w-full max-w-[280px] bg-[#FDFBF7] rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-stone-200 flex flex-col relative">
                      
                      <div className="flex gap-4 items-end justify-center mb-6 mt-4 h-[140px]">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-[70px] aspect-square rounded-lg overflow-hidden relative shadow-sm border border-stone-200/50">
                            <img src={cfg.image} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Scenery" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center px-1">
                              <span className="text-white text-[15px] font-bold shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest whitespace-nowrap" style={{ fontFamily: font.font }}>{displayName}</span>
                            </div>
                          </div>
                          <span className="text-[6px] text-stone-400 uppercase tracking-widest font-medium">Clean Art</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-[70px] aspect-[9/19] rounded-[10px] bg-stone-50 border border-stone-200 shadow-md flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
                              <span className="text-stone-800 text-[16px] font-bold mb-2 tracking-widest whitespace-nowrap" style={{ fontFamily: font.font }}>{displayName}</span>
                              <div className="text-[3px] text-stone-400 leading-tight">Peace is an endless resort...</div>
                              <div className="absolute bottom-2 w-full text-center text-[3px] text-stone-300">?擗?</div>
                          </div>
                          <span className="text-[6px] text-stone-400 uppercase tracking-widest font-medium">Wallpaper</span>
                        </div>
                      </div>

                      <div className="border-t border-stone-200 pt-4">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="text-xs tracking-widest font-bold uppercase text-stone-800">The Scroll</h3>
                          <span className="font-bold text-base text-stone-800">$1.99</span>
                        </div>
                        <p className="text-[9px] text-stone-500 italic mb-4">Basic digital art set.</p>
                        
                        <ul className="text-[10px] text-stone-600 space-y-2 mb-5 min-h-[60px]">
                          <li className="flex items-center gap-2"><Check size={12} className="text-emerald-600 shrink-0"/> High-Res Clean Artwork</li>
                          <li className="flex items-center gap-2"><Check size={12} className="text-emerald-600 shrink-0"/> High-Res Mobile Wallpaper</li>
                        </ul>
                        
                        <button className="w-full bg-[#1C1A17] text-[#FDFBF7] py-2.5 rounded-xl text-[10px] font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 shadow-md opacity-60 cursor-not-allowed" disabled>
                          <CreditCard size={14}/> Disabled
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ====== Tier 2: THE AWAKENING ====== */}
                  <div className="w-full min-w-full flex-shrink-0 snap-center flex justify-center">
                    <div className="w-full max-w-[280px] bg-[#1A1816] rounded-[24px] p-5 shadow-2xl border border-stone-800 flex flex-col relative">
                      <div className="absolute top-0 right-4 bg-[#F5A623] text-[#1A1816] text-[8px] font-bold px-2 py-1 rounded-b-md tracking-widest uppercase">Most Popular</div>
                      
                      <div className="flex gap-4 items-center justify-center mb-6 mt-4 h-[140px]">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-[65px] aspect-[3/4] bg-white rounded-sm shadow-md flex flex-col items-center justify-center p-2 border border-stone-200 relative overflow-hidden">
                              <span className="text-stone-900 text-[16px] font-bold mb-2 tracking-widest mt-2 whitespace-nowrap" style={{ fontFamily: font.font }}>{displayName}</span>
                              <div className="text-[3px] text-stone-400 leading-tight text-center mt-auto">Minimalist Zen style.</div>
                          </div>
                          <span className="text-[6px] text-stone-400 uppercase tracking-widest font-medium">Gallery Art</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-[85px] h-[85px] rounded-lg border border-stone-700 bg-[#2A2826] overflow-hidden relative shadow-inner flex items-center justify-center">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px' }}></div>
                            <div className="absolute top-1 text-center w-full text-[4px] text-stone-400 tracking-widest">TRANSPARENT PNG</div>
                            <span className="text-white text-[20px] font-black relative z-10 tracking-widest whitespace-nowrap" style={{ fontFamily: font.font }}>{displayName}</span>
                          </div>
                          <span className="text-[6px] text-stone-400 uppercase tracking-widest font-medium flex items-center gap-1"><div className="w-1.5 h-1.5 border border-stone-400 rounded-sm"></div> Tattoo Stencil</span>
                        </div>
                      </div>

                      <div className="border-t border-stone-700 pt-4">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="text-xs tracking-widest font-bold uppercase text-[#F5A623] flex items-center gap-1.5"><Crown size={12}/> The Awakening</h3>
                          <span className="font-bold text-base text-white">$4.99</span>
                        </div>
                        <p className="text-[9px] text-stone-400 italic mb-4">Physical & Creator upgrades.</p>
                        
                        <ul className="text-[10px] text-stone-300 space-y-2 mb-5 min-h-[60px]">
                          <li className="flex items-center gap-2"><Check size={12} className="text-[#F5A623] shrink-0"/> Includes $1.99 Scroll</li>
                          <li className="flex items-start gap-2"><Check size={12} className="text-[#F5A623] shrink-0 mt-0.5"/> <div><strong className="text-white">Tattoo Stencil:</strong> Transparent PNG.</div></li>
                          <li className="flex items-start gap-2"><Check size={12} className="text-[#F5A623] shrink-0 mt-0.5"/> <div><strong className="text-white">Gallery Art:</strong> Framing-ready PDF.</div></li>
                        </ul>
                        
                        <button className="w-full bg-[#F5A623] text-[#1A1816] py-2.5 rounded-xl text-[10px] font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(245,166,35,0.25)] opacity-60 cursor-not-allowed" disabled>
                          <CreditCard size={14}/> Disabled
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ====== Tier 3: THE ENLIGHTENMENT ====== */}
                  <div className="w-full min-w-full flex-shrink-0 snap-center flex justify-center">
                    <div className="w-full max-w-[280px] bg-[#FDFBF7] rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-stone-200 flex flex-col relative">
                      
                      <div className="flex flex-col items-center justify-center mb-6 mt-4 h-[140px]">
                        <div className="w-[180px] aspect-[4/3] bg-white rounded-sm shadow-md flex border border-stone-200/50 overflow-hidden relative">
                          <div className="absolute inset-y-0 left-1/2 w-[2px] bg-gradient-to-r from-stone-200 via-stone-100 to-transparent -translate-x-1/2 z-10 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]"></div>
                          <div className="w-1/2 h-full px-3 py-4 flex flex-col justify-start border-r border-stone-100 bg-white overflow-hidden">
                              <span className="text-[4px] text-stone-400 uppercase tracking-widest mb-1.5 font-bold">Chapter I. Origin</span>
                              <span className="text-stone-800 text-[18px] font-bold mb-1 tracking-widest whitespace-nowrap" style={{ fontFamily: font.font }}>{displayName}</span>
                              <span className="text-[5px] text-stone-500 uppercase tracking-widest mb-3">{currentName.pinyin}</span>
                              <div className="text-[3px] text-stone-600 leading-[1.6]">Elements: Water & Earth.<br/>Philosophy: Wabi-Sabi.</div>
                          </div>
                          <div className="w-1/2 h-full px-3 py-4 flex flex-col justify-start bg-[#FAF9F6] relative">
                              <span className="text-[4px] text-[#b22222] uppercase tracking-widest mb-2 font-bold text-right w-full">Chapter II. Poetry</span>
                              <div className="text-[6px] text-stone-800 leading-loose font-medium mb-1.5 pt-1" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                                憸券??姘銝??莎?<br/>瘚??祇?隞餃像??                              </div>
                              <div className="text-[3.5px] text-stone-500 leading-tight">Wind sweeps the bamboo...</div>
                              
                              <div className="absolute bottom-2 right-2 w-[22px] h-[22px] opacity-50 pointer-events-none mix-blend-multiply">
                                <SafeImage src="/LOGO.jpg" alt="Logo Stamp" className="w-full h-full object-contain mix-blend-multiply" fallback={<TraditionalSealFallback size="w-full h-full" />} />
                              </div>
                          </div>
                        </div>
                        <span className="text-[6px] text-stone-400 uppercase tracking-widest mt-3 font-medium flex items-center gap-1"><BookOpen size={8}/> Personal Zen Booklet (PDF)</span>
                      </div>

                      <div className="border-t border-stone-200 pt-4">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="text-xs tracking-widest font-bold uppercase text-stone-800">The Enlightenment</h3>
                          <span className="font-bold text-base text-stone-800">$4.99</span>
                        </div>
                        <p className="text-[9px] text-stone-500 italic mb-4">Ultimate Personal IP & Philosophy.</p>
                        
                        <ul className="text-[10px] text-stone-600 space-y-2 mb-5 min-h-[60px]">
                          <li className="flex items-center gap-2"><Check size={12} className="text-emerald-600 shrink-0"/> Includes $1.99 & $4.99 sets</li>
                          <li className="flex items-start gap-2"><Check size={12} className="text-emerald-600 shrink-0 mt-0.5"/> <div><strong className="text-stone-800">Name Deconstruction:</strong> Elements & Roots.</div></li>
                          <li className="flex items-start gap-2"><Check size={12} className="text-emerald-600 shrink-0 mt-0.5"/> <div><strong className="text-stone-800">AI Zen Poetry:</strong> Exclusive bilingual poem generated for you.</div></li>
                        </ul>
                        
                        <button className="w-full bg-[#1C1A17] text-[#FDFBF7] py-2.5 rounded-xl text-[10px] font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 shadow-md opacity-60 cursor-not-allowed" disabled>
                          <CreditCard size={14}/> Disabled
                        </button>

                        <div className="mt-3 text-center">
                          <button 
                            onClick={() => {
                              showToast('Redeem function ready.');
                            }} 
                            className="text-[8px] text-stone-400 hover:text-stone-600 tracking-widest underline underline-offset-4 uppercase transition-colors"
                          >
                            Already purchased? Redeem here
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="mt-8 mb-4 flex flex-col items-center text-stone-400 space-y-2 shrink-0">
                <div className="text-[9px] font-mono tracking-widest opacity-60 uppercase">{uniqueIpId}</div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[8px] tracking-[0.2em] uppercase font-light">Secured By</span>
                  <span className="text-[10px] font-medium tracking-wide">Gumroad</span>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}
