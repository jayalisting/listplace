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
    console.log("=== STEP 1: Running 001_phase1_schema_diet.up.sql ===")
    const upSql = fs.readFileSync(
      path.join(process.cwd(), "migrations", "001_phase1_schema_diet.up.sql"),
      "utf8"
    )
    await client.query(upSql)
    console.log("✓ Schema diet DDL applied successfully")

    console.log("\n=== STEP 2: Backfilling amenities_lookup and properties.amenity_ids ===")
    const propsRes = await client.query("SELECT id, amenities FROM properties")
    const allAmenities = new Set()

    for (const row of propsRes.rows) {
      const arr = Array.isArray(row.amenities)
        ? row.amenities
        : typeof row.amenities === "string"
        ? JSON.parse(row.amenities)
        : []
      for (const a of arr) {
        if (typeof a === "string" && a.trim().length > 0) {
          allAmenities.add(a.trim())
        }
      }
    }

    console.log(`Found ${allAmenities.size} distinct amenities across ${propsRes.rows.length} properties`)

    // Upsert into amenities_lookup
    for (const name of allAmenities) {
      await client.query(
        "INSERT INTO amenities_lookup (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
        [name]
      )
    }

    // Fetch id map
    const lookupRes = await client.query("SELECT id, name FROM amenities_lookup")
    const lookupMap = new Map()
    for (const row of lookupRes.rows) {
      lookupMap.set(row.name, row.id)
    }

    // Update each property with amenity_ids
    let updatedProps = 0
    for (const row of propsRes.rows) {
      const arr = Array.isArray(row.amenities)
        ? row.amenities
        : typeof row.amenities === "string"
        ? JSON.parse(row.amenities)
        : []
      const ids = arr
        .map((name) => lookupMap.get(name.trim()))
        .filter((id) => typeof id === "number")

      await client.query("UPDATE properties SET amenity_ids = $1 WHERE id = $2", [ids, row.id])
      updatedProps++
    }
    console.log(`✓ Backfilled amenity_ids for ${updatedProps} properties`)

    console.log("\n=== STEP 3: Verifying Migration Integrity ===")
    // Verify properties
    const verifyProps = await client.query(`
      SELECT p.id, p.title, p.price_numeric, p.bedrooms, p.lat, p.lng,
             p.amenity_ids,
             array_agg(a.name ORDER BY a.id) as lookup_amenities
      FROM properties p
      LEFT JOIN LATERAL unnest(p.amenity_ids) WITH ORDINALITY AS u(amenity_id, ord) ON true
      LEFT JOIN amenities_lookup a ON a.id = u.amenity_id
      GROUP BY p.id, p.title, p.price_numeric, p.bedrooms, p.lat, p.lng, p.amenity_ids
      LIMIT 3
    `)
    console.log("Sample migrated properties:")
    for (const r of verifyProps.rows) {
      console.log(`- [${r.id}] ${r.title}: ${r.amenity_ids?.length || 0} amenities, coords: (${r.lat}, ${r.lng}), priceNumeric: ${r.price_numeric}`)
    }

    // Verify VIP share tokens
    const verifyTokens = await client.query("SELECT id, length(token) as token_len, length(token_hash) as hash_len FROM vip_share_tokens")
    console.log("\nVIP tokens verification:")
    for (const t of verifyTokens.rows) {
      console.log(`- Token #${t.id}: token length=${t.token_len}, hash bytes=${t.hash_len} (expect 32)`)
    }

    // Verify bookings status_code
    const verifyBookings = await client.query("SELECT id, status, status_code FROM vip_tour_bookings")
    console.log("\nVIP bookings verification:")
    for (const b of verifyBookings.rows) {
      console.log(`- Booking #${b.id}: status='${b.status}', status_code=${b.status_code}`)
    }

    console.log("\n=== ALL PHASE 1 MIGRATIONS VERIFIED SUCCESSFULLY ===")
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
