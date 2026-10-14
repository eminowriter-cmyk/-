# -*- coding: utf-8 -*-
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
        print("\n伺服器已正常停止。")
