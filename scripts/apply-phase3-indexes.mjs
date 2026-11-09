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
    console.log("=== STEP 1: Applying 003_phase3_query_efficiency.up.sql ===")
    const sql = fs.readFileSync(path.join(process.cwd(), "migrations", "003_phase3_query_efficiency.up.sql"), "utf8")
    await client.query(sql)
    console.log("✓ Created covering partial indexes idx_properties_public_category_cover and idx_properties_sitemap")

    console.log("\n=== STEP 2: Verifying Index Definitions in Postgres Catalog ===")
    const idxRes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'properties'
        AND indexname IN ('idx_properties_public_category_cover', 'idx_properties_sitemap');
    `)
    console.table(idxRes.rows)

    console.log("\n=== STEP 3: EXPLAIN ANALYZE on Category Query ===")
    const explainRes = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, title, price, price_numeric, location, city, images, bedrooms, bathrooms, area, status, listing_type, rating, reviews, is_new, is_exclusive, is_trophy, lat, lng
      FROM properties
      WHERE (visibility IS NULL OR visibility != 'private')
        AND category = 'residential'
      ORDER BY featured_home DESC, display_order ASC, id DESC
      LIMIT 12;
    `)
    console.log(explainRes.rows.map(r => r["QUERY PLAN"]).join("\n"))

    console.log("\n=== STEP 4: EXPLAIN ANALYZE on Sitemap Query ===")
    const sitemapExplain = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, updated_at, created_at
      FROM properties
      WHERE (visibility IS NULL OR visibility = 'public' OR visibility = 'published')
      ORDER BY updated_at DESC;
    `)
    console.log(sitemapExplain.rows.map(r => r["QUERY PLAN"]).join("\n"))

  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error("Phase 3 index application failed:", err)
  process.exit(1)
})

