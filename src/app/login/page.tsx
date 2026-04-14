"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { ChampionBrand } from "@/components/layout/champion-brand";
import { apiRequest } from "@/lib/api";

type LoginResponse = {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: "admin" | "staff";
  };
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: {
          email,
          password
        }
      });

      login(response);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-2.5rem)] items-center py-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(145deg,#05070a_0%,#0d1219_55%,#1a2029_100%)] p-8 text-white shadow-float md:p-10">
          <div className="absolute right-[-2rem] top-[-2rem] h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_58%,rgba(244,171,32,0.08)_100%)]" />
          <ChampionBrand tone="dark" />
          <h1 className="mt-8 max-w-[10ch] text-5xl font-semibold tracking-tight">
            Built for a stronger front desk presence
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/78">
            Sign in to a Champion Gym workspace that tracks members, collections, and staff flow with a sharper premium look.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-accent/80">Members</p>
              <p className="mt-2 text-3xl font-semibold">Live</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-accent/80">Payments</p>
              <p className="mt-2 text-3xl font-semibold">Tracked</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-accent/80">Alerts</p>
              <p className="mt-2 text-3xl font-semibold">Automated</p>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-white/68">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>Black + white base, gold highlights, and a custom Champion mark across the app.</span>
          </div>
        </section>

        <section className="rounded-[34px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,250,0.92))] p-7 shadow-panel md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">Sign In</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Login to continue</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Use an admin or staff account already created in your backend database.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@championgym.com"
                className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="rounded-[20px] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>

            {error && <div className="rounded-[20px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-full bg-[linear-gradient(135deg,#f4ab20_0%,#cb8400_100%)] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
