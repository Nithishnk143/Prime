"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  apiGetCourseRecommendation,
  apiGetJobRoles,
  apiGetPortfolio,
  apiGetRoadmap,
  apiGetScholarships,
  clearToken,
  getToken,
  type AiPortfolio,
  type AiRoadmap,
  type AiTraits,
  type JobRole,
  type Scholarship,
  type AiCourseRecommendation,
} from "@/lib/careercraft-api";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ResultsPage() {
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

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [courses, setCourses] = useState<AiCourseRecommendation[]>([]);
  const [primaryDomain, setPrimaryDomain] = useState<string>("");
  const [traits, setTraits] = useState<AiTraits | null>(null);
  const [summary, setSummary] = useState<string>("");

  const [portfolio, setPortfolio] = useState<AiPortfolio | null>(null);
  const [roadmap, setRoadmap] = useState<AiRoadmap | null>(null);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);

  const topCourse = useMemo(() => courses[0]?.course, [courses]);

  useEffect(() => {
    if (!getToken()) {
      window.location.href = "/login";
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const rec = await apiGetCourseRecommendation();
        if (cancelled) return;

        setCourses(rec.recommendedCourses);
        setPrimaryDomain(rec.primaryDomain);
        setTraits(rec.traits);
        setSummary(rec.summary);

        const [p, r, roles, sch] = await Promise.all([
          apiGetPortfolio(),
          apiGetRoadmap(),
          apiGetJobRoles(rec.primaryDomain, rec.recommendedCourses[0]?.course),
          apiGetScholarships(rec.recommendedCourses[0]?.course),
        ]);

        if (cancelled) return;

        setPortfolio(p.portfolio);
        setRoadmap(r.roadmap);
        setJobRoles(roles.jobRoles);
        setScholarships(sch.scholarships);
      } catch (e: unknown) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : "Failed to load results");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

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

            <button
              type="button"
              onClick={() => {
                clearToken();
                window.location.href = "/login";
              }}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your CareerCraft Results</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Personalized recommendations based on your profile + test answers.
            </p>
          </div>
          <a
            href="/test"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            Retake test
          </a>
        </div>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
            Loading your AI results...
          </div>
        ) : err ? (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
            {err}
          </div>
        ) : (
          <div className="mt-6 grid gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Primary domain
              </div>
              <div className="mt-1 text-xl font-semibold">{primaryDomain}</div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {summary}
              </p>

              {traits ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Logical thinking", traits.logicalThinking],
                    ["Creativity", traits.creativity],
                    ["Practical skills", traits.practicalSkills],
                    ["Communication & leadership", traits.communicationLeadership],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {label}
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500"
                          style={{ width: `${Number(value)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                        {Number(value)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
              <div className="text-base font-semibold">Top recommended courses</div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {courses.map((c) => (
                  <div
                    key={c.course}
                    className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className="text-sm font-semibold">{c.course}</div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      {c.reason}
                    </div>
                    <div className="mt-3 inline-flex rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-3 py-2 text-xs font-semibold text-white">
                      {c.confidence}% match
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {portfolio ? (
              <section className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
                <div className="text-base font-semibold">Portfolio (AI-generated)</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {portfolio.strengthSummary}
                </p>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {[
                    ["Recommended skills", portfolio.recommendedSkills],
                    ["Learning focus areas", portfolio.learningFocusAreas],
                    ["Suggested projects", portfolio.suggestedProjects],
                  ].map(([title, items]) => (
                    <div
                      key={String(title)}
                      className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="text-sm font-semibold">{title}</div>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                        {(items as string[]).map((x) => (
                          <li key={x} className="flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {roadmap ? (
              <section className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
                <div className="text-base font-semibold">Career roadmap</div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{roadmap.notes}</p>

                <div className="mt-5 grid gap-4">
                  {roadmap.stages.map((s) => (
                    <div
                      key={s.stage}
                      className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="text-sm font-semibold">{s.stage}</div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {[
                          ["What to study", s.whatToStudy],
                          ["Skills to learn", s.skillsToLearn],
                          ["Certifications", s.certifications],
                          ["Projects", s.projects],
                          ["Internships", s.internships],
                        ].map(([label, items]) => (
                          <div key={String(label)}>
                            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              {label}
                            </div>
                            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                              {(items as string[]).slice(0, 6).map((x) => (
                                <li key={x}>• {x}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
              <div className="text-base font-semibold">Matching job roles</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Based on your domain{topCourse ? ` and top course (${topCourse})` : ""}.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {jobRoles.slice(0, 8).map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className="text-sm font-semibold">{r.title}</div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      Demand: {r.demandLevel} • Salary (INR): {r.salaryRangeInr.min.toLocaleString()}–
                      {r.salaryRangeInr.max.toLocaleString()}
                    </div>
                    <div className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                      Required skills
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.requiredSkills.slice(0, 6).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
              <div className="text-base font-semibold">Scholarships</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {scholarships.slice(0, 8).map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-slate-200 bg-white/70 p-4 transition hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-900"
                  >
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {s.category ? `${s.category} • ` : ""}{s.academicLevel}
                      {s.deadline ? ` • Deadline: ${s.deadline}` : ""}
                    </div>
                    {s.eligibility ? (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                        {s.eligibility}
                      </div>
                    ) : null}
                  </a>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
