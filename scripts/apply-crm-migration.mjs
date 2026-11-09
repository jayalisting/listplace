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
    console.log("=== STEP 1: Creating crm_store Table in PostgreSQL ===")
    const sql = fs.readFileSync(path.join(process.cwd(), "migrations", "005_crm_store.up.sql"), "utf8")
    await client.query(sql)
    console.log("✓ crm_store table created with LZ4 compression")

    console.log("\n=== STEP 2: Merging data from jaya CRM/data/db.json & backups ===")
    const dbPath = path.join(process.cwd(), "jaya CRM", "data", "db.json")
    const backupPath = path.join(process.cwd(), "jaya CRM", "data", "backups", "db-2026-11-04.json")

    let currentDb = { people: [], props: [], tasks: [], files: [], trash: [], settings: {} }
    let backupDb = { people: [], props: [], tasks: [], files: [], trash: [], settings: {} }

    if (fs.existsSync(dbPath)) {
      try {
        currentDb = JSON.parse(fs.readFileSync(dbPath, "utf8"))
      } catch (e) {
        console.warn("Could not parse db.json:", e)
      }
    }

    if (fs.existsSync(backupPath)) {
      try {
        backupDb = JSON.parse(fs.readFileSync(backupPath, "utf8"))
      } catch (e) {
        console.warn("Could not parse backup json:", e)
      }
    }

    // Merge properties
    const propsMap = new Map()
    for (const p of backupDb.props || []) propsMap.set(p.id, p)
    for (const p of currentDb.props || []) propsMap.set(p.id, p)
    const mergedProps = Array.from(propsMap.values())

    // Merge people
    const peopleMap = new Map()
    for (const p of backupDb.people || []) peopleMap.set(p.id, p)
    for (const p of currentDb.people || []) peopleMap.set(p.id, p)
    const mergedPeople = Array.from(peopleMap.values())

    // Merge tasks
    const tasksMap = new Map()
    for (const t of backupDb.tasks || []) tasksMap.set(t.id, t)
    for (const t of currentDb.tasks || []) tasksMap.set(t.id, t)
    const mergedTasks = Array.from(tasksMap.values())

    // Merge files
    const filesMap = new Map()
    for (const f of backupDb.files || []) filesMap.set(f.path || f.id, f)
    for (const f of currentDb.files || []) filesMap.set(f.path || f.id, f)

    // Add existing files from PROP-0002 if not present
    const prop2Dir = path.join(process.cwd(), "public", "uploads", "crm", "PROP-0002")
    if (fs.existsSync(prop2Dir)) {
      const p2Files = fs.readdirSync(prop2Dir)
      for (const fName of p2Files) {
        const relPath = `PROP-0002/${fName}`
        if (!filesMap.has(relPath)) {
          const stats = fs.statSync(path.join(prop2Dir, fName))
          filesMap.set(relPath, {
            id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            pid: "PROP-0002",
            name: fName.replace(/^mw\w+-/, ""),
            path: relPath,
            mime: "image/png",
            size: stats.size,
            t: stats.mtimeMs,
          })
        }
      }
    }
    const mergedFiles = Array.from(filesMap.values())

    // Merge settings
    const mergedSettings = {
      followupRules: currentDb.settings?.followupRules || backupDb.settings?.followupRules || {
        "New lead": 7,
        "Collecting info": 7,
        "Documents verified": 7,
        Listed: 14,
        "Site visits": 7,
        Negotiation: 3,
        "Token paid": 5,
        Agreement: 5,
        "Registration pending": 10,
        Sold: 0,
        "On hold": 30,
        Dropped: 30,
      },
      whatsappTemplates: currentDb.settings?.whatsappTemplates || backupDb.settings?.whatsappTemplates || [
        {
          id: "owner-docs",
          name: "Ask owner for docs",
          template: "Hi {{owner}}, please send the required documents for {{property}}.",
        },
        {
          id: "broker-update",
          name: "Ask broker update",
          template: "Hi {{broker}}, any update on {{property}}?",
        },
        {
          id: "share-buyer",
          name: "Share with buyer",
          template: "Hi {{buyer}}, please see {{property}} at {{link}}. Price: {{price}}.",
        },
      ],
      savedViews: currentDb.settings?.savedViews || backupDb.settings?.savedViews || [],
    }

    const mergedData = {
      people: mergedPeople,
      props: mergedProps,
      tasks: mergedTasks,
      files: mergedFiles,
      trash: currentDb.trash || [],
      settings: mergedSettings,
      version: Math.max(currentDb.version || 1, backupDb.version || 1, 7),
    }

    console.log(`Merged Stats:
  - Properties: ${mergedProps.length} (${mergedProps.map((p) => p.name).join(", ")})
  - Tasks: ${mergedTasks.length}
  - People: ${mergedPeople.length}
  - Files: ${mergedFiles.length}
  - Version: ${mergedData.version}`)

    console.log("\n=== STEP 3: Upserting Merged CRM State into PostgreSQL ===")
    await client.query(
      `
      INSERT INTO crm_store (id, data, version, updated_at)
      VALUES ('main', $1, $2, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data,
          version = EXCLUDED.version,
          updated_at = NOW();
      `,
      [JSON.stringify(mergedData), mergedData.version]
    )
    console.log("✓ Merged CRM state successfully stored in PostgreSQL crm_store")

    console.log("\n=== STEP 4: Verifying Data in Database ===")
    const checkRes = await client.query("SELECT id, version, pg_size_pretty(pg_total_relation_size('crm_store')) as table_size FROM crm_store WHERE id = 'main';")
    console.table(checkRes.rows)

    console.log("\n>>> Unified CRM Database Migration Succeeded <<<")
  } catch (err) {
    console.error("Migration error:", err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()

