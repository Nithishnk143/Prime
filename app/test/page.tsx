"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  apiAnalyze,
  apiSavePsychometric,
  getToken,
} from "@/lib/careercraft-api";

type Choice = {
  id: string;
  label: string;
};

type Question = {
  id: string;
  title: string;
  subtitle?: string;
  choices: Choice[];
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function PsychometricTestPage() {
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

  const questions = useMemo<Question[]>(
    () => [
      {
        id: "q1",
        title: "Which activity feels most fun to you?",
        subtitle: "Pick the option you'd naturally choose on a free day.",
        choices: [
          { id: "a", label: "Building or fixing things (gadgets, models, DIY)" },
          { id: "b", label: "Solving puzzles or logic games" },
          { id: "c", label: "Creating art/designs or writing something original" },
          { id: "d", label: "Helping or guiding people" },
        ],
      },
      {
        id: "q2",
        title: "When you face a difficult problem, you usually…",
        choices: [
          { id: "a", label: "Break it into steps and solve it systematically" },
          { id: "b", label: "Try a creative approach and experiment" },
          { id: "c", label: "Ask someone and discuss possible solutions" },
          { id: "d", label: "Look up examples and learn from them" },
        ],
      },
      {
        id: "q3",
        title: "Which subject area do you feel most confident in?",
        choices: [
          { id: "a", label: "Math / Logical reasoning" },
          { id: "b", label: "Science / Experiments" },
          { id: "c", label: "Language / Communication" },
          { id: "d", label: "Art / Creativity" },
        ],
      },
      {
        id: "q4",
        title: "How do you prefer to work?",
        choices: [
          { id: "a", label: "Independently with deep focus" },
          { id: "b", label: "In a team with shared ideas" },
          { id: "c", label: "A mix of both, depending on the task" },
          { id: "d", label: "Leading or organizing people" },
        ],
      },
      {
        id: "q5",
        title: "You're given a new tool/app. What do you do first?",
        choices: [
          { id: "a", label: "Explore settings and features immediately" },
          { id: "b", label: "Watch a quick tutorial and follow along" },
          { id: "c", label: "Try it and learn by doing" },
          { id: "d", label: "Ask friends how they use it" },
        ],
      },
      {
        id: "q6",
        title: "Which describes you best?",
        choices: [
          { id: "a", label: "I enjoy patterns, rules, and accuracy" },
          { id: "b", label: "I enjoy ideas, stories, and imagination" },
          { id: "c", label: "I enjoy people, teamwork, and support" },
          { id: "d", label: "I enjoy planning, goals, and results" },
        ],
      },
      {
        id: "q7",
        title: "When learning something new, you prefer…",
        choices: [
          { id: "a", label: "Examples + practice problems" },
          { id: "b", label: "Projects that build something real" },
          { id: "c", label: "Group activities and discussions" },
          { id: "d", label: "Reading and taking notes" },
        ],
      },
      {
        id: "q8",
        title: "Which type of challenge excites you more?",
        choices: [
          { id: "a", label: "Coding/tech challenges" },
          { id: "b", label: "Design/creative challenges" },
          { id: "c", label: "Leadership/people challenges" },
          { id: "d", label: "Hands-on engineering/build challenges" },
        ],
      },
      {
        id: "q9",
        title: "How comfortable are you with presenting or speaking?",
        choices: [
          { id: "a", label: "Very comfortable" },
          { id: "b", label: "Somewhat comfortable" },
          { id: "c", label: "I prefer small groups" },
          { id: "d", label: "I prefer not to present" },
        ],
      },
      {
        id: "q10",
        title: "Pick a future environment you'd enjoy most:",
        choices: [
          { id: "a", label: "Tech-focused office/lab with problem solving" },
          { id: "b", label: "Creative studio/media environment" },
          { id: "c", label: "People-focused workplace (teaching/counseling/team)" },
          { id: "d", label: "Field/site environment with practical work" },
        ],
      },
    ],
    []
  );

  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // simple guard: if no token, push user to login
    if (typeof window === "undefined") return;
    if (!getToken()) window.location.href = "/login";
  }, []);

  const [enter, setEnter] = useState(true);
  useEffect(() => {
    setEnter(false);
    const id = window.setTimeout(() => setEnter(true), 10);
    return () => window.clearTimeout(id);
  }, [index]);

  const q = questions[index];
  const selected = q ? answers[q.id] : undefined;

  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round(((done ? total : index + 1) / total) * 100);

  function choose(choiceId: string) {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: choiceId }));
    setTouched(false);
  }

  function next() {
    if (!q) return;
    if (!answers[q.id]) {
      setTouched(true);
      return;
    }
    if (index === total - 1) {
      setDone(true);
      return;
    }
    setIndex((i) => Math.min(i + 1, total - 1));
  }

  function back() {
    setTouched(false);
    setDone(false);
    setIndex((i) => Math.max(i - 1, 0));
  }

  function restart() {
    setAnswers({});
    setTouched(false);
    setDone(false);
    setIndex(0);
  }

  async function continueToResults() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await apiSavePsychometric({ answers });
      await apiAnalyze();
      window.location.href = "/results";
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to generate results");
    } finally {
      setSubmitting(false);
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
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              Profile
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <section className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Psychometric Test</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Answer honestly—there are no right or wrong choices.
                </p>
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300">
                {done ? (
                  <span className="font-medium">Completed</span>
                ) : (
                  <>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Question {index + 1}
                    </span>{" "}
                    <span>of {total}</span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 transition-[width] duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{answeredCount}/{total} answered</span>
                <span>{progressPct}%</span>
              </div>
            </div>

            {!done && q ? (
              <div
                className={cn(
                  "mt-8 transition-all duration-300 ease-out motion-reduce:transition-none",
                  enter ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}
                key={q.id}
              >
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {q.subtitle ?? "Choose one option"}
                </div>
                <h2 className="mt-2 text-xl font-semibold leading-snug">{q.title}</h2>

                <div className="mt-5 grid gap-3">
                  {q.choices.map((c) => {
                    const active = selected === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => choose(c.id)}
                        className={cn(
                          "group w-full rounded-2xl border p-4 text-left shadow-sm transition",
                          active
                            ? "border-transparent bg-gradient-to-r from-indigo-600 to-sky-500 text-white"
                            : "border-slate-200 bg-white/70 text-slate-800 hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:hover:bg-slate-900"
                        )}
                        aria-pressed={active}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="text-sm font-medium leading-6">{c.label}</div>
                          <div
                            className={cn(
                              "mt-0.5 h-5 w-5 shrink-0 rounded-full border transition",
                              active
                                ? "border-white/60 bg-white/20"
                                : "border-slate-300 bg-transparent dark:border-slate-700"
                            )}
                          >
                            <div
                              className={cn(
                                "m-[3px] h-3 w-3 rounded-full transition",
                                active ? "bg-white" : "bg-transparent"
                              )}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {touched && !selected ? (
                  <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                    Please choose one option to continue.
                  </p>
                ) : null}

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={back}
                    disabled={index === 0}
                    className={cn(
                      "inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold shadow-sm transition",
                      index === 0
                        ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-500"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                    )}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-sky-400"
                  >
                    {index === total - 1 ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            ) : null}

            {done ? (
              <div className="mt-8">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
                  <div className="text-sm font-semibold">Test completed (frontend-only)</div>
                  <p className="mt-1 text-sm leading-6 text-emerald-900/80 dark:text-emerald-100/80">
                    Next, we'll use your answers to generate recommendations and results.
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={restart}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                  >
                    Retake test
                  </button>

                  <button
                    type="button"
                    onClick={continueToResults}
                    disabled={submitting}
                    className={cn(
                      "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-sky-400",
                      submitting ? "opacity-70 cursor-not-allowed" : ""
                    )}
                  >
                    {submitting ? "Generating results..." : "Continue to recommendations"}
                  </button>
                </div>

                {submitError ? (
                  <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                    {submitError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40 sm:p-8">
            <div className="text-sm font-semibold">Test tips</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {[
                "Answer what feels true most of the time.",
                "Don't overthink—go with your first instinct.",
                "Your results will include confidence scores and a roadmap.",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-600/10 via-sky-500/10 to-emerald-500/10 p-5 dark:from-indigo-500/15 dark:via-sky-500/10 dark:to-emerald-500/10">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Privacy
              </div>
              <div className="mt-1 text-sm font-semibold">
                Your answers stay on this device for now.
              </div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                (We'll connect secure storage later when we add backend.)
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
