"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { SectionCard } from "@/components/dashboard/section-card";
import { apiRequest } from "@/lib/api";

type MemberPaymentStatus = "paid" | "unpaid";
type MemberPaymentFilter = "all" | "paid" | "unpaid" | "due_today" | "overdue";

type PaymentHistoryItem = {
  id: string;
  memberId: string;
  amount: string | number;
  paymentDate: string;
  nextDueDate: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  status: "paid" | "overdue";
  notes?: string | null;
};

type MembershipPlan = {
  id: string;
  name: string;
  description?: string | null;
  durationDays: number;
  price: string | number;
  billingCycle: string;
  isActive: boolean;
};

type Member = {
  id: string;
  name: string;
  phone: string;
  membershipPlanId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  paymentStatus: MemberPaymentStatus;
  payments: Array<{
    id: string;
    paymentDate: string;
    nextDueDate: string;
    status: "paid" | "overdue";
  }>;
  membershipPlan: {
    id: string;
    name: string;
    billingCycle: string;
    price: string | number;
  };
};

type MemberFormState = {
  name: string;
  phone: string;
  membershipPlanId: string;
  startDate: string;
};

type PaymentFormState = {
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
};

const initialFormState: MemberFormState = {
  name: "",
  phone: "",
  membershipPlanId: "",
  startDate: ""
};

const initialPaymentFormState: PaymentFormState = {
  amount: "",
  paymentDate: "",
  paymentMethod: "cash",
  referenceNumber: "",
  notes: ""
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const differenceInDays = (later: Date, earlier: Date) =>
  Math.floor((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / (1000 * 60 * 60 * 24));

const formatCurrency = (value: string | number) => {
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

export default function MembersPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<MemberPaymentFilter>("all");
  const [form, setForm] = useState<MemberFormState>(initialFormState);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(initialPaymentFormState);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [historyMemberId, setHistoryMemberId] = useState<string | null>(null);
  const [paymentMemberId, setPaymentMemberId] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const loadMembers = async (query = searchQuery) => {
    if (!token) {
      setMembers([]);
      setPlans([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [membersResponse, plansResponse] = await Promise.all([
        apiRequest<Member[]>(`/members${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`, {
          token
        }),
        apiRequest<MembershipPlan[]>("/membership-plans", { token })
      ]);

      setMembers(membersResponse);
      setPlans(plansResponse);

      setForm((current) => ({
        ...current,
        membershipPlanId: current.membershipPlanId || plansResponse.find((plan) => plan.isActive)?.id || ""
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, [token, searchQuery]);

  const submitLabel = useMemo(
    () => (editingMemberId ? "Update Member" : "Add Member"),
    [editingMemberId]
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === form.membershipPlanId) ?? null,
    [form.membershipPlanId, plans]
  );

  const resetForm = () => {
    setForm(initialFormState);
    setEditingMemberId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setError(null);
    setSuccessMessage(null);
    setIsMemberModalOpen(true);
  };

  const closeMemberModal = () => {
    setIsMemberModalOpen(false);
    resetForm();
  };

  const openPaymentModal = (member: Member) => {
    setPaymentMemberId(member.id);
    setPaymentForm({
      amount: member.membershipPlan?.price ? String(member.membershipPlan.price) : "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "cash",
      referenceNumber: "",
      notes: ""
    });
    setError(null);
    setSuccessMessage(null);
  };

  const closePaymentModal = () => {
    setPaymentMemberId(null);
    setPaymentForm(initialPaymentFormState);
  };

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const memberRows = useMemo(() => {
    return members.map((member) => {
      const latestPayment = member.payments[0] ?? null;
      const hasPaymentHistory = latestPayment !== null;
      const dueDate = latestPayment?.nextDueDate ?? null;
      const dueDateValue = dueDate ? new Date(dueDate) : null;
      const isDueToday = dueDateValue ? dueDateValue >= todayStart && dueDateValue <= todayEnd : false;
      const isOverdue = dueDateValue ? dueDateValue < todayStart : false;
      const daysOverdue = isOverdue && dueDateValue ? differenceInDays(today, dueDateValue) : 0;

      return {
        ...member,
        latestPayment,
        hasPaymentHistory,
        dueDate,
        isDueToday,
        isOverdue,
        daysOverdue
      };
    });
  }, [members, todayEnd, todayStart]);

  const filteredMembers = useMemo(() => {
    switch (paymentFilter) {
      case "paid":
        return memberRows.filter((member) => member.paymentStatus === "paid");
      case "unpaid":
        return memberRows.filter((member) => member.paymentStatus === "unpaid");
      case "due_today":
        return memberRows.filter((member) => member.isDueToday);
      case "overdue":
        return memberRows.filter((member) => member.isOverdue);
      default:
        return memberRows;
    }
  }, [memberRows, paymentFilter]);

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
      const path = editingMemberId ? `/members/${editingMemberId}` : "/members";
      const method = editingMemberId ? "PUT" : "POST";

      await apiRequest<Member>(path, {
        method,
        token,
        body:
          editingMemberId && selectedEditingMember?.hasPaymentHistory
            ? {
                name: form.name,
                phone: form.phone,
                membershipPlanId: form.membershipPlanId
              }
            : {
                ...form
              }
      });

      setSuccessMessage(editingMemberId ? "Member updated successfully." : "Member created successfully.");
      closeMemberModal();
      await loadMembers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMemberId(member.id);
    setForm({
      name: member.name,
      phone: member.phone,
      membershipPlanId: member.membershipPlanId,
      startDate: member.startDate.slice(0, 10)
    });
    setSuccessMessage(null);
    setError(null);
    setIsMemberModalOpen(true);
  };

  const handleDelete = async (memberId: string) => {
    if (!token) {
      setError("Add a JWT token before calling the backend.");
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest<{ message: string }>(`/members/${memberId}`, {
        method: "DELETE",
        token
      });

      if (editingMemberId === memberId) {
        resetForm();
      }

      setSuccessMessage("Member deleted successfully.");
      await loadMembers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete member");
    }
  };

  const handleViewHistory = async (memberId: string) => {
    if (!token) {
      setError("Add a JWT token before calling the backend.");
      return;
    }

    setHistoryMemberId(memberId);
    setIsHistoryLoading(true);
    setError(null);

    try {
      const history = await apiRequest<PaymentHistoryItem[]>(`/payments/member/${memberId}`, { token });
      setPaymentHistory(history);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load payment history");
      setPaymentHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const selectedHistoryMember = useMemo(
    () => memberRows.find((member) => member.id === historyMemberId) ?? null,
    [historyMemberId, memberRows]
  );

  const selectedEditingMember = useMemo(
    () => memberRows.find((member) => member.id === editingMemberId) ?? null,
    [editingMemberId, memberRows]
  );

  const selectedPaymentMember = useMemo(
    () => memberRows.find((member) => member.id === paymentMemberId) ?? null,
    [memberRows, paymentMemberId]
  );

  const closeHistoryModal = () => {
    setHistoryMemberId(null);
    setPaymentHistory([]);
  };

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !paymentMemberId) {
      setError("Add a JWT token before calling the backend.");
      return;
    }

    setIsPaymentSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest("/payments", {
        method: "POST",
        token,
        body: {
          memberId: paymentMemberId,
          amount: Number(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          referenceNumber: paymentForm.referenceNumber || undefined,
          notes: paymentForm.notes || undefined
        }
      });

      setSuccessMessage("Payment updated successfully.");
      closePaymentModal();
      await loadMembers();

      if (historyMemberId === paymentMemberId) {
        await handleViewHistory(paymentMemberId);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to record payment");
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="relative overflow-hidden rounded-[34px] border border-line bg-[linear-gradient(135deg,#c96f3b_0%,#ab5a2b_45%,#20453d_140%)] p-7 text-white shadow-float md:p-9">
          <div className="absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-full border border-white/15" />
          <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/80">Members</p>
          <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold tracking-tight md:text-5xl">
            Build and manage your active roster
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            Register members quickly, update plan periods, and keep the roster operational from one clean panel.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Total</p>
              <p className="mt-2 text-3xl font-semibold">{filteredMembers.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Paid</p>
              <p className="mt-2 text-3xl font-semibold">
                {memberRows.filter((member) => member.paymentStatus === "paid").length}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Due Today</p>
              <p className="mt-2 text-3xl font-semibold">
                {memberRows.filter((member) => member.isDueToday).length}
              </p>
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
                onClick={() => void loadMembers()}
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accentDark"
              >
                Refresh Members
              </button>
            </div>
          </div>
        </SectionCard>
      </section>

      <div className="grid gap-6">
        <SectionCard title="All Members" description="Live data loaded from the backend member module.">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              Add members from a modal so the table stays visible while you work.
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f4ab20_0%,#cb8400_100%)] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-95"
            >
              <span className="text-lg leading-none">+</span>
              <span>Add Member</span>
            </button>
          </div>
          <div className="mb-4">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search members by name or phone"
              className="w-full rounded-[20px] border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
            />
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            {[
              { value: "all", label: "All Members" },
              { value: "paid", label: "Paid" },
              { value: "unpaid", label: "Unpaid" },
              { value: "due_today", label: "Due Today" },
              { value: "overdue", label: "Past Due" }
            ].map((filterOption) => {
              const isActive = paymentFilter === filterOption.value;

              return (
                <button
                  key={filterOption.value}
                  type="button"
                  onClick={() => setPaymentFilter(filterOption.value as MemberPaymentFilter)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-accent text-white"
                      : "border border-line bg-white text-slate-700 hover:bg-sand"
                  }`}
                >
                  {filterOption.label}
                </button>
              );
            })}
          </div>
          <div className="overflow-x-auto rounded-[24px] border border-line bg-white">
            <table className="min-w-full w-full table-auto text-sm">
              <thead>
                <tr className="border-b border-line text-left text-slate-500">
                  <th className="px-5 py-4 font-medium">Name</th>
                  <th className="px-5 py-4 font-medium">Phone</th>
                  <th className="px-5 py-4 font-medium">Plan</th>
                  <th className="px-5 py-4 font-medium">Period</th>
                  <th className="px-5 py-4 font-medium">Next Due</th>
                  <th className="px-5 py-4 font-medium">Payment Status</th>
                  <th className="px-5 py-4 font-medium">Days Passed</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                      Loading members...
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                      No members match the current search or payment filter.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b border-line/80 last:border-b-0 hover:bg-sand/70">
                      <td className="px-5 py-4 font-medium">{member.name}</td>
                      <td className="px-5 py-4 text-slate-600">{member.phone}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>{member.membershipPlan?.name ?? member.membershipPlanId}</div>
                        <div className="text-xs text-slate-400">
                          {member.membershipPlan?.billingCycle ?? "plan"} | {member.membershipPlan?.price ?? "-"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {member.hasPaymentHistory ? (
                          `${formatDate(member.startDate)} - ${formatDate(member.endDate)}`
                        ) : (
                          <div>
                            <div>{formatDate(member.createdAt)}</div>
                            <div className="text-xs text-slate-400">Registration date</div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>{member.dueDate ? formatDate(member.dueDate) : "Awaiting first payment"}</div>
                        <div className="text-xs text-slate-400">
                          {!member.hasPaymentHistory
                            ? "No due date yet"
                            : member.isDueToday
                            ? "Due today"
                            : member.isOverdue
                              ? "Past due"
                              : "Upcoming"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                            member.paymentStatus === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {member.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {member.daysOverdue > 0 ? `${member.daysOverdue} day${member.daysOverdue === 1 ? "" : "s"}` : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleViewHistory(member.id)}
                            className="rounded-full border border-line bg-sand px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
                          >
                            History
                          </button>
                          {(member.paymentStatus === "unpaid" || member.isDueToday || member.isOverdue) && (
                            <button
                              type="button"
                              onClick={() => openPaymentModal(member)}
                              className="rounded-full bg-[linear-gradient(135deg,#f4ab20_0%,#cb8400_100%)] px-4 py-2 text-xs font-semibold text-[#111111] transition hover:brightness-95"
                            >
                              Update Payment
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEdit(member)}
                            className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-sand"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(member.id)}
                            className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-[rgba(15,17,21,0.56)] p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,247,249,0.94))] shadow-[0_30px_90px_-30px_rgba(0,0,0,0.4)]">
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Member</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  {editingMemberId ? "Edit Member" : "Add Member"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Create a new member or update an existing record.
                </p>
              </div>
              <button
                type="button"
                onClick={closeMemberModal}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sand"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(90vh-110px)] overflow-y-auto overscroll-contain px-4 py-6 md:px-6">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Name
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Full name"
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Phone
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+254..."
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Membership Plan
                  <select
                    value={form.membershipPlanId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, membershipPlanId: event.target.value }))
                    }
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  >
                    <option value="">Select a plan</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} | {plan.billingCycle} | {plan.durationDays} days
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    {selectedEditingMember?.hasPaymentHistory ? "Membership Start Date" : "Registration Date"}
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, startDate: event.target.value }))
                      }
                      disabled={selectedEditingMember?.hasPaymentHistory}
                      className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    />
                  </label>

                  <div className="grid gap-2 text-sm font-medium text-slate-700">
                    <span>{selectedEditingMember?.hasPaymentHistory ? "Current End Date" : "Plan Activation"}</span>
                    <div className="rounded-[20px] border border-line bg-sand px-4 py-3 text-slate-700">
                      {selectedEditingMember?.hasPaymentHistory
                        ? formatDate(selectedEditingMember.endDate)
                        : selectedPlan
                          ? "Membership dates will start from the first payment date."
                          : "Select a plan to continue"}
                    </div>
                  </div>
                </div>

                {selectedPlan && (
                  <div className="rounded-[20px] border border-line bg-sand px-4 py-3 text-sm text-slate-600">
                    {selectedPlan.name} runs for {selectedPlan.durationDays} days. The membership period starts when
                    payment is recorded, not when the member is registered.
                  </div>
                )}

                <div className="rounded-[20px] border border-line bg-sand px-4 py-3 text-sm text-slate-600">
                  New members start as <span className="font-semibold text-ink">unpaid</span>. Their payment status updates automatically after you record a payment.
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
                    disabled={isSubmitting}
                    className="rounded-full bg-[linear-gradient(135deg,#f4ab20_0%,#cb8400_100%)] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Saving..." : submitLabel}
                  </button>
                  <button
                    type="button"
                    onClick={closeMemberModal}
                    className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sand"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {historyMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-[rgba(15,17,21,0.56)] p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,247,249,0.94))] shadow-[0_30px_90px_-30px_rgba(0,0,0,0.4)]">
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Payment History</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  {selectedHistoryMember ? `${selectedHistoryMember.name} Payment History` : "Member Payment History"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Every payment is kept for history. The latest payment controls the current member state.
                </p>
              </div>
              <button
                type="button"
                onClick={closeHistoryModal}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sand"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(90vh-110px)] overflow-y-auto overscroll-contain px-4 py-6 md:px-6">
              {isHistoryLoading ? (
                <div className="rounded-[22px] bg-sand px-4 py-5 text-sm text-slate-500">
                  Loading payment history...
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="rounded-[22px] bg-sand px-4 py-5 text-sm text-slate-500">
                  No payments found for this member yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {paymentHistory.map((payment) => (
                    <article
                      key={payment.id}
                      className={`grid gap-4 rounded-[24px] border p-5 transition lg:grid-cols-[minmax(0,1.25fr)_repeat(5,minmax(0,1fr))] lg:items-center ${
                        payment.status === "overdue"
                          ? "border-rose-200 bg-[linear-gradient(180deg,#fff5f3,#ffece7)]"
                          : "border-line bg-[linear-gradient(180deg,#fffdf8,#faf5ee)]"
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{selectedHistoryMember?.name ?? "Member"}</p>
                        <p className="text-sm text-slate-500">
                          {payment.paymentMethod} | {selectedHistoryMember?.phone ?? "-"}
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
                        <p className="text-xs uppercase tracking-wide text-slate-400">Reference</p>
                        <p className="font-medium">{payment.referenceNumber || "-"}</p>
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {paymentMemberId && selectedPaymentMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-[rgba(15,17,21,0.56)] p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,247,249,0.94))] shadow-[0_30px_90px_-30px_rgba(0,0,0,0.4)]">
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Payment Update</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  {selectedPaymentMember.name}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Record a new payment for this member. The member is already selected from the row you clicked.
                </p>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sand"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(90vh-110px)] overflow-y-auto overscroll-contain px-4 py-6 md:px-6">
              <form className="grid gap-4" onSubmit={handlePaymentSubmit}>
                <div className="rounded-[20px] border border-line bg-sand px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-ink">{selectedPaymentMember.name}</span>
                  {" | "}
                  {selectedPaymentMember.phone}
                  {" | "}
                  Next due:{" "}
                  <span className="font-semibold text-ink">
                    {selectedPaymentMember.dueDate ? formatDate(selectedPaymentMember.dueDate) : "Awaiting first payment"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Amount
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(event) =>
                        setPaymentForm((current) => ({ ...current, amount: event.target.value }))
                      }
                      placeholder="40.00"
                      className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Payment Date
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(event) =>
                        setPaymentForm((current) => ({ ...current, paymentDate: event.target.value }))
                      }
                      className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Payment Method
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, paymentMethod: event.target.value }))
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
                    value={paymentForm.referenceNumber}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, referenceNumber: event.target.value }))
                    }
                    placeholder="Optional reference"
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Notes
                  <textarea
                    value={paymentForm.notes}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, notes: event.target.value }))
                    }
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

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isPaymentSubmitting}
                    className="rounded-full bg-[linear-gradient(135deg,#f4ab20_0%,#cb8400_100%)] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPaymentSubmitting ? "Saving..." : "Update Payment"}
                  </button>
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sand"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
