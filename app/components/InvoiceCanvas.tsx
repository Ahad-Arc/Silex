"use client";

import React from "react";
import { Logo, PlusIcon, TrashIcon } from "./Icons";
import { Invoice } from "./InvoiceDrawer";
import { formatCurrency } from "../lib/currencies";

// ─── Types ────────────────────────────────────────────────────────────────────
export type TemplateType = "Modern" | "Classic" | "Minimal" | "Compact";
export type FontType = "Sans" | "Serif" | "Mono" | "Modern";
export type AccentColorType = "Indigo" | "Emerald" | "Violet" | "Rose" | "Slate";
export type SpacingType = "Compact" | "Cozy" | "Spacious";
export type LogoPresetType = "Silex" | "Monogram" | "Diamond" | "None";

export interface CanvasProps {
  // Invoice data
  id: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientTaxId: string;
  companyName: string;
  companyAddress: string;
  companyTaxId: string;
  date: string;
  dueDate: string;
  items: Invoice["items"];
  notes: string;
  paymentTerms: string;
  taxRate: number;
  discountRate: number;
  subtotal: number;
  discountVal: number;
  taxVal: number;
  grandTotal: number;
  currency: string;
  // Design
  template: TemplateType;
  font: FontType;
  accent: AccentColorType;
  spacing: SpacingType;
  logoPreset: LogoPresetType;
  // Brand kit
  logoDataUrl: string | null;
  stampDataUrl: string | null;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  // Interaction
  focusedRow: number | null;
  onSetFocusedRow: (i: number | null) => void;
  onUpdateItem: (i: number, field: "description" | "qty" | "rate", v: any) => void;
  onRemoveItem: (i: number) => void;
  onAddItem: () => void;
  onSetId: (v: string) => void;
  onSetDate: (v: string) => void;
  onSetDueDate: (v: string) => void;
  onSetClientName: (v: string) => void;
  onSetClientEmail: (v: string) => void;
  onSetClientAddress: (v: string) => void;
  onSetCompanyName: (v: string) => void;
  onSetCompanyAddress: (v: string) => void;
  onSetCompanyTaxId: (v: string) => void;
  onSetNotes: (v: string) => void;
  onSetPaymentTerms: (v: string) => void;
  onSetTaxRate: (v: number) => void;
  onSetDiscountRate: (v: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const getAccentHex = (a: AccentColorType): string => {
  switch (a) {
    case "Indigo":  return "#6366F1";
    case "Emerald": return "#00D2A0";
    case "Violet":  return "#8B5CF6";
    case "Rose":    return "#F43F5E";
    case "Slate":   return "#3F3F46";
  }
};

export const getFontClass = (f: FontType): string => {
  switch (f) {
    case "Sans":   return "font-sans tracking-tight";
    case "Serif":  return "font-serif tracking-normal";
    case "Mono":   return "font-mono tracking-tight text-xs";
    case "Modern": return "font-sans tracking-wide font-light";
  }
};

export const getSpacingClass = (s: SpacingType): string => {
  switch (s) {
    case "Compact":  return "p-8";
    case "Cozy":     return "p-12";
    case "Spacious": return "p-16";
  }
};

// ─── Shared sub-components ────────────────────────────────────────────────────
const LogoEl: React.FC<{ logoDataUrl: string | null; logoPreset: LogoPresetType; accentHex: string; size?: "sm" | "md" }> = ({
  logoDataUrl, logoPreset, accentHex, size = "md",
}) => {
  if (logoDataUrl) {
    return (
      <img src={logoDataUrl} alt="Logo" className="object-contain mb-1"
        style={{ height: size === "sm" ? "28px" : "40px", maxWidth: size === "sm" ? "80px" : "120px" }} />
    );
  }
  if (logoPreset === "None") return null;
  const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-10 w-10 text-md";
  return (
    <div className={`${dim} rounded-xl flex items-center justify-center font-bold text-white shadow mb-1`}
      style={{ backgroundColor: accentHex }}>
      {logoPreset === "Silex"    && <Logo size={size === "sm" ? 14 : 20} />}
      {logoPreset === "Monogram" && "SL"}
      {logoPreset === "Diamond"  && "◆"}
    </div>
  );
};

const StampEl: React.FC<{ stampDataUrl: string | null }> = ({ stampDataUrl }) => {
  if (!stampDataUrl) return null;
  return (
    <div className="flex justify-end mt-6">
      <img src={stampDataUrl} alt="Stamp" className="object-contain opacity-80"
        style={{ height: "80px", maxWidth: "160px" }} />
    </div>
  );
};

const WatermarkEl: React.FC<{ logoDataUrl: string | null; enabled: boolean; opacity: number }> = ({
  logoDataUrl, enabled, opacity,
}) => {
  if (!enabled || !logoDataUrl) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
      <img src={logoDataUrl} alt="" className="select-none"
        style={{ width: "55%", maxWidth: "340px", opacity, transform: "rotate(-15deg)", objectFit: "contain" }} />
    </div>
  );
};

// ─── Shared editable items table ─────────────────────────────────────────────
interface ItemsTableProps {
  items: Invoice["items"];
  startIndex: number;
  focusedRow: number | null;
  onSetFocusedRow: (i: number | null) => void;
  onUpdateItem: CanvasProps["onUpdateItem"];
  onRemoveItem: CanvasProps["onRemoveItem"];
  onAddItem: CanvasProps["onAddItem"];
  showAdd: boolean;
  thClass: string;
  tdClass: string;
  trClass: string;
  accentHex: string;
  currency: string;
}

const ItemsTable: React.FC<ItemsTableProps> = ({
  items, startIndex, focusedRow, onSetFocusedRow, onUpdateItem, onRemoveItem, onAddItem,
  showAdd, thClass, tdClass, trClass, accentHex, currency,
}) => (
  <table className="w-full text-left text-xs border-collapse">
    <thead>
      <tr className={thClass}>
        <th className="py-2 font-bold uppercase tracking-wider text-[9px]">Description</th>
        <th className="py-2 text-right font-bold uppercase tracking-wider text-[9px] w-[50px]">Qty</th>
        <th className="py-2 text-right font-bold uppercase tracking-wider text-[9px] w-[90px]">Rate</th>
        <th className="py-2 text-right font-bold uppercase tracking-wider text-[9px] w-[90px]">Amount</th>
        <th className="w-[28px] py-2" />
      </tr>
    </thead>
    <tbody>
      {items.map((item, i) => {
        const idx = startIndex + i;
        return (
          <tr key={idx} className={`${trClass} hover:bg-slate-50/60 group`}
            onMouseEnter={() => onSetFocusedRow(idx)} onMouseLeave={() => onSetFocusedRow(null)}>
            <td className={tdClass}>
              <input type="text" value={item.description}
                onChange={(e) => onUpdateItem(idx, "description", e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-transparent border-0 p-0 focus:outline-none" />
            </td>
            <td className={`${tdClass} text-right`}>
              <input type="number" value={item.qty || ""}
                onChange={(e) => onUpdateItem(idx, "qty", e.target.value)}
                className="w-full text-right text-xs text-slate-600 bg-transparent border-0 p-0 focus:outline-none" />
            </td>
            <td className={`${tdClass} text-right`}>
              <input type="number" value={item.rate || ""}
                onChange={(e) => onUpdateItem(idx, "rate", e.target.value)}
                className="w-full text-right text-xs text-slate-600 bg-transparent border-0 p-0 focus:outline-none" />
            </td>
            <td className={`${tdClass} text-right font-bold text-slate-900`}>
              {formatCurrency(item.qty * item.rate, currency)}
            </td>
            <td className={`${tdClass} text-center`}>
              <button onClick={() => onRemoveItem(idx)}
                className={`text-red-400 hover:text-red-600 transition-opacity ${focusedRow === idx ? "opacity-100" : "opacity-0"}`}>
                <TrashIcon size={11} />
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
    {showAdd && (
      <tfoot>
        <tr>
          <td colSpan={5} className="pt-2">
            <button onClick={onAddItem}
              className="flex items-center gap-1 rounded border border-dashed border-slate-200 px-3 py-1.5 text-3xs font-semibold text-slate-400 hover:border-slate-300 hover:text-slate-700 transition-colors">
              <PlusIcon size={10} /> Add Line Item
            </button>
          </td>
        </tr>
      </tfoot>
    )}
  </table>
);

// ─── Shared totals block ──────────────────────────────────────────────────────
interface TotalsProps {
  subtotal: number;
  taxVal: number;
  discountVal: number;
  grandTotal: number;
  taxRate: number;
  discountRate: number;
  notes: string;
  onSetNotes: (v: string) => void;
  onSetTaxRate: (v: number) => void;
  onSetDiscountRate: (v: number) => void;
  accentHex: string;
  template: TemplateType;
  currency: string;
}

const TotalsBlock: React.FC<TotalsProps> = ({
  subtotal, taxVal, discountVal, grandTotal, taxRate, discountRate,
  notes, onSetNotes, onSetTaxRate, onSetDiscountRate, accentHex, template, currency,
}) => {
  const isClassic = template === "Classic";
  const isMinimal = template === "Minimal";
  const isCompact = template === "Compact";

  const totalBoxStyle = isClassic
    ? { border: "2px solid #0f172a", background: "#f8fafc", borderRadius: "0", padding: "10px 14px" }
    : isMinimal
    ? { borderTop: "1px solid #e2e8f0", paddingTop: "8px", paddingBottom: "8px" }
    : isCompact
    ? { border: `1px solid ${accentHex}20`, background: `${accentHex}08`, borderRadius: "4px", padding: "6px 10px" }
    : { border: `1px solid ${accentHex}20`, background: `${accentHex}10`, borderRadius: "8px", padding: "10px 12px" };

  const totalColor = isClassic ? "#0f172a" : accentHex;

  return (
    <div className={`mt-8 pt-6 flex flex-col md:flex-row justify-between gap-6 text-xs text-slate-600 ${
      isClassic ? "border-t-2 border-slate-300" : "border-t border-slate-200"
    }`}>
      <div className="flex-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Notes</span>
        <textarea value={notes} onChange={(e) => onSetNotes(e.target.value)} rows={2}
          className="block w-full text-3xs leading-relaxed text-slate-500 bg-transparent border-0 p-0 focus:outline-none resize-none" />
      </div>
      <div className={`${isCompact ? "w-[200px]" : "w-[240px]"} space-y-1.5 pt-2`}>
        <div className="flex justify-between text-3xs">
          <span className="text-slate-400">Subtotal</span>
          <span className="font-bold text-slate-800">{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between items-center text-3xs">
          <span className="text-slate-400">Tax (%)</span>
          <input type="number" value={taxRate} onChange={(e) => onSetTaxRate(Number(e.target.value) || 0)}
            className="w-10 text-right text-3xs font-bold text-slate-700 bg-transparent border-0 p-0 focus:outline-none" />
        </div>
        <div className="flex justify-between items-center text-3xs">
          <span className="text-slate-400">Discount (%)</span>
          <input type="number" value={discountRate} onChange={(e) => onSetDiscountRate(Number(e.target.value) || 0)}
            className="w-10 text-right text-3xs font-bold text-slate-700 bg-transparent border-0 p-0 focus:outline-none" />
        </div>
        <div className="flex justify-between items-center font-bold mt-2" style={totalBoxStyle}>
          <span className="text-slate-500 text-3xs uppercase tracking-wider">
            {isClassic ? "AMOUNT DUE" : "Due Total"}
          </span>
          <span style={{ color: totalColor }}>
            {formatCurrency(grandTotal, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODERN TEMPLATE — accent bar top, colored title, clean grid, rounded totals
// ═══════════════════════════════════════════════════════════════════════════════
const ModernCanvas: React.FC<CanvasProps> = (p) => {
  const accentHex = getAccentHex(p.accent);
  const isMultiPage = p.items.length > 4;
  const page1 = isMultiPage ? p.items.slice(0, 4) : p.items;
  const page2 = isMultiPage ? p.items.slice(4) : [];
  const thCls = "border-b border-slate-200 text-slate-400";
  const tdCls = "py-2.5 border-b border-slate-100";

  const Page = ({ children, minH }: { children: React.ReactNode; minH: number }) => (
    <div className={`relative w-full bg-white text-slate-900 shadow-[0_15px_40px_rgba(0,0,0,0.3)] rounded-sm border border-slate-200/80 ${getFontClass(p.font)} ${getSpacingClass(p.spacing)}`}
      style={{ minHeight: minH }}>
      <WatermarkEl logoDataUrl={p.logoDataUrl} enabled={p.watermarkEnabled} opacity={p.watermarkOpacity} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Thick accent bar */}
        <div className="h-2 w-full rounded-sm -mx-0 mb-0" style={{ backgroundColor: accentHex,
          marginLeft: p.spacing === "Compact" ? "-2rem" : p.spacing === "Spacious" ? "-4rem" : "-3rem",
          width: "calc(100% + " + (p.spacing === "Compact" ? "4rem" : p.spacing === "Spacious" ? "8rem" : "6rem") + ")",
          marginTop: p.spacing === "Compact" ? "-2rem" : p.spacing === "Spacious" ? "-4rem" : "-3rem",
          marginBottom: "1.5rem",
        }} />
        {children}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[812px] space-y-8 flex flex-col items-center">
      <Page minH={isMultiPage ? 940 : 1050}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <LogoEl logoDataUrl={p.logoDataUrl} logoPreset={p.logoPreset} accentHex={accentHex} />
            <input value={p.companyName} onChange={(e) => p.onSetCompanyName(e.target.value)}
              className="block text-sm font-bold text-slate-900 bg-transparent border-0 p-0 focus:outline-none w-full" />
            <textarea value={p.companyAddress} onChange={(e) => p.onSetCompanyAddress(e.target.value)} rows={2}
              className="block w-[280px] text-3xs leading-relaxed text-slate-500 bg-transparent border-0 p-0 focus:outline-none resize-none" />
            <div className="flex items-center gap-1 text-3xs text-slate-400">
              <span>Tax ID:</span>
              <input value={p.companyTaxId} onChange={(e) => p.onSetCompanyTaxId(e.target.value)}
                className="w-[100px] bg-transparent border-0 p-0 text-3xs text-slate-500 focus:outline-none" />
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <h2 className="text-lg font-bold uppercase tracking-wide" style={{ color: accentHex }}>Invoice Statement</h2>
            <div className="space-y-0.5">
              {[["Invoice No", p.id, p.onSetId, "w-[90px] font-mono font-bold text-slate-900"],
                ["Issued", p.date, p.onSetDate, "w-[90px] text-slate-600"],
                ["Due Date", p.dueDate, p.onSetDueDate, "w-[90px] font-semibold text-slate-900"]
              ].map(([label, val, setter, cls]) => (
                <div key={label as string} className="flex justify-end gap-2 text-3xs">
                  <span className="text-slate-400">{label as string}</span>
                  <input value={val as string} onChange={(e) => (setter as any)(e.target.value)}
                    className={`${cls as string} text-right bg-transparent border-0 p-0 focus:outline-none`} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Billing */}
        <div className="border-t border-slate-100 pt-5 grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Billed To</span>
            <input value={p.clientName} onChange={(e) => p.onSetClientName(e.target.value)} placeholder="Client Name"
              className="block w-full text-xs font-bold text-slate-900 bg-transparent border-0 p-0 focus:outline-none placeholder-slate-300" />
            <input value={p.clientEmail} onChange={(e) => p.onSetClientEmail(e.target.value)} placeholder="email@client.com"
              className="block w-full text-3xs text-slate-500 bg-transparent border-0 p-0 focus:outline-none placeholder-slate-300" />
            <textarea value={p.clientAddress} onChange={(e) => p.onSetClientAddress(e.target.value)} rows={2}
              className="block w-full text-3xs text-slate-500 bg-transparent border-0 p-0 focus:outline-none resize-none" />
          </div>
          <div className="text-right flex flex-col items-end space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Payment Details</span>
            <textarea value={p.paymentTerms} onChange={(e) => p.onSetPaymentTerms(e.target.value)} rows={3}
              className="block w-[200px] text-3xs text-slate-500 text-right bg-transparent border-0 p-0 focus:outline-none resize-none" />
          </div>
        </div>
        {/* Items */}
        <div className="mt-6">
          <ItemsTable items={page1} startIndex={0} focusedRow={p.focusedRow} onSetFocusedRow={p.onSetFocusedRow}
            onUpdateItem={p.onUpdateItem} onRemoveItem={p.onRemoveItem} onAddItem={p.onAddItem}
            showAdd={!isMultiPage} thClass={thCls} tdClass={tdCls} trClass="" accentHex={accentHex} currency={p.currency} />
        </div>
        {!isMultiPage && (
          <>
            <TotalsBlock {...p} accentHex={accentHex} template="Modern" />
            <StampEl stampDataUrl={p.stampDataUrl} />
          </>
        )}
        {isMultiPage && (
          <div className="mt-10 border-t border-dashed border-slate-300 pt-3 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">— Continues on Page 2 —</span>
          </div>
        )}
      </Page>

      {isMultiPage && (
        <Page minH={940}>
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: accentHex }}>
                <Logo size={12} />
              </div>
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">{p.companyName} — Cont.</span>
            </div>
            <span className="text-3xs font-mono text-slate-400">{p.id} / Page 2</span>
          </div>
          <ItemsTable items={page2} startIndex={4} focusedRow={p.focusedRow} onSetFocusedRow={p.onSetFocusedRow}
            onUpdateItem={p.onUpdateItem} onRemoveItem={p.onRemoveItem} onAddItem={p.onAddItem}
            showAdd thClass={thCls} tdClass={tdCls} trClass="" accentHex={accentHex} currency={p.currency} />
          <TotalsBlock {...p} accentHex={accentHex} template="Modern" />
          <StampEl stampDataUrl={p.stampDataUrl} />
        </Page>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIC TEMPLATE — dark header band, serif-style title, heavy borders, formal
// ═══════════════════════════════════════════════════════════════════════════════
const ClassicCanvas: React.FC<CanvasProps> = (p) => {
  const isMultiPage = p.items.length > 4;
  const page1 = isMultiPage ? p.items.slice(0, 4) : p.items;
  const page2 = isMultiPage ? p.items.slice(4) : [];
  const thCls = "border-b-2 border-slate-800 text-slate-700";
  const tdCls = "py-3 border-b border-slate-200";

  const Page = ({ children, minH }: { children: React.ReactNode; minH: number }) => (
    <div className={`relative w-full bg-white text-slate-900 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-300 ${getFontClass(p.font)} ${getSpacingClass(p.spacing)}`}
      style={{ minHeight: minH }}>
      <WatermarkEl logoDataUrl={p.logoDataUrl} enabled={p.watermarkEnabled} opacity={p.watermarkOpacity} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );

  return (
    <div className="w-full max-w-[812px] space-y-8 flex flex-col items-center">
      <Page minH={isMultiPage ? 940 : 1050}>
        {/* Dark header band */}
        <div className="bg-slate-900 text-white flex justify-between items-center px-6 py-4 -mx-8 -mt-8 mb-6"
          style={{ marginLeft: p.spacing === "Compact" ? "-2rem" : p.spacing === "Spacious" ? "-4rem" : "-3rem",
                   marginRight: p.spacing === "Compact" ? "-2rem" : p.spacing === "Spacious" ? "-4rem" : "-3rem",
                   marginTop: p.spacing === "Compact" ? "-2rem" : p.spacing === "Spacious" ? "-4rem" : "-3rem" }}>
          <div className="flex items-center gap-3">
            <LogoEl logoDataUrl={p.logoDataUrl} logoPreset={p.logoPreset} accentHex="#ffffff" size="sm" />
            <div>
              <input value={p.companyName} onChange={(e) => p.onSetCompanyName(e.target.value)}
                className="block text-sm font-bold text-white bg-transparent border-0 p-0 focus:outline-none w-full" />
              <input value={p.companyTaxId} onChange={(e) => p.onSetCompanyTaxId(e.target.value)}
                className="block text-3xs text-slate-400 bg-transparent border-0 p-0 focus:outline-none w-full mt-0.5" />
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white">INVOICE</h2>
            <div className="mt-1 space-y-0.5">
              {[["No.", p.id, p.onSetId], ["Date", p.date, p.onSetDate], ["Due", p.dueDate, p.onSetDueDate]].map(([lbl, val, setter]) => (
                <div key={lbl as string} className="flex justify-end gap-2 text-3xs">
                  <span className="text-slate-400">{lbl as string}</span>
                  <input value={val as string} onChange={(e) => (setter as any)(e.target.value)}
                    className="w-[90px] text-right font-mono text-white bg-transparent border-0 p-0 focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Company address + billing grid */}
        <div className="grid grid-cols-2 gap-6 border-b-2 border-slate-200 pb-5 mb-5">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">From</span>
            <textarea value={p.companyAddress} onChange={(e) => p.onSetCompanyAddress(e.target.value)} rows={2}
              className="block w-full text-3xs leading-relaxed text-slate-600 bg-transparent border-0 p-0 focus:outline-none resize-none" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Bill To</span>
            <input value={p.clientName} onChange={(e) => p.onSetClientName(e.target.value)} placeholder="Client Name"
              className="block w-full text-xs font-bold text-slate-900 bg-transparent border-0 p-0 focus:outline-none placeholder-slate-300" />
            <input value={p.clientEmail} onChange={(e) => p.onSetClientEmail(e.target.value)}
              className="block w-full text-3xs text-slate-500 bg-transparent border-0 p-0 focus:outline-none" />
            <textarea value={p.clientAddress} onChange={(e) => p.onSetClientAddress(e.target.value)} rows={2}
              className="block w-full text-3xs text-slate-500 bg-transparent border-0 p-0 focus:outline-none resize-none" />
          </div>
        </div>

        {/* Items */}
        <ItemsTable items={page1} startIndex={0} focusedRow={p.focusedRow} onSetFocusedRow={p.onSetFocusedRow}
          onUpdateItem={p.onUpdateItem} onRemoveItem={p.onRemoveItem} onAddItem={p.onAddItem}
          showAdd={!isMultiPage} thClass={thCls} tdClass={tdCls} trClass="" accentHex="#0f172a" currency={p.currency} />

        {!isMultiPage && (
          <>
            <TotalsBlock {...p} accentHex="#0f172a" template="Classic" />
            {/* Payment terms box */}
            <div className="mt-6 border-2 border-slate-200 p-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Payment Instructions</span>
              <textarea value={p.paymentTerms} onChange={(e) => p.onSetPaymentTerms(e.target.value)} rows={2}
                className="block w-full text-3xs text-slate-600 bg-transparent border-0 p-0 focus:outline-none resize-none" />
            </div>
            <StampEl stampDataUrl={p.stampDataUrl} />
          </>
        )}
        {isMultiPage && (
          <div className="mt-10 border-t-2 border-dashed border-slate-300 pt-3 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">— Continued on Page 2 —</span>
          </div>
        )}
      </Page>

      {isMultiPage && (
        <Page minH={940}>
          <div className="flex justify-between items-center border-b-2 border-slate-800 pb-3 mb-4">
            <span className="text-sm font-bold uppercase text-slate-900">{p.companyName}</span>
            <span className="text-3xs font-mono text-slate-500">{p.id} — Page 2 of 2</span>
          </div>
          <ItemsTable items={page2} startIndex={4} focusedRow={p.focusedRow} onSetFocusedRow={p.onSetFocusedRow}
            onUpdateItem={p.onUpdateItem} onRemoveItem={p.onRemoveItem} onAddItem={p.onAddItem}
            showAdd thClass={thCls} tdClass={tdCls} trClass="" accentHex="#0f172a" currency={p.currency} />
          <TotalsBlock {...p} accentHex="#0f172a" template="Classic" />
          <StampEl stampDataUrl={p.stampDataUrl} />
        </Page>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MINIMAL TEMPLATE — no accent bar, large whitespace, typography-first, borderless
// ═══════════════════════════════════════════════════════════════════════════════
const MinimalCanvas: React.FC<CanvasProps> = (p) => {
  const isMultiPage = p.items.length > 4;
  const page1 = isMultiPage ? p.items.slice(0, 4) : p.items;
  const page2 = isMultiPage ? p.items.slice(4) : [];
  const thCls = "border-b border-slate-100 text-slate-300";
  const tdCls = "py-3 border-b border-slate-50";

  const Page = ({ children, minH }: { children: React.ReactNode; minH: number }) => (
    <div className={`relative w-full bg-white text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.07)] border border-slate-100 ${getFontClass(p.font)} ${getSpacingClass(p.spacing)}`}
      style={{ minHeight: minH }}>
      <WatermarkEl logoDataUrl={p.logoDataUrl} enabled={p.watermarkEnabled} opacity={p.watermarkOpacity} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );

  return (
    <div className="w-full max-w-[812px] space-y-8 flex flex-col items-center">
      <Page minH={isMultiPage ? 940 : 1050}>
        {/* Minimal header — large title left, meta right */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <LogoEl logoDataUrl={p.logoDataUrl} logoPreset={p.logoPreset} accentHex="#94a3b8" />
            <input value={p.companyName} onChange={(e) => p.onSetCompanyName(e.target.value)}
              className="block text-base font-medium text-slate-700 bg-transparent border-0 p-0 focus:outline-none w-full mt-1" />
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-extralight tracking-widest text-slate-300 uppercase">Invoice</h2>
            <div className="mt-2 space-y-0.5">
              {[["#", p.id, p.onSetId, "font-mono text-slate-500"],
                ["", p.date, p.onSetDate, "text-slate-400"],
                ["Due", p.dueDate, p.onSetDueDate, "text-slate-500"]
              ].map(([lbl, val, setter, cls]) => (
                <div key={lbl as string} className="flex justify-end gap-2 text-3xs">
                  {(lbl as string) && <span className="text-slate-300">{lbl as string}</span>}
                  <input value={val as string} onChange={(e) => (setter as any)(e.target.value)}
                    className={`w-[90px] text-right bg-transparent border-0 p-0 focus:outline-none ${cls as string}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Billing — stacked, generous spacing */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-slate-300 block mb-2">Billed To</span>
            <input value={p.clientName} onChange={(e) => p.onSetClientName(e.target.value)} placeholder="Client Name"
              className="block w-full text-sm font-medium text-slate-800 bg-transparent border-0 p-0 focus:outline-none placeholder-slate-200" />
            <input value={p.clientEmail} onChange={(e) => p.onSetClientEmail(e.target.value)}
              className="block w-full text-3xs text-slate-400 bg-transparent border-0 p-0 focus:outline-none mt-1" />
            <textarea value={p.clientAddress} onChange={(e) => p.onSetClientAddress(e.target.value)} rows={2}
              className="block w-full text-3xs text-slate-400 bg-transparent border-0 p-0 focus:outline-none resize-none mt-1" />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-widest text-slate-300 block mb-2">From</span>
            <textarea value={p.companyAddress} onChange={(e) => p.onSetCompanyAddress(e.target.value)} rows={2}
              className="block w-full text-3xs text-slate-400 bg-transparent border-0 p-0 focus:outline-none resize-none" />
            <input value={p.companyTaxId} onChange={(e) => p.onSetCompanyTaxId(e.target.value)}
              className="block w-full text-3xs text-slate-300 bg-transparent border-0 p-0 focus:outline-none mt-1" />
          </div>
        </div>

        {/* Items — borderless, airy */}
        <ItemsTable items={page1} startIndex={0} focusedRow={p.focusedRow} onSetFocusedRow={p.onSetFocusedRow}
          onUpdateItem={p.onUpdateItem} onRemoveItem={p.onRemoveItem} onAddItem={p.onAddItem}
          showAdd={!isMultiPage} thClass={thCls} tdClass={tdCls} trClass="" accentHex="#94a3b8" currency={p.currency} />

        {!isMultiPage && (
          <>
            <TotalsBlock {...p} accentHex="#94a3b8" template="Minimal" />
            {/* Notes + payment inline */}
            <div className="mt-8 pt-6 border-t border-slate-50 grid grid-cols-2 gap-8">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-slate-300 block mb-1">Notes</span>
                <textarea value={p.notes} onChange={(e) => p.onSetNotes(e.target.value)} rows={2}
                  className="block w-full text-3xs text-slate-400 bg-transparent border-0 p-0 focus:outline-none resize-none" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-slate-300 block mb-1">Payment</span>
                <textarea value={p.paymentTerms} onChange={(e) => p.onSetPaymentTerms(e.target.value)} rows={2}
                  className="block w-full text-3xs text-slate-400 bg-transparent border-0 p-0 focus:outline-none resize-none" />
              </div>
            </div>
            <StampEl stampDataUrl={p.stampDataUrl} />
          </>
        )}
        {isMultiPage && (
          <div className="mt-10 pt-3 text-center">
            <span className="text-[10px] text-slate-300 tracking-widest uppercase">continues →</span>
          </div>
        )}
      </Page>

      {isMultiPage && (
        <Page minH={940}>
          <div className="flex justify-between items-center mb-8">
            <span className="text-3xs uppercase tracking-widest text-slate-300">{p.companyName}</span>
            <span className="text-3xs text-slate-300">{p.id} · 2</span>
          </div>
          <ItemsTable items={page2} startIndex={4} focusedRow={p.focusedRow} onSetFocusedRow={p.onSetFocusedRow}
            onUpdateItem={p.onUpdateItem} onRemoveItem={p.onRemoveItem} onAddItem={p.onAddItem}
            showAdd thClass={thCls} tdClass={tdCls} trClass="" accentHex="#94a3b8" currency={p.currency} />
          <TotalsBlock {...p} accentHex="#94a3b8" template="Minimal" />
          <StampEl stampDataUrl={p.stampDataUrl} />
        </Page>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT TEMPLATE — dense layout, small spacing, sidebar totals, max info density
// ═══════════════════════════════════════════════════════════════════════════════
const CompactCanvas: React.FC<CanvasProps> = (p) => {
  const accentHex = getAccentHex(p.accent);
  const isMultiPage = p.items.length > 4;
  const page1 = isMultiPage ? p.items.slice(0, 4) : p.items;
  const page2 = isMultiPage ? p.items.slice(4) : [];
  const thCls = "border-b border-slate-200 text-slate-400";
  const tdCls = "py-1.5 border-b border-slate-100 text-xs";

  const Page = ({ children, minH }: { children: React.ReactNode; minH: number }) => (
    <div className={`relative w-full bg-white text-slate-900 shadow-[0_10px_25px_rgba(0,0,0,0.15)] border border-slate-200 ${getFontClass(p.font)} p-6`}
      style={{ minHeight: minH }}>
      <WatermarkEl logoDataUrl={p.logoDataUrl} enabled={p.watermarkEnabled} opacity={p.watermarkOpacity} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );

  return (
    <div className="w-full max-w-[812px] space-y-8 flex flex-col items-center">
      <Page minH={isMultiPage ? 940 : 1050}>
        {/* Thin accent bar */}
        <div className="h-1 w-full rounded-sm mb-4" style={{ backgroundColor: accentHex }} />

        {/* Compact header — all on one row */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <LogoEl logoDataUrl={p.logoDataUrl} logoPreset={p.logoPreset} accentHex={accentHex} size="sm" />
            <div>
              <input value={p.companyName} onChange={(e) => p.onSetCompanyName(e.target.value)}
                className="block text-xs font-bold text-slate-900 bg-transparent border-0 p-0 focus:outline-none w-full" />
              <input value={p.companyTaxId} onChange={(e) => p.onSetCompanyTaxId(e.target.value)}
                className="block text-3xs text-slate-400 bg-transparent border-0 p-0 focus:outline-none w-full" />
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: accentHex }}>Invoice</h2>
            <div className="flex gap-4 mt-1 text-3xs text-slate-500">
              <input value={p.id} onChange={(e) => p.onSetId(e.target.value)}
                className="w-[80px] font-mono text-right bg-transparent border-0 p-0 focus:outline-none text-slate-700" />
              <input value={p.date} onChange={(e) => p.onSetDate(e.target.value)}
                className="w-[80px] text-right bg-transparent border-0 p-0 focus:outline-none" />
              <input value={p.dueDate} onChange={(e) => p.onSetDueDate(e.target.value)}
                className="w-[80px] text-right bg-transparent border-0 p-0 focus:outline-none font-semibold text-slate-700" />
            </div>
          </div>
        </div>

        {/* Compact billing — single row */}
        <div className="flex gap-6 border-t border-b border-slate-100 py-2 mb-4 text-3xs">
          <div className="flex-1">
            <span className="text-[8px] uppercase tracking-widest text-slate-300 block">Bill To</span>
            <input value={p.clientName} onChange={(e) => p.onSetClientName(e.target.value)} placeholder="Client"
              className="font-semibold text-slate-800 bg-transparent border-0 p-0 focus:outline-none w-full placeholder-slate-200" />
            <input value={p.clientEmail} onChange={(e) => p.onSetClientEmail(e.target.value)}
              className="text-slate-400 bg-transparent border-0 p-0 focus:outline-none w-full" />
          </div>
          <div className="flex-1">
            <span className="text-[8px] uppercase tracking-widest text-slate-300 block">Address</span>
            <textarea value={p.clientAddress} onChange={(e) => p.onSetClientAddress(e.target.value)} rows={2}
              className="text-slate-400 bg-transparent border-0 p-0 focus:outline-none resize-none w-full" />
          </div>
          <div className="flex-1 text-right">
            <span className="text-[8px] uppercase tracking-widest text-slate-300 block">Payment</span>
            <textarea value={p.paymentTerms} onChange={(e) => p.onSetPaymentTerms(e.target.value)} rows={2}
              className="text-slate-400 bg-transparent border-0 p-0 focus:outline-none resize-none w-full text-right" />
          </div>
        </div>

        {/* Dense items table */}
        <ItemsTable items={page1} startIndex={0} focusedRow={p.focusedRow} onSetFocusedRow={p.onSetFocusedRow}
          onUpdateItem={p.onUpdateItem} onRemoveItem={p.onRemoveItem} onAddItem={p.onAddItem}
          showAdd={!isMultiPage} thClass={thCls} tdClass={tdCls} trClass="" accentHex={accentHex} currency={p.currency} />

        {!isMultiPage && (
          <>
            {/* Compact totals — right-aligned, no notes column */}
            <div className="mt-4 flex justify-end">
              <div className="w-[200px] space-y-1 text-3xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(p.subtotal, p.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tax (%)</span>
                  <input type="number" value={p.taxRate} onChange={(e) => p.onSetTaxRate(Number(e.target.value) || 0)}
                    className="w-8 text-right font-semibold text-slate-700 bg-transparent border-0 p-0 focus:outline-none" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Discount (%)</span>
                  <input type="number" value={p.discountRate} onChange={(e) => p.onSetDiscountRate(Number(e.target.value) || 0)}
                    className="w-8 text-right font-semibold text-slate-700 bg-transparent border-0 p-0 focus:outline-none" />
                </div>
                <div className="flex justify-between items-center font-bold text-xs mt-1 rounded px-2 py-1.5"
                  style={{ backgroundColor: `${accentHex}10`, border: `1px solid ${accentHex}20` }}>
                  <span className="text-slate-500 text-3xs uppercase tracking-wider">Total</span>
                  <span style={{ color: accentHex }}>{formatCurrency(p.grandTotal, p.currency)}</span>
                </div>
              </div>
            </div>
            {/* Notes inline below */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <textarea value={p.notes} onChange={(e) => p.onSetNotes(e.target.value)} rows={1}
                className="block w-full text-3xs text-slate-400 bg-transparent border-0 p-0 focus:outline-none resize-none" />
            </div>
            <StampEl stampDataUrl={p.stampDataUrl} />
          </>
        )}
        {isMultiPage && (
          <div className="mt-6 border-t border-dashed border-slate-200 pt-2 text-center">
            <span className="text-[9px] font-mono text-slate-300 uppercase tracking-wide">→ page 2</span>
          </div>
        )}
      </Page>

      {isMultiPage && (
        <Page minH={940}>
          <div className="h-1 w-full rounded-sm mb-4" style={{ backgroundColor: accentHex }} />
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
            <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider">{p.companyName}</span>
            <span className="text-3xs font-mono text-slate-400">{p.id} · p.2</span>
          </div>
          <ItemsTable items={page2} startIndex={4} focusedRow={p.focusedRow} onSetFocusedRow={p.onSetFocusedRow}
            onUpdateItem={p.onUpdateItem} onRemoveItem={p.onRemoveItem} onAddItem={p.onAddItem}
            showAdd thClass={thCls} tdClass={tdCls} trClass="" accentHex={accentHex} currency={p.currency} />
          <TotalsBlock {...p} accentHex={accentHex} template="Compact" />
          <StampEl stampDataUrl={p.stampDataUrl} />
        </Page>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT DISPATCHER — picks the right canvas based on template prop
// ═══════════════════════════════════════════════════════════════════════════════
export const InvoiceCanvas: React.FC<CanvasProps> = (props) => {
  switch (props.template) {
    case "Classic": return <ClassicCanvas {...props} />;
    case "Minimal": return <MinimalCanvas {...props} />;
    case "Compact": return <CompactCanvas {...props} />;
    case "Modern":
    default:        return <ModernCanvas {...props} />;
  }
};
