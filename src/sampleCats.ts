/**
 * Procedural Hand-drawn Crayon Cat Generator
 * Produces transparent PNGs with crayon texture & paper cutout borders
 */

export interface SampleCatTemplate {
  name: string;
  bodyColor: string;
  bellyColor?: string;
  stripeColor?: string;
  patchColor?: string;
  eyeColor: string;
  noseColor: string;
  earInnerColor: string;
  collarColor?: string;
  features?: string;
}

const TEMPLATES: SampleCatTemplate[] = [
  {
    name: '橘子虎斑貓',
    bodyColor: '#f79f4a',
    bellyColor: '#fde5b4',
    stripeColor: '#d66a1a',
    eyeColor: '#2b8a3e',
    noseColor: '#f08080',
    earInnerColor: '#ffb6c1',
    collarColor: '#e03131',
    features: 'stripes'
  },
  {
    name: '三花幸運貓',
    bodyColor: '#fff9ea',
    patchColor: '#343a40',
    stripeColor: '#d97706',
    eyeColor: '#d97706',
    noseColor: '#f08080',
    earInnerColor: '#ffc9c9',
    features: 'calico'
  },
  {
    name: '紳士賓士貓',
    bodyColor: '#212529',
    bellyColor: '#ffffff',
    eyeColor: '#94d82d',
    noseColor: '#f08080',
    earInnerColor: '#e9ecef',
    collarColor: '#1971c2',
    features: 'tuxedo'
  },
  {
    name: '灰條紋摺耳貓',
    bodyColor: '#adb5bd',
    bellyColor: '#f8f9fa',
    stripeColor: '#495057',
    eyeColor: '#1098ad',
    noseColor: '#f08080',
    earInnerColor: '#ffa8a8',
    features: 'stripes'
  },
  {
    name: '焦糖暹羅貓',
    bodyColor: '#fef3c7',
    patchColor: '#78350f',
    eyeColor: '#228be6',
    noseColor: '#451a03',
    earInnerColor: '#92400e',
    features: 'siamese'
  },
  {
    name: '棉花糖白貓',
    bodyColor: '#ffffff',
    bellyColor: '#fff5f5',
    eyeColor: '#fab005',
    noseColor: '#ff8787',
    earInnerColor: '#ffc9c9',
    collarColor: '#20c997',
    features: 'white'
  }
];

// Helper to simulate wobbly hand-drawn crayon strokes
function drawCrayonBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fillColor: string,
  roughness: number = 3
) {
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  const steps = 36;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const rOffset = (Math.random() - 0.5) * roughness * 2;
    const x = cx + Math.cos(angle) * (rx + rOffset);
    const y = cy + Math.sin(angle) * (ry + rOffset);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Add crayon texture dots
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let j = 0; j < 30; j++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 0.8;
    const px = cx + Math.cos(angle) * rx * dist;
    const py = cy + Math.sin(angle) * ry * dist;
    ctx.fillRect(px, py, 2, 2);
  }
  ctx.restore();
}

function drawCrayonStroke(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number = 4
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 3;
  const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 3;
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(midX, midY, x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function generateCrayonCatDataUrl(templateIndex?: number): { name: string; dataUrl: string } {
  const index = templateIndex !== undefined ? templateIndex % TEMPLATES.length : Math.floor(Math.random() * TEMPLATES.length);
  const tpl = TEMPLATES[index];

  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 240, 240);

  // Center coordinate
  const cx = 120;
  const cy = 135;

  // 1. Draw Tail (Curled paper craft tail)
  ctx.save();
  ctx.strokeStyle = tpl.bodyColor;
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + 45, cy + 30);
  ctx.bezierCurveTo(cx + 85, cy + 20, cx + 90, cy - 40, cx + 60, cy - 50);
  ctx.stroke();

  // Tail tip stripe or patch
  if (tpl.stripeColor) {
    ctx.strokeStyle = tpl.stripeColor;
    ctx.lineWidth = 14;
    ctx.stroke();
  }
  ctx.restore();

  // 2. Draw Body
  drawCrayonBlob(ctx, cx, cy + 15, 55, 45, tpl.bodyColor, 4);

  // Belly / chest
  if (tpl.bellyColor) {
    drawCrayonBlob(ctx, cx - 10, cy + 20, 32, 28, tpl.bellyColor, 3);
  }

  // Stripes / Patches on body
  if (tpl.features === 'stripes' && tpl.stripeColor) {
    drawCrayonStroke(ctx, cx + 25, cy - 5, cx + 45, cy + 5, tpl.stripeColor, 6);
    drawCrayonStroke(ctx, cx + 20, cy + 15, cx + 42, cy + 25, tpl.stripeColor, 6);
    drawCrayonStroke(ctx, cx + 15, cy + 32, cx + 38, cy + 40, tpl.stripeColor, 6);
  } else if (tpl.features === 'calico') {
    drawCrayonBlob(ctx, cx + 25, cy + 10, 22, 18, '#d97706', 3);
    drawCrayonBlob(ctx, cx - 25, cy + 30, 18, 14, '#343a40', 3);
  }

  // 3. Draw Paws (Hand-drawn paper cutout paws)
  drawCrayonBlob(ctx, cx - 35, cy + 52, 14, 10, tpl.bellyColor || tpl.bodyColor, 2);
  drawCrayonBlob(ctx, cx - 5, cy + 54, 14, 10, tpl.bellyColor || tpl.bodyColor, 2);
  drawCrayonBlob(ctx, cx + 25, cy + 50, 14, 10, tpl.bellyColor || tpl.bodyColor, 2);

  // 4. Draw Head
  const headY = cy - 42;
  drawCrayonBlob(ctx, cx, headY, 46, 38, tpl.bodyColor, 3);

  // 5. Ears
  // Left Ear
  ctx.save();
  ctx.fillStyle = tpl.bodyColor;
  ctx.beginPath();
  ctx.moveTo(cx - 38, headY - 15);
  ctx.lineTo(cx - 44, headY - 55);
  ctx.lineTo(cx - 15, headY - 32);
  ctx.closePath();
  ctx.fill();

  // Inner Left Ear
  ctx.fillStyle = tpl.earInnerColor;
  ctx.beginPath();
  ctx.moveTo(cx - 34, headY - 18);
  ctx.lineTo(cx - 39, headY - 45);
  ctx.lineTo(cx - 20, headY - 30);
  ctx.closePath();
  ctx.fill();

  // Right Ear
  ctx.fillStyle = tpl.bodyColor;
  ctx.beginPath();
  ctx.moveTo(cx + 15, headY - 32);
  ctx.lineTo(cx + 44, headY - 55);
  ctx.lineTo(cx + 38, headY - 15);
  ctx.closePath();
  ctx.fill();

  // Inner Right Ear
  ctx.fillStyle = tpl.earInnerColor;
  ctx.beginPath();
  ctx.moveTo(cx + 20, headY - 30);
  ctx.lineTo(cx + 39, headY - 45);
  ctx.lineTo(cx + 34, headY - 18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Head stripes or face mask
  if (tpl.features === 'stripes' && tpl.stripeColor) {
    drawCrayonStroke(ctx, cx - 12, headY - 32, cx - 12, headY - 20, tpl.stripeColor, 4);
    drawCrayonStroke(ctx, cx, headY - 34, cx, headY - 18, tpl.stripeColor, 4);
    drawCrayonStroke(ctx, cx + 12, headY - 32, cx + 12, headY - 20, tpl.stripeColor, 4);
  } else if (tpl.features === 'siamese' && tpl.patchColor) {
    drawCrayonBlob(ctx, cx, headY - 5, 24, 20, tpl.patchColor, 3);
  } else if (tpl.features === 'calico') {
    drawCrayonBlob(ctx, cx - 22, headY - 25, 18, 16, '#343a40', 3);
    drawCrayonBlob(ctx, cx + 22, headY - 20, 16, 14, '#d97706', 3);
  }

  // 6. Eyes (Big cute expressive crayon eyes)
  // Eye whites/base
  drawCrayonBlob(ctx, cx - 18, headY - 8, 9, 10, tpl.eyeColor, 2);
  drawCrayonBlob(ctx, cx + 18, headY - 8, 9, 10, tpl.eyeColor, 2);

  // Pupils
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(cx - 18, headY - 8, 5, 0, Math.PI * 2);
  ctx.arc(cx + 18, headY - 8, 5, 0, Math.PI * 2);
  ctx.fill();

  // Catchlight sparkle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 20, headY - 11, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 16, headY - 11, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 7. Nose & Mouth
  ctx.fillStyle = tpl.noseColor;
  ctx.beginPath();
  ctx.moveTo(cx, headY + 3);
  ctx.lineTo(cx - 4, headY - 1);
  ctx.lineTo(cx + 4, headY - 1);
  ctx.closePath();
  ctx.fill();

  // Mouth cute 'w' shape
  ctx.strokeStyle = '#5a3d28';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx - 5, headY + 7, 5, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 5, headY + 7, 5, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Whiskers (Crayon hand drawn lines)
  ctx.strokeStyle = '#5c4033';
  ctx.lineWidth = 2.5;
  drawCrayonStroke(ctx, cx - 22, headY + 2, cx - 55, headY - 4, '#5c4033', 2);
  drawCrayonStroke(ctx, cx - 22, headY + 7, cx - 56, headY + 8, '#5c4033', 2);
  drawCrayonStroke(ctx, cx - 20, headY + 12, cx - 52, headY + 20, '#5c4033', 2);

  drawCrayonStroke(ctx, cx + 22, headY + 2, cx + 55, headY - 4, '#5c4033', 2);
  drawCrayonStroke(ctx, cx + 22, headY + 7, cx + 56, headY + 8, '#5c4033', 2);
  drawCrayonStroke(ctx, cx + 20, headY + 12, cx + 52, headY + 20, '#5c4033', 2);

  // Cute pink cheeks
  ctx.fillStyle = 'rgba(255, 130, 160, 0.45)';
  ctx.beginPath();
  ctx.arc(cx - 28, headY + 6, 8, 0, Math.PI * 2);
  ctx.arc(cx + 28, headY + 6, 8, 0, Math.PI * 2);
  ctx.fill();

  // Collar with bell
  if (tpl.collarColor) {
    ctx.strokeStyle = tpl.collarColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, headY + 22, 28, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();

    // Little gold paper bell
    ctx.fillStyle = '#fcc419';
    ctx.beginPath();
    ctx.arc(cx, headY + 36, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e67700';
    ctx.beginPath();
    ctx.arc(cx, headY + 37, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Paper edge cutout rim (to give that authentic torn cardstock outline)
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(70, 45, 25, 0.25)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.stroke();
  ctx.restore();

  return {
    name: tpl.name,
    dataUrl: canvas.toDataURL('image/png')
  };
}

export function getAllInitialCats(): Array<{ name: string; dataUrl: string }> {
  return TEMPLATES.map((_, i) => generateCrayonCatDataUrl(i));
}
