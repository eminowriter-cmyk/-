export type TargetPlatform = 'both' | 'windows' | 'macos';

export type DetectedOS = 'windows' | 'macos' | 'other';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface InstallConfig {
  targetPlatform: TargetPlatform;
  installFolderName: string;
  port: number;
  includeCameraBg: boolean;
  includeFolderBg: boolean;
  createShortcut: boolean;
  autoOpenBrowser: boolean;
  autoUpdateEnabled: boolean;
  updateSourceUrl: string;
  appVersion: string;
}

export interface BuildState {
  status: 'idle' | 'building' | 'done' | 'error';
  progress: number;
  currentFile: string;
  fileCount: number;
  zipSizeBytes: number;
  zipFileName: string;
  errorMessage?: string;
}

export interface PackageManifestItem {
  path: string;
  category: 'installer' | 'frontend' | 'server' | 'updater' | 'ai-bg' | 'docs';
  description: string;
  platform: 'windows' | 'macos' | 'all';
}

export const LATEST_FRONTEND_URL = '/assets/aistudio/index_742086dd.html';

export const DEFAULT_UPDATE_SOURCE_URL = 'https://lynn050.github.io/cat-paradise/';
