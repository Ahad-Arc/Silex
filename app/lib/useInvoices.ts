"use client";

/**
 * useInvoices — localStorage-backed invoice store.
 *
 * Replaces the in-memory INITIAL_INVOICES constant in page.tsx.
 * Invoices persist across page refreshes. On first load the
 * SEED_INVOICES are written so the app is never empty.
 */

import { useState, useEffect, useCallback } from "react";

// ─── Types (mirrors InvoiceDrawer.Invoice) ────────────────────────────────────
export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
}

export interface PersistedInvoice {
  id: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientTaxId?: string;
  companyName?: string;
  companyAddress?: string;
  companyTaxId?: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  items: InvoiceItem[];
  currency: string;
  taxRate?: number;
  discountRate?: number;
  notes?: string;
  paymentTerms?: string;
  template?: string;
  font?: string;
  accent?: string;
  spacing?: string;
  logoPreset?: string;
}

// ─── Seed data — written only when storage is empty ──────────────────────────
const SEED_INVOICES: PersistedInvoice[] = [
  {
    id: "#INV-8492",
    clientName: "Acme Corp",
    clientEmail: "billing@acme.com",
    clientAddress: "100 Broadway, New York, NY 10005",
    date: "May 20, 2026",
    dueDate: "Jun 20, 2026",
    amount: 14850,
    status: "Paid",
    currency: "USD",
    items: [
      { description: "Enterprise Platform Subscription (Annual)", qty: 1, rate: 12000 },
      { description: "Implementation & Onboarding Support", qty: 1, rate: 2850 },
    ],
  },
  {
    id: "#INV-9021",
    clientName: "Stripe Inc",
    clientEmail: "payouts@stripe.com",
    clientAddress: "510 Townsend St, San Francisco, CA 94103",
    date: "May 25, 2026",
    dueDate: "Jun 25, 2026",
    amount: 32000,
    status: "Pending",
    currency: "USD",
    items: [{ description: "Custom Payment API Integration Consulting", qty: 2, rate: 16000 }],
  },
  {
    id: "#INV-1184",
    clientName: "Linear App",
    clientEmail: "accounts@linear.app",
    clientAddress: "88 Colin P Kelly Jr St, San Francisco, CA 94107",
    date: "May 10, 2026",
    dueDate: "Jun 10, 2026",
    amount: 8500,
    status: "Paid",
    currency: "USD",
    items: [{ description: "Silex API Custom Sync Webhooks Development", qty: 1, rate: 8500 }],
  },
  {
    id: "#INV-3392",
    clientName: "Framer B.V.",
    clientEmail: "finance@framer.com",
    clientAddress: "Prinsengracht 769, 1017 JZ Amsterdam",
    date: "Apr 15, 2026",
    dueDate: "May 15, 2026",
    amount: 6200,
    status: "Overdue",
    currency: "USD",
    items: [
      { description: "Interactive Prototyping Assets License", qty: 3, rate: 2000 },
      { description: "Tax & Hosting Fees", qty: 1, rate: 200 },
    ],
  },
  {
    id: "#INV-7741",
    clientName: "Raycast Technologies",
    clientEmail: "billing@raycast.com",
    clientAddress: "120 Howard St, London, UK",
    date: "May 27, 2026",
    dueDate: "Jun 27, 2026",
    amount: 12500,
    status: "Pending",
    currency: "USD",
    items: [{ description: "Raycast Extensions Platform Audit", qty: 1, rate: 12500 }],
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY = "sx_invoices";

function readInvoices(): PersistedInvoice[] {
  if (typeof window === "undefined") return SEED_INVOICES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      // First visit — seed the store
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INVOICES));
      return SEED_INVOICES;
    }
    const parsed = JSON.parse(raw) as PersistedInvoice[];
    // Back-fill currency for any invoices that pre-date this field
    return parsed.map((inv) => ({ ...inv, currency: inv.currency ?? "USD" }));
  } catch {
    return SEED_INVOICES;
  }
}

function writeInvoices(invoices: PersistedInvoice[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch { /* quota */ }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface InvoiceActions {
  upsertInvoice:  (invoice: PersistedInvoice) => void;
  updateStatus:   (id: string, status: "Paid" | "Pending" | "Overdue") => void;
  deleteInvoice:  (id: string) => void;
}

export function useInvoices(): { invoices: PersistedInvoice[] } & InvoiceActions {
  const [invoices, setInvoices] = useState<PersistedInvoice[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setInvoices(readInvoices());
  }, []);

  const upsertInvoice = useCallback((invoice: PersistedInvoice) => {
    setInvoices((prev) => {
      const exists = prev.some((i) => i.id === invoice.id);
      const next = exists
        ? prev.map((i) => (i.id === invoice.id ? invoice : i))
        : [invoice, ...prev];
      writeInvoices(next);
      return next;
    });
  }, []);

  const updateStatus = useCallback((id: string, status: "Paid" | "Pending" | "Overdue") => {
    setInvoices((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, status } : i));
      writeInvoices(next);
      return next;
    });
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => {
      const next = prev.filter((i) => i.id !== id);
      writeInvoices(next);
      return next;
    });
  }, []);

  return { invoices, upsertInvoice, updateStatus, deleteInvoice };
}
