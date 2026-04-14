"use client";

import { useEffect, useMemo, useState } from "react";

import { ChampionBrand } from "@/components/layout/champion-brand";
import { useAuth } from "@/components/auth/auth-provider";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { apiRequest } from "@/lib/api";

type DashboardSummary = {
  totalMembers: number;
  paidMembers: number;
  unpaidMembers: number;
  dueTodayMembers: number;
  overdueMembers: number;
  totalRevenue: number;
  paymentsToday: {
    count: number;
    totalAmount: number;
  };
  revenueRange: {
    preset: RevenuePreset;
    label: string;
    from: string | null;
    to: string | null;
    totalAmount: number;
    paymentCount: number;
  };
};

type RevenuePreset = "today" | "last7days" | "lastMonth" | "custom" | "all";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);

const clampPercent = (value: number) => `${Math.max(0, Math.min(100, value))}%`;

const formatDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const todayInput = formatDateInput(new Date());

const createPresetQuery = (preset: RevenuePreset, from: string, to: string) => {
  const params = new URLSearchParams();
  params.set("preset", preset);

  if (preset === "custom") {
    params.set("from", from);
    params.set("to", to);
  }

  return params.toString();
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<RevenuePreset>("today");
  const [customFrom, setCustomFrom] = useState(todayInput);
  const [customTo, setCustomTo] = useState(todayInput);

  const loadSummary = async (
    preset: RevenuePreset = selectedPreset,
    from: string = customFrom,
    to: string = customTo
  ) => {
    if (!token) {
      setSummary(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = createPresetQuery(preset, from, to);
      const data = await apiRequest<DashboardSummary>(`/dashboard/summary?${query}`, { token });
      setSummary(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, [token]);

  const paidRate = useMemo(() => {
    if (!summary || summary.totalMembers === 0) {
      return 0;
    }

    return Math.round((summary.paidMembers / summary.totalMembers) * 100);
  }, [summary]);

  const overdueRate = useMemo(() => {
    if (!summary || summary.totalMembers === 0) {
      return 0;
    }

    return Math.round((summary.overdueMembers / summary.totalMembers) * 100);
  }, [summary]);

  const donutStyle = useMemo(() => {
    const active = paidRate;
    const expired = overdueRate;

    return {
      background: `conic-gradient(#f4ab20 0 ${active}%, #111111 ${active}% ${
        active + expired
      }%, #e9ebef ${active + expired}% 100%)`
    };
  }, [paidRate, overdueRate]);

  const metrics = [
    {
      label: "Total Members",
      value: String(summary?.totalMembers ?? 0),
      detail: "Registered members in the system"
    },
    {
      label: "Revenue",
      value: formatCurrency(summary?.totalRevenue ?? 0),
      detail: "Total paid revenue recorded"
    },
    {
      label: "Paid Members",
      value: String(summary?.paidMembers ?? 0),
      detail: `${paidRate}% of all members`
    },
    {
      label: "Overdue Members",
      value: String(summary?.overdueMembers ?? 0),
      detail: `${overdueRate}% of all members`
    }
  ];

  const revenuePresets: Array<{ value: RevenuePreset; label: string }> = [
    { value: "today", label: "Today" },
    { value: "last7days", label: "Last 7 Days" },
    { value: "lastMonth", label: "Last Month" },
    { value: "all", label: "All Time" },
    { value: "custom", label: "Custom" }
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,#05070a_0%,#0d1219_58%,#1d232c_100%)] p-7 text-white shadow-float md:p-9">
          <div className="absolute right-[-4rem] top-[-5rem] h-44 w-44 rounded-full border border-white/10" />
          <div className="absolute bottom-[-2rem] right-16 h-28 w-28 rounded-full bg-accent/20 blur-2xl" />
          <ChampionBrand compact tone="dark" className="relative z-10" />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.32em] text-accent">Overview</p>
          <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold tracking-tight md:text-5xl">
            Champion Gym performance dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
            Run the floor from one command view: memberships, collections, and renewal risk with a stronger brand-led interface.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-accent/80">Members</p>
              <p className="mt-2 text-3xl font-semibold">{summary?.totalMembers ?? 0}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-accent/80">Revenue</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(summary?.totalRevenue ?? 0)}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-accent/80">Payments Today</p>
              <p className="mt-2 text-3xl font-semibold">{summary?.paymentsToday.count ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[30px] border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,247,249,0.92))] p-6 shadow-panel">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Revenue Pulse</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Track revenue by period</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Switch between fast presets or choose a custom range to see how much cash came in for that period.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {revenuePresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset.value);

                  if (preset.value !== "custom") {
                    void loadSummary(preset.value, customFrom, customTo);
                  }
                }}
                className={`rounded-[18px] border px-4 py-3 text-left text-sm font-medium transition ${
                  selectedPreset === preset.value
                    ? "border-accent bg-accent text-[#111111]"
                    : "border-line bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-[22px] border border-line bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {summary?.revenueRange.label ?? "Selected revenue"}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatCurrency(summary?.revenueRange.totalAmount ?? 0)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {summary?.revenueRange.paymentCount ?? 0} paid transaction
              {(summary?.revenueRange.paymentCount ?? 0) === 1 ? "" : "s"} in this range
            </p>
          </div>
          {selectedPreset === "custom" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">From</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                  className="mt-2 w-full rounded-[16px] border border-line bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">To</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                  className="mt-2 w-full rounded-[16px] border border-line bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-accent"
                />
              </label>
            </div>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void loadSummary(selectedPreset, customFrom, customTo)}
              className="rounded-full bg-[linear-gradient(135deg,#f4ab20_0%,#cb8400_100%)] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-95"
            >
              Apply Revenue Filter
            </button>
            <button
              type="button"
              onClick={() => void loadSummary()}
              className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Refresh Dashboard
            </button>
          </div>
          <div className="mt-4 rounded-[22px] bg-sand px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quick read</p>
            <p className="mt-2 text-sm text-slate-600">
              Today collected {formatCurrency(summary?.paymentsToday.totalAmount ?? 0)} across{" "}
              {summary?.paymentsToday.count ?? 0} payment
              {(summary?.paymentsToday.count ?? 0) === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <SectionCard
          title="Payment Status"
          description="Simple distribution of paid, due-today, and overdue memberships."
        >
          <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-center">
            <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-full border border-line" style={donutStyle}>
              <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-panel text-center shadow-panel">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Paid</span>
                <span className="mt-1 text-3xl font-semibold">{paidRate}%</span>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Paid members</span>
                  <span className="text-slate-500">{summary?.paidMembers ?? 0}</span>
                </div>
                <div className="h-3 rounded-full bg-[#eceff3]">
                  <div className="h-3 rounded-full bg-accent" style={{ width: clampPercent(paidRate) }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Overdue members</span>
                  <span className="text-slate-500">{summary?.overdueMembers ?? 0}</span>
                </div>
                <div className="h-3 rounded-full bg-[#eceff3]">
                  <div className="h-3 rounded-full bg-[#111111]" style={{ width: clampPercent(overdueRate) }} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[24px] border border-line bg-sand p-4">
                  <p className="text-sm text-slate-500">Due today</p>
                  <p className="mt-2 text-2xl font-semibold">{summary?.dueTodayMembers ?? 0}</p>
                </div>
                <div className="rounded-[24px] border border-line bg-sand p-4">
                  <p className="text-sm text-slate-500">Unpaid members</p>
                  <p className="mt-2 text-2xl font-semibold">{summary?.unpaidMembers ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Revenue Snapshot" description="Small chart view for quick financial scanning.">
          <div className="space-y-6">
            <div className="rounded-[30px] bg-[linear-gradient(135deg,#111111_0%,#1d222b_55%,#f4ab20_180%)] p-6 text-white shadow-float">
              <p className="text-sm text-white/70">Total revenue</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">
                {formatCurrency(summary?.totalRevenue ?? 0)}
              </p>
              <p className="mt-2 text-sm text-white/70">
                Based on payments recorded with status marked as paid.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Total members</span>
                  <span>{summary?.totalMembers ?? 0}</span>
                </div>
                <div className="h-12 rounded-[20px] bg-[#eceff3] p-1">
                  <div
                    className="flex h-full items-center rounded-[16px] bg-[#111111] px-4 text-sm font-semibold text-white"
                    style={{ width: clampPercent(summary ? 100 : 0) }}
                  >
                    Base
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Paid members</span>
                  <span>{summary?.paidMembers ?? 0}</span>
                </div>
                <div className="h-12 rounded-[20px] bg-[#eceff3] p-1">
                  <div
                    className="flex h-full items-center rounded-[16px] bg-accent px-4 text-sm font-semibold text-white"
                    style={{ width: clampPercent(paidRate) }}
                  >
                    {paidRate}%
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Overdue members</span>
                  <span>{summary?.overdueMembers ?? 0}</span>
                </div>
                <div className="h-12 rounded-[20px] bg-[#eceff3] p-1">
                  <div
                    className="flex h-full items-center rounded-[16px] bg-[#111111] px-4 text-sm font-semibold text-white"
                    style={{ width: clampPercent(overdueRate) }}
                  >
                    {overdueRate}%
                  </div>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="rounded-[22px] bg-sand px-4 py-3 text-sm text-slate-500">
                Loading dashboard data...
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
