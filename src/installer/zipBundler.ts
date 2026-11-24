import JSZip from 'jszip';
import {
  InstallConfig,
  LATEST_FRONTEND_URL,
  PackageManifestItem
} from './types';
import {
  CAMERA_REMOVE_BG_PY,
  FOLDER_REMOVE_BG_PY,
  generateServerPy,
  REQUIREMENTS_TXT
} from './pythonTemplates';
import { generateUpdaterPy } from './updaterTemplate';
import {
  buildLocalVersionJson,
  computeSha256Hex
} from './githubUpdateUtils';
import {
  generateMacCommandInstaller,
  generateReadmeTxt,
  generateWindowsBatLauncher,
  generateWindowsGuiPs1
} from './nativeInstallers';

const UTF8_BOM = '\uFEFF';

export function getPackageManifest(config: InstallConfig): PackageManifestItem[] {
  const items: PackageManifestItem[] = [];

  if (config.targetPlatform === 'both' || config.targetPlatform === 'windows') {
    items.push(
      {
        path: '點我開始安裝_Windows.bat',
        category: 'installer',
        description: 'Windows 雙擊啟動器，自動開啟圖形化安裝精靈',
        platform: 'windows'
      },
      {
        path: 'scripts/installer_win.ps1',
        category: 'installer',
        description: 'Windows 原生視窗安裝精靈（同意條款、選路徑、自動建捷徑）',
        platform: 'windows'
      }
    );
  }

  if (config.targetPlatform === 'both' || config.targetPlatform === 'macos') {
    items.push({
      path: '點我開始安裝_Mac.command',
      category: 'installer',
      description: 'macOS 原生對話框安裝精靈（免打指令、自動設定 .venv 與啟動器）',
      platform: 'macos'
    });
  }

  items.push(
    {
      path: 'app/index.html',
      category: 'frontend',
      description: '您提供的最新版「跨界歸零｜貓咪互動樂園」完整單檔前端',
      platform: 'all'
    },
    {
      path: 'app/server.py',
      category: 'server',
      description: `客製化本機展覽伺服器（Port ${config.port}）與 manifest.json 自動同步`,
      platform: 'all'
    },
    {
      path: 'app/updater.py',
      category: 'updater',
      description: 'GitHub 自動檢查更新與安全替換引擎（原生通知、自動備份 .backups/、一鍵還原）',
      platform: 'all'
    },
    {
      path: 'app/version.json',
      category: 'updater',
      description: `本機版本資訊（v${config.appVersion || '1.0.0'}）、檔案指紋與 GitHub 更新來源設定`,
      platform: 'all'
    },
    {
      path: 'app/cats/manifest.json',
      category: 'server',
      description: '預先初始化的空白貓咪清單，徹底避免初次啟動 404',
      platform: 'all'
    }
  );

  if (config.includeCameraBg) {
    items.push({
      path: 'app/camera_remove_bg.py',
      category: 'ai-bg',
      description: '攝影機實體畫紙拍照自動去背與手作白邊產生器',
      platform: 'all'
    });
  }

  if (config.includeFolderBg) {
    items.push({
      path: 'app/folder_remove_bg.py',
      category: 'ai-bg',
      description: '資料夾自動監控去背系統（input_photos/ → cats/）',
      platform: 'all'
    });
  }

  if (config.includeCameraBg || config.includeFolderBg) {
    items.push({
      path: 'app/requirements.txt',
      category: 'ai-bg',
      description: 'Python 影像去背相依套件清單（OpenCV / Pillow / NumPy）',
      platform: 'all'
    });
  }

  items.push({
    path: 'README_安裝說明.txt',
    category: 'docs',
    description: '離線文字版快速操作、自動更新與疑難排解備忘錄',
    platform: 'all'
  });

  return items;
}

export interface BundleResult {
  blob: Blob;
  fileName: string;
  fileCount: number;
  sizeBytes: number;
}

export async function buildInstallerZip(
  config: InstallConfig,
  onProgress: (percent: number, label: string) => void
): Promise<BundleResult> {
  onProgress(8, '正在讀取最新版前端主檔 (index.html)...');

  const res = await fetch(LATEST_FRONTEND_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`無法載入最新版前端檔案（HTTP ${res.status}），請重新整理頁面後再試。`);
  }
  const latestHtml = await res.text();
  if (!latestHtml || latestHtml.length < 500) {
    throw new Error('最新版前端檔案內容不完整，無法封裝。');
  }

  const zip = new JSZip();
  const rootFolderName = 'CatParadise_Installer';
  const root = zip.folder(rootFolderName);
  if (!root) {
    throw new Error('建立壓縮根目錄失敗。');
  }

  let fileCount = 0;

  onProgress(20, '正在計算檔案雜湊指紋與建立版本清單 (version.json)...');
  const serverPyContent = generateServerPy(config.port, config.autoOpenBrowser);
  const [indexHtmlHash, serverPyHash] = await Promise.all([
    computeSha256Hex(latestHtml),
    computeSha256Hex(serverPyContent)
  ]);

  const localVersionJson = buildLocalVersionJson({
    version: config.appVersion,
    autoCheckOnStartup: config.autoUpdateEnabled,
    updateSourceUrl: config.updateSourceUrl,
    indexHtmlHash,
    serverPyHash
  });

  onProgress(28, '正在寫入最新版互動前端、本機伺服器與自動更新引擎...');
  root.file('app/index.html', latestHtml);
  fileCount++;

  root.file('app/server.py', serverPyContent);
  fileCount++;

  root.file('app/updater.py', generateUpdaterPy());
  fileCount++;

  root.file('app/version.json', localVersionJson);
  fileCount++;

  root.file('app/cats/manifest.json', '[]\n');
  fileCount++;

  root.file('app/input_photos/.keep', '');

  if (config.includeCameraBg) {
    onProgress(42, '正在封裝攝影機即時去背模組...');
    root.file('app/camera_remove_bg.py', CAMERA_REMOVE_BG_PY);
    fileCount++;
  }

  if (config.includeFolderBg) {
    onProgress(52, '正在封裝資料夾自動去背模組...');
    root.file('app/folder_remove_bg.py', FOLDER_REMOVE_BG_PY);
    fileCount++;
  }

  if (config.includeCameraBg || config.includeFolderBg) {
    root.file('app/requirements.txt', REQUIREMENTS_TXT);
    fileCount++;
  }

  if (config.targetPlatform === 'both' || config.targetPlatform === 'windows') {
    onProgress(64, '正在產生 Windows 原生視窗安裝精靈...');
    root.file('點我開始安裝_Windows.bat', generateWindowsBatLauncher());
    root.file('scripts/installer_win.ps1', UTF8_BOM + generateWindowsGuiPs1(config));
    fileCount += 2;
  }

  if (config.targetPlatform === 'both' || config.targetPlatform === 'macos') {
    onProgress(75, '正在產生 macOS 原生對話框安裝精靈...');
    root.file('點我開始安裝_Mac.command', generateMacCommandInstaller(config), {
      unixPermissions: '755'
    });
    fileCount++;
  }

  root.file('README_安裝說明.txt', UTF8_BOM + generateReadmeTxt(config));
  fileCount++;

  onProgress(82, '正在壓縮封裝跨平台安裝包 (.zip)...');

  const blob = await zip.generateAsync(
    {
      type: 'blob',
      platform: 'UNIX',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    },
    (meta) => {
      const mapped = Math.min(99, Math.round(82 + meta.percent * 0.17));
      onProgress(mapped, `正在壓縮檔案（${Math.round(meta.percent)}%）...`);
    }
  );

  const platformSuffix =
    config.targetPlatform === 'both'
      ? 'Win_Mac'
      : config.targetPlatform === 'windows'
      ? 'Windows'
      : 'macOS';

  const fileName = `CatParadise_Installer_${platformSuffix}.zip`;
  onProgress(100, '封裝完成，準備開始下載！');

  return {
    blob,
    fileName,
    fileCount,
    sizeBytes: blob.size
  };
}

export function triggerZipDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
