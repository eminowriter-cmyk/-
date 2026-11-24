import React, { useEffect } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { LATEST_FRONTEND_URL } from '../installer/types';

interface LatestFrontendPreviewProps {
  onClose: () => void;
}

export const LatestFrontendPreview: React.FC<LatestFrontendPreviewProps> = ({ onClose }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-[#F3E8D2] flex flex-col">
      <iframe
        src={LATEST_FRONTEND_URL}
        title="跨界歸零｜貓咪互動樂園 最新版前端預覽"
        className="w-full h-full border-0 flex-1"
      />

      {/* Positioned at bottom-left, staying clear of the top-left sticky note and bottom-right kiosk bar */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-[#FBF5E6]/95 border-2 border-[#3B3532] rounded-lg px-2.5 py-1.5 shadow-[2px_3px_0_rgba(59,53,50,0.2)]">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#C86D4D] hover:bg-[#AE593B] text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532]"
        >
          <ArrowLeft size={14} />
          <span>返回安裝助手</span>
        </button>

        <a
          href={LATEST_FRONTEND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[#3B3532] hover:bg-[#F3E8D2] text-xs font-bold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532]"
          title="在新分頁單獨開啟最新版前端"
        >
          <span>新分頁開啟</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
};
