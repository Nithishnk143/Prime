"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiLogin, setToken } from "@/lib/careercraft-api";

type LoginValues = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginValues, string>>;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("careercraft:theme")
        : null;

    const initial =
      saved === "dark"
        ? true
        : saved === "light"
          ? false
          : window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;

    setDark(initial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("careercraft:theme", dark ? "dark" : "light");
  }, [dark]);

  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof LoginValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errors = useMemo<LoginErrors>(() => {
    const e: LoginErrors = {};
    if (!values.email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(values.email)) e.email = "Enter a valid email address.";
    if (!values.password) e.password = "Password is required.";
    else if (values.password.length < 6) e.password = "Password must be at least 6 characters.";
    return e;
  }, [values.email, values.password]);

  const completedCount =
    (errors.email ? 0 : 1) + (errors.password ? 0 : 1);
  const totalCount = 2;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  function onBlur<K extends keyof LoginValues>(key: K) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function onChange<K extends keyof LoginValues>(key: K, next: LoginValues[K]) {
    setValues((v) => ({ ...v, [key]: next }));
    setSubmitted(false);
  }

  function showError<K extends keyof LoginValues>(key: K) {
    return Boolean(touched[key]) && Boolean(errors[key]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);
    setTouched({ email: true, password: true });

    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const resp = await apiLogin(values.email.trim(), values.password);
      setToken(resp.token);
      window.location.href = "/test";
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/70 via-sky-200/60 to-emerald-200/70 blur-3xl dark:from-indigo-500/20 dark:via-sky-500/15 dark:to-emerald-500/20" />
      </div>

      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-sm">
              CC
            </span>
            <span className="text-sm font-semibold tracking-tight">CareerCraft</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              aria-label="Toggle dark mode"
            >
              <span className="text-xs font-medium">{dark ? "Dark" : "Light"}</span>
              <span
                aria-hidden
                className={cn("h-2.5 w-2.5 rounded-full", dark ? "bg-sky-400" : "bg-amber-400")}
              />
            </button>
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Create account
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-start">
        <section className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Log in to continue your CareerCraft journey.
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium">Login progress</span>
              <span>
                {completedCount}/{totalCount} complete
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => onChange("email", e.currentTarget.value)}
                onBlur={() => onBlur("email")}
                className={cn(
                  "mt-1 w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm outline-none transition dark:bg-slate-950",
                  showError("email")
                    ? "border-rose-400 focus:ring-2 focus:ring-rose-300/60 dark:border-rose-500 dark:focus:ring-rose-500/20"
                    : "border-slate-200 focus:ring-2 focus:ring-sky-300/60 dark:border-slate-800 dark:focus:ring-sky-500/20"
                )}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              {showError("email") ? (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.email}</p>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={values.password}
                onChange={(e) => onChange("password", e.currentTarget.value)}
                onBlur={() => onBlur("password")}
                className={cn(
                  "mt-1 w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm outline-none transition dark:bg-slate-950",
                  showError("password")
                    ? "border-rose-400 focus:ring-2 focus:ring-rose-300/60 dark:border-rose-500 dark:focus:ring-rose-500/20"
                    : "border-slate-200 focus:ring-2 focus:ring-sky-300/60 dark:border-slate-800 dark:focus:ring-sky-500/20"
                )}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              {showError("password") ? (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.password}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-sky-400",
                loading ? "opacity-70 cursor-not-allowed" : ""
              )}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

            {apiError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                {apiError}
              </div>
            ) : null}

            {submitted ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                Logged in (mock). Next we'll connect this to real auth later.
              </div>
            ) : null}

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Don't have an account?{" "}
              <a className="font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-white" href="/signup">
                Sign up
              </a>
            </p>
          </form>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40 sm:p-8">
          <div className="text-sm font-semibold">What you'll get</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {[
              "A short, student-friendly psychometric test",
              "Course recommendations with confidence scores",
              "A clean portfolio + roadmap you can edit",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-600/10 via-sky-500/10 to-emerald-500/10 p-5 dark:from-indigo-500/15 dark:via-sky-500/10 dark:to-emerald-500/10">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Tip
            </div>
            <div className="mt-1 text-sm font-semibold">
              New here? Create a profile first.
            </div>
            <a
              href="/signup"
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Go to signup
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}
