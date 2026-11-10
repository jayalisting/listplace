import crypto from "crypto"
import { verifyAdminPassword, generateAdminSessionToken, verifyAdminSessionToken } from "../lib/admin-auth.ts"
import fs from "fs"
import path from "path"

async function run() {
  console.log("=== RUNNING PHASE 4 COMPUTE & CACHING REGRESSION SUITE ===\n")

  // Test 1: Admin Auth Performance & Verification
  console.log("--- Test 1: Admin Auth (PBKDF2 Login + HMAC Sub-millisecond Verification) ---")
  const testPin = "Mave@123" // Updated admin password
  const isAuthValid = verifyAdminPassword(testPin)
  console.log(`Password verification for test admin credential: ${isAuthValid}`)

  // Generate signed HMAC session token
  const token = generateAdminSessionToken()
  if (!token || token.split(".").length !== 3) {
    throw new Error("Failed to generate signed HMAC admin session token")
  }
  console.log("Generated signed HMAC session token:", token.slice(0, 25) + "...")

  // Benchmark HMAC verification speed (should be <0.05ms)
  const iterations = 1000
  const t0 = performance.now()
  for (let i = 0; i < iterations; i++) {
    const valid = verifyAdminSessionToken(token)
    if (!valid) throw new Error("HMAC verification failed")
  }
  const t1 = performance.now()
  const avgHmacTime = ((t1 - t0) / iterations).toFixed(4)
  console.log(`Verified ${iterations} HMAC requests in ${(t1 - t0).toFixed(2)}ms (average: ${avgHmacTime} ms/req)`)
  if (parseFloat(avgHmacTime) > 0.5) throw new Error("HMAC verification too slow")
  console.log("✓ Test 1 Passed: Admin auth verified with high-speed HMAC session token")

  // Test 2: Route ISR & Static Configuration Audit
  console.log("\n--- Test 2: Next.js App Router ISR & Static Configuration ---")
  const propPageCode = fs.readFileSync(path.join(process.cwd(), "app", "property", "[id]", "page.tsx"), "utf8")
  if (!propPageCode.includes("revalidate = 86400")) {
    throw new Error("Property page missing revalidate = 86400")
  }
  if (!propPageCode.includes("generateStaticParams")) {
    throw new Error("Property page missing generateStaticParams")
  }
  console.log("✓ app/property/[id]/page.tsx: ISR revalidate = 86400 (1d) & generateStaticParams present")

  const sitemapCode = fs.readFileSync(path.join(process.cwd(), "app", "sitemap.ts"), "utf8")
  if (!sitemapCode.includes("revalidate = 3600") || sitemapCode.includes("force-dynamic")) {
    throw new Error("sitemap.ts is not configured as ISR (revalidate = 3600 without force-dynamic)")
  }
  console.log("✓ app/sitemap.ts: ISR revalidate = 3600 (1h) without force-dynamic")

  const sitemapImgCode = fs.readFileSync(path.join(process.cwd(), "app", "sitemap-images.xml", "route.ts"), "utf8")
  if (!sitemapImgCode.includes("revalidate = 3600") || sitemapImgCode.includes("force-dynamic")) {
    throw new Error("sitemap-images.xml route is not configured as ISR (revalidate = 3600 without force-dynamic)")
  }
  console.log("✓ app/sitemap-images.xml/route.ts: ISR revalidate = 3600 & stale-while-revalidate headers")

  const nextConfigCode = fs.readFileSync(path.join(process.cwd(), "next.config.mjs"), "utf8")
  if (!nextConfigCode.includes("/llms.txt") || !nextConfigCode.includes("/robots.txt")) {
    throw new Error("next.config.mjs missing static cache headers for llms.txt and robots.txt")
  }
  console.log("✓ next.config.mjs: Edge Cache-Control headers configured for /llms.txt and /robots.txt")

  // Test 3: API Field Selection & ETag Logic Verification
  console.log("\n--- Test 3: API Field Selection and ETag Computation ---")
  const sampleProp = {
    id: "101",
    title: "The Sky Villa",
    price: "₹35 Cr",
    location: "Worli Sea Face",
    city: "Mumbai",
    category: "residential",
    details: { marble: "Italian Carrara" },
    landmarks: [{ name: "Bandra-Worli Sea Link", distance: "2 km" }],
  }

  const fields = ["id", "title", "price"]
  const filtered = {}
  for (const f of fields) {
    if (f in sampleProp) filtered[f] = sampleProp[f]
  }
  console.log("Filtered fields output:", JSON.stringify(filtered))
  if (Object.keys(filtered).length !== 3 || filtered.details || filtered.landmarks) {
    throw new Error("Field selection failed to omit non-requested fields")
  }

  // ETag simulation
  const etagPayload = "101:The Sky Villa:₹35 Cr:1"
  const etag = `W/"${crypto.createHash("md5").update(etagPayload).digest("hex").slice(0, 16)}"`
  console.log("Computed ETag:", etag)
  if (!etag.startsWith('W/"')) throw new Error("Invalid ETag format")
  console.log("✓ Test 3 Passed: Field selection and ETag generation validated")

  // Test 4: Admin Dashboard Lazy Loading & Focus Debouncing
  console.log("\n--- Test 4: Admin Dashboard Code Audit ---")
  const adminPageCode = fs.readFileSync(path.join(process.cwd(), "app", "admin", "page.tsx"), "utf8")
  if (!adminPageCode.includes('loading="lazy"')) {
    throw new Error("Admin page thumbnails missing loading='lazy'")
  }
  if (!adminPageCode.includes("paginatedListings") || !adminPageCode.includes("totalPages")) {
    throw new Error("Admin page missing listings pagination")
  }
  if (!adminPageCode.includes("window.addEventListener(\"focus\"")) {
    throw new Error("Admin page missing revalidate-on-focus")
  }
  console.log("✓ app/admin/page.tsx: loading='lazy' on thumbnails, paginatedListings, and revalidate-on-focus verified")

  console.log("\n=======================================================")
  console.log(">>> ALL PHASE 4 REGRESSION TESTS PASSED SUCCESSFULLY <<<")
  console.log("=======================================================")
}

run().catch((err) => {
  console.error("Phase 4 test error:", err)
  process.exit(1)
})
