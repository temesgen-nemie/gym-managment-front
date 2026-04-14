"use client";

import { usePathname } from "next/navigation";

import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className="min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-6rem] top-16 h-56 w-56 rounded-full bg-accent/14 blur-3xl" />
        <div className="absolute right-[-4rem] top-40 h-64 w-64 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-12 left-1/3 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <div
        className={`relative mx-auto flex min-h-screen max-w-[1650px] min-w-0 ${
          isLoginPage ? "items-stretch justify-center" : "flex-col lg:flex-row"
        }`}
      >
        {!isLoginPage && <Sidebar />}
        <main className={`min-w-0 flex-1 ${isLoginPage ? "px-4 py-4 md:px-8" : "px-4 py-5 md:px-8 lg:px-10 lg:py-8"}`}>
          <div
            className={`relative min-w-0 overflow-hidden ${
              isLoginPage
                ? "min-h-[calc(100vh-2rem)]"
                : "rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.9))] p-5 shadow-float backdrop-blur-xl md:p-8"
            }`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
