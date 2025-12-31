export type EducationLevel =
  | "Middle School"
  | "High School"
  | "Diploma"
  | "Undergraduate"
  | "Postgraduate";

export type UserProfileInput = {
  fullName: string;
  age: number;
  educationLevel: EducationLevel;
  interests: string[];
};

export type PsychometricInput = {
  answers: Record<string, string>;
};

export type AiCourseRecommendation = {
  course: string;
  confidence: number;
  reason: string;
};

export type AiTraits = {
  logicalThinking: number;
  creativity: number;
  practicalSkills: number;
  communicationLeadership: number;
};

export type AiAnalyzeResult = {
  recommendedCourses: AiCourseRecommendation[];
  primaryDomain: string;
  traits: AiTraits;
  summary: string;
};

export type AiPortfolio = {
  strengthSummary: string;
  recommendedSkills: string[];
  learningFocusAreas: string[];
  suggestedProjects: string[];
};

export type AiRoadmapStage = {
  stage: string;
  whatToStudy: string[];
  skillsToLearn: string[];
  certifications: string[];
  projects: string[];
  internships: string[];
};

export type AiRoadmap = {
  primaryDomain: string;
  stages: AiRoadmapStage[];
  notes: string;
};

export type JobRole = {
  id: string;
  title: string;
  domain: string;
  salaryRangeInr: { min: number; max: number };
  requiredSkills: string[];
  demandLevel: "Low" | "Medium" | "High";
};

export type Scholarship = {
  id: string;
  name: string;
  url: string;
  category: string | null;
  academicLevel: EducationLevel;
  deadline: string | null;
  amountInr: { min?: number; max?: number } | null;
  eligibility: string | null;
};

const TOKEN_KEY = "careercraft:token";

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return "http://localhost:4000";
  return base.replace(/\/+$/, "");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function fetchJson<T>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(opts.headers);
  headers.set("Content-Type", "application/json");

  if (opts.auth) {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...opts, headers });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const msg =
      (data as { error?: string } | null)?.error ??
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

export async function apiSignup(email: string, password: string) {
  return fetchJson<{ token: string; user: { id: string; email: string } }>(
    "/auth/signup",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export async function apiLogin(email: string, password: string) {
  return fetchJson<{ token: string; user: { id: string; email: string } }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export async function apiSaveProfile(profile: UserProfileInput) {
  return fetchJson<{ ok: true }>("/user/profile", {
    method: "POST",
    body: JSON.stringify(profile),
    auth: true,
  });
}

export async function apiSavePsychometric(input: PsychometricInput) {
  return fetchJson<{ ok: true }>("/user/psychometric", {
    method: "POST",
    body: JSON.stringify(input),
    auth: true,
  });
}

export async function apiAnalyze() {
  return fetchJson<{ analysis: AiAnalyzeResult }>("/ai/analyze", {
    method: "POST",
    body: JSON.stringify({}),
    auth: true,
  });
}

export async function apiGetCourseRecommendation() {
  return fetchJson<{
    model: string;
    createdAt: string;
    recommendedCourses: AiCourseRecommendation[];
    primaryDomain: string;
    traits: AiTraits;
    summary: string;
  }>("/ai/course-recommendation", { auth: true });
}

export async function apiGetPortfolio(refresh?: boolean) {
  const q = refresh ? "?refresh=1" : "";
  return fetchJson<{ model: string; createdAt: string; portfolio: AiPortfolio }>(
    `/ai/portfolio${q}`,
    { auth: true }
  );
}

export async function apiGetRoadmap(refresh?: boolean) {
  const q = refresh ? "?refresh=1" : "";
  return fetchJson<{ model: string; createdAt: string; roadmap: AiRoadmap }>(
    `/ai/career-roadmap${q}`,
    { auth: true }
  );
}

export async function apiGetJobRoles(domain?: string, course?: string) {
  const params = new URLSearchParams();
  if (domain) params.set("domain", domain);
  if (course) params.set("course", course);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchJson<{ domain: string | null; count: number; jobRoles: JobRole[] }>(
    `/ai/job-roles${q}`,
    { auth: true }
  );
}

export async function apiGetScholarships(
  course?: string,
  category?: string,
  academicLevel?: EducationLevel
) {
  const params = new URLSearchParams();
  if (course) params.set("course", course);
  if (category) params.set("category", category);
  if (academicLevel) params.set("academicLevel", academicLevel);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchJson<{
    filters: {
      course: string | null;
      category: string | null;
      academicLevel: EducationLevel;
    };
    count: number;
    scholarships: Scholarship[];
  }>(`/scholarships${q}`, { auth: true });
}
