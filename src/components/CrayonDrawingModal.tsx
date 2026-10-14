import React, { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, Sparkles, X } from 'lucide-react';

interface CrayonDrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (dataUrl: string, catName: string) => void;
}

const CRAYON_PALETTE = [
  { name: '蠟筆黑', color: '#2b2b2b' },
  { name: '橘子黃', color: '#ff922b' },
  { name: '焦糖褐', color: '#8c5025' },
  { name: '暖粉紅', color: '#ff6b8b' },
  { name: '青草綠', color: '#51cf66' },
  { name: '晴空藍', color: '#339af0' },
  { name: '純白紙', color: '#ffffff' },
];

export const CrayonDrawingModal: React.FC<CrayonDrawingModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#ff922b');
  const [brushSize, setBrushSize] = useState<number>(10);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [catName, setCatName] = useState<string>('現場手繪小貓');
  const isDrawing = useRef<boolean>(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        initCanvas();
      }, 50);
    }
  }, [isOpen]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    lastPoint.current = getCanvasCoords(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getCanvasCoords(e);

    ctx.save();
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Crayon roughness texture
      const dist = Math.hypot(currentPoint.x - lastPoint.current.x, currentPoint.y - lastPoint.current.y);
      const steps = Math.max(1, Math.floor(dist / 2));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const px = lastPoint.current.x + (currentPoint.x - lastPoint.current.x) * t;
        const py = lastPoint.current.y + (currentPoint.y - lastPoint.current.y) * t;
        const wobbleX = px + (Math.random() - 0.5) * 2;
        const wobbleY = py + (Math.random() - 0.5) * 2;

        ctx.fillStyle = selectedColor;
        ctx.beginPath();
        ctx.arc(wobbleX, wobbleY, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Wax granule texture
        if (Math.random() < 0.3) {
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(wobbleX + (Math.random() - 0.5) * brushSize, wobbleY + (Math.random() - 0.5) * brushSize, 1.5, 1.5);
        }
      }
    }
    ctx.restore();

    lastPoint.current = currentPoint;
  };

  const endDraw = () => {
    isDrawing.current = false;
    lastPoint.current = null;
  };

  const handleFinish = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if user drew anything
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let hasPixels = false;
    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i] > 20) {
        hasPixels = true;
        break;
      }
    }

    if (!hasPixels) {
      alert('請先在畫布上畫一隻小貓咪再送出喔！🐾');
      return;
    }

    // Add white cutout paper edge to the user's drawing
    const outlineCanvas = document.createElement('canvas');
    outlineCanvas.width = canvas.width;
    outlineCanvas.height = canvas.height;
    const oCtx = outlineCanvas.getContext('2d')!;

    // Draw user artwork
    oCtx.drawImage(canvas, 0, 0);

    // Behind it: draw thickened white border to simulate cardstock cut edge
    oCtx.save();
    oCtx.globalCompositeOperation = 'destination-over';
    oCtx.shadowColor = 'rgba(70, 45, 25, 0.25)';
    oCtx.shadowBlur = 8;
    oCtx.shadowOffsetY = 4;
    oCtx.drawImage(canvas, 0, 0);
    oCtx.restore();

    const dataUrl = outlineCanvas.toDataURL('image/png');
    onComplete(dataUrl, catName || '手繪貓咪');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xl bg-[#fffdf7] border-4 border-[#d4b383] rounded-3xl p-6 shadow-2xl cardstock-shadow">
        {/* Top Washi Tape Decoration */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-8 washi-tape-pink rotate-1 rounded-sm shadow-md" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-dashed border-[#d4b383]/60 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🖍️</span>
            <h2 className="text-xl font-bold text-[#5c3a21]">現場手畫貓咪工作台</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#ebd5b3] text-[#7a4e2d] transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Cat Name Input */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-bold text-[#7a4e2d] whitespace-nowrap">貓咪名字：</label>
          <input
            type="text"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#fbf6ec] border-2 border-[#d4b383] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e89b4b]"
            placeholder="為你的貓咪取個可愛的名字"
          />
        </div>

        {/* Drawing Canvas Area (simulates paper sketchbook) */}
        <div className="relative border-3 border-dashed border-[#c5a059] rounded-2xl bg-[radial-gradient(#e8dcbe_1px,transparent_1px)] bg-[size:16px_16px] bg-[#fdfbf5] p-2 flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={320}
            className="w-full max-h-[320px] cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <span className="absolute bottom-2 right-3 text-xs text-[#a37951]/70 pointer-events-none">
            透明底色 · 完成後自動裁切去背
          </span>
        </div>

        {/* Crayon Tools Palette */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {/* Colors */}
          <div className="flex items-center gap-2 flex-wrap">
            {CRAYON_PALETTE.map((c) => (
              <button
                key={c.color}
                onClick={() => {
                  setSelectedColor(c.color);
                  setIsEraser(false);
                }}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  !isEraser && selectedColor === c.color
                    ? 'scale-125 border-[#5c3a21] shadow-md ring-2 ring-[#e89b4b]'
                    : 'border-white/80 hover:scale-110'
                }`}
                style={{ backgroundColor: c.color }}
                title={c.name}
              />
            ))}

            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`p-2 rounded-xl border-2 transition-colors ${
                isEraser
                  ? 'bg-[#ffe3e3] border-[#fa5252] text-[#fa5252]'
                  : 'bg-[#f4ebd9] border-[#d4b383] text-[#7a4e2d] hover:bg-[#ebd5b3]'
              }`}
              title="橡皮擦"
            >
              <Eraser size={18} />
            </button>

            <button
              onClick={initCanvas}
              className="p-2 rounded-xl bg-[#f4ebd9] border-2 border-[#d4b383] text-[#7a4e2d] hover:bg-[#ebd5b3] transition-colors"
              title="重畫畫布"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#7a4e2d]">粗細:</span>
            <input
              type="range"
              min={4}
              max={24}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20 accent-[#e89b4b]"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex justify-end gap-3 pt-3 border-t-2 border-dashed border-[#d4b383]/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#ede3cf] text-[#5c3a21] font-bold text-sm hover:bg-[#e2d5bd] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleFinish}
            className="px-6 py-2 rounded-xl bg-[#f79f4a] hover:bg-[#f58f33] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Sparkles size={18} />
            完成繪畫，空投進樂園！
          </button>
        </div>
      </div>
    </div>
  );
};
