import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Logo,
  PlusIcon,
  TrashIcon,
  FileDownIcon,
  CheckIcon,
  SaveIcon,
  UndoIcon,
  TypeIcon,
  SpacingIcon,
  SparklesIcon,
  EyeIcon,
  CommandIcon,
  FocusIcon,
  CloseIcon,
} from "./Icons";
import { Invoice } from "./InvoiceDrawer";
import { PDFPreview } from "./PDFPreview";
import { BrandKitPanel } from "./BrandKitUploader";
import { CURRENCIES, formatCurrency, getCurrency } from "../lib/currencies";
import { InvoiceCanvas } from "./InvoiceCanvas";
import { Workspace } from "../lib/useWorkspace";

interface InvoiceBuilderProps {
  invoice: Invoice | null;
  /** Silent background sync — called by auto-save. Does NOT navigate away. */
  onAutoSave: (updatedInvoice: Invoice) => void;
  /** Explicit save — saves, shows toast, and returns to dashboard. */
  onSaveAndExit: (updatedInvoice: Invoice) => void;
  onCancel: () => void;
  /** Workspace default currency — C3: new invoices inherit this. */
  defaultCurrency?: string;
  /** Workspace default tax rate — C4: removes the hardcoded 10% default. */
  defaultTaxRate?: number;
  /** Workspace-level brand kit — persisted in localStorage via useWorkspace() */
  brandKit: Workspace;
}

type TemplateType = "Minimal" | "Classic" | "Modern" | "Compact";
type FontType = "Sans" | "Serif" | "Mono" | "Modern";
type AccentColorType = "Indigo" | "Emerald" | "Violet" | "Rose" | "Slate";
type SpacingType = "Compact" | "Cozy" | "Spacious";
type LogoPresetType = "Silex" | "Monogram" | "Diamond" | "None";

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({
  invoice,
  onAutoSave,
  onSaveAndExit,
  onCancel,
  defaultCurrency,
  defaultTaxRate,
  brandKit,
}) => {
  // --- INVOICE STATE ---
  const [id, setId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientTaxId, setClientTaxId] = useState("US-94829381");
  const [companyName, setCompanyName] = useState("SILEX TECHNOLOGIES INC");
  const [companyAddress, setCompanyAddress] = useState("100 Pine Street, San Francisco, CA 94111");
  const [companyTaxId, setCompanyTaxId] = useState("US-12948281");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<Invoice["items"]>([]);
  const [taxRate, setTaxRate] = useState(() => defaultTaxRate ?? 0); // C4: workspace default, not hardcoded 10%
  const [discountRate, setDiscountRate] = useState(0);
  const [notes, setNotes] = useState("Thank you for your business. Payment is due within 30 days via wire transfer.");
  const [paymentTerms, setPaymentTerms] = useState("Bank: Silicon Valley Bank\nAccount: 9482-1029-4828\nRouting: 121000248");
  const [currency, setCurrency] = useState(() => defaultCurrency ?? "USD"); // C3: workspace default

  // --- DESIGN SETTINGS ---
  const [template, setTemplate] = useState<TemplateType>("Modern");
  const [font, setFont] = useState<FontType>("Sans");
  const [accent, setAccent] = useState<AccentColorType>("Indigo");
  const [spacing, setSpacing] = useState<SpacingType>("Cozy");
  const [logoPreset, setLogoPreset] = useState<LogoPresetType>("Silex");

  // --- BRAND KIT — sourced from workspace-level brandKit prop (persisted) ---
  const logoDataUrl    = brandKit.logoDataUrl;
  const stampDataUrl   = brandKit.stampDataUrl;
  const watermarkEnabled = brandKit.stampEnabled;
  const watermarkOpacity = brandKit.stampOpacity;

  // --- FOCUS, Auto-Save, Palette States ---
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"Saved just now" | "Saving..." | "Unsaved changes">("Saved just now");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);

  // --- NEW PDF ENGINE STATES ---
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [isPDFDownloading, setIsPDFDownloading] = useState(false);

  // Skip auto-save on initial mount
  const isInitialMount = useRef(true);

  // Initialize fields on load
  useEffect(() => {
    if (invoice) {
      setId(invoice.id);
      setClientName(invoice.clientName);
      setClientEmail(invoice.clientEmail);
      setClientAddress(invoice.clientAddress);
      setDate(invoice.date);
      setDueDate(invoice.dueDate);
      setItems(invoice.items);
      setCurrency(invoice.currency ?? defaultCurrency ?? "USD");
      setCompanyName(invoice.companyName ?? brandKit.bizName);
      setCompanyAddress(invoice.companyAddress ?? [brandKit.bizAddress, brandKit.bizCity, brandKit.bizState, brandKit.bizPostal, brandKit.bizCountry].filter(Boolean).join(", "));
      setCompanyTaxId(invoice.companyTaxId ?? brandKit.bizGstin);
      setClientTaxId(invoice.clientTaxId ?? "");
      setTaxRate(invoice.taxRate ?? defaultTaxRate ?? 0);
      setDiscountRate(invoice.discountRate ?? 0);
      setNotes(invoice.notes ?? "Thank you for your business. Payment is due within 30 days via wire transfer.");
      setPaymentTerms(invoice.paymentTerms ?? "Bank: Silicon Valley Bank\nAccount: 9482-1029-4828\nRouting: 121000248");
      setTemplate((invoice.template as TemplateType) ?? (brandKit.defTemplate as TemplateType) ?? "Modern");
      setFont((invoice.font as FontType) ?? (brandKit.defFont as FontType) ?? "Sans");
      setAccent((invoice.accent as AccentColorType) ?? (brandKit.defAccent as AccentColorType) ?? "Indigo");
      setSpacing((invoice.spacing as SpacingType) ?? "Cozy");
      setLogoPreset((invoice.logoPreset as LogoPresetType) ?? "Silex");
    } else {
      setId(`#INV-${Math.floor(1000 + Math.random() * 9000)}`);
      setClientName("");
      setClientEmail("");
      setClientAddress("");
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);
      const formatDate = (d: Date) =>
        d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      setDate(formatDate(today));
      setDueDate(formatDate(nextMonth));
      setItems([
        { description: "New Service Item", qty: 1, rate: 0 },
      ]);
      setCurrency(defaultCurrency ?? "USD");
      setCompanyName(brandKit.bizName);
      setCompanyAddress([brandKit.bizAddress, brandKit.bizCity, brandKit.bizState, brandKit.bizPostal, brandKit.bizCountry].filter(Boolean).join(", "));
      setCompanyTaxId(brandKit.bizGstin);
      setClientTaxId("");
      setTaxRate(defaultTaxRate ?? 0);
      setDiscountRate(0);
      setNotes("Thank you for your business. Payment is due within 30 days via wire transfer.");
      setPaymentTerms("Bank: Silicon Valley Bank\nAccount: 9482-1029-4828\nRouting: 121000248");
      setTemplate((brandKit.defTemplate as TemplateType) ?? "Modern");
      setFont((brandKit.defFont as FontType) ?? "Sans");
      setAccent((brandKit.defAccent as AccentColorType) ?? "Indigo");
      setSpacing("Cozy");
      setLogoPreset("Silex");
    }
  }, [invoice, defaultCurrency, defaultTaxRate, brandKit]);

  // --- COMPUTED TOTALS ---
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const discountVal = (subtotal * discountRate) / 100;
  const taxVal = ((subtotal - discountVal) * taxRate) / 100;
  const grandTotal = subtotal - discountVal + taxVal;

  // --- AUTOMATIC AUTO-SAVE CONTROLLER ---
  // Silently syncs the invoice list every 1.5s after a change.
  // Does NOT navigate away — that only happens on explicit Save.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus("Unsaved changes");

    const timer = setTimeout(() => {
      // Don't auto-save a blank new invoice — wait until the user has
      // entered at least a client name so we don't pollute the list.
      if (!clientName.trim()) return;

      setSaveStatus("Saving...");
      setTimeout(() => {
        const updatedInvoice: Invoice = {
          id,
          clientName,
          clientEmail,
          clientAddress,
          clientTaxId,
          companyName,
          companyAddress,
          companyTaxId,
          date,
          dueDate,
          amount: grandTotal,
          status: invoice ? invoice.status : "Pending",
          items,
          currency,
          taxRate,
          discountRate,
          notes,
          paymentTerms,
          template,
          font,
          accent,
          spacing,
          logoPreset,
        };
        onAutoSave(updatedInvoice);
        setSaveStatus("Saved just now");
      }, 600);
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    id,
    clientName,
    clientEmail,
    clientAddress,
    clientTaxId,
    companyName,
    companyAddress,
    companyTaxId,
    date,
    dueDate,
    items,
    taxRate,
    discountRate,
    notes,
    paymentTerms,
    currency,
  ]);

  // --- SHORTCUTS KEY BINDINGS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘. or Ctrl+. -> Toggle Focus Mode
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
      }
      // ⌘K or Ctrl+K -> Toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        setCommandSearch("");
        setSelectedCommandIndex(0);
      }
      // Esc -> Close Command Palette or Exit Focus Mode
      if (e.key === "Escape") {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
        } else if (isFocusMode) {
          setIsFocusMode(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, isFocusMode]);



  // --- DYNAMIC DESIGN CLASS MAPPINGS ---
  const getAccentColorHex = (a: AccentColorType) => {
    switch (a) {
      case "Indigo": return "#6366F1";
      case "Emerald": return "#00D2A0";
      case "Violet": return "#8B5CF6";
      case "Rose": return "#F43F5E";
      case "Slate": return "#3F3F46";
    }
  };

  // --- ITEM ROW ACTIONS ---
  const handleAddItem = () => {
    setItems((prev) => [...prev, { description: "New Invoice Item", qty: 1, rate: 150 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert("An invoice must contain at least one line item.");
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, field: "description" | "qty" | "rate", value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            [field]: field === "description" ? value : Number(value) || 0,
          };
        }
        return item;
      })
    );
  };

  // --- MANUAL SAVE ACTION ---
  // Validates, saves, and exits back to dashboard. Toast is shown by the parent.
  const handleSave = () => {
    if (!clientName.trim()) {
      alert("Please enter a client name before saving.");
      return;
    }
    setSaveStatus("Saving...");
    const updatedInvoice: Invoice = {
      id,
      clientName,
      clientEmail,
      clientAddress,
      clientTaxId,
      companyName,
      companyAddress,
      companyTaxId,
      date,
      dueDate,
      amount: grandTotal,
      status: invoice ? invoice.status : "Pending",
      items,
      currency,
      taxRate,
      discountRate,
      notes,
      paymentTerms,
      template,
      font,
      accent,
      spacing,
      logoPreset,
    };
    onSaveAndExit(updatedInvoice);
  };

  // --- REAL PDF DOWNLOAD ACTION VIA PUPPETEER API ---
  const handleDownloadPDF = async () => {
    setIsPDFDownloading(true);
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          clientName,
          clientEmail,
          clientAddress,
          clientTaxId,
          companyName,
          companyAddress,
          companyTaxId,
          date,
          dueDate,
          amount: grandTotal,
          items,
          notes,
          paymentTerms,
          taxRate,
          discountRate,
          template,
          font,
          accent,
          spacing,
          logoPreset,
          // Brand kit — from workspace-level store
          logoDataUrl: brandKit.logoDataUrl ?? null,
          stampDataUrl: brandKit.stampDataUrl ?? null,
          watermarkEnabled: brandKit.stampEnabled,
          watermarkOpacity: brandKit.stampOpacity,
          // Currency
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to render statement PDF");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `invoice-${id.replace("#", "")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Could not compile document PDF. Puppeteer rendering browser is initializing.");
    } finally {
      setIsPDFDownloading(false);
    }
  };

  // --- COMMAND PALETTE SPECIFIC CONFIGS ---
  const commands = useMemo(() => {
    return [
      { name: "Add Line Item", action: () => handleAddItem(), category: "Editor" },
      { name: "Save Invoice Draft", action: () => handleSave(), category: "Actions" },      { name: "Export Statement PDF", action: () => handleDownloadPDF(), category: "Actions" },
      { name: "Toggle Immersive Focus Mode", action: () => setIsFocusMode((prev) => !prev), category: "Zen" },
      { name: "Use Template: Modern", action: () => setTemplate("Modern"), category: "Layout" },
      { name: "Use Template: Classic", action: () => setTemplate("Classic"), category: "Layout" },
      { name: "Use Template: Minimal", action: () => setTemplate("Minimal"), category: "Layout" },
      { name: "Use Template: Compact", action: () => setTemplate("Compact"), category: "Layout" },
      { name: "Use Font: Sans-serif", action: () => setFont("Sans"), category: "Typography" },
      { name: "Use Font: Georgia Serif", action: () => setFont("Serif"), category: "Typography" },
      { name: "Use Font: JetBrains Mono", action: () => setFont("Mono"), category: "Typography" },
      { name: "Use Font: Outfit Clean", action: () => setFont("Modern"), category: "Typography" },
      { name: "Use Accent: Indigo", action: () => setAccent("Indigo"), category: "Branding" },
      { name: "Use Accent: Emerald", action: () => setAccent("Emerald"), category: "Branding" },
      { name: "Use Accent: Violet", action: () => setAccent("Violet"), category: "Branding" },
      { name: "Use Accent: Rose", action: () => setAccent("Rose"), category: "Branding" },
      { name: "Use Accent: Slate", action: () => setAccent("Slate"), category: "Branding" },
      { name: "Return to Invoices Dashboard", action: () => onCancel(), category: "Navigation" },
    ];
  }, [items, id, clientName, clientEmail, clientAddress, grandTotal]);

  const filteredCommands = useMemo(() => {
    if (!commandSearch.trim()) return commands;
    return commands.filter((cmd) =>
      cmd.name.toLowerCase().includes(commandSearch.toLowerCase()) ||
      cmd.category.toLowerCase().includes(commandSearch.toLowerCase())
    );
  }, [commands, commandSearch]);

  const handleCommandSelect = (index: number) => {
    const cmd = filteredCommands[index];
    if (cmd) {
      cmd.action();
      setIsCommandPaletteOpen(false);
    }
  };

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedCommandIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedCommandIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleCommandSelect(selectedCommandIndex);
    }
  };

  // --- PAGE BREAK splits detection logic ---
  const isMultiPage = items.length > 4;
  const page1Items = isMultiPage ? items.slice(0, 4) : items;
  const page2Items = isMultiPage ? items.slice(4) : [];

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-foreground select-none overflow-hidden relative">
      
      {/* 1. LEFT COLLAPSED WORKSPACE SIDEBAR */}
      <div
        className={`border-r border-border-custom bg-background flex flex-col items-center justify-between py-4 transition-all duration-500 ease-in-out z-20 ${
          isFocusMode ? "w-0 opacity-0 overflow-hidden pointer-events-none" : "w-[64px] opacity-100"
        }`}
      >
        {/* Workspace Brand */}
        <div className="space-y-6 flex flex-col items-center">
          <div className="h-9 w-9 rounded-lg bg-accent text-white flex items-center justify-center cursor-pointer shadow-md shadow-accent/10">
            <Logo size={22} />
          </div>

          <div className="h-[1px] w-6 bg-border-custom" />

          {/* Quick Nav Icons */}
          <button
            onClick={onCancel}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-custom hover:bg-surface hover:text-foreground transition-all"
            title="Back to Dashboard"
          >
            <UndoIcon size={18} />
          </button>

          <button
            onClick={handleSave}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-custom hover:bg-surface hover:text-foreground transition-all"
            title="Save changes"
          >
            <SaveIcon size={18} />
          </button>

          {/* Trigger Palette */}
          <button
            onClick={() => {
              setIsCommandPaletteOpen(true);
              setCommandSearch("");
              setSelectedCommandIndex(0);
            }}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-custom hover:bg-surface hover:text-foreground transition-all"
            title="Open Command Palette (⌘K)"
          >
            <CommandIcon size={18} />
          </button>

          {/* Focus Mode toggle */}
          <button
            onClick={() => setIsFocusMode(true)}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-custom hover:bg-surface hover:text-foreground transition-all"
            title="Zen Focus Mode (⌘.)"
          >
            <FocusIcon size={18} />
          </button>
        </div>

        {/* Status indicator */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <span className="h-2.5 w-2.5 rounded-full bg-accent block" />
            <div className="absolute left-6 bottom-0 hidden group-hover:block bg-surface border border-border-custom text-2xs px-2 py-0.5 rounded shadow whitespace-nowrap z-50">
              Personal Space
            </div>
          </div>
          <div className="h-7 w-7 rounded-full bg-surface border border-border-custom text-2xs font-bold text-accent flex items-center justify-center">
            AG
          </div>
        </div>
      </div>

      {/* 2. CENTER: WORKSPACE CANVAS AREA */}
      <div
        className={`flex-1 overflow-y-auto flex flex-col items-center py-12 px-6 relative transition-colors duration-500 ${
          isFocusMode ? "bg-[#050507]" : "bg-[#0f0f12]"
        }`}
      >
        
        {/* TOP FLOATING CONTEXT HEADER */}
        {!isFocusMode && (
          <div className="w-full max-w-[812px] mb-6 flex justify-between items-center px-4 transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="text-2xs font-semibold text-muted-custom uppercase tracking-wider">
                Document Canvas
              </span>
              <span className="h-1 w-1 rounded-full bg-border-custom" />
              <button
                onClick={() => setIsPDFPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 text-2xs text-muted-custom hover:text-accent font-mono border border-border-custom/80 bg-surface px-2 py-1 rounded transition-all"
              >
                <EyeIcon size={10} />
                Preview Print
              </button>
            </div>

            {/* Muted Auto Save Indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  saveStatus === "Saved just now"
                    ? "bg-success-custom"
                    : saveStatus === "Saving..."
                    ? "bg-accent animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-2xs font-medium text-muted-custom font-mono transition-all duration-300">
                {saveStatus}
              </span>
            </div>
          </div>
        )}

        {/* FLOATING HEADER BAR IN FOCUS MODE */}
        {isFocusMode && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md bg-[#18181b]/70 border border-border-custom px-4 py-2.5 rounded-xl flex gap-3.5 items-center shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <span className="text-3xs uppercase font-bold tracking-widest text-muted-custom px-2 border-r border-border-custom">
              Focus Mode
            </span>
            <button
              onClick={() => setIsPDFPreviewOpen(true)}
              className="text-xs font-semibold text-muted-custom hover:text-foreground flex items-center gap-1 px-1 py-0.5"
            >
              <EyeIcon size={12} />
              Preview Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="text-xs font-semibold text-muted-custom hover:text-foreground flex items-center gap-1 px-1 py-0.5"
            >
              <FileDownIcon size={12} />
              Export PDF
            </button>
            <button
              onClick={() => setIsFocusMode(false)}
              className="text-2xs bg-accent text-white px-2.5 py-1 rounded font-bold transition-opacity hover:opacity-90 flex items-center gap-1"
            >
              Exit Focus
              <span className="text-3xs opacity-80 font-mono">⌘.</span>
            </button>
          </div>
        )}

        {/* ── Invoice Canvas — template-driven layout ── */}
        <InvoiceCanvas
          id={id} clientName={clientName} clientEmail={clientEmail}
          clientAddress={clientAddress} clientTaxId={clientTaxId}
          companyName={companyName} companyAddress={companyAddress} companyTaxId={companyTaxId}
          date={date} dueDate={dueDate} items={items} notes={notes} paymentTerms={paymentTerms}
          taxRate={taxRate} discountRate={discountRate}
          subtotal={subtotal} discountVal={discountVal} taxVal={taxVal} grandTotal={grandTotal}
          currency={currency}
          template={template} font={font} accent={accent} spacing={spacing} logoPreset={logoPreset}
          logoDataUrl={brandKit.logoDataUrl} stampDataUrl={brandKit.stampDataUrl}
          watermarkEnabled={brandKit.stampEnabled} watermarkOpacity={brandKit.stampOpacity}
          focusedRow={focusedRow} onSetFocusedRow={setFocusedRow}
          onUpdateItem={handleUpdateItem} onRemoveItem={handleRemoveItem} onAddItem={handleAddItem}
          onSetId={setId} onSetDate={setDate} onSetDueDate={setDueDate}
          onSetClientName={setClientName} onSetClientEmail={setClientEmail} onSetClientAddress={setClientAddress}
          onSetCompanyName={setCompanyName} onSetCompanyAddress={setCompanyAddress} onSetCompanyTaxId={setCompanyTaxId}
          onSetNotes={setNotes} onSetPaymentTerms={setPaymentTerms}
          onSetTaxRate={setTaxRate} onSetDiscountRate={setDiscountRate}
        />
      </div>

      {/* 3. RIGHT CONFIGURATION TOOLBOX */}
      {/* 3. RIGHT CONFIGURATION TOOLBOX */}
      <div
        className={`border-l border-border-custom bg-background flex flex-col justify-between overflow-y-auto transition-all duration-500 ease-in-out z-20 ${
          isFocusMode ? "w-0 opacity-0 overflow-hidden pointer-events-none" : "w-[300px] opacity-100"
        }`}
      >
        {/* Designer controls list */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border-custom pb-4">
            <div className="flex items-center gap-2">
              <span className="text-accent">
                <SparklesIcon size={18} />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Silex Designer
              </h3>
            </div>
            <span className="text-[10px] text-muted-custom font-mono">⌘. Focus</span>
          </div>

          {/* Preset templates selector */}
          <div className="space-y-2.5">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-custom">
              Templates Preset
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["Modern", "Classic", "Minimal", "Compact"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`rounded-lg border px-3 py-2 text-2xs font-semibold text-center transition-all ${
                    template === t
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border-custom bg-surface text-muted-custom hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Spacing adjustments */}
          <div className="space-y-2.5">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-custom">
              Margins & Spacing
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(["Compact", "Cozy", "Spacious"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpacing(s)}
                  className={`rounded-lg border py-1.5 text-3xs font-semibold text-center transition-all ${
                    spacing === s
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border-custom bg-surface text-muted-custom hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Typography options */}
          <div className="space-y-2.5">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-custom">
              Typography Font
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["Sans", "Serif", "Mono", "Modern"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFont(f)}
                  className={`rounded-lg border px-3 py-2 text-2xs font-semibold text-center transition-all ${
                    font === f
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border-custom bg-surface text-muted-custom hover:text-foreground"
                  }`}
                >
                  {f === "Sans" && "Sans-serif"}
                  {f === "Serif" && "Georgia Serif"}
                  {f === "Mono" && "JetBrains Mono"}
                  {f === "Modern" && "Outfit Clean"}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Palettes */}
          <div className="space-y-2.5">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-custom">
              Accent Branding Color
            </span>
            <div className="flex gap-2.5 justify-between">
              {(["Indigo", "Emerald", "Violet", "Rose", "Slate"] as const).map((a) => {
                const colorHex = getAccentColorHex(a);
                const isSelected = accent === a;
                return (
                  <button
                    key={a}
                    onClick={() => setAccent(a)}
                    className={`h-7 w-7 rounded-full flex items-center justify-center transition-all hover:scale-110 relative ${
                      isSelected
                        ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                        : ""
                    }`}
                    style={{ backgroundColor: colorHex }}
                    title={`${a} Accent`}
                  >
                    {isSelected && (
                      <CheckIcon size={12} className={a === "Emerald" ? "text-slate-900" : "text-white"} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logo Presets Selection */}
          <div className="space-y-2.5">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-custom">
              Brand Monogram Logo
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {(["Silex", "Monogram", "Diamond", "None"] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setLogoPreset(preset)}
                  className={`rounded-lg border py-1.5 text-3xs font-semibold text-center transition-all ${
                    logoPreset === preset
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border-custom bg-surface text-muted-custom hover:text-foreground"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* ── Brand Kit ─────────────────────────────────────────────── */}
          <BrandKitPanel
            logoDataUrl={brandKit.logoDataUrl}
            stampDataUrl={brandKit.stampDataUrl}
            stampOpacity={brandKit.stampOpacity}
            stampEnabled={brandKit.stampEnabled}
            onSetLogo={(url) => {
              brandKit.setLogo(url);
              if (url) setLogoPreset("None");
            }}
            onSetStamp={brandKit.setStamp}
            onStampOpacity={brandKit.setStampOpacity}
            onStampToggle={brandKit.setStampEnabled}
          />
        </div>

        {/* Global Action Operations */}
        <div className="p-6 border-t border-border-custom bg-background/50 space-y-3">
          <button
            onClick={() => setIsPDFPreviewOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border-custom py-2 text-xs font-semibold text-foreground hover:bg-surface hover:text-foreground transition-all active:scale-95"
          >
            <EyeIcon size={14} />
            Preview Print Layout
          </button>

          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border-custom py-2 text-xs font-semibold text-foreground hover:bg-surface hover:text-foreground transition-all active:scale-95"
          >
            <FileDownIcon size={14} />
            Export Statement PDF
          </button>

          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-md shadow-accent/10"
          >
            <CheckIcon size={14} />
            Save Invoice Draft
          </button>

          <button
            onClick={onCancel}
            className="w-full rounded-lg py-2 text-xs font-semibold text-muted-custom hover:bg-surface hover:text-foreground transition-all text-center block"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* 4. FLOATING COMMAND PALETTE OVERLAY (⌘K / Ctrl+K) */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-start justify-center pt-24 px-4">
          <div
            onKeyDown={handlePaletteKeyDown}
            className="w-full max-w-lg bg-[#121215] border border-border-custom rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col"
          >
            <div className="relative border-b border-border-custom flex items-center px-4">
              <span className="text-muted-custom">
                <CommandIcon size={16} />
              </span>
              <input
                autoFocus
                type="text"
                value={commandSearch}
                onChange={(e) => {
                  setCommandSearch(e.target.value);
                  setSelectedCommandIndex(0);
                }}
                className="w-full py-3.5 pl-3 pr-8 bg-transparent text-sm text-foreground focus:outline-none placeholder-muted-custom"
                placeholder="Search commands or layout actions..."
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="absolute right-4 p-1 rounded-md text-muted-custom hover:bg-surface hover:text-foreground transition-all"
              >
                <CloseIcon size={14} />
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2 space-y-0.5">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => {
                  const isSelected = selectedCommandIndex === idx;
                  return (
                    <button
                      key={cmd.name}
                      onClick={() => handleCommandSelect(idx)}
                      className={`w-full text-left rounded-lg px-3.5 py-2.5 flex justify-between items-center text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-accent/15 text-accent border border-accent/20"
                          : "text-muted-custom border border-transparent hover:bg-surface/50 hover:text-foreground"
                      }`}
                    >
                      <span>{cmd.name}</span>
                      <span className="text-[10px] text-muted-custom uppercase font-semibold bg-surface border border-border-custom px-2 py-0.5 rounded font-mono">
                        {cmd.category}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-muted-custom font-medium">
                  No matching workspace actions found.
                </div>
              )}
            </div>

            <div className="border-t border-border-custom/50 px-4 py-2.5 bg-background/50 flex justify-between items-center text-[10px] text-muted-custom font-mono">
              <div className="flex gap-2">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
              </div>
              <span>ESC Close</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. GLASSMORPHIC PDF GENERATION EXPORT LOADER */}
      {isPDFDownloading && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 overflow-hidden">
          {/* Animated A4 Page Skeleton */}
          <div className="w-[595px] h-[842px] bg-surface border border-border-custom rounded-xl p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden scale-90 md:scale-95 lg:scale-100">
            {/* Top Bar Shimmer */}
            <div className="flex justify-between items-start">
              {/* Logo / Company Info */}
              <div className="space-y-3">
                <div className="w-24 h-8 rounded bg-border-custom/50 animate-shimmer" />
                <div className="w-32 h-3 rounded bg-border-custom/30 animate-shimmer" />
                <div className="w-24 h-3 rounded bg-border-custom/30 animate-shimmer" />
              </div>
              {/* Invoice ID / Date */}
              <div className="space-y-3 flex flex-col items-end">
                <div className="w-28 h-6 rounded bg-border-custom/50 animate-shimmer" />
                <div className="w-20 h-3 rounded bg-border-custom/30 animate-shimmer" />
                <div className="w-24 h-3 rounded bg-border-custom/30 animate-shimmer" />
              </div>
            </div>

            {/* Bill To / Ship To Section */}
            <div className="mt-12 flex justify-between">
              <div className="space-y-3">
                <div className="w-16 h-3 rounded bg-border-custom/40 animate-shimmer" />
                <div className="w-32 h-4 rounded bg-border-custom/50 animate-shimmer" />
                <div className="w-40 h-3 rounded bg-border-custom/30 animate-shimmer" />
                <div className="w-28 h-3 rounded bg-border-custom/30 animate-shimmer" />
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="mt-12 flex-1 flex flex-col">
              {/* Table Header */}
              <div className="border-b border-border-custom pb-3 flex justify-between">
                <div className="w-32 h-3 rounded bg-border-custom/40 animate-shimmer" />
                <div className="flex gap-12">
                  <div className="w-8 h-3 rounded bg-border-custom/40 animate-shimmer" />
                  <div className="w-12 h-3 rounded bg-border-custom/40 animate-shimmer" />
                  <div className="w-16 h-3 rounded bg-border-custom/40 animate-shimmer" />
                </div>
              </div>
              {/* Table Rows */}
              <div className="divide-y divide-border-custom/40 flex-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-4 flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="w-48 h-3.5 rounded bg-border-custom/50 animate-shimmer" />
                      <div className="w-32 h-2.5 rounded bg-border-custom/30 animate-shimmer" />
                    </div>
                    <div className="flex gap-12 items-center">
                      <div className="w-8 h-3 rounded bg-border-custom/30 animate-shimmer" />
                      <div className="w-12 h-3 rounded bg-border-custom/30 animate-shimmer" />
                      <div className="w-16 h-3 rounded bg-border-custom/50 animate-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Total / Notes Section */}
            <div className="mt-8 pt-6 border-t border-border-custom flex justify-between items-end">
              {/* Notes */}
              <div className="space-y-2">
                <div className="w-20 h-3 rounded bg-border-custom/40 animate-shimmer" />
                <div className="w-64 h-3 rounded bg-border-custom/30 animate-shimmer" />
                <div className="w-48 h-3 rounded bg-border-custom/30 animate-shimmer" />
              </div>
              {/* Totals */}
              <div className="space-y-3 w-44">
                <div className="flex justify-between">
                  <div className="w-12 h-3 rounded bg-border-custom/30 animate-shimmer" />
                  <div className="w-16 h-3 rounded bg-border-custom/30 animate-shimmer" />
                </div>
                <div className="flex justify-between">
                  <div className="w-8 h-3 rounded bg-border-custom/30 animate-shimmer" />
                  <div className="w-12 h-3 rounded bg-border-custom/30 animate-shimmer" />
                </div>
                <div className="flex justify-between pt-3 border-t border-border-custom">
                  <div className="w-10 h-4 rounded bg-border-custom/50 animate-shimmer" />
                  <div className="w-20 h-4 rounded bg-border-custom/60 animate-shimmer" />
                </div>
              </div>
            </div>
          </div>

          {/* Text indicator overlay */}
          <div className="text-center mt-6 z-10 space-y-1">
            <p className="text-xs font-bold text-foreground tracking-wide uppercase">Generating Document PDF...</p>
            <p className="text-[10px] text-muted-custom">Silex Headless Puppeteer Engine is rendering A4 formats</p>
          </div>
        </div>
      )}

      {/* 6. INTERACTIVE PDF PRINT PREVIEW OVERLAY */}
      <PDFPreview
        invoice={{
          id,
          clientName,
          clientEmail,
          clientAddress,
          date,
          dueDate,
          amount: grandTotal,
          status: invoice ? invoice.status : "Pending",
          items,
          currency,
        }}
        isOpen={isPDFPreviewOpen}
        onClose={() => setIsPDFPreviewOpen(false)}
        onDownload={handleDownloadPDF}
        isDownloading={isPDFDownloading}
        template={template}
        font={font}
        accent={accent}
        spacing={spacing}
        logoPreset={logoPreset}
        taxRate={taxRate}
        discountRate={discountRate}
        logoDataUrl={brandKit.logoDataUrl}
        stampDataUrl={brandKit.stampDataUrl}
        watermarkEnabled={brandKit.stampEnabled}
        watermarkOpacity={brandKit.stampOpacity}
      />

    </div>
  );
};