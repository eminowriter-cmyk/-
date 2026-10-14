import React, { useState } from 'react';
import { Check, Copy, Terminal, X, FolderTree, Cpu, Download, Camera, FolderSearch, Server, Zap } from 'lucide-react';

interface PythonGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCRIPT_CAMERA = `# -*- coding: utf-8 -*-
"""
貓咪互動樂園 - 攝影機實體畫紙去背拍照系統 (Camera Scanner & Auto Remove Background)
適用環境：實體展覽現場、單機無網路、Webcam / USB 高清攝影機

功能特點：
1. 即時攝影機畫面，按「空白鍵 (SPACE)」拍照並自動去背。
2. 自動過濾白紙底色，產生透明背景 PNG。
3. 自動為手繪貓咪加上「手作白色裁切貼紙邊框 (Paper Cutout Outline)」。
4. 自動裁切緊湊邊界，存檔至 'cats/' 並即時更新 'cats/manifest.json'，大螢幕立刻空投！

安裝指令：pip install opencv-python pillow numpy
"""

import os
import cv2
import json
import time
import numpy as np
from datetime import datetime

CATS_DIR = "cats"
if not os.path.exists(CATS_DIR):
    os.makedirs(CATS_DIR)

def update_manifest():
    """更新 cats/manifest.json 清單供前端大螢幕讀取"""
    try:
        files = [
            f for f in os.listdir(CATS_DIR)
            if f.lower().endswith(('.png', '.webp')) and f != "manifest.json"
        ]
        files.sort(key=lambda x: os.path.getmtime(os.path.join(CATS_DIR, x)))
        manifest_path = os.path.join(CATS_DIR, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(files, f, ensure_ascii=False, indent=2)
        print(f"✅ 已同步更新清單！目前樂園共有 {len(files)} 隻貓咪。")
    except Exception as e:
        print(f"⚠️ 清單更新失敗: {e}")

def remove_paper_background(bgr_image, add_sticker_border=True):
    h, w = bgr_image.shape[:2]
    gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.medianBlur(gray, 5)

    # 自適應二值化 (抓取比紙張暗的蠟筆筆觸)
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
    if not contours:
        return None

    valid_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 200]
    if not valid_contours:
        return None

    main_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(main_mask, valid_contours, -1, 255, thickness=cv2.FILLED)

    all_points = np.vstack(valid_contours)
    bx, by, bw, bh = cv2.boundingRect(all_points)

    if add_sticker_border:
        # 手作白邊外框
        border_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        sticker_mask = cv2.dilate(main_mask, border_kernel, iterations=1)
        border_area = cv2.subtract(sticker_mask, main_mask)

        bgra = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2BGRA)
        bgra[border_area > 0] = [255, 255, 255, 255]
        bgra[sticker_mask == 0] = [0, 0, 0, 0]

        pad = 20
        x1 = max(0, bx - pad)
        y1 = max(0, by - pad)
        x2 = min(w, bx + bw + pad)
        y2 = min(h, by + bh + pad)
        cropped_result = bgra[y1:y2, x1:x2]
    else:
        bgra = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2BGRA)
        bgra[:, :, 3] = main_mask
        pad = 10
        x1 = max(0, bx - pad)
        y1 = max(0, by - pad)
        x2 = min(w, bx + bw + pad)
        y2 = min(h, by + bh + pad)
        cropped_result = bgra[y1:y2, x1:x2]

    # 等比例縮放至適合展覽大螢幕尺寸 (寬高約 200~320px)
    ch, cw = cropped_result.shape[:2]
    target_dim = 260
    scale = min(target_dim / max(cw, 1), target_dim / max(ch, 1))
    new_w, new_h = max(1, int(cw * scale)), max(1, int(ch * scale))
    final_output = cv2.resize(cropped_result, (new_w, new_h), interpolation=cv2.INTER_AREA)

    return final_output

def run_camera_scanner():
    print("=" * 60)
    print("🐾 貓咪互動樂園 - 實體畫紙去背拍照系統已啟動！")
    print("📷 操作說明：")
    print("   [空白鍵 (SPACE)]：拍攝當前畫作、自動去背、空投進大螢幕！")
    print("   [Q 鍵 或 ESC]  ：安全退出程式")
    print("=" * 60)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ 無法開啟攝影機，請檢查 USB 連接或是否有其他軟體正在佔用鏡頭。")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    cv2.namedWindow("Cat Drawing Scanner", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Cat Drawing Scanner", 960, 540)

    cat_counter = 1

    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠️ 無法讀取攝影機畫面。")
            time.sleep(0.5)
            continue

        display = frame.copy()
        h, w = display.shape[:2]

        box_w, box_h = int(w * 0.65), int(h * 0.75)
        x1 = (w - box_w) // 2
        y1 = (h - box_h) // 2
        x2, y2 = x1 + box_w, y1 + box_h
        cv2.rectangle(display, (x1, y1), (x2, y2), (70, 200, 100), 2)

        cv2.putText(
            display, "Place cat drawing inside box & Press [SPACE] to Scan",
            (x1 + 10, y1 - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (70, 200, 100), 2
        )

        cv2.imshow("Cat Drawing Scanner", display)

        key = cv2.waitKey(1) & 0xFF
        if key == ord(' '):
            print("📸 正在拍照並處理去背中...")
            crop_source = frame[y1:y2, x1:x2]

            transparent_cat = remove_paper_background(crop_source, add_sticker_border=True)
            if transparent_cat is not None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"cat_{timestamp}_{cat_counter:03d}.png"
                output_path = os.path.join(CATS_DIR, filename)

                cv2.imwrite(output_path, transparent_cat)
                print(f"🎉 貓咪已去背存檔：{output_path}")

                update_manifest()
                cat_counter += 1

                flash = np.full_like(display, 255)
                cv2.imshow("Cat Drawing Scanner", flash)
                cv2.waitKey(150)
            else:
                print("⚠️ 未檢測到明顯的手繪線條，請確認畫作是否放入綠框內且光線充足。")

        elif key == ord('q') or key == 27:
            print("👋 程式已退出。")
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_camera_scanner()
`;

const SCRIPT_FOLDER = `# -*- coding: utf-8 -*-
"""
貓咪互動樂園 - 資料夾監控自動去背系統 (Folder Watcher & Auto Background Removal)
適用情境：
使用手機拍下畫作、或掃描器自動將原圖存入 'input_photos/' 資料夾時，
此程式會自動將新照片去背、加上白色手作貼紙外框、裁切並存入 'cats/'，同時更新 'cats/manifest.json'。

安裝指令：pip install opencv-python pillow numpy
"""

import os
import cv2
import json
import time
import numpy as np

INPUT_DIR = "input_photos"
OUTPUT_DIR = "cats"

for d in [INPUT_DIR, OUTPUT_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

def update_manifest():
    """更新 cats/manifest.json 清單供前端大螢幕讀取"""
    try:
        files = [
            f for f in os.listdir(OUTPUT_DIR)
            if f.lower().endswith(('.png', '.webp')) and f != "manifest.json"
        ]
        files.sort(key=lambda x: os.path.getmtime(os.path.join(OUTPUT_DIR, x)))
        manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(files, f, ensure_ascii=False, indent=2)
        print(f"✅ 已更新 manifest.json！目前共 {len(files)} 隻貓咪在樂園中。")
    except Exception as e:
        print(f"⚠️ 更新清單失敗: {e}")

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
    saturation = hsv[:, :, 1]
    color_mask = cv2.threshold(saturation, 35, 255, cv2.THRESH_BINARY)[1]

    mask = cv2.bitwise_or(thresh, color_mask)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return False

    valid_contours = [c for c in contours if cv2.contourArea(c) > 250]
    if not valid_contours:
        return False

    main_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(main_mask, valid_contours, -1, 255, thickness=cv2.FILLED)

    all_pts = np.vstack(valid_contours)
    bx, by, bw, bh = cv2.boundingRect(all_pts)

    border_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (16, 16))
    sticker_mask = cv2.dilate(main_mask, border_kernel, iterations=1)
    border_area = cv2.subtract(sticker_mask, main_mask)

    bgra = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    bgra[border_area > 0] = [255, 255, 255, 255]
    bgra[sticker_mask == 0] = [0, 0, 0, 0]

    pad = 20
    x1, y1 = max(0, bx - pad), max(0, by - pad)
    x2, y2 = min(w, bx + bw + pad), min(h, by + bh + pad)
    cropped = bgra[y1:y2, x1:x2]

    ch, cw = cropped.shape[:2]
    target_dim = 260
    scale = min(target_dim / max(cw, 1), target_dim / max(ch, 1))
    new_w, new_h = max(1, int(cw * scale)), max(1, int(ch * scale))
    final_output = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_AREA)

    base_name = os.path.splitext(os.path.basename(image_path))[0]
    out_name = f"{base_name}_cutout.png"
    out_path = os.path.join(OUTPUT_DIR, out_name)
    cv2.imwrite(out_path, final_output)
    print(f"✨ 去背成功：{image_path} -> {out_path}")
    return True

def watch_folder():
    print("=" * 60)
    print("📁 資料夾自動去背監視器已啟動！")
    print(f"👉 請將原始畫作照片放入：{os.path.abspath(INPUT_DIR)}/")
    print(f"👉 去背後的透明 PNG 將自動存入：{os.path.abspath(OUTPUT_DIR)}/")
    print("=" * 60)

    processed_files = set()
    for f in os.listdir(INPUT_DIR):
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            processed_files.add(f)

    while True:
        try:
            current_files = [
                f for f in os.listdir(INPUT_DIR)
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
            ]
            new_files = [f for f in current_files if f not in processed_files]

            has_new = False
            for f in new_files:
                img_path = os.path.join(INPUT_DIR, f)
                time.sleep(0.3)
                if process_image(img_path):
                    has_new = True
                processed_files.add(f)

            if has_new:
                update_manifest()

        except Exception as e:
            print(f"⚠️ 監控過程異常: {e}")

        time.sleep(1.5)

if __name__ == "__main__":
    watch_folder()
`;

const SCRIPT_SERVER = `# -*- coding: utf-8 -*-
"""
貓咪互動樂園 - 專用本機伺服器與清單同步器 (All-In-One Exhibition Server)
功能：
1. 啟動 localhost:8000 伺服器供大螢幕瀏覽器載入。
2. 背景持續偵測 'cats/' 目錄，只要有新貓咪透明圖放入，即刻同步更新 'cats/manifest.json'。
3. 支援無網路離線環境、無記憶體洩漏。
"""

import os
import json
import time
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 8000
CATS_DIR = "cats"

if not os.path.exists(CATS_DIR):
    os.makedirs(CATS_DIR)

def auto_update_manifest():
    """持續監視 cats/ 目錄並自動產出 manifest.json"""
    last_files = []
    while True:
        try:
            files = [
                f for f in os.listdir(CATS_DIR)
                if f.lower().endswith(('.png', '.webp')) and f != "manifest.json"
            ]
            files.sort(key=lambda x: os.path.getmtime(os.path.join(CATS_DIR, x)))

            if files != last_files:
                manifest_path = os.path.join(CATS_DIR, "manifest.json")
                with open(manifest_path, "w", encoding="utf-8") as f:
                    json.dump(files, f, ensure_ascii=False, indent=2)
                print(f"[系統] 已自動更新 manifest.json！目前共 {len(files)} 隻貓咪")
                last_files = files
        except Exception as e:
            print(f"[錯誤] {e}")
        time.sleep(2)

if __name__ == "__main__":
    threading.Thread(target=auto_update_manifest, daemon=True).start()

    server = HTTPServer(("0.0.0.0", PORT), SimpleHTTPRequestHandler)
    print("=" * 60)
    print(f"🐱 貓咪互動樂園已啟動！")
    print(f"👉 請在投影機瀏覽器打開：http://localhost:{PORT}")
    print(f"📁 掃描去背後的圖檔請存入：{os.path.abspath(CATS_DIR)}/")
    print(f"⌨️  按 Ctrl+C 可停止伺服器")
    print("=" * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\\n伺服器已正常停止。")
`;

const SCRIPT_BAT = `@echo off
chcp 65001 >nul
title 貓咪互動樂園 - 展覽伺服器
echo ========================================================
echo  🐱 貓咪互動樂園 (Crayon Cat Paradise) 展覽伺服器啟動中
echo ========================================================
echo.
echo 正在開啟瀏覽器大螢幕畫面...
start http://localhost:8000
echo.
echo 正在啟動伺服器與目錄監聽器...
python server.py
if %errorlevel% neq 0 (
    echo.
    echo [提示] 正在嘗試使用 py 指令啟動...
    py server.py
)
pause
`;

export const PythonGuideModal: React.FC<PythonGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'folder' | 'server' | 'bat'>('camera');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentScript =
    activeTab === 'camera'
      ? SCRIPT_CAMERA
      : activeTab === 'folder'
      ? SCRIPT_FOLDER
      : activeTab === 'server'
      ? SCRIPT_SERVER
      : SCRIPT_BAT;

  const currentFilename =
    activeTab === 'camera'
      ? 'camera_remove_bg.py'
      : activeTab === 'folder'
      ? 'folder_remove_bg.py'
      : activeTab === 'server'
      ? 'server.py'
      : '啟動樂園.bat';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadScript = () => {
    const blob = new Blob([currentScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#fffdf7] border-4 border-[#d4b383] rounded-3xl p-6 shadow-2xl cardstock-shadow">
        {/* Top Washi Tape */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-48 h-8 washi-tape-mint -rotate-1 rounded-sm shadow-md" />

        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#d4b383]/60 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="text-[#8c5025]" size={24} />
            <h2 className="text-xl font-bold text-[#5c3a21]">Python 去背與展覽現場整合系統</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#ebd5b3] text-[#7a4e2d] transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Workflow Overview */}
        <div className="mb-4 bg-[#fbf6ec] border-2 border-[#d4b383] rounded-2xl p-4">
          <div className="flex items-center gap-2 font-bold text-sm text-[#8c5025] mb-2">
            <FolderTree size={18} />
            實體展覽現場工作流程架構
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#5c3a21]">
            <div className="bg-[#fffdf7] p-2.5 rounded-xl border border-[#e8dcbe]">
              <span className="font-bold text-[#f79f4a]">1. 現場畫貓 & 去背</span>
              <p className="mt-1 text-[#7a4e2d]">
                觀眾在白紙上作畫，攝影機拍照後由 Python 自動去除白紙底色、加上白色紙偶外框。
              </p>
            </div>
            <div className="bg-[#fffdf7] p-2.5 rounded-xl border border-[#e8dcbe]">
              <span className="font-bold text-[#f79f4a]">2. 存入 cats/ 資料夾</span>
              <p className="mt-1 text-[#7a4e2d]">
                透明 PNG 自動命名存入 <code className="bg-[#ede3cf] px-1 rounded">cats/</code>，並自動更新清單。
              </p>
            </div>
            <div className="bg-[#fffdf7] p-2.5 rounded-xl border border-[#e8dcbe]">
              <span className="font-bold text-[#f79f4a]">3. 投影大螢幕空投</span>
              <p className="mt-1 text-[#7a4e2d]">
                網頁每 3 秒自動讀取清單，新貓咪伴隨降落傘空投降落草地！
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'camera'
                ? 'bg-[#f79f4a] text-white shadow-sm scale-105'
                : 'bg-[#ede3cf] text-[#7a4e2d] hover:bg-[#e2d5bd]'
            }`}
          >
            <Camera size={15} />
            攝影機拍照去背 (camera_remove_bg.py)
          </button>
          <button
            onClick={() => setActiveTab('folder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'folder'
                ? 'bg-[#f79f4a] text-white shadow-sm scale-105'
                : 'bg-[#ede3cf] text-[#7a4e2d] hover:bg-[#e2d5bd]'
            }`}
          >
            <FolderSearch size={15} />
            資料夾自動去背 (folder_remove_bg.py)
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'server'
                ? 'bg-[#f79f4a] text-white shadow-sm scale-105'
                : 'bg-[#ede3cf] text-[#7a4e2d] hover:bg-[#e2d5bd]'
            }`}
          >
            <Server size={15} />
            伺服器與清單更新 (server.py)
          </button>
          <button
            onClick={() => setActiveTab('bat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bat'
                ? 'bg-[#f79f4a] text-white shadow-sm scale-105'
                : 'bg-[#ede3cf] text-[#7a4e2d] hover:bg-[#e2d5bd]'
            }`}
          >
            <Zap size={15} />
            Windows 一鍵捷徑 (啟動樂園.bat)
          </button>
        </div>

        {/* Script Code Block */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7a4e2d]">
              📄 檔案：<code className="text-[#d9480f]">{currentFilename}</code>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadScript}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#fff3bf] hover:bg-[#ffec99] text-[#d9480f] text-xs font-bold rounded-lg border border-[#ffd43b] transition-colors"
                title="下載此腳本檔案"
              >
                <Download size={14} />
                下載此腳本
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#ede3cf] hover:bg-[#e2d5bd] text-[#5c3a21] text-xs font-bold rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    已複製代碼！
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    複製代碼
                  </>
                )}
              </button>
            </div>
          </div>
          <pre className="bg-[#2c221a] text-[#f4ecd8] text-xs p-3.5 rounded-xl overflow-x-auto font-mono leading-relaxed border-2 border-[#5c3a21] max-h-72">
            {currentScript}
          </pre>
        </div>

        {/* Requirements info */}
        <div className="bg-[#e6fcf5] border border-[#96f2d7] rounded-xl p-3 text-xs text-[#0ca678] flex items-center justify-between mb-4">
          <span>
            💡 <b>套件安裝指令：</b> <code className="bg-white/80 px-2 py-0.5 rounded border border-[#96f2d7] text-[#087f5b] font-mono">pip install opencv-python pillow numpy</code>
          </span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[#f79f4a] hover:bg-[#f58f33] text-white font-bold text-sm shadow-md transition-colors"
          >
            完成，關閉說明
          </button>
        </div>
      </div>
    </div>
  );
};
