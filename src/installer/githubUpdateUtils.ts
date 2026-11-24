export interface NormalizedGitHubSource {
  valid: boolean;
  baseUrl: string;
  versionJsonUrl: string;
  indexHtmlUrl: string;
  displayLabel: string;
  error?: string;
}

export interface ConnectionTestResult {
  status: 'ok-manifest' | 'ok-html-only' | 'not-found' | 'invalid';
  message: string;
  remoteVersion?: string;
  remoteNotes?: string;
}

const ALLOWED_GITHUB_HOSTS = new Set([
  'github.com',
  'www.github.com',
  'raw.githubusercontent.com'
]);

export function isTrustedGitHubHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (ALLOWED_GITHUB_HOSTS.has(lower)) return true;
  if (lower.endsWith('.github.io') && lower.length > '.github.io'.length) return true;
  return false;
}

/**
 * Normalizes any GitHub Repository URL, GitHub Pages URL, raw URL, or version.json URL
 * into a clean HTTPS base URL + version.json URL + index.html URL.
 */
export function normalizeGitHubUpdateUrl(rawInput: string): NormalizedGitHubSource {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      baseUrl: '',
      versionJsonUrl: '',
      indexHtmlUrl: '',
      displayLabel: '',
      error: '請填入您的 GitHub 儲存庫或 GitHub Pages 網址（例如 https://帳號.github.io/專案/）。'
    };
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      valid: false,
      baseUrl: '',
      versionJsonUrl: '',
      indexHtmlUrl: '',
      displayLabel: '',
      error: '網址格式不正確，請確認是否為有效的 GitHub 網址。'
    };
  }

  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      baseUrl: '',
      versionJsonUrl: '',
      indexHtmlUrl: '',
      displayLabel: '',
      error: '基於安全考量，自動更新來源僅支援加密的 https:// 網址。'
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (!isTrustedGitHubHost(host)) {
    return {
      valid: false,
      baseUrl: '',
      versionJsonUrl: '',
      indexHtmlUrl: '',
      displayLabel: '',
      error: '請使用 GitHub 儲存庫（github.com）、GitHub Pages（*.github.io）或 raw.githubusercontent.com 網址。'
    };
  }

  // Case 1: Standard GitHub repository URL -> convert to raw.githubusercontent.com
  if (host === 'github.com' || host === 'www.github.com') {
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) {
      return {
        valid: false,
        baseUrl: '',
        versionJsonUrl: '',
        indexHtmlUrl: '',
        displayLabel: '',
        error: 'GitHub 儲存庫網址需包含帳號與專案名稱（例如 https://github.com/帳號/專案）。'
      };
    }
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, '');
    let branch = 'main';
    let subPath = '';

    if ((parts[2] === 'tree' || parts[2] === 'blob') && parts[3]) {
      branch = parts[3];
      const rest = parts.slice(4);
      if (parts[2] === 'blob' && rest.length > 0) {
        const last = rest[rest.length - 1];
        if (last === 'version.json' || last === 'index.html') {
          rest.pop();
        }
      }
      subPath = rest.join('/');
    }

    const baseUrl = subPath
      ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${subPath}/`
      : `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`;

    return {
      valid: true,
      baseUrl,
      versionJsonUrl: `${baseUrl}version.json`,
      indexHtmlUrl: `${baseUrl}index.html`,
      displayLabel: `${owner}/${repo} (${branch})`
    };
  }

  // Case 2: GitHub Pages or raw.githubusercontent.com
  let cleanPath = parsed.pathname || '/';
  if (cleanPath.endsWith('/version.json')) {
    cleanPath = cleanPath.slice(0, -'version.json'.length);
  } else if (cleanPath.endsWith('/index.html')) {
    cleanPath = cleanPath.slice(0, -'index.html'.length);
  }
  if (!cleanPath.endsWith('/')) {
    cleanPath += '/';
  }

  const baseUrl = `https://${host}${cleanPath}`;
  return {
    valid: true,
    baseUrl,
    versionJsonUrl: `${baseUrl}version.json`,
    indexHtmlUrl: `${baseUrl}index.html`,
    displayLabel: `${host}${cleanPath}`
  };
}

/**
 * Live browser test against the configured GitHub update source.
 * Checks version.json first, then falls back to checking index.html.
 */
export async function testGitHubUpdateSource(rawUrl: string): Promise<ConnectionTestResult> {
  const norm = normalizeGitHubUpdateUrl(rawUrl);
  if (!norm.valid) {
    return {
      status: 'invalid',
      message: norm.error || '網址格式不正確。'
    };
  }

  const cacheBust = `?t=${Date.now()}`;

  try {
    const manifestRes = await fetch(`${norm.versionJsonUrl}${cacheBust}`, {
      cache: 'no-store'
    });
    if (manifestRes.ok) {
      const data = (await manifestRes.json()) as { version?: string; notes?: string };
      if (data && typeof data.version === 'string' && data.version.trim()) {
        return {
          status: 'ok-manifest',
          message: `連線成功！已偵測到遠端版本清單 v${data.version.trim()}`,
          remoteVersion: data.version.trim(),
          remoteNotes: typeof data.notes === 'string' ? data.notes : undefined
        };
      }
    }
  } catch {
    // Fall through to index.html check
  }

  try {
    const htmlRes = await fetch(`${norm.indexHtmlUrl}${cacheBust}`, {
      cache: 'no-store'
    });
    if (htmlRes.ok) {
      const text = await htmlRes.text();
      if (text.toLowerCase().includes('<html') || text.toLowerCase().includes('<!doctype')) {
        return {
          status: 'ok-html-only',
          message:
            '已連線到 GitHub 上的 index.html（尚未偵測到 version.json，更新器將自動改用檔案指紋比對偵測新版）。'
        };
      }
    }
  } catch {
    // Network or CORS issue
  }

  return {
    status: 'not-found',
    message:
      '目前尚無法讀到此網址的 version.json 或 index.html（若您尚未推送到 GitHub 屬正常現象，仍可先完成封裝，等推送後展場電腦就會自動偵測）。'
  };
}

export async function computeSha256Hex(content: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return '';
  }
  const encoded = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface LocalVersionMetadata {
  version: string;
  releasedAt: string;
  autoCheckOnStartup: boolean;
  updateSourceUrl: string;
  files: string[];
  hashes: Record<string, string>;
}

export function buildLocalVersionJson(params: {
  version: string;
  autoCheckOnStartup: boolean;
  updateSourceUrl: string;
  indexHtmlHash: string;
  serverPyHash: string;
}): string {
  const norm = normalizeGitHubUpdateUrl(params.updateSourceUrl);
  const payload: LocalVersionMetadata = {
    version: params.version.trim() || '1.0.0',
    releasedAt: new Date().toISOString().slice(0, 10),
    autoCheckOnStartup: params.autoCheckOnStartup,
    updateSourceUrl: norm.valid ? norm.baseUrl : params.updateSourceUrl.trim(),
    files: ['index.html', 'server.py'],
    hashes: {
      ...(params.indexHtmlHash ? { 'index.html': params.indexHtmlHash } : {}),
      ...(params.serverPyHash ? { 'server.py': params.serverPyHash } : {})
    }
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function buildRemoteReleaseManifestJson(params: {
  version: string;
  notes: string;
  includeIndexHtml: boolean;
  includeServerPy: boolean;
  releasedAt?: string;
}): string {
  const files: string[] = [];
  if (params.includeIndexHtml) files.push('index.html');
  if (params.includeServerPy) files.push('server.py');

  const payload = {
    version: params.version.trim() || '1.0.1',
    releasedAt: params.releasedAt || new Date().toISOString().slice(0, 10),
    notes: params.notes.trim() || '更新最新版互動前端與體驗優化',
    files: files.length > 0 ? files : ['index.html']
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}
