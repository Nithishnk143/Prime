"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type NavLink = { label: string; href: `#${string}` };

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const navLinks: NavLink[] = useMemo(
    () => [
      { label: "How it works", href: "#how" },
      { label: "Features", href: "#features" },
      { label: "Why CareerCraft", href: "#why" },
      { label: "Get started", href: "#get-started" },
    ],
    []
  );

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

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-24 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/70 via-sky-200/60 to-emerald-200/70 blur-3xl dark:from-indigo-500/20 dark:via-sky-500/15 dark:to-emerald-500/20" />
        <div className="absolute bottom-[-160px] left-[-140px] h-[420px] w-[420px] rounded-full bg-gradient-to-br from-fuchsia-200/50 to-amber-200/40 blur-3xl dark:from-fuchsia-500/10 dark:to-amber-500/10" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/70 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/60">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#" className="group inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-sm">
              CC
            </span>
            <span className="text-sm font-semibold tracking-tight">
              CareerCraft
              <span className="ml-2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                student-first
              </span>
            </span>
          </a>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              aria-label="Toggle dark mode"
            >
              <span className="text-xs font-medium">
                {dark ? "Dark" : "Light"}
              </span>
              <span
                aria-hidden
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  dark ? "bg-sky-400" : "bg-amber-400"
                )}
              />
            </button>

            <a
              href="#get-started"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Discover your path
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal className="space-y-6">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Psychometric insights • Course matches • Career roadmap
            </p>

            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              CareerCraft helps students{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                discover their career path
              </span>{" "}
              with clarity.
            </h1>

            <p className="max-w-xl text-pretty text-base leading-7 text-slate-600 dark:text-slate-300">
              Take a short, student-friendly psychometric test, get course
              recommendations with confidence scores, and build a portfolio +
              roadmap you can actually follow.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#get-started"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-sky-400"
              >
                Discover Your Career Path
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                See how it works
              </a>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3 pt-4">
              {[
                { k: "8–10", v: "Quick questions" },
                { k: "5–7", v: "Top domains" },
                { k: "1", v: "Personal roadmap" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="text-lg font-semibold">{s.k}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delayMs={150} className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 dark:from-indigo-500/15 dark:via-sky-500/10 dark:to-emerald-500/10" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Aptitude snapshot</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Example visualization (dashboard-ready)
                    </div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                    1 min
                  </div>
                </div>

                {/* Mini illustration (SVG) */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      People skills
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900">
                      <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" />
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      78%
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Logic & reasoning
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900">
                      <div className="h-2 w-[64%] rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" />
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      64%
                    </div>
                  </div>

                  <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Recommended domain
                        </div>
                        <div className="mt-1 text-sm font-semibold">
                          Computer Science (CSE)
                        </div>
                      </div>
                      <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-3 py-2 text-xs font-semibold text-white">
                        86% match
                      </div>
                    </div>

                    <svg
                      className="mt-4 h-28 w-full"
                      viewBox="0 0 560 140"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      role="img"
                      aria-label="Decorative roadmap illustration"
                    >
                      <path
                        d="M20 105 C 120 20, 220 20, 320 80 C 390 125, 470 125, 540 50"
                        stroke="currentColor"
                        className="text-slate-300 dark:text-slate-700"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      {[
                        { x: 20, y: 105, c: "from-indigo-600 to-sky-500" },
                        { x: 180, y: 48, c: "from-sky-500 to-emerald-500" },
                        { x: 320, y: 80, c: "from-emerald-500 to-amber-500" },
                        { x: 540, y: 50, c: "from-indigo-600 to-fuchsia-500" },
                      ].map((p, i) => (
                        <g key={i}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="12"
                            className="text-white dark:text-slate-950"
                            fill="currentColor"
                          />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="10"
                            className={`[fill:url(#g${i})]`}
                          />
                          <defs>
                            <linearGradient
                              id={`g${i}`}
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="1"
                            >
                              <stop stopColor="rgb(79 70 229)" />
                              <stop offset="1" stopColor="rgb(14 165 233)" />
                            </linearGradient>
                          </defs>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-600/20 to-sky-500/20 blur-2xl dark:from-indigo-500/20 dark:to-sky-500/20" />
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/20 blur-2xl dark:from-emerald-500/15 dark:to-amber-500/15" />
          </Reveal>
        </section>

        {/* How it works */}
        <section id="how" className="mt-16 scroll-mt-24">
          <Reveal className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              A simple flow students actually enjoy
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              CareerCraft turns uncertainty into a clear plan: test → match →
              roadmap.
            </p>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                t: "Take the psychometric test",
                d: "8–10 friendly questions covering interest, aptitude, creativity, logic & people skills.",
                n: "01",
              },
              {
                t: "Get course recommendations",
                d: "Card-based suggestions with confidence percentages so you can compare options.",
                n: "02",
              },
              {
                t: "Build your portfolio + roadmap",
                d: "Auto-generated strengths, skills and a step-by-step learning path to start today.",
                n: "03",
              },
            ].map((s, idx) => (
              <Reveal key={s.n} delayMs={idx * 90}>
                <div className="h-full rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {s.n}
                    </div>
                    <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-indigo-600 to-sky-500" />
                  </div>
                  <div className="mt-3 text-base font-semibold">{s.t}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {s.d}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-16 scroll-mt-24">
          <Reveal className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything you need in one modern dashboard
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Designed mobile-first with clean cards, soft gradients, and
              student-friendly language.
            </p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                t: "Confidence-based recommendations",
                d: "Course cards with clear match percentages.",
              },
              {
                t: "Portfolio in minutes",
                d: "Auto-generate skills, strengths & interests—then edit anytime.",
              },
              {
                t: "Job roles & salary ranges",
                d: "See realistic roles that fit your chosen domain.",
              },
              {
                t: "Career roadmap",
                d: "Step-by-step plan: what to study, certs, projects & internships.",
              },
              {
                t: "Scholarships",
                d: "Quick eligibility + deadline cards with links.",
              },
              {
                t: "Light/Dark mode",
                d: "Comfortable in any environment—library or late-night study.",
              },
            ].map((f, idx) => (
              <Reveal key={f.t} delayMs={idx * 70}>
                <div className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 p-[1px]">
                      <div className="grid h-full w-full place-items-center rounded-2xl bg-white text-sm font-semibold text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                        ✓
                      </div>
                    </div>
                    <div className="text-base font-semibold">{f.t}</div>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {f.d}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Why */}
        <section id="why" className="mt-16 scroll-mt-24">
          <Reveal className="rounded-3xl border border-slate-200 bg-white/60 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Built for students. Clear for parents.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  CareerCraft keeps the experience simple: no confusing jargon,
                  no endless forms—just a guided flow that turns your answers
                  into actionable next steps.
                </p>

                <ul className="mt-5 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  {[
                    "Mobile-first, card-based UI",
                    "Smooth scroll sections and subtle animations",
                    "A modern dashboard feel without complexity",
                  ].map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-indigo-600/10 via-sky-500/10 to-emerald-500/10 p-6 dark:from-indigo-500/15 dark:via-sky-500/10 dark:to-emerald-500/10">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { k: "Fast", v: "Finish in minutes" },
                    { k: "Clear", v: "Confidence scores" },
                    { k: "Action", v: "Roadmap steps" },
                    { k: "Editable", v: "Your portfolio" },
                  ].map((s) => (
                    <div
                      key={s.k}
                      className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="text-sm font-semibold">{s.k}</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {s.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Get started */}
        <section id="get-started" className="mt-16 scroll-mt-24">
          <Reveal className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 p-[1px] shadow-sm">
            <div className="rounded-3xl bg-white/80 p-8 backdrop-blur dark:bg-slate-950/70">
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Ready to discover your career path?
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Create your student profile to get personalized course recommendations.
                  </p>
                </div>
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Create profile
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="mt-14 border-t border-slate-200/70 py-8 text-sm text-slate-600 dark:border-slate-800/70 dark:text-slate-300">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="font-medium text-slate-800 dark:text-slate-100">
              CareerCraft
              <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()}
              </span>
            </div>
            <div className="flex gap-4">
              <a className="hover:text-slate-900 dark:hover:text-white" href="#how">
                How it works
              </a>
              <a
                className="hover:text-slate-900 dark:hover:text-white"
                href="#features"
              >
                Features
              </a>
              <a className="hover:text-slate-900 dark:hover:text-white" href="#get-started">
                Get started
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
