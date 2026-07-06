"use client";

import React from "react";

// Common Shimmer block base
export const ShimmerBlock: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = "", style }) => (
  <div className={`rounded bg-border-custom/50 animate-shimmer ${className}`} style={style} />
);

// 1. Dashboard Page Skeleton
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
      {/* Header */}
      <header className="border-b border-border-custom px-6 py-4 flex items-center justify-between gap-4 sticky top-0 bg-background/85 backdrop-blur-md z-30">
        <div className="space-y-1.5">
          <ShimmerBlock className="w-32 h-6" />
          <ShimmerBlock className="w-56 h-3" />
        </div>
        <div className="flex items-center gap-3">
          <ShimmerBlock className="w-48 h-8 hidden md:block" />
          <ShimmerBlock className="w-24 h-8" />
        </div>
      </header>

      {/* Grid of Metric Cards */}
      <main className="p-6 space-y-8 flex-1">
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border-custom bg-surface p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <ShimmerBlock className="w-24 h-3.5" />
                <ShimmerBlock className="w-16 h-3" />
              </div>
              <ShimmerBlock className="w-36 h-8" />
              {/* Fake mini-graph */}
              <div className="flex items-end gap-1 h-8 pt-2">
                {[1, 2, 3, 4, 5, 6, 7].map((b) => (
                  <ShimmerBlock key={b} className="flex-1" style={{ height: `${[40, 75, 50, 90, 60, 80, 45][(b - 1) % 7]}%` }} />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Invoices List Table */}
        <section className="rounded-xl border border-border-custom bg-surface overflow-hidden">
          <div className="border-b border-border-custom px-6 py-4 flex justify-between items-center">
            <ShimmerBlock className="w-32 h-7" />
            <ShimmerBlock className="w-24 h-7" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="flex items-center justify-between py-3 border-b border-border-custom last:border-0">
                <div className="flex items-center gap-3 flex-1">
                  <ShimmerBlock className="w-7 h-7 rounded-full" />
                  <div className="space-y-1.5">
                    <ShimmerBlock className="w-32 h-3.5" />
                    <ShimmerBlock className="w-24 h-2.5" />
                  </div>
                </div>
                <ShimmerBlock className="w-20 h-3.5 hidden md:block" />
                <ShimmerBlock className="w-16 h-3.5" />
                <ShimmerBlock className="w-16 h-5 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

// 2. Invoices Page Skeleton
export const InvoicesSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
      {/* Header */}
      <header className="border-b border-border-custom px-6 py-4 flex items-center justify-between gap-4 sticky top-0 bg-background/85 backdrop-blur-md z-30">
        <div className="space-y-1.5">
          <ShimmerBlock className="w-24 h-6" />
          <ShimmerBlock className="w-40 h-3" />
        </div>
        <div className="flex items-center gap-3">
          <ShimmerBlock className="w-48 h-8 hidden md:block" />
          <ShimmerBlock className="w-24 h-8" />
        </div>
      </header>

      <main className="p-6 space-y-6 flex-1">
        {/* Metric rows */}
        <div className="flex gap-4 border-b border-border-custom pb-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 min-w-[120px] space-y-1.5">
              <ShimmerBlock className="w-12 h-3" />
              <ShimmerBlock className="w-20 h-5" />
            </div>
          ))}
        </div>

        {/* Table outline */}
        <div className="rounded-xl border border-border-custom bg-surface p-6 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex justify-between items-center py-3.5 border-b border-border-custom/60 last:border-0">
              <ShimmerBlock className="w-20 h-3.5" />
              <div className="flex items-center gap-3 flex-1 px-8">
                <ShimmerBlock className="w-7 h-7 rounded-full" />
                <ShimmerBlock className="w-24 h-3.5" />
              </div>
              <ShimmerBlock className="w-24 h-3.5 hidden md:block" />
              <ShimmerBlock className="w-16 h-3.5" />
              <ShimmerBlock className="w-20 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// 3. Clients Page Skeleton
export const ClientsSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
      {/* Header */}
      <header className="border-b border-border-custom px-6 py-4 flex items-center justify-between gap-4 sticky top-0 bg-background/85 backdrop-blur-md z-30">
        <div className="space-y-1.5">
          <ShimmerBlock className="w-20 h-6" />
          <ShimmerBlock className="w-48 h-3" />
        </div>
        <ShimmerBlock className="w-24 h-8" />
      </header>

      {/* KPI Stats Bar */}
      <div className="border-b border-border-custom px-6 py-3 flex gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <ShimmerBlock className="w-16 h-4" />
            <ShimmerBlock className="w-10 h-3" />
          </div>
        ))}
      </div>

      {/* Left panel / right details columns */}
      <main className="flex-1 flex min-h-0">
        <div className="w-[340px] shrink-0 p-4 border-r border-border-custom/50 space-y-3 hidden md:block">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border-custom bg-surface p-4 space-y-3">
              <div className="flex items-center gap-3">
                <ShimmerBlock className="w-8 h-8 rounded-lg" />
                <div className="space-y-1.5">
                  <ShimmerBlock className="w-24 h-3.5" />
                  <ShimmerBlock className="w-16 h-2.5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="flex justify-between">
            <ShimmerBlock className="w-44 h-6" />
            <div className="flex gap-2">
              <ShimmerBlock className="w-16 h-7" />
              <ShimmerBlock className="w-16 h-7" />
            </div>
          </div>
          <ShimmerBlock className="w-full h-40 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <ShimmerBlock className="h-32 rounded-xl" />
            <ShimmerBlock className="h-32 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
};

// 4. Payments Page Skeleton
export const PaymentsSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
      <header className="border-b border-border-custom px-6 py-4 flex items-center justify-between gap-4 sticky top-0 bg-background/85 backdrop-blur-md z-30">
        <div className="space-y-1.5">
          <ShimmerBlock className="w-24 h-6" />
          <ShimmerBlock className="w-48 h-3" />
        </div>
        <ShimmerBlock className="w-44 h-8" />
      </header>

      <main className="p-6 space-y-6 flex-1">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border-custom bg-surface p-5 space-y-3">
              <ShimmerBlock className="w-20 h-3" />
              <ShimmerBlock className="w-28 h-6" />
            </div>
          ))}
        </div>

        {/* Chart Card */}
        <div className="rounded-xl border border-border-custom bg-surface p-5 space-y-4">
          <div className="flex justify-between">
            <ShimmerBlock className="w-40 h-4" />
            <ShimmerBlock className="w-24 h-3.5" />
          </div>
          {/* Chart Outline */}
          <div className="h-44 flex items-end gap-3 pt-6 border-b border-border-custom pb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <ShimmerBlock key={i} className="flex-1 rounded-t" style={{ height: `${[30, 45, 35, 60, 40, 70, 50, 85, 55, 90, 65, 80][(i - 1) % 12]}%` }} />
            ))}
          </div>
          <div className="flex justify-between px-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ShimmerBlock key={i} className="w-8 h-2.5" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

// 5. Templates Page Skeleton
export const TemplatesSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
      <header className="border-b border-border-custom px-6 py-4 flex items-center justify-between gap-4 sticky top-0 bg-background/85 backdrop-blur-md z-30">
        <div className="space-y-1.5">
          <ShimmerBlock className="w-24 h-6" />
          <ShimmerBlock className="w-52 h-3" />
        </div>
      </header>

      <main className="p-6 space-y-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border-custom bg-surface p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <ShimmerBlock className="w-20 h-4" />
                  <ShimmerBlock className="w-48 h-3" />
                </div>
                <ShimmerBlock className="w-8 h-5 rounded-full" />
              </div>
              {/* Fake visual invoice outline inside template */}
              <div className="h-28 rounded-lg bg-background border border-border-custom p-4 space-y-3">
                <div className="flex justify-between">
                  <ShimmerBlock className="w-12 h-3" />
                  <ShimmerBlock className="w-16 h-3" />
                </div>
                <div className="h-[1px] bg-border-custom w-full" />
                <ShimmerBlock className="w-28 h-2" />
                <ShimmerBlock className="w-20 h-2" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// 6. Settings Page Skeleton
export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
      <header className="border-b border-border-custom px-6 py-4 flex items-center justify-between gap-4 sticky top-0 bg-background/85 backdrop-blur-md z-30">
        <div className="space-y-1.5">
          <ShimmerBlock className="w-36 h-6" />
          <ShimmerBlock className="w-64 h-3" />
        </div>
        <ShimmerBlock className="w-24 h-8" />
      </header>

      <main className="flex-1 flex min-h-0">
        {/* Left side tabs outline */}
        <div className="w-[200px] shrink-0 p-4 border-r border-border-custom/50 space-y-2.5 hidden md:block">
          {[1, 2, 3, 4, 5].map((i) => (
            <ShimmerBlock key={i} className="w-full h-8 rounded-lg" />
          ))}
        </div>

        {/* Form Body */}
        <div className="flex-1 p-6 space-y-6 max-w-xl">
          <ShimmerBlock className="w-28 h-5" />
          <div className="space-y-4 rounded-xl border border-border-custom bg-surface p-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <ShimmerBlock className="w-20 h-3" />
                <ShimmerBlock className="w-full h-8 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

// 7. Invoice Builder Skeleton
export const InvoiceBuilderSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-[#09090b] text-foreground select-none overflow-hidden relative">
      {/* Left Workspace collapse sidebar skeleton */}
      <div className="w-[64px] border-r border-border-custom bg-background flex flex-col items-center py-4 space-y-6 hidden md:flex">
        <ShimmerBlock className="w-8 h-8 rounded-lg" />
        <div className="h-[1px] w-6 bg-border-custom" />
        {[1, 2, 3].map((i) => (
          <ShimmerBlock key={i} className="w-8 h-8 rounded-lg" />
        ))}
      </div>

      {/* Main Canvas Placeholder */}
      <div className="flex-1 bg-[#0f0f12] overflow-y-auto flex flex-col items-center py-12 px-6">
        <div className="w-full max-w-[812px] mb-6 flex justify-between">
          <ShimmerBlock className="w-24 h-4" />
          <ShimmerBlock className="w-16 h-4" />
        </div>
        {/* Mock A4 sheet */}
        <div className="w-[595px] h-[842px] bg-[#111113] border border-border-custom rounded-2xl shadow-2xl p-10 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <ShimmerBlock className="w-24 h-8 rounded" />
              <ShimmerBlock className="w-32 h-3" />
              <ShimmerBlock className="w-20 h-3" />
            </div>
            <div className="space-y-3 items-end flex flex-col">
              <ShimmerBlock className="w-28 h-6 rounded" />
              <ShimmerBlock className="w-24 h-3" />
            </div>
          </div>
          <div className="h-[1px] bg-border-custom my-8" />
          <div className="flex-1 space-y-6">
            <ShimmerBlock className="w-32 h-4" />
            <ShimmerBlock className="w-full h-32 rounded-lg" />
          </div>
          <div className="flex justify-between items-end border-t border-border-custom pt-6">
            <ShimmerBlock className="w-40 h-8" />
            <ShimmerBlock className="w-32 h-16" />
          </div>
        </div>
      </div>

      {/* Right Designer Panel Placeholder */}
      <div className="w-[300px] border-l border-border-custom bg-background p-6 space-y-6 hidden lg:block">
        <div className="flex justify-between border-b border-border-custom pb-4">
          <ShimmerBlock className="w-28 h-4" />
          <ShimmerBlock className="w-12 h-3" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <ShimmerBlock className="w-20 h-3" />
            <ShimmerBlock className="w-full h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};
