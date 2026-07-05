"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  SearchIcon, PlusIcon, ClientsIcon, CheckIcon, ClockIcon, AlertIcon, TrashIcon, CloseIcon,
} from "../Icons";
import { Invoice } from "../InvoiceDrawer";
import { formatCurrency } from "../../lib/currencies";
import {
  Client, ClientInput, ClientActions, getClientHealth, HEALTH_STYLES,
} from "../../lib/useClients";
import { motion } from "framer-motion";
import { useMotionPresets } from "../../lib/motionPresets";

// ─── Props ────────────────────────────────────────────────────────────────────
interface ClientsPageProps {
  invoices: Invoice[];
  clients: Client[];
  onNewInvoice: (clientId?: string) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onAddClient: ClientActions["addClient"];
  onUpdateClient: ClientActions["updateClient"];
  onDeleteClient: ClientActions["deleteClient"];
  onUpdateStatus: (id: string, status: "Paid" | "Pending" | "Overdue") => void;
  defaultCurrency?: string;
}

type SortKey = "name" | "revenue" | "lastInvoice" | "outstanding";
type ProfileTab = "Overview" | "Invoices" | "Payments" | "Activity";

// ─── Derived client record ────────────────────────────────────────────────────
interface ClientRow extends Client {
  invoiceCount: number;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  lastInvoiceDate: string;
  health: ReturnType<typeof getClientHealth>;
}

// ─── Small UI atoms ───────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; half?: boolean;
}> = ({ label, value, onChange, type = "text", placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-2xs font-semibold uppercase tracking-wider text-muted-custom block">{label}</label>
    <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-xs text-foreground placeholder-muted-custom/50 focus:border-accent focus:outline-none transition-colors" />
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold border ${
    status === "Paid"    ? "border-success-custom/20 bg-success-custom/10 text-success-custom" :
    status === "Pending" ? "border-accent/20 bg-accent/10 text-accent" :
                           "border-red-500/20 bg-red-500/10 text-red-500"
  }`}>
    {status === "Paid" && <CheckIcon size={9} />}
    {status === "Pending" && <ClockIcon size={9} />}
    {status === "Overdue" && <AlertIcon size={9} />}
    {status}
  </span>
);

// ─── New / Edit Client Modal ──────────────────────────────────────────────────
const BLANK: ClientInput = {
  displayName: "", companyName: "", contactPerson: "",
  email: "", phone: "", website: "",
  billingAddress: "", billingCity: "", billingState: "", billingCountry: "", billingPostal: "",
  shippingAddress: "", gstin: "", currency: "USD", paymentTerms: "Net 30", notes: "",
};

const ClientModal: React.FC<{
  initial?: Client;
  onSave: (input: ClientInput) => void;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState<ClientInput>(initial ? {
    displayName: initial.displayName, companyName: initial.companyName,
    contactPerson: initial.contactPerson, email: initial.email,
    phone: initial.phone, website: initial.website,
    billingAddress: initial.billingAddress, billingCity: initial.billingCity,
    billingState: initial.billingState, billingCountry: initial.billingCountry,
    billingPostal: initial.billingPostal, shippingAddress: initial.shippingAddress,
    gstin: initial.gstin, currency: initial.currency, paymentTerms: initial.paymentTerms,
    notes: initial.notes,
  } : { ...BLANK });

  const [error, setError] = useState("");

  const set = (k: keyof ClientInput) => (v: string) => {
    setError("");
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSave = () => {
    if (!form.displayName.trim()) { setError("Client / Display Name is required."); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-border-custom rounded-2xl w-full max-w-[620px] max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-custom shrink-0">
          <h2 className="text-sm font-bold text-foreground">{initial ? "Edit Client" : "New Client"}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-custom hover:bg-surface hover:text-foreground transition-all">
            <CloseIcon size={16} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 text-2xs font-semibold text-red-400">
            {error}
          </div>
        )}

        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Identity */}
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-custom mb-3">Identity</p>
            <div className="space-y-3">
              <Field label="Client / Display Name *" value={form.displayName} onChange={set("displayName")} placeholder="Acme Corp" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company Name" value={form.companyName} onChange={set("companyName")} placeholder="Acme Corporation" />
                <Field label="Contact Person" value={form.contactPerson} onChange={set("contactPerson")} placeholder="Jane Smith" />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-custom mb-3">Contact</p>
            <div className="space-y-3">
              <Field label="Email" value={form.email} onChange={set("email")} type="email" placeholder="billing@acme.com" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" value={form.phone} onChange={set("phone")} type="tel" placeholder="+1 (555) 000-0000" />
                <Field label="Website" value={form.website} onChange={set("website")} placeholder="https://acme.com" />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-custom mb-3">Billing Address</p>
            <div className="space-y-3">
              <Field label="Street" value={form.billingAddress} onChange={set("billingAddress")} placeholder="100 Main Street" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City"    value={form.billingCity}    onChange={set("billingCity")}    placeholder="New York" />
                <Field label="State"   value={form.billingState}   onChange={set("billingState")}   placeholder="NY" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Country"     value={form.billingCountry} onChange={set("billingCountry")} placeholder="United States" />
                <Field label="Postal Code" value={form.billingPostal}  onChange={set("billingPostal")}  placeholder="10005" />
              </div>
            </div>
          </div>

          {/* Tax & Billing Defaults */}
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-custom mb-3">Tax & Billing Defaults</p>
            <div className="space-y-3">
              <Field label="GSTIN / VAT / Tax ID" value={form.gstin} onChange={set("gstin")} placeholder="22AAAAA0000A1Z5" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-muted-custom block">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none">
                    {["USD","EUR","GBP","INR","CAD","AUD","SGD","AED","JPY","CNY"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-muted-custom block">Payment Terms</label>
                  <select value={form.paymentTerms} onChange={(e) => setForm((f) => ({ ...f, paymentTerms: e.target.value }))}
                    className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none">
                    {["Due on Receipt","Net 7","Net 14","Net 30","Net 45","Net 60"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-2xs font-semibold uppercase tracking-wider text-muted-custom block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3}
              placeholder="Internal notes about this client..."
              className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-xs text-foreground placeholder-muted-custom/50 focus:border-accent focus:outline-none resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-custom shrink-0">
          <button onClick={onClose} className="rounded-lg border border-border-custom px-4 py-2 text-xs font-semibold text-muted-custom hover:text-foreground hover:bg-surface transition-all">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity">
            {initial ? "Save Changes" : "Create Client"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Client Profile Panel ─────────────────────────────────────────────────────
const ClientProfile: React.FC<{
  client: ClientRow;
  clientInvoices: Invoice[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNewInvoice: () => void;
  onEditInvoice: (inv: Invoice) => void;
  onUpdateStatus: (id: string, status: "Paid" | "Pending" | "Overdue") => void;
}> = ({ client, clientInvoices, onClose, onEdit, onDelete, onNewInvoice, onEditInvoice, onUpdateStatus }) => {
  const [tab, setTab] = useState<ProfileTab>("Overview");
  const hs = HEALTH_STYLES[client.health];

  const paid       = clientInvoices.filter((i) => i.status === "Paid");
  const pending    = clientInvoices.filter((i) => i.status === "Pending");
  const overdue    = clientInvoices.filter((i) => i.status === "Overdue");
  const paidAmt    = paid.reduce((s, i) => s + i.amount, 0);
  const pendingAmt = pending.reduce((s, i) => s + i.amount, 0);
  const overdueAmt = overdue.reduce((s, i) => s + i.amount, 0);

  // Activity timeline derived from invoice dates
  const activity = useMemo(() => {
    const events: { date: string; text: string; type: "created" | "paid" | "overdue" }[] = [];
    clientInvoices.forEach((inv) => {
      events.push({ date: inv.date, text: `Invoice ${inv.id} created`, type: "created" });
      if (inv.status === "Paid") events.push({ date: inv.dueDate, text: `Invoice ${inv.id} marked paid`, type: "paid" });
      if (inv.status === "Overdue") events.push({ date: inv.dueDate, text: `Invoice ${inv.id} overdue`, type: "overdue" });
    });
    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [clientInvoices]);

  const fullAddress = [client.billingAddress, client.billingCity, client.billingState, client.billingCountry, client.billingPostal].filter(Boolean).join(", ");

  return (
    <div className="flex-1 flex flex-col rounded-xl border border-border-custom bg-surface overflow-hidden animate-in slide-in-from-right-4 duration-200 min-w-0">
      {/* Profile header */}
      <div className="border-b border-border-custom p-5 shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-background border border-border-custom text-xl font-bold text-accent flex items-center justify-center shrink-0">
              {client.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">{client.displayName}</h2>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold border ${hs.cls}`}>{hs.label}</span>
              </div>
              {client.companyName && <p className="text-2xs text-muted-custom mt-0.5">{client.companyName}</p>}
              <p className="text-2xs text-muted-custom mt-0.5">{client.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onNewInvoice} className="rounded-lg bg-accent px-3 py-1.5 text-2xs font-bold text-white hover:opacity-90 transition-opacity flex items-center gap-1.5">
              <PlusIcon size={12} /> Invoice
            </button>
            <button onClick={onEdit} className="rounded-lg border border-border-custom px-3 py-1.5 text-2xs font-semibold text-muted-custom hover:text-foreground hover:bg-background/50 transition-all">Edit</button>
            <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-custom hover:bg-surface hover:text-foreground transition-all">
              <CloseIcon size={14} />
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Billed",  value: formatCurrency(client.totalBilled,  client.currency || "USD"), color: "text-foreground" },
            { label: "Collected",     value: formatCurrency(paidAmt,             client.currency || "USD"), color: "text-success-custom" },
            { label: "Outstanding",   value: formatCurrency(client.outstanding,  client.currency || "USD"), color: client.outstanding > 0 ? "text-amber-400" : "text-foreground" },
            { label: "Invoices",      value: String(client.invoiceCount),        color: "text-foreground" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border-custom bg-background/50 px-3 py-2.5">
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-2xs text-muted-custom mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {(["Overview", "Invoices", "Payments", "Activity"] as ProfileTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-2xs font-semibold transition-all ${tab === t ? "bg-background text-foreground border border-border-custom" : "text-muted-custom hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* ── OVERVIEW ── */}
        {tab === "Overview" && (
          <div className="space-y-4">
            {/* Contact details */}
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-muted-custom mb-3">Contact Details</p>
              <div className="rounded-xl border border-border-custom bg-background/30 divide-y divide-border-custom">
                {[
                  ["Email",          client.email         || "—"],
                  ["Phone",          client.phone         || "—"],
                  ["Website",        client.website       || "—"],
                  ["Contact Person", client.contactPerson || "—"],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-2xs text-muted-custom">{lbl}</span>
                    <span className="text-2xs font-medium text-foreground max-w-[220px] text-right truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing */}
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-muted-custom mb-3">Billing Information</p>
              <div className="rounded-xl border border-border-custom bg-background/30 divide-y divide-border-custom">
                {[
                  ["Address",       fullAddress || "—"],
                  ["GSTIN / VAT",   client.gstin        || "—"],
                  ["Currency",      client.currency     || "USD"],
                  ["Payment Terms", client.paymentTerms || "—"],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-2xs text-muted-custom shrink-0">{lbl}</span>
                    <span className="text-2xs font-medium text-foreground max-w-[260px] text-right truncate ml-4">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-muted-custom mb-2">Notes</p>
                <div className="rounded-xl border border-border-custom bg-background/30 px-4 py-3">
                  <p className="text-2xs text-muted-custom leading-relaxed">{client.notes}</p>
                </div>
              </div>
            )}

            {/* Danger zone */}
            <div className="pt-2 border-t border-border-custom">
              <button onClick={onDelete} className="text-2xs font-semibold text-red-400 hover:text-red-300 transition-colors">
                Delete client record →
              </button>
            </div>
          </div>
        )}

        {/* ── INVOICES ── */}
        {tab === "Invoices" && (
          <div className="space-y-2">
            {clientInvoices.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <span className="text-muted-custom/40"><ClientsIcon size={28} /></span>
                <p className="text-xs text-muted-custom">No invoices yet</p>
                <button onClick={onNewInvoice} className="mt-1 text-2xs font-semibold text-accent hover:underline">Create first invoice →</button>
              </div>
            ) : (
              clientInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border-custom bg-background/40 px-4 py-3 group hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-medium text-foreground shrink-0">{inv.id}</span>
                    <span className="text-2xs text-muted-custom">{inv.date}</span>
                    <span className="text-2xs text-muted-custom hidden sm:block truncate max-w-[160px]">Due {inv.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-foreground">{formatCurrency(inv.amount, inv.currency ?? "USD")}</span>
                    <StatusBadge status={inv.status} />
                    <button onClick={() => onEditInvoice(inv)} className="opacity-0 group-hover:opacity-100 text-2xs font-semibold text-accent hover:underline transition-opacity">Edit</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {tab === "Payments" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Collected",   value: formatCurrency(paidAmt,    client.currency || "USD"), color: "text-success-custom", sub: `${paid.length} invoices` },
                { label: "Pending",     value: formatCurrency(pendingAmt, client.currency || "USD"), color: "text-accent",         sub: `${pending.length} invoices` },
                { label: "Overdue",     value: formatCurrency(overdueAmt, client.currency || "USD"), color: "text-red-400",        sub: `${overdue.length} invoices` },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border-custom bg-background/30 px-4 py-3">
                  <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-2xs text-muted-custom mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-muted-custom/60 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-muted-custom mb-3">Payment History</p>
              <div className="space-y-2">
                {clientInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border-custom bg-background/40 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-foreground font-mono">{inv.id}</p>
                      <p className="text-2xs text-muted-custom mt-0.5">Due {inv.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-foreground">{formatCurrency(inv.amount, inv.currency ?? "USD")}</span>
                      <StatusBadge status={inv.status} />
                      {inv.status !== "Paid" && (
                        <button onClick={() => onUpdateStatus(inv.id, "Paid")} className="text-2xs font-semibold text-success-custom hover:underline">Mark Paid</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {tab === "Activity" && (
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-custom mb-4">Activity Timeline</p>
            {activity.length === 0 ? (
              <p className="text-xs text-muted-custom py-8 text-center">No activity yet</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-border-custom" />
                <div className="space-y-4 pl-9">
                  {activity.map((ev, i) => (
                    <div key={i} className="relative">
                      <div className={`absolute -left-6 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center ${
                        ev.type === "paid"    ? "bg-success-custom" :
                        ev.type === "overdue" ? "bg-red-500" :
                                               "bg-accent"
                      }`}>
                        {ev.type === "paid"    && <CheckIcon size={8} className="text-white" />}
                        {ev.type === "overdue" && <AlertIcon size={8} className="text-white" />}
                        {ev.type === "created" && <ClockIcon size={8} className="text-white" />}
                      </div>
                      <p className="text-xs font-medium text-foreground">{ev.text}</p>
                      <p className="text-2xs text-muted-custom mt-0.5">{ev.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CLIENTS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const ClientsPage: React.FC<ClientsPageProps> = ({
  invoices, clients,
  onNewInvoice, onEditInvoice,
  onAddClient, onUpdateClient, onDeleteClient,
  onUpdateStatus,
  defaultCurrency = "USD",
}) => {
  const { pageTransition } = useMotionPresets();
  const [search, setSearch]             = useState("");
  const [sortKey, setSortKey]           = useState<SortKey>("revenue");
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // ── Build enriched client rows ────────────────────────────────────────────
  const rows = useMemo<ClientRow[]>(() => {
    return clients.map((c) => {
      const invs = invoices.filter((i) => i.clientId === c.id || i.clientEmail === c.email);
      const totalBilled  = invs.reduce((s, i) => s + i.amount, 0);
      const totalPaid    = invs.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
      const outstanding  = invs.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.amount, 0);
      const lastInvoiceDate = invs.length ? invs.reduce((latest, i) => i.date > latest ? i.date : latest, "") : "";
      return {
        ...c,
        invoiceCount: invs.length,
        totalBilled, totalPaid, outstanding, lastInvoiceDate,
        health: getClientHealth(invs),
      };
    });
  }, [clients, invoices]);

  // ── Also derive "orphan" rows from invoices that have no matching client ──
  // So existing seed invoices still show in the clients list
  const orphanRows = useMemo<ClientRow[]>(() => {
    const registered = new Set(clients.map((c) => c.email));
    const map = new Map<string, ClientRow>();
    invoices.forEach((inv) => {
      if (registered.has(inv.clientEmail)) return;
      const existing = map.get(inv.clientEmail);
      if (existing) {
        existing.invoiceCount++;
        existing.totalBilled += inv.amount;
        if (inv.status !== "Paid") existing.outstanding += inv.amount;
        if (inv.status === "Paid")  existing.totalPaid  += inv.amount;
        if (inv.date > existing.lastInvoiceDate) existing.lastInvoiceDate = inv.date;
        existing.health = getClientHealth(invoices.filter((i) => i.clientEmail === inv.clientEmail));
      } else {
        const clientInvs = invoices.filter((i) => i.clientEmail === inv.clientEmail);
        map.set(inv.clientEmail, {
          id: "orphan__" + inv.clientEmail,
          displayName: inv.clientName, companyName: "", contactPerson: "",
          email: inv.clientEmail, phone: "", website: "",
          billingAddress: inv.clientAddress, billingCity: "", billingState: "",
          billingCountry: "", billingPostal: "", shippingAddress: "",
          gstin: "", currency: inv.currency ?? "USD", paymentTerms: "Net 30",
          notes: "", createdAt: inv.date, updatedAt: inv.date,
          invoiceCount: 1,
          totalBilled:  inv.amount,
          totalPaid:    inv.status === "Paid" ? inv.amount : 0,
          outstanding:  inv.status !== "Paid" ? inv.amount : 0,
          lastInvoiceDate: inv.date,
          health: getClientHealth(clientInvs),
        });
      }
    });
    return Array.from(map.values());
  }, [clients, invoices]);

  const allRows = useMemo(() => [...rows, ...orphanRows], [rows, orphanRows]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = allRows.filter((c) =>
      c.displayName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      if (sortKey === "revenue")      return b.totalBilled  - a.totalBilled;
      if (sortKey === "outstanding")  return b.outstanding  - a.outstanding;
      if (sortKey === "lastInvoice")  return b.lastInvoiceDate.localeCompare(a.lastInvoiceDate);
      return a.displayName.localeCompare(b.displayName);
    });
    return list;
  }, [allRows, search, sortKey]);

  const selectedRow     = filtered.find((c) => c.id === selectedId) ?? null;
  const selectedInvs    = useMemo(() => {
    if (!selectedRow) return [];
    return invoices.filter((i) =>
      i.clientId === selectedRow.id || i.clientEmail === selectedRow.email
    );
  }, [selectedRow, invoices]);

  // ── Totals for header ─────────────────────────────────────────────────────
  const totalBilledAll  = allRows.reduce((s, c) => s + c.totalBilled, 0);
  const activeCount     = allRows.filter((c) => c.health === "Active" || c.health === "High Value").length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveClient = useCallback((input: ClientInput) => {
    if (editingClient) {
      onUpdateClient(editingClient.id, input);
    } else {
      onAddClient(input);
    }
    setShowModal(false);
    setEditingClient(null);
  }, [editingClient, onAddClient, onUpdateClient]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedRow || selectedRow.id.startsWith("orphan__")) return;
    onDeleteClient(selectedRow.id);
    setSelectedId(null);
  }, [selectedRow, onDeleteClient]);

  const handleUpdateStatus = useCallback((id: string, status: "Paid" | "Pending" | "Overdue") => {
    onUpdateStatus(id, status);
  }, [onUpdateStatus]);

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
          <h1 className="text-lg font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-2xs text-muted-custom font-medium mt-0.5">
            {allRows.length} clients · {activeCount} active · {formatCurrency(totalBilledAll, defaultCurrency)} total billed
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <span className="absolute left-3 top-2.5 text-muted-custom"><SearchIcon size={14} /></span>
            <input type="text" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-[200px] rounded-lg border border-border-custom bg-surface py-1.5 pl-9 pr-4 text-xs text-foreground placeholder-muted-custom transition-all focus:w-[260px] focus:border-accent focus:outline-none" />
          </div>
          {/* Sort */}
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-border-custom bg-surface px-3 py-1.5 text-2xs font-semibold text-muted-custom focus:border-accent focus:outline-none hidden md:block">
            <option value="revenue">Sort: Revenue</option>
            <option value="lastInvoice">Sort: Last Invoice</option>
            <option value="outstanding">Sort: Outstanding</option>
            <option value="name">Sort: Name</option>
          </select>
          {/* Add client */}
          <button onClick={() => { setEditingClient(null); setShowModal(true); }}
            className="flex items-center gap-1.5 rounded-lg border border-border-custom bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background/50 transition-all">
            <PlusIcon size={14} /> Add Client
          </button>
          <button onClick={() => onNewInvoice()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 active:scale-95 shadow-md shadow-accent/10 transition-all">
            <PlusIcon size={14} /> New Invoice
          </button>
        </div>
      </header>

      {/* Dashboard strip */}
      <div className="border-b border-border-custom px-6 py-3 flex gap-4 overflow-x-auto shrink-0">
        {[
          { label: "Total Clients",      value: String(allRows.length) },
          { label: "Active Clients",     value: String(activeCount) },
          { label: "High Value",         value: String(allRows.filter((c) => c.health === "High Value").length) },
          { label: "Overdue Accounts",   value: String(allRows.filter((c) => c.health === "Overdue").length),   red: true },
          { label: "Total Outstanding",  value: formatCurrency(allRows.reduce((s, c) => s + c.outstanding, 0), defaultCurrency), amber: true },
        ].map((s) => (
          <div key={s.label} className="shrink-0 text-center">
            <p className={`text-sm font-bold ${s.red ? "text-red-400" : s.amber ? "text-amber-400" : "text-foreground"}`}>{s.value}</p>
            <p className="text-[10px] text-muted-custom mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main two-column layout */}
      <main className="flex-1 flex min-h-0">
        {/* Client list */}
        <div className={`flex flex-col gap-2 p-4 overflow-y-auto transition-all duration-300 ${selectedRow ? "w-[340px] shrink-0" : "flex-1"}`}>
          {filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24">
              <span className="text-muted-custom/30"><ClientsIcon size={40} /></span>
              <p className="text-sm font-semibold text-muted-custom">No clients found</p>
              <button onClick={() => setShowModal(true)} className="text-2xs font-semibold text-accent hover:underline">Add your first client →</button>
            </div>
          ) : (
            filtered.map((client) => {
              const hs = HEALTH_STYLES[client.health];
              const isSelected = selectedId === client.id;
              return (
                <button key={client.id} onClick={() => setSelectedId(isSelected ? null : client.id)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all duration-150 ${isSelected ? "border-accent/60 bg-accent/5 ring-1 ring-accent/20" : "border-border-custom bg-surface hover:bg-background/40"}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-background border border-border-custom text-xs font-bold text-accent flex items-center justify-center shrink-0">
                      {client.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">{client.displayName}</p>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold border ${hs.cls}`}>{hs.label}</span>
                      </div>
                      <p className="text-2xs text-muted-custom truncate mt-0.5">{client.email}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-2xs text-muted-custom"><span className="font-semibold text-foreground">{client.invoiceCount}</span> inv</span>
                        <span className="h-1 w-1 rounded-full bg-border-custom" />
                        <span className="text-2xs text-muted-custom"><span className="font-semibold text-foreground">{formatCurrency(client.totalBilled, client.currency || defaultCurrency)}</span></span>
                        {client.outstanding > 0 && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border-custom" />
                            <span className="text-2xs text-amber-400 font-semibold">{formatCurrency(client.outstanding, client.currency || defaultCurrency)} due</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Profile panel */}
        {selectedRow && (
          <div className="flex-1 p-4 overflow-hidden flex">
            <ClientProfile
              client={selectedRow}
              clientInvoices={selectedInvs}
              onClose={() => setSelectedId(null)}
              onEdit={() => {
                if (!selectedRow.id.startsWith("orphan__")) {
                  const full = clients.find((c) => c.id === selectedRow.id);
                  if (full) { setEditingClient(full); setShowModal(true); }
                }
              }}
              onDelete={handleDeleteSelected}
              onNewInvoice={() => onNewInvoice(selectedRow.id.startsWith("orphan__") ? undefined : selectedRow.id)}
              onEditInvoice={onEditInvoice}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <ClientModal
          initial={editingClient ?? undefined}
          onSave={handleSaveClient}
          onClose={() => { setShowModal(false); setEditingClient(null); }}
        />
      )}
    </motion.div>
  );
};
