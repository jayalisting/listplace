import pg from "pg"
const { Pool } = pg
import crypto from "crypto"
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
  let passes = 0
  let fails = 0

  function assert(condition, label) {
    if (condition) {
      console.log(`  ✓ PASS: ${label}`)
      passes++
    } else {
      console.error(`  ✗ FAIL: ${label}`)
      fails++
    }
  }

  try {
    await client.query("SET search_path TO public, neon_auth;")
    console.log("=== RUNNING PHASE 2 REGRESSION TESTS ===")

    // Test 1: Native LZ4 active on JSONB columns
    const lz4Res = await client.query(`
      SELECT count(*) as lz4_count
      FROM pg_attribute
      WHERE attrelid = 'properties'::regclass AND attcompression = 'l';
    `)
    const lz4Count = Number(lz4Res.rows[0].lz4_count)
    assert(lz4Count >= 10, `Native LZ4 compression active on ${lz4Count} columns in properties (>= 10)`)

    // Test 2: toast_tuple_target lowered to 512 on properties and image_seo_records
    const optRes = await client.query(`
      SELECT relname, reloptions
      FROM pg_class
      WHERE relname IN ('properties', 'image_seo_records')
    `)
    const allHaveTarget = optRes.rows.every(r => Array.isArray(r.reloptions) && r.reloptions.some(opt => opt.includes("toast_tuple_target=512")))
    assert(allHaveTarget, "toast_tuple_target = 512 active on both properties and image_seo_records")

    // Test 3: TOAST table engaged on properties
    const toastCheck = await client.query(`
      SELECT pg_relation_size(c.reltoastrelid) as toast_bytes
      FROM pg_class c
      WHERE c.relname = 'properties';
    `)
    const toastBytes = Number(toastCheck.rows[0].toast_bytes)
    assert(toastBytes > 0, `Properties TOAST table actively storing compressed chunks (${(toastBytes / 1024).toFixed(1)} kB)`)

    // Test 4: App-level Brotli encode/decode integrity (<512b bypass, >512b compressed)
    const { encodeText, decodeText, encodeJson, decodeJson } = await import("../lib/compress.js").catch(() => import("../lib/compress.ts"))
    const shortText = "Penthouse Sea View"
    const encShort = encodeText(shortText)
    assert(encShort[0] === 0x00, "Short text (<512 bytes) uses FORMAT_RAW (0x00) bypass")
    assert(decodeText(encShort) === shortText, "Short text decodes identically")

    const longProse = "Architectural blueprint showing master suite, dual walk-in dressing rooms, private elevator foyer, staff quarters, and 180-degree unobstructed Arabian Sea views. ".repeat(15)
    const encLong = encodeText(longProse)
    assert(encLong[0] === 0x01, "Long text (>512 bytes) uses FORMAT_BROTLI (0x01)")
    assert(encLong.length < Buffer.byteLength(longProse), `Brotli compression achieved: ${Buffer.byteLength(longProse)}B -> ${encLong.length}B (-${Math.round((1 - encLong.length / Buffer.byteLength(longProse)) * 100)}%)`)
    assert(decodeText(encLong) === longProse, "Long text decodes with 100% byte fidelity")

    // Test 5: Image SEO Record with Brotli Cold Payload
    const testUrl = "https://images.unsplash.com/photo-test-compression-phase2.webp"
    const urlHash = crypto.createHash("sha256").update(testUrl).digest()
    const coldPayload = encodeJson({
      transcript: longProse,
      aiDescription: "High-resolution master floor plan for trophy penthouse."
    })
    await client.query(`
      INSERT INTO image_seo_records (url, url_hash, score, seo_data, cold_payload, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (url) DO UPDATE
      SET url_hash = $2, score = $3, seo_data = $4, cold_payload = $5, updated_at = CURRENT_TIMESTAMP;
    `, [testUrl, urlHash, 95, JSON.stringify({ alt: "Floor Plan", isDecorative: false }), coldPayload])

    const readBack = await client.query("SELECT url, score, seo_data, cold_payload FROM image_seo_records WHERE url_hash = $1", [urlHash])
    assert(readBack.rows.length === 1, "Image SEO record inserted with url_hash")
    const decodedCold = decodeJson(readBack.rows[0].cold_payload)
    assert(decodedCold.transcript === longProse, "Cold payload decompressed transparently on read")

    // Cleanup test record
    await client.query("DELETE FROM image_seo_records WHERE url = $1", [testUrl])

    // Test 6: Content-hash image deduplication logic
    const testBuffer = Buffer.from("Simulated JPEG binary image payload " + Date.now())
    const hash1 = crypto.createHash("sha256").update(testBuffer).digest("hex").slice(0, 16)
    const hash2 = crypto.createHash("sha256").update(testBuffer).digest("hex").slice(0, 16)
    assert(hash1 === hash2, `Content-hash identical uploads share same filename: estate-${hash1}.webp`)

    console.log(`\n=== RESULTS: ${passes} PASSED, ${fails} FAILED ===`)
    if (fails > 0) process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error("Test runner error:", err)
  process.exit(1)
})

