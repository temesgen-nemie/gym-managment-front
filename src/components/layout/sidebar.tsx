"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const visibleNavItems =
    session?.user.role === "admin"
      ? navItems
      : navItems.filter((item) => item.href !== "/staff");

  return (
    <aside className="w-screen max-w-full px-0 py-0 lg:min-h-screen lg:w-[300px] lg:flex-shrink-0 lg:px-6 lg:py-8">
      <div className="w-full rounded-none border border-white/10 bg-[linear-gradient(180deg,rgba(9,11,15,0.98),rgba(16,20,27,0.96))] p-4 text-white shadow-float lg:min-h-[calc(100vh-4rem)] lg:rounded-[30px] lg:p-6">
        <div className="flex items-center justify-between lg:block">
          <ChampionBrand compact tone="dark" />
          <button
            type="button"
            aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setIsMobileOpen((current) => !current)}
            className="rounded-full border border-white/10 bg-white/5 p-3 text-white/80 transition hover:border-accent/30 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <span className="sr-only">
              {isMobileOpen ? "Close navigation" : "Open navigation"}
            </span>
            <div className="grid gap-1">
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
            </div>
          </button>
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

        <nav className="mt-8 hidden gap-3 overflow-x-auto lg:flex lg:flex-col">
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
      <div
        className={`fixed inset-0 z-[1000] bg-[rgba(9,11,15,0.65)] backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileOpen(false)}
      />
      <div
        className={`fixed inset-y-0 right-0 z-[1010] w-full max-w-[320px] border-l border-white/10 bg-[linear-gradient(180deg,rgba(9,11,15,0.98),rgba(16,20,27,0.96))] p-6 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] transition-transform duration-300 lg:hidden ${
          isMobileOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between">
          <ChampionBrand compact tone="dark" />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-full border border-white/10 bg-white/5 p-3 text-white/80 transition hover:border-accent/30 hover:bg-white/10 hover:text-white"
          >
            <span className="sr-only">Close navigation</span>
            <span className="block h-0.5 w-5 rotate-45 bg-current" />
            <span className="mt-[-2px] block h-0.5 w-5 -rotate-45 bg-current" />
          </button>
        </div>

        <nav className="mt-8 grid gap-3">
          {visibleNavItems.map((item, index) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
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
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Signed in</p>
            <p className="mt-2 text-base font-semibold">{session?.user.fullName ?? "User"}</p>
            <p className="mt-1 text-sm text-white/65">{session?.user.role ?? "role"}</p>
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
