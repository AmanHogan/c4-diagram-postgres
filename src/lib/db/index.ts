import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  _db?: ReturnType<typeof createDb>;
};

function createDb(): ReturnType<typeof drizzle<typeof schema>> {
  return drizzle(process.env.DATABASE_URL ?? "", { schema });
}

export const db = globalForDb._db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb._db = db;
}

export * from "./schema";
