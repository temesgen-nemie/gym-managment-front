"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { SectionCard } from "@/components/dashboard/section-card";
import { apiRequest } from "@/lib/api";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "staff";
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type StaffFormState = {
  fullName: string;
  email: string;
  password: string;
};

type EditStaffFormState = {
  fullName: string;
  email: string;
  password: string;
  isActive: boolean;
};

const initialFormState: StaffFormState = {
  fullName: "",
  email: "",
  password: ""
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

export default function StaffPage() {
  const { token, session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<StaffFormState>(initialFormState);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditStaffFormState>({
    fullName: "",
    email: "",
    password: "",
    isActive: true
  });
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const isAdmin = session?.user.role === "admin";

  const loadUsers = async (query = searchQuery) => {
    if (!token) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiRequest<User[]>(`/users${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`, {
        token
      });
      setUsers(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setUsers([]);
      return;
    }

    void loadUsers();
  }, [isAdmin, token, searchQuery]);

  const staffUsers = useMemo(() => users.filter((user) => user.role === "staff"), [users]);
  const adminUsers = useMemo(() => users.filter((user) => user.role === "admin"), [users]);

  const openEditModal = (user: User) => {
    setError(null);
    setSuccessMessage(null);
    setEditUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      password: "",
      isActive: user.isActive
    });
  };

  const openCreateModal = () => {
    setError(null);
    setSuccessMessage(null);
    setForm(initialFormState);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsCreateModalOpen(false);
    setForm(initialFormState);
  };

  const closeEditModal = () => {
    if (isSavingEdit) {
      return;
    }

    setEditUser(null);
    setEditForm({
      fullName: "",
      email: "",
      password: "",
      isActive: true
    });
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setDeleteUser(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !isAdmin) {
      setError("Only admins can create staff accounts.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest<User>("/users/staff", {
        method: "POST",
        token,
        body: form
      });

      setSuccessMessage("Staff account created successfully.");
      setForm(initialFormState);
      setIsCreateModalOpen(false);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to create staff account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !editUser) {
      return;
    }

    setIsSavingEdit(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest<User>(`/users/staff/${editUser.id}`, {
        method: "PUT",
        token,
        body: {
          fullName: editForm.fullName,
          email: editForm.email,
          isActive: editForm.isActive,
          ...(editForm.password.trim() ? { password: editForm.password } : {})
        }
      });

      setSuccessMessage("Staff account updated successfully.");
      setEditUser(null);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update staff account");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!token || !deleteUser) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest<{ message: string }>(`/users/staff/${deleteUser.id}`, {
        method: "DELETE",
        token
      });

      setSuccessMessage("Staff account deleted successfully.");
      setDeleteUser(null);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete staff account");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[34px] border border-line bg-[linear-gradient(135deg,#1f3f38_0%,#17302a_52%,#c96f3b_180%)] p-7 text-white shadow-float md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/80">Staff</p>
          <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold tracking-tight md:text-5xl">
            Staff management is admin only
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            Your current account can work with members and payments, but only an admin can create or manage staff users.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="relative overflow-hidden rounded-[34px] border border-line bg-[linear-gradient(135deg,#1f3f38_0%,#17302a_52%,#c96f3b_180%)] p-7 text-white shadow-float md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/80">Staff</p>
          <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold tracking-tight md:text-5xl">
            Create and manage staff access
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            Admins can create staff accounts for day-to-day operations while keeping high-level controls restricted.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Admins</p>
              <p className="mt-2 text-3xl font-semibold">{adminUsers.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Staff</p>
              <p className="mt-2 text-3xl font-semibold">{staffUsers.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Active</p>
              <p className="mt-2 text-3xl font-semibold">{users.filter((user) => user.isActive).length}</p>
            </div>
          </div>
        </div>

        <SectionCard
          title="Access Rules"
          description="Admins can create staff users. Staff accounts have limited permissions in the backend."
        >
          <div className="grid gap-3">
            <div className="rounded-[22px] border border-line bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current role</p>
              <p className="mt-2 text-sm font-medium text-slate-700">{session?.user.role ?? "Unknown"}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accentDark"
            >
              Refresh Users
            </button>
          </div>
        </SectionCard>
      </section>

      {(error || successMessage) && (
        <div
          className={`rounded-[24px] px-5 py-4 text-sm ${
            error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ?? successMessage}
        </div>
      )}

      <SectionCard title="Users" description="All accounts currently available in the system.">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search staff by name or email"
            className="w-full rounded-[20px] border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent md:max-w-xl"
          />
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-full bg-[linear-gradient(135deg,#f4ab20_0%,#cb8400_100%)] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-95"
          >
            Add Staff
          </button>
        </div>
        <div className="overflow-x-auto rounded-[24px] border border-line bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-slate-500">
                  <th className="px-5 py-4 font-medium">Name</th>
                  <th className="px-5 py-4 font-medium">Email</th>
                  <th className="px-5 py-4 font-medium">Role</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Last Login</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-line/80 last:border-b-0 hover:bg-sand/70">
                      <td className="px-5 py-4 font-medium">{user.fullName}</td>
                      <td className="px-5 py-4 text-slate-600">{user.email}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                            user.role === "admin"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                            user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {user.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(user.lastLoginAt)}</td>
                      <td className="px-5 py-4">
                        {user.role === "staff" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteUser(user)}
                              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </SectionCard>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,17,21,0.56)] p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-[30px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,247,249,0.94))] shadow-[0_30px_90px_-30px_rgba(0,0,0,0.4)]">
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Add Staff</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Create staff account</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Add a new staff user with restricted permissions for daily gym operations.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sand"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(90vh-110px)] overflow-y-auto px-4 py-6 md:px-6">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Full Name
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    placeholder="Jane Staff"
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="staff@example.com"
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Password
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Minimum 6 characters"
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>

                <div className="rounded-[20px] border border-line bg-sand px-4 py-3 text-sm text-slate-600">
                  Staff users get restricted access and cannot manage admin-only controls.
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full bg-[linear-gradient(135deg,#f4ab20_0%,#cb8400_100%)] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Creating..." : "Create Staff"}
                  </button>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={isSubmitting}
                    className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,17,21,0.56)] p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-[30px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,247,249,0.94))] shadow-[0_30px_90px_-30px_rgba(0,0,0,0.4)]">
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Edit Staff</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{editUser.fullName}</h2>
                <p className="mt-2 text-sm text-slate-500">Update staff account details or suspend access.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sand"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(90vh-110px)] overflow-y-auto px-4 py-6 md:px-6">
              <form className="grid gap-4" onSubmit={handleEditSubmit}>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Full Name
                  <input
                    value={editForm.fullName}
                    onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value }))}
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Email
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  New Password
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Leave blank to keep current password"
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={editForm.isActive ? "active" : "inactive"}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, isActive: event.target.value === "active" }))
                    }
                    className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                <div className="rounded-[20px] border border-line bg-sand px-4 py-3 text-sm text-slate-600">
                  Leaving the password blank will keep the current password unchanged.
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="rounded-full bg-[linear-gradient(135deg,#f4ab20_0%,#cb8400_100%)] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingEdit ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isSavingEdit}
                    className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,17,21,0.56)] p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-[30px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,247,249,0.94))] shadow-[0_30px_90px_-30px_rgba(0,0,0,0.4)]">
            <div className="border-b border-line px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-600">Delete Staff</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Confirm deletion</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Delete <span className="font-semibold text-ink">{deleteUser.fullName}</span> permanently? This will
                remove the staff account and they will no longer be able to sign in.
              </p>
            </div>
            <div className="px-4 py-6 md:px-6">
              <div className="rounded-[20px] border border-rose-200 bg-[linear-gradient(180deg,#fff5f3,#ffece7)] px-4 py-3 text-sm text-rose-700">
                This action is permanent and cannot be undone.
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDeleteStaff}
                  disabled={isDeleting}
                  className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete Staff"}
                </button>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
