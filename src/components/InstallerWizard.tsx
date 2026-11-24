import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Download,
  Eye,
  FolderOpen,
  Globe,
  Laptop,
  Loader2,
  Monitor,
  RefreshCw,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import {
  BuildState,
  DetectedOS,
  InstallConfig,
  TargetPlatform,
  WizardStep
} from '../installer/types';
import {
  buildInstallerZip,
  BundleResult,
  formatBytes,
  getPackageManifest,
  triggerZipDownload
} from '../installer/zipBundler';
import {
  generateMacCommandInstaller,
  generateWindowsGuiPs1
} from '../installer/nativeInstallers';
import { generateServerPy } from '../installer/pythonTemplates';
import { generateUpdaterPy } from '../installer/updaterTemplate';
import {
  buildLocalVersionJson,
  ConnectionTestResult,
  normalizeGitHubUpdateUrl,
  testGitHubUpdateSource
} from '../installer/githubUpdateUtils';

interface InstallerWizardProps {
  detectedOS: DetectedOS;
  updateSourceUrl: string;
  onUpdateSourceUrlChange: (url: string) => void;
  onOpenPreview: () => void;
}

const STEP_META: Array<{ step: WizardStep; num: string; title: string; subtitle: string }> = [
  { step: 1, num: '01', title: '歡迎與選擇系統', subtitle: 'Windows / macOS 目標' },
  { step: 2, num: '02', title: '條款與權限同意', subtitle: '本機運行與授權說明' },
  { step: 3, num: '03', title: '模組與安裝路徑', subtitle: '完整或精簡功能勾選' },
  { step: 4, num: '04', title: '確認設定並封裝', subtitle: '檢視清單與即時打包' },
  { step: 5, num: '05', title: '下載與雙擊啟動', subtitle: '解壓並一路點同意' }
];

export const InstallerWizard: React.FC<InstallerWizardProps> = ({
  detectedOS,
  updateSourceUrl,
  onUpdateSourceUrlChange,
  onOpenPreview
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [agreementError, setAgreementError] = useState<string>('');

  const [config, setConfig] = useState<InstallConfig>({
    targetPlatform: 'both',
    installFolderName: 'CatParadise',
    port: 8000,
    includeCameraBg: true,
    includeFolderBg: true,
    createShortcut: true,
    autoOpenBrowser: true,
    autoUpdateEnabled: true,
    updateSourceUrl,
    appVersion: '1.0.0'
  });

  const [portInput, setPortInput] = useState<string>('8000');
  const [configError, setConfigError] = useState<string>('');
  const [testingUpdateUrl, setTestingUpdateUrl] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  const [buildState, setBuildState] = useState<BuildState>({
    status: 'idle',
    progress: 0,
    currentFile: '',
    fileCount: 0,
    zipSizeBytes: 0,
    zipFileName: ''
  });
  const [lastBundle, setLastBundle] = useState<BundleResult | null>(null);

  const [guideTab, setGuideTab] = useState<'windows' | 'macos'>(
    detectedOS === 'macos' ? 'macos' : 'windows'
  );
  const [inspectScript, setInspectScript] = useState<
    'none' | 'win' | 'mac' | 'server' | 'updater' | 'version'
  >('none');

  const effectiveConfig: InstallConfig = useMemo(
    () => ({
      ...config,
      updateSourceUrl
    }),
    [config, updateSourceUrl]
  );

  const normalizedUpdateSource = useMemo(
    () => normalizeGitHubUpdateUrl(updateSourceUrl),
    [updateSourceUrl]
  );

  const manifestItems = useMemo(() => getPackageManifest(effectiveConfig), [effectiveConfig]);

  const detectedOsLabel =
    detectedOS === 'windows'
      ? 'Windows'
      : detectedOS === 'macos'
      ? 'macOS'
      : '桌面作業系統';

  const platformLabel =
    config.targetPlatform === 'both'
      ? 'Windows + macOS 通用版'
      : config.targetPlatform === 'windows'
      ? 'Windows 專用版'
      : 'macOS 專用版';

  const isFullPreset = config.includeCameraBg && config.includeFolderBg;

  const validateStep3 = (): boolean => {
    const trimmedFolder = config.installFolderName.trim();
    if (!trimmedFolder) {
      setConfigError('請輸入安裝資料夾名稱（例如 CatParadise）。');
      return false;
    }
    if (/[<>:"/\\|?*]/.test(trimmedFolder)) {
      setConfigError('資料夾名稱不可包含特殊符號（< > : " / \\ | ? *）。');
      return false;
    }
    const parsedPort = Number(portInput);
    if (!Number.isInteger(parsedPort) || parsedPort < 1024 || parsedPort > 65535) {
      setConfigError('本機連接埠請輸入 1024 至 65535 之間的整數（建議維持 8000）。');
      return false;
    }
    if (config.autoUpdateEnabled && updateSourceUrl.trim()) {
      const checkNorm = normalizeGitHubUpdateUrl(updateSourceUrl);
      if (!checkNorm.valid) {
        setConfigError(checkNorm.error || '請輸入有效的 GitHub 更新來源網址。');
        return false;
      }
    }
    setConfig((prev) => ({
      ...prev,
      installFolderName: trimmedFolder,
      port: parsedPort,
      appVersion: prev.appVersion.trim() || '1.0.0'
    }));
    setConfigError('');
    return true;
  };

  const handleTestUpdateConnection = async () => {
    setTestingUpdateUrl(true);
    setTestResult(null);
    const res = await testGitHubUpdateSource(updateSourceUrl);
    setTestResult(res);
    setTestingUpdateUrl(false);
  };

  const handleSelectPreset = (preset: 'full' | 'lite') => {
    setConfig((prev) => ({
      ...prev,
      includeCameraBg: preset === 'full',
      includeFolderBg: preset === 'full'
    }));
    setConfigError('');
  };

  const handleStepClick = (target: WizardStep) => {
    if (buildState.status === 'building') return;
    if (target === currentStep) return;

    if (target < currentStep) {
      setCurrentStep(target);
      return;
    }

    if (target >= 3 && !agreedToTerms) {
      setCurrentStep(2);
      setAgreementError('請先勾選同意使用條款，再進入下一步。');
      return;
    }

    if (target >= 4 && !validateStep3()) {
      setCurrentStep(3);
      return;
    }

    if (target === 5 && !lastBundle) {
      setCurrentStep(4);
      return;
    }

    setCurrentStep(target);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!agreedToTerms) {
        setAgreementError('請先勾選「我已閱讀並同意上述安裝與本機使用條款」才能繼續。');
        return;
      }
      setAgreementError('');
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      if (!validateStep3()) return;
      setCurrentStep(4);
      return;
    }
    if (currentStep === 4) {
      void handleBuildAndDownload();
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && buildState.status !== 'building') {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleBuildAndDownload = async () => {
    if (!validateStep3()) {
      setCurrentStep(3);
      return;
    }

    setBuildState({
      status: 'building',
      progress: 4,
      currentFile: '正在初始化封裝作業...',
      fileCount: 0,
      zipSizeBytes: 0,
      zipFileName: ''
    });

    try {
      const result = await buildInstallerZip(effectiveConfig, (percent, label) => {
        setBuildState((prev) => ({
          ...prev,
          status: 'building',
          progress: percent,
          currentFile: label
        }));
      });

      setLastBundle(result);
      setBuildState({
        status: 'done',
        progress: 100,
        currentFile: '封裝完成，已開始下載安裝包',
        fileCount: result.fileCount,
        zipSizeBytes: result.sizeBytes,
        zipFileName: result.fileName
      });

      if (effectiveConfig.targetPlatform === 'windows') setGuideTab('windows');
      else if (effectiveConfig.targetPlatform === 'macos') setGuideTab('macos');

      triggerZipDownload(result.blob, result.fileName);
      setCurrentStep(5);
    } catch (err) {
      const message = err instanceof Error ? err.message : '封裝過程發生未預期錯誤。';
      setBuildState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: message
      }));
    }
  };

  const previewScriptContent = useMemo(() => {
    if (inspectScript === 'win') return generateWindowsGuiPs1(effectiveConfig);
    if (inspectScript === 'mac') return generateMacCommandInstaller(effectiveConfig);
    if (inspectScript === 'server') {
      return generateServerPy(effectiveConfig.port, effectiveConfig.autoOpenBrowser);
    }
    if (inspectScript === 'updater') return generateUpdaterPy();
    if (inspectScript === 'version') {
      return buildLocalVersionJson({
        version: effectiveConfig.appVersion,
        autoCheckOnStartup: effectiveConfig.autoUpdateEnabled,
        updateSourceUrl: effectiveConfig.updateSourceUrl,
        indexHtmlHash: '(封裝時自動計算 SHA-256)',
        serverPyHash: '(封裝時自動計算 SHA-256)'
      });
    }
    return '';
  }, [inspectScript, effectiveConfig]);

  return (
    <section
      id="wizard"
      aria-label="跨平台安裝精靈"
      className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14"
    >
      {/* Clean Editorial Intro */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#635850] tracking-wide mb-1.5">
            毛屋暖陽・手作紙藝庭院 · 離線展覽部署工具 · 支援 Windows 與 macOS
          </p>
          <h1
            className="text-2xl sm:text-3xl font-black text-[#3B3532] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            跟著精靈一路點同意，免輸入指令完成安裝
          </h1>
        </div>
        <div className="text-xs text-[#635850] tabular-nums">
          目前偵測系統：<span className="font-bold text-[#3B3532]">{detectedOsLabel}</span>
          <span className="mx-2 text-[#B8AD9B]" aria-hidden="true">·</span>
          已內嵌最新版單檔前端
        </div>
      </div>

      {/* Main Single-Elevation Setup Wizard Container */}
      <div className="bg-[#FBF5E6] border border-[#C7BBA7] rounded-xl shadow-[0_10px_28px_rgba(59,53,50,0.08)] overflow-hidden">
        {/* Subtle top washi craft strip */}
        <div className="h-1.5 w-full washi-accent-bar" aria-hidden="true" />

        <div className="flex flex-col lg:flex-row min-h-[560px]">
          {/* Left Step Rail (264px on desktop) */}
          <aside className="lg:w-[264px] shrink-0 bg-[#F5ECD9] border-b lg:border-b-0 lg:border-r border-[#D8CEBC] p-5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-[#635850] mb-4">安裝步驟</div>
              <ol className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                {STEP_META.map((item) => {
                  const isActive = currentStep === item.step;
                  const isDone =
                    currentStep > item.step || (item.step === 5 && buildState.status === 'done');
                  const isReachable =
                    item.step <= currentStep ||
                    (item.step === 2) ||
                    (item.step === 3 && agreedToTerms) ||
                    (item.step === 4 && agreedToTerms) ||
                    (item.step === 5 && Boolean(lastBundle));

                  return (
                    <li key={item.step} className="shrink-0 lg:shrink">
                      <button
                        type="button"
                        onClick={() => handleStepClick(item.step)}
                        disabled={!isReachable || buildState.status === 'building'}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-3 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532] ${
                          isActive
                            ? 'bg-[#FBF5E6] text-[#3B3532] border border-[#C7BBA7] shadow-[0_1px_2px_rgba(59,53,50,0.06)]'
                            : isReachable
                            ? 'text-[#3B3532] hover:bg-[#EDE1C9] border border-transparent'
                            : 'text-[#84786D] opacity-65 border border-transparent'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-6 h-6 rounded-md text-xs font-bold tabular-nums flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-[#5A7D5A] text-white'
                              : isActive
                              ? 'bg-[#C86D4D] text-white'
                              : 'bg-[#E5DAC4] text-[#635850]'
                          }`}
                        >
                          {isDone ? <Check size={13} strokeWidth={3} /> : item.num}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold leading-snug whitespace-nowrap">
                            {item.title}
                          </span>
                          <span className="hidden lg:block text-xs text-[#635850] mt-0.5 truncate">
                            {item.subtitle}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Quiet Current Config Summary at bottom of Sidebar */}
            <div className="hidden lg:block mt-6 pt-4 border-t border-[#D8CEBC] text-xs text-[#635850] space-y-1.5">
              <div className="font-bold text-[#3B3532]">目前封裝摘要</div>
              <div className="flex justify-between gap-2">
                <span>目標平台</span>
                <span className="font-medium text-[#3B3532] truncate">{platformLabel}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>安裝模式</span>
                <span className="font-medium text-[#3B3532]">
                  {isFullPreset ? '完整安裝' : '自訂 / 精簡'}
                </span>
              </div>
              <div className="flex justify-between gap-2 tabular-nums">
                <span>本機連接埠</span>
                <span className="font-mono font-medium text-[#3B3532]">localhost:{config.port}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>GitHub 自動更新</span>
                <span className="font-medium text-[#3B3532]">
                  {config.autoUpdateEnabled ? `已開啟 (v${config.appVersion})` : '已關閉'}
                </span>
              </div>
              <div className="flex justify-between gap-2 tabular-nums">
                <span>預計封裝檔案</span>
                <span className="font-medium text-[#3B3532]">{manifestItems.length} 個項目</span>
              </div>
            </div>
          </aside>

          {/* Right Main Content + Fixed Action Footer */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="p-6 sm:p-8 flex-1">
              {/* ==================== STEP 1: WELCOME & OS SELECTION ==================== */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-[#3B3532]">
                      01. 歡迎使用跨平台安裝精靈
                    </h2>
                    <p className="mt-2 text-sm text-[#635850] leading-relaxed max-w-[66ch]">
                      本助手會把您最新版的「跨界歸零｜貓咪互動樂園」前端網頁、本機展覽伺服器與 Python 去背腳本，封裝成內建原生視窗安裝精靈的安裝包。下載解壓後雙擊啟動，照著畫面一路點擊「同意」與「下一步」即可完成部署。
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E6DCC8]">
                    <div className="text-sm font-bold text-[#3B3532] mb-3">
                      請選擇要產出的目標電腦系統
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {(
                        [
                          {
                            id: 'both' as TargetPlatform,
                            title: 'Windows + macOS 通用版',
                            meta: '推薦 · 一份隨身碟兩邊都能裝',
                            desc: '同時內含 Windows 視窗安裝精靈與 macOS 原生對話框安裝精靈。',
                            icon: Laptop
                          },
                          {
                            id: 'windows' as TargetPlatform,
                            title: 'Windows 專用版',
                            meta: 'Windows 10 / 11',
                            desc: '內含雙擊即開啟的 WinForms 圖形化精靈，支援自動建置桌面捷徑。',
                            icon: Monitor
                          },
                          {
                            id: 'macos' as TargetPlatform,
                            title: 'macOS 專用版',
                            meta: 'Apple Silicon / Intel',
                            desc: '內含原生 AppleScript 視窗精靈，自動處理 .venv 與 .command 權限。',
                            icon: Laptop
                          }
                        ]
                      ).map((opt) => {
                        const selected = config.targetPlatform === opt.id;
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setConfig((prev) => ({ ...prev, targetPlatform: opt.id }))
                            }
                            className={`text-left p-4 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532] ${
                              selected
                                ? 'bg-[#F3E8D2] border-[#C86D4D] ring-1 ring-[#C86D4D]'
                                : 'bg-[#FFFDF8] border-[#D8CEBC] hover:border-[#A99B86]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Icon
                                size={18}
                                className={selected ? 'text-[#AE593B]' : 'text-[#635850]'}
                              />
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  selected
                                    ? 'border-[#C86D4D] bg-[#C86D4D] text-white'
                                    : 'border-[#B8AD9B] bg-white'
                                }`}
                              >
                                {selected && <Check size={11} strokeWidth={3} />}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-[#3B3532]">{opt.title}</div>
                            <div className="text-xs text-[#84786D] mt-0.5">{opt.meta}</div>
                            <p className="text-xs text-[#635850] mt-2 leading-relaxed">
                              {opt.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Concise what-gets-automated summary without nested boxes */}
                  <div className="pt-4 border-t border-[#E6DCC8] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#635850]">
                    <div>
                      <div className="font-bold text-[#3B3532] mb-1">免打指令、免設 PATH</div>
                      <p className="leading-relaxed">
                        自動偵測系統 Python 3 並建立獨立虛擬環境，不再遇到貼上指令報錯。
                      </p>
                    </div>
                    <div>
                      <div className="font-bold text-[#3B3532] mb-1">根除 404 清單錯誤</div>
                      <p className="leading-relaxed">
                        安裝時即預先建立 cats/ 資料夾與 cats/manifest.json，開站立刻運作。
                      </p>
                    </div>
                    <div>
                      <div className="font-bold text-[#3B3532] mb-1">100% 離線展場穩定運行</div>
                      <p className="leading-relaxed">
                        包含您最新上傳的前端（含內嵌 QR Code 與手作紙藝雙分區場景），開展免連網。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 2: LICENSE & PERMISSIONS AGREEMENT ==================== */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-[#3B3532]">
                      02. 使用條款與本機權限同意
                    </h2>
                    <p className="mt-1.5 text-sm text-[#635850]">
                      請檢閱以下本機部署與權限說明，勾選同意後即可進入安裝設定。
                    </p>
                  </div>

                  <div
                    tabIndex={0}
                    className="h-[260px] overflow-y-auto bg-[#FFFDF8] border border-[#D8CEBC] rounded-lg p-5 text-sm text-[#3B3532] leading-relaxed space-y-4 focus-visible:outline-2 focus-visible:outline-[#3B3532]"
                  >
                    <div>
                      <h3 className="font-bold text-[#3B3532] mb-1">
                        一、本機資料夾與檔案寫入範圍
                      </h3>
                      <p className="text-[#635850] text-xs sm:text-sm">
                        下載後的本機圖形化安裝精靈僅會在您指定的安裝資料夾（預設為桌面上的
                        <span className="font-mono font-semibold text-[#3B3532]">
                          {' '}
                          {config.installFolderName || 'CatParadise'}{' '}
                        </span>
                        資料夾）中建立前端網頁、本機伺服器腳本、cats/ 與 input_photos/
                        目錄，並預先寫入空白的 cats/manifest.json。安裝程式不會刪除或改動您電腦上其他位置的個人檔案。
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-[#3B3532] mb-1">
                        二、本機離線伺服器與資料隱私
                      </h3>
                      <p className="text-[#635850] text-xs sm:text-sm">
                        啟動樂園時，本機 Python 伺服器會在 http://localhost:{config.port}/
                        提供離線網頁服務，供現場大螢幕瀏覽器讀取互動畫面與去背後的貓咪圖片。所有現場拍攝或手繪的貓咪圖檔皆僅保存於您自己的電腦中，不會上傳至任何第三方雲端主機。
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-[#3B3532] mb-1">
                        三、Python 獨立虛擬環境 (.venv) 與套件授權
                      </h3>
                      <p className="text-[#635850] text-xs sm:text-sm">
                        若您勾選攝影機或資料夾自動去背功能，本機安裝精靈將自動建立獨立的 .venv
                        虛擬環境並安裝開源影像套件（opencv-python、pillow、numpy），完全隔離於系統原生
                        Python 之外，確保不影響電腦既有的其他軟體。首次安裝上述影像套件需要短暫連線下載，安裝完畢後即可全程離線使用。
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-[#3B3532] mb-1">
                        四、作業系統安全性提示與攝影機權限
                      </h3>
                      <p className="text-[#635850] text-xs sm:text-sm">
                        因本機安裝程式以透明可檢視的系統腳本（Windows PowerShell WinForms 與 macOS
                        AppleScript）實作，首次開啟時 Windows 可能顯示「Windows 已保護您的電腦」、macOS
                        可能顯示「無法驗證開發者」；您可於步驟 04 直接檢視完整腳本原始碼，安心確認後依指示允許執行。若使用實體攝影機掃描，請於系統詢問時允許鏡頭存取權限。
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => {
                          setAgreedToTerms(e.target.checked);
                          if (e.target.checked) setAgreementError('');
                        }}
                        className="mt-1 w-4.5 h-4.5 accent-[#5A7D5A] rounded cursor-pointer"
                      />
                      <span className="text-sm font-bold text-[#3B3532] leading-snug">
                        我已閱讀並同意上述安裝與本機使用條款，允許安裝精靈於指定資料夾部署展覽系統
                      </span>
                    </label>

                    {agreementError && (
                      <div
                        role="alert"
                        className="mt-2.5 flex items-center gap-2 text-xs font-bold text-[#C53F2B]"
                      >
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{agreementError}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==================== STEP 3: MODULES & CUSTOM PATH/PORT ==================== */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-[#3B3532]">
                        03. 選擇安裝模組與基本設定
                      </h2>
                      <p className="mt-1 text-sm text-[#635850]">
                        預設為完整展覽安裝，您可依現場設備需求自由調整勾選項目。
                      </p>
                    </div>

                    {/* Interactive Segmented Preset Selector */}
                    <div className="inline-flex items-center p-1 bg-[#EDE1C9] rounded-lg shrink-0 self-start">
                      <button
                        type="button"
                        onClick={() => handleSelectPreset('full')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          isFullPreset
                            ? 'bg-[#FBF5E6] text-[#3B3532] shadow-xs'
                            : 'text-[#635850] hover:text-[#3B3532]'
                        }`}
                      >
                        完整安裝 (推薦)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPreset('lite')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          !isFullPreset
                            ? 'bg-[#FBF5E6] text-[#3B3532] shadow-xs'
                            : 'text-[#635850] hover:text-[#3B3532]'
                        }`}
                      >
                        精簡安裝 (僅網站)
                      </button>
                    </div>
                  </div>

                  {/* Module Checklist with Hairline Dividers */}
                  <div className="border-t border-b border-[#D8CEBC] divide-y divide-[#E6DCC8]">
                    {/* Core 1: Required */}
                    <div className="py-3.5 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        aria-label="最新版互動前端網頁（必選）"
                        className="mt-1 w-4 h-4 accent-[#5A7D5A]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-sm font-bold text-[#3B3532]">
                            最新版「跨界歸零｜貓咪互動樂園」前端網頁
                          </span>
                          <span className="text-xs text-[#84786D]">必選 · index.html</span>
                        </div>
                        <p className="text-xs text-[#635850] mt-0.5">
                          完整保留您最新上傳的毛屋暖陽手作紙藝庭院雙分區、QR Code 衛教便條、25 隻超載機制與現場手繪板。
                        </p>
                      </div>
                    </div>

                    {/* Core 2: Required */}
                    <div className="py-3.5 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        aria-label="本機展覽伺服器與清單同步器（必選）"
                        className="mt-1 w-4 h-4 accent-[#5A7D5A]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-sm font-bold text-[#3B3532]">
                            本機展覽伺服器與 manifest.json 自動同步器
                          </span>
                          <span className="text-xs text-[#84786D]">必選 · server.py</span>
                        </div>
                        <p className="text-xs text-[#635850] mt-0.5">
                          自動鎖定相對路徑、啟動時即建立 cats/ 與 cats/manifest.json，新貓咪圖檔存入即自動空投大螢幕。
                        </p>
                      </div>
                    </div>

                    {/* Optional 1: Camera BG Removal */}
                    <label className="py-3.5 flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeCameraBg}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, includeCameraBg: e.target.checked }))
                        }
                        className="mt-1 w-4 h-4 accent-[#5A7D5A] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-sm font-bold text-[#3B3532]">
                            攝影機即時拍照自動去背系統
                          </span>
                          <span className="text-xs text-[#84786D]">選配 · camera_remove_bg.py</span>
                        </div>
                        <p className="text-xs text-[#635850] mt-0.5">
                          連接 USB / 內建攝影機，將觀眾畫在白紙上的貓咪按空白鍵拍照即自動去背、加上白色剪紙邊框並送進樂園。
                        </p>
                      </div>
                    </label>

                    {/* Optional 2: Folder BG Removal */}
                    <label className="py-3.5 flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeFolderBg}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, includeFolderBg: e.target.checked }))
                        }
                        className="mt-1 w-4 h-4 accent-[#5A7D5A] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-sm font-bold text-[#3B3532]">
                            資料夾監控自動去背系統
                          </span>
                          <span className="text-xs text-[#84786D]">選配 · folder_remove_bg.py</span>
                        </div>
                        <p className="text-xs text-[#635850] mt-0.5">
                          將手機或掃描器拍攝的照片存入 input_photos/，背景自動完成去背與加白邊並存入 cats/。
                        </p>
                      </div>
                    </label>

                    {/* Optional 3: Shortcuts & Auto Browser */}
                    <div className="py-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.createShortcut}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, createShortcut: e.target.checked }))
                          }
                          className="mt-0.5 w-4 h-4 accent-[#5A7D5A] cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-bold text-[#3B3532]">
                          自動在桌面建立一鍵啟動捷徑
                        </span>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.autoOpenBrowser}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, autoOpenBrowser: e.target.checked }))
                          }
                          className="mt-0.5 w-4 h-4 accent-[#5A7D5A] cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-bold text-[#3B3532]">
                          啟動伺服器後自動開啟瀏覽器
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Folder Name & Port Customization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="install-folder-input"
                        className="block text-xs font-bold text-[#3B3532] mb-1.5"
                      >
                        預設安裝資料夾名稱（位於桌面，安裝時仍可自由更改）
                      </label>
                      <div className="relative">
                        <FolderOpen
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#84786D]"
                        />
                        <input
                          id="install-folder-input"
                          type="text"
                          value={config.installFolderName}
                          onChange={(e) => {
                            setConfig((prev) => ({ ...prev, installFolderName: e.target.value }));
                            setConfigError('');
                          }}
                          placeholder="CatParadise"
                          className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-[#FFFDF8] border border-[#C7BBA7] rounded-lg text-[#3B3532] focus:outline-none focus:border-[#C86D4D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="install-port-input"
                        className="block text-xs font-bold text-[#3B3532] mb-1.5"
                      >
                        本機伺服器連接埠（Port，預設 8000）
                      </label>
                      <input
                        id="install-port-input"
                        type="number"
                        min={1024}
                        max={65535}
                        value={portInput}
                        onChange={(e) => {
                          setPortInput(e.target.value);
                          const num = Number(e.target.value);
                          if (Number.isInteger(num) && num >= 1024 && num <= 65535) {
                            setConfig((prev) => ({ ...prev, port: num }));
                          }
                          setConfigError('');
                        }}
                        className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FFFDF8] border border-[#C7BBA7] rounded-lg text-[#3B3532] focus:outline-none focus:border-[#C86D4D]"
                      />
                    </div>
                  </div>

                  {/* GitHub Auto-Update Configuration */}
                  <div className="pt-4 border-t border-[#D8CEBC] space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.autoUpdateEnabled}
                          onChange={(e) => {
                            setConfig((prev) => ({
                              ...prev,
                              autoUpdateEnabled: e.target.checked
                            }));
                            setConfigError('');
                          }}
                          className="mt-0.5 w-4 h-4 accent-[#5A7D5A] cursor-pointer"
                        />
                        <span>
                          <span className="block text-sm font-bold text-[#3B3532]">
                            啟用 GitHub 啟動自動檢查更新與一鍵替換
                          </span>
                          <span className="block text-xs text-[#635850] mt-0.5">
                            開機啟動時自動檢查 GitHub 新版（4 秒逾時，離線不卡頓），更新時自動備份至 .backups/ 並完整保留 cats/ 貓咪圖庫。
                          </span>
                        </span>
                      </label>
                    </div>

                    {config.autoUpdateEnabled && (
                      <div className="space-y-3 pl-6">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-9">
                            <label
                              htmlFor="github-update-url"
                              className="block text-xs font-bold text-[#3B3532] mb-1.5"
                            >
                              GitHub 儲存庫或 GitHub Pages 網址
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1 min-w-0">
                                <Globe
                                  size={15}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#84786D]"
                                />
                                <input
                                  id="github-update-url"
                                  type="url"
                                  value={updateSourceUrl}
                                  onChange={(e) => {
                                    onUpdateSourceUrlChange(e.target.value);
                                    setTestResult(null);
                                    setConfigError('');
                                  }}
                                  placeholder="https://lynn050.github.io/cat-paradise/ 或 https://github.com/帳號/專案"
                                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono bg-[#FFFDF8] border border-[#C7BBA7] rounded-lg text-[#3B3532] focus:outline-none focus:border-[#C86D4D]"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleTestUpdateConnection()}
                                disabled={testingUpdateUrl}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#C7BBA7] bg-[#F3E8D2] hover:bg-[#E7D8BA] text-xs font-bold text-[#3B3532] whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-60"
                              >
                                {testingUpdateUrl ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <RefreshCw size={13} />
                                )}
                                <span>測試連線</span>
                              </button>
                            </div>
                          </div>

                          <div className="sm:col-span-3">
                            <label
                              htmlFor="initial-app-version"
                              className="block text-xs font-bold text-[#3B3532] mb-1.5"
                            >
                              目前初始版本
                            </label>
                            <input
                              id="initial-app-version"
                              type="text"
                              value={config.appVersion}
                              onChange={(e) =>
                                setConfig((prev) => ({ ...prev, appVersion: e.target.value }))
                              }
                              placeholder="1.0.0"
                              className="w-full px-3 py-2 text-xs sm:text-sm font-mono tabular-nums bg-[#FFFDF8] border border-[#C7BBA7] rounded-lg text-[#3B3532] focus:outline-none focus:border-[#C86D4D]"
                            />
                          </div>
                        </div>

                        {normalizedUpdateSource.valid && (
                          <div className="text-xs text-[#635850] font-mono truncate">
                            將檢查：{normalizedUpdateSource.versionJsonUrl}
                          </div>
                        )}

                        {testResult && (
                          <div
                            className={`text-xs font-bold leading-relaxed ${
                              testResult.status === 'ok-manifest' ||
                              testResult.status === 'ok-html-only'
                                ? 'text-[#466B46]'
                                : testResult.status === 'invalid'
                                ? 'text-[#C53F2B]'
                                : 'text-[#8A5A2B]'
                            }`}
                          >
                            {testResult.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {configError && (
                    <div
                      role="alert"
                      className="flex items-center gap-2 text-xs font-bold text-[#C53F2B]"
                    >
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{configError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== STEP 4: SUMMARY, SCRIPT INSPECTOR & PACKAGING ==================== */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-[#3B3532]">
                      04. 確認安裝設定並封裝下載
                    </h2>
                    <p className="mt-1 text-sm text-[#635850]">
                      確認以下客製化設定無誤後，點擊右下角「開始封裝並下載」即可在瀏覽器端即時產生完整安裝包。
                    </p>
                  </div>

                  {/* Key Settings Summary Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3.5 border-y border-[#D8CEBC] text-xs">
                    <div>
                      <div className="text-[#84786D]">目標作業系統</div>
                      <div className="font-bold text-[#3B3532] mt-1">{platformLabel}</div>
                    </div>
                    <div>
                      <div className="text-[#84786D]">預設安裝目錄</div>
                      <div className="font-mono font-bold text-[#3B3532] mt-1 truncate">
                        Desktop/{config.installFolderName}
                      </div>
                    </div>
                    <div className="tabular-nums">
                      <div className="text-[#84786D]">本機網址</div>
                      <div className="font-mono font-bold text-[#3B3532] mt-1">
                        localhost:{config.port}
                      </div>
                    </div>
                    <div className="tabular-nums">
                      <div className="text-[#84786D]">封裝檔案總數</div>
                      <div className="font-bold text-[#3B3532] mt-1">
                        {manifestItems.length} 個項目
                      </div>
                    </div>
                  </div>

                  {/* Compact Manifest Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#3B3532]">
                        即將打包的檔案清單
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#84786D] hidden sm:inline">透明檢視腳本：</span>
                        {(config.targetPlatform === 'both' ||
                          config.targetPlatform === 'windows') && (
                          <button
                            type="button"
                            onClick={() =>
                              setInspectScript((prev) => (prev === 'win' ? 'none' : 'win'))
                            }
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                              inspectScript === 'win'
                                ? 'bg-[#3B3532] text-[#FBF5E6]'
                                : 'text-[#635850] hover:text-[#3B3532] underline underline-offset-2'
                            }`}
                          >
                            <Code2 size={12} />
                            <span>Win 精靈</span>
                          </button>
                        )}
                        {(config.targetPlatform === 'both' ||
                          config.targetPlatform === 'macos') && (
                          <button
                            type="button"
                            onClick={() =>
                              setInspectScript((prev) => (prev === 'mac' ? 'none' : 'mac'))
                            }
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                              inspectScript === 'mac'
                                ? 'bg-[#3B3532] text-[#FBF5E6]'
                                : 'text-[#635850] hover:text-[#3B3532] underline underline-offset-2'
                            }`}
                          >
                            <Code2 size={12} />
                            <span>Mac 精靈</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setInspectScript((prev) => (prev === 'server' ? 'none' : 'server'))
                          }
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                            inspectScript === 'server'
                              ? 'bg-[#3B3532] text-[#FBF5E6]'
                              : 'text-[#635850] hover:text-[#3B3532] underline underline-offset-2'
                          }`}
                        >
                          <Code2 size={12} />
                          <span>server.py</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setInspectScript((prev) => (prev === 'updater' ? 'none' : 'updater'))
                          }
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                            inspectScript === 'updater'
                              ? 'bg-[#3B3532] text-[#FBF5E6]'
                              : 'text-[#635850] hover:text-[#3B3532] underline underline-offset-2'
                          }`}
                        >
                          <Code2 size={12} />
                          <span>updater.py</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setInspectScript((prev) => (prev === 'version' ? 'none' : 'version'))
                          }
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                            inspectScript === 'version'
                              ? 'bg-[#3B3532] text-[#FBF5E6]'
                              : 'text-[#635850] hover:text-[#3B3532] underline underline-offset-2'
                          }`}
                        >
                          <Code2 size={12} />
                          <span>version.json</span>
                        </button>
                      </div>
                    </div>

                    {inspectScript !== 'none' ? (
                      <div className="bg-[#2B2724] text-[#F3E8D2] rounded-lg border border-[#3B3532] overflow-hidden">
                        <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#46403B] text-xs">
                          <span className="font-mono text-[#D8CEBC]">
                            {inspectScript === 'win'
                              ? 'scripts/installer_win.ps1'
                              : inspectScript === 'mac'
                              ? '點我開始安裝_Mac.command'
                              : inspectScript === 'server'
                              ? 'app/server.py'
                              : inspectScript === 'updater'
                              ? 'app/updater.py'
                              : 'app/version.json'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectScript('none')}
                            className="text-[#D8CEBC] hover:text-white font-bold cursor-pointer"
                          >
                            返回檔案清單
                          </button>
                        </div>
                        <pre className="p-3.5 text-[11px] leading-relaxed overflow-auto max-h-[220px] font-mono">
                          {previewScriptContent}
                        </pre>
                      </div>
                    ) : (
                      <div className="max-h-[220px] overflow-y-auto border border-[#D8CEBC] rounded-lg bg-[#FFFDF8]">
                        <table className="w-full text-left border-collapse text-xs">
                          <tbody className="divide-y divide-[#ECE3D3]">
                            {manifestItems.map((item) => (
                              <tr key={item.path} className="hover:bg-[#F8F1E2]/70">
                                <td className="py-2 px-3 font-mono font-medium text-[#3B3532] whitespace-nowrap">
                                  {item.path}
                                </td>
                                <td className="py-2 px-3 text-[#635850]">{item.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Real Packaging Progress Bar */}
                  {buildState.status === 'building' && (
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#3B3532] tabular-nums">
                        <span className="flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin text-[#C86D4D]" />
                          <span>{buildState.currentFile}</span>
                        </span>
                        <span>{buildState.progress}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-[#E6DCC8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C86D4D] transition-all duration-150"
                          style={{ width: `${buildState.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {buildState.status === 'error' && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-lg bg-[#FDECE8] border border-[#E2A89C] text-xs font-bold text-[#A62F1E] flex items-center justify-between gap-3"
                    >
                      <span className="flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{buildState.errorMessage}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleBuildAndDownload()}
                        className="px-3 py-1.5 rounded bg-[#C53F2B] text-white whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        重試封裝
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== STEP 5: COMPLETED & DOUBLE-CLICK GUIDE ==================== */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={26} className="text-[#5A7D5A] shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-xl font-black text-[#3B3532]">
                        安裝包已下載完成！接下來只需雙擊並一路點同意
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-[#635850] tabular-nums">
                        檔名：<span className="font-mono font-bold text-[#3B3532]">{buildState.zipFileName}</span>
                        <span className="mx-2 text-[#B8AD9B]">·</span>
                        大小：{formatBytes(buildState.zipSizeBytes)}
                        <span className="mx-2 text-[#B8AD9B]">·</span>
                        共 {buildState.fileCount} 個檔案
                      </p>
                    </div>
                  </div>

                  {/* Primary & Secondary Action Strip */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (lastBundle) {
                          triggerZipDownload(lastBundle.blob, lastBundle.fileName);
                        } else {
                          void handleBuildAndDownload();
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C86D4D] hover:bg-[#AE593B] text-white text-sm font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532]"
                    >
                      <Download size={16} />
                      <span>重新下載安裝包</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenPreview}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F3E8D2] hover:bg-[#E7D8BA] text-[#3B3532] border border-[#C7BBA7] text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Eye size={16} />
                      <span>立即線上預覽最新版樂園</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#635850] hover:text-[#3B3532] whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>修改設定重新打包</span>
                    </button>
                  </div>

                  {/* Platform-specific 3-step Double-Click Guide */}
                  <div className="pt-4 border-t border-[#D8CEBC]">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <span className="text-sm font-bold text-[#3B3532]">
                        在本機電腦完成安裝的三個動作
                      </span>
                      <div className="inline-flex items-center p-1 bg-[#EDE1C9] rounded-lg">
                        <button
                          type="button"
                          onClick={() => setGuideTab('windows')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            guideTab === 'windows'
                              ? 'bg-[#FBF5E6] text-[#3B3532] shadow-xs'
                              : 'text-[#635850] hover:text-[#3B3532]'
                          }`}
                        >
                          Windows 操作方式
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuideTab('macos')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            guideTab === 'macos'
                              ? 'bg-[#FBF5E6] text-[#3B3532] shadow-xs'
                              : 'text-[#635850] hover:text-[#3B3532]'
                          }`}
                        >
                          macOS 操作方式
                        </button>
                      </div>
                    </div>

                    {guideTab === 'windows' ? (
                      <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-[#635850]">
                        <li className="space-y-1">
                          <div className="font-bold text-[#3B3532] tabular-nums">
                            01. 全部解壓縮 ZIP
                          </div>
                          <p className="leading-relaxed">
                            對下載的 <span className="font-mono text-[#3B3532]">.zip</span> 按右鍵選擇「全部解壓縮」，切勿直接在壓縮預覽視窗內執行。
                          </p>
                        </li>
                        <li className="space-y-1">
                          <div className="font-bold text-[#3B3532] tabular-nums">
                            02. 雙擊 Windows 安裝精靈
                          </div>
                          <p className="leading-relaxed">
                            開啟解壓資料夾並雙擊{' '}
                            <span className="font-mono font-bold text-[#3B3532]">
                              點我開始安裝_Windows.bat
                            </span>
                            （若跳出藍色 SmartScreen 提示，請點「其他資訊」→「仍要執行」）。
                          </p>
                        </li>
                        <li className="space-y-1">
                          <div className="font-bold text-[#3B3532] tabular-nums">
                            03. 一路點同意直到完成
                          </div>
                          <p className="leading-relaxed">
                            在彈出的視窗依序點擊「下一步 → 勾選同意 → 開始安裝 → 完成」，系統會自動建立桌面捷徑並開啟{' '}
                            <span className="font-mono text-[#3B3532]">localhost:{config.port}</span>。
                          </p>
                        </li>
                      </ol>
                    ) : (
                      <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-[#635850]">
                        <li className="space-y-1">
                          <div className="font-bold text-[#3B3532] tabular-nums">
                            01. 雙擊解壓縮 ZIP
                          </div>
                          <p className="leading-relaxed">
                            在 Finder 中直接雙擊下載的 <span className="font-mono text-[#3B3532]">.zip</span> 展開{' '}
                            <span className="font-mono text-[#3B3532]">CatParadise_Installer</span> 資料夾。
                          </p>
                        </li>
                        <li className="space-y-1">
                          <div className="font-bold text-[#3B3532] tabular-nums">
                            02. 右鍵打開 Mac 安裝精靈
                          </div>
                          <p className="leading-relaxed">
                            對{' '}
                            <span className="font-mono font-bold text-[#3B3532]">
                              點我開始安裝_Mac.command
                            </span>{' '}
                            按「右鍵（或兩指點按）」→ 選擇「打開」→ 再按「打開」即可啟動原生視窗精靈。
                          </p>
                        </li>
                        <li className="space-y-1">
                          <div className="font-bold text-[#3B3532] tabular-nums">
                            03. 一路點同意並自動開展
                          </div>
                          <p className="leading-relaxed">
                            依視窗點選「下一步 → 我同意並繼續 → 安裝到桌面 → 立即啟動樂園」，自動建置 .venv 並在桌面產生雙擊啟動器。
                          </p>
                        </li>
                      </ol>
                    )}

                    {config.autoUpdateEnabled && (
                      <div className="mt-4 pt-3.5 border-t border-[#E6DCC8] text-xs text-[#635850] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span>
                          已內建 GitHub 自動更新與舊版備份機制：日後開機啟動即自動檢查更新，也可隨時雙擊資料夾內的「檢查更新與還原舊版」。
                        </span>
                        <a
                          href="#auto-update"
                          className="font-bold text-[#AE593B] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                        >
                          前往產生 version.json →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Wizard Footer Actions */}
            <div className="px-6 sm:px-8 py-4 bg-[#F5ECD9] border-t border-[#D8CEBC] flex items-center justify-between gap-4">
              <div>
                {currentStep > 1 && currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={buildState.status === 'building'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#C7BBA7] bg-[#FBF5E6] hover:bg-[#EFE4CE] text-sm font-bold text-[#3B3532] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft size={15} />
                    <span>上一步</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#635850]">
                    <ShieldCheck size={15} className="text-[#5A7D5A]" />
                    <span>純瀏覽器端即時封裝，不含廣告或外部追蹤</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-xs font-bold text-[#635850] tabular-nums">
                  步驟 {currentStep} / 5
                </span>

                {currentStep === 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#C86D4D] hover:bg-[#AE593B] text-white text-sm font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532]"
                  >
                    <span>下一步</span>
                    <ArrowRight size={15} />
                  </button>
                )}

                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!agreedToTerms}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#C86D4D] hover:bg-[#AE593B] disabled:bg-[#C7BBA7] disabled:cursor-not-allowed text-white text-sm font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532]"
                  >
                    <span>我同意並繼續</span>
                    <ArrowRight size={15} />
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#C86D4D] hover:bg-[#AE593B] text-white text-sm font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532]"
                  >
                    <span>確認安裝清單</span>
                    <ArrowRight size={15} />
                  </button>
                )}

                {currentStep === 4 && (
                  <button
                    type="button"
                    onClick={() => void handleBuildAndDownload()}
                    disabled={buildState.status === 'building'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5A7D5A] hover:bg-[#496849] disabled:opacity-65 text-white text-sm font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B3532]"
                  >
                    {buildState.status === 'building' ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>封裝中 ({buildState.progress}%)</span>
                      </>
                    ) : (
                      <>
                        <Download size={15} />
                        <span>開始封裝並下載安裝包</span>
                      </>
                    )}
                  </button>
                )}

                {currentStep === 5 && (
                  <button
                    type="button"
                    onClick={onOpenPreview}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#5A7D5A] hover:bg-[#496849] text-white text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Eye size={15} />
                    <span>預覽最新版樂園</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
