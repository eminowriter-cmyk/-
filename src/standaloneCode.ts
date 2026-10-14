/**
 * Generates a completely self-contained single index.html file
 * Containing all HTML, CSS, JavaScript, Web Audio synthesizer, procedural Crayon textures,
 * 2D paper puppetry physics loop, Left Street vs Right Shelter split background,
 * LIMIT = 25 Crisis Mode with warning frame & board, 10-second educational carousel billboard,
 * and click/button adoption mechanics.
 * Can run offline via `python -m http.server 8000` or direct file open!
 */

export function getStandaloneHtmlCode(): string {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>貓咪互動樂園 - 蠟筆剪貼手作展覽系統</title>
  <style>
    /* 溫馨手作蠟筆與剪貼拼貼風 CSS */
    * {
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #f4ecd8;
      font-family: 'Zen Maru Gothic', 'Comic Sans MS', 'Chalkboard SE', 'PingFang TC', sans-serif;
      color: #4a3728;
      transition: background 0.7s;
    }

    /* 左右分區容器 */
    #world {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
    }

    /* 左半邊：流浪貓街頭 (Stray Cat Street) */
    .street-zone {
      position: relative;
      width: 50%;
      height: 100%;
      background: linear-gradient(180deg, #d8d3c5 0%, #ecdcb5 100%);
      border-right: 3px dashed rgba(184, 148, 100, 0.6);
      overflow: hidden;
      transition: background 0.7s;
    }

    /* 蠟筆紅磚牆 */
    .brick-wall {
      position: absolute;
      bottom: 80px;
      left: 0;
      width: 100%;
      height: 160px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 8px;
      opacity: 0.8;
      pointer-events: none;
    }
    .brick-row {
      display: flex;
      gap: 6px;
      height: 24px;
    }
    .brick {
      flex: 1;
      background: #ba5d46;
      border-radius: 2px;
      border-bottom: 2px solid #8c3f2d;
      border-right: 2px solid #8c3f2d;
      box-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }
    .brick:nth-child(2n) { background: #c96a53; }
    .brick:nth-child(3n) { background: #a64b35; }

    /* 電線桿與電線 */
    .utility-pole {
      position: absolute;
      top: 0;
      left: 80px;
      width: 14px;
      height: 300px;
      background: #7c5332;
      border-right: 2px solid #5c3a21;
      box-shadow: 4px 4px 10px rgba(0,0,0,0.15);
      pointer-events: none;
    }
    .pole-cross {
      position: absolute;
      top: 50px;
      left: -24px;
      width: 62px;
      height: 12px;
      background: #96663f;
      border: 1px solid #5c3a21;
    }

    /* 紙箱堆 */
    .cardboard-boxes {
      position: absolute;
      bottom: 95px;
      left: 30px;
      display: flex;
      align-items: flex-end;
      gap: 12px;
      pointer-events: none;
    }
    .box-1 {
      width: 90px;
      height: 65px;
      background: repeating-linear-gradient(90deg, #d7b98e 0px, #d7b98e 6px, #c4a377 6px, #c4a377 12px);
      border: 2px solid #a37951;
      border-radius: 2px;
      padding: 4px;
      box-shadow: 3px 4px 8px rgba(0,0,0,0.12);
      transform: rotate(-3deg);
    }
    .box-2 {
      width: 75px;
      height: 52px;
      background: #d4b383;
      border: 2px solid #a37951;
      border-radius: 2px;
      padding: 4px;
      box-shadow: 3px 4px 8px rgba(0,0,0,0.12);
      transform: rotate(4deg);
    }

    /* 街頭石礫地面 */
    .street-ground-back {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 110px;
      background: #8a7a6b;
      clip-path: polygon(0 25%, 5% 15%, 10% 25%, 15% 18%, 20% 26%, 25% 16%, 30% 25%, 35% 17%, 40% 24%, 45% 16%, 50% 26%, 55% 18%, 60% 24%, 65% 17%, 70% 25%, 75% 16%, 80% 25%, 85% 17%, 90% 26%, 95% 18%, 100% 25%, 100% 100%, 0 100%);
      pointer-events: none;
    }
    .street-ground-front {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 80px;
      background: #6b5d4f;
      clip-path: polygon(0 20%, 3% 26%, 8% 16%, 14% 25%, 20% 17%, 26% 28%, 32% 16%, 38% 27%, 44% 18%, 50% 26%, 56% 16%, 62% 28%, 68% 18%, 74% 27%, 80% 16%, 86% 26%, 92% 17%, 97% 25%, 100% 18%, 100% 100%, 0 100%);
      pointer-events: none;
    }

    /* 右半邊：流浪動物收容所 (Animal Shelter) */
    .shelter-zone {
      position: relative;
      width: 50%;
      height: 100%;
      background: radial-gradient(circle at 70% 30%, #fff7f0 0%, #faeed1 60%, #ecdcb5 100%);
      overflow: hidden;
      transition: background 0.7s;
    }

    /* 瓦楞紙柵欄 */
    .fence-container {
      position: absolute;
      bottom: 90px;
      right: 20px;
      display: flex;
      align-items: flex-end;
      gap: 10px;
      pointer-events: none;
      opacity: 0.85;
    }
    .fence-post {
      width: 28px;
      height: 100px;
      background: #d7b98e;
      border: 2px solid #a37951;
      border-radius: 6px 6px 0 0;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
    }
    .fence-post:nth-child(even) { height: 85px; }

    /* 貓砂盆與貓碗 */
    .shelter-props {
      position: absolute;
      bottom: 95px;
      right: 180px;
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: none;
    }
    .litter-box {
      width: 90px;
      height: 38px;
      background: #e7f5ff;
      border: 2px solid #74c0fc;
      border-radius: 6px;
      box-shadow: 2px 3px 6px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      color: #1c7ed6;
    }

    /* 收容所綠意草地 */
    .shelter-lawn-back {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 110px;
      background: #82c91e;
      clip-path: polygon(0 25%, 5% 15%, 10% 25%, 15% 18%, 20% 26%, 25% 16%, 30% 25%, 35% 17%, 40% 24%, 45% 16%, 50% 26%, 55% 18%, 60% 24%, 65% 17%, 70% 25%, 75% 16%, 80% 25%, 85% 17%, 90% 26%, 95% 18%, 100% 25%, 100% 100%, 0 100%);
      pointer-events: none;
      transition: background-color 0.7s;
    }
    .shelter-lawn-front {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 80px;
      background: #94d82d;
      clip-path: polygon(0 20%, 3% 26%, 8% 16%, 14% 25%, 20% 17%, 26% 28%, 32% 16%, 38% 27%, 44% 18%, 50% 26%, 56% 16%, 62% 28%, 68% 18%, 74% 27%, 80% 16%, 86% 26%, 92% 17%, 97% 25%, 100% 18%, 100% 100%, 0 100%);
      pointer-events: none;
      transition: background-color 0.7s;
    }

    /* 頂部標題 */
    .top-header {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      z-index: 30;
      pointer-events: none;
    }
    .title-banner {
      background: #fffdf5;
      border: 3px dashed #8b5a2b;
      padding: 6px 24px;
      border-radius: 30px;
      box-shadow: 0 6px 16px rgba(70,45,20,0.18);
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
    }
    .title-banner h1 {
      font-size: 22px;
      font-weight: 900;
      color: #5c3a21;
      letter-spacing: 1px;
    }

    /* 紙膠帶風格進度條 (目前貓咪數量 / 25) */
    .progress-tape {
      background: #fffcee;
      border: 2px solid #e0c89e;
      border-radius: 20px;
      padding: 4px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: bold;
      color: #8c5025;
      box-shadow: 0 3px 8px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }
    .progress-bar-bg {
      width: 140px;
      height: 10px;
      background: #e9ecef;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #ced4da;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #51cf66, #40c057);
      width: 0%;
      transition: width 0.3s, background 0.3s;
      border-radius: 10px;
    }

    /* 超載危機警告框 (Crisis Mode) */
    @keyframes crisisPulse {
      0%, 100% {
        box-shadow: inset 0 0 35px rgba(220, 38, 38, 0.55), 0 0 25px rgba(239, 68, 68, 0.4);
        border-color: rgba(220, 38, 38, 0.85);
      }
      50% {
        box-shadow: inset 0 0 70px rgba(220, 38, 38, 0.8), 0 0 40px rgba(239, 68, 68, 0.7);
        border-color: rgba(185, 28, 28, 1);
      }
    }
    .crisis-mode {
      border: 8px dashed #e03131 !important;
      animation: crisisPulse 1.8s infinite ease-in-out !important;
    }

    /* 中央手作警告牌 */
    #crisisAlertBoard {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 245, 245, 0.96);
      border: 4px dashed #e03131;
      border-radius: 18px;
      padding: 24px 32px;
      max-width: 540px;
      text-align: center;
      box-shadow: 0 12px 30px rgba(180, 20, 20, 0.35);
      z-index: 35;
      display: none;
      pointer-events: none;
    }
    #crisisAlertBoard h2 {
      font-size: 20px;
      font-weight: 900;
      color: #c92a2a;
      margin-bottom: 8px;
    }
    #crisisAlertBoard p {
      font-size: 14px;
      font-weight: bold;
      color: #862e2e;
      line-height: 1.6;
      margin-bottom: 12px;
    }

    /* 科普衛教便利貼 (10秒自動輪播) */
    .edu-sticky-note {
      position: absolute;
      bottom: 24px;
      left: 24px;
      background: #fff9db;
      border: 2px solid #d9ba82;
      border-radius: 6px;
      padding: 14px 18px;
      max-width: 320px;
      box-shadow: 3px 5px 15px rgba(80, 50, 20, 0.18);
      z-index: 30;
      transform: rotate(1deg);
      transition: transform 0.2s, background 0.4s;
    }
    .edu-sticky-note:hover {
      transform: rotate(0deg) scale(1.02);
    }
    .sticky-tape {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%) rotate(-2deg);
      width: 90px;
      height: 20px;
      background: repeating-linear-gradient(-45deg, rgba(168, 230, 207, 0.8), rgba(168, 230, 207, 0.8) 8px, rgba(220, 247, 237, 0.8) 8px, rgba(220, 247, 237, 0.8) 16px);
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .edu-content {
      font-size: 13px;
      font-weight: bold;
      color: #4a2e18;
      line-height: 1.5;
      min-height: 40px;
      margin: 8px 0;
    }
    .btn-adopt {
      width: 100%;
      padding: 8px 12px;
      background: #ff6b81;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(255, 107, 129, 0.35);
      transition: all 0.2s;
    }
    .btn-adopt:hover {
      background: #fa5252;
      transform: translateY(-1px);
    }

    /* 展覽控制懸浮條 */
    #toolbar {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: #fffdf7;
      border: 3px solid #c5a059;
      border-radius: 16px;
      padding: 8px 14px;
      box-shadow: 0 6px 16px rgba(80, 50, 20, 0.18);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 40;
    }
    .btn-action {
      background: #f79f4a;
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .btn-action:hover { background: #f58f33; }
    .btn-action:active { transform: scale(0.95); }
    .btn-adopt-bar { background: #e03131; }
    .btn-adopt-bar:hover { background: #c92a2a; }
  </style>
</head>
<body id="appBody">
  <!-- 左右分區背景 -->
  <div id="world">
    <!-- 左半邊：流浪貓街頭 -->
    <div class="street-zone" id="streetZone">
      <div style="position: absolute; top: 16px; left: 16px; background: #fffcee; border: 2px solid #b89464; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 900; color: #6d4c28; transform: rotate(-2deg); box-shadow: 2px 2px 6px rgba(0,0,0,0.1);">
        🐾 流浪貓街頭 · Stray Cat Street
      </div>
      <div class="utility-pole">
        <div class="pole-cross"></div>
      </div>
      <div class="brick-wall">
        <div class="brick-row"><div class="brick"></div><div class="brick"></div><div class="brick"></div><div class="brick"></div><div class="brick"></div></div>
        <div class="brick-row" style="transform: translateX(-15px);"><div class="brick"></div><div class="brick"></div><div class="brick"></div><div class="brick"></div><div class="brick"></div></div>
        <div class="brick-row"><div class="brick"></div><div class="brick"></div><div class="brick"></div><div class="brick"></div><div class="brick"></div></div>
        <div class="brick-row" style="transform: translateX(-15px);"><div class="brick"></div><div class="brick"></div><div class="brick"></div><div class="brick"></div><div class="brick"></div></div>
      </div>
      <div class="cardboard-boxes">
        <div class="box-1"><div style="font-size: 9px; font-weight: 900; color: #5c3a21; background: #ffffffa0; padding: 2px; border-radius: 2px;">📦 避雨紙箱</div></div>
        <div class="box-2"><div style="font-size: 9px; font-weight: 900; color: #7a4e2d;">🐟 愛心遮風</div></div>
      </div>
      <div class="street-ground-back"></div>
      <div class="street-ground-front"></div>
    </div>

    <!-- 右半邊：流浪動物收容所 -->
    <div class="shelter-zone" id="shelterZone">
      <div style="position: absolute; top: 16px; right: 16px; background: #fffdf0; border: 2px solid #d9480f; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 900; color: #d9480f; transform: rotate(2deg); box-shadow: 2px 2px 6px rgba(0,0,0,0.1);">
        🏡 愛心收容所 · Animal Shelter
      </div>
      <div class="fence-container">
        <div class="fence-post"></div><div class="fence-post"></div><div class="fence-post"></div><div class="fence-post"></div><div class="fence-post"></div><div class="fence-post"></div>
      </div>
      <div class="shelter-props">
        <div class="litter-box">✨ 乾淨貓砂盆</div>
        <div style="width: 32px; height: 22px; background: #ffe3e3; border: 2px solid #ff8787; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">🐟</div>
      </div>
      <div class="shelter-lawn-back" id="lawnBack"></div>
      <div class="shelter-lawn-front" id="lawnFront"></div>
    </div>
  </div>

  <!-- 頂部紙膠帶風格進度條與計數器 -->
  <div class="top-header">
    <div class="title-banner">
      <span>🐾</span>
      <h1>貓咪互動樂園 · 動保教育展</h1>
      <span>🐾</span>
    </div>
    <div class="progress-tape" id="progressTape">
      <span id="crisisLabel" style="display:none; color: #e03131;">🚨 超載警報！</span>
      <span>目前貓咪數量:</span>
      <span id="catCountText" style="font-size: 16px; color: #d9480f;">0</span>
      <span style="font-size: 11px; color: #a37951;">/ 25 (容納上限)</span>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="progressBarFill"></div>
      </div>
      <span id="percentText" style="font-size: 11px; color: #868e96;">0%</span>
    </div>
  </div>

  <!-- 中央手作超載警告牌 -->
  <div id="crisisAlertBoard">
    <h2>🚨 空間不夠了！流浪貓的困境 🚨</h2>
    <p>當數量過多，收容所與街頭將面臨資源耗盡與生存空間不足。<br>我們需要從源頭解決問題！</p>
    <div style="background: #ffe3e3; border: 1px solid #ffc9c9; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; color: #a61e4d;">
      💡 請點擊任意貓咪或「愛心認養」帶走浪浪，即可解除危機！
    </div>
  </div>

  <!-- 科普衛教輪播看板 -->
  <div class="edu-sticky-note" id="eduNote">
    <div class="sticky-tape"></div>
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5c290; padding-bottom: 4px;">
      <span id="eduTag" style="font-size: 11px; font-weight: 900; color: #8c5025;">✂️ 源頭減量 · TNVR</span>
      <span id="eduTimer" style="font-size: 10px; font-weight: bold; color: #b07d4b; background: #ffffffa0; padding: 1px 6px; border-radius: 10px;">10s</span>
    </div>
    <div class="edu-content" id="eduContent">
      推廣 TNVR：捕捉、絕育、打疫苗、放回，從源頭控制數量！
    </div>
    <button class="btn-adopt" id="btnAdoptSticky">
      💖 點擊認養帶走一隻浪浪 (-1)
    </button>
  </div>

  <!-- 2D 畫布 -->
  <canvas id="canvas" style="position: absolute; inset: 0; z-index: 20; cursor: pointer;"></canvas>

  <!-- 展覽控制懸浮條 -->
  <div id="toolbar">
    <button class="btn-action btn-adopt-bar" id="btnAdopt">💖 愛心認養 (-1)</button>
    <button class="btn-action" id="btnSpawn">+1 模擬新貓</button>
    <button class="btn-action" id="btnSpawnBatch" style="background: #e8590c;">+5 測試超載</button>
    <button class="btn-action" id="btnSound" style="background: #e7f5ff; color: #1c7ed6; border: 1px solid #a5d8ff;">🔊 音效</button>
    <button class="btn-action" id="btnFullscreen" style="background: #f4ebd9; color: #5c3a21;">⛶ 全螢幕 (F)</button>
    <button class="btn-action" id="btnClear" style="background: #fff5f5; color: #fa5252;">清空</button>
  </div>

  <script>
    // --- 1. 動保教育輪播看板資料 (每 10 秒自動輪播) ---
    const EDU_TIPS = [
      {
        tag: '✂️ 源頭減量 · TNVR',
        content: '推廣 TNVR：捕捉、絕育、打疫苗、放回，從源頭控制數量！',
        bg: '#fff9db'
      },
      {
        tag: '🏡 給浪浪一個家',
        content: '認養代替購買：給收容所與街頭的浪浪一個溫暖的家。',
        bg: '#fff0f6'
      },
      {
        tag: '🥣 友善社區守則',
        content: '乾淨餵食守則：餵食請用容器，吃完要收拾，不留殘渣破壞環境。',
        bg: '#f8f9fa'
      },
      {
        tag: '🐾 尊重動物習性',
        content: '保持適當距離：遇見不熟悉的街貓請勿強行觸摸，避免貓咪緊張。',
        bg: '#f1f3f5'
      },
      {
        tag: '📞 緊急救援通報',
        content: '尋求專業協助：遇到受傷浪浪，請通報 1959 動保專線。',
        bg: '#fff4e6'
      }
    ];

    let currentEduIndex = 0;
    let eduSeconds = 10;
    const eduTagEl = document.getElementById('eduTag');
    const eduContentEl = document.getElementById('eduContent');
    const eduTimerEl = document.getElementById('eduTimer');
    const eduNoteEl = document.getElementById('eduNote');

    setInterval(() => {
      eduSeconds--;
      if (eduSeconds <= 0) {
        currentEduIndex = (currentEduIndex + 1) % EDU_TIPS.length;
        eduSeconds = 10;
        const tip = EDU_TIPS[currentEduIndex];
        eduTagEl.textContent = tip.tag;
        eduContentEl.textContent = tip.content;
        eduNoteEl.style.backgroundColor = tip.bg;
      }
      eduTimerEl.textContent = eduSeconds + 's';
    }, 1000);

    // --- 2. 輕量 Web Audio API 音效合成器 (100% 離線) ---
    class SoundEngine {
      constructor() {
        this.ctx = null;
        this.enabled = true;
      }
      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }
      playMeow() {
        if (!this.enabled) return;
        try {
          this.init();
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(450, t);
          osc.frequency.exponentialRampToValueAtTime(750, t + 0.12);
          osc.frequency.exponentialRampToValueAtTime(520, t + 0.35);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.42);
        } catch(e) {}
      }
      playBoing() {
        if (!this.enabled) return;
        try {
          this.init();
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(180, t);
          osc.frequency.exponentialRampToValueAtTime(480, t + 0.18);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.24);
        } catch(e) {}
      }
      playAdoptChime() {
        if (!this.enabled) return;
        try {
          this.init();
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + idx * 0.09);
            gain.gain.setValueAtTime(0.001, t + idx * 0.09);
            gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.09 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + idx * 0.09);
            osc.stop(t + idx * 0.09 + 0.48);
          });
        } catch(e) {}
      }
    }
    const sound = new SoundEngine();

    // --- 3. 手繪蠟筆貓產生器 (Canvas 產出透明 PNG) ---
    function generateCrayonCatData(color, bellyColor) {
      const c = document.createElement('canvas');
      c.width = 220; c.height = 220;
      const ctx = c.getContext('2d');
      const cx = 110, cy = 125;

      ctx.strokeStyle = color;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 40, cy + 25);
      ctx.bezierCurveTo(cx + 75, cy + 15, cx + 80, cy - 35, cx + 55, cy - 45);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 15, 50, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      if (bellyColor) {
        ctx.fillStyle = bellyColor;
        ctx.beginPath();
        ctx.ellipse(cx - 10, cy + 20, 28, 24, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = bellyColor || color;
      for (const px of [-30, -5, 25]) {
        ctx.beginPath();
        ctx.arc(cx + px, cy + 50, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      const hy = cy - 40;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, hy, 42, 35, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx - 35, hy - 15); ctx.lineTo(cx - 40, hy - 50); ctx.lineTo(cx - 15, hy - 30);
      ctx.moveTo(cx + 15, hy - 30); ctx.lineTo(cx + 40, hy - 50); ctx.lineTo(cx + 35, hy - 15);
      ctx.fill();

      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(cx - 16, hy - 8, 5, 0, Math.PI * 2);
      ctx.arc(cx + 16, hy - 8, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff8787';
      ctx.beginPath();
      ctx.arc(cx, hy + 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = 'destination-over';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.stroke();

      return c.toDataURL('image/png');
    }

    const DEFAULT_CATS = [
      generateCrayonCatData('#f79f4a', '#fde5b4'),
      generateCrayonCatData('#212529', '#ffffff'),
      generateCrayonCatData('#adb5bd', '#f8f9fa'),
      generateCrayonCatData('#d9480f', '#ffe8cc'),
      generateCrayonCatData('#868e96', '#f1f3f5')
    ];

    // --- 4. 2D 物理與超載危機系統 (LIMIT = 25) ---
    const LIMIT = 25;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    let groundY = height - 90;
    const cats = [];
    let isCrisisMode = false;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      groundY = height - 90;
    }
    window.addEventListener('resize', resize);
    resize();

    // 更新計數器與危機狀態
    function updateCrisisState() {
      const activeCount = cats.filter(c => c.state !== 'ADOPTED' && c.state !== 'DEPARTING').length;
      document.getElementById('catCountText').textContent = activeCount;

      const pct = Math.min(100, Math.round((activeCount / LIMIT) * 100));
      document.getElementById('percentText').textContent = pct + '%';
      
      const barFill = document.getElementById('progressBarFill');
      barFill.style.width = pct + '%';
      if (activeCount >= LIMIT) {
        barFill.style.background = 'linear-gradient(90deg, #fa5252, #c92a2a)';
      } else if (activeCount >= 18) {
        barFill.style.background = 'linear-gradient(90deg, #ffd43b, #f76707)';
      } else {
        barFill.style.background = 'linear-gradient(90deg, #51cf66, #40c057)';
      }

      const shouldCrisis = activeCount >= LIMIT;
      if (shouldCrisis !== isCrisisMode) {
        isCrisisMode = shouldCrisis;
        const appBody = document.getElementById('appBody');
        const alertBoard = document.getElementById('crisisAlertBoard');
        const crisisLabel = document.getElementById('crisisLabel');

        if (isCrisisMode) {
          appBody.classList.add('crisis-mode');
          alertBoard.style.display = 'block';
          crisisLabel.style.display = 'inline';
        } else {
          appBody.classList.remove('crisis-mode');
          alertBoard.style.display = 'none';
          crisisLabel.style.display = 'none';
        }
      }
    }

    function spawnCat(imgSrc, name = '手繪貓咪') {
      const img = new Image();
      img.src = imgSrc;
      const x = Math.random() * (width - 240) + 120;
      const cat = {
        img,
        name,
        x,
        y: -100,
        vx: (Math.random() - 0.5) * 40,
        vy: 110,
        targetX: x,
        width: 100,
        height: 100,
        state: 'AIRDROP',
        flipX: Math.random() > 0.5,
        rotation: 0,
        squashX: 1,
        squashY: 1,
        walkCycle: 0,
        stateTimer: 0,
        alpha: 1,
        speech: '來囉~！🎈',
        speechTimer: 2.0,
        hearts: []
      };
      cats.push(cat);
      sound.playBoing();
      updateCrisisState();
    }

    // 認養移除一隻貓咪 (解除危機核心)
    function adoptCat(catToAdopt) {
      const target = catToAdopt || cats.find(c => c.state !== 'ADOPTED' && c.state !== 'DEPARTING');
      if (!target) return;

      target.state = 'ADOPTED';
      target.stateTimer = 0;
      target.vy = -160;
      target.vx = 40;
      target.speech = '我有新家了！謝謝你~ 💖🏠';
      target.speechTimer = 3.5;

      for (let h = 0; h < 6; h++) {
        target.hearts.push({
          x: target.x + (Math.random() - 0.5) * 50,
          y: target.y - 70 + (Math.random() - 0.5) * 30,
          vy: -60 - Math.random() * 50,
          alpha: 1
        });
      }

      sound.playAdoptChime();
      sound.playBoing();
      updateCrisisState();
    }

    // 點擊貓咪互動 / 認養
    canvas.addEventListener('click', (e) => {
      sound.init();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (let i = cats.length - 1; i >= 0; i--) {
        const c = cats[i];
        if (c.state === 'ADOPTED' || c.state === 'DEPARTING') continue;
        if (Math.hypot(mx - c.x, my - (c.y - c.height / 2)) < c.width / 2 + 15) {
          // 危機模式下點擊直接認養
          if (isCrisisMode) {
            adoptCat(c);
            return;
          }
          // 平時摸摸歡呼
          c.vy = -160;
          c.speech = '喵~ 摸摸我！💖';
          c.speechTimer = 2.2;
          sound.playMeow();
          sound.playBoing();
          return;
        }
      }
    });

    // 初始載入 5 隻可愛原住民
    DEFAULT_CATS.forEach((src, idx) => {
      setTimeout(() => spawnCat(src, '樂園浪浪 ' + (idx + 1)), idx * 500 + 200);
    });

    // 動畫主迴圈
    let lastTime = performance.now();
    function animate(time) {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (let i = cats.length - 1; i >= 0; i--) {
        const c = cats[i];
        c.stateTimer += dt;
        c.walkCycle += dt;
        if (c.speechTimer > 0) c.speechTimer -= dt;

        // 愛心粒子
        for (let h = c.hearts.length - 1; h >= 0; h--) {
          const heart = c.hearts[h];
          heart.y += heart.vy * dt;
          heart.alpha -= dt * 0.8;
          if (heart.alpha <= 0) c.hearts.splice(h, 1);
        }

        // 狀態機
        if (c.state === 'AIRDROP') {
          c.y += c.vy * dt;
          c.x += c.vx * dt;
          c.rotation = Math.sin(c.walkCycle * 4) * 0.15;
          if (c.y >= groundY - 10) {
            c.y = groundY - 10;
            c.state = 'WALK';
            c.targetX = Math.random() * (width - 200) + 100;
            sound.playBoing();
          }
        } else if (c.state === 'WALK') {
          const dx = c.targetX - c.x;
          c.flipX = dx > 0;
          // 超載危機模式下移動速度變慢 (32 vs 65) 表現擁擠感
          const speed = isCrisisMode ? 32 : 65;
          if (Math.abs(dx) > 10) {
            c.x += Math.sign(dx) * speed * dt;
            c.rotation = Math.sin(c.walkCycle * 8) * 0.1;
          } else {
            c.rotation = 0;
            if (c.stateTimer > 3.0) {
              c.stateTimer = 0;
              c.targetX = Math.random() * (width - 200) + 100;
            }
          }
        } else if (c.state === 'ADOPTED') {
          // 歡樂認養離場飛翔
          c.y += c.vy * dt;
          c.x += c.vx * dt;
          c.alpha -= dt * 0.38;
          c.rotation = Math.sin(c.walkCycle * 8) * 0.18;
          if (c.alpha <= 0.05 || c.y < -150) {
            c.img.src = '';
            cats.splice(i, 1);
            updateCrisisState();
            continue;
          }
        }

        // 繪製貓咪本體 (帶剪紙厚度陰影)
        ctx.save();
        ctx.globalAlpha = Math.max(0, c.alpha);
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        if (!c.flipX) ctx.scale(-1, 1);

        if (c.state === 'AIRDROP') {
          // 降落傘
          ctx.fillStyle = '#ff6b6b';
          ctx.beginPath();
          ctx.arc(0, -c.height - 20, 36, Math.PI, 0);
          ctx.fill();
        }

        if (c.img.complete) {
          ctx.drawImage(c.img, -c.width / 2, -c.height, c.width, c.height);
        }
        ctx.restore();

        // 繪製愛心
        for (const heart of c.hearts) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, heart.alpha);
          ctx.fillStyle = '#ff6b81';
          ctx.beginPath();
          ctx.arc(heart.x, heart.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 對話泡泡
        if (c.speech && c.speechTimer > 0) {
          ctx.save();
          ctx.font = 'bold 14px sans-serif';
          ctx.fillStyle = '#fffdf5';
          ctx.strokeStyle = '#b89464';
          ctx.lineWidth = 2;
          const tw = ctx.measureText(c.speech).width + 18;
          ctx.fillRect(c.x - tw / 2, c.y - c.height - 35, tw, 26);
          ctx.strokeRect(c.x - tw / 2, c.y - c.height - 35, tw, 26);
          ctx.fillStyle = '#5c3a21';
          ctx.textAlign = 'center';
          ctx.fillText(c.speech, c.x, c.y - c.height - 18);
          ctx.restore();
        }
      }

      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    // 本地 Python cats/ 資料夾輪詢
    const loadedFiles = new Set();
    async function pollLocalCats() {
      try {
        const res = await fetch('cats/manifest.json', { cache: 'no-store' });
        if (res.ok) {
          const files = await res.json();
          files.forEach(f => {
            if (!loadedFiles.has(f)) {
              loadedFiles.add(f);
              spawnCat('cats/' + f, f);
            }
          });
        }
      } catch (e) {}
    }
    setInterval(pollLocalCats, 3000);

    // 按鈕事件
    document.getElementById('btnAdopt').addEventListener('click', () => adoptCat());
    document.getElementById('btnAdoptSticky').addEventListener('click', () => adoptCat());

    document.getElementById('btnSpawn').addEventListener('click', () => {
      sound.init();
      const rCat = DEFAULT_CATS[Math.floor(Math.random() * DEFAULT_CATS.length)];
      spawnCat(rCat, '模擬新貓');
    });

    document.getElementById('btnSpawnBatch').addEventListener('click', () => {
      sound.init();
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const rCat = DEFAULT_CATS[Math.floor(Math.random() * DEFAULT_CATS.length)];
          spawnCat(rCat, '快速空投貓');
        }, i * 200);
      }
    });

    const btnSound = document.getElementById('btnSound');
    btnSound.addEventListener('click', () => {
      sound.enabled = !sound.enabled;
      btnSound.textContent = sound.enabled ? '🔊 音效: 開' : '🔇 音效: 關';
    });

    document.getElementById('btnClear').addEventListener('click', () => {
      cats.length = 0;
      updateCrisisState();
    });

    document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreen);
    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'h' || e.key === 'H') {
        const tb = document.getElementById('toolbar');
        tb.style.display = tb.style.display === 'none' ? 'flex' : 'none';
      }
    });
  </script>
</body>
</html>`;
}
