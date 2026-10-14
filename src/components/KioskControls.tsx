import React, { useRef, useState } from 'react';
import {
  Download,
  Eye,
  EyeOff,
  Heart,
  Maximize2,
  Minimize2,
  Palette,
  Terminal,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Wand2
} from 'lucide-react';
import { getStandaloneHtmlCode } from '../standaloneCode';
import { Season } from '../types';

interface KioskControlsProps {
  onSpawnSimulated: () => void;
  onOpenDrawingModal: () => void;
  onUploadImage: (file: File) => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  onClearAll: () => void;
  onOpenPythonGuide: () => void;
  catCount: number;
  totalAdmitted: number;
  maxCats: number;
  season: Season;
  onSeasonChange: (newSeason: Season) => void;
  onAdoptOne: () => void;
  isCrisisMode: boolean;
  onSpawnBatch: () => void;
}

export const KioskControls: React.FC<KioskControlsProps> = ({
  onSpawnSimulated,
  onOpenDrawingModal,
  onUploadImage,
  onToggleSound,
  soundEnabled,
  onClearAll,
  onOpenPythonGuide,
  catCount,
  totalAdmitted,
  maxCats,
  season,
  onSeasonChange,
  onAdoptOne,
  isCrisisMode,
  onSpawnBatch
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDownloadStandalone = () => {
    const code = getStandaloneHtmlCode();
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/webp,image/jpeg"
        className="hidden"
      />

      <div
        className={`fixed bottom-4 right-4 z-40 transition-all duration-300 ${
          isMinimized ? 'translate-y-12' : 'translate-y-0'
        }`}
      >
        <div className="relative bg-[#fffdf7] border-3 border-[#c5a059] rounded-2xl p-2.5 shadow-xl cardstock-shadow flex flex-wrap items-center gap-2">
          {/* Top washi tape accent */}
          <div className="absolute -top-3 left-8 w-24 h-5 washi-tape-yellow -rotate-1 rounded-xs" />

          {/* Minimize / expand toggle button */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-xl bg-[#f5ecd8] text-[#7a4e2d] hover:bg-[#ebd8b8] transition-colors"
            title={isMinimized ? '展開展覽控制台' : '收合控制台 (投影時亦可按 H)'}
          >
            {isMinimized ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>

          {!isMinimized && (
            <>
              {/* Stats Badge */}
              <div className="px-3 py-1 bg-[#fbf6ec] border border-[#e0cb9e] rounded-xl text-xs font-bold text-[#8c5025] flex items-center gap-1.5">
                <span>樂園貓咪:</span>
                <span className="text-[#d9480f]">{catCount}</span>
                <span>/ {maxCats}</span>
                <span className="text-[#a37951]">· 累計: {totalAdmitted}</span>
              </div>

              {/* Season Selector Tabs */}
              <div className="flex items-center gap-1 p-0.5 bg-[#f4ecd8] border border-[#d4b383] rounded-xl">
                <button
                  onClick={() => onSeasonChange('spring')}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    season === 'spring'
                      ? 'bg-[#ffb7b2] text-[#8c2d2d] shadow-xs scale-105'
                      : 'text-[#7a4e2d] hover:bg-[#edd8b7]'
                  }`}
                  title="切換春季 (花瓣草地、蝴蝶撲跳)"
                >
                  🌸 春
                </button>
                <button
                  onClick={() => onSeasonChange('summer')}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    season === 'summer'
                      ? 'bg-[#ffd166] text-[#8c5025] shadow-xs scale-105'
                      : 'text-[#7a4e2d] hover:bg-[#edd8b7]'
                  }`}
                  title="切換夏季 (盛夏綠意、貓貓趴平散熱)"
                >
                  ☀️ 夏
                </button>
                <button
                  onClick={() => onSeasonChange('autumn')}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    season === 'autumn'
                      ? 'bg-[#f76707] text-white shadow-xs scale-105'
                      : 'text-[#7a4e2d] hover:bg-[#edd8b7]'
                  }`}
                  title="切換秋季 (楓葉橘黃、落葉堆玩耍)"
                >
                  🍁 秋
                </button>
                <button
                  onClick={() => onSeasonChange('winter')}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    season === 'winter'
                      ? 'bg-[#e7f5ff] text-[#1971c2] shadow-xs border border-[#a5d8ff] scale-105'
                      : 'text-[#7a4e2d] hover:bg-[#edd8b7]'
                  }`}
                  title="切換冬季 (銀白雪景、白色毛線雪球、縮成毛球與打噴嚏)"
                >
                  ❄️ 冬
                </button>
              </div>

              {/* Action: Adopt Cat */}
              <button
                onClick={onAdoptOne}
                disabled={catCount === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 ${
                  isCrisisMode
                    ? 'bg-[#e03131] hover:bg-[#c92a2a] animate-bounce'
                    : 'bg-[#ff6b81] hover:bg-[#fa5252]'
                } ${catCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="認養帶走一隻浪浪 (數量 -1，解除超載危機)"
              >
                <Heart size={14} className="fill-current" />
                愛心認養 (-1)
              </button>

              {/* Action: Simulate scan */}
              <button
                onClick={onSpawnSimulated}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f79f4a] hover:bg-[#f58f33] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95"
                title="隨機生成手繪蠟筆貓空投進入樂園 (+1)"
              >
                <Wand2 size={14} />
                模擬新貓 (+1)
              </button>

              {/* Action: Batch test (+5 cats) */}
              <button
                onClick={onSpawnBatch}
                className="flex items-center gap-1 px-2 py-1.5 bg-[#f59f00] hover:bg-[#e67700] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95"
                title="連續空投 5 隻貓咪 (測試快速累積至 25 隻超載上限)"
              >
                +5 貓
              </button>

              {/* Action: Draw cat */}
              <button
                onClick={onOpenDrawingModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8590c] hover:bg-[#d9480f] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95"
                title="打開手繪畫板，在螢幕上繪畫並空投"
              >
                <Palette size={15} />
                現場畫貓
              </button>

              {/* Action: Upload local PNG */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f4ebd9] hover:bg-[#ebd5b3] text-[#5c3a21] text-xs font-bold rounded-xl border border-[#d4b383] transition-colors"
                title="手動選擇本地透明背景 PNG 測試掃描效果"
              >
                <Upload size={14} />
                測試圖檔
              </button>

              {/* Action: Sound Toggle */}
              <button
                onClick={onToggleSound}
                className={`p-1.5 rounded-xl border transition-colors ${
                  soundEnabled
                    ? 'bg-[#e7f5ff] border-[#a5d8ff] text-[#1c7ed6]'
                    : 'bg-[#f8f9fa] border-[#dee2e6] text-[#adb5bd]'
                }`}
                title={soundEnabled ? '音效開啟 (點擊關閉)' : '音效關閉 (點擊開啟)'}
              >
                {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>

              {/* Action: Python Guide */}
              <button
                onClick={onOpenPythonGuide}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#e6fcf5] hover:bg-[#c3fae8] text-[#0ca678] text-xs font-bold rounded-xl border border-[#96f2d7] transition-colors"
                title="檢視 Python 本機掃描器與 cats/ 對接設定"
              >
                <Terminal size={14} />
                Python 對接
              </button>

              {/* Action: Download Standalone HTML */}
              <button
                onClick={handleDownloadStandalone}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#fff3bf] hover:bg-[#ffec99] text-[#d9480f] text-xs font-bold rounded-xl border border-[#ffd43b] transition-colors"
                title="下載完全獨立的單一 index.html 檔案 (供離線 python -m http.server 直接運行)"
              >
                <Download size={14} />
                下載單機 HTML
              </button>

              {/* Action: Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-xl bg-[#f4ebd9] hover:bg-[#ebd5b3] text-[#5c3a21] border border-[#d4b383] transition-colors"
                title={isFullscreen ? '退出全螢幕' : '全螢幕 Kiosk 模式 (快捷鍵: F)'}
              >
                {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>

              {/* Action: Clear */}
              <button
                onClick={onClearAll}
                className="p-1.5 rounded-xl bg-[#fff5f5] hover:bg-[#ffe3e3] text-[#fa5252] border border-[#ffc9c9] transition-colors"
                title="清空樂園所有貓咪"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
