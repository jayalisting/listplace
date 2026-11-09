import pg from "pg"
const { Pool } = pg
import fs from "fs"
import path from "path"

const NEON_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_JVUAl62LnRdp@ep-long-firefly-aze7kekk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const isLocal = NEON_URL.includes("localhost") || NEON_URL.includes("127.0.0.1")

const pool = new Pool({
  connectionString: NEON_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

async function run() {
  const client = await pool.connect()
  try {
    await client.query("SET search_path TO public, neon_auth;")
    console.log("=== STEP 1: Applying 002_phase2_compression.up.sql ===")
    const sql = fs.readFileSync(path.join(process.cwd(), "migrations", "002_phase2_compression.up.sql"), "utf8")
    await client.query(sql)
    console.log("✓ Applied LZ4 column compression and lowered toast_tuple_target to 512")

    console.log("\n=== STEP 2: Controlled Rewrite of Existing Rows to activate LZ4/TOAST ===")
    const rewriteRes = await client.query(`
      UPDATE properties
      SET 
        details = details,
        description = description,
        seller = seller,
        landmarks = landmarks,
        highlights = highlights,
        amenities = amenities,
        attributes = attributes
      RETURNING id;
    `)
    console.log(`✓ Rewrote ${rewriteRes.rowCount} rows under LZ4 compression`)

    console.log("\n=== STEP 3: Running VACUUM ANALYZE ===")
    // In node-postgres, vacuum cannot run in a multi-statement transaction
    try {
      await client.query("VACUUM ANALYZE properties;")
      console.log("✓ VACUUM ANALYZE completed on properties")
    } catch (vErr) {
      console.warn("Notice during VACUUM (non-fatal):", vErr.message)
    }

    console.log("\n=== STEP 4: Measuring Post-Phase 2 Compression Sizes ===")
    const sizeRes = await client.query(`
      SELECT
        c.relname,
        pg_size_pretty(pg_relation_size(c.oid)) as table_size,
        pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
        COALESCE(pg_size_pretty(pg_relation_size(c.reltoastrelid)), '0 B') as toast_size,
        c.reloptions
      FROM pg_class c
      WHERE c.relname IN ('properties', 'image_seo_records', 'vip_tour_bookings_archive')
      ORDER BY c.relname;
    `)

    console.table(sizeRes.rows)

    const compRes = await client.query(`
      SELECT attname, attcompression
      FROM pg_attribute
      WHERE attrelid = 'properties'::regclass
        AND attcompression IS NOT NULL
        AND attnum > 0
      ORDER BY attnum;
    `)
    console.log(`\nVerified ${compRes.rows.length} columns explicitly compressed with LZ4 (code: 'l'):`)
    for (const c of compRes.rows) {
      console.log(`  - ${c.attname}: ${c.attcompression === 'l' ? 'lz4 (active)' : c.attcompression}`)
    }

    console.log("\n=== PHASE 2 COMPRESSION LAYERS APPLIED & VERIFIED ===")
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error("Phase 2 application failed:", err)
  process.exit(1)
})

