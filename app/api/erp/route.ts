import postgres from "postgres";
import { NextResponse } from "next/server";
import { seedData } from "../../lib/seed";

export const dynamic = "force-dynamic";

type Snapshot = typeof seedData;

let memorySnapshot: Snapshot = seedData;

// Reuse a single client across warm serverless invocations.
let _sql: ReturnType<typeof postgres> | null = null;

function connString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
}

function hasPostgres() {
  return Boolean(connString());
}

function db() {
  if (_sql) return _sql;
  const url = connString();
  if (!url) throw new Error("POSTGRES_URL or DATABASE_URL is required");
  // prepare:false is required for the Supabase transaction pooler (pgbouncer).
  _sql = postgres(url, { prepare: false, max: 1, idle_timeout: 20 });
  return _sql;
}

async function ensureTable(sql: ReturnType<typeof postgres>) {
  await sql`
    CREATE TABLE IF NOT EXISTS erp_demo_snapshots (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function GET() {
  if (!hasPostgres()) {
    return NextResponse.json({ source: "seed", data: memorySnapshot });
  }
  try {
    const sql = db();
    await ensureTable(sql);
    const rows = await sql`SELECT payload FROM erp_demo_snapshots WHERE id = 'default'`;
    if (!rows.length) {
      await sql`
        INSERT INTO erp_demo_snapshots (id, payload)
        VALUES ('default', ${sql.json(seedData as never)})
        ON CONFLICT (id) DO NOTHING
      `;
      return NextResponse.json({ source: "postgres_seeded", data: seedData });
    }
    return NextResponse.json({ source: "postgres", data: rows[0].payload });
  } catch {
    return NextResponse.json({ source: "memory_fallback", data: memorySnapshot });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as Snapshot;
  if (!hasPostgres()) {
    memorySnapshot = body;
    return NextResponse.json({ source: "memory", data: memorySnapshot });
  }
  try {
    const sql = db();
    await ensureTable(sql);
    await sql`
      INSERT INTO erp_demo_snapshots (id, payload, updated_at)
      VALUES ('default', ${sql.json(body as never)}, NOW())
      ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `;
    return NextResponse.json({ source: "postgres", data: body });
  } catch {
    memorySnapshot = body;
    return NextResponse.json({ source: "memory_fallback", data: body });
  }
}
