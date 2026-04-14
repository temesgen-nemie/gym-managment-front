"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { ChampionBrand } from "@/components/layout/champion-brand";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/staff", label: "Staff" },
  { href: "/membership-plans", label: "Plans" },
  { href: "/members", label: "Members" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, session } = useAuth();
  const visibleNavItems =
    session?.user.role === "admin"
      ? navItems
      : navItems.filter((item) => item.href !== "/staff");

  return (
    <aside className="w-full px-4 py-4 lg:min-h-screen lg:w-[300px] lg:px-6 lg:py-8">
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,11,15,0.98),rgba(16,20,27,0.96))] p-4 text-white shadow-float lg:min-h-[calc(100vh-4rem)] lg:p-6">
        <div className="flex items-center justify-between lg:block">
          <ChampionBrand compact tone="dark" />
        </div>

        <div className="mt-8 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-accent">
            Operations
          </p>
          <p className="mt-2 text-sm leading-6 text-white/80">
            Champion Gym members, payments, and renewals from one clean control
            surface.
          </p>
        </div>

        <nav className="mt-8 flex gap-3 overflow-x-auto lg:flex-col">
          {visibleNavItems.map((item, index) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group rounded-[22px] border px-4 py-4 transition ${
                  isActive
                    ? "border-accent/50 bg-[linear-gradient(135deg,#f4ab20_0%,#cb8400_100%)] text-[#111111] shadow-panel"
                    : "border-white/10 bg-white/5 text-white/75 hover:border-accent/30 hover:bg-white/10 hover:text-white"
                }`}
              >
                <p
                  className={`text-[11px] uppercase tracking-[0.24em] ${isActive ? "text-black/45" : "text-white/45"}`}
                >
                  0{index + 1}
                </p>
                <p className="mt-1 text-base font-semibold">{item.label}</p>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 grid gap-3">
          <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Signed in
            </p>
            <p className="mt-2 text-base font-semibold">
              {session?.user.fullName ?? "User"}
            </p>
            <p className="mt-1 text-sm text-white/65">
              {session?.user.role ?? "role"}
            </p>
          </div>
          <div className="rounded-[24px] bg-[linear-gradient(135deg,#f7b32b_0%,#f4ab20_45%,#d88d00_100%)] px-5 py-4 text-ink">
            <p className="text-xs uppercase tracking-[0.2em] text-black/55">
              Today&apos;s focus
            </p>
            <p className="mt-2 text-lg font-semibold">
              Keep Champion memberships active before they slip overdue.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              System mode
            </p>
            <p className="mt-2 text-sm text-white/80">
              Bold front desk workspace built around speed, clarity, and brand
              presence.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-left text-sm font-semibold text-white/85 transition hover:border-accent/30 hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
