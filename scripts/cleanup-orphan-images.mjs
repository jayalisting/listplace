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

const isDeleteMode = process.argv.includes("--delete") || process.argv.includes("--prune")

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

async function run() {
  const client = await pool.connect()
  try {
    console.log("=== STEP 1: Querying Referenced Media in PostgreSQL ===")
    
    const propRes = await client.query("SELECT id, images, highlights, details, landmarks FROM properties;")
    const seoRes = await client.query("SELECT url FROM image_seo_records;").catch(() => ({ rows: [] }))
    const redirectRes = await client.query("SELECT old_path, new_path FROM image_301_redirects;").catch(() => ({ rows: [] }))

    const referencedFiles = new Set()

    function collectFromValue(val) {
      if (!val) return
      if (typeof val === "string") {
        // Match /uploads/<filename> or URL containing /uploads/
        const match = val.match(/\/uploads\/([^"'\s?#]+)/)
        if (match) {
          const basename = path.basename(match[1])
          referencedFiles.add(basename)
          // Also protect base stems (e.g. content-hash or timestamp prefixes)
          const stem = basename.replace(/\.[^/.]+$/, "")
          referencedFiles.add(stem)
        }
      } else if (Array.isArray(val)) {
        val.forEach(collectFromValue)
      } else if (typeof val === "object") {
        Object.values(val).forEach(collectFromValue)
      }
    }

    for (const row of propRes.rows) {
      collectFromValue(row.images)
      collectFromValue(row.highlights)
      collectFromValue(row.details)
      collectFromValue(row.landmarks)
    }

    for (const row of seoRes.rows) {
      collectFromValue(row.url)
    }

    for (const row of redirectRes.rows) {
      collectFromValue(row.old_path)
      collectFromValue(row.new_path)
    }

    console.log(`✓ Found ${referencedFiles.size} referenced image stems/filenames in database`)

    console.log("\n=== STEP 2: Scanning Local Uploads Directory (public/uploads) ===")
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    if (!fs.existsSync(uploadsDir)) {
      console.log("public/uploads directory does not exist.")
      return
    }

    const filesOnDisk = fs.readdirSync(uploadsDir)
    console.log(`Total files in public/uploads: ${filesOnDisk.length}`)

    const orphanFiles = []
    let totalOrphanBytes = 0

    for (const file of filesOnDisk) {
      if (file.startsWith(".")) continue // Skip .gitkeep or hidden files
      const stem = file.replace(/\.[^/.]+$/, "")

      // Check if exact file or base stem is referenced
      const isReferenced = referencedFiles.has(file) || referencedFiles.has(stem)

      if (!isReferenced) {
        const filePath = path.join(uploadsDir, file)
        const stats = fs.statSync(filePath)
        orphanFiles.push({
          file,
          path: filePath,
          size: stats.size,
          mtime: stats.mtime,
        })
        totalOrphanBytes += stats.size
      }
    }

    console.log(`\n=== STEP 3: Orphan Analysis Result ===`)
    console.log(`Mode: ${isDeleteMode ? "🚨 DELETION ACTIVE (--delete)" : "🛡️  DRY RUN (safe inspection)"}`)
    console.log(`Total Orphan Files: ${orphanFiles.length}`)
    console.log(`Reclaimable Storage: ${formatBytes(totalOrphanBytes)} (${totalOrphanBytes} bytes)`)

    if (orphanFiles.length > 0) {
      console.log("\nOrphan Details:")
      console.table(
        orphanFiles.map((o) => ({
          filename: o.file,
          size: formatBytes(o.size),
          lastModified: o.mtime.toISOString(),
        }))
      )

      if (isDeleteMode) {
        console.log("\nPruning orphan files...")
        for (const orphan of orphanFiles) {
          fs.unlinkSync(orphan.path)
          console.log(`✓ Deleted: ${orphan.file}`)
        }
        console.log(`\n✓ Successfully reclaimed ${formatBytes(totalOrphanBytes)} on local disk!`)
      } else {
        console.log('\nTip: Run "node scripts/cleanup-orphan-images.mjs --delete" to permanently purge these files.')
      }
    } else {
      console.log("✓ No orphan files detected. Storage is 100% clean and optimal!")
    }
  } catch (err) {
    console.error("Cleanup error:", err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
