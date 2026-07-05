"use client";

/**
 * LogoCropModal — canvas-based image crop with three shape modes.
 *
 * Modes:
 *   square    1:1  — standard square crop
 *   rectangle 3:1  — wide banner / letterhead crop
 *   circle    1:1  — circular crop (mask applied on export)
 *
 * The user drags a crop handle to reposition the crop window over the image.
 * Live preview updates in real time. On confirm, the cropped result is
 * exported as a PNG data URL and passed to onConfirm().
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { CloseIcon, CheckIcon } from "./Icons";

type CropShape = "square" | "rectangle" | "circle";

interface LogoCropModalProps {
  /** Raw data URL of the uploaded image (before crop) */
  sourceDataUrl: string;
  /** Called with the cropped PNG data URL when user confirms */
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

const SHAPES: { id: CropShape; label: string; ratio: number; desc: string }[] = [
  { id: "square",    label: "Square",    ratio: 1,   desc: "1:1 — icon / avatar" },
  { id: "rectangle", label: "Rectangle", ratio: 3,   desc: "3:1 — letterhead / banner" },
  { id: "circle",    label: "Circle",    ratio: 1,   desc: "1:1 — rounded mark" },
];

const PREVIEW_W = 480;

export const LogoCropModal: React.FC<LogoCropModalProps> = ({
  sourceDataUrl,
  onConfirm,
  onCancel,
}) => {
  const [shape, setShape]       = useState<CropShape>("square");
  const [imgNatW, setImgNatW]   = useState(0);
  const [imgNatH, setImgNatH]   = useState(0);
  const [scale, setScale]       = useState(1);   // rendered px per natural px
  const [cropX, setCropX]       = useState(0);   // in natural px
  const [cropY, setCropY]       = useState(0);
  const [cropSize, setCropSize] = useState(0);   // natural px width of crop box
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mx: 0, cx: 0, cy: 0 });

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const previewRef  = useRef<HTMLCanvasElement>(null);
  const imgRef      = useRef<HTMLImageElement | null>(null);

  const shapeConfig = SHAPES.find(s => s.id === shape)!;

  // ── Load image ────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNatW(img.naturalWidth);
      setImgNatH(img.naturalHeight);
      const sc = PREVIEW_W / img.naturalWidth;
      setScale(sc);
      // Initial crop: centred square (or rectangle) at 60% of shortest side
      const shortSide = Math.min(img.naturalWidth, img.naturalHeight);
      const initSize  = Math.round(shortSide * 0.8);
      const initW     = shape === "rectangle" ? Math.min(img.naturalWidth, initSize * 3) : initSize;
      const initH     = Math.round(initW / shapeConfig.ratio);
      setCropSize(initW);
      setCropX(Math.round((img.naturalWidth  - initW) / 2));
      setCropY(Math.round((img.naturalHeight - initH) / 2));
    };
    img.src = sourceDataUrl;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceDataUrl]);

  // Re-centre crop when shape changes
  useEffect(() => {
    if (!imgNatW || !imgNatH) return;
    const shortSide = Math.min(imgNatW, imgNatH);
    const initSize  = Math.round(shortSide * 0.8);
    const initW     = shape === "rectangle" ? Math.min(imgNatW, initSize * 3) : initSize;
    setCropSize(initW);
    setCropX(Math.round((imgNatW - initW) / 2));
    setCropY(Math.round((imgNatH - Math.round(initW / shapeConfig.ratio)) / 2));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape]);

  const cropH = Math.round(cropSize / shapeConfig.ratio);

  // ── Draw canvas ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !imgNatW) return;

    const dispW = Math.round(imgNatW * scale);
    const dispH = Math.round(imgNatH * scale);
    canvas.width  = dispW;
    canvas.height = dispH;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, dispW, dispH);

    // Draw image
    ctx.drawImage(img, 0, 0, dispW, dispH);

    // Dim overlay
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, dispW, dispH);

    // Cut out crop window
    const cx = Math.round(cropX * scale);
    const cy = Math.round(cropY * scale);
    const cw = Math.round(cropSize * scale);
    const ch = Math.round(cropH * scale);

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    if (shape === "circle") {
      ctx.beginPath();
      ctx.ellipse(cx + cw / 2, cy + ch / 2, cw / 2, ch / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(cx, cy, cw, ch);
    }
    ctx.restore();

    // Re-draw image inside crop window (so it's bright)
    ctx.save();
    if (shape === "circle") {
      ctx.beginPath();
      ctx.ellipse(cx + cw / 2, cy + ch / 2, cw / 2, ch / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(cx, cy, cw, ch);
      ctx.clip();
    }
    ctx.drawImage(img, 0, 0, dispW, dispH);
    ctx.restore();

    // Crop border
    ctx.strokeStyle = "#6366F1";
    ctx.lineWidth   = 2;
    if (shape === "circle") {
      ctx.beginPath();
      ctx.ellipse(cx + cw / 2, cy + ch / 2, cw / 2, ch / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(cx, cy, cw, ch);
      // Rule-of-thirds guides
      ctx.strokeStyle = "rgba(99,102,241,0.35)";
      ctx.lineWidth   = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(cx + (cw / 3) * i, cy); ctx.lineTo(cx + (cw / 3) * i, cy + ch); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy + (ch / 3) * i); ctx.lineTo(cx + cw, cy + (ch / 3) * i); ctx.stroke();
      }
    }

    // Corner handles
    const hs = 8;
    ctx.fillStyle = "#6366F1";
    [[cx, cy], [cx + cw - hs, cy], [cx, cy + ch - hs], [cx + cw - hs, cy + ch - hs]].forEach(([hx, hy]) => {
      ctx.fillRect(hx, hy, hs, hs);
    });
  }, [cropX, cropY, cropSize, cropH, scale, shape, imgNatW, imgNatH]);

  // ── Draw preview ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = previewRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !imgNatW) return;

    const OUT = 120;
    canvas.width  = OUT;
    canvas.height = shape === "rectangle" ? Math.round(OUT / 3) : OUT;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (shape === "circle") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(img, cropX, cropY, cropSize, cropH, 0, 0, canvas.width, canvas.height);
    if (shape === "circle") ctx.restore();
  }, [cropX, cropY, cropSize, cropH, shape, imgNatW]);

  // ── Drag to move crop ─────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const cx   = cropX * scale;
    const cy   = cropY * scale;
    const cw   = cropSize * scale;
    const ch   = cropH * scale;
    if (mx >= cx && mx <= cx + cw && my >= cy && my <= cy + ch) {
      setDragging(true);
      setDragStart({ mx: e.clientX, cx: cropX, cy: cropY });
    }
  }, [cropX, cropY, cropSize, cropH, scale]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const dx = (e.clientX - dragStart.mx) / scale;
    const dy = (e.clientY - dragStart.mx) / scale; // intentional: use mx for both to keep ratio
    const newX = Math.max(0, Math.min(imgNatW - cropSize, dragStart.cx + dx));
    const newY = Math.max(0, Math.min(imgNatH - cropH,   dragStart.cy + (e.clientY - dragStart.mx) / scale));
    setCropX(Math.round(newX));
    setCropY(Math.round(newY));
  }, [dragging, dragStart, scale, imgNatW, imgNatH, cropSize, cropH]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  // ── Confirm: export cropped PNG ───────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const OUT_W = shape === "rectangle" ? 600 : 300;
    const OUT_H = Math.round(OUT_W / shapeConfig.ratio);

    const out = document.createElement("canvas");
    out.width  = OUT_W;
    out.height = OUT_H;
    const ctx  = out.getContext("2d")!;

    if (shape === "circle") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(OUT_W / 2, OUT_H / 2, OUT_W / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(img, cropX, cropY, cropSize, cropH, 0, 0, OUT_W, OUT_H);
    if (shape === "circle") ctx.restore();

    onConfirm(out.toDataURL("image/png"));
  }, [cropX, cropY, cropSize, cropH, shape, shapeConfig.ratio, onConfirm]);

  const dispW = Math.round(imgNatW * scale);
  const dispH = Math.round(imgNatH * scale);

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-[#111113] border border-border-custom rounded-2xl shadow-2xl w-full max-w-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-custom">
          <div>
            <h2 className="text-sm font-bold text-foreground">Crop Logo</h2>
            <p className="text-2xs text-muted-custom mt-0.5">Drag to reposition · Choose a crop shape</p>
          </div>
          <button onClick={onCancel} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-custom hover:bg-surface hover:text-foreground transition-all">
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Shape selector */}
        <div className="px-6 pt-4 flex gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => setShape(s.id)}
              className={`flex-1 rounded-lg border px-3 py-2 text-center transition-all ${
                shape === s.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border-custom bg-surface text-muted-custom hover:text-foreground"
              }`}
            >
              <p className="text-xs font-semibold">{s.label}</p>
              <p className="text-[10px] text-muted-custom mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="px-6 pt-4 flex justify-center overflow-auto">
          {imgNatW > 0 ? (
            <canvas
              ref={canvasRef}
              width={dispW}
              height={dispH}
              style={{ maxWidth: "100%", cursor: dragging ? "grabbing" : "grab", borderRadius: "8px" }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            />
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-custom text-xs">Loading…</div>
          )}
        </div>

        {/* Preview + size slider */}
        <div className="px-6 pt-4 flex items-center gap-6">
          <div className="shrink-0">
            <p className="text-[10px] text-muted-custom mb-1.5 uppercase tracking-wider font-semibold">Preview</p>
            <div className="rounded-lg border border-border-custom bg-white p-2 flex items-center justify-center" style={{ width: 80, height: 80 }}>
              <canvas
                ref={previewRef}
                style={{ maxWidth: 72, maxHeight: 72, objectFit: "contain" }}
              />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-custom uppercase tracking-wider font-semibold">Crop Size</span>
              <span className="text-[10px] font-mono text-muted-custom">{cropSize}px</span>
            </div>
            <input
              type="range"
              min={Math.round(Math.min(imgNatW, imgNatH) * 0.2)}
              max={shape === "rectangle" ? imgNatW : Math.min(imgNatW, imgNatH)}
              value={cropSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCropSize(v);
                setCropX(Math.max(0, Math.min(imgNatW - v, cropX)));
                setCropY(Math.max(0, Math.min(imgNatH - Math.round(v / shapeConfig.ratio), cropY)));
              }}
              className="w-full h-1.5 rounded-full appearance-none bg-border-custom accent-accent cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-border-custom mt-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border-custom px-4 py-2 text-xs font-semibold text-muted-custom hover:text-foreground hover:bg-surface transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <CheckIcon size={13} />
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};
