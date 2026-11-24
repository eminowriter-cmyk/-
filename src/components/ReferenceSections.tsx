import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const MODULES = [
  {
    index: '01',
    title: '最新版手作紙藝互動前端',
    file: 'app/index.html',
    summary:
      '完整打包您提供的最新版「毛屋暖陽・手作紙藝庭院」單檔網站，包含流浪街區與貓狗躍動園區雙分區、左上角可收合衛教與離線 QR Code 便條、25 隻超載危機警示、四季切換與現場蠟筆畫板。'
  },
  {
    index: '02',
    title: '本機離線伺服器與清單同步',
    file: 'app/server.py',
    summary:
      '固定相對工作路徑，啟動瞬間即確保 cats/ 目錄與 cats/manifest.json 存在，背景每 1.5 秒自動掃描新圖片同步至大螢幕，並支援啟動後自動開啟預設瀏覽器。'
  },
  {
    index: '03',
    title: '攝影機實體畫紙即時去背',
    file: 'app/camera_remove_bg.py',
    summary:
      '開啟 USB 或內建攝影機後，將觀眾在白紙畫好的貓咪對準框線並按空白鍵，即自動去除紙底、補上手作白色貼紙外框、縮放最佳尺寸並即時空投進互動樂園。'
  },
  {
    index: '04',
    title: '資料夾監控自動批次去背',
    file: 'app/folder_remove_bg.py',
    summary:
      '適合搭配手機傳圖或掃描機自動存檔。只要有新畫作圖片進入 input_photos/，背景監視器就會自動去背並寫入 cats/，同時觸發大螢幕空降。'
  },
  {
    index: '05',
    title: 'GitHub 自動更新與備份還原引擎',
    file: 'app/updater.py',
    summary:
      '啟動樂園前以 4 秒逾時快速比對 GitHub 版本清單或 index.html 雜湊指紋，有新版時彈出原生視窗一鍵下載替換，自動備份舊版至 .backups/ 並完整保留 cats/ 貓咪圖庫。'
  }
];

const FAQ_ITEMS = [
  {
    q: 'Windows 雙擊「點我開始安裝_Windows.bat」時跳出藍色警告視窗怎麼辦？',
    a: '這是 Windows SmartScreen 對未付費數位簽章的本機腳本所做的標準提醒。請點擊視窗中的「其他資訊」，接著按下「仍要執行」即可開啟圖形化安裝精靈。若想先確認內容，您可以隨時在上方步驟 04 點擊「Win 精靈」檢視完整腳本。'
  },
  {
    q: 'macOS 點擊「點我開始安裝_Mac.command」顯示無法驗證開發者或沒有執行權限？',
    a: '在 macOS 上初次執行下載的 .command 檔時，請改用「右鍵（或兩指點按）」選擇「打開」，在彈出視窗再按一次「打開」即可繞過初次攔截。我們的 ZIP 封裝已寫入 UNIX 755 執行權限；若因第三方解壓軟體遺失權限，只要打開終端機輸入 chmod +x 後將檔案拖進去按 Enter 一次即可永久雙擊使用。'
  },
  {
    q: '如果展場電腦完全還沒裝過 Python，安裝精靈會失敗嗎？',
    a: '不會直接崩潰。Windows 安裝精靈在偵測不到 Python 3 時，會彈出親切對話框讓您一鍵透過內建 winget 自動下載安裝 Python 3.12（或開啟官方下載頁）；macOS 安裝精靈則會引導安裝 Apple 命令列開發工具或開啟 python.org 官方安裝檔。'
  },
  {
    q: '展覽現場完全沒有網路，安裝完成後可以離線執行嗎？自動更新會卡住嗎？',
    a: '可以完全離線運行，且絕不會卡住。啟動時的 GitHub 更新檢查設有 4 秒安全逾時，一旦偵測無網路便會靜默略過並立刻開啟本機樂園；若勾選去背功能，僅首次安裝套件需要短暫網路，之後開展全程可離線穩定運作。'
  },
  {
    q: '自動更新會不會把現場已經畫好的 cats/ 貓咪圖檔覆蓋掉？如果想退回舊版怎麼辦？',
    a: '絕對不會。更新引擎設有嚴格白名單，只會替換 index.html 與 server.py，完全不會碰觸 cats/ 或 input_photos/。每次更新前系統還會自動將舊版備份到 .backups/ 資料夾，若想回復上一版，只要雙擊資料夾內的「檢查更新與還原舊版」即可一鍵還原。'
  }
];

export const ReferenceSections: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-16">
      {/* Section 1: Modules */}
      <section id="modules" className="scroll-mt-20 pt-10 border-t border-[#D8CEBC]">
        <div className="mb-6">
          <h2 className="text-xl font-black text-[#3B3532]">包含的功能模組</h2>
          <p className="mt-1 text-sm text-[#635850]">
            每一項模組皆為展覽單機環境客製整理，避免路徑錯亂、套件衝突與 404 錯誤。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
          {MODULES.map((mod) => (
            <div key={mod.index} className="pt-4 border-t border-[#E2D8C5]">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-base font-bold text-[#3B3532]">
                  <span className="font-mono text-xs text-[#AE593B] mr-2 tabular-nums">
                    {mod.index}.
                  </span>
                  {mod.title}
                </h3>
                <span className="font-mono text-xs text-[#84786D] shrink-0">{mod.file}</span>
              </div>
              <p className="mt-2 text-sm text-[#635850] leading-relaxed">{mod.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Platform Comparison */}
      <section id="platforms" className="scroll-mt-20 pt-10 border-t border-[#D8CEBC]">
        <div className="mb-6">
          <h2 className="text-xl font-black text-[#3B3532]">Windows 與 macOS 原生安裝精靈對照</h2>
          <p className="mt-1 text-sm text-[#635850]">
            不需預先安裝任何工具即可直接開啟視窗介面，依照系統原生慣例完成部署。
          </p>
        </div>

        <div className="bg-[#FBF5E6] border border-[#D8CEBC] rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[#D8CEBC] bg-[#F5ECD9] text-xs font-bold text-[#635850]">
                <th className="py-3 px-4 w-[24%]">項目</th>
                <th className="py-3 px-4 w-[38%]">Windows（10 / 11）</th>
                <th className="py-3 px-4 w-[38%]">macOS（Apple Silicon / Intel）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DCC8] text-[#3B3532]">
              <tr>
                <td className="py-3 px-4 font-bold text-xs sm:text-sm">雙擊安裝進入點</td>
                <td className="py-3 px-4 font-mono text-xs">點我開始安裝_Windows.bat</td>
                <td className="py-3 px-4 font-mono text-xs">點我開始安裝_Mac.command</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-xs sm:text-sm">圖形化安裝介面</td>
                <td className="py-3 px-4 text-xs sm:text-sm text-[#635850]">
                  內建 .NET WinForms 五步驟視窗（勾選同意、瀏覽資料夾、即時進度條）
                </td>
                <td className="py-3 px-4 text-xs sm:text-sm text-[#635850]">
                  內建 AppleScript 原生對話框與 Finder 資料夾選擇器
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-xs sm:text-sm">Python 環境處理</td>
                <td className="py-3 px-4 text-xs sm:text-sm text-[#635850]">
                  自動偵測 py / python，缺失時支援 winget 一鍵安裝，並建立獨立 .venv
                </td>
                <td className="py-3 px-4 text-xs sm:text-sm text-[#635850]">
                  自動搜尋 Homebrew / 系統 python3，以獨立 .venv 避開 PEP 668 限制
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-xs sm:text-sm">日常開展啟動方式</td>
                <td className="py-3 px-4 text-xs sm:text-sm text-[#635850]">
                  雙擊桌面「啟動貓咪互動樂園」.lnk 捷徑（自動檢查更新並開網頁）
                </td>
                <td className="py-3 px-4 text-xs sm:text-sm text-[#635850]">
                  雙擊桌面「啟動貓咪互動樂園.command」（自動檢查更新並開網頁）
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-xs sm:text-sm">自動更新與一鍵還原</td>
                <td className="py-3 px-4 text-xs sm:text-sm text-[#635850]">
                  原生 WinForms 更新通知視窗，並附「檢查更新與還原舊版.bat」
                </td>
                <td className="py-3 px-4 text-xs sm:text-sm text-[#635850]">
                  原生 AppleScript 更新通知對話框，並附「檢查更新與還原舊版.command」
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Troubleshooting Accordion */}
      <section id="troubleshoot" className="scroll-mt-20 pt-10 border-t border-[#D8CEBC]">
        <div className="mb-6">
          <h2 className="text-xl font-black text-[#3B3532]">展場安裝常見排除</h2>
          <p className="mt-1 text-sm text-[#635850]">
            現場布展若遇作業系統安全提醒或權限詢問，可依以下步驟快速排除。
          </p>
        </div>

        <div className="border-t border-[#D8CEBC] divide-y divide-[#D8CEBC]">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full py-4 text-left flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532]"
                >
                  <span className="text-sm sm:text-base font-bold text-[#3B3532]">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#635850] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="pb-4 pr-8 text-sm text-[#635850] leading-relaxed">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
