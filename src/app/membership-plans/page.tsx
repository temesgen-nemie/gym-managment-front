"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { SectionCard } from "@/components/dashboard/section-card";
import { apiRequest } from "@/lib/api";

type MembershipPlan = {
  id: string;
  name: string;
  description?: string | null;
  durationDays: number;
  price: string | number;
  billingCycle: string;
  isActive: boolean;
};

type PlanFormState = {
  name: string;
  description: string;
  durationDays: string;
  price: string;
  billingCycle: string;
  isActive: boolean;
};

const initialFormState: PlanFormState = {
  name: "",
  description: "",
  durationDays: "",
  price: "",
  billingCycle: "monthly",
  isActive: true
};

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(Number(value));

export default function MembershipPlansPage() {
  const { token, session } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [form, setForm] = useState<PlanFormState>(initialFormState);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAdmin = session?.user.role === "admin";

  const loadPlans = async () => {
    if (!token) {
      setPlans([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiRequest<MembershipPlan[]>("/membership-plans", { token });
      setPlans(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, [token]);

  const submitLabel = useMemo(
    () => (editingPlanId ? "Update Plan" : "Create Plan"),
    [editingPlanId]
  );

  const resetForm = () => {
    setForm(initialFormState);
    setEditingPlanId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("You must be logged in.");
      return;
    }

    if (!isAdmin) {
      setError("Only admins can create or update membership plans.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const path = editingPlanId ? `/membership-plans/${editingPlanId}` : "/membership-plans";
      const method = editingPlanId ? "PUT" : "POST";

      await apiRequest<MembershipPlan>(path, {
        method,
        token,
        body: {
          name: form.name,
          description: form.description || undefined,
          durationDays: Number(form.durationDays),
          price: Number(form.price),
          billingCycle: form.billingCycle,
          isActive: form.isActive
        }
      });

      setSuccessMessage(editingPlanId ? "Membership plan updated." : "Membership plan created.");
      resetForm();
      await loadPlans();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      durationDays: String(plan.durationDays),
      price: String(plan.price),
      billingCycle: plan.billingCycle,
      isActive: plan.isActive
    });
    setError(null);
    setSuccessMessage(null);
  };

  const handleDelete = async (id: string) => {
    if (!token || !isAdmin) {
      setError("Only admins can delete membership plans.");
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest<{ message: string }>(`/membership-plans/${id}`, {
        method: "DELETE",
        token
      });

      if (editingPlanId === id) {
        resetForm();
      }

      setSuccessMessage("Membership plan deleted.");
      await loadPlans();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete plan");
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="relative overflow-hidden rounded-[34px] border border-line bg-[linear-gradient(135deg,#20453d_0%,#17322d_48%,#c96f3b_180%)] p-7 text-white shadow-float md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/80">Plans</p>
          <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold tracking-tight md:text-5xl">
            Create plans your staff can actually use
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            Define monthly and yearly pricing once, then let the rest of the system work with plan names instead of raw IDs.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Total plans</p>
              <p className="mt-2 text-3xl font-semibold">{plans.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Active</p>
              <p className="mt-2 text-3xl font-semibold">{plans.filter((plan) => plan.isActive).length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Role</p>
              <p className="mt-2 text-3xl font-semibold">{session?.user.role ?? "-"}</p>
            </div>
          </div>
        </div>

        <SectionCard
          title="Access Model"
          description="Staff can view plans. Only admins can create, edit, or delete them."
        >
          <div className="grid gap-3">
            <div className="rounded-[22px] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current role</p>
              <p className="mt-2 text-sm font-medium text-slate-700">{session?.user.role ?? "Unknown"}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadPlans()}
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accentDark"
            >
              Refresh Plans
            </button>
          </div>
        </SectionCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.65fr]">
        <SectionCard
          title={editingPlanId ? "Edit Membership Plan" : "Create Membership Plan"}
          description="Set the duration, billing cycle, and price used across the member and payment flows."
        >
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Plan Name
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Monthly"
                className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={3}
                placeholder="Short note about this membership plan"
                className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Duration (days)
                <input
                  type="number"
                  min="1"
                  value={form.durationDays}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, durationDays: event.target.value }))
                  }
                  className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Billing Cycle
                <select
                  value={form.billingCycle}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, billingCycle: event.target.value }))
                  }
                  className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Status
                <select
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isActive: event.target.value === "active" }))
                  }
                  className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            {(error || successMessage) && (
              <div
                className={`rounded-[20px] px-4 py-3 text-sm ${
                  error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {error ?? successMessage}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !isAdmin}
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : submitLabel}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sand"
              >
                Reset
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Membership Plans" description="Plans available across the gym system.">
          <div className="grid gap-4">
            {isLoading ? (
              <div className="rounded-[22px] bg-sand px-4 py-5 text-sm text-slate-500">Loading plans...</div>
            ) : plans.length === 0 ? (
              <div className="rounded-[22px] bg-sand px-4 py-5 text-sm text-slate-500">
                No plans found yet.
              </div>
            ) : (
              plans.map((plan) => (
                <article
                  key={plan.id}
                  className="grid gap-4 rounded-[24px] border border-line bg-[linear-gradient(180deg,#fffdf8,#faf5ee)] p-5 transition md:grid-cols-[1.3fr_repeat(4,1fr)] md:items-center"
                >
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{plan.description || "No description"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Duration</p>
                    <p className="font-medium">{plan.durationDays} days</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Price</p>
                    <p className="font-medium">{formatCurrency(plan.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Cycle</p>
                    <p className="font-medium">{plan.billingCycle}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                        plan.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {plan.isActive ? "active" : "inactive"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(plan)}
                        disabled={!isAdmin}
                        className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(plan.id)}
                        disabled={!isAdmin}
                        className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
