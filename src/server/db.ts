import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export class DatabaseUnavailableError extends AppError {
  constructor(message = "DATABASE_URL is missing or unreachable.") {
    super({
      code: "DATABASE_UNAVAILABLE",
      status: 503,
      message,
      userMessage:
        "Baza nije povezana. U Vercel Environment Variables dodaj DATABASE_URL (i DIRECT_URL), pa pokreni prisma migrate deploy.",
    });
  }
}

function createClient(): PrismaClient {
  const env = getEnv();
  const connectionString = env.DATABASE_URL;
  if (!connectionString) {
    throw new DatabaseUnavailableError("DATABASE_URL is not set.");
  }

  const adapter = /neon\.(tech|build)/i.test(connectionString)
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
