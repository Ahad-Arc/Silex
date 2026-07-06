"use client";

/**
 * BrandKitUploader — workspace brand asset management panel.
 *
 * LOGO  → header branding only (invoice header, PDF header, dashboard)
 * STAMP → watermark only (behind invoice content, 5–8% opacity, centred)
 *
 * Logo upload opens the LogoCropModal for shape selection.
 * Stamp upload goes straight through (no crop — stamps are used as-is).
 */

import React, { useRef, useState } from "react";
import { TrashIcon, CheckIcon } from "./Icons";
import { LogoCropModal } from "./LogoCropModal";
import { SilexSwitch } from "./Switch";

const ACCEPTED = "image/png,image/svg+xml,image/webp";
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

// ─── Upload zone ──────────────────────────────────────────────────────────────
interface UploadZoneProps {
  height?: number;
  onFile: (file: File) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ height = 72, onFile }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (file.size > MAX_BYTES) {
      window.dispatchEvent(
        new CustomEvent("silex-toast", {
          detail: { message: "File too large", type: "error", submessage: "Maximum allowed file size is 4 MB." },
        })
      );
      return;
    }
    onFile(file);
  };

  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{ height }}
        className={`rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
          dragOver
            ? "border-accent bg-accent/10"
            : "border-border-custom bg-surface/50 hover:border-accent/50 hover:bg-accent/5"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-custom/60">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span className="text-[10px] text-muted-custom/60 font-medium">PNG · SVG · WebP</span>
        <span className="text-[9px] text-muted-custom/40">Click or drag to upload</span>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </>
  );
};

// ─── Asset preview tile ───────────────────────────────────────────────────────
interface AssetPreviewProps {
  dataUrl: string;
  label: string;
  onReplace: () => void;
  onRemove: () => void;
  /** Stamp previews show greyscale + opacity hint */
  variant?: "logo" | "stamp";
  height?: number;
}

const AssetPreview: React.FC<AssetPreviewProps> = ({
  dataUrl, label, onReplace, onRemove, variant = "logo", height = 72,
}) => (
  <div className="relative rounded-lg border border-border-custom bg-surface overflow-hidden group" style={{ height }}>
    {/* Background checkerboard for transparency */}
    <div className="absolute inset-0" style={{
      backgroundImage: "linear-gradient(45deg,#27272a 25%,transparent 25%),linear-gradient(-45deg,#27272a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#27272a 75%),linear-gradient(-45deg,transparent 75%,#27272a 75%)",
      backgroundSize: "8px 8px",
      backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
      opacity: 0.4,
    }} />
    <img
      src={dataUrl}
      alt={label}
      className={`relative w-full h-full object-contain p-2 transition-opacity group-hover:opacity-60 ${
        variant === "stamp" ? "grayscale opacity-70" : ""
      }`}
    />
    {/* Hover actions */}
    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={onReplace}
        className="rounded-md bg-background/90 border border-border-custom px-2.5 py-1 text-[10px] font-semibold text-foreground hover:border-accent/50 transition-all"
      >
        Replace
      </button>
      <button
        onClick={onRemove}
        className="rounded-md bg-red-500/10 border border-red-500/20 p-1 text-red-400 hover:bg-red-500/20 transition-all"
      >
        <TrashIcon size={11} />
      </button>
    </div>
  </div>
);

// ─── LOGO SLOT ────────────────────────────────────────────────────────────────
interface LogoSlotProps {
  dataUrl: string | null;
  onSet: (dataUrl: string) => void;
  onRemove: () => void;
}

export const LogoSlot: React.FC<LogoSlotProps> = ({ dataUrl, onSet, onRemove }) => {
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") setPendingFile(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-custom">Company Logo</p>
            <p className="text-[10px] text-muted-custom/60 mt-0.5">Invoice header · PDF header · Dashboard</p>
          </div>
          {dataUrl && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-success-custom bg-success-custom/10 border border-success-custom/20 px-1.5 py-0.5 rounded">
              <CheckIcon size={9} /> Uploaded
            </span>
          )}
        </div>

        {dataUrl ? (
          <AssetPreview
            dataUrl={dataUrl}
            label="Company Logo"
            variant="logo"
            height={64}
            onReplace={() => inputRef.current?.click()}
            onRemove={onRemove}
          />
        ) : (
          <UploadZone height={64} onFile={handleFile} />
        )}

        <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>

      {/* Crop modal */}
      {pendingFile && (
        <LogoCropModal
          sourceDataUrl={pendingFile}
          onConfirm={(cropped) => { onSet(cropped); setPendingFile(null); }}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </>
  );
};

// ─── STAMP SLOT ───────────────────────────────────────────────────────────────
interface StampSlotProps {
  dataUrl: string | null;
  opacity: number;
  enabled: boolean;
  onSet: (dataUrl: string) => void;
  onRemove: () => void;
  onOpacityChange: (v: number) => void;
  onToggle: (v: boolean) => void;
}

export const StampSlot: React.FC<StampSlotProps> = ({
  dataUrl, opacity, enabled, onSet, onRemove, onOpacityChange, onToggle,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > MAX_BYTES) {
      window.dispatchEvent(
        new CustomEvent("silex-toast", {
          detail: { message: "File too large", type: "error", submessage: "Maximum allowed file size is 4 MB." },
        })
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") onSet(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-custom">Company Stamp</p>
          <p className="text-[10px] text-muted-custom/60 mt-0.5">Watermark · Signature area · PDF export</p>
        </div>
        {dataUrl && (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-success-custom bg-success-custom/10 border border-success-custom/20 px-1.5 py-0.5 rounded">
            <CheckIcon size={9} /> Uploaded
          </span>
        )}
      </div>

      {dataUrl ? (
        <AssetPreview
          dataUrl={dataUrl}
          label="Company Stamp"
          variant="stamp"
          height={72}
          onReplace={() => inputRef.current?.click()}
          onRemove={onRemove}
        />
      ) : (
        <UploadZone height={72} onFile={handleFile} />
      )}

      <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      {/* Watermark toggle + opacity — only shown when stamp is uploaded */}
      {dataUrl && (
        <div className="rounded-lg border border-border-custom bg-surface/50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-foreground">Use as Watermark</p>
              <p className="text-[9px] text-muted-custom/70 mt-0.5">Centred behind invoice content</p>
            </div>
            <SilexSwitch
              checked={enabled}
              onCheckedChange={onToggle}
              label="Use stamp as watermark"
            />
          </div>

          {enabled && (
            <div className="space-y-1.5 pt-1 border-t border-border-custom">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-custom">Opacity</span>
                <span className="text-[10px] font-mono font-semibold text-muted-custom">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={8}
                step={1}
                value={Math.round(opacity * 100)}
                onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
                className="w-full h-1.5 rounded-full appearance-none bg-border-custom accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-muted-custom/40">
                <span>5% subtle</span>
                <span>8% visible</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── FULL BRAND KIT PANEL (used in InvoiceBuilder right sidebar) ──────────────
interface BrandKitPanelProps {
  logoDataUrl:   string | null;
  stampDataUrl:  string | null;
  stampOpacity:  number;
  stampEnabled:  boolean;
  onSetLogo:     (url: string | null) => void;
  onSetStamp:    (url: string | null) => void;
  onStampOpacity:(v: number) => void;
  onStampToggle: (v: boolean) => void;
}

export const BrandKitPanel: React.FC<BrandKitPanelProps> = ({
  logoDataUrl, stampDataUrl, stampOpacity, stampEnabled,
  onSetLogo, onSetStamp, onStampOpacity, onStampToggle,
}) => (
  <div className="border-t border-border-custom pt-5 space-y-5">
    <div className="flex items-center gap-2">
      <span className="text-2xs font-bold uppercase tracking-wider text-foreground">Brand Kit</span>
      <span className="text-[9px] font-semibold text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
        PNG · SVG · WebP
      </span>
    </div>

    <LogoSlot
      dataUrl={logoDataUrl}
      onSet={onSetLogo}
      onRemove={() => onSetLogo(null)}
    />

    <div className="h-px bg-border-custom" />

    <StampSlot
      dataUrl={stampDataUrl}
      opacity={stampOpacity}
      enabled={stampEnabled}
      onSet={onSetStamp}
      onRemove={() => onSetStamp(null)}
      onOpacityChange={onStampOpacity}
      onToggle={onStampToggle}
    />
  </div>
);

// ─── Legacy exports kept for any remaining import references ──────────────────
/** @deprecated Use LogoSlot / StampSlot / BrandKitPanel instead */
export const BrandAssetSlot = LogoSlot;
/** @deprecated Use StampSlot instead */
export const WatermarkControl: React.FC<{
  enabled: boolean; opacity: number;
  onToggle: (v: boolean) => void; onOpacityChange: (v: number) => void; hasLogo: boolean;
}> = ({ enabled, opacity, onToggle, onOpacityChange, hasLogo }) => (
  hasLogo ? (
    <div className="rounded-lg border border-border-custom bg-surface/50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-foreground">Watermark</p>
        <SilexSwitch checked={enabled} onCheckedChange={onToggle} label="Watermark" />
      </div>
      {enabled && (
        <input type="range" min={5} max={8} step={1} value={Math.round(opacity * 100)}
          onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
          className="w-full h-1.5 rounded-full appearance-none bg-border-custom accent-accent cursor-pointer" />
      )}
    </div>
  ) : null
);
