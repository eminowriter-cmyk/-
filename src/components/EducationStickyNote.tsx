import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, Sparkles, AlertCircle } from 'lucide-react';

interface EducationStickyNoteProps {
  onAdoptOne: () => void;
  catCount: number;
  isCrisisMode: boolean;
}

export const EDUCATIONAL_TIPS = [
  {
    tag: '源頭減量 · TNVR',
    title: '推廣 TNVR',
    content: '推廣 TNVR：捕捉、絕育、打疫苗、放回，從源頭控制數量！',
    icon: '✂️',
    bg: '#fff9db',
    tape: 'washi-tape-mint'
  },
  {
    tag: '給浪浪一個家',
    title: '認養代替購買',
    content: '認養代替購買：給收容所與街頭的浪浪一個溫暖的家。',
    icon: '🏡',
    bg: '#fff0f6',
    tape: 'washi-tape-pink'
  },
  {
    tag: '友善社區守則',
    title: '乾淨餵食守則',
    content: '乾淨餵食守則：餵食請用容器，吃完要收拾，不留殘渣破壞環境。',
    icon: '🥣',
    bg: '#f8f9fa',
    tape: 'washi-tape-yellow'
  },
  {
    tag: '尊重動物習性',
    title: '保持適當距離',
    content: '保持適當距離：遇見不熟悉的街貓請勿強行觸摸，避免貓咪緊張。',
    icon: '🐾',
    bg: '#f1f3f5',
    tape: 'washi-tape-mint'
  },
  {
    tag: '緊急救援通報',
    title: '尋求專業協助',
    content: '尋求專業協助：遇到受傷浪浪，請通報 1959 動保專線。',
    icon: '📞',
    bg: '#fff4e6',
    tape: 'washi-tape-pink'
  }
];

export const EducationStickyNote: React.FC<EducationStickyNoteProps> = ({
  onAdoptOne,
  catCount,
  isCrisisMode
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isHovered, setIsHovered] = useState(false);

  // Auto carousel every 10 seconds
  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setCurrentIndex(idx => (idx + 1) % EDUCATIONAL_TIPS.length);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isHovered]);

  const handlePrev = () => {
    setCurrentIndex(idx => (idx - 1 + EDUCATIONAL_TIPS.length) % EDUCATIONAL_TIPS.length);
    setSecondsLeft(10);
  };

  const handleNext = () => {
    setCurrentIndex(idx => (idx + 1) % EDUCATIONAL_TIPS.length);
    setSecondsLeft(10);
  };

  const currentTip = EDUCATIONAL_TIPS[currentIndex];

  return (
    <div
      className="fixed bottom-6 left-6 z-30 select-none max-w-sm transition-transform duration-300 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative px-5 py-4 rounded-md shadow-xl cardstock-shadow border-2 border-[#d9ba82] rotate-1"
        style={{ backgroundColor: currentTip.bg }}
      >
        {/* Top Paper Tape Pin */}
        <div
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 ${currentTip.tape} -rotate-2 rounded-xs shadow-xs`}
        />

        {/* Header tag & 10s countdown indicator */}
        <div className="flex items-center justify-between gap-2 border-b border-[#e5c290]/50 pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{currentTip.icon}</span>
            <span className="text-xs font-black text-[#8c5025] tracking-wide">
              {currentTip.tag}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#b07d4b] bg-white/70 px-1.5 py-0.5 rounded-full border border-[#d9ba82]/40">
              ⏱️ {secondsLeft}s 輪播
            </span>
          </div>
        </div>

        {/* Content with warm crayon font style */}
        <p className="text-xs md:text-sm font-bold text-[#4a2e18] leading-relaxed min-h-[46px] flex items-center">
          {currentTip.content}
        </p>

        {/* Navigation Dots and Arrows */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#e5c290]/40">
          <div className="flex items-center gap-1.5">
            {EDUCATIONAL_TIPS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(i);
                  setSecondsLeft(10);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-5 bg-[#d9480f]'
                    : 'bg-[#d9ba82] hover:bg-[#b07d4b]'
                }`}
                title={`第 ${i + 1} 則衛教知識`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 rounded-md bg-white/60 hover:bg-white text-[#7a4e2d] transition-colors border border-[#d9ba82]/50 shadow-2xs"
              title="上一則"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-md bg-white/60 hover:bg-white text-[#7a4e2d] transition-colors border border-[#d9ba82]/50 shadow-2xs"
              title="下一則"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Adopt Button (認養解危機動態) */}
        <div className="mt-2.5">
          <button
            onClick={onAdoptOne}
            disabled={catCount === 0}
            className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all transform active:scale-95 ${
              isCrisisMode
                ? 'bg-[#e03131] hover:bg-[#c92a2a] text-white animate-bounce'
                : 'bg-[#ff6b81] hover:bg-[#fa5252] text-white hover:shadow-md'
            } ${catCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart size={14} className="fill-current" />
            <span>點擊認養帶走一隻浪浪 💖</span>
            {isCrisisMode && (
              <span className="text-[11px] bg-white/30 px-1.5 py-0.5 rounded-full ml-1">
                解除超載!
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
