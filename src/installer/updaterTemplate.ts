/**
 * Generates app/updater.py — a zero-dependency Python 3 auto-updater for Windows & macOS.
 *
 * Key guarantees:
 * 1. Runs purely on Python 3 stdlib (urllib, hashlib, json, shutil, tempfile, ipaddress, socket).
 * 2. Startup check uses a fast 4-second timeout so offline exhibition machines launch immediately.
 * 3. Supports BOTH explicit version.json releases AND automatic SHA-256 fallback on remote index.html.
 * 4. Strict security: HTTPS-only, trusted GitHub hosts allowlist, private/loopback IP blocking,
 *    strict replaceable filename allowlist ({'index.html', 'server.py'}), path confinement inside BASE_DIR,
 *    HTML structure validation, Python compile() syntax check for server.py, and optional SHA-256 verification.
 * 5. Automatic timestamped backup in .backups/ before atomic os.replace() — NEVER touches cats/ or input_photos/.
 * 6. Native Windows WinForms & macOS AppleScript dialogs for effortless one-click update & rollback.
 */

export function generateUpdaterPy(): string {
  return `# -*- coding: utf-8 -*-
"""
跨界歸零｜貓咪互動樂園 — GitHub 自動檢查更新與安全替換引擎 (updater.py)

功能說明：
1. 啟動時自動檢查 GitHub 儲存庫 / GitHub Pages 是否有新版本（4 秒逾時，斷網自動略過）。
2. 優先比對遠端 version.json 版號；若尚未建立 version.json，則自動比對 index.html 內容指紋。
3. 彈出 Windows / macOS 系統原生視窗通知，按下「立即更新」後先於暫存區驗證完整性，
   自動備份舊版至 .backups/，再原子替換 index.html 與 server.py。
4. 全程完整保留 cats/ 貓咪圖庫與 input_photos/ 原始畫作，並支援一鍵還原舊版。
"""

import argparse
import hashlib
import ipaddress
import json
import os
import platform
import shutil
import socket
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VERSION_FILE = os.path.join(BASE_DIR, "version.json")
BACKUPS_DIR = os.path.join(BASE_DIR, ".backups")

ALLOWED_FILES = ("index.html", "server.py")
MAX_FILE_BYTES = 20 * 1024 * 1024  # 20 MB upper bound
DEFAULT_TIMEOUT = 4.0
DOWNLOAD_TIMEOUT = 15.0

TRUSTED_EXACT_HOSTS = {
    "github.com",
    "www.github.com",
    "raw.githubusercontent.com",
    "objects.githubusercontent.com",
}


def compute_sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def compute_file_sha256(path: str) -> str:
    if not os.path.isfile(path):
        return ""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_local_state() -> dict:
    default_state = {
        "version": "1.0.0",
        "releasedAt": "",
        "autoCheckOnStartup": True,
        "updateSourceUrl": "",
        "files": ["index.html", "server.py"],
        "hashes": {},
    }
    if not os.path.isfile(VERSION_FILE):
        return default_state
    try:
        with open(VERSION_FILE, "r", encoding="utf-8") as f:
            loaded = json.load(f)
        if isinstance(loaded, dict):
            default_state.update(loaded)
    except Exception:
        pass
    return default_state


def save_local_state(state: dict) -> None:
    tmp_path = VERSION_FILE + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
        f.write("\\n")
    os.replace(tmp_path, VERSION_FILE)


def is_trusted_github_host(hostname: str) -> bool:
    if not hostname:
        return False
    lower = hostname.lower().rstrip(".")
    if lower in TRUSTED_EXACT_HOSTS:
        return True
    if lower.endswith(".github.io") and len(lower) > len(".github.io"):
        return True
    return False


def assert_safe_https_github_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https":
        raise ValueError("僅允許使用加密 HTTPS 連線下載更新。")
    hostname = parsed.hostname or ""
    if not is_trusted_github_host(hostname):
        raise ValueError(f"更新來源不在受信任的 GitHub 網域清單內：{hostname}")

    # Resolve hostname and reject loopback / private / link-local / multicast addresses
    try:
        infos = socket.getaddrinfo(hostname, parsed.port or 443, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise ConnectionError(f"無法連線至更新主機 {hostname}：{exc}")

    for info in infos:
        ip_str = info[4][0]
        ip_obj = ipaddress.ip_address(ip_str)
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        ):
            raise ValueError(f"基於安全考量已阻擋非公開網路位址：{ip_str}")

    return url


def normalize_github_base_url(raw_url: str) -> str:
    raw_url = (raw_url or "").strip()
    if not raw_url:
        return ""
    if not raw_url.startswith(("http://", "https://")):
        raw_url = "https://" + raw_url

    parsed = urllib.parse.urlparse(raw_url)
    if parsed.scheme != "https":
        return ""

    host = (parsed.hostname or "").lower()
    if not is_trusted_github_host(host):
        return ""

    if host in ("github.com", "www.github.com"):
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) < 2:
            return ""
        owner = parts[0]
        repo = parts[1][:-4] if parts[1].lower().endswith(".git") else parts[1]
        branch = "main"
        sub_parts = []
        if len(parts) >= 4 and parts[2] in ("tree", "blob"):
            branch = parts[3]
            sub_parts = list(parts[4:])
            if parts[2] == "blob" and sub_parts and sub_parts[-1] in ("version.json", "index.html"):
                sub_parts.pop()
        sub = ("/".join(sub_parts) + "/") if sub_parts else ""
        return f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{sub}"

    path = parsed.path or "/"
    if path.endswith("/version.json"):
        path = path[: -len("version.json")]
    elif path.endswith("/index.html"):
        path = path[: -len("index.html")]
    if not path.endswith("/"):
        path += "/"
    return f"https://{host}{path}"


class SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        resolved = urllib.parse.urljoin(req.full_url, newurl)
        assert_safe_https_github_url(resolved)
        return super().redirect_request(req, fp, code, msg, headers, resolved)


def fetch_bytes(url: str, timeout: float = DEFAULT_TIMEOUT) -> bytes:
    assert_safe_https_github_url(url)
    sep = "&" if "?" in url else "?"
    bust_url = f"{url}{sep}cb={int(datetime.now().timestamp())}"
    req = urllib.request.Request(
        bust_url,
        headers={
            "User-Agent": "CatParadise-AutoUpdater/1.0",
            "Cache-Control": "no-cache",
        },
    )
    opener = urllib.request.build_opener(SafeRedirectHandler())
    with opener.open(req, timeout=timeout) as resp:
        data = resp.read(MAX_FILE_BYTES + 1)
        if len(data) > MAX_FILE_BYTES:
            raise ValueError("遠端檔案大小超過安全上限（20 MB）。")
        return data


def parse_version_tuple(ver: str) -> tuple:
    cleaned = (ver or "0.0.0").strip().lstrip("vV")
    nums = []
    for part in cleaned.split("."):
        digits = "".join(ch for ch in part if ch.isdigit())
        nums.append(int(digits) if digits else 0)
    while len(nums) < 3:
        nums.append(0)
    return tuple(nums[:4])


def is_newer_version(remote_ver: str, local_ver: str) -> bool:
    r = parse_version_tuple(remote_ver)
    l = parse_version_tuple(local_ver)
    if r != l:
        return r > l
    return remote_ver.strip() != local_ver.strip()


def confined_target_path(filename: str) -> str:
    if filename not in ALLOWED_FILES:
        raise ValueError(f"不允許替換白名單以外的檔案：{filename}")
    base_real = os.path.realpath(BASE_DIR)
    target_real = os.path.realpath(os.path.join(base_real, filename))
    if not target_real.startswith(base_real + os.sep):
        raise ValueError(f"檔案路徑超出安裝目錄範圍：{filename}")
    return target_real


def check_for_update(timeout: float = DEFAULT_TIMEOUT) -> dict:
    """
    Returns a structured dict describing whether an update is available.
    Never raises on network failures — returns offline=True gracefully.
    """
    state = load_local_state()
    local_version = str(state.get("version") or "1.0.0")
    base_url = normalize_github_base_url(state.get("updateSourceUrl", ""))

    if not base_url:
        return {
            "ok": False,
            "offline": False,
            "hasUpdate": False,
            "localVersion": local_version,
            "reason": "尚未設定有效的 GitHub 更新來源網址。",
        }

    # 1. Prefer version.json manifest
    manifest_url = base_url + "version.json"
    try:
        raw_manifest = fetch_bytes(manifest_url, timeout=timeout)
        remote_meta = json.loads(raw_manifest.decode("utf-8"))
        if isinstance(remote_meta, dict) and remote_meta.get("version"):
            remote_ver = str(remote_meta["version"]).strip()
            raw_files = remote_meta.get("files") or ["index.html"]
            safe_files = [f for f in raw_files if isinstance(f, str) and f in ALLOWED_FILES]
            if not safe_files:
                safe_files = ["index.html"]
            remote_hashes = remote_meta.get("hashes") if isinstance(remote_meta.get("hashes"), dict) else {}
            notes = str(remote_meta.get("notes") or "最新版前端與展覽體驗優化").strip()
            released_at = str(remote_meta.get("releasedAt") or "").strip()

            has_update = is_newer_version(remote_ver, local_version)
            # Also detect hash mismatch if same version string but updated hash provided
            if not has_update and remote_hashes:
                for fname in safe_files:
                    expected = str(remote_hashes.get(fname, "")).strip().lower()
                    if expected:
                        local_hash = compute_file_sha256(confined_target_path(fname)).lower()
                        if local_hash and local_hash != expected:
                            has_update = True
                            break

            return {
                "ok": True,
                "offline": False,
                "mode": "manifest",
                "hasUpdate": has_update,
                "localVersion": local_version,
                "remoteVersion": remote_ver,
                "releasedAt": released_at,
                "notes": notes,
                "files": safe_files,
                "expectedHashes": remote_hashes,
                "baseUrl": base_url,
            }
    except urllib.error.HTTPError as exc:
        if exc.code != 404:
            return {
                "ok": False,
                "offline": True,
                "hasUpdate": False,
                "localVersion": local_version,
                "reason": f"連線遠端更新清單失敗（HTTP {exc.code}）。",
            }
    except (urllib.error.URLError, TimeoutError, socket.timeout, ConnectionError):
        return {
            "ok": False,
            "offline": True,
            "hasUpdate": False,
            "localVersion": local_version,
            "reason": "目前無網路連線或連線逾時，已略過檢查。",
        }
    except Exception:
        # Malformed version.json -> fall through to index.html fingerprint fallback
        pass

    # 2. Fallback: compare remote index.html SHA-256 directly
    try:
        remote_html = fetch_bytes(base_url + "index.html", timeout=timeout)
        if len(remote_html) < 200 or b"<html" not in remote_html.lower():
            return {
                "ok": False,
                "offline": False,
                "hasUpdate": False,
                "localVersion": local_version,
                "reason": "遠端尚未找到有效的 version.json 或 index.html。",
            }
        remote_hash = compute_sha256_bytes(remote_html)
        local_html_path = confined_target_path("index.html")
        local_hash = compute_file_sha256(local_html_path)
        has_update = bool(remote_hash and local_hash and remote_hash != local_hash)
        return {
            "ok": True,
            "offline": False,
            "mode": "fingerprint",
            "hasUpdate": has_update,
            "localVersion": local_version,
            "remoteVersion": f"GitHub 最新版 ({remote_hash[:7]})",
            "releasedAt": datetime.now().strftime("%Y-%m-%d"),
            "notes": "偵測到 GitHub 上的 index.html 已有新版本變更（檔案指紋不同）。",
            "files": ["index.html"],
            "expectedHashes": {"index.html": remote_hash},
            "baseUrl": base_url,
        }
    except (urllib.error.URLError, TimeoutError, socket.timeout, ConnectionError):
        return {
            "ok": False,
            "offline": True,
            "hasUpdate": False,
            "localVersion": local_version,
            "reason": "目前無法連線至 GitHub，將直接啟動本機版本。",
        }
    except Exception as exc:
        return {
            "ok": False,
            "offline": False,
            "hasUpdate": False,
            "localVersion": local_version,
            "reason": f"檢查更新時發生錯誤：{exc}",
        }


def validate_downloaded_content(filename: str, content: bytes, expected_hash: str = "") -> None:
    if not content or len(content) < 100:
        raise ValueError(f"下載的 {filename} 內容過短或不完整，已中止更新。")
    if expected_hash:
        actual = compute_sha256_bytes(content).lower()
        if actual != expected_hash.strip().lower():
            raise ValueError(f"{filename} 驗證碼（SHA-256）不相符，已中止替換以策安全。")
    if filename == "index.html":
        lower_sample = content[:4096].lower()
        if b"<html" not in lower_sample and b"<!doctype html" not in lower_sample:
            raise ValueError("下載的 index.html 不是有效的網頁文件，已中止替換。")
    elif filename == "server.py":
        source_text = content.decode("utf-8")
        compile(source_text, "server.py", "exec")


def create_backup_snapshot(old_version: str, filenames: list) -> str:
    os.makedirs(BACKUPS_DIR, exist_ok=True)
    safe_ver = "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in old_version) or "prev"
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    snap_dir = os.path.join(BACKUPS_DIR, f"v{safe_ver}_{ts}")
    os.makedirs(snap_dir, exist_ok=True)

    backed_up = []
    for fname in list(filenames) + ["version.json"]:
        src = os.path.join(BASE_DIR, fname)
        if os.path.isfile(src):
            shutil.copy2(src, os.path.join(snap_dir, fname))
            backed_up.append(fname)

    # Keep at most the 8 most recent backup snapshots
    try:
        entries = sorted(
            [
                os.path.join(BACKUPS_DIR, d)
                for d in os.listdir(BACKUPS_DIR)
                if os.path.isdir(os.path.join(BACKUPS_DIR, d))
            ],
            key=os.path.getmtime,
            reverse=True,
        )
        for old_dir in entries[8:]:
            shutil.rmtree(old_dir, ignore_errors=True)
    except Exception:
        pass

    return snap_dir


def apply_update(check_info: dict = None) -> dict:
    """
    Downloads updated files to a temp staging directory, validates every file,
    backs up the existing files into .backups/, and atomically swaps them in.
    """
    info = check_info if (check_info and check_info.get("ok")) else check_for_update(timeout=DOWNLOAD_TIMEOUT)
    if not info.get("ok"):
        return {"ok": False, "message": info.get("reason") or "無法取得遠端更新資訊。"}

    base_url = info["baseUrl"]
    files_to_update = [f for f in info.get("files", ["index.html"]) if f in ALLOWED_FILES]
    if not files_to_update:
        files_to_update = ["index.html"]
    expected_hashes = info.get("expectedHashes") or {}

    staged = {}
    with tempfile.TemporaryDirectory(prefix="catparadise_upd_") as tmp_dir:
        for fname in files_to_update:
            raw_bytes = fetch_bytes(base_url + fname, timeout=DOWNLOAD_TIMEOUT)
            validate_downloaded_content(fname, raw_bytes, str(expected_hashes.get(fname, "")))
            tmp_file = os.path.join(tmp_dir, fname)
            with open(tmp_file, "wb") as f:
                f.write(raw_bytes)
            staged[fname] = (tmp_file, compute_sha256_bytes(raw_bytes))

        state = load_local_state()
        old_version = str(state.get("version") or "1.0.0")
        backup_dir = create_backup_snapshot(old_version, files_to_update)

        # Atomic replacement strictly inside BASE_DIR
        updated_hashes = dict(state.get("hashes") or {})
        for fname, (tmp_file, file_hash) in staged.items():
            dest_path = confined_target_path(fname)
            local_tmp = dest_path + ".new"
            shutil.copy2(tmp_file, local_tmp)
            os.replace(local_tmp, dest_path)
            updated_hashes[fname] = file_hash

        state["version"] = str(info.get("remoteVersion") or old_version)
        state["releasedAt"] = str(info.get("releasedAt") or datetime.now().strftime("%Y-%m-%d"))
        state["hashes"] = updated_hashes
        state["lastUpdatedAt"] = datetime.now().isoformat(timespec="seconds")
        save_local_state(state)

    return {
        "ok": True,
        "previousVersion": old_version,
        "newVersion": state["version"],
        "updatedFiles": files_to_update,
        "backupDir": os.path.basename(backup_dir),
        "message": f"已成功更新至 {state['version']}（舊版已備份至 .backups/{os.path.basename(backup_dir)}）。",
    }


def list_backups() -> list:
    if not os.path.isdir(BACKUPS_DIR):
        return []
    dirs = [
        d
        for d in os.listdir(BACKUPS_DIR)
        if os.path.isdir(os.path.join(BACKUPS_DIR, d))
    ]
    dirs.sort(key=lambda d: os.path.getmtime(os.path.join(BACKUPS_DIR, d)), reverse=True)
    return dirs


def rollback_latest_backup() -> dict:
    backups = list_backups()
    if not backups:
        return {"ok": False, "message": "目前沒有可還原的舊版備份（.backups 資料夾為空）。"}

    latest = backups[0]
    snap_dir = os.path.join(BACKUPS_DIR, latest)
    restored = []
    for fname in list(ALLOWED_FILES) + ["version.json"]:
        src = os.path.join(snap_dir, fname)
        if os.path.isfile(src):
            dest = os.path.join(BASE_DIR, fname) if fname == "version.json" else confined_target_path(fname)
            tmp_dest = dest + ".restore"
            shutil.copy2(src, tmp_dest)
            os.replace(tmp_dest, dest)
            restored.append(fname)

    if not restored:
        return {"ok": False, "message": f"備份資料夾 {latest} 內沒有可還原的程式檔案。"}

    return {
        "ok": True,
        "backupName": latest,
        "restoredFiles": restored,
        "message": f"已成功還原至備份版本：{latest}（cats/ 圖庫完全未動）。",
    }


# ==================== NATIVE OS DIALOGS (WINDOWS & MACOS) ====================

def _ps_quote(text: str) -> str:
    return "'" + text.replace("'", "''") + "'"


def _as_escape(text: str) -> str:
    return text.replace("\\\\", "\\\\\\\\").replace('"', '\\\\"').replace("\\r\\n", "\\n").replace("\\n", "\\\\n")


def show_yes_no_dialog(title: str, body: str, yes_label: str = "立即更新並重啟", no_label: str = "稍後再說") -> bool:
    sys_name = platform.system()
    if sys_name == "Windows":
        ps_script = (
            "Add-Type -AssemblyName System.Windows.Forms;"
            "$r = [System.Windows.Forms.MessageBox]::Show("
            f"{_ps_quote(body)}, {_ps_quote(title)}, "
            "[System.Windows.Forms.MessageBoxButtons]::YesNo, "
            "[System.Windows.Forms.MessageBoxIcon]::Information);"
            "if ($r -eq [System.Windows.Forms.DialogResult]::Yes) { exit 0 } else { exit 1 }"
        )
        try:
            res = subprocess.run(
                ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-STA", "-Command", ps_script],
                check=False,
            )
            return res.returncode == 0
        except Exception:
            pass
    elif sys_name == "Darwin":
        apple_cmd = (
            f'display dialog "{_as_escape(body)}" with title "{_as_escape(title)}" '
            f'buttons {{"{_as_escape(no_label)}", "{_as_escape(yes_label)}"}} '
            f'default button "{_as_escape(yes_label)}"'
        )
        try:
            res = subprocess.run(["osascript", "-e", apple_cmd], capture_output=True, text=True, check=False)
            return res.returncode == 0 and yes_label in (res.stdout or "")
        except Exception:
            pass

    # Fallback terminal prompt
    print("\\n" + "=" * 60)
    print(title)
    print(body)
    print("=" * 60)
    try:
        ans = input(f"是否執行「{yes_label}」？[Y/n]: ").strip().lower()
        return ans in ("", "y", "yes")
    except Exception:
        return False


def show_info_dialog(title: str, body: str, is_error: bool = False) -> None:
    sys_name = platform.system()
    if sys_name == "Windows":
        icon = "Error" if is_error else "Information"
        ps_script = (
            "Add-Type -AssemblyName System.Windows.Forms;"
            f"[void][System.Windows.Forms.MessageBox]::Show({_ps_quote(body)}, {_ps_quote(title)}, "
            f"[System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::{icon})"
        )
        try:
            subprocess.run(
                ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-STA", "-Command", ps_script],
                check=False,
            )
            return
        except Exception:
            pass
    elif sys_name == "Darwin":
        apple_cmd = (
            f'display dialog "{_as_escape(body)}" with title "{_as_escape(title)}" '
            'buttons {"確定"} default button "確定"'
        )
        try:
            subprocess.run(["osascript", "-e", apple_cmd], capture_output=True, check=False)
            return
        except Exception:
            pass

    print(f"[{title}] {body}")


def run_startup_check() -> int:
    state = load_local_state()
    if not state.get("autoCheckOnStartup", True):
        return 0
    if not state.get("updateSourceUrl"):
        return 0

    print("[自動更新] 正在檢查 GitHub 是否有新版本（最多等待 4 秒）...")
    info = check_for_update(timeout=DEFAULT_TIMEOUT)
    if not info.get("ok"):
        print(f"[自動更新] {info.get('reason', '略過檢查')}，直接啟動本機樂園。")
        return 0

    if not info.get("hasUpdate"):
        print(f"[自動更新] 目前已是最新版本（v{info.get('localVersion')}）。")
        return 0

    file_list = "、".join(info.get("files") or ["index.html"])
    prompt_body = (
        "偵測到「跨界歸零｜貓咪互動樂園」有新版本可更新！\\n\\n"
        f"目前版本：{info.get('localVersion')}\\n"
        f"最新版本：{info.get('remoteVersion')}\\n"
        f"更新檔案：{file_list}\\n"
        f"更新說明：{info.get('notes')}\\n\\n"
        "系統會自動備份舊版至 .backups/，並完整保留您的 cats/ 貓咪圖庫。\\n"
        "是否要立即下載並替換為最新版本？"
    )

    if show_yes_no_dialog("發現新版本 — 跨界歸零｜貓咪互動樂園", prompt_body):
        print("[自動更新] 正在下載並驗證新版本檔案...")
        result = apply_update(info)
        if result.get("ok"):
            print(f"[自動更新] {result['message']}")
            show_info_dialog(
                "更新完成",
                f"{result['message']}\\n\\n按下確定後將立刻啟動最新版貓咪互動樂園！",
            )
        else:
            print(f"[自動更新] 更新失敗：{result.get('message')}")
            show_info_dialog(
                "更新未完成（將使用現有版本啟動）",
                f"更新過程發生問題：{result.get('message')}\\n\\n原有檔案未受影響，將為您直接啟動現有版本。",
                is_error=True,
            )
    else:
        print("[自動更新] 已略過本次更新，直接啟動現有版本。")
    return 0


def run_interactive_manager() -> int:
    state = load_local_state()
    backups = list_backups()
    latest_backup_hint = backups[0] if backups else "尚無備份"

    sys_name = platform.system()
    choice = "check"

    if sys_name == "Darwin":
        body = (
            f"目前本機版本：{state.get('version', '1.0.0')}\\n"
            f"GitHub 更新來源：{state.get('updateSourceUrl') or '尚未設定'}\\n"
            f"最近一次備份：{latest_backup_hint}\\n\\n"
            "請選擇您要執行的動作："
        )
        cmd = (
            f'button returned of (display dialog "{_as_escape(body)}" '
            'with title "版本更新與備份還原管理" '
            'buttons {"關閉", "還原上一版備份", "立即檢查更新"} default button "立即檢查更新")'
        )
        res = subprocess.run(["osascript", "-e", cmd], capture_output=True, text=True, check=False)
        out = (res.stdout or "").strip()
        if out == "還原上一版備份":
            choice = "rollback"
        elif out == "立即檢查更新":
            choice = "check"
        else:
            return 0
    elif sys_name == "Windows":
        body = (
            f"目前本機版本：{state.get('version', '1.0.0')}\\n"
            f"GitHub 更新來源：{state.get('updateSourceUrl') or '尚未設定'}\\n"
            f"最近一次備份：{latest_backup_hint}\\n\\n"
            "點選「是(Y)」：立即從 GitHub 檢查並下載最新版本\\n"
            "點選「否(N)」：還原至最近一次備份的舊版\\n"
            "點選「取消」：關閉視窗"
        )
        ps_script = (
            "Add-Type -AssemblyName System.Windows.Forms;"
            "$r = [System.Windows.Forms.MessageBox]::Show("
            f"{_ps_quote(body)}, '版本更新與備份還原管理', "
            "[System.Windows.Forms.MessageBoxButtons]::YesNoCancel, "
            "[System.Windows.Forms.MessageBoxIcon]::Question);"
            "if ($r -eq [System.Windows.Forms.DialogResult]::Yes) { exit 10 } "
            "elseif ($r -eq [System.Windows.Forms.DialogResult]::No) { exit 20 } "
            "else { exit 0 }"
        )
        res = subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-STA", "-Command", ps_script],
            check=False,
        )
        if res.returncode == 10:
            choice = "check"
        elif res.returncode == 20:
            choice = "rollback"
        else:
            return 0

    if choice == "rollback":
        rb = rollback_latest_backup()
        show_info_dialog("備份還原結果", rb.get("message", ""), is_error=not rb.get("ok"))
        return 0 if rb.get("ok") else 1

    info = check_for_update(timeout=DOWNLOAD_TIMEOUT)
    if not info.get("ok"):
        show_info_dialog("無法檢查更新", info.get("reason", "請確認網路連線與 GitHub 網址設定。"), is_error=True)
        return 1
    if not info.get("hasUpdate"):
        show_info_dialog(
            "已是最新版本",
            f"您目前的版本（{info.get('localVersion')}）已經是 GitHub 上的最新版本！",
        )
        return 0

    prompt_body = (
        f"發現新版本：{info.get('localVersion')} → {info.get('remoteVersion')}\\n"
        f"更新說明：{info.get('notes')}\\n\\n"
        "是否立即下載替換？（舊版將自動備份至 .backups/，cats/ 圖庫完整保留）"
    )
    if show_yes_no_dialog("發現新版本", prompt_body, yes_label="立即更新", no_label="取消"):
        res = apply_update(info)
        show_info_dialog("更新結果", res.get("message", ""), is_error=not res.get("ok"))
        return 0 if res.get("ok") else 1
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="跨界歸零｜貓咪互動樂園 GitHub 自動更新器")
    parser.add_argument("--startup", action="store_true", help="啟動前快速檢查並彈窗提醒")
    parser.add_argument("--gui", action="store_true", help="開啟互動式檢查更新／備份還原管理視窗")
    parser.add_argument("--check-json", action="store_true", help="以 JSON 輸出檢查結果")
    parser.add_argument("--apply-json", action="store_true", help="自動下載替換並以 JSON 輸出結果")
    parser.add_argument("--rollback-json", action="store_true", help="還原最新備份並以 JSON 輸出結果")
    args = parser.parse_args()

    if args.check_json:
        print(json.dumps(check_for_update(timeout=DOWNLOAD_TIMEOUT), ensure_ascii=False))
    elif args.apply_json:
        print(json.dumps(apply_update(), ensure_ascii=False))
    elif args.rollback_json:
        print(json.dumps(rollback_latest_backup(), ensure_ascii=False))
    elif args.startup:
        sys.exit(run_startup_check())
    else:
        sys.exit(run_interactive_manager())
`;
}
