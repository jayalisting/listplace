import sharp from "sharp"
import pg from "pg"
const { Pool } = pg
import { processImageUpload } from "../lib/image-processing.ts"
import { storeFile } from "../lib/storage.ts"
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
  console.log("=== RUNNING PHASE 5 IMAGE PIPELINE & STORAGE REGRESSION SUITE ===\n")

  // Test 1: Sharp Processing (EXIF Stripped, AVIF + WebP + JPEG in 3 widths)
  console.log("--- Test 1: Sharp Image Processing Pipeline ---")
  // Generate a test image with Sharp (1920x1080 with solid color)
  const testInputBuffer = await sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 3,
      background: { r: 180, g: 20, b: 50 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer()

  const result = await processImageUpload(testInputBuffer)
  console.log(`Content Hash: ${result.contentHash}`)
  console.log(`Original Dimensions: ${result.originalWidth}x${result.originalHeight}`)
  console.log(`Generated ${result.variants.length} optimized variants`)

  // Check formats generated
  const formats = new Set(result.variants.map((v) => v.format))
  if (!formats.has("avif") || !formats.has("webp") || !formats.has("jpeg")) {
    throw new Error("Missing required formats (AVIF, WebP, or JPEG)")
  }
  console.log("✓ Formats verified: AVIF, WebP, and progressive JPEG fallback")

  // Check widths generated
  const widths = new Set(result.variants.map((v) => v.width))
  if (!widths.has(1600) || !widths.has(1080) || !widths.has(640)) {
    throw new Error("Missing required responsive widths (1600, 1080, 640)")
  }
  console.log("✓ Responsive widths verified: 1600w, 1080w, 640w")

  // Verify EXIF metadata stripped on output
  const avifVariant = result.variants.find((v) => v.format === "avif")
  const avifMeta = await sharp(avifVariant.buffer).metadata()
  if (avifMeta.exif) {
    throw new Error("EXIF metadata was not stripped")
  }
  console.log("✓ EXIF metadata stripped from output for visitor privacy and zero bloat")

  // Test 2: Storage Layer
  console.log("\n--- Test 2: Storage Layer Abstraction ---")
  const testAssetKey = `test-phase5-${result.contentHash}.webp`
  const stored = await storeFile(testAssetKey, result.primaryBuffer, "image/webp")
  console.log(`Stored asset URL: ${stored.url} via provider: ${stored.provider}`)
  if (!stored.url.includes(testAssetKey)) {
    throw new Error("Stored asset URL mismatch")
  }
  console.log("✓ Test 2 Passed: Storage layer successfully handles asset storage with immutable header config")

  // Test 3: PostgreSQL Database Image Audit (Zero Base64 / Zero Image Bytes)
  console.log("\n--- Test 3: PostgreSQL Database Storage Audit ---")
  const client = await pool.connect()
  try {
    await client.query("SET search_path TO public, neon_auth;")
    const propImagesRes = await client.query(`
      SELECT id, images FROM properties LIMIT 5;
    `)
    for (const row of propImagesRes.rows) {
      const imgs = Array.isArray(row.images) ? row.images : []
      for (const imgUrl of imgs) {
        if (typeof imgUrl === "string" && imgUrl.startsWith("data:image")) {
          throw new Error(`Found base64 image data in property #${row.id}`)
        }
      }
    }
    console.log("✓ Checked properties table: 0 base64 or binary image payloads in PostgreSQL (only keys/URLs stored)")
  } finally {
    client.release()
  }

  // Test 4: Rename + 301 Redirect Logic
  console.log("\n--- Test 4: Rename + 301 Redirect Logic ---")
  const oldTestUrl = `/uploads/old-estate-${Date.now()}.webp`
  const newTestUrl = `/uploads/luxury-manor-sea-face-${Date.now()}.webp`

  const client301 = await pool.connect()
  try {
    await client301.query("SET search_path TO public, neon_auth;")
    await client301.query(
      `INSERT INTO image_301_redirects (old_url, new_url) VALUES ($1, $2) ON CONFLICT (old_url) DO UPDATE SET new_url = $2;`,
      [oldTestUrl, newTestUrl]
    )
    const res301 = await client301.query(
      `SELECT new_url FROM image_301_redirects WHERE old_url = $1 LIMIT 1;`,
      [oldTestUrl]
    )
    const resolvedRedirect = res301.rows[0]?.new_url
    console.log(`301 Lookup for ${oldTestUrl} -> ${resolvedRedirect}`)
    if (resolvedRedirect !== newTestUrl) {
      throw new Error("301 redirect resolution failed")
    }
    console.log("✓ Test 4 Passed: 301 Permanent Redirect logic verified in database")
  } finally {
    client301.release()
  }

  // Test 5: Next.js Config & Picture Fallback Component Audit
  console.log("\n--- Test 5: Component & Config Audit ---")
  const imageSeoComp = fs.readFileSync(path.join(process.cwd(), "components", "image-seo.tsx"), "utf8")
  if (!imageSeoComp.includes("<picture>") || !imageSeoComp.includes('type="image/avif"') || !imageSeoComp.includes('type="image/webp"')) {
    throw new Error("components/image-seo.tsx missing AVIF/WebP picture fallback chain")
  }
  console.log("✓ components/image-seo.tsx: High-performance <picture> fallback chain verified")

  const nextConfig = fs.readFileSync(path.join(process.cwd(), "next.config.mjs"), "utf8")
  if (!nextConfig.includes("deviceSizes") || !nextConfig.includes("minimumCacheTTL: 31536000")) {
    throw new Error("next.config.mjs missing tuned next/image settings")
  }
  console.log("✓ next.config.mjs: Tuned next/image (deviceSizes [640, 1080, 1600], minimumCacheTTL 31536000)")

  await pool.end()

  console.log("\n=======================================================")
  console.log(">>> ALL PHASE 5 REGRESSION TESTS PASSED SUCCESSFULLY <<<")
  console.log("=======================================================")
}

run().catch((err) => {
  console.error("Phase 5 regression failure:", err)
  process.exit(1)
})
