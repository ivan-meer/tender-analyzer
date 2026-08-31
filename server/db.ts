import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const NEON_DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_Y2dyqAEv5SLa@ep-steep-sound-aw10kdi4-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require";

let neonPool: pg.Pool | null = null;

export function getNeonPool(): pg.Pool {
  if (!neonPool) {
    neonPool = new Pool({
      connectionString: NEON_DB_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return neonPool;
}
