# -*- coding: utf-8 -*-
"""
貓咪互動樂園 - 資料夾監控自動去背系統 (Folder Watcher & Auto Background Removal)
適用情境：
使用手機拍下畫作、或掃描器自動將原圖存入 'input_photos/' 資料夾時，
此程式會自動即時將新照片去背、加上白色手作貼紙外框、裁切並存入 'cats/'，同時更新 'cats/manifest.json'。

相依套件安裝：
pip install opencv-python pillow numpy
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
    """讀取照片、白紙去背、加上手作撕紙貼紙白邊並存檔"""
    img = cv2.imread(image_path)
    if img is None:
        return False

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.medianBlur(gray, 5)

    # 自適應二值化 (抓取比白紙暗的蠟筆筆觸)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 25, 8
    )

    # 檢測色彩飽和度
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    saturation = hsv[:, :, 1]
    color_mask = cv2.threshold(saturation, 35, 255, cv2.THRESH_BINARY)[1]

    # 合併筆觸與色彩
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

    # 製作白色手作貼紙裁切白邊 (Sticker border)
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

    # 縮放到適中解析度
    ch, cw = cropped.shape[:2]
    target_dim = 260
    scale = min(target_dim / max(cw, 1), target_dim / max(ch, 1))
    new_w, new_h = max(1, int(cw * scale)), max(1, int(ch * scale))
    final_output = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # 存入 cats/
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

    # 標記已存在的檔案，避免重複處理
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
                # 等待檔案完整寫入
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
