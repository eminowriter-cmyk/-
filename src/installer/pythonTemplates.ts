/**
 * Generates customized, offline-ready Python scripts bundled inside the installer package.
 * All scripts anchor their paths to os.path.dirname(os.path.abspath(__file__)) so they
 * work reliably whether launched via Desktop Shortcut, Finder, or Windows Explorer.
 */

export function generateServerPy(port: number, autoOpenBrowser: boolean): string {
  const safePort = Number.isInteger(port) && port >= 1024 && port <= 65535 ? port : 8000;
  return `# -*- coding: utf-8 -*-
"""
跨界歸零｜貓咪互動樂園 — 專用本機展覽伺服器與清單同步器
1. 自動將工作目錄固定於程式所在資料夾，杜絕路徑錯誤與 404。
2. 啟動即建立 cats/ 資料夾與 cats/manifest.json。
3. 背景持續掃描 cats/，只要放入新去背貓咪 PNG/WEBP 即自動同步至大螢幕。
4. 內建本機限定版本查詢與更新 API（僅接受 127.0.0.1 / localhost 呼叫）。
"""

import os
import json
import time
import threading
import webbrowser
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

PORT = ${safePort}
AUTO_OPEN_BROWSER = ${autoOpenBrowser ? 'True' : 'False'}
CATS_DIR = os.path.join(BASE_DIR, "cats")
MANIFEST_PATH = os.path.join(CATS_DIR, "manifest.json")
VERSION_PATH = os.path.join(BASE_DIR, "version.json")

os.makedirs(CATS_DIR, exist_ok=True)
if not os.path.exists(MANIFEST_PATH):
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False)

try:
    import updater as app_updater
except Exception:
    app_updater = None


def read_local_version_info():
    if app_updater is not None:
        info = dict(app_updater.load_local_state())
        info["backups"] = app_updater.list_backups()
        return info
    if os.path.isfile(VERSION_PATH):
        try:
            with open(VERSION_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"version": "1.0.0", "updateSourceUrl": "", "backups": []}


class QuietNoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def _is_local_client(self) -> bool:
        client_ip = (self.client_address[0] if self.client_address else "")
        return client_ip in ("127.0.0.1", "::1", "::ffff:127.0.0.1")

    def _is_trusted_local_origin(self) -> bool:
        origin = self.headers.get("Origin")
        if not origin:
            return True
        parsed = urllib.parse.urlparse(origin)
        return parsed.hostname in ("localhost", "127.0.0.1", "::1")

    def _send_json(self, status_code: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        route = urllib.parse.urlparse(self.path).path
        if route == "/api/version":
            self._send_json(200, read_local_version_info())
            return
        if route == "/api/update/check":
            if not self._is_local_client():
                self._send_json(403, {"ok": False, "message": "僅限本機操作更新檢查。"})
                return
            if app_updater is None:
                self._send_json(500, {"ok": False, "message": "找不到 updater.py 模組。"})
                return
            self._send_json(200, app_updater.check_for_update())
            return
        super().do_GET()

    def do_POST(self):
        route = urllib.parse.urlparse(self.path).path
        if route in ("/api/update/apply", "/api/update/rollback"):
            if not self._is_local_client() or not self._is_trusted_local_origin():
                self._send_json(403, {"ok": False, "message": "僅限本機視窗執行更新與還原操作。"})
                return
            if app_updater is None:
                self._send_json(500, {"ok": False, "message": "找不到 updater.py 模組。"})
                return
            if route == "/api/update/apply":
                result = app_updater.apply_update()
            else:
                result = app_updater.rollback_latest_backup()
            self._send_json(200 if result.get("ok") else 400, result)
            return
        self._send_json(404, {"ok": False, "message": "不支援的路徑。"})

    def log_message(self, format, *args):
        # 僅記錄非輪詢請求，保持視窗整潔
        if args and "manifest.json" in str(args[0]):
            return
        super().log_message(format, *args)


def auto_update_manifest():
    """持續監視 cats/ 目錄並自動更新 manifest.json"""
    last_files = None
    while True:
        try:
            files = [
                f for f in os.listdir(CATS_DIR)
                if f.lower().endswith((".png", ".webp")) and f != "manifest.json"
            ]
            files.sort(key=lambda x: os.path.getmtime(os.path.join(CATS_DIR, x)))
            if files != last_files:
                with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
                    json.dump(files, f, ensure_ascii=False, indent=2)
                print(f"[系統] 已同步 manifest.json，目前共 {len(files)} 隻貓咪")
                last_files = files
        except Exception as e:
            print(f"[警告] 清單同步異常：{e}")
        time.sleep(1.5)


def open_browser_later(url: str):
    time.sleep(1.0)
    try:
        webbrowser.open(url)
    except Exception:
        pass


if __name__ == "__main__":
    threading.Thread(target=auto_update_manifest, daemon=True).start()
    url = f"http://localhost:{PORT}/"
    ver_info = read_local_version_info()

    if AUTO_OPEN_BROWSER:
        threading.Thread(target=open_browser_later, args=(url,), daemon=True).start()

    server = ThreadingHTTPServer(("0.0.0.0", PORT), QuietNoCacheHandler)
    print("=" * 60)
    print(f"🐾 跨界歸零｜貓咪互動樂園 本機伺服器已啟動（v{ver_info.get('version', '1.0.0')}）")
    print(f"👉 瀏覽器網址：{url}")
    print(f"📁 貓咪圖片目錄：{CATS_DIR}")
    if ver_info.get("updateSourceUrl"):
        print(f"🔄 GitHub 更新來源：{ver_info.get('updateSourceUrl')}")
    print("⌨️  按 Ctrl+C 或直接關閉此視窗即可停止伺服器")
    print("=" * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\\n伺服器已安全關閉。")
`;
}

export const CAMERA_REMOVE_BG_PY = `# -*- coding: utf-8 -*-
"""
跨界歸零｜貓咪互動樂園 — 攝影機實體畫紙即時拍照去背系統
按空白鍵 (SPACE) 拍照並自動去背、加手作白邊、寫入 cats/ 並同步 manifest.json。
"""

import os
import cv2
import json
import time
import numpy as np
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CATS_DIR = os.path.join(BASE_DIR, "cats")
MANIFEST_PATH = os.path.join(CATS_DIR, "manifest.json")

os.makedirs(CATS_DIR, exist_ok=True)
if not os.path.exists(MANIFEST_PATH):
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False)


def update_manifest():
    try:
        files = [
            f for f in os.listdir(CATS_DIR)
            if f.lower().endswith((".png", ".webp")) and f != "manifest.json"
        ]
        files.sort(key=lambda x: os.path.getmtime(os.path.join(CATS_DIR, x)))
        with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
            json.dump(files, f, ensure_ascii=False, indent=2)
        print(f"[完成] 已更新清單，目前共 {len(files)} 隻貓咪。")
    except Exception as e:
        print(f"[警告] 更新清單失敗：{e}")


def remove_paper_background(bgr_image, add_sticker_border=True):
    h, w = bgr_image.shape[:2]
    gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.medianBlur(gray, 5)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 25, 8
    )

    hsv = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2HSV)
    saturation = hsv[:, :, 1]
    color_mask = cv2.threshold(saturation, 35, 255, cv2.THRESH_BINARY)[1]

    combined_mask = cv2.bitwise_or(thresh, color_mask)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel_small, iterations=1)

    contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    valid_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 200]
    if not valid_contours:
        return None

    main_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(main_mask, valid_contours, -1, 255, thickness=cv2.FILLED)

    all_points = np.vstack(valid_contours)
    bx, by, bw, bh = cv2.boundingRect(all_points)

    bgra = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2BGRA)
    if add_sticker_border:
        border_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        sticker_mask = cv2.dilate(main_mask, border_kernel, iterations=1)
        border_area = cv2.subtract(sticker_mask, main_mask)
        bgra[border_area > 0] = [248, 253, 255, 255]
        bgra[sticker_mask == 0] = [0, 0, 0, 0]
        pad = 20
    else:
        bgra[:, :, 3] = main_mask
        pad = 10

    x1, y1 = max(0, bx - pad), max(0, by - pad)
    x2, y2 = min(w, bx + bw + pad), min(h, by + bh + pad)
    cropped = bgra[y1:y2, x1:x2]

    ch, cw = cropped.shape[:2]
    target_dim = 260
    scale = min(target_dim / max(cw, 1), target_dim / max(ch, 1))
    new_w, new_h = max(1, int(cw * scale)), max(1, int(ch * scale))
    return cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_AREA)


def run_camera_scanner():
    print("=" * 60)
    print("📷 貓咪互動樂園 — 攝影機去背拍照系統已啟動")
    print("   [空白鍵 SPACE] 拍照去背並空投至大螢幕")
    print("   [Q 鍵 或 ESC]  結束程式")
    print("=" * 60)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[錯誤] 無法開啟攝影機，請確認鏡頭已連接且未被其他程式佔用。")
        input("按 Enter 鍵關閉視窗...")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cv2.namedWindow("Cat Drawing Scanner", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Cat Drawing Scanner", 960, 540)

    cat_counter = 1
    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.3)
            continue

        display = frame.copy()
        h, w = display.shape[:2]
        box_w, box_h = int(w * 0.65), int(h * 0.75)
        x1, y1 = (w - box_w) // 2, (h - box_h) // 2
        x2, y2 = x1 + box_w, y1 + box_h

        cv2.rectangle(display, (x1, y1), (x2, y2), (107, 134, 107), 3)
        cv2.putText(
            display,
            "Place drawing inside box & Press [SPACE] to Scan (Q to Quit)",
            (x1 + 8, max(28, y1 - 12)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.62,
            (107, 134, 107),
            2,
        )
        cv2.imshow("Cat Drawing Scanner", display)

        key = cv2.waitKey(1) & 0xFF
        if key == ord(" "):
            crop_source = frame[y1:y2, x1:x2]
            result = remove_paper_background(crop_source, add_sticker_border=True)
            if result is not None:
                ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"cat_{ts}_{cat_counter:03d}.png"
                output_path = os.path.join(CATS_DIR, filename)
                cv2.imwrite(output_path, result)
                print(f"[成功] 已存檔：{output_path}")
                update_manifest()
                cat_counter += 1
                flash = np.full_like(display, 255)
                cv2.imshow("Cat Drawing Scanner", flash)
                cv2.waitKey(120)
            else:
                print("[提示] 未偵測到明顯手繪線條，請確認畫紙放於綠框內且光線充足。")
        elif key in (ord("q"), ord("Q"), 27):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    run_camera_scanner()
`;

export const FOLDER_REMOVE_BG_PY = `# -*- coding: utf-8 -*-
"""
跨界歸零｜貓咪互動樂園 — 資料夾監控自動去背系統
將手機或掃描機拍好的畫紙照片放入 input_photos/，
系統即自動去背、加上手作白邊，存至 cats/ 並同步 manifest.json。
"""

import os
import cv2
import json
import time
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(BASE_DIR, "input_photos")
OUTPUT_DIR = os.path.join(BASE_DIR, "cats")
MANIFEST_PATH = os.path.join(OUTPUT_DIR, "manifest.json")

os.makedirs(INPUT_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
if not os.path.exists(MANIFEST_PATH):
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False)


def update_manifest():
    try:
        files = [
            f for f in os.listdir(OUTPUT_DIR)
            if f.lower().endswith((".png", ".webp")) and f != "manifest.json"
        ]
        files.sort(key=lambda x: os.path.getmtime(os.path.join(OUTPUT_DIR, x)))
        with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
            json.dump(files, f, ensure_ascii=False, indent=2)
        print(f"[完成] 已同步 manifest.json，目前共 {len(files)} 隻貓咪。")
    except Exception as e:
        print(f"[警告] 更新清單失敗：{e}")


def process_image(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return False

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.medianBlur(gray, 5)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 25, 8
    )

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    color_mask = cv2.threshold(hsv[:, :, 1], 35, 255, cv2.THRESH_BINARY)[1]
    mask = cv2.bitwise_or(thresh, color_mask)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    valid = [c for c in contours if cv2.contourArea(c) > 250]
    if not valid:
        return False

    main_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(main_mask, valid, -1, 255, thickness=cv2.FILLED)
    bx, by, bw, bh = cv2.boundingRect(np.vstack(valid))

    border_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (16, 16))
    sticker_mask = cv2.dilate(main_mask, border_kernel, iterations=1)
    border_area = cv2.subtract(sticker_mask, main_mask)

    bgra = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    bgra[border_area > 0] = [248, 253, 255, 255]
    bgra[sticker_mask == 0] = [0, 0, 0, 0]

    pad = 20
    x1, y1 = max(0, bx - pad), max(0, by - pad)
    x2, y2 = min(w, bx + bw + pad), min(h, by + bh + pad)
    cropped = bgra[y1:y2, x1:x2]

    ch, cw = cropped.shape[:2]
    scale = min(260 / max(cw, 1), 260 / max(ch, 1))
    final_output = cv2.resize(
        cropped,
        (max(1, int(cw * scale)), max(1, int(ch * scale))),
        interpolation=cv2.INTER_AREA,
    )

    base_name = os.path.splitext(os.path.basename(image_path))[0]
    out_path = os.path.join(OUTPUT_DIR, f"{base_name}_cutout.png")
    cv2.imwrite(out_path, final_output)
    print(f"[成功] 已自動去背：{base_name} -> {out_path}")
    return True


def watch_folder():
    print("=" * 60)
    print("📁 貓咪互動樂園 — 資料夾自動去背監視器已啟動")
    print(f"👉 原始畫作放入：{INPUT_DIR}")
    print(f"👉 去背結果輸出：{OUTPUT_DIR}")
    print("=" * 60)

    processed = {
        f for f in os.listdir(INPUT_DIR)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    }

    while True:
        try:
            current = [
                f for f in os.listdir(INPUT_DIR)
                if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
            ]
            new_files = [f for f in current if f not in processed]
            changed = False
            for f in new_files:
                time.sleep(0.3)
                if process_image(os.path.join(INPUT_DIR, f)):
                    changed = True
                processed.add(f)
            if changed:
                update_manifest()
        except Exception as e:
            print(f"[警告] 監控異常：{e}")
        time.sleep(1.5)


if __name__ == "__main__":
    watch_folder()
`;

export const REQUIREMENTS_TXT = `opencv-python>=4.8.0
pillow>=10.0.0
numpy>=1.24.0
`;
