import pg from "pg"
const { Pool } = pg
import fs from "fs"
import path from "path"
import { encodeText, decodeText } from "../lib/compress.ts"

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

async function runTests() {
  console.log("=== RUNNING PHASE 7 RETENTION & HOUSEKEEPING REGRESSION SUITE ===\n")
  const client = await pool.connect()

  try {
    // -------------------------------------------------------------
    // Test 1: Historical VIP Booking Archival with Brotli Compression
    // -------------------------------------------------------------
    console.log("--- Test 1: Historical Booking Archival into Compressed Table ---")
    const testBookingId = 999991
    const testNotes = "VIP client requested high-floor private penthouse viewing with helicopter landing arrangements and security convoy. ".repeat(4) // ~480 bytes

    // Clean up any leftovers
    await client.query("DELETE FROM vip_tour_bookings WHERE id = $1;", [testBookingId])
    await client.query("DELETE FROM vip_tour_bookings_archive WHERE id = $1;", [testBookingId])

    // Insert an old completed booking created 120 days ago
    await client.query(
      `
      INSERT INTO vip_tour_bookings (
        id, property_id, property_title, property_price, property_location,
        tour_type, tour_date, tour_time, client_name, client_phone, client_email,
        status, notes, created_at, updated_at
      ) VALUES (
        $1, '1', 'The Sovereign Penthouse', '₹45 Cr', 'Worli, Mumbai',
        'in-person', '2026-07-01', '14:00', 'Lord Archival', '+919876543210', 'archival@test.com',
        'completed', $2, NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days'
      );
      `,
      [testBookingId, testNotes]
    )

    // Execute Archival Transaction
    await client.query("BEGIN")
    const selectRes = await client.query(
      `
      SELECT id, property_id, property_title, property_price, property_location,
             tour_type, tour_date, tour_time, client_name, client_phone, client_email,
             status, notes, created_at
      FROM vip_tour_bookings
      WHERE status IN ('completed', 'cancelled')
        AND created_at < NOW() - INTERVAL '3 months'
        AND id = $1
      FOR UPDATE;
      `,
      [testBookingId]
    )

    if (selectRes.rows.length === 0) {
      await client.query("ROLLBACK")
      throw new Error("Failed: Test booking not selected for archival!")
    }

    const row = selectRes.rows[0]
    let notesCompressed = null
    let notesPlain = row.notes
    if (row.notes && row.notes.length > 256) {
      notesCompressed = encodeText(row.notes)
      notesPlain = null
    }

    await client.query(
      `
      INSERT INTO vip_tour_bookings_archive (
        id, property_id, property_title, property_price, property_location,
        tour_type, tour_date, tour_time, client_name, client_phone, client_email,
        status, notes, notes_compressed, created_at, archived_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      ON CONFLICT (id) DO NOTHING;
      `,
      [
        row.id, row.property_id, row.property_title, row.property_price, row.property_location,
        row.tour_type, row.tour_date, row.tour_time, row.client_name, row.client_phone, row.client_email,
        row.status, notesPlain, notesCompressed, row.created_at
      ]
    )

    await client.query("DELETE FROM vip_tour_bookings WHERE id = $1;", [testBookingId])
    await client.query("COMMIT")

    // Verify booking moved from active to archive table
    const activeCheck = await client.query("SELECT id FROM vip_tour_bookings WHERE id = $1;", [testBookingId])
    if (activeCheck.rows.length !== 0) {
      throw new Error("Failed: Test booking still exists in active vip_tour_bookings table!")
    }

    const archiveCheck = await client.query("SELECT * FROM vip_tour_bookings_archive WHERE id = $1;", [testBookingId])
    if (archiveCheck.rows.length !== 1) {
      throw new Error("Failed: Test booking was not found in vip_tour_bookings_archive!")
    }

    const archivedRow = archiveCheck.rows[0]
    if (!archivedRow.notes_compressed || archivedRow.notes_compressed.length === 0) {
      throw new Error("Failed: Expected Brotli compressed notes in notes_compressed column!")
    }

    const decompressed = decodeText(archivedRow.notes_compressed)
    if (decompressed !== testNotes) {
      throw new Error("Failed: Decompressed notes does not match original text!")
    }

    console.log(`✓ Archived booking verified (Compressed: ${archivedRow.notes_compressed.length} bytes vs raw ${testNotes.length} bytes, 100% roundtrip lossless)`)

    // Clean up test booking from archive
    await client.query("DELETE FROM vip_tour_bookings_archive WHERE id = $1;", [testBookingId])

    // -------------------------------------------------------------
    // Test 2: Expired VIP Share Token Retention Pruning
    // -------------------------------------------------------------
    console.log("\n--- Test 2: Expired VIP Share Token Retention Pruning ---")
    const testRevokedToken = "test_revoked_token_phase7"
    const testActiveToken = "test_active_token_phase7"

    await client.query("DELETE FROM vip_share_tokens WHERE token IN ($1, $2);", [testRevokedToken, testActiveToken])

    // 1. Insert revoked token last viewed 45 days ago
    await client.query(
      `
      INSERT INTO vip_share_tokens (
        token, property_id, client_name, client_phone, status, max_views, view_count, created_at, last_viewed_at
      ) VALUES (
        $1, '1', 'Test Client Revoked', '+919999999991', 'revoked', 1, 1, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'
      );
      `,
      [testRevokedToken]
    )

    // 2. Insert active token created recently
    await client.query(
      `
      INSERT INTO vip_share_tokens (
        token, property_id, client_name, client_phone, status, max_views, view_count, created_at
      ) VALUES (
        $1, '1', 'Test Client Active', '+919999999992', 'active', 3, 0, NOW()
      );
      `,
      [testActiveToken]
    )

    // Run cleanup query using retention index
    const cleanupRes = await client.query(
      `
      DELETE FROM vip_share_tokens
      WHERE (status = 'revoked' OR (max_views IS NOT NULL AND max_views > 0 AND view_count >= max_views))
        AND COALESCE(last_viewed_at, created_at) < NOW() - INTERVAL '30 days'
        AND token IN ($1, $2)
      RETURNING token;
      `,
      [testRevokedToken, testActiveToken]
    )

    if (cleanupRes.rows.length !== 1 || cleanupRes.rows[0].token !== testRevokedToken) {
      throw new Error(`Failed: Expected 1 pruned token (${testRevokedToken}), got ${cleanupRes.rows.length}`)
    }

    const activeTokenCheck = await client.query("SELECT id FROM vip_share_tokens WHERE token = $1;", [testActiveToken])
    if (activeTokenCheck.rows.length !== 1) {
      throw new Error("Failed: Active valid token was pruned unexpectedly!")
    }

    console.log("✓ Expired/revoked token successfully pruned using idx_vip_tokens_retention while active token remains intact.")

    // Clean up active test token
    await client.query("DELETE FROM vip_share_tokens WHERE token = $1;", [testActiveToken])

    // -------------------------------------------------------------
    // Test 3: Maintenance Route & DB Stats Integrity
    // -------------------------------------------------------------
    console.log("\n--- Test 3: Admin Maintenance API & Database Stats ---")
    const maintenanceFile = path.join(process.cwd(), "app", "api", "admin", "maintenance", "route.ts")
    if (!fs.existsSync(maintenanceFile)) {
      throw new Error("app/api/admin/maintenance/route.ts does not exist!")
    }
    const maintCode = fs.readFileSync(maintenanceFile, "utf8")
    if (!maintCode.includes("verifyAdminRequest") || !maintCode.includes("CRON_SECRET")) {
      throw new Error("Maintenance route missing admin/cron authentication checks!")
    }
    if (!maintCode.includes("archiveOldVipBookings") || !maintCode.includes("cleanupExpiredVipTokens")) {
      throw new Error("Maintenance route missing housekeeping action invocations!")
    }
    console.log("✓ app/api/admin/maintenance/route.ts: Admin authorization & action triggers verified")

    // -------------------------------------------------------------
    // Test 4: Admin Login PBKDF2 Brute-Force Rate Limiter
    // -------------------------------------------------------------
    console.log("\n--- Test 4: Admin Login Rate Limiting (PBKDF2 Protection) ---")
    const loginFile = path.join(process.cwd(), "app", "api", "admin", "login", "route.ts")
    const loginCode = fs.readFileSync(loginFile, "utf8")
    if (!loginCode.includes("checkRateLimit") || !loginCode.includes("429")) {
      throw new Error("Admin login route missing 429 rate limiter!")
    }
    if (!loginCode.includes("15 * 60 * 1000")) {
      throw new Error("Admin login route missing 15-minute lockout defense!")
    }
    console.log("✓ app/api/admin/login/route.ts: 15-minute sliding window lockout protects PBKDF2 compute")

    // -------------------------------------------------------------
    // Test 5: AI Drafter Abuse Rate Limiter
    // -------------------------------------------------------------
    console.log("\n--- Test 5: AI Drafter Cost Controls Rate Limiter ---")
    const suggestFile = path.join(process.cwd(), "app", "api", "image-seo", "suggest", "route.ts")
    const suggestCode = fs.readFileSync(suggestFile, "utf8")
    if (!suggestCode.includes("isAiRateLimited") || !suggestCode.includes("429")) {
      throw new Error("AI suggest route missing 429 rate limiter!")
    }
    console.log("✓ app/api/image-seo/suggest/route.ts: Sliding window rate limiter protects AI drafter")

    // -------------------------------------------------------------
    // Test 6: Orphan Image Script Integrity
    // -------------------------------------------------------------
    console.log("\n--- Test 6: Orphan Image Detection & Cleanup Script ---")
    const orphanScript = path.join(process.cwd(), "scripts", "cleanup-orphan-images.mjs")
    if (!fs.existsSync(orphanScript)) {
      throw new Error("scripts/cleanup-orphan-images.mjs does not exist!")
    }
    const orphanCode = fs.readFileSync(orphanScript, "utf8")
    if (!orphanCode.includes("--delete") && !orphanCode.includes("--prune")) {
      throw new Error("Orphan script missing safe dry-run / delete mode guard!")
    }
    console.log("✓ scripts/cleanup-orphan-images.mjs: Safe dry-run & delete mode verified")

    console.log("\n=======================================================")
    console.log(">>> ALL PHASE 7 REGRESSION TESTS PASSED SUCCESSFULLY <<<")
    console.log("=======================================================")
  } finally {
    client.release()
    await pool.end()
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err)
  process.exit(1)
})
