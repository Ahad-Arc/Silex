"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "./components/Sidebar";
import { MetricCard } from "./components/MetricCard";
import { useWorkspace } from "./lib/useWorkspace";
import { useProfile } from "./lib/useProfile";
import { useClients } from "./lib/useClients";
import { useInvoices } from "./lib/useInvoices";
import type { PersistedInvoice } from "./lib/useInvoices";
import { formatCurrency } from "./lib/currencies";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionPresets } from "./lib/motionPresets";
import {
  SearchIcon,
  PlusIcon,
  MenuIcon,
  CheckIcon,
  ClockIcon,
  AlertIcon,
} from "./components/Icons";
import { ToastContainer, useToast } from "./components/Toast";
import type { Invoice } from "./components/InvoiceDrawer";

// Lazy loaded page modules to reduce initial script footprint and memory footprint
const InvoiceBuilder = dynamic(() => import("./components/InvoiceBuilder").then((m) => m.InvoiceBuilder), { ssr: false });
const InvoiceDrawer = dynamic(() => import("./components/InvoiceDrawer").then((m) => m.InvoiceDrawer), { ssr: false });
const InvoicesPage = dynamic(() => import("./components/pages/InvoicesPage").then((m) => m.InvoicesPage), { ssr: false });
const ClientsPage = dynamic(() => import("./components/pages/ClientsPage").then((m) => m.ClientsPage), { ssr: false });
const TemplatesPage = dynamic(() => import("./components/pages/TemplatesPage").then((m) => m.TemplatesPage), { ssr: false });
const PaymentsPage = dynamic(() => import("./components/pages/PaymentsPage").then((m) => m.PaymentsPage), { ssr: false });
const SettingsPage = dynamic(() => import("./components/pages/SettingsPage").then((m) => m.SettingsPage), { ssr: false });
const ConfirmModal = dynamic(() => import("./components/ConfirmModal").then((m) => m.ConfirmModal), { ssr: false });
const CommandPalette = dynamic(() => import("./components/CommandPalette").then((m) => m.CommandPalette), { ssr: false });

// Shimmering skeleton layouts
import {
  DashboardSkeleton,
  InvoicesSkeleton,
  ClientsSkeleton,
  PaymentsSkeleton,
  TemplatesSkeleton,
  SettingsSkeleton,
  InvoiceBuilderSkeleton,
} from "./components/skeletons/Skeletons";

type SidebarPage = "Dashboard" | "Invoices" | "Clients" | "Templates" | "Payments" | "Settings";

const formatChange = (val: number) => {
  if (isNaN(val) || !isFinite(val) || val === 0) return "0%";
  return `${val > 0 ? "+" : ""}${val.toFixed(1)}%`;
};

const getTrend = (val: number) => {
  return val >= 0 ? "up" : "down";
};

export default function App() {
  const ws = useWorkspace();
  const profileState = useProfile();
  const { invoices, loading: invLoading, upsertInvoice, updateStatus, deleteInvoice } = useInvoices(ws.workspaceId);
  const { clients, loading: cliLoading, addClient, updateClient, deleteClient, getClient } = useClients(ws.workspaceId);

  const [activePage, setActivePage] = useState<SidebarPage>("Dashboard");
  const [viewMode, setViewMode] = useState<"shell" | "builder">("shell");
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Paid" | "Pending" | "Overdue">("All");

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Shell keyboard and loader states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const { toasts, addToast, dismissToast } = useToast();
  const { pageTransition, fadeInVariants } = useMotionPresets();

  // Synchronize dynamic loading state from database queries
  useEffect(() => {
    if (!ws.loading && !invLoading && !cliLoading && !profileState.loading) {
      setIsPageLoading(false);
    } else {
      setIsPageLoading(true);
    }
  }, [ws.loading, invLoading, cliLoading, profileState.loading]);

  // Run idempotent LocalStorage -> Supabase migration on workspace load
  useEffect(() => {
    if (ws.workspaceId) {
      const runSync = async () => {
        try {
          const { migrateLocalStorageToSupabase } = await import("./lib/supabase/migrator");
          await migrateLocalStorageToSupabase(ws.workspaceId!);
        } catch (e) {
          console.error("Migration failed:", e);
        }
      };
      runSync();
    }
  }, [ws.workspaceId]);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleUpdateStatus = useCallback(
    (id: string, newStatus: "Paid" | "Pending" | "Overdue") => {
      updateStatus(id, newStatus);
      setSelectedInvoice((prev) =>
        prev && prev.id === id ? { ...prev, status: newStatus } : prev
      );
    },
    [updateStatus]
  );

  const handleDeleteInvoice = useCallback(
    (id: string) => {
      setConfirmConfig({
        isOpen: true,
        title: "Delete Invoice",
        message: `Are you sure you want to delete invoice ${id}? This action cannot be undone.`,
        confirmLabel: "Delete",
        onConfirm: () => {
          deleteInvoice(id);
          setSelectedInvoice(null);
          setIsDrawerOpen(false);
          addToast("Invoice deleted successfully", "success");
        },
      });
    },
    [deleteInvoice, addToast]
  );

  const handleDeleteClient = useCallback(
    (id: string) => {
      const client = clients.find((c) => c.id === id);
      if (!client) return;
      setConfirmConfig({
        isOpen: true,
        title: "Delete Client",
        message: `Are you sure you want to delete client "${client.displayName}"? This only removes the client record — invoices are kept.`,
        confirmLabel: "Delete",
        onConfirm: () => {
          deleteClient(id);
          addToast("Client deleted successfully", "success");
        },
      });
    },
    [clients, deleteClient, addToast]
  );

  const handleAutoSave = useCallback(
    (updatedInvoice: Invoice) => {
      upsertInvoice(updatedInvoice as PersistedInvoice);
    },
    [upsertInvoice]
  );

  const handleSaveAndExit = useCallback(
    (updatedInvoice: Invoice) => {
      const isNew = !invoices.some((inv) => inv.id === updatedInvoice.id);
      upsertInvoice(updatedInvoice as PersistedInvoice);
      setViewMode("shell");
      setActivePage("Dashboard");
      addToast(
        isNew ? "Invoice created successfully" : "Invoice saved successfully",
        "success",
        `${updatedInvoice.id} · ${updatedInvoice.clientName} · ${formatCurrency(updatedInvoice.amount, updatedInvoice.currency)}`
      );
    },
    [invoices, upsertInvoice, addToast]
  );

  const openBuilder = useCallback(
    (invoice: Invoice | null = null, clientId?: string) => {
      if (invoice === null && clientId) {
        const client = getClient(clientId);
        if (client) {
          const address = [
            client.billingAddress, client.billingCity,
            client.billingState, client.billingCountry,
          ].filter(Boolean).join(", ");
          const prefilled: Invoice = {
            id: "",
            clientId,
            clientName: client.displayName,
            clientEmail: client.email,
            clientAddress: address,
            date: "",
            dueDate: "",
            amount: 0,
            status: "Pending",
            items: [],
            currency: client.currency || ws.defCurrency,
          };
          setActiveInvoice(prefilled);
          setViewMode("builder");
          return;
        }
      }
      setActiveInvoice(invoice);
      setViewMode("builder");
    },
    [getClient, ws.defCurrency]
  );

  // Global keyboard shortcuts hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K -> Command Palette (Only when not in builder mode)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        if (viewMode === "shell") {
          e.preventDefault();
          setIsCommandPaletteOpen((prev) => !prev);
        }
      }
      // ⌘N or Ctrl+N -> New Invoice (Anywhere)
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        openBuilder(null);
      }
      // Esc -> Close palette, drawer, modals
      if (e.key === "Escape") {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        } else if (confirmConfig.isOpen) {
          setConfirmConfig((c) => ({ ...c, isOpen: false }));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, isCommandPaletteOpen, isDrawerOpen, confirmConfig.isOpen, openBuilder]);

  // Global command palette commands definition
  const globalCommands = useMemo(() => {
    return [
      { name: "Go to Dashboard", action: () => { setActivePage("Dashboard"); setViewMode("shell"); }, category: "Navigation" as const },
      { name: "Go to Invoices", action: () => { setActivePage("Invoices"); setViewMode("shell"); }, category: "Navigation" as const },
      { name: "Go to Clients", action: () => { setActivePage("Clients"); setViewMode("shell"); }, category: "Navigation" as const },
      { name: "Go to Templates", action: () => { setActivePage("Templates"); setViewMode("shell"); }, category: "Navigation" as const },
      { name: "Go to Payments", action: () => { setActivePage("Payments"); setViewMode("shell"); }, category: "Navigation" as const },
      { name: "Go to Settings", action: () => { setActivePage("Settings"); setViewMode("shell"); }, category: "Navigation" as const },
      { name: "Create New Invoice", action: () => openBuilder(null), category: "Actions" as const, shortcut: "⌘N" },
      { name: "Accent: Indigo", action: () => ws.setDefAccent("Indigo"), category: "Design Defaults" as const },
      { name: "Accent: Emerald", action: () => ws.setDefAccent("Emerald"), category: "Design Defaults" as const },
      { name: "Accent: Violet", action: () => ws.setDefAccent("Violet"), category: "Design Defaults" as const },
      { name: "Accent: Rose", action: () => ws.setDefAccent("Rose"), category: "Design Defaults" as const },
      { name: "Accent: Slate", action: () => ws.setDefAccent("Slate"), category: "Design Defaults" as const },
      { name: "Font: Inter (Sans-serif)", action: () => ws.setDefFont("Sans"), category: "Design Defaults" as const },
      { name: "Font: Georgia (Serif)", action: () => ws.setDefFont("Serif"), category: "Design Defaults" as const },
      { name: "Font: JetBrains Mono", action: () => ws.setDefFont("Mono"), category: "Design Defaults" as const },
      { name: "Font: Outfit (Modern Clean)", action: () => ws.setDefFont("Modern"), category: "Design Defaults" as const },
    ];
  }, [openBuilder, ws]);

  const metrics = useMemo(() => {
    const totalRev = invoices.reduce((s, inv) => s + inv.amount, 0);
    const paidRev = invoices.filter((inv) => inv.status === "Paid").reduce((s, inv) => s + inv.amount, 0);
    const pendingRev = invoices.filter((inv) => inv.status === "Pending").reduce((s, inv) => s + inv.amount, 0);

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString("en-US", { month: "short" }),
      };
    });

    const trendVolume = months.map(() => 0);
    const trendPaid = months.map(() => 0);
    const trendPending = months.map(() => 0);
    const trendSettlement = months.map(() => 0);

    invoices.forEach((inv) => {
      const d = new Date(Date.parse(inv.date) || Date.now());
      const y = d.getFullYear();
      const m = d.getMonth();
      const idx = months.findIndex((item) => item.year === y && item.month === m);
      if (idx !== -1) {
        trendVolume[idx] += inv.amount;
        if (inv.status === "Paid") {
          trendPaid[idx] += inv.amount;
        } else if (inv.status === "Pending") {
          trendPending[idx] += inv.amount;
        }
      }
    });

    for (let i = 0; i < 6; i++) {
      const vol = trendVolume[i];
      const paid = trendPaid[i];
      trendSettlement[i] = vol > 0 ? (paid / vol) * 100 : 0;
    }

    let volumeChange = 0;
    let paidChange = 0;
    let pendingChange = 0;
    let settlementChange = 0;

    if (trendVolume[4] > 0) volumeChange = ((trendVolume[5] - trendVolume[4]) / trendVolume[4]) * 100;
    if (trendPaid[4] > 0) paidChange = ((trendPaid[5] - trendPaid[4]) / trendPaid[4]) * 100;
    if (trendPending[4] > 0) pendingChange = ((trendPending[5] - trendPending[4]) / trendPending[4]) * 100;
    if (trendSettlement[4] > 0) settlementChange = ((trendSettlement[5] - trendSettlement[4]) / trendSettlement[4]) * 100;

    return {
      totalRevenue: totalRev,
      paidRevenue: paidRev,
      pendingRevenue: pendingRev,
      growth: totalRev > 0 ? (paidRev / totalRev) * 100 : 0,
      sparklines: {
        volume: trendVolume,
        paid: trendPaid,
        pending: trendPending,
        settlement: trendSettlement,
      },
      changes: {
        volume: volumeChange,
        paid: paidChange,
        pending: pendingChange,
        settlement: settlementChange,
      }
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = selectedFilter === "All" || inv.status === selectedFilter;
      return matchSearch && matchFilter;
    });
  }, [invoices, searchQuery, selectedFilter]);

  return (
    <AnimatePresence mode="wait">
      {viewMode === "builder" ? (
        <motion.div
          key="builder"
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="h-screen w-screen overflow-hidden relative"
        >
          {isPageLoading ? (
            <InvoiceBuilderSkeleton />
          ) : (
            <InvoiceBuilder
              invoice={activeInvoice}
              onAutoSave={handleAutoSave}
              onSaveAndExit={handleSaveAndExit}
              onCancel={() => setViewMode("shell")}
              brandKit={ws}
              defaultCurrency={ws.defCurrency}
              defaultTaxRate={ws.defTaxRate}
            />
          )}
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </motion.div>
      ) : (
        <motion.div
          key="shell"
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex min-h-screen bg-background text-foreground overflow-hidden w-full relative"
        >
          <Sidebar
            activeItem={activePage}
            onSelect={(item) => setActivePage(item as SidebarPage)}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            profileState={profileState}
          />

          <AnimatePresence mode="wait">
            {isPageLoading ? (
              activePage === "Dashboard" ? <DashboardSkeleton key="DashboardSkeleton" /> :
              activePage === "Invoices" ? <InvoicesSkeleton key="InvoicesSkeleton" /> :
              activePage === "Clients" ? <ClientsSkeleton key="ClientsSkeleton" /> :
              activePage === "Payments" ? <PaymentsSkeleton key="PaymentsSkeleton" /> :
              activePage === "Templates" ? <TemplatesSkeleton key="TemplatesSkeleton" /> :
              <SettingsSkeleton key="SettingsSkeleton" />
            ) : (
              <>
                {activePage === "Invoices" && (
                  <InvoicesPage
                    key="Invoices"
                    invoices={invoices}
                    onNewInvoice={() => openBuilder(null)}
                    onEditInvoice={openBuilder}
                    onUpdateStatus={handleUpdateStatus}
                    onDeleteInvoice={handleDeleteInvoice}
                    onSelectInvoice={(inv) => {
                      setSelectedInvoice(inv);
                      setIsDrawerOpen(true);
                    }}
                    defaultCurrency={ws.defCurrency}
                  />
                )}

                {activePage === "Clients" && (
                  <ClientsPage
                    key="Clients"
                    invoices={invoices}
                    clients={clients}
                    onNewInvoice={(clientId) => openBuilder(null, clientId)}
                    onEditInvoice={(inv) => openBuilder(inv)}
                    onAddClient={addClient}
                    onUpdateClient={updateClient}
                    onDeleteClient={handleDeleteClient}
                    onUpdateStatus={handleUpdateStatus}
                    defaultCurrency={ws.defCurrency}
                  />
                )}

                {activePage === "Templates" && (
                  <TemplatesPage key="Templates" ws={ws} onNewInvoice={() => openBuilder(null)} />
                )}

                {activePage === "Payments" && (
                  <PaymentsPage
                    key="Payments"
                    invoices={invoices}
                    onUpdateStatus={handleUpdateStatus}
                    defaultCurrency={ws.defCurrency}
                  />
                )}

                {activePage === "Settings" && <SettingsPage key="Settings" ws={ws} profileState={profileState} />}

                {activePage === "Dashboard" && (
                  <motion.div
                    key="Dashboard"
                    variants={pageTransition}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen"
                  >
                    <header className="border-b border-border-custom px-6 py-4 flex items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-30">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsMobileSidebarOpen(true)}
                          className="sm:hidden p-1.5 rounded-lg border border-border-custom hover:bg-surface text-muted-custom transition-all"
                        >
                          <MenuIcon size={18} />
                        </button>
                        <div>
                          <h1 className="text-lg font-bold tracking-tight text-foreground">Dashboard</h1>
                          <p className="text-2xs text-muted-custom font-medium mt-0.5">
                            Overview of your invoicing activity and revenue metrics.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                          <span className="absolute left-3 top-2.5 text-muted-custom">
                            <SearchIcon size={14} />
                          </span>
                          <input
                            type="text"
                            placeholder="Search invoices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-[200px] lg:w-[240px] rounded-lg border border-border-custom bg-surface py-1.5 pl-9 pr-4 text-xs text-foreground placeholder-muted-custom transition-all focus:w-[280px] focus:border-accent focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => openBuilder(null)}
                          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-md shadow-accent/10"
                        >
                          <PlusIcon size={14} />
                          New Invoice
                        </button>
                      </div>
                    </header>

                    <main className="p-6 space-y-8 flex-1">
                      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                          title="Total Volume"
                          value={formatCurrency(metrics.totalRevenue, ws.defCurrency)}
                          change={formatChange(metrics.changes.volume)}
                          trend={getTrend(metrics.changes.volume)}
                          sparklineData={metrics.sparklines.volume}
                        />
                        <MetricCard
                          title="Paid Invoices"
                          value={formatCurrency(metrics.paidRevenue, ws.defCurrency)}
                          change={formatChange(metrics.changes.paid)}
                          trend={getTrend(metrics.changes.paid)}
                          sparklineData={metrics.sparklines.paid}
                        />
                        <MetricCard
                          title="Pending Balance"
                          value={formatCurrency(metrics.pendingRevenue, ws.defCurrency)}
                          change={formatChange(metrics.changes.pending)}
                          trend={getTrend(metrics.changes.pending)}
                          sparklineData={metrics.sparklines.pending}
                        />
                        <MetricCard
                          title="Settlement Rate"
                          value={`${metrics.growth.toFixed(1)}%`}
                          change={formatChange(metrics.changes.settlement)}
                          trend={getTrend(metrics.changes.settlement)}
                          sparklineData={metrics.sparklines.settlement}
                        />
                      </section>

                      <section className="rounded-xl border border-border-custom bg-surface overflow-hidden">
                        <div className="border-b border-border-custom px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-2">
                            {(["All", "Paid", "Pending", "Overdue"] as const).map((filter) => (
                              <button
                                key={filter}
                                onClick={() => setSelectedFilter(filter)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                  selectedFilter === filter
                                    ? "bg-background text-foreground border border-border-custom"
                                    : "text-muted-custom hover:text-foreground border border-transparent"
                                }`}
                              >
                                {filter}
                              </button>
                            ))}
                          </div>
                          <div className="relative md:hidden">
                            <span className="absolute left-3 top-2.5 text-muted-custom">
                              <SearchIcon size={14} />
                            </span>
                            <input
                              type="text"
                              placeholder="Search invoices..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full rounded-lg border border-border-custom bg-background py-1.5 pl-9 pr-4 text-xs text-foreground placeholder-muted-custom focus:border-accent focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-background/50 text-muted-custom font-semibold">
                              <tr>
                                <th className="px-6 py-4">Invoice ID</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-custom">
                              {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((inv) => (
                                  <tr
                                    key={inv.id}
                                    onClick={() => {
                                      setSelectedInvoice(inv);
                                      setIsDrawerOpen(true);
                                    }}
                                    className="group hover:bg-background/40 cursor-pointer transition-colors duration-150"
                                  >
                                    <td className="px-6 py-4 font-mono font-medium text-foreground">{inv.invoiceNumber || inv.id}</td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-full bg-background border border-border-custom text-2xs font-bold text-accent flex items-center justify-center">
                                          {inv.clientName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-foreground group-hover:text-accent transition-colors">
                                            {inv.clientName}
                                          </p>
                                          <p className="text-2xs text-muted-custom mt-0.5">{inv.clientEmail}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-custom">{inv.date}</td>
                                    <td className="px-6 py-4 text-right font-medium text-foreground">
                                      {formatCurrency(inv.amount, inv.currency)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold border ${
                                          inv.status === "Paid"
                                            ? "border-success-custom/20 bg-success-custom/10 text-success-custom"
                                            : inv.status === "Pending"
                                            ? "border-accent/20 bg-accent/10 text-accent"
                                            : "border-red-500/20 bg-red-500/10 text-red-500"
                                        }`}
                                      >
                                        {inv.status === "Paid" && <CheckIcon size={10} />}
                                        {inv.status === "Pending" && <ClockIcon size={10} />}
                                        {inv.status === "Overdue" && <AlertIcon size={10} />}
                                        {inv.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-6 py-12 text-center text-muted-custom">
                                    No matching invoices found. Try adjusting filters or search.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </main>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>

          {(activePage === "Dashboard" || activePage === "Invoices") && (
            <InvoiceDrawer
              invoice={selectedInvoice}
              isOpen={isDrawerOpen}
              onClose={() => {
                setIsDrawerOpen(false);
                setSelectedInvoice(null);
              }}
              onUpdateStatus={handleUpdateStatus}
              onDeleteInvoice={handleDeleteInvoice}
              onEditInvoice={(invoice) => {
                setIsDrawerOpen(false);
                openBuilder(invoice);
              }}
            />
          )}

          <ConfirmModal
            {...confirmConfig}
            onClose={() => setConfirmConfig((c) => ({ ...c, isOpen: false }))}
          />

          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            commands={globalCommands}
          />

          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
