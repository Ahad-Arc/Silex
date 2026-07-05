"use client";

import React from "react";
import { PlusIcon, CheckIcon, TemplatesIcon } from "../Icons";
import { Workspace } from "../../lib/useWorkspace";
import { motion } from "framer-motion";
import { useMotionPresets } from "../../lib/motionPresets";

interface TemplatesPageProps {
  ws: Workspace;
  onNewInvoice: () => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  style: "Modern" | "Classic" | "Minimal" | "Compact";
  accent: string;
  accentHex: string;
  usageCount: number;
  lastUsed: string;
  isDefault: boolean;
  previewLines: string[];
}

const TEMPLATES: Template[] = [
  {
    id: "tpl-modern",
    name: "Modern",
    description: "Clean geometric layout with bold accent bar and structured grid. Best for tech and SaaS companies.",
    style: "Modern",
    accent: "Indigo",
    accentHex: "#6366F1",
    usageCount: 24,
    lastUsed: "May 27, 2026",
    isDefault: true,
    previewLines: ["Company Name", "Invoice Statement", "Line items table", "Totals block"],
  },
  {
    id: "tpl-classic",
    name: "Classic",
    description: "Traditional serif typography with dark header border. Ideal for legal, finance, and consulting.",
    style: "Classic",
    accent: "Slate",
    accentHex: "#3F3F46",
    usageCount: 8,
    lastUsed: "May 15, 2026",
    isDefault: false,
    previewLines: ["Company Name", "Invoice", "Itemized list", "Payment terms"],
  },
  {
    id: "tpl-minimal",
    name: "Minimal",
    description: "Ultra-clean whitespace-first design with no accent bar. Perfect for creative agencies and freelancers.",
    style: "Minimal",
    accent: "Slate",
    accentHex: "#94a3b8",
    usageCount: 12,
    lastUsed: "May 20, 2026",
    isDefault: false,
    previewLines: ["Studio Name", "Statement", "Services rendered", "Due amount"],
  },
  {
    id: "tpl-compact",
    name: "Compact",
    description: "Tight spacing for high line-item density. Designed for contractors and detailed project billing.",
    style: "Compact",
    accent: "Emerald",
    accentHex: "#00D2A0",
    usageCount: 5,
    lastUsed: "Apr 30, 2026",
    isDefault: false,
    previewLines: ["Vendor Name", "Invoice", "Dense item rows", "Summary"],
  },
];

const FONT_OPTIONS = [
  { name: "Inter Sans-serif", tag: "Sans", description: "Clean, modern, highly legible" },
  { name: "Playfair Serif", tag: "Serif", description: "Elegant, editorial, authoritative" },
  { name: "JetBrains Mono", tag: "Mono", description: "Technical, precise, developer-grade" },
  { name: "Outfit Clean", tag: "Modern", description: "Geometric, contemporary, minimal" },
];

const ACCENT_OPTIONS = [
  { name: "Indigo", hex: "#6366F1" },
  { name: "Emerald", hex: "#00D2A0" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Slate", hex: "#3F3F46" },
];

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ ws, onNewInvoice }) => {
  const { pageTransition } = useMotionPresets();
  const selectedTemplate = TEMPLATES.find((t) => t.style === ws.defTemplate) || TEMPLATES[0];
  const selectedFont = ws.defFont;
  const selectedAccent = ws.defAccent;

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
          <h1 className="text-lg font-bold tracking-tight text-foreground">Templates</h1>
          <p className="text-2xs text-muted-custom font-medium mt-0.5">
            Choose a layout, font, and accent color for your invoices
          </p>
        </div>
        <button
          onClick={onNewInvoice}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-md shadow-accent/10"
        >
          <PlusIcon size={14} />
          New Invoice
        </button>
      </header>

      <main className="p-6 space-y-8 flex-1">
        {/* Layout Templates */}
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-bold text-foreground">Layout Templates</h2>
            <p className="text-2xs text-muted-custom mt-0.5">Select the base layout for your invoice documents</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplate.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => ws.setDefTemplate(tpl.style)}
                  className={`text-left rounded-xl border p-0 overflow-hidden transition-all duration-200 group ${
                    isSelected
                      ? "border-accent/60 ring-2 ring-accent/20"
                      : "border-border-custom hover:border-border-custom/80"
                  }`}
                >
                  {/* Mini preview */}
                  <div className="bg-white p-4 relative" style={{ height: "140px" }}>
                    {/* Accent bar */}
                    {tpl.style !== "Minimal" && (
                      <div
                        className="h-1 w-full rounded-sm mb-3"
                        style={{ backgroundColor: tpl.accentHex }}
                      />
                    )}
                    {tpl.style === "Classic" && (
                      <div className="h-0.5 w-full bg-slate-900 mb-3" />
                    )}
                    <div className="space-y-1.5">
                      {tpl.previewLines.map((line, i) => (
                        <div
                          key={i}
                          className="rounded-sm"
                          style={{
                            height: i === 0 ? "8px" : "5px",
                            width: i === 0 ? "60%" : i === 1 ? "40%" : i % 2 === 0 ? "80%" : "55%",
                            backgroundColor: i === 0 ? "#1e293b" : i === 1 ? tpl.accentHex : "#e2e8f0",
                            opacity: i === 1 ? 0.8 : 1,
                          }}
                        />
                      ))}
                    </div>
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tpl.accentHex }}
                      >
                        <CheckIcon size={10} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="bg-surface p-3 border-t border-border-custom">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">{tpl.name}</span>
                      {tpl.isDefault && (
                        <span className="text-2xs font-semibold text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-2xs text-muted-custom leading-relaxed line-clamp-2">{tpl.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xs text-muted-custom">{tpl.usageCount} uses</span>
                      <span className="h-1 w-1 rounded-full bg-border-custom" />
                      <span className="text-2xs text-muted-custom">Last: {tpl.lastUsed}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Typography */}
          <section>
            <div className="mb-4">
              <h2 className="text-sm font-bold text-foreground">Typography</h2>
              <p className="text-2xs text-muted-custom mt-0.5">Font family applied across the invoice document</p>
            </div>
            <div className="space-y-2">
              {FONT_OPTIONS.map((font) => {
                const isSelected = selectedFont === font.tag;
                return (
                  <button
                    key={font.tag}
                    onClick={() => ws.setDefFont(font.tag)}
                    className={`w-full text-left rounded-xl border px-4 py-3 flex items-center justify-between transition-all ${
                      isSelected
                        ? "border-accent/60 bg-accent/5 ring-1 ring-accent/20"
                        : "border-border-custom bg-surface hover:border-border-custom/80"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{font.name}</p>
                      <p className="text-2xs text-muted-custom mt-0.5">{font.description}</p>
                    </div>
                    {isSelected && (
                      <span className="h-5 w-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <CheckIcon size={10} className="text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Accent Colors */}
          <section>
            <div className="mb-4">
              <h2 className="text-sm font-bold text-foreground">Accent Color</h2>
              <p className="text-2xs text-muted-custom mt-0.5">Brand color used for headers, totals, and highlights</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {ACCENT_OPTIONS.map((acc) => {
                const isSelected = selectedAccent === acc.name;
                return (
                  <button
                    key={acc.name}
                    onClick={() => ws.setDefAccent(acc.name)}
                    className={`w-full text-left rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
                      isSelected
                        ? "border-accent/60 bg-accent/5 ring-1 ring-accent/20"
                        : "border-border-custom bg-surface hover:border-border-custom/80"
                    }`}
                  >
                    <div
                      className="h-6 w-6 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: acc.hex }}
                    />
                    <span className="text-xs font-semibold text-foreground flex-1">{acc.name}</span>
                    <span className="text-2xs font-mono text-muted-custom">{acc.hex}</span>
                    {isSelected && (
                      <span className="h-5 w-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <CheckIcon size={10} className="text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Active config summary */}
        <section className="rounded-xl border border-border-custom bg-surface p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-foreground">Active Configuration</p>
            <p className="text-2xs text-muted-custom mt-1">
              Template: <span className="text-foreground font-semibold">{selectedTemplate.name}</span>
              {" · "}Font: <span className="text-foreground font-semibold">{selectedFont}</span>
              {" · "}Accent: <span className="text-foreground font-semibold">{selectedAccent}</span>
            </p>
          </div>
          <button
            onClick={onNewInvoice}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
          >
            <TemplatesIcon size={13} />
            Use This Template
          </button>
        </section>
      </main>
    </motion.div>
  );
};
