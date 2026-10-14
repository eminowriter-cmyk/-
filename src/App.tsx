import { useEffect, useRef, useState, useCallback } from 'react';
import { CatParadiseEngine } from './engine';
import { generateCrayonCatDataUrl, getAllInitialCats } from './sampleCats';
import { sound } from './audio';
import { Season } from './types';
import { CrayonDrawingModal } from './components/CrayonDrawingModal';
import { PythonGuideModal } from './components/PythonGuideModal';
import { KioskControls } from './components/KioskControls';
import { EducationStickyNote } from './components/EducationStickyNote';
import { AlertTriangle, Heart } from 'lucide-react';

interface SeasonThemeConfig {
  name: string;
  subtitle: string;
  streetSky: string;
  shelterSky: string;
  sunColor: string;
  sunRayColor: string;
  lawnBack: string;
  lawnFront: string;
  seasonBadge: string;
}

const SEASON_CONFIGS: Record<Season, SeasonThemeConfig> = {
  spring: {
    name: '春暖花開',
    subtitle: '櫻花飄落 · 蝴蝶翩翩撲抓',
    streetSky: 'linear-gradient(180deg, #d8d3c5 0%, #ecdcb5 100%)',
    shelterSky: 'radial-gradient(circle at 70% 30%, #fff7f0 0%, #faeed1 60%, #ecdcb5 100%)',
    sunColor: '#ffd166',
    sunRayColor: 'rgba(255, 146, 43, 0.5)',
    lawnBack: '#82c91e',
    lawnFront: '#94d82d',
    seasonBadge: '春季 · 櫻花微風 🌸'
  },
  summer: {
    name: '盛夏綠意',
    subtitle: '豔陽高照 · 貓咪趴平散熱',
    streetSky: 'linear-gradient(180deg, #ded5be 0%, #f5e4ab 100%)',
    shelterSky: 'radial-gradient(circle at 70% 30%, #fffbe6 0%, #fef3c7 60%, #fae8a0 100%)',
    sunColor: '#ff922b',
    sunRayColor: 'rgba(247, 103, 7, 0.6)',
    lawnBack: '#51cf66',
    lawnFront: '#40c057',
    seasonBadge: '夏季 · 綠意融化 ☀️'
  },
  autumn: {
    name: '金秋楓紅',
    subtitle: '落葉繽紛 · 埋進落葉堆翻滾',
    streetSky: 'linear-gradient(180deg, #d3c4b5 0%, #e6cbab 100%)',
    shelterSky: 'radial-gradient(circle at 70% 30%, #fdf6ec 0%, #f9e8d2 60%, #edd3b4 100%)',
    sunColor: '#f76707',
    sunRayColor: 'rgba(217, 72, 15, 0.6)',
    lawnBack: '#d97706',
    lawnFront: '#e8590c',
    seasonBadge: '秋季 · 楓葉翻滾 🍁'
  },
  winter: {
    name: '銀白雪季',
    subtitle: '初雪皚皚 · 白色毛線雪球與打噴嚏',
    streetSky: 'linear-gradient(180deg, #cfdbe6 0%, #d8e6f3 100%)',
    shelterSky: 'radial-gradient(circle at 70% 30%, #f0f7fd 0%, #e2effa 60%, #d0e4f5 100%)',
    sunColor: '#e7f5ff',
    sunRayColor: 'rgba(165, 216, 255, 0.7)',
    lawnBack: '#d0ebff',
    lawnFront: '#ffffff',
    seasonBadge: '冬季 · 蜷縮打噴嚏 ❄️'
  }
};

const LIMIT = 25; // 流浪貓超載危機上限

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CatParadiseEngine | null>(null);

  const [season, setSeason] = useState<Season>('spring');
  const [catCount, setCatCount] = useState<number>(0);
  const [totalAdmitted, setTotalAdmitted] = useState<number>(0);
  const [isCrisisMode, setIsCrisisMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDrawingOpen, setIsDrawingOpen] = useState<boolean>(false);
  const [isPythonGuideOpen, setIsPythonGuideOpen] = useState<boolean>(false);
  const [lastScannedName, setLastScannedName] = useState<string>('系統就緒');

  const currentTheme = SEASON_CONFIGS[season];
  const scannedFilesRef = useRef<Set<string>>(new Set());

  // Initialize engine and canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new CatParadiseEngine(canvas);
    engineRef.current = engine;
    engine.LIMIT = LIMIT;

    engine.onCatCountChange = (count, total) => {
      setCatCount(count);
      setTotalAdmitted(total);
      setIsCrisisMode(count >= LIMIT);
    };

    engine.onCrisisModeChange = (crisis) => {
      setIsCrisisMode(crisis);
    };

    engine.start();

    // Populate initial sample crayon cats for immediate visual delight (6 initial cats)
    const initialCats = getAllInitialCats();
    initialCats.slice(0, 6).forEach((catData, i) => {
      setTimeout(() => {
        if (engineRef.current) {
          engineRef.current.addCat(catData.name, catData.dataUrl);
          setLastScannedName(catData.name);
        }
      }, i * 400 + 200);
    });

    const handleWindowResize = () => {
      engine.handleResize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      engine.stop();
    };
  }, []);

  // Poll local cats/ folder (via Python HTTP server)
  useEffect(() => {
    let isCancelled = false;

    const pollCatsFolder = async () => {
      try {
        const res = await fetch('cats/manifest.json', { cache: 'no-store' });
        if (res.ok && !isCancelled) {
          const files: string[] = await res.json();
          if (Array.isArray(files)) {
            for (const filename of files) {
              if (!scannedFilesRef.current.has(filename)) {
                scannedFilesRef.current.add(filename);
                if (engineRef.current) {
                  engineRef.current.addCat(filename.replace(/\.[^/.]+$/, ''), `cats/${filename}`);
                  setLastScannedName(filename);
                }
              }
            }
          }
        }
      } catch {
        // Quiet fallback if running directly or offline without Python manifest yet
      }
    };

    const interval = setInterval(pollCatsFolder, 3000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Interactive Canvas Click / Petting & Adoption Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    engineRef.current.petCatAt(x, y);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === '1') {
        handleSeasonChange('spring');
      } else if (e.key === '2') {
        handleSeasonChange('summer');
      } else if (e.key === '3') {
        handleSeasonChange('autumn');
      } else if (e.key === '4') {
        handleSeasonChange('winter');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Action: Season Change
  const handleSeasonChange = useCallback((newSeason: Season) => {
    setSeason(newSeason);
    if (engineRef.current) {
      engineRef.current.setSeason(newSeason);
    }
    sound.playPaperRustle();
    if (newSeason === 'winter') {
      sound.playSneeze();
    } else {
      sound.playMeow(1.05);
    }
  }, []);

  // Action: Spawn a simulated crayon cat
  const handleSpawnSimulated = useCallback(() => {
    if (!engineRef.current) return;
    const newCat = generateCrayonCatDataUrl();
    engineRef.current.addCat(newCat.name, newCat.dataUrl);
    setLastScannedName(newCat.name);
  }, []);

  // Action: Batch spawn (+5 cats) to test Crisis Mode
  const handleSpawnBatch = useCallback(() => {
    if (!engineRef.current) return;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (engineRef.current) {
          const newCat = generateCrayonCatDataUrl();
          engineRef.current.addCat(newCat.name, newCat.dataUrl);
          setLastScannedName(newCat.name);
        }
      }, i * 250);
    }
  }, []);

  // Action: Adopt one cat (解危機制)
  const handleAdoptOne = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.adoptCat();
  }, []);

  // Action: Upload a local PNG to test scanning
  const handleUploadImage = useCallback((file: File) => {
    if (!engineRef.current) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && engineRef.current) {
        const catName = file.name.replace(/\.[^/.]+$/, '') || '上傳小貓';
        engineRef.current.addCat(catName, e.target.result as string);
        setLastScannedName(catName);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Action: Drawing modal complete
  const handleDrawingComplete = useCallback((dataUrl: string, name: string) => {
    if (!engineRef.current) return;
    engineRef.current.addCat(name, dataUrl);
    setLastScannedName(name);
  }, []);

  // Action: Toggle Sound
  const handleToggleSound = useCallback(() => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
  }, []);

  // Action: Clear All Cats
  const handleClearAll = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.clearAll();
    scannedFilesRef.current.clear();
    setLastScannedName('樂園已清空');
  }, []);

  const progressPercent = Math.min(100, Math.round((catCount / LIMIT) * 100));

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none bg-[#f4ecd8] transition-colors duration-700 ${
      isCrisisMode ? 'crisis-frame' : ''
    }`}>
      {/* ================= 升級任務一：背景分區重建（左半邊街頭 vs 右半邊收容所） ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex">
        {/* ----- 左半邊：流浪貓街頭（Stray Cat Street） ----- */}
        <div
          className="relative w-1/2 h-full overflow-hidden transition-all duration-700 border-r-2 border-dashed border-[#b89464]/60"
          style={{ background: currentTheme.streetSky }}
        >
          {/* 街頭紙質告示貼牌 */}
          <div className="absolute top-5 left-7 z-10 -rotate-2">
            <div className="relative bg-[#fffcee] border-2 border-[#b89464] px-3.5 py-1.5 rounded-sm shadow-md">
              <div className="absolute -top-3 left-4 w-16 h-5 washi-tape-yellow rotate-1 rounded-xs" />
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🐾</span>
                <span className="text-xs md:text-sm font-black text-[#6d4c28]">
                  流浪貓街頭 · Stray Cat Street
                </span>
              </div>
            </div>
          </div>

          {/* 蠟筆手繪破舊紅磚牆 (Brick Wall Collage) */}
          <div className="absolute bottom-24 left-0 w-full h-44 opacity-80 pointer-events-none">
            {/* Brick Rows */}
            <div className="w-full h-full flex flex-col justify-between p-2">
              {[0, 1, 2, 3, 4].map(row => (
                <div
                  key={row}
                  className="flex gap-2 h-7"
                  style={{ transform: row % 2 === 1 ? 'translateX(-20px)' : 'none' }}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(col => (
                    <div
                      key={col}
                      className="flex-1 bg-[#ba5d46] rounded-xs border-b-2 border-r-2 border-[#8c3f2d] shadow-2xs relative"
                      style={{
                        backgroundColor: (row + col) % 3 === 0 ? '#a64b35' : (row + col) % 3 === 1 ? '#ba5d46' : '#c96a53'
                      }}
                    >
                      {/* Crayon mortar line speck */}
                      <div className="absolute bottom-0.5 right-1 w-2 h-0.5 bg-[#ecdcb5]/50 rounded-full" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 手繪剪貼電線桿與低垂電線 (Utility Pole & Wires) */}
          <div className="absolute top-0 left-28 pointer-events-none">
            {/* Pole Body */}
            <div className="w-4 h-80 bg-[#7c5332] border-r border-[#5c3a21] shadow-md rounded-xs relative">
              {/* Pole cross arm */}
              <div className="absolute top-14 -left-7 w-18 h-3.5 bg-[#96663f] border border-[#5c3a21] rounded-xs">
                {/* Ceramic insulators */}
                <div className="absolute -top-2 left-1.5 w-2 h-2.5 bg-[#e9ecef] rounded-xs border border-[#adb5bd]" />
                <div className="absolute -top-2 right-1.5 w-2 h-2.5 bg-[#e9ecef] rounded-xs border border-[#adb5bd]" />
              </div>
            </div>
            {/* Wires drooping toward the center */}
            <svg className="absolute top-14 left-2 w-96 h-36 overflow-visible pointer-events-none opacity-60">
              <path
                d="M 0,0 Q 160,55 350,15"
                fill="none"
                stroke="#495057"
                strokeWidth="1.8"
                strokeDasharray="4,2"
              />
              <path
                d="M 0,8 Q 180,65 350,28"
                fill="none"
                stroke="#6c757d"
                strokeWidth="1.4"
              />
            </svg>
          </div>

          {/* 破舊瓦楞紙箱堆 (Cardboard Boxes for Stray Cats) */}
          <div className="absolute bottom-28 left-12 flex items-end gap-3 pointer-events-none">
            {/* Box 1 */}
            <div className="w-24 h-18 corrugated-cardboard border-2 border-[#a37951] rounded-xs shadow-md p-1.5 relative rotate-[-3deg]">
              <div className="text-[9px] font-black text-[#5c3a21] bg-white/70 px-1 py-0.5 rounded-xs inline-block">
                📦 溫暖紙箱
              </div>
              <div className="absolute -top-2 right-3 w-8 h-3 washi-tape-mint rotate-3" />
            </div>
            {/* Box 2 (tilted) */}
            <div className="w-20 h-14 bg-[#d4b383] border-2 border-[#a37951] rounded-xs shadow-md p-1 relative rotate-[4deg]">
              <div className="text-[8px] font-black text-[#7a4e2d]">
                🐟 愛心遮風
              </div>
            </div>
          </div>

          {/* 街頭地面 (深色粗糙石礫碎紙路) */}
          <div className="absolute bottom-0 left-0 w-full h-28 bg-[#8a7a6b] torn-edge-top opacity-90 shadow-inner" />
          <div className="absolute bottom-0 left-0 w-full h-20 bg-[#6b5d4f] torn-edge-top shadow-md" />
        </div>

        {/* ----- 右半邊：流浪動物收容所（Animal Shelter） ----- */}
        <div
          className="relative w-1/2 h-full overflow-hidden transition-all duration-700"
          style={{ background: currentTheme.shelterSky }}
        >
          {/* 收容所手繪溫馨招牌 */}
          <div className="absolute top-5 right-7 z-10 rotate-2">
            <div className="relative bg-[#fffdf0] border-2 border-[#d9480f] px-4 py-1.5 rounded-sm shadow-md flex items-center gap-2">
              <div className="absolute -top-3 left-6 w-20 h-5 washi-tape-pink -rotate-1 rounded-xs" />
              <span className="text-base animate-pulse">🏡</span>
              <span className="text-xs md:text-sm font-black text-[#d9480f]">
                愛心收容所 · Animal Shelter
              </span>
            </div>
          </div>

          {/* 太陽剪貼 */}
          <div
            className="absolute top-6 right-24 w-20 h-20 rounded-full border-3 border-dashed border-[#f79f4a]/70 shadow-lg pointer-events-none transition-colors duration-700"
            style={{ backgroundColor: currentTheme.sunColor }}
          >
            <div
              className="absolute -inset-2 border-2 border-dotted rounded-full animate-spin transition-colors duration-700"
              style={{ borderColor: currentTheme.sunRayColor, animationDuration: '60s' }}
            />
          </div>

          {/* 瓦楞紙質感柵欄 (Corrugated Cardboard Fence) */}
          <div className="absolute bottom-24 right-4 w-96 h-32 flex items-end gap-2.5 pointer-events-none opacity-85">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <div
                key={i}
                className="w-8 h-28 bg-[#d7b98e] border-2 border-[#a37951] rounded-t-lg shadow-sm relative flex flex-col justify-between p-1"
                style={{ height: i % 2 === 0 ? '110px' : '95px' }}
              >
                {/* Fence nail */}
                <div className="w-1.5 h-1.5 bg-[#8b5a2b] rounded-full mx-auto" />
                <div className="w-1.5 h-1.5 bg-[#8b5a2b] rounded-full mx-auto" />
              </div>
            ))}
            {/* Horizontal connecting planks */}
            <div className="absolute bottom-8 left-0 w-full h-3.5 bg-[#c4a377] border-y border-[#8b5a2b]" />
            <div className="absolute bottom-18 left-0 w-full h-3.5 bg-[#c4a377] border-y border-[#8b5a2b]" />
          </div>

          {/* 貓砂盆與水盆剪貼 (Litter Box & Bowls) */}
          <div className="absolute bottom-26 right-20 flex items-center gap-3 pointer-events-none">
            {/* Litter Box */}
            <div className="w-24 h-10 bg-[#e7f5ff] border-2 border-[#74c0fc] rounded-md shadow-md p-1 relative">
              <span className="text-[8px] font-bold text-[#1c7ed6] block text-center">
                ✨ 乾淨貓砂盆
              </span>
            </div>
            {/* Food Bowl */}
            <div className="w-10 h-7 bg-[#ffe3e3] border-2 border-[#ff8787] rounded-full shadow-xs flex items-center justify-center text-xs">
              🐟
            </div>
          </div>

          {/* 收容所草地 (健康溫馨綠草撕紙) */}
          <div
            className="absolute bottom-0 left-0 w-full h-28 torn-edge-top opacity-85 shadow-inner transition-colors duration-700"
            style={{ backgroundColor: currentTheme.lawnBack }}
          />
          <div
            className="absolute bottom-0 left-0 w-full h-20 torn-edge-top shadow-md transition-colors duration-700"
            style={{ backgroundColor: currentTheme.lawnFront }}
          />
        </div>
      </div>

      {/* ================= 升級任務二：頂部紙膠帶風格進度條與計數器 ================= */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1.5">
        {/* Main Title Badge */}
        <div className="relative bg-[#fffdf5] border-3 border-dashed border-[#8b5a2b] px-6 py-2 rounded-3xl shadow-[0_6px_16px_rgba(70,45,20,0.18)] flex items-center gap-3">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 washi-tape-mint rotate-1 rounded-xs" />
          <span className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>🐾</span>
          <h1 className="text-xl md:text-2xl font-black text-[#5c3a21] tracking-wider drop-shadow-xs">
            貓咪互動樂園 · 動保教育展
          </h1>
          <span className="text-2xl animate-bounce" style={{ animationDuration: '2.5s' }}>🐾</span>
        </div>

        {/* 紙膠帶風格進度條 (目前貓咪數量 / 25) */}
        <div className={`relative px-4 py-1.5 rounded-full shadow-md border-2 transition-all flex items-center gap-3 ${
          isCrisisMode
            ? 'bg-[#ffe3e3] border-[#fa5252] text-[#c92a2a] animate-pulse'
            : 'bg-[#fffcee] border-[#e0c89e] text-[#8c5025]'
        }`}>
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-black whitespace-nowrap">
            {isCrisisMode ? (
              <span className="flex items-center gap-1 text-[#e03131]">
                <AlertTriangle size={15} />
                超載警報！貓咪數量:
              </span>
            ) : (
              <span>目前貓咪數量:</span>
            )}
            <span className={`text-base font-black ${isCrisisMode ? 'text-[#c92a2a]' : 'text-[#d9480f]'}`}>
              {catCount}
            </span>
            <span className="text-xs text-[#a37951]">/ {LIMIT} (容納上限)</span>
          </div>

          {/* Progress bar container */}
          <div className="w-28 md:w-40 h-3 bg-[#e9ecef] rounded-full overflow-hidden border border-[#ced4da] shadow-inner relative">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                catCount >= LIMIT
                  ? 'bg-gradient-to-r from-[#fa5252] to-[#c92a2a]'
                  : catCount >= 18
                  ? 'bg-gradient-to-r from-[#ffd43b] to-[#f76707]'
                  : 'bg-gradient-to-r from-[#51cf66] to-[#40c057]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] font-bold text-[#868e96]">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* ================= 升級任務二：超載危機中央手作警告牌 (Crisis Mode) ================= */}
      {isCrisisMode && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none p-4">
          <div className="relative max-w-xl bg-[#fff5f5]/95 border-4 border-dashed border-[#e03131] rounded-2xl p-6 shadow-2xl cardstock-shadow text-center animate-in fade-in zoom-in-95 duration-300">
            {/* Top Washi Hazard Tape */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-48 h-7 washi-tape-hazard rotate-[-1deg] rounded-xs shadow-md" />

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl animate-bounce">🚨</span>
              <h2 className="text-lg md:text-xl font-black text-[#c92a2a] tracking-wide">
                空間不夠了！流浪貓的困境
              </h2>
              <span className="text-2xl animate-bounce">🚨</span>
            </div>

            <p className="text-sm md:text-base font-bold text-[#862e2e] leading-relaxed mb-3">
              當數量過多，收容所與街頭將面臨資源耗盡與生存空間不足。<br />
              我們需要從源頭解決問題！
            </p>

            <div className="bg-[#ffe3e3] border border-[#ffc9c9] rounded-xl py-2 px-4 inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#a61e4d]">
              <Heart size={16} className="fill-[#e03131] text-[#e03131]" />
              <span>點擊任意貓咪或「愛心認養」帶走浪浪，即可解除危機！</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. 左上角標語紙條 */}
      <div className="absolute top-20 left-6 z-20 pointer-events-none">
        <div className="relative bg-[#fffcee] border-2 border-[#e0c89e] px-4 py-2 rounded-sm shadow-[3px_4px_10px_rgba(0,0,0,0.12)] -rotate-1">
          <div className="absolute -top-3 left-4 w-16 h-5 washi-tape-pink rotate-2 rounded-xs shadow-xs" />
          <p className="text-xs font-black text-[#8c5025] flex items-center gap-1.5">
            <span>🎨</span>
            現場畫貓，掃描即可進入樂園！
          </p>
        </div>
      </div>

      {/* 3. 右上角偵測狀態貼條 */}
      <div className="absolute top-6 right-6 z-20 pointer-events-none">
        <div className="relative bg-[#fbf6ec] border-2 border-dashed border-[#b89464] px-3.5 py-1.5 rounded-2xl shadow-sm flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-[#7a4e2d]">
            本機偵測中 · 最新: <span className="text-[#d9480f]">{lastScannedName}</span>
          </span>
        </div>
      </div>

      {/* ================= 核心 2D 互動動畫畫布 ================= */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 z-10 w-full h-full cursor-pointer touch-none"
      />

      {/* ================= 升級任務三：科普衛教輪播看板 (10秒自動輪播 & 認養按鈕) ================= */}
      <EducationStickyNote
        onAdoptOne={handleAdoptOne}
        catCount={catCount}
        isCrisisMode={isCrisisMode}
      />

      {/* 展覽控制懸浮條 */}
      <KioskControls
        onSpawnSimulated={handleSpawnSimulated}
        onOpenDrawingModal={() => setIsDrawingOpen(true)}
        onUploadImage={handleUploadImage}
        onToggleSound={handleToggleSound}
        soundEnabled={soundEnabled}
        onClearAll={handleClearAll}
        onOpenPythonGuide={() => setIsPythonGuideOpen(true)}
        catCount={catCount}
        totalAdmitted={totalAdmitted}
        maxCats={LIMIT}
        season={season}
        onSeasonChange={handleSeasonChange}
        onAdoptOne={handleAdoptOne}
        isCrisisMode={isCrisisMode}
        onSpawnBatch={handleSpawnBatch}
      />

      {/* 現場畫貓手繪板 Modal */}
      <CrayonDrawingModal
        isOpen={isDrawingOpen}
        onClose={() => setIsDrawingOpen(false)}
        onComplete={handleDrawingComplete}
      />

      {/* Python 本地伺服器對接說明 Modal */}
      <PythonGuideModal
        isOpen={isPythonGuideOpen}
        onClose={() => setIsPythonGuideOpen(false)}
      />
    </div>
  );
}
