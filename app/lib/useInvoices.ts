"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "./supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
}

export interface PersistedInvoice {
  id: string;                 // UUID from database
  invoiceNumber?: string;     // Clean invoice number e.g. "INV-2026-0001"
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

export interface InvoiceActions {
  upsertInvoice:  (invoice: PersistedInvoice) => void;
  updateStatus:   (id: string, status: "Paid" | "Pending" | "Overdue") => void;
  deleteInvoice:  (id: string) => void;
}

// Helper to translate DB invoice row to frontend PersistedInvoice object interface
export function dbToInvoice(row: any): PersistedInvoice {
  const snapshot = row.client_snapshot || {};
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientId: row.client_id || undefined,
    clientName: snapshot.clientName || row.clients?.display_name || "Unknown Client",
    clientEmail: snapshot.clientEmail || row.clients?.email || "",
    clientAddress: snapshot.clientAddress || row.clients?.billing_address || "",
    clientTaxId: snapshot.clientTaxId || row.clients?.tax_id || undefined,
    companyName: snapshot.companyName || undefined,
    companyAddress: snapshot.companyAddress || undefined,
    companyTaxId: snapshot.companyTaxId || undefined,
    date: row.date,
    dueDate: row.due_date,
    amount: parseFloat(row.amount || "0"),
    status: row.status,
    currency: row.currency || "USD",
    taxRate: parseFloat(row.tax_rate || "0"),
    discountRate: parseFloat(row.discount_rate || "0"),
    notes: row.notes || undefined,
    items: (row.invoice_items || []).map((item: any) => ({
      description: item.description,
      qty: parseFloat(item.qty || "1"),
      rate: parseFloat(item.rate || "0"),
    })),
  };
}

export function useInvoices(workspaceId: string | null): { invoices: PersistedInvoice[]; loading: boolean } & InvoiceActions {
  const [invoices, setInvoices] = useState<PersistedInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch invoices from Supabase database and subscribe to realtime changes
  useEffect(() => {
    if (!workspaceId) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    const supabase = createClient() as any;

    async function loadInvoices() {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*), clients(display_name)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading invoices:", error.message);
      } else if (data) {
        setInvoices(data.map(dbToInvoice));
      }
      setLoading(false);
    }

    loadInvoices();

    // 1. Subscribe to changes in invoices table
    const invoiceChannel = supabase.channel(`realtime-invoices-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload: any) => {
          if (payload.eventType === "INSERT") {
            const { data, error } = await supabase
              .from("invoices")
              .select("*, invoice_items(*), clients(display_name)")
              .eq("id", payload.new.id)
              .single();
            if (!error && data) {
              const newInvoice = dbToInvoice(data);
              setInvoices((prev) => {
                if (prev.some((inv) => inv.id === newInvoice.id)) return prev;
                return [newInvoice, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const { data, error } = await supabase
              .from("invoices")
              .select("*, invoice_items(*), clients(display_name)")
              .eq("id", payload.new.id)
              .single();
            if (!error && data) {
              const updatedInvoice = dbToInvoice(data);
              setInvoices((prev) =>
                prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
              );
            }
          } else if (payload.eventType === "DELETE") {
            setInvoices((prev) => prev.filter((inv) => inv.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // 2. Subscribe to changes in invoice_items table
    const itemsChannel = supabase.channel(`realtime-invoice-items-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoice_items",
        },
        async (payload: any) => {
          const affectedInvoiceId = payload.eventType === "DELETE" ? payload.old.invoice_id : payload.new.invoice_id;
          if (!affectedInvoiceId) return;

          const { data, error } = await supabase
            .from("invoices")
            .select("*, invoice_items(*), clients(display_name)")
            .eq("id", affectedInvoiceId)
            .single();

          if (!error && data && data.workspace_id === workspaceId) {
            const updatedInvoice = dbToInvoice(data);
            setInvoices((prev) =>
              prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invoiceChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [workspaceId]);

  const upsertInvoice = useCallback(async (invoice: PersistedInvoice) => {
    if (!workspaceId) return;
    const supabase = createClient() as any;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoice.id);

    const clientSnapshot = {
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientAddress: invoice.clientAddress,
      clientTaxId: invoice.clientTaxId,
      companyName: invoice.companyName,
      companyAddress: invoice.companyAddress,
      companyTaxId: invoice.companyTaxId,
    };

    if (!isUUID) {
      // Insert new invoice
      const cleanInvNumber = invoice.id.replace('#', '') || `INV-${new Date().getTime()}`;
      const { data: newInv, error: invErr } = await supabase
        .from("invoices")
        .insert({
          workspace_id: workspaceId,
          client_id: invoice.clientId || null,
          invoice_number: cleanInvNumber,
          date: invoice.date || new Date().toISOString().split("T")[0],
          due_date: invoice.dueDate || new Date().toISOString().split("T")[0],
          currency: invoice.currency || "USD",
          status: invoice.status || "Pending",
          tax_rate: invoice.taxRate || 0,
          discount_rate: invoice.discountRate || 0,
          notes: invoice.notes || null,
          client_snapshot: clientSnapshot,
        })
        .select()
        .single();

      if (invErr) {
        console.error("Error inserting invoice in database:", invErr.message);
        return;
      }

      // Insert child invoice items
      if (invoice.items && invoice.items.length > 0) {
        const itemRows = invoice.items.map((item, index) => ({
          invoice_id: newInv.id,
          description: item.description,
          qty: item.qty || 1,
          rate: item.rate || 0,
          sort_order: index,
        }));
        await supabase.from("invoice_items").insert(itemRows);
      }

      // Re-fetch completed invoice record to update client state
      const { data: refreshed } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .eq("id", newInv.id)
        .single();

      if (refreshed) {
        setInvoices((prev) => [dbToInvoice(refreshed), ...prev]);
      }
    } else {
      // Update existing invoice
      const { error: invErr } = await supabase
        .from("invoices")
        .update({
          client_id: invoice.clientId || null,
          date: invoice.date,
          due_date: invoice.dueDate,
          currency: invoice.currency,
          status: invoice.status,
          tax_rate: invoice.taxRate || 0,
          discount_rate: invoice.discountRate || 0,
          notes: invoice.notes || null,
          client_snapshot: clientSnapshot,
        })
        .eq("id", invoice.id);

      if (invErr) {
        console.error("Error updating invoice in database:", invErr.message);
        return;
      }

      // Re-create items list by deleting and inserting
      await supabase.from("invoice_items").delete().eq("invoice_id", invoice.id);

      if (invoice.items && invoice.items.length > 0) {
        const itemRows = invoice.items.map((item, index) => ({
          invoice_id: invoice.id,
          description: item.description,
          qty: item.qty || 1,
          rate: item.rate || 0,
          sort_order: index,
        }));
        await supabase.from("invoice_items").insert(itemRows);
      }

      // Trigger state updates
      setInvoices((prev) =>
        prev.map((i) => (i.id === invoice.id ? { ...invoice } : i))
      );
    }
  }, [workspaceId]);

  const updateStatus = useCallback(async (id: string, status: "Paid" | "Pending" | "Overdue") => {
    if (!workspaceId) return;
    const supabase = createClient() as any;

    // Optimistic state update
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );

    const { error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating invoice status in database:", error.message);
    }
  }, [workspaceId]);

  const deleteInvoice = useCallback(async (id: string) => {
    if (!workspaceId) return;
    const supabase = createClient() as any;

    // Optimistic state deletion
    setInvoices((prev) => prev.filter((i) => i.id !== id));

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting invoice from database:", error.message);
    }
  }, [workspaceId]);

  return { invoices, loading, upsertInvoice, updateStatus, deleteInvoice };
}
