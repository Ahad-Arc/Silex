"use client";

import React, { useState } from "react";
import { CloseIcon, FileDownIcon, EyeIcon } from "./Icons";
import { Invoice } from "./InvoiceDrawer";
import {
  InvoiceCanvas,
  TemplateType, FontType, AccentColorType, SpacingType, LogoPresetType,
} from "./InvoiceCanvas";

interface PDFPreviewProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  // Design
  template: TemplateType;
  font: FontType;
  accent: AccentColorType;
  spacing: SpacingType;
  logoPreset: LogoPresetType;
  // Financial
  taxRate: number;
  discountRate: number;
  // Brand kit
  logoDataUrl: string | null;
  stampDataUrl: string | null;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  // Company info (from builder state)
  companyName?: string;
  companyAddress?: string;
  companyTaxId?: string;
  notes?: string;
  paymentTerms?: string;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  invoice, isOpen, onClose, onDownload, isDownloading,
  template, font, accent, spacing, logoPreset,
  taxRate, discountRate, logoDataUrl, stampDataUrl, watermarkEnabled, watermarkOpacity,
  companyName = "SILEX TECHNOLOGIES INC",
  companyAddress = "100 Pine Street, San Francisco, CA 94111",
  companyTaxId = "US-12948281",
  notes = "Thank you for your business. Payment is due within 30 days via wire transfer.",
  paymentTerms = "Bank: Silicon Valley Bank\nAccount: 9482-1029-4828\nRouting: 121000248",
}) => {
  const [zoom, setZoom] = useState(0.72);

  if (!isOpen) return null;

  const subtotal    = invoice.items.reduce((s, i) => s + i.qty * i.rate, 0);
  const discountVal = (subtotal * discountRate) / 100;
  const taxVal      = ((subtotal - discountVal) * taxRate) / 100;
  const grandTotal  = subtotal - discountVal + taxVal;

  // No-op handlers — preview is read-only
  const noop = () => {};
  const noopStr = (_: string) => {};
  const noopNum = (_: number) => {};
  const noopItem = (_i: number, _f: any, _v: any) => {};

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex flex-col overflow-hidden">
      {/* Toolbar */}
      <header className="h-[56px] border-b border-border-custom bg-background/50 px-6 flex items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-accent"><EyeIcon size={18} /></span>
          <span className="text-xs font-bold text-foreground">Print Preview — {invoice.id}</span>
          <span className="text-[10px] font-semibold text-muted-custom bg-surface border border-border-custom px-2 py-0.5 rounded">
            {template}
          </span>
          {watermarkEnabled && logoDataUrl && (
            <span className="text-[10px] font-semibold text-accent/70 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
              Watermark on
            </span>
          )}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(p => Math.max(p - 0.05, 0.3))}
            className="h-7 w-7 rounded bg-surface border border-border-custom text-xs font-bold hover:text-foreground transition-all">−</button>
          <span className="text-2xs font-mono font-bold text-muted-custom px-1.5 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(p => Math.min(p + 0.05, 1.2))}
            className="h-7 w-7 rounded bg-surface border border-border-custom text-xs font-bold hover:text-foreground transition-all">+</button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={onDownload} disabled={isDownloading}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
            <FileDownIcon size={14} />
            {isDownloading ? "Generating PDF..." : "Download PDF"}
          </button>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-muted-custom hover:bg-border-custom hover:text-foreground transition-colors">
            <CloseIcon size={18} />
          </button>
        </div>
      </header>

      {/* Canvas preview — scaled down, pointer-events disabled so it's read-only */}
      <div className="flex-1 overflow-auto p-12 flex flex-col items-center gap-8 bg-[#0a0a0c]">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 0.2s ease-in-out",
            width: "812px",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <InvoiceCanvas
            id={invoice.id}
            clientName={invoice.clientName}
            clientEmail={invoice.clientEmail}
            clientAddress={invoice.clientAddress}
            clientTaxId=""
            companyName={companyName}
            companyAddress={companyAddress}
            companyTaxId={companyTaxId}
            date={invoice.date}
            dueDate={invoice.dueDate}
            items={invoice.items}
            notes={notes}
            paymentTerms={paymentTerms}
            taxRate={taxRate}
            discountRate={discountRate}
            subtotal={subtotal}
            discountVal={discountVal}
            taxVal={taxVal}
            grandTotal={grandTotal}
            currency={invoice.currency}
            template={template}
            font={font}
            accent={accent}
            spacing={spacing}
            logoPreset={logoPreset}
            logoDataUrl={logoDataUrl}
            stampDataUrl={stampDataUrl}
            watermarkEnabled={watermarkEnabled}
            watermarkOpacity={watermarkOpacity}
            focusedRow={null}
            onSetFocusedRow={noop}
            onUpdateItem={noopItem}
            onRemoveItem={noop}
            onAddItem={noop}
            onSetId={noopStr}
            onSetDate={noopStr}
            onSetDueDate={noopStr}
            onSetClientName={noopStr}
            onSetClientEmail={noopStr}
            onSetClientAddress={noopStr}
            onSetCompanyName={noopStr}
            onSetCompanyAddress={noopStr}
            onSetCompanyTaxId={noopStr}
            onSetNotes={noopStr}
            onSetPaymentTerms={noopStr}
            onSetTaxRate={noopNum}
            onSetDiscountRate={noopNum}
          />
        </div>
      </div>
    </div>
  );
};
