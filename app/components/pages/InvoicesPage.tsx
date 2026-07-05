"use client";

import React, { useState, useMemo } from "react";
import {
  SearchIcon,
  PlusIcon,
  CheckIcon,
  ClockIcon,
  AlertIcon,
  FileDownIcon,
  InvoicesIcon,
} from "../Icons";
import { Invoice } from "../InvoiceDrawer";
import { formatCurrency } from "../../lib/currencies";
import { motion } from "framer-motion";
import { useMotionPresets } from "../../lib/motionPresets";

interface InvoicesPageProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onUpdateStatus: (id: string, status: "Paid" | "Pending" | "Overdue") => void;
  onDeleteInvoice: (id: string) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
  defaultCurrency?: string;
}

type FilterType = "All" | "Paid" | "Pending" | "Overdue";
type SortField = "id" | "clientName" | "date" | "dueDate" | "amount" | "status";
type SortDir = "asc" | "desc";

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  invoices,
  onNewInvoice,
  onEditInvoice,
  onUpdateStatus,
  onDeleteInvoice,
  onSelectInvoice,
  defaultCurrency = "USD",
}) => {
  const { pageTransition } = useMotionPresets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let list = invoices.filter((inv) => {
      const matchSearch =
        inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientEmail.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "All" || inv.status === filter;
      return matchSearch && matchFilter;
    });

    list = [...list].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";
      if (sortField === "amount") { valA = a.amount; valB = b.amount; }
      else if (sortField === "clientName") { valA = a.clientName; valB = b.clientName; }
      else if (sortField === "status") { valA = a.status; valB = b.status; }
      else { valA = a.id; valB = b.id; }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDir === "asc" ? valA - valB : valB - valA;
      }
      return sortDir === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return list;
  }, [invoices, search, filter, sortField, sortDir]);

  const counts = useMemo(() => ({
    all: invoices.length,
    paid: invoices.filter((i) => i.status === "Paid").length,
    pending: invoices.filter((i) => i.status === "Pending").length,
    overdue: invoices.filter((i) => i.status === "Overdue").length,
  }), [invoices]);

  const totalValue = invoices.reduce((s, i) => s + i.amount, 0);

  const SortIndicator = ({ field }: { field: SortField }) => (
    <span className={`ml-1 text-[10px] ${sortField === field ? "text-accent" : "text-border-custom"}`}>
      {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

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
          <h1 className="text-lg font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-2xs text-muted-custom font-medium mt-0.5">
            {invoices.length} total · {formatCurrency(totalValue, defaultCurrency)} in volume
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <span className="absolute left-3 top-2.5 text-muted-custom">
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by client, ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[220px] lg:w-[260px] rounded-lg border border-border-custom bg-surface py-1.5 pl-9 pr-4 text-xs text-foreground placeholder-muted-custom transition-all focus:w-[300px] focus:border-accent focus:outline-none"
            />
          </div>
          <button
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-md shadow-accent/10"
          >
            <PlusIcon size={14} />
            New Invoice
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6 flex-1">
        {/* Summary stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "All Invoices", value: counts.all, color: "text-foreground", bg: "bg-surface" },
            { label: "Paid", value: counts.paid, color: "text-success-custom", bg: "bg-success-custom/5" },
            { label: "Pending", value: counts.pending, color: "text-accent", bg: "bg-accent/5" },
            { label: "Overdue", value: counts.overdue, color: "text-red-400", bg: "bg-red-500/5" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setFilter(s.label === "All Invoices" ? "All" : s.label as FilterType)}
              className={`rounded-xl border border-border-custom ${s.bg} px-4 py-3 text-left transition-all hover:border-accent/40 ${
                filter === (s.label === "All Invoices" ? "All" : s.label) ? "border-accent/60 ring-1 ring-accent/20" : ""
              }`}
            >
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-2xs text-muted-custom mt-0.5 font-medium">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Table */}
        <section className="rounded-xl border border-border-custom bg-surface overflow-hidden">
          {/* Filter bar */}
          <div className="border-b border-border-custom px-6 py-3 flex flex-wrap items-center gap-2">
            {(["All", "Paid", "Pending", "Overdue"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-background text-foreground border border-border-custom"
                    : "text-muted-custom hover:text-foreground border border-transparent"
                }`}
              >
                {f}
                <span className="ml-1.5 text-2xs opacity-60">
                  {f === "All" ? counts.all : f === "Paid" ? counts.paid : f === "Pending" ? counts.pending : counts.overdue}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-background/50 border-b border-border-custom text-muted-custom">
                <tr>
                  <th
                    className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("id")}
                  >
                    Invoice ID <SortIndicator field="id" />
                  </th>
                  <th
                    className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("clientName")}
                  >
                    Client <SortIndicator field="clientName" />
                  </th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs">
                    Issued
                  </th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs">
                    Due
                  </th>
                  <th
                    className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs text-right cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("amount")}
                  >
                    Amount <SortIndicator field="amount" />
                  </th>
                  <th
                    className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs text-center cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("status")}
                  >
                    Status <SortIndicator field="status" />
                  </th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {filtered.length > 0 ? (
                  filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice?.(inv)}
                      className="group hover:bg-background/40 cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-foreground">
                        {inv.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-background border border-border-custom text-2xs font-bold text-accent flex items-center justify-center shrink-0">
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
                      <td className="px-6 py-4 text-muted-custom">{inv.dueDate}</td>
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditInvoice(inv);
                            }}
                            className="rounded-md border border-border-custom bg-surface px-2 py-1 text-2xs font-semibold text-foreground hover:border-accent/40 hover:text-accent transition-all"
                          >
                            Edit
                          </button>
                          {inv.status !== "Paid" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(inv.id, "Paid");
                              }}
                              className="rounded-md border border-success-custom/20 bg-success-custom/10 px-2 py-1 text-2xs font-semibold text-success-custom hover:bg-success-custom/20 transition-all"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteInvoice(inv.id);
                            }}
                            className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-2xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-muted-custom/40">
                          <InvoicesIcon size={32} />
                        </span>
                        <p className="text-sm font-semibold text-muted-custom">No invoices found</p>
                        <p className="text-2xs text-muted-custom/60">Try adjusting your search or filter</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="border-t border-border-custom px-6 py-3 flex items-center justify-between bg-background/30">
              <span className="text-2xs text-muted-custom">
                Showing {filtered.length} of {invoices.length} invoices
              </span>
              <span className="text-2xs font-semibold text-foreground">
                Total: {formatCurrency(filtered.reduce((s, i) => s + i.amount, 0), defaultCurrency)}
              </span>
            </div>
          )}
        </section>
      </main>
    </motion.div>
  );
};
