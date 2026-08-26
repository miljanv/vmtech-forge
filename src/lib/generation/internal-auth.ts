import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return (
    process.env.GENERATION_INTERNAL_SECRET ||
    process.env.OPENAI_API_KEY ||
    "studioforge-dev"
  );
}

export function signGenerationJob(jobId: string) {
  return createHmac("sha256", secret()).update(jobId).digest("hex");
}

export function verifyGenerationJob(jobId: string, token: string | null) {
  if (!token) return false;
  const expected = Buffer.from(signGenerationJob(jobId));
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function generationBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3005";
}
