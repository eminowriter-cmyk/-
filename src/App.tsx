import { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { DEFAULT_UPDATE_SOURCE_URL, DetectedOS } from './installer/types';
import { InstallerWizard } from './components/InstallerWizard';
import { GitHubReleaseSection } from './components/GitHubReleaseSection';
import { ReferenceSections } from './components/ReferenceSections';
import { LatestFrontendPreview } from './components/LatestFrontendPreview';

function detectUserOS(): DetectedOS {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'macos';
  if (ua.includes('windows')) return 'windows';
  return 'other';
}

export default function App() {
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [updateSourceUrl, setUpdateSourceUrl] = useState<string>(DEFAULT_UPDATE_SOURCE_URL);
  const detectedOS = useMemo(() => detectUserOS(), []);

  return (
    <div className="min-h-screen paper-grain-bg text-[#3B3532] flex flex-col">
      {/* Top Bar Contract: Exact 3 zones (Single-line Brand | 5 Nav Links | 1 Primary CTA) */}
      <header className="sticky top-0 z-30 bg-[#FBF5E6]/95 backdrop-blur-xs border-b border-[#D8CEBC]">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#wizard"
            className="text-base sm:text-lg font-black tracking-tight text-[#3B3532] whitespace-nowrap shrink-0"
          >
            跨界歸零 · 安裝助手
          </a>

          {/* Zone 2: 5 clean single-line text nav links */}
          <nav
            aria-label="主導覽"
            className="hidden md:flex items-center gap-6 text-sm font-bold text-[#635850]"
          >
            <a
              href="#wizard"
              className="hover:text-[#3B3532] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              安裝精靈
            </a>
            <a
              href="#auto-update"
              className="hover:text-[#3B3532] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              自動更新
            </a>
            <a
              href="#modules"
              className="hover:text-[#3B3532] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              功能模組
            </a>
            <a
              href="#platforms"
              className="hover:text-[#3B3532] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              系統支援
            </a>
            <a
              href="#troubleshoot"
              className="hover:text-[#3B3532] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              常見排除
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C86D4D] hover:bg-[#AE593B] text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532]"
            >
              <Eye size={15} />
              <span>預覽最新版樂園</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <InstallerWizard
          detectedOS={detectedOS}
          updateSourceUrl={updateSourceUrl}
          onUpdateSourceUrlChange={setUpdateSourceUrl}
          onOpenPreview={() => setIsPreviewOpen(true)}
        />
        <GitHubReleaseSection updateSourceUrl={updateSourceUrl} />
        <ReferenceSections />
      </main>

      <footer className="border-t border-[#D8CEBC] bg-[#F5ECD9]/70">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#635850]">
          <span>跨界歸零｜貓咪互動樂園 · 毛屋暖陽・手作紙藝庭院離線安裝與自動更新助手</span>
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="font-bold text-[#AE593B] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
          >
            開啟最新版前端預覽
          </button>
        </div>
      </footer>

      {isPreviewOpen && (
        <LatestFrontendPreview onClose={() => setIsPreviewOpen(false)} />
      )}
    </div>
  );
}
