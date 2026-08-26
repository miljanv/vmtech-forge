import { z } from "zod";

const booleanish = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((value) => value === "true" || value === "1");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  STUDIOFORGE_DEMO_MODE: booleanish,
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL_EXTRACTOR: z.string().default("gpt-5.6-terra"),
  OPENAI_MODEL_DESIGNER: z.string().default("gpt-5.6"),
  OPENAI_STORE_RESPONSES: booleanish,
  TRIGGER_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY: z.string().optional(),
  TRIGGER_PROJECT_ID: z.string().optional(),
  FIRECRAWL_API_KEY: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  PREVIEW_SESSION_SALT: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema> & {
  demoMode: boolean;
  clerkEnabled: boolean;
  openaiEnabled: boolean;
  triggerEnabled: boolean;
  firecrawlEnabled: boolean;
  r2Enabled: boolean;
  adminEmails: string[];
};

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) {
    return cached;
  }

  const parsed = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    STUDIOFORGE_DEMO_MODE: process.env.STUDIOFORGE_DEMO_MODE,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL_EXTRACTOR: process.env.OPENAI_MODEL_EXTRACTOR,
    OPENAI_MODEL_DESIGNER: process.env.OPENAI_MODEL_DESIGNER,
    OPENAI_STORE_RESPONSES: process.env.OPENAI_STORE_RESPONSES,
    TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
    NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY:
      process.env.NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY,
    TRIGGER_PROJECT_ID: process.env.TRIGGER_PROJECT_ID,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    PREVIEW_SESSION_SALT: process.env.PREVIEW_SESSION_SALT,
  });

  const demoMode =
    parsed.STUDIOFORGE_DEMO_MODE ||
    parsed.NODE_ENV === "test" ||
    (parsed.NODE_ENV !== "production" &&
      !parsed.CLERK_SECRET_KEY &&
      !parsed.OPENAI_API_KEY);
  const clerkEnabled = false;
  const r2Enabled = Boolean(
    parsed.R2_ACCOUNT_ID &&
      parsed.R2_ACCESS_KEY_ID &&
      parsed.R2_SECRET_ACCESS_KEY &&
      parsed.R2_BUCKET_NAME,
  );

  cached = {
    ...parsed,
    demoMode,
    clerkEnabled,
    openaiEnabled: Boolean(parsed.OPENAI_API_KEY),
    triggerEnabled: Boolean(parsed.TRIGGER_SECRET_KEY),
    firecrawlEnabled: Boolean(parsed.FIRECRAWL_API_KEY),
    r2Enabled,
    adminEmails: (parsed.ADMIN_EMAILS ?? "owner@studioforge.local")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  };

  return cached;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return getEnv().adminEmails.includes(email.trim().toLowerCase());
}

export function getAppUrl(): string {
  return getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

export function resetEnvCache(): void {
  cached = null;
}
