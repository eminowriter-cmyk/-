# -*- coding: utf-8 -*-
"""
貓咪互動樂園 - 攝影機實體畫貓去背拍照系統 (Camera Scanner & Auto Remove Background)
適用環境：實體展覽現場、單機無網路、Webcam / USB 高清攝影機

功能特點：
1. 即時攝影機預覽畫面，按「空白鍵 (SPACE)」拍照並自動去背。
2. 自動過濾白紙/繪圖紙底色，產生透明背景 PNG。
3. 自動為手繪貓咪加上「手作白色裁切貼紙邊框 (Paper Cutout Outline)」，完美契合樂園拼貼風格。
4. 自動裁切至貓咪最小邊界，防止多餘空白佔用記憶體。
5. 自動存檔至 'cats/' 目錄，並即刻更新 'cats/manifest.json'，大螢幕立刻空投！

相依套件安裝：
pip install opencv-python pillow numpy
"""

import os
import cv2
import json
import time
import numpy as np
from datetime import datetime

# 設定輸出目錄
CATS_DIR = "cats"
if not os.path.exists(CATS_DIR):
    os.makedirs(CATS_DIR)

# 確保一啟動就存在 manifest.json
initial_manifest = os.path.join(CATS_DIR, "manifest.json")
if not os.path.exists(initial_manifest):
    with open(initial_manifest, "w", encoding="utf-8") as f:
        json.dump([], f)

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
    """
    紙張手繪去背演算法：
    1. 灰階化與高斯模糊去雜訊
    2. 自適應閥值 / 亮色檢測提取筆觸線條與色彩區域
    3. 生成透明 Alpha 通道
    4. 邊緣外擴生成手繪卡紙白色輪廓邊框 (Paper cutout sticker border)
    5. 自動裁切緊湊邊界
    """
    h, w = bgr_image.shape[:2]

    # 轉灰階
    gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)

    # 輕微中值模糊減少紙質雜訊
    blurred = cv2.medianBlur(gray, 5)

    # 自適應二值化 (尋找比紙張背景暗的筆觸/色彩)
    # 畫在白紙上的蠟筆/彩色筆線條都會比紙張暗
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 25, 8
    )

    # 同時檢測飽和度 (彩色筆觸即使較亮也能被保留)
    hsv = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2HSV)
    saturation = hsv[:, :, 1]
    color_mask = cv2.threshold(saturation, 35, 255, cv2.THRESH_BINARY)[1]

    # 合併線條遮罩與顏色遮罩
    combined_mask = cv2.bitwise_or(thresh, color_mask)

    # 形態學閉運算填補筆觸內部小孔洞
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    # 去除微小噪點
    kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel_small, iterations=1)

    # 尋找所有輪廓，保留面積合理的貓咪主體
    contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    # 過濾微小灰塵雜點
    valid_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 200]
    if not valid_contours:
        return None

    # 建立主體遮罩
    main_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(main_mask, valid_contours, -1, 255, thickness=cv2.FILLED)

    # 合併多個部分的外接矩形
    all_points = np.vstack(valid_contours)
    bx, by, bw, bh = cv2.boundingRect(all_points)

    # 手作白色紙偶裁切外框 (Dilation 擴張產生白邊)
    if add_sticker_border:
        border_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        sticker_mask = cv2.dilate(main_mask, border_kernel, iterations=1)
        border_area = cv2.subtract(sticker_mask, main_mask)

        # 建立 BGRA 影像
        bgra = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2BGRA)
        # 白色貼紙外框填入純白
        bgra[border_area > 0] = [255, 255, 255, 255]
        # 背景全透明
        bgra[sticker_mask == 0] = [0, 0, 0, 0]

        # 擴大裁切邊界
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

    # 開啟攝影機 (預設 0 為內建鏡頭或外接第一支 USB 鏡頭)
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ 無法開啟攝影機，請檢查 USB 連接或是否有其他軟體正在佔用鏡頭。")
        return

    # 嘗試設定 1080P 或 720P 解析度
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

        # 預覽畫面指引框
        display = frame.copy()
        h, w = display.shape[:2]

        # 繪製手繪對齊框
        box_w, box_h = int(w * 0.65), int(h * 0.75)
        x1 = (w - box_w) // 2
        y1 = (h - box_h) // 2
        x2, y2 = x1 + box_w, y1 + box_h
        cv2.rectangle(display, (x1, y1), (x2, y2), (70, 200, 100), 2)

        # 提示文字
        cv2.putText(
            display, "Place cat drawing inside box & Press [SPACE] to Scan",
            (x1 + 10, y1 - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (70, 200, 100), 2
        )

        cv2.imshow("Cat Drawing Scanner", display)

        key = cv2.waitKey(1) & 0xFF
        if key == ord(' '):  # 按空白鍵拍照
            print("📸 正在拍照並處理去背中...")
            # 擷取對齊框範圍
            crop_source = frame[y1:y2, x1:x2]

            transparent_cat = remove_paper_background(crop_source, add_sticker_border=True)
            if transparent_cat is not None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"cat_{timestamp}_{cat_counter:03d}.png"
                output_path = os.path.join(CATS_DIR, filename)

                cv2.imwrite(output_path, transparent_cat)
                print(f"🎉 貓咪已去背存檔：{output_path}")

                # 更新清單
                update_manifest()
                cat_counter += 1

                # 閃爍提示拍照成功
                flash = np.full_like(display, 255)
                cv2.imshow("Cat Drawing Scanner", flash)
                cv2.waitKey(150)
            else:
                print("⚠️ 未檢測到明顯的手繪線條，請確認畫作是否放入綠框內且光線充足。")

        elif key == ord('q') or key == 27:  # Q 鍵或 ESC
            print("👋 程式已退出。")
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_camera_scanner()
