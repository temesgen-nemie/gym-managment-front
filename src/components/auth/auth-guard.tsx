"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "./auth-provider";

const publicRoutes = new Set(["/login"]);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, token } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const isPublicRoute = publicRoutes.has(pathname);

    if (!token && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    if (token && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [isReady, pathname, router, token]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-[24px] border border-line bg-[rgba(255,253,248,0.88)] px-6 py-5 text-sm text-slate-500 shadow-panel">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!token && !publicRoutes.has(pathname)) {
    return null;
  }

  if (token && pathname === "/login") {
    return null;
  }

  return <>{children}</>;
}
