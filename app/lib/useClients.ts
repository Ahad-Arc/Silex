"use client";

/**
 * useClients — workspace-level client database, backed by localStorage.
 *
 * Clients are first-class entities. Every invoice can reference a clientId.
 * When creating an invoice, the builder auto-fills address/tax/currency/terms
 * from the linked client profile.
 */

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Client {
  id: string;                 // nanoid-style: "cli_xxxx"
  // Identity
  displayName: string;        // The name shown everywhere (person or company)
  companyName: string;
  contactPerson: string;
  // Contact
  email: string;
  phone: string;
  website: string;
  // Billing
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingPostal: string;
  // Optional shipping
  shippingAddress: string;
  // Tax
  gstin: string;              // GSTIN / VAT / Tax ID
  // Defaults
  currency: string;           // ISO 4217
  paymentTerms: string;       // "Net 30" etc.
  // Meta
  notes: string;
  createdAt: string;          // ISO date string
  updatedAt: string;
}

export type ClientHealth = "High Value" | "Active" | "Slow Payer" | "Overdue" | "Inactive";

export type ClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;

// ─── localStorage ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "sx_clients";

function readClients(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Client[]) : [];
  } catch { return []; }
}

function writeClients(clients: Client[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clients)); } catch { /* quota */ }
}

function makeId(): string {
  return "cli_" + Math.random().toString(36).slice(2, 10);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface ClientActions {
  addClient: (input: ClientInput) => Client;
  updateClient: (id: string, patch: Partial<ClientInput>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
}

export function useClients(): { clients: Client[] } & ClientActions {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    setClients(readClients());
  }, []);

  const addClient = useCallback((input: ClientInput): Client => {
    const now = new Date().toISOString();
    const client: Client = { ...input, id: makeId(), createdAt: now, updatedAt: now };
    setClients((prev) => {
      const next = [client, ...prev];
      writeClients(next);
      return next;
    });
    return client;
  }, []);

  const updateClient = useCallback((id: string, patch: Partial<ClientInput>) => {
    setClients((prev) => {
      const next = prev.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
      );
      writeClients(next);
      return next;
    });
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => {
      const next = prev.filter((c) => c.id !== id);
      writeClients(next);
      return next;
    });
  }, []);

  const getClient = useCallback((id: string) => {
    return clients.find((c) => c.id === id);
  }, [clients]);

  return { clients, addClient, updateClient, deleteClient, getClient };
}

// ─── Health badge logic ────────────────────────────────────────────────────────
export function getClientHealth(
  clientInvoices: { status: string; amount: number }[]
): ClientHealth {
  if (clientInvoices.length === 0) return "Inactive";
  const hasOverdue = clientInvoices.some((i) => i.status === "Overdue");
  if (hasOverdue) return "Overdue";
  const totalBilled = clientInvoices.reduce((s, i) => s + i.amount, 0);
  if (totalBilled >= 20000) return "High Value";
  const unpaidRatio =
    clientInvoices.filter((i) => i.status !== "Paid").length / clientInvoices.length;
  if (unpaidRatio > 0.5) return "Slow Payer";
  return "Active";
}

export const HEALTH_STYLES: Record<ClientHealth, { label: string; cls: string }> = {
  "High Value": { label: "High Value", cls: "border-accent/30 bg-accent/10 text-accent" },
  "Active":     { label: "Active",     cls: "border-success-custom/20 bg-success-custom/10 text-success-custom" },
  "Slow Payer": { label: "Slow Payer", cls: "border-amber-500/20 bg-amber-500/10 text-amber-400" },
  "Overdue":    { label: "Overdue",    cls: "border-red-500/20 bg-red-500/10 text-red-400" },
  "Inactive":   { label: "Inactive",   cls: "border-border-custom bg-surface text-muted-custom" },
};
