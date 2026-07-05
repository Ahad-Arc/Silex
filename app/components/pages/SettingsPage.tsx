"use client";

import React, { useState, useRef, useCallback } from "react";
import { CheckIcon, SettingsIcon, TrashIcon } from "../Icons";
import { SettingsToggleRow } from "../Switch";
import { LogoSlot, StampSlot } from "../BrandKitUploader";
import { LogoCropModal } from "../LogoCropModal";
import { Workspace } from "../../lib/useWorkspace";
import { CURRENCIES } from "../../lib/currencies";
import { motion } from "framer-motion";
import { useMotionPresets } from "../../lib/motionPresets";

interface SettingsPageProps { ws: Workspace; }

type Tab = "Business" | "Brand Kit" | "Invoice Defaults" | "Tax & Currency" | "PDF & Export" | "Security";

const TABS: Tab[] = ["Business", "Brand Kit", "Invoice Defaults", "Tax & Currency", "PDF & Export", "Security"];

// ── Shared Field ──────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; mono?: boolean;
}> = ({ label, value, onChange, type = "text", placeholder, mono }) => (
  <div className="space-y-1.5">
    <label className="text-2xs font-semibold uppercase tracking-wider text-muted-custom block">{label}</label>
    <input type={type} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-xs text-foreground placeholder-muted-custom/50 focus:border-accent focus:outline-none transition-colors ${mono ? "font-mono" : ""}`}
    />
  </div>
);

// ── Shared Card ───────────────────────────────────────────────────────────────
const Card: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-border-custom bg-surface p-5 space-y-4">
    {title && <h3 className="text-xs font-bold text-foreground pb-2 border-b border-border-custom">{title}</h3>}
    {children}
  </div>
);

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div className="mb-6">
    <h2 className="text-sm font-bold text-foreground">{title}</h2>
    {desc && <p className="text-2xs text-muted-custom mt-1 leading-relaxed">{desc}</p>}
  </div>
);

// ── Signature slot (draw or upload) ──────────────────────────────────────────
const SignatureSlot: React.FC<{
  dataUrl: string | null; onSet: (v: string) => void; onRemove: () => void;
}> = ({ dataUrl, onSet, onRemove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const [drawing, setDrawing]     = useState(false);
  const [mode, setMode]           = useState<"upload" | "draw">("upload");
  const [pending, setPending]     = useState<string | null>(null);

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    setDrawing(true); ctx.beginPath();
    const r = canvasRef.current!.getBoundingClientRect();
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    const r = canvasRef.current!.getBoundingClientRect();
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.strokeStyle = "#6366F1"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  }, [drawing]);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveSignature = () => {
    const url = canvasRef.current?.toDataURL("image/png");
    if (url) onSet(url);
  };

  if (dataUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-custom">Digital Signature</p>
            <p className="text-[10px] text-muted-custom/60 mt-0.5">Invoice footer · PDF sign area</p>
          </div>
          <button onClick={onRemove} className="h-6 w-6 rounded flex items-center justify-center text-muted-custom hover:text-red-400 hover:bg-red-500/10 transition-all">
            <TrashIcon size={12} />
          </button>
        </div>
        <div className="relative rounded-lg border border-border-custom bg-white overflow-hidden group" style={{ height: 72 }}>
          <img src={dataUrl} alt="Signature" className="w-full h-full object-contain p-2 group-hover:opacity-50 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setMode("draw"); }} className="rounded-md bg-background/90 border border-border-custom px-2.5 py-1 text-[10px] font-semibold text-foreground">Redraw</button>
            <button onClick={() => fileRef.current?.click()} className="rounded-md bg-background/90 border border-border-custom px-2.5 py-1 text-[10px] font-semibold text-foreground">Replace</button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { if (typeof ev.target?.result === "string") setPending(ev.target.result); }; r.readAsDataURL(f); e.target.value = ""; }} />
        {pending && <LogoCropModal sourceDataUrl={pending} onConfirm={(u) => { onSet(u); setPending(null); }} onCancel={() => setPending(null)} />}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-2xs font-semibold uppercase tracking-wider text-muted-custom">Digital Signature</p>
      <div className="flex gap-2">
        <button onClick={() => setMode("upload")} className={`flex-1 rounded-lg border py-2 text-2xs font-semibold transition-all ${mode === "upload" ? "border-accent bg-accent/10 text-accent" : "border-border-custom text-muted-custom hover:text-foreground"}`}>Upload Image</button>
        <button onClick={() => setMode("draw")} className={`flex-1 rounded-lg border py-2 text-2xs font-semibold transition-all ${mode === "draw" ? "border-accent bg-accent/10 text-accent" : "border-border-custom text-muted-custom hover:text-foreground"}`}>Draw</button>
      </div>
      {mode === "upload" && (
        <div onClick={() => fileRef.current?.click()} style={{ height: 64 }}
          className="rounded-lg border-2 border-dashed border-border-custom bg-background/50 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-custom/50">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span className="text-[10px] text-muted-custom/60">PNG · JPG · SVG</span>
        </div>
      )}
      {mode === "draw" && (
        <div className="space-y-2">
          <canvas ref={canvasRef} width={480} height={120} style={{ height: 80 }}
            className="w-full rounded-lg border border-border-custom bg-white cursor-crosshair"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)} />
          <div className="flex gap-2">
            <button onClick={clearCanvas} className="flex-1 rounded-lg border border-border-custom py-1.5 text-2xs font-semibold text-muted-custom hover:text-foreground">Clear</button>
            <button onClick={saveSignature} className="flex-1 rounded-lg bg-accent py-1.5 text-2xs font-bold text-white hover:opacity-90">Save Signature</button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { if (typeof ev.target?.result === "string") setPending(ev.target.result); }; r.readAsDataURL(f); e.target.value = ""; }} />
      {pending && <LogoCropModal sourceDataUrl={pending} onConfirm={(u) => { onSet(u); setPending(null); }} onCancel={() => setPending(null)} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export const SettingsPage: React.FC<SettingsPageProps> = ({ ws }) => {
  const { pageTransition } = useMotionPresets();
  const [activeTab, setActiveTab] = useState<Tab>("Business");
  const [saved, setSaved] = useState(false);

  // Notification toggles (local only)
  const [notifPaid,    setNotifPaid]    = useState(true);
  const [notifOverdue, setNotifOverdue] = useState(true);
  const [notifWeekly,  setNotifWeekly]  = useState(false);
  const [notifClient,  setNotifClient]  = useState(true);
  const [twoFactor,    setTwoFactor]    = useState(true);
  const [loginNotif,   setLoginNotif]   = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const hasBrandAssets = !!(ws.logoDataUrl || ws.stampDataUrl || ws.signatureDataUrl);

  // Invoice number format live preview
  const fmtPreview = (() => {
    const y = new Date().getFullYear().toString();
    const m = String(new Date().getMonth() + 1).padStart(2, "0");
    const n = String(ws.defInvCounter).padStart(4, "0");
    return ws.defInvFormat.replace("{YYYY}", y).replace("{YY}", y.slice(2)).replace("{MM}", m).replace(/\{0+1\}/, n);
  })();

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen"
    >
      {/* Header */}
      <header className="border-b border-border-custom px-6 py-4 flex items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-30">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Workspace Settings</h1>
          <p className="text-2xs text-muted-custom font-medium mt-0.5">Configure once — every invoice inherits these settings automatically.</p>
        </div>
        <button onClick={handleSave} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${saved ? "bg-success-custom/10 border border-success-custom/20 text-success-custom" : "bg-accent text-white hover:opacity-90 shadow-md shadow-accent/10"}`}>
          {saved ? <CheckIcon size={13} /> : <SettingsIcon size={13} />}
          {saved ? "Saved" : "Save Changes"}
        </button>
      </header>

      <main className="flex-1 flex min-h-0">
        {/* Sidebar nav */}
        <nav className="w-[200px] shrink-0 border-r border-border-custom p-4 space-y-0.5">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === tab ? "bg-surface text-foreground border-l-2 border-accent pl-[10px]" : "text-muted-custom hover:bg-surface/50 hover:text-foreground border-l-2 border-transparent pl-[10px]"}`}>
              <span className="flex-1">{tab}</span>
              {tab === "Brand Kit" && hasBrandAssets && <span className="h-1.5 w-1.5 rounded-full bg-success-custom shrink-0" />}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 max-w-[680px]">

          {/* ── BUSINESS ── */}
          {activeTab === "Business" && (
            <div className="space-y-6">
              <SectionHeader title="Business Information" desc="Appears on all invoices and PDF exports. Configure once — every invoice inherits these details." />

              {/* Identity preview */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border-custom bg-surface">
                <div className="h-12 w-12 rounded-xl border border-border-custom bg-background flex items-center justify-center overflow-hidden shrink-0">
                  {ws.logoDataUrl ? <img src={ws.logoDataUrl} alt="Logo" className="h-full w-full object-contain p-1" /> : <span className="text-base font-bold text-accent">{(ws.bizName || "SX").substring(0, 2)}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{ws.bizName || "Your Business"}</p>
                  <p className="text-2xs text-muted-custom truncate">{ws.bizEmail || "email@business.com"}</p>
                  {ws.bizGstin && <p className="text-[10px] font-mono text-muted-custom/70 mt-0.5">{ws.bizGstin}</p>}
                </div>
                <button onClick={() => setActiveTab("Brand Kit")} className="ml-auto text-2xs font-semibold text-accent hover:underline shrink-0">
                  {ws.logoDataUrl ? "Edit logo →" : "Add logo →"}
                </button>
              </div>

              <Card title="Company Identity">
                <Field label="Business Name" value={ws.bizName} onChange={ws.setBizName} placeholder="Acme Corp" />
                <Field label="Legal Business Name" value={ws.bizLegalName} onChange={ws.setBizLegalName} placeholder="Acme Corporation Pvt. Ltd." />
                <Field label="GSTIN / VAT / Tax ID" value={ws.bizGstin} onChange={ws.setBizGstin} placeholder="22AAAAA0000A1Z5 or US-12948281" mono />
              </Card>

              <Card title="Address">
                <Field label="Street Address" value={ws.bizAddress} onChange={ws.setBizAddress} placeholder="123 Main Street" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City"   value={ws.bizCity}  onChange={ws.setBizCity}  placeholder="San Francisco" />
                  <Field label="State"  value={ws.bizState} onChange={ws.setBizState} placeholder="CA" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Country"     value={ws.bizCountry} onChange={ws.setBizCountry} placeholder="United States" />
                  <Field label="Postal Code" value={ws.bizPostal}  onChange={ws.setBizPostal}  placeholder="94111" />
                </div>
              </Card>

              <Card title="Contact">
                <Field label="Business Email" value={ws.bizEmail}   onChange={ws.setBizEmail}   type="email" placeholder="billing@company.com" />
                <Field label="Phone"          value={ws.bizPhone}   onChange={ws.setBizPhone}   type="tel"   placeholder="+1 (555) 123-4567" />
                <Field label="Website"        value={ws.bizWebsite} onChange={ws.setBizWebsite} type="url"   placeholder="https://yourcompany.com" />
              </Card>
            </div>
          )}

          {/* ── BRAND KIT ── */}
          {activeTab === "Brand Kit" && (
            <div className="space-y-6">
              <SectionHeader title="Brand Kit" desc="Upload once. Logo, stamp, and signature automatically appear on every invoice and PDF export." />

              {/* Status strip */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Logo",      desc: "Invoice header",       active: !!ws.logoDataUrl },
                  { label: "Stamp",     desc: "Watermark & sign area", active: !!ws.stampDataUrl },
                  { label: "Signature", desc: "Sign area",            active: !!ws.signatureDataUrl },
                ].map((a) => (
                  <div key={a.label} className={`rounded-lg border p-3 flex items-center gap-2 ${a.active ? "border-success-custom/30 bg-success-custom/5" : "border-border-custom bg-surface"}`}>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${a.active ? "bg-success-custom" : "bg-border-custom"}`} />
                    <div><p className="text-xs font-semibold text-foreground">{a.label}</p><p className="text-[10px] text-muted-custom/70">{a.desc}</p></div>
                  </div>
                ))}
              </div>

              <Card title="Company Logo">
                <p className="text-2xs text-muted-custom -mt-1">Displayed in invoice header and PDF exports. A crop tool opens after upload.</p>
                <LogoSlot dataUrl={ws.logoDataUrl} onSet={ws.setLogo} onRemove={() => ws.setLogo(null)} />
                {ws.logoDataUrl && (
                  <div className="rounded-lg border border-border-custom bg-black/30 p-3">
                    <p className="text-[10px] font-semibold text-muted-custom mb-2 uppercase tracking-wider">Invoice Header Preview</p>
                    <div className="flex items-center gap-3">
                      <img src={ws.logoDataUrl} alt="Preview" style={{ height: 28, maxWidth: 88, objectFit: "contain" }} />
                      <div>
                        <p className="text-xs font-bold text-white">{ws.bizName || "Your Company"}</p>
                        <p className="text-[10px] text-muted-custom">{[ws.bizCity, ws.bizState].filter(Boolean).join(", ")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card title="Company Stamp — Watermark">
                <p className="text-2xs text-muted-custom -mt-1">
                  Used as a centred watermark behind invoice content (5–8% opacity). <strong className="text-foreground">The logo is never used as watermark — only the stamp.</strong>
                </p>
                <StampSlot dataUrl={ws.stampDataUrl} opacity={ws.stampOpacity} enabled={ws.stampEnabled}
                  onSet={ws.setStamp} onRemove={() => ws.setStamp(null)}
                  onOpacityChange={ws.setStampOpacity} onToggle={ws.setStampEnabled} />
                {ws.stampDataUrl && (
                  <div className="rounded-lg border border-border-custom bg-background/50 p-3">
                    <p className="text-[10px] font-semibold text-muted-custom mb-2 uppercase tracking-wider">Watermark Preview</p>
                    <div className="relative rounded border border-slate-200 bg-white overflow-hidden flex items-center justify-center" style={{ height: 80 }}>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <img src={ws.stampDataUrl} alt="" style={{ maxWidth: "52%", opacity: ws.stampEnabled ? ws.stampOpacity : 0.06, transform: "rotate(-15deg)", objectFit: "contain" }} />
                      </div>
                      <div className="relative z-10 w-full px-6 space-y-1.5">
                        <div className="h-2 bg-slate-200 rounded w-full" /><div className="h-2 bg-slate-100 rounded w-4/5" /><div className="h-2 bg-slate-100 rounded w-3/5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-custom/60 mt-2">Stamp sits behind all invoice text. Readability is never affected.</p>
                  </div>
                )}
              </Card>

              <Card title="Digital Signature">
                <p className="text-2xs text-muted-custom -mt-1">Appears in the invoice signature area and PDF exports. Upload an image or draw your signature.</p>
                <SignatureSlot dataUrl={ws.signatureDataUrl} onSet={ws.setSignature} onRemove={() => ws.setSignature(null)} />
              </Card>

              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex gap-3">
                <svg className="text-accent shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <p className="text-xs font-semibold text-foreground">Assets saved to workspace</p>
                  <p className="text-2xs text-muted-custom mt-0.5">Logo, stamp, and signature persist across all invoices, the Invoice Builder, PDF exports, and browser sessions. Upload once — done.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── INVOICE DEFAULTS ── */}
          {activeTab === "Invoice Defaults" && (
            <div className="space-y-6">
              <SectionHeader title="Invoice Defaults" desc="Applied to every new invoice automatically. Override per invoice inside the builder." />

              <Card title="Layout">
                <div className="space-y-1.5">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-muted-custom block">Default Template</label>
                  <select value={ws.defTemplate} onChange={(e) => ws.setDefTemplate(e.target.value)}
                    className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none">
                    {["Modern", "Classic", "Minimal", "Compact"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </Card>

              <Card title="Payment Terms">
                <div className="space-y-1.5">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-muted-custom block">Default Terms</label>
                  <select value={ws.defPayTerms} onChange={(e) => ws.setDefPayTerms(e.target.value)}
                    className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none">
                    {["Due on Receipt","Net 7","Net 14","Net 30","Net 45","Net 60"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-muted-custom block">Due After (days)</label>
                  <div className="flex items-center gap-3">
                    <input type="number" min={0} max={365} value={ws.defDueDays} onChange={(e) => ws.setDefDueDays(Number(e.target.value) || 0)}
                      className="w-[100px] rounded-lg border border-border-custom bg-background px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none" />
                    <span className="text-2xs text-muted-custom">days after invoice date</span>
                  </div>
                </div>
              </Card>

              <Card title="Invoice Number Format">
                <Field label="Format Pattern" value={ws.defInvFormat} onChange={ws.setDefInvFormat} placeholder="INV-{YYYY}-{0001}" mono />
                <div className="rounded-lg border border-border-custom bg-black/20 p-3 flex items-center justify-between">
                  <span className="text-2xs text-muted-custom">Preview</span>
                  <span className="text-xs font-mono font-bold text-accent">{fmtPreview}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-custom/70">
                  {[["{YYYY}","Full year (2026)"],["{YY}","Short year (26)"],["{MM}","Month (01-12)"],["{0001}","Auto counter"]].map(([t,d]) => (
                    <div key={t} className="flex items-center gap-1.5">
                      <code className="font-mono text-accent/80 bg-accent/10 px-1.5 py-0.5 rounded text-[10px]">{t}</code>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["INV-{YYYY}-{0001}","INV-{0001}","SILEX-{YYYY}-{0001}","{YYYY}/{MM}-{0001}"].map((fmt) => (
                    <button key={fmt} onClick={() => ws.setDefInvFormat(fmt)}
                      className={`rounded border px-2 py-1 text-[10px] font-mono transition-all ${ws.defInvFormat === fmt ? "border-accent bg-accent/10 text-accent" : "border-border-custom text-muted-custom hover:text-foreground"}`}>
                      {fmt}
                    </button>
                  ))}
                </div>
              </Card>

              <Card title="Notifications">
                <SettingsToggleRow checked={notifPaid}    onCheckedChange={setNotifPaid}    label="Invoice Paid"          description="Notify when a client marks an invoice as paid" />
                <SettingsToggleRow checked={notifOverdue} onCheckedChange={setNotifOverdue} label="Invoice Overdue"        description="Alert when an invoice passes its due date" />
                <SettingsToggleRow checked={notifWeekly}  onCheckedChange={setNotifWeekly}  label="Weekly Revenue Report" description="Weekly summary of collections and balances" />
                <SettingsToggleRow checked={notifClient}  onCheckedChange={setNotifClient}  label="New Client Added"      description="Notify when a new client is created" last />
              </Card>
            </div>
          )}

          {/* ── TAX & CURRENCY ── */}
          {activeTab === "Tax & Currency" && (
            <div className="space-y-6">
              <SectionHeader title="Tax & Currency" desc="Default tax rules and workspace currency. All invoices inherit these — override per invoice in the builder." />

              <Card title="Workspace Currency">
                <select value={ws.defCurrency} onChange={(e) => ws.setDefCurrency(e.target.value)}
                  className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none">
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.symbol}  {c.code} — {c.name}</option>
                  ))}
                </select>
                <div className="rounded-lg border border-border-custom bg-black/20 p-3 grid grid-cols-3 gap-3 text-center">
                  {[["₹ 1,23,456.00","India (INR)"],["$ 1,234,567.00","US (USD)"],["€ 1.234.567,00","Europe (EUR)"]].map(([ex, lbl]) => (
                    <div key={lbl}><p className="text-xs font-mono font-bold text-foreground">{ex}</p><p className="text-[10px] text-muted-custom mt-0.5">{lbl}</p></div>
                  ))}
                </div>
              </Card>

              <Card title="Tax Configuration">
                <Field label="Tax Label" value={ws.defTaxName} onChange={ws.setDefTaxName} placeholder="GST / VAT / Tax" />
                <div className="space-y-1.5">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-muted-custom block">Default Tax Rate (%)</label>
                  <div className="flex items-center gap-3">
                    <input type="number" min={0} max={100} step={0.5} value={ws.defTaxRate} onChange={(e) => ws.setDefTaxRate(Number(e.target.value) || 0)}
                      className="w-[100px] rounded-lg border border-border-custom bg-background px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none" />
                    <span className="text-2xs text-muted-custom">% applied to invoice subtotal</span>
                  </div>
                </div>
                <SettingsToggleRow checked={ws.defTaxInclusive} onCheckedChange={ws.setDefTaxInclusive}
                  label="Tax-Inclusive Pricing" description="Prices already include tax — show as inclusive rather than adding on top" last />
              </Card>

              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex gap-3">
                <svg className="text-accent shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-2xs text-muted-custom">Currency and tax are workspace defaults. You can override both on any individual invoice inside the Invoice Builder.</p>
              </div>
            </div>
          )}

          {/* ── PDF & EXPORT ── */}
          {activeTab === "PDF & Export" && (
            <div className="space-y-6">
              <SectionHeader title="PDF & Export Preferences" desc="Control what appears in every exported invoice PDF." />

              <Card title="Content Visibility">
                <SettingsToggleRow checked={ws.pdfShowLogo}      onCheckedChange={ws.setPdfShowLogo}      label="Show Company Logo"          description="Display your logo in the invoice header" />
                <SettingsToggleRow checked={ws.pdfShowWatermark} onCheckedChange={ws.setPdfShowWatermark} label="Show Stamp Watermark"       description="Translucent stamp watermark behind content (stamp must be uploaded)" />
                <SettingsToggleRow checked={ws.pdfShowSignature} onCheckedChange={ws.setPdfShowSignature} label="Show Digital Signature"     description="Include your signature in the sign area" />
                <SettingsToggleRow checked={ws.pdfShowQR}        onCheckedChange={ws.setPdfShowQR}        label="Show QR Code"               description="Add a payment QR code to the invoice footer" />
                <SettingsToggleRow checked={ws.pdfShowPayInstr}  onCheckedChange={ws.setPdfShowPayInstr}  label="Show Payment Instructions"  description="Include bank account / wire transfer details" last />
              </Card>

              <Card title="Current PDF will include">
                <div className="space-y-2">
                  {[
                    { label: "Company Logo",         on: ws.pdfShowLogo      && !!ws.logoDataUrl },
                    { label: "Stamp Watermark",      on: ws.pdfShowWatermark && !!ws.stampDataUrl && ws.stampEnabled },
                    { label: "Digital Signature",    on: ws.pdfShowSignature && !!ws.signatureDataUrl },
                    { label: "QR Code",              on: ws.pdfShowQR },
                    { label: "Payment Instructions", on: ws.pdfShowPayInstr },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${item.on ? "border-success-custom bg-success-custom/10" : "border-border-custom"}`}>
                        {item.on && <CheckIcon size={9} className="text-success-custom" />}
                      </span>
                      <span className={`text-xs ${item.on ? "text-foreground" : "text-muted-custom/50 line-through"}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === "Security" && (
            <div className="space-y-6">
              <SectionHeader title="Security" desc="Manage your password, sessions, and two-factor authentication." />
              <Card title="Change Password">
                <Field label="Current Password"     value="" onChange={() => {}} type="password" placeholder="••••••••" />
                <Field label="New Password"         value="" onChange={() => {}} type="password" placeholder="••••••••" />
                <Field label="Confirm New Password" value="" onChange={() => {}} type="password" placeholder="••••••••" />
                <button className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity">Update Password</button>
              </Card>
              <Card>
                <SettingsToggleRow checked={twoFactor}  onCheckedChange={setTwoFactor}  label="Two-Factor Authentication" description="Require a verification code when signing in" />
                <SettingsToggleRow checked={loginNotif} onCheckedChange={setLoginNotif} label="Login Notifications"       description="Email me when a new device signs into my account" last />
              </Card>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                <h3 className="text-xs font-bold text-red-400 mb-2">Danger Zone</h3>
                <p className="text-2xs text-muted-custom mb-3">Permanently delete your workspace and all associated data. This cannot be undone.</p>
                <button className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors">Delete Workspace</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </motion.div>
  );
};
