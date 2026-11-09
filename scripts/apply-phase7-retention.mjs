import pg from "pg"
const { Pool } = pg
import fs from "fs"
import path from "path"

// Load .env.local if present
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8")
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      const key = match[1]
      let value = match[2] || ""
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
      if (!process.env[key]) process.env[key] = value
    }
  }
}

const NEON_URL = process.env.DATABASE_URL
if (!NEON_URL) {
  console.error("Error: DATABASE_URL is not set.")
  process.exit(1)
}

const isLocal = NEON_URL.includes("localhost") || NEON_URL.includes("127.0.0.1")

const pool = new Pool({
  connectionString: NEON_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

async function run() {
  const client = await pool.connect()
  try {
    await client.query("SET search_path TO public, neon_auth;")
    console.log("=== STEP 1: Applying 004_phase7_retention.up.sql ===")
    const sql = fs.readFileSync(path.join(process.cwd(), "migrations", "004_phase7_retention.up.sql"), "utf8")
    await client.query(sql)
    console.log("✓ Created vip_tour_bookings_archive with LZ4 compression and retention indexes.")

    console.log("\n=== STEP 2: Verifying Archive Table Columns ===")
    const colRes = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'vip_tour_bookings_archive'
      ORDER BY ordinal_position;
    `)
    console.table(colRes.rows)

    console.log("\n=== STEP 3: Verifying Retention Indexes ===")
    const idxRes = await client.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE indexname IN (
        'idx_vip_bookings_archive_archived',
        'idx_vip_bookings_archive_property',
        'idx_vip_tokens_retention'
      );
    `)
    console.table(idxRes.rows)

    console.log("\n>>> Phase 7 Retention Schema Migration Successfully Applied <<<")
  } catch (err) {
    console.error("Migration error:", err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
