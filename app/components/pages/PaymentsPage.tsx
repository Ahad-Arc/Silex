"use client";

import React, { useState, useMemo } from "react";
import { SearchIcon, CheckIcon, ClockIcon, AlertIcon, PaymentsIcon } from "../Icons";
import { Invoice } from "../InvoiceDrawer";
import { formatCurrency } from "../../lib/currencies";
import { motion } from "framer-motion";
import { useMotionPresets } from "../../lib/motionPresets";

interface PaymentsPageProps {
  invoices: Invoice[];
  onUpdateStatus: (id: string, status: "Paid" | "Pending" | "Overdue") => void;
  defaultCurrency?: string;
}

type TimeRange = "7d" | "30d" | "90d" | "all";

interface PaymentRecord {
  invoiceId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  status: "Paid" | "Pending" | "Overdue";
  date: string;
  dueDate: string;
  method: string;
}

const PAYMENT_METHODS: Record<string, string> = {
  "#INV-8492": "Wire Transfer",
  "#INV-9021": "ACH Direct",
  "#INV-1184": "Wire Transfer",
  "#INV-3392": "Credit Card",
  "#INV-7741": "ACH Direct",
};

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ invoices, onUpdateStatus, defaultCurrency = "USD" }) => {
  const { pageTransition } = useMotionPresets();
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Pending" | "Overdue">("All");

  const payments = useMemo<PaymentRecord[]>(
    () =>
      invoices.map((inv) => ({
        invoiceId: inv.id,
        clientName: inv.clientName,
        clientEmail: inv.clientEmail,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        date: inv.date,
        dueDate: inv.dueDate,
        method: PAYMENT_METHODS[inv.id] ?? "Wire Transfer",
      })),
    [invoices]
  );

  const timeFilteredPayments = useMemo(() => {
    const now = new Date();
    return payments.filter((p) => {
      if (timeRange === "all") return true;
      const itemDate = new Date(Date.parse(p.date) || Date.now());
      const diffTime = now.getTime() - itemDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (timeRange === "7d") return diffDays <= 7;
      if (timeRange === "30d") return diffDays <= 30;
      if (timeRange === "90d") return diffDays <= 90;
      return true;
    });
  }, [payments, timeRange]);

  const filtered = useMemo(() => {
    return timeFilteredPayments.filter((p) => {
      const matchSearch =
        p.clientName.toLowerCase().includes(search.toLowerCase()) ||
        p.invoiceId.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [timeFilteredPayments, search, statusFilter]);

  const stats = useMemo(() => {
    const paid = timeFilteredPayments.filter((p) => p.status === "Paid");
    const pending = timeFilteredPayments.filter((p) => p.status === "Pending");
    const overdue = timeFilteredPayments.filter((p) => p.status === "Overdue");
    return {
      collected: paid.reduce((s, p) => s + p.amount, 0),
      pending: pending.reduce((s, p) => s + p.amount, 0),
      overdue: overdue.reduce((s, p) => s + p.amount, 0),
      collectionRate: timeFilteredPayments.length > 0 ? (paid.length / timeFilteredPayments.length) * 100 : 0,
    };
  }, [timeFilteredPayments]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString("en-US", { month: "short" }),
      };
    });

    const values = months.map(() => 0);
    payments.forEach((p) => {
      if (p.status === "Paid") {
        const d = new Date(Date.parse(p.date) || Date.now());
        const idx = months.findIndex((item) => item.year === d.getFullYear() && item.month === d.getMonth());
        if (idx !== -1) {
          values[idx] += p.amount;
        }
      }
    });

    const maxVal = Math.max(...values, 100);
    const heights = values.map((v) => (v / maxVal) * 100);

    const currentPeriodSum = values.slice(6, 12).reduce((a, b) => a + b, 0);
    const prevPeriodSum = values.slice(0, 6).reduce((a, b) => a + b, 0);
    let growthRate = 0;
    if (prevPeriodSum > 0) {
      growthRate = ((currentPeriodSum - prevPeriodSum) / prevPeriodSum) * 100;
    }

    return {
      months: months.map((m) => m.label),
      heights,
      growthRate,
    };
  }, [payments]);

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
          <h1 className="text-lg font-bold tracking-tight text-foreground">Payments</h1>
          <p className="text-2xs text-muted-custom font-medium mt-0.5">
            Track collections, pending balances, and payment history
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                timeRange === r
                  ? "bg-surface text-foreground border border-border-custom"
                  : "text-muted-custom hover:text-foreground"
              }`}
            >
              {r === "all" ? "All time" : r}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 space-y-6 flex-1">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Collected",
              value: formatCurrency(stats.collected, defaultCurrency),
              sub: `${payments.filter((p) => p.status === "Paid").length} payments`,
              color: "text-success-custom",
              bg: "bg-success-custom/5",
              border: "border-success-custom/20",
            },
            {
              label: "Pending",
              value: formatCurrency(stats.pending, defaultCurrency),
              sub: `${payments.filter((p) => p.status === "Pending").length} awaiting`,
              color: "text-accent",
              bg: "bg-accent/5",
              border: "border-accent/20",
            },
            {
              label: "Overdue",
              value: formatCurrency(stats.overdue, defaultCurrency),
              sub: `${payments.filter((p) => p.status === "Overdue").length} past due`,
              color: "text-red-400",
              bg: "bg-red-500/5",
              border: "border-red-500/20",
            },
            {
              label: "Collection Rate",
              value: `${stats.collectionRate.toFixed(1)}%`,
              sub: "of all invoices paid",
              color: "text-foreground",
              bg: "bg-surface",
              border: "border-border-custom",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border ${card.border} ${card.bg} px-4 py-4`}
            >
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs font-semibold text-foreground mt-1">{card.label}</p>
              <p className="text-2xs text-muted-custom mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Collection trend chart */}
        <section className="rounded-xl border border-border-custom bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Collection Trend</h2>
              <p className="text-2xs text-muted-custom mt-0.5">Monthly payment volume over the last 12 months</p>
            </div>
            <span className={`text-2xs font-semibold px-2 py-1 rounded-full ${
              chartData.growthRate >= 0
                ? "text-success-custom bg-success-custom/10 border border-success-custom/20"
                : "text-red-400 bg-red-500/10 border border-red-500/20"
            }`}>
              {chartData.growthRate >= 0 ? "+" : ""}{chartData.growthRate.toFixed(1)}% vs last period
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-[80px]">
            {chartData.heights.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${(val / 100) * 72}px`,
                    backgroundColor: i === chartData.heights.length - 1 ? "var(--accent)" : "rgba(99,102,241,0.25)",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {chartData.months.map((m) => (
              <span key={m} className="text-[9px] text-muted-custom font-medium flex-1 text-center">{m}</span>
            ))}
          </div>
        </section>

        {/* Payments table */}
        <section className="rounded-xl border border-border-custom bg-surface overflow-hidden">
          <div className="border-b border-border-custom px-6 py-3 flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {(["All", "Paid", "Pending", "Overdue"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === f
                      ? "bg-background text-foreground border border-border-custom"
                      : "text-muted-custom hover:text-foreground border border-transparent"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative ml-auto">
              <span className="absolute left-3 top-2.5 text-muted-custom">
                <SearchIcon size={13} />
              </span>
              <input
                type="text"
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[200px] rounded-lg border border-border-custom bg-background py-1.5 pl-8 pr-4 text-xs text-foreground placeholder-muted-custom focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-background/50 border-b border-border-custom text-muted-custom">
                <tr>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs">Invoice</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs">Client</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs">Method</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs">Date</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs">Due</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs text-right">Amount</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs text-center">Status</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-2xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {filtered.length > 0 ? (
                  filtered.map((p) => (
                    <tr key={p.invoiceId} className="group hover:bg-background/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-foreground">{p.invoiceId}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{p.clientName}</p>
                        <p className="text-2xs text-muted-custom">{p.clientEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-border-custom bg-background/50 px-2 py-0.5 text-2xs font-medium text-muted-custom">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-custom">{p.date}</td>
                      <td className="px-6 py-4 text-muted-custom">{p.dueDate}</td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold border ${
                            p.status === "Paid"
                              ? "border-success-custom/20 bg-success-custom/10 text-success-custom"
                              : p.status === "Pending"
                              ? "border-accent/20 bg-accent/10 text-accent"
                              : "border-red-500/20 bg-red-500/10 text-red-500"
                          }`}
                        >
                          {p.status === "Paid" && <CheckIcon size={9} />}
                          {p.status === "Pending" && <ClockIcon size={9} />}
                          {p.status === "Overdue" && <AlertIcon size={9} />}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.status !== "Paid" && (
                          <button
                            onClick={() => onUpdateStatus(p.invoiceId, "Paid")}
                            className="opacity-0 group-hover:opacity-100 rounded-md border border-success-custom/20 bg-success-custom/10 px-2 py-1 text-2xs font-semibold text-success-custom hover:bg-success-custom/20 transition-all"
                          >
                            Mark Paid
                          </button>
                        )}
                        {p.status === "Paid" && (
                          <span className="text-2xs text-muted-custom font-mono">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-muted-custom/40"><PaymentsIcon size={32} /></span>
                        <p className="text-sm font-semibold text-muted-custom">No payments found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </motion.div>
  );
};
