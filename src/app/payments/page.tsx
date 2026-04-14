"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { apiRequest } from "@/lib/api";

type Member = {
  id: string;
  name: string;
  phone: string;
  membershipPlanId: string;
  membershipPlan?: {
    id: string;
    name: string;
    billingCycle: string;
  };
};

type Payment = {
  id: string;
  memberId: string;
  amount: string | number;
  paymentDate: string;
  nextDueDate: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  status: "paid" | "overdue";
  notes?: string | null;
  member: {
    id: string;
    name: string;
    phone: string;
    membershipPlan?: {
      id: string;
      name: string;
      billingCycle: string;
    };
  };
};

type PaymentFormState = {
  memberId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
};

const initialFormState: PaymentFormState = {
  memberId: "",
  amount: "",
  paymentDate: "",
  paymentMethod: "cash",
  referenceNumber: "",
  notes: ""
};

const formatCurrency = (value: string | number): string => {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(amount);
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
};

export default function PaymentsPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<PaymentFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadPageData = async (query = searchQuery) => {
    if (!token) {
      setPayments([]);
      setMembers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [paymentsResponse, membersResponse] = await Promise.all([
        apiRequest<Payment[]>(`/payments${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`, {
          token
        }),
        apiRequest<Member[]>("/members", { token })
      ]);

      setPayments(paymentsResponse);
      setMembers(membersResponse);

      setForm((current) => ({
        ...current,
        memberId: current.memberId || membersResponse[0]?.id || ""
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPageData();
  }, [token, searchQuery]);

  const overduePayments = useMemo(
    () => payments.filter((payment) => payment.status === "overdue"),
    [payments]
  );

  const totalRevenue = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    [payments]
  );

  const paymentsToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return payments.filter((payment) => payment.paymentDate.slice(0, 10) === today).length;
  }, [payments]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Add a JWT token before calling the backend.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest<Payment>("/payments", {
        method: "POST",
        token,
        body: {
          memberId: form.memberId,
          amount: Number(form.amount),
          paymentDate: form.paymentDate,
          paymentMethod: form.paymentMethod,
          referenceNumber: form.referenceNumber || undefined,
          notes: form.notes || undefined
        }
      });

      setSuccessMessage("Payment recorded successfully.");
      setForm((current) => ({
        ...initialFormState,
        paymentMethod: current.paymentMethod,
        memberId: current.memberId
      }));
      await loadPageData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="relative overflow-hidden rounded-[34px] border border-line bg-[linear-gradient(135deg,#20453d_0%,#17322d_48%,#c96f3b_180%)] p-7 text-white shadow-float md:p-9">
          <div className="absolute left-[-1rem] top-[-1rem] h-28 w-28 rounded-full border border-white/15" />
          <div className="absolute bottom-8 right-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/80">Payments</p>
          <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold tracking-tight md:text-5xl">
            Revenue, renewals, and due risk
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            Record collections fast, scan overdue members instantly, and keep the cashflow view readable.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Transactions</p>
              <p className="mt-2 text-3xl font-semibold">{payments.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Revenue</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Overdue</p>
              <p className="mt-2 text-3xl font-semibold">{overduePayments.length}</p>
            </div>
          </div>
        </div>

        <SectionCard
          title="Connected Session"
          description="This page uses the shared admin or staff login automatically."
        >
          <div className="grid gap-3">
            <div className="rounded-[22px] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Auth status</p>
              <p className="mt-2 text-sm font-medium text-slate-700">{token ? "Session active" : "No active session"}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void loadPageData()}
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accentDark"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Payments" value={String(payments.length)} detail="Recorded transactions" />
        <MetricCard label="Revenue" value={formatCurrency(totalRevenue)} detail="All recorded payments" />
        <MetricCard label="Payments Today" value={String(paymentsToday)} detail="Transactions collected today" />
        <MetricCard
          label="Overdue Members"
          value={String(overduePayments.length)}
          detail="Accounts needing follow-up"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.6fr]">
        <SectionCard title="Record Payment" description="Add a new payment and calculate the next due date automatically.">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Member
              <select
                value={form.memberId}
                onChange={(event) => setForm((current) => ({ ...current, memberId: event.target.value }))}
                className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              >
                <option value="">Select member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.phone})
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="40.00"
                  className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Payment Date
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))}
                  className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Payment Method
              <select
                value={form.paymentMethod}
                onChange={(event) =>
                  setForm((current) => ({ ...current, paymentMethod: event.target.value }))
                }
                className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Reference Number
              <input
                value={form.referenceNumber}
                onChange={(event) =>
                  setForm((current) => ({ ...current, referenceNumber: event.target.value }))
                }
                placeholder="Optional reference"
                className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Notes
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
                placeholder="Optional notes"
                className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-accent"
              />
            </label>

            {(error || successMessage) && (
              <div
                className={`rounded-[20px] px-4 py-3 text-sm ${
                  error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {error ?? successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Add Payment"}
            </button>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Overdue Members"
            description="Members with payments that have passed the next due date."
          >
            <div className="grid gap-3">
              {isLoading ? (
                <div className="rounded-[22px] bg-sand px-4 py-5 text-sm text-slate-500">Loading overdue accounts...</div>
              ) : overduePayments.length === 0 ? (
                <div className="rounded-[22px] bg-emerald-50 px-4 py-5 text-sm text-emerald-700">
                  No overdue members right now.
                </div>
              ) : (
                overduePayments.map((payment) => (
                  <article
                    key={payment.id}
                    className="rounded-[24px] border border-rose-200 bg-[linear-gradient(180deg,#fff1ef,#ffe7e2)] px-5 py-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-rose-900">{payment.member.name}</p>
                        <p className="text-sm text-rose-700">
                          Due on {formatDate(payment.nextDueDate)} | {payment.member.phone}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-rose-700">
                        overdue
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Payment History" description="Recent payment activity across all members.">
            <div className="mb-4">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search payments by member name, phone, or reference"
                className="w-full rounded-[20px] border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
              />
            </div>
            <div className="grid gap-4">
              {isLoading ? (
                <div className="rounded-[22px] bg-sand px-4 py-5 text-sm text-slate-500">Loading payments...</div>
              ) : payments.length === 0 ? (
                <div className="rounded-[22px] bg-sand px-4 py-5 text-sm text-slate-500">
                  No payments found. Add a token and record the first payment.
                </div>
              ) : (
                payments.map((payment) => (
                  <article
                    key={payment.id}
                    className={`grid gap-4 rounded-[24px] border p-5 transition lg:grid-cols-[1.35fr_repeat(4,1fr)] lg:items-center ${
                      payment.status === "overdue"
                        ? "border-rose-200 bg-[linear-gradient(180deg,#fff5f3,#ffece7)]"
                        : "border-line bg-[linear-gradient(180deg,#fffdf8,#faf5ee)]"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{payment.member.name}</p>
                      <p className="text-sm text-slate-500">
                        {payment.paymentMethod} | {payment.member.membershipPlan?.name ?? "Plan"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Amount</p>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Paid On</p>
                      <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Next Due</p>
                      <p className="font-medium">{formatDate(payment.nextDueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                          payment.status === "overdue"
                            ? "bg-white text-rose-700"
                            : "bg-white text-emerald-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
