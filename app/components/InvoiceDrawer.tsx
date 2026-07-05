import React, { useState } from "react";
import {
  CloseIcon,
  CheckIcon,
  ClockIcon,
  AlertIcon,
  FileDownIcon,
  TrashIcon,
} from "./Icons";
import { formatCurrency } from "../lib/currencies";

interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: string;
  clientId?: string;          // links to Client.id when the client exists in the database
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
  /** ISO 4217 currency code, e.g. "USD", "INR", "EUR". Defaults to "USD". */
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

interface InvoiceDrawerProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: "Paid" | "Pending" | "Overdue") => void;
  onDeleteInvoice: (id: string) => void;
  onEditInvoice: (invoice: Invoice) => void;
}

export const InvoiceDrawer: React.FC<InvoiceDrawerProps> = ({
  invoice,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteInvoice,
  onEditInvoice,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!invoice) return null;

  // Mock download action
  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert(`Downloaded invoice ${invoice.id} successfully.`);
    }, 1200);
  };

  const getStatusBadge = (status: "Paid" | "Pending" | "Overdue") => {
    switch (status) {
      case "Paid":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success-custom/20 bg-success-custom/10 px-2.5 py-1 text-xs font-semibold text-success-custom">
            <CheckIcon size={12} />
            Paid
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            <ClockIcon size={12} />
            Pending
          </span>
        );
      case "Overdue":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500">
            <AlertIcon size={12} />
            Overdue
          </span>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border-custom bg-surface transition-transform duration-300 ease-in-out sm:max-w-md md:max-w-lg ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-custom px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-custom">{invoice.id}</span>
            {getStatusBadge(invoice.status)}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-custom hover:bg-border-custom hover:text-foreground transition-colors"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Quick Actions Panel */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border-custom pb-6">
            {invoice.status !== "Paid" && (
              <button
                onClick={() => onUpdateStatus(invoice.id, "Paid")}
                className="flex items-center gap-2 rounded-lg bg-success-custom/10 border border-success-custom/20 px-3 py-1.5 text-xs font-semibold text-success-custom transition-all hover:bg-success-custom/20"
              >
                <CheckIcon size={14} />
                Mark as Paid
              </button>
            )}
            {invoice.status === "Paid" && (
              <button
                onClick={() => onUpdateStatus(invoice.id, "Pending")}
                className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20"
              >
                <ClockIcon size={14} />
                Revert to Pending
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 rounded-lg border border-border-custom px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-border-custom hover:text-foreground disabled:opacity-50"
            >
              <FileDownIcon size={14} />
              {isDownloading ? "Downloading..." : "Export PDF"}
            </button>
            <button
              onClick={() => {
                onEditInvoice(invoice);
                onClose();
              }}
              className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20"
            >
              Edit Visually
            </button>
            <button
              onClick={() => {
                onDeleteInvoice(invoice.id);
              }}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 ml-auto"
            >
              <TrashIcon size={14} />
              Delete
            </button>
          </div>

          {/* Client Details */}
          <div>
            <h4 className="text-2xs font-semibold uppercase tracking-wider text-muted-custom mb-3">
              Client & Details
            </h4>
            <div className="rounded-lg border border-border-custom bg-background/50 p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-muted-custom">Client Name</span>
                <span className="text-xs font-medium text-foreground">{invoice.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-custom">Email</span>
                <span className="text-xs font-medium text-foreground">{invoice.clientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-custom">Address</span>
                <span className="text-xs font-medium text-foreground text-right max-w-[200px] truncate">
                  {invoice.clientAddress}
                </span>
              </div>
              <div className="h-[1px] bg-border-custom my-2" />
              <div className="flex justify-between">
                <span className="text-xs text-muted-custom">Invoice Date</span>
                <span className="text-xs font-medium text-foreground">{invoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-custom">Due Date</span>
                <span className="text-xs font-medium text-foreground">{invoice.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Itemized Invoice Breakdown */}
          <div>
            <h4 className="text-2xs font-semibold uppercase tracking-wider text-muted-custom mb-3">
              Items
            </h4>
            <div className="overflow-hidden rounded-lg border border-border-custom">
              <table className="w-full text-left text-xs">
                <thead className="bg-background text-muted-custom font-semibold">
                  <tr>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-background/20">
                      <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                      <td className="px-4 py-3 text-right text-muted-custom">{item.qty}</td>
                      <td className="px-4 py-3 text-right text-muted-custom">
                        {formatCurrency(item.rate, invoice.currency ?? "USD")}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {formatCurrency(item.qty * item.rate, invoice.currency ?? "USD")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-background/80 border-t border-border-custom px-4 py-3 flex justify-between items-center text-sm font-bold">
                <span className="text-muted-custom">Total Amount</span>
                <span className="text-foreground">{formatCurrency(invoice.amount, invoice.currency ?? "USD")}</span>
              </div>
            </div>
          </div>

          {/* Chronological Audit Timeline */}
          <div>
            <h4 className="text-2xs font-semibold uppercase tracking-wider text-muted-custom mb-4">
              Invoice History
            </h4>
            <div className="relative pl-6 border-l border-border-custom space-y-6">
              {/* Event 3: Current Status */}
              <div className="relative">
                <div
                  className={`absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full border ${
                    invoice.status === "Paid"
                      ? "border-success-custom bg-success-custom/20 text-success-custom"
                      : invoice.status === "Overdue"
                      ? "border-red-500 bg-red-500/20 text-red-500"
                      : "border-accent bg-accent/20 text-accent"
                  }`}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-current" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-semibold text-foreground">
                      Invoice marked as {invoice.status}
                    </h5>
                    <p className="text-2xs text-muted-custom mt-0.5">
                      System updated state dynamically
                    </p>
                  </div>
                  <span className="text-2xs text-muted-custom">{invoice.dueDate}</span>
                </div>
              </div>

              {/* Event 2: Sent to Client */}
              <div className="relative">
                <div className="absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-border-custom bg-background text-muted-custom">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-custom" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-medium text-foreground">
                      Delivered to {invoice.clientEmail}
                    </h5>
                    <p className="text-2xs text-muted-custom mt-0.5">Emailed via SILEX Mailer</p>
                  </div>
                  <span className="text-2xs text-muted-custom">{invoice.date}</span>
                </div>
              </div>

              {/* Event 1: Invoice Created */}
              <div className="relative">
                <div className="absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-border-custom bg-background text-muted-custom">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-custom" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-medium text-foreground">Invoice created</h5>
                    <p className="text-2xs text-muted-custom mt-0.5">Initialized on dashboard</p>
                  </div>
                  <span className="text-2xs text-muted-custom">{invoice.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
