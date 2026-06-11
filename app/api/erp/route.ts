import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { seedData } from "../../lib/seed";

export const dynamic = "force-dynamic";

type Snapshot = typeof seedData;

let memorySnapshot: Snapshot = seedData;

function db() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL or DATABASE_URL is required");
  return neon(url);
}

async function ensureTable() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS erp_demo_snapshots (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function hasPostgres() {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}

export async function GET() {
  if (!hasPostgres()) {
    return NextResponse.json({ source: "seed", data: memorySnapshot });
  }
  try {
    await ensureTable();
    const sql = db();
    const rows = await sql`SELECT payload FROM erp_demo_snapshots WHERE id = 'default'`;
    if (!rows.length) {
      await sql`
        INSERT INTO erp_demo_snapshots (id, payload)
        VALUES ('default', ${JSON.stringify(seedData)}::jsonb)
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
    await ensureTable();
    const sql = db();
    await sql`
      INSERT INTO erp_demo_snapshots (id, payload, updated_at)
      VALUES ('default', ${JSON.stringify(body)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `;
    return NextResponse.json({ source: "postgres", data: body });
  } catch {
    memorySnapshot = body;
    return NextResponse.json({ source: "memory_fallback", data: body });
  }
}
