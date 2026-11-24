import React from 'react';
import { ExternalLink } from 'lucide-react';

export const INFO_PAGE_URL = 'https://lynn050.github.io/info-page/';

// Verified offline SVG QR code path generated via `qrcode` (errorCorrectionLevel: M, margin: 2)
// Encodes: https://lynn050.github.io/info-page/
export const INFO_PAGE_QR_PATH =
  'M2 2.5h7m1 0h1m1 0h1m1 0h2m1 0h1m1 0h3m2 0h7M2 3.5h1m5 0h1m1 0h1m4 0h1m2 0h1m1 0h1m1 0h1m1 0h1m5 0h1M2 4.5h1m1 0h3m1 0h1m2 0h1m5 0h1m6 0h1m1 0h3m1 0h1M2 5.5h1m1 0h3m1 0h1m1 0h3m1 0h1m1 0h1m2 0h1m4 0h1m1 0h3m1 0h1M2 6.5h1m1 0h3m1 0h1m3 0h3m1 0h2m3 0h1m2 0h1m1 0h3m1 0h1M2 7.5h1m5 0h1m6 0h1m5 0h2m1 0h1m5 0h1M2 8.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M10 9.5h2m1 0h2m3 0h3M2 10.5h1m1 0h2m1 0h3m1 0h1m3 0h1m2 0h5m1 0h1m2 0h1m1 0h2M2 11.5h3m1 0h1m4 0h2m2 0h2m1 0h5m1 0h1m1 0h1m3 0h1M2 12.5h1m5 0h1m1 0h1m1 0h1m2 0h1m2 0h1m1 0h1m1 0h1m2 0h2m1 0h2M2 13.5h1m1 0h1m2 0h1m2 0h1m1 0h2m3 0h1m2 0h2m2 0h3m3 0h1M5 14.5h4m1 0h3m1 0h1m1 0h2m1 0h3m1 0h1m3 0h2M2 15.5h1m1 0h1m4 0h1m2 0h2m2 0h3m2 0h1m1 0h2m3 0h3M3 16.5h1m2 0h1m1 0h1m4 0h1m1 0h1m3 0h3m1 0h2m1 0h1m1 0h3M2 17.5h1m1 0h4m3 0h1m2 0h1m1 0h2m4 0h1m2 0h1m3 0h1M3 18.5h3m2 0h1m1 0h1m1 0h2m2 0h1m3 0h1m4 0h3m1 0h1M7 19.5h1m1 0h2m1 0h1m3 0h2m1 0h1m2 0h2m1 0h1m1 0h3M2 20.5h1m1 0h3m1 0h1m1 0h2m2 0h4m2 0h1m1 0h2m1 0h2m1 0h1M6 21.5h2m2 0h3m2 0h2m2 0h2m1 0h1m2 0h2m1 0h1M3 22.5h2m1 0h1m1 0h1m2 0h2m2 0h2m2 0h2m1 0h7M10 23.5h3m1 0h1m3 0h3m1 0h1m3 0h5M2 24.5h7m1 0h2m2 0h1m1 0h1m1 0h1m1 0h3m1 0h1m1 0h2m1 0h1M2 25.5h1m5 0h1m1 0h1m1 0h1m1 0h3m5 0h1m3 0h2m2 0h1M2 26.5h1m1 0h3m1 0h1m2 0h1m2 0h1m4 0h1m2 0h5m1 0h1M2 27.5h1m1 0h3m1 0h1m1 0h2m2 0h2m1 0h1m1 0h1m1 0h1m4 0h2m2 0h1M2 28.5h1m1 0h3m1 0h1m1 0h1m2 0h4m2 0h2m4 0h1m2 0h1m1 0h1M2 29.5h1m5 0h1m2 0h1m1 0h2m1 0h1m1 0h1m1 0h1m1 0h1m1 0h2m1 0h1M2 30.5h7m1 0h1m6 0h1m2 0h3m1 0h1m1 0h1m2 0h1';

export const QrStickyNote: React.FC = () => {
  return (
    <aside
      aria-label="掃描 QR Code 查看動保資訊頁面"
      className="fixed top-4 left-4 z-30 select-none"
    >
      <a
        href={INFO_PAGE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block w-[156px] bg-[#fffbe6] border-2 border-[#d4b078] rounded-sm px-3 pt-3 pb-2.5 cardstock-shadow -rotate-1 hover:rotate-0 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92a2a]"
        title="點擊或使用手機掃描 QR Code 前往動保資訊頁"
      >
        {/* Top Washi Tape */}
        <div
          aria-hidden="true"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4.5 washi-tape-mint rotate-2 rounded-xs"
        />

        {/* Handmade Header */}
        <div className="text-center mb-1.5">
          <div className="text-[12px] font-black text-[#5c3a21] tracking-wide leading-tight">
            掃描看更多資訊
          </div>
          <div className="text-[10px] font-bold text-[#9c6631] leading-tight mt-0.5">
            動保衛教 · 認養指南
          </div>
        </div>

        {/* Crisp Scannable Offline QR Code */}
        <div className="bg-[#fffdf7] border-2 border-dashed border-[#c8a165] rounded-xs p-1 mx-auto w-[120px] h-[120px] flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 33 33"
            shapeRendering="crispEdges"
            className="w-full h-full"
            role="img"
            aria-label="前往 https://lynn050.github.io/info-page/ 的 QR Code"
          >
            <path fill="#fffdf7" d="M0 0h33v33H0z" />
            <path stroke="#3b2615" d={INFO_PAGE_QR_PATH} />
          </svg>
        </div>

        {/* Clean URL Footer */}
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[9.5px] font-bold text-[#7a4e2d] group-hover:text-[#d9480f] transition-colors">
          <span className="truncate">lynn050.github.io/info-page</span>
          <ExternalLink size={10} className="shrink-0" />
        </div>
      </a>
    </aside>
  );
};
