import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, RefreshCw } from 'lucide-react';
import {
  buildRemoteReleaseManifestJson,
  normalizeGitHubUpdateUrl
} from '../installer/githubUpdateUtils';

interface GitHubReleaseSectionProps {
  updateSourceUrl: string;
}

export const GitHubReleaseSection: React.FC<GitHubReleaseSectionProps> = ({
  updateSourceUrl
}) => {
  const [nextVersion, setNextVersion] = useState<string>('1.0.1');
  const [releaseNotes, setReleaseNotes] = useState<string>(
    '更新最新版手作紙藝前端畫面與展覽細節優化'
  );
  const [includeIndexHtml, setIncludeIndexHtml] = useState<boolean>(true);
  const [includeServerPy, setIncludeServerPy] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const normalized = useMemo(
    () => normalizeGitHubUpdateUrl(updateSourceUrl),
    [updateSourceUrl]
  );

  const manifestJsonText = useMemo(
    () =>
      buildRemoteReleaseManifestJson({
        version: nextVersion,
        notes: releaseNotes,
        includeIndexHtml,
        includeServerPy
      }),
    [nextVersion, releaseNotes, includeIndexHtml, includeServerPy]
  );

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(manifestJsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback for restricted iframe clipboard permissions
      const textarea = document.createElement('textarea');
      textarea.value = manifestJsonText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([manifestJsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'version.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <section
      id="auto-update"
      aria-label="GitHub 自動更新與發布助手"
      className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 pb-16"
    >
      <div className="scroll-mt-20 pt-10 border-t border-[#D8CEBC]">
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#635850] mb-1">
              開機自動偵測 · 原生彈窗提醒 · 舊版自動備份與一鍵還原
            </p>
            <h2 className="text-xl font-black text-[#3B3532]">
              如何透過 GitHub 自動推送新版本給展場電腦
            </h2>
          </div>
          <div className="text-xs text-[#635850] font-mono truncate max-w-[440px]">
            目前設定來源：{normalized.valid ? normalized.displayLabel : '請於步驟 03 填寫 GitHub 網址'}
          </div>
        </div>

        {/* Single-Elevation Split Workspace */}
        <div className="bg-[#FBF5E6] border border-[#C7BBA7] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Interactive version.json Release Generator */}
          <div className="lg:col-span-7 p-6 sm:p-7 space-y-5 border-b lg:border-b-0 lg:border-r border-[#D8CEBC]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#3B3532]">
                  GitHub 發布版本清單產生器（version.json）
                </h3>
                <p className="text-xs text-[#635850] mt-0.5">
                  每次更新網站後，將此檔案連同新版 index.html 上傳至 GitHub，已安裝的電腦啟動就會自動跳出更新提醒。
                </p>
              </div>
              <RefreshCw size={18} className="text-[#AE593B] shrink-0 hidden sm:block" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="release-version-input"
                  className="block text-xs font-bold text-[#3B3532] mb-1.5"
                >
                  新版本編號
                </label>
                <input
                  id="release-version-input"
                  type="text"
                  value={nextVersion}
                  onChange={(e) => setNextVersion(e.target.value)}
                  placeholder="1.0.1"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FFFDF8] border border-[#C7BBA7] rounded-lg text-[#3B3532] focus:outline-none focus:border-[#C86D4D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="release-notes-input"
                  className="block text-xs font-bold text-[#3B3532] mb-1.5"
                >
                  更新說明（將直接顯示在展場電腦的更新彈窗中）
                </label>
                <input
                  id="release-notes-input"
                  type="text"
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="例如：修正便條位置與新增互動彩蛋"
                  className="w-full px-3 py-2 text-sm bg-[#FFFDF8] border border-[#C7BBA7] rounded-lg text-[#3B3532] focus:outline-none focus:border-[#C86D4D]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
              <span className="font-bold text-[#3B3532]">本次要自動替換的檔案：</span>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeIndexHtml}
                  onChange={(e) => {
                    if (!e.target.checked && !includeServerPy) return;
                    setIncludeIndexHtml(e.target.checked);
                  }}
                  className="w-4 h-4 accent-[#5A7D5A] cursor-pointer"
                />
                <span className="font-mono font-bold text-[#3B3532]">index.html</span>
                <span className="text-xs text-[#635850]">（最新版互動前端）</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeServerPy}
                  onChange={(e) => {
                    if (!e.target.checked && !includeIndexHtml) return;
                    setIncludeServerPy(e.target.checked);
                  }}
                  className="w-4 h-4 accent-[#5A7D5A] cursor-pointer"
                />
                <span className="font-mono font-bold text-[#3B3532]">server.py</span>
                <span className="text-xs text-[#635850]">（本機伺服器）</span>
              </label>
            </div>

            {/* Live JSON Preview */}
            <div className="bg-[#2B2724] text-[#F3E8D2] rounded-lg border border-[#3B3532] overflow-hidden">
              <div className="px-3.5 py-2 border-b border-[#46403B] flex items-center justify-between text-xs">
                <span className="font-mono text-[#D8CEBC]">version.json</span>
                <span className="text-[#B8AD9B] font-mono tabular-nums">
                  v{nextVersion.trim() || '1.0.1'}
                </span>
              </div>
              <pre className="p-3.5 text-xs leading-relaxed font-mono overflow-x-auto">
                {manifestJsonText}
              </pre>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C86D4D] hover:bg-[#AE593B] text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532]"
              >
                <Download size={15} />
                <span>下載 version.json</span>
              </button>

              <button
                type="button"
                onClick={() => void handleCopyJson()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F3E8D2] hover:bg-[#E7D8BA] text-[#3B3532] border border-[#C7BBA7] text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {copied ? <Check size={15} className="text-[#5A7D5A]" /> : <Copy size={15} />}
                <span>{copied ? '已複製到剪貼簿' : '複製 JSON 內容'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: 3-Step Workflow + Safety Guarantees */}
          <div className="lg:col-span-5 p-6 sm:p-7 bg-[#F5ECD9]/60 flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#3B3532] mb-4">
                三步驟完成遠端推送更新
              </h3>
              <ol className="space-y-4 text-xs sm:text-sm text-[#635850]">
                <li className="pb-4 border-b border-[#E2D8C5]">
                  <div className="font-bold text-[#3B3532] tabular-nums mb-1">
                    01. 上傳新版檔案至您的 GitHub
                  </div>
                  <p className="leading-relaxed">
                    把更新後的 <span className="font-mono text-[#3B3532]">index.html</span>（若有改伺服器則一併上傳{' '}
                    <span className="font-mono text-[#3B3532]">server.py</span>）與左側產生的{' '}
                    <span className="font-mono text-[#3B3532]">version.json</span> 推送到步驟 03 設定的 GitHub 專案或 GitHub Pages 根目錄。
                  </p>
                </li>

                <li className="pb-4 border-b border-[#E2D8C5]">
                  <div className="font-bold text-[#3B3532] tabular-nums mb-1">
                    02. 展場電腦開機自動捕捉新版
                  </div>
                  <p className="leading-relaxed">
                    工作人員照常雙擊「啟動貓咪互動樂園」時，內建的{' '}
                    <span className="font-mono text-[#3B3532]">updater.py</span> 會自動檢查 GitHub（4 秒逾時，斷網直接開展不卡頓）。即使忘記更新{' '}
                    <span className="font-mono text-[#3B3532]">version.json</span>，只要{' '}
                    <span className="font-mono text-[#3B3532]">index.html</span> 內容指紋變動也會自動偵測！
                  </p>
                </li>

                <li>
                  <div className="font-bold text-[#3B3532] tabular-nums mb-1">
                    03. 原生彈窗一鍵下載、備份並替換
                  </div>
                  <p className="leading-relaxed">
                    點擊彈窗中的「立即更新並重啟」，系統會先下載至暫存區驗證完整性與語法、自動把舊版備份進{' '}
                    <span className="font-mono text-[#3B3532]">.backups/</span>、安全替換程式檔並立即重啟。
                  </p>
                </li>
              </ol>
            </div>

            <div className="pt-4 border-t border-[#D8CEBC] text-xs text-[#635850] space-y-1.5">
              <div className="font-bold text-[#3B3532]">資料安全與一鍵還原保證</div>
              <p className="leading-relaxed">
                更新引擎僅允許透過 HTTPS 從受信任的 GitHub 網域替換{' '}
                <span className="font-mono text-[#3B3532]">index.html</span> 與{' '}
                <span className="font-mono text-[#3B3532]">server.py</span>，絕不觸碰{' '}
                <span className="font-mono text-[#3B3532]">cats/</span> 貓咪圖庫。若新版需要回復，雙擊資料夾內的「檢查更新與還原舊版」即可一鍵回到上一版。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
