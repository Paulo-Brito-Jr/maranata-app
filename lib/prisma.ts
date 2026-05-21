import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Runtime queries → DATABASE_URL (pooler, transaction mode 6543).
// DIRECT_URL (session mode 5432) é só pra prisma migrate.
// Invertido causava pool exhaustion (max 15 conn) → 500 em prod.
const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL!;

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, log: ["error"] });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
