"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "./supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Client {
  id: string;                 // UUID from database
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

// Helper to translate DB client row to frontend Client object interface
export function dbToClient(row: any): Client {
  return {
    id: row.id,
    displayName: row.display_name,
    companyName: row.company_name || "",
    contactPerson: row.contact_person || "",
    email: row.email || "",
    phone: row.phone || "",
    website: row.website || "",
    billingAddress: row.billing_address || "",
    billingCity: "",
    billingState: "",
    billingCountry: "",
    billingPostal: "",
    shippingAddress: "",
    gstin: row.tax_id || "",
    currency: row.currency || "USD",
    paymentTerms: row.payment_terms || "Net 30",
    notes: "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ClientActions {
  addClient: (input: ClientInput) => void;
  updateClient: (id: string, patch: Partial<ClientInput>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
}

export function useClients(workspaceId: string | null): { clients: Client[]; loading: boolean } & ClientActions {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Load clients from Supabase database and subscribe to realtime changes
  useEffect(() => {
    if (!workspaceId) {
      setClients([]);
      setLoading(false);
      return;
    }

    const supabase = createClient() as any;

    async function loadClients() {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading clients:", error.message);
      } else if (data) {
        setClients(data.map(dbToClient));
      }
      setLoading(false);
    }

    loadClients();

    const channel = supabase.channel(`realtime-clients-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newClient = dbToClient(payload.new);
            setClients((prev) => {
              if (prev.some((c) => c.id === newClient.id)) return prev;
              return [newClient, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedClient = dbToClient(payload.new);
            setClients((prev) =>
              prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
            );
          } else if (payload.eventType === "DELETE") {
            setClients((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  const addClient = useCallback(async (input: ClientInput) => {
    if (!workspaceId) return;
    const supabase = createClient() as any;
    const { data, error } = await supabase
      .from("clients")
      .insert({
        workspace_id: workspaceId,
        display_name: input.displayName,
        company_name: input.companyName || null,
        contact_person: input.contactPerson || null,
        email: input.email || null,
        phone: input.phone || null,
        website: input.website || null,
        billing_address: input.billingAddress || null,
        tax_id: input.gstin || null,
        currency: input.currency || "USD",
        payment_terms: input.paymentTerms || "Net 30",
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding client:", error.message);
      return;
    }

    if (data) {
      const client = dbToClient(data);
      setClients((prev) => [client, ...prev]);
    }
  }, [workspaceId]);

  const updateClient = useCallback(async (id: string, patch: Partial<ClientInput>) => {
    if (!workspaceId) return;
    const supabase = createClient() as any;

    // Optimistic state update
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );

    const { error } = await supabase
      .from("clients")
      .update({
        display_name: patch.displayName,
        company_name: patch.companyName,
        contact_person: patch.contactPerson,
        email: patch.email,
        phone: patch.phone,
        website: patch.website,
        billing_address: patch.billingAddress,
        tax_id: patch.gstin,
        currency: patch.currency,
        payment_terms: patch.paymentTerms,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating client in database:", error.message);
    }
  }, [workspaceId]);

  const deleteClient = useCallback(async (id: string) => {
    if (!workspaceId) return;
    const supabase = createClient() as any;

    // Optimistic state deletion
    setClients((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting client from database:", error.message);
    }
  }, [workspaceId]);

  const getClient = useCallback((id: string) => {
    return clients.find((c) => c.id === id);
  }, [clients]);

  return { clients, loading, addClient, updateClient, deleteClient, getClient };
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
