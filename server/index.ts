import cors from "cors";
import bcrypt from "bcryptjs";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId, type Collection } from "mongodb";
import { z } from "zod";
import OpenAI from "openai";

type EducationLevel =
  | "Middle School"
  | "High School"
  | "Diploma"
  | "Undergraduate"
  | "Postgraduate";

type UserProfile = {
  fullName: string;
  age: number;
  educationLevel: EducationLevel;
  interests: string[];
};

type PsychometricSubmission = {
  answers: Record<string, string>;
  submittedAt: Date;
};

type AiAnalyzeResult = {
  primaryDomain: string;
  recommendedCourses: Array<{ course: string; reason: string }>;
};

type AiPortfolio = {
  strengthSummary: string; // short paragraph
  recommendedSkills: string[]; // bullet-ready
  learningFocusAreas: string[]; // bullet-ready
  suggestedProjects: string[]; // bullet-ready
};

type AiRoadmapStage = {
  stage: string; // e.g. "0–3 months", "3–6 months", "6–12 months", "Year 2"
  whatToStudy: string[];
  skillsToLearn: string[];
  certifications: string[];
  projects: string[];
  internships: string[];
};

type AiRoadmap = {
  primaryDomain: string;
  stages: AiRoadmapStage[];
  notes: string;
};

type DemandLevel = "Low" | "Medium" | "High";

type JobRoleDoc = {
  _id: ObjectId;
  title: string;
  domain: string;
  salaryRangeInr: { min: number; max: number };
  requiredSkills: string[];
  demandLevel: DemandLevel;
  courseTags?: string[];
};

type ScholarshipDoc = {
  _id: ObjectId;
  name: string;
  url: string;
  courseTags: string[];
  category?: string;
  academicLevel: EducationLevel;
  deadline?: string; // ISO or display text
  amountInr?: { min?: number; max?: number };
  eligibility?: string;
};

type UserDoc = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile;
  psychometric?: PsychometricSubmission;
  ai?: {
    analysis?: AiAnalyzeResult;
    portfolio?: { data: AiPortfolio; createdAt: Date; model: string };
    roadmap?: { data: AiRoadmap; createdAt: Date; model: string };
    createdAt?: Date;
    model?: string;
  };
};

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  OPENAI_API_KEY: z.string().optional(),
  PORT: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 4000))
    .pipe(z.number().int().positive()),
  FRONTEND_ORIGIN: z.string().optional(),
});

const env = envSchema.parse(process.env);

const AI_MODEL = "gpt-4-turbo-preview";

const app = express();
const jsonParser = express.json({ limit: "1mb" });
app.use((req, res, next) => {
  jsonParser(req, res, (err) => {
    const e = err as { code?: string; message?: string } | undefined;
    if (req.aborted || e?.code === "ECONNRESET" || e?.message === "aborted") return;
    if (err) return next(err);
    next();
  });
});

// Also attach socket-level error listeners so resets don't bubble to process/runner logs
app.use((req, res, next) => {
  const swallow = (err: unknown) => {
    const e = err as { code?: string; message?: string };
    if (e?.code === "ECONNRESET" || e?.message === "aborted") return;
  };

  req.socket.on("error", swallow);
  req.on("error", swallow);
  res.on("error", swallow);

  next();
});
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN ?? true,
    credentials: true,
  })
);

let mongoClient: MongoClient | null = null;

async function getUsersCollection(): Promise<Collection<UserDoc>> {
  if (!mongoClient) {
    mongoClient = new MongoClient(env.MONGODB_URI);
    await mongoClient.connect();
  }
  const db = mongoClient.db("careercraft");
  const users = db.collection<UserDoc>("users");
  await users.createIndex({ email: 1 }, { unique: true });
  return users;
}

async function getJobRolesCollection(): Promise<Collection<JobRoleDoc>> {
  if (!mongoClient) {
    mongoClient = new MongoClient(env.MONGODB_URI);
    await mongoClient.connect();
  }
  const db = mongoClient.db("careercraft");
  const col = db.collection<JobRoleDoc>("job_roles");
  await col.createIndex({ domain: 1 });
  await col.createIndex({ title: 1 });
  return col;
}

async function getScholarshipsCollection(): Promise<Collection<ScholarshipDoc>> {
  if (!mongoClient) {
    mongoClient = new MongoClient(env.MONGODB_URI);
    await mongoClient.connect();
  }
  const db = mongoClient.db("careercraft");
  const col = db.collection<ScholarshipDoc>("scholarships");
  await col.createIndex({ academicLevel: 1 });
  await col.createIndex({ category: 1 });
  return col;
}

function signToken(user: Pick<UserDoc, "_id" | "email">): string {
  return jwt.sign(
    { sub: user._id.toHexString(), email: user.email },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

type AuthRequest = Request & { userId?: string };

function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const h = req.header("authorization");
  if (!h?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }

  const token = h.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    const sub = decoded?.sub;
    if (typeof sub !== "string" || !sub) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    req.userId = sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const profileSchema = z.object({
  fullName: z.string().trim().min(2),
  age: z.number().int().min(12).max(100),
  educationLevel: z.enum([
    "Middle School",
    "High School",
    "Diploma",
    "Undergraduate",
    "Postgraduate",
  ]),
  interests: z.array(z.string().trim().min(1)).min(1),
});

const psychometricSchema = z
  .object({
    answers: z.record(z.string().min(1)),
  })
  .superRefine((val, ctx) => {
    const n = Object.keys(val.answers).length;
    if (n < 8 || n > 10) {
      ctx.addIssue({
        code: "custom",
        message: "answers must contain 8–10 entries",
        path: ["answers"],
      });
    }
  });

const aiPortfolioSchema = z.object({
  strengthSummary: z.string().min(1),
  recommendedSkills: z.array(z.string().min(1)).min(3).max(12),
  learningFocusAreas: z.array(z.string().min(1)).min(3).max(12),
  suggestedProjects: z.array(z.string().min(1)).min(2).max(10),
});

const aiRoadmapSchema = z.object({
  primaryDomain: z.string().min(1),
  stages: z
    .array(
      z.object({
        stage: z.string().min(1),
        whatToStudy: z.array(z.string().min(1)).min(1).max(10),
        skillsToLearn: z.array(z.string().min(1)).min(1).max(10),
        certifications: z.array(z.string().min(1)).max(10),
        projects: z.array(z.string().min(1)).min(1).max(10),
        internships: z.array(z.string().min(1)).max(10),
      })
    )
    .min(3)
    .max(8),
  notes: z.string().min(1),
});

function qString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function normalizeTag(s: string): string {
  return s.trim().toLowerCase();
}

function getOpenAIClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

function buildAnswerContext(answers: Record<string, string>): string {
  return Object.entries(answers)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/auth/signup", async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const users = await getUsersCollection();

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  try {
    const insert = await users.insertOne({
      _id: new ObjectId(),
      email: email.toLowerCase(),
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const userId = insert.insertedId.toHexString();
    const token = signToken({ _id: insert.insertedId, email: email.toLowerCase() });

    res.status(201).json({ token, user: { id: userId, email: email.toLowerCase() } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Mongo duplicate key typically includes E11000
    if (msg.includes("E11000")) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const users = await getUsersCollection();

  const user = await users.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ _id: user._id, email: user.email });
  res.json({ token, user: { id: user._id.toHexString(), email: user.email } });
});

app.get("/me", auth, async (req: AuthRequest, res: Response) => {
  const users = await getUsersCollection();
  const user = await users.findOne(
    { _id: new ObjectId(req.userId) },
    { projection: { passwordHash: 0 } }
  );

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    user: {
      id: user._id.toHexString(),
      email: user.email,
      profile: user.profile ?? null,
      psychometric: user.psychometric ? { submittedAt: user.psychometric.submittedAt } : null,
    },
  });
});

/**
 * Basic user data collection endpoint (profile)
 * Stores: name, age, education level, interests
 */
app.post("/user/profile", auth, async (req: AuthRequest, res: Response) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const users = await getUsersCollection();
  const now = new Date();

  const result = await users.updateOne(
    { _id: new ObjectId(req.userId) },
    { $set: { profile: parsed.data, updatedAt: now } }
  );

  if (result.matchedCount === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ ok: true });
});

/**
 * Basic user data collection endpoint (psychometric answers)
 * Stores: 8–10 MCQ answers as a map {questionId: choiceId}
 */
app.post("/user/psychometric", auth, async (req: AuthRequest, res: Response) => {
  const parsed = psychometricSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const users = await getUsersCollection();
  const now = new Date();

  const result = await users.updateOne(
    { _id: new ObjectId(req.userId) },
    {
      $set: {
        psychometric: { answers: parsed.data.answers, submittedAt: now },
        updatedAt: now,
      },
    }
  );

  if (result.matchedCount === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ ok: true });
});

// --- AI: Portfolio ---
app.get("/ai/portfolio", auth, async (req: AuthRequest, res: Response) => {
  const refresh = qString(req.query.refresh) === "1";

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(req.userId) });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!refresh && user.ai?.portfolio?.data) {
    res.json({
      model: user.ai.portfolio.model,
      createdAt: user.ai.portfolio.createdAt,
      portfolio: user.ai.portfolio.data,
    });
    return;
  }

  if (!user.profile) {
    res.status(400).json({ error: "Profile is missing. Save /user/profile first." });
    return;
  }
  if (!user.psychometric?.answers) {
    res.status(400).json({ error: "Psychometric answers are missing. Save /user/psychometric first." });
    return;
  }
  if (!user.ai?.analysis) {
    res.status(400).json({ error: "AI analysis is missing. Run POST /ai/analyze first." });
    return;
  }

  let client: OpenAI;
  try {
    client = getOpenAIClient();
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "AI not configured" });
    return;
  }

  const answerContext = buildAnswerContext(user.psychometric.answers);

  const system = [
    "You are CareerCraft AI.",
    "Generate a student portfolio section based on profile + psychometric answers + the chosen domain.",
    "Return ONLY valid JSON. No markdown.",
    "Keep content beginner-friendly and directly renderable in a UI.",
  ].join(" ");

  const prompt = {
    profile: user.profile,
    psychometric: answerContext,
    analysis: user.ai.analysis,
    outputJsonShape: {
      strengthSummary: "string (short paragraph)",
      recommendedSkills: ["string"],
      learningFocusAreas: ["string"],
      suggestedProjects: ["string"],
    },
    constraints: {
      recommendedSkillsCount: "5-8",
      learningFocusAreasCount: "4-8",
      projectsCount: "3-6",
      avoid: ["medical/legal advice", "guarantees about jobs"],
      countryContext: "India",
    },
  };

  try {
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(prompt) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(502).json({ error: "AI returned an empty response" });
      return;
    }

    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      res.status(502).json({ error: "AI returned non-JSON output", raw: content });
      return;
    }

    const parsed = aiPortfolioSchema.safeParse(json);
    if (!parsed.success) {
      res.status(502).json({ error: "AI output did not match expected schema", details: parsed.error.flatten() });
      return;
    }

    const now = new Date();
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          "ai.portfolio": { data: parsed.data, createdAt: now, model: AI_MODEL },
          updatedAt: now,
        },
      }
    );

    res.json({ model: AI_MODEL, createdAt: now, portfolio: parsed.data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OpenAI request failed";
    res.status(502).json({ error: msg });
  }
});

// --- AI: Career Roadmap ---
app.get("/ai/career-roadmap", auth, async (req: AuthRequest, res: Response) => {
  const refresh = qString(req.query.refresh) === "1";

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(req.userId) });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!refresh && user.ai?.roadmap?.data) {
    res.json({
      model: user.ai.roadmap.model,
      createdAt: user.ai.roadmap.createdAt,
      roadmap: user.ai.roadmap.data,
    });
    return;
  }

  if (!user.profile) {
    res.status(400).json({ error: "Profile is missing. Save /user/profile first." });
    return;
  }
  if (!user.psychometric?.answers) {
    res.status(400).json({ error: "Psychometric answers are missing. Save /user/psychometric first." });
    return;
  }
  if (!user.ai?.analysis) {
    res.status(400).json({ error: "AI analysis is missing. Run POST /ai/analyze first." });
    return;
  }

  let client: OpenAI;
  try {
    client = getOpenAIClient();
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "AI not configured" });
    return;
  }

  const answerContext = buildAnswerContext(user.psychometric.answers);

  const system = [
    "You are CareerCraft AI.",
    "Create a step-by-step beginner-friendly career roadmap for a student in India.",
    "Make it stage-wise/year-wise, actionable, and realistic.",
    "Return ONLY valid JSON (no markdown).",
  ].join(" ");

  const prompt = {
    profile: user.profile,
    psychometric: answerContext,
    analysis: user.ai.analysis,
    outputJsonShape: {
      primaryDomain: "string",
      stages: [
        {
          stage: "string",
          whatToStudy: ["string"],
          skillsToLearn: ["string"],
          certifications: ["string"],
          projects: ["string"],
          internships: ["string"],
        },
      ],
      notes: "string",
    },
    constraints: {
      stages: "4-6 stages",
      stageStyle: "Use a mix like: '0–3 months', '3–6 months', '6–12 months', 'Year 2', etc.",
      avoid: ["medical/legal advice", "guarantees about placements/salary"],
      includeIndiaContext: true,
    },
  };

  try {
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(prompt) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(502).json({ error: "AI returned an empty response" });
      return;
    }

    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      res.status(502).json({ error: "AI returned non-JSON output", raw: content });
      return;
    }

    const parsed = aiRoadmapSchema.safeParse(json);
    if (!parsed.success) {
      res.status(502).json({ error: "AI output did not match expected schema", details: parsed.error.flatten() });
      return;
    }

    const now = new Date();
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          "ai.roadmap": { data: parsed.data, createdAt: now, model: AI_MODEL },
          updatedAt: now,
        },
      }
    );

    res.json({ model: AI_MODEL, createdAt: now, roadmap: parsed.data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OpenAI request failed";
    res.status(502).json({ error: msg });
  }
});

// --- Job Role Mapping Engine (DB-driven) ---
app.get("/ai/job-roles", auth, async (req: AuthRequest, res: Response) => {
  const explicitDomain = qString(req.query.domain);
  const explicitCourse = qString(req.query.course);

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(req.userId) });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const analysis = user.ai?.analysis;
  if (!analysis && !explicitDomain && !explicitCourse) {
    res.status(400).json({ error: "AI analysis missing. Run POST /ai/analyze or pass ?domain= / ?course=." });
    return;
  }

  const domain = explicitDomain ?? analysis?.primaryDomain;
  const courseTags = [
    explicitCourse,
    ...(analysis?.recommendedCourses?.map((x) => x.course) ?? []),
  ]
    .filter((x): x is string => Boolean(x))
    .map(normalizeTag);

  const rolesCol = await getJobRolesCollection();

  const filter: Record<string, unknown> = {};
  if (domain) filter.domain = domain;

  // If the DB stores courseTags, use them as an OR expansion (still domain-first).
  const or: Array<Record<string, unknown>> = [];
  if (courseTags.length > 0) {
    or.push({ courseTags: { $in: courseTags } });
  }
  if (or.length > 0) filter.$or = or;

  const roles = await rolesCol
    .find(filter)
    .limit(30)
    .toArray();

  res.json({
    domain: domain ?? null,
    count: roles.length,
    jobRoles: roles.map((r) => ({
      id: r._id.toHexString(),
      title: r.title,
      domain: r.domain,
      salaryRangeInr: r.salaryRangeInr,
      requiredSkills: r.requiredSkills,
      demandLevel: r.demandLevel,
    })),
  });
});

// --- Scholarship Recommendation Engine (DB-driven) ---
app.get("/scholarships", auth, async (req: AuthRequest, res: Response) => {
  const explicitCourse = qString(req.query.course);
  const explicitCategory = qString(req.query.category);
  const explicitAcademicLevel = qString(req.query.academicLevel) as EducationLevel | undefined;

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(req.userId) });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const analysis = user.ai?.analysis;
  const profile = user.profile;

  const course =
    explicitCourse ??
    analysis?.recommendedCourses?.[0]?.course ??
    undefined;

  const academicLevel = explicitAcademicLevel ?? profile?.educationLevel;

  if (!academicLevel) {
    res.status(400).json({ error: "Academic level missing. Save /user/profile or pass ?academicLevel=." });
    return;
  }

  const scholarshipsCol = await getScholarshipsCollection();

  const filter: Record<string, unknown> = {
    academicLevel,
  };

  if (explicitCategory) filter.category = explicitCategory;

  if (course) {
    filter.courseTags = { $in: [normalizeTag(course)] };
  }

  const items = await scholarshipsCol.find(filter).limit(50).toArray();

  res.json({
    filters: {
      course: course ?? null,
      category: explicitCategory ?? null,
      academicLevel,
    },
    count: items.length,
    scholarships: items.map((s) => ({
      id: s._id.toHexString(),
      name: s.name,
      url: s.url,
      category: s.category ?? null,
      academicLevel: s.academicLevel,
      deadline: s.deadline ?? null,
      amountInr: s.amountInr ?? null,
      eligibility: s.eligibility ?? null,
    })),
  });
});

// Global error handler (keeps responses consistent)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Unexpected error";
  res.status(500).json({ error: message });
});

// Swallow common "client aborted / ECONNRESET" noise so it doesn't hit STDERR as unhandled.
// IMPORTANT: we only ignore this specific case; everything else should still surface.
process.on("uncaughtException", (err: unknown) => {
  const e = err as { code?: string; message?: string };
  if (e.code === "ECONNRESET" || e.message === "aborted") return;

  // eslint-disable-next-line no-console
  console.error("[server] uncaughtException", err);
});

process.on("unhandledRejection", (reason: unknown) => {
  const e = reason as { code?: string; message?: string };
  if (e?.code === "ECONNRESET" || e?.message === "aborted") return;

  // eslint-disable-next-line no-console
  console.error("[server] unhandledRejection", reason);
});

app.use((req, _res, next) => {
  // Ensure low-level stream errors don't become "unhandled error" on aborted requests.
  req.on("error", (err: unknown) => {
    const e = err as { code?: string; message?: string };
    if (e.code === "ECONNRESET" || e.message === "aborted") return;
  });
  next();
});

async function main() {
  // Ensure DB connection early so startup fails fast
  await getUsersCollection();
  await getJobRolesCollection();
  await getScholarshipsCollection();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((e: unknown) => {
  // eslint-disable-next-line no-console
  console.error("[server] failed to start", e);
  process.exit(1);
});
