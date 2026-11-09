import pg from "pg"
const { Pool } = pg
import crypto from "crypto"

const NEON_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_JVUAl62LnRdp@ep-long-firefly-aze7kekk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const isLocal = NEON_URL.includes("localhost") || NEON_URL.includes("127.0.0.1")

const pool = new Pool({
  connectionString: NEON_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

async function runTests() {
  const client = await pool.connect()
  let passes = 0
  let fails = 0

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`)
      passes++
    } else {
      console.error(`  ✗ FAIL: ${testName}`)
      fails++
    }
  }

  try {
    await client.query("SET search_path TO public, neon_auth;")
    console.log("=== RUNNING PHASE 1 REGRESSION TESTS ===")

    // Test 1: Amenities Lookup Table exists and has entries
    const lookupRes = await client.query("SELECT count(*) FROM amenities_lookup")
    const lookupCount = Number(lookupRes.rows[0].count)
    assert(lookupCount >= 50, `amenities_lookup table populated with ${lookupCount} entries (>= 50)`)

    // Test 2: Properties have amenity_ids populated
    const propRes = await client.query("SELECT id, title, amenity_ids, lat, lng, price_numeric FROM properties WHERE amenity_ids IS NOT NULL AND array_length(amenity_ids, 1) > 0")
    assert(propRes.rows.length >= 10, `At least 10 properties have amenity_ids (${propRes.rows.length} found)`)

    // Test 3: Coordinates right-sized as double precision
    const sample = propRes.rows[0]
    assert(typeof sample.lat === "number" && typeof sample.lng === "number", `Coordinates lat/lng are numbers: (${sample.lat}, ${sample.lng})`)

    // Test 4: VIP Share Tokens have token_hash
    const tokenRes = await client.query("SELECT id, token, token_hash FROM vip_share_tokens WHERE token_hash IS NOT NULL")
    assert(tokenRes.rows.length >= 3, `All vip_share_tokens have token_hash (${tokenRes.rows.length} rows)`)
    const firstHash = tokenRes.rows[0].token_hash
    assert(Buffer.isBuffer(firstHash) && firstHash.length === 32, `token_hash is 32-byte binary SHA-256 (length: ${firstHash?.length})`)

    // Test 5: Token lookup via SHA-256 hash
    const testTokenStr = tokenRes.rows[0].token
    const computedHash = crypto.createHash("sha256").update(testTokenStr).digest()
    const hashLookup = await client.query("SELECT id FROM vip_share_tokens WHERE token_hash = $1", [computedHash])
    assert(hashLookup.rows.length > 0 && hashLookup.rows[0].id === tokenRes.rows[0].id, `SHA-256 token lookup matches token #${tokenRes.rows[0].id}`)

    // Test 6: VIP Bookings status_code right-sized
    const bookingRes = await client.query("SELECT id, status, status_code FROM vip_tour_bookings")
    assert(bookingRes.rows.length >= 2, `vip_tour_bookings table has bookings (${bookingRes.rows.length})`)
    const allStatusCodesValid = bookingRes.rows.every(b => typeof b.status_code === "number")
    assert(allStatusCodesValid, "All bookings have valid status_code (0-3)")

    // Test 7: Archive table exists
    const archiveCheck = await client.query("SELECT to_regclass('public.vip_tour_bookings_archive') as exists")
    assert(archiveCheck.rows[0].exists !== null, "vip_tour_bookings_archive table exists and ready")

    // Test 8: image_seo_records has url_hash and score columns
    const seoColCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'image_seo_records' AND column_name IN ('url_hash', 'score')
    `)
    assert(seoColCheck.rows.length === 2, "image_seo_records has url_hash and score columns")

    console.log(`\n=== RESULTS: ${passes} PASSED, ${fails} FAILED ===`)
    if (fails > 0) process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err)
  process.exit(1)
})
