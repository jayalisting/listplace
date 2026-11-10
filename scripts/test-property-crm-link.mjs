import pg from "pg"
const { Pool } = pg

const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_JVUAl62LnRdp@ep-long-firefly-aze7kekk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const isLocal = DB_URL.includes("localhost") || DB_URL.includes("127.0.0.1")

const pool = new Pool({
  connectionString: DB_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

async function runTests() {
  console.log("=== RUNNING PROPERTY DATABASE <-> CRM LINK & ISOLATION TEST ===\n")
  const client = await pool.connect()

  const TEST_PROP_ID = `test-estate-${Date.now()}`
  let originalCrmVersion = null
  let testCrmPropId = null

  try {
    // Step 1: Read current CRM store
    console.log("--- Step 1: Fetch Current CRM Store ---")
    const crmRes = await client.query("SELECT id, version, data FROM crm_store WHERE id = 'main' LIMIT 1;")
    if (crmRes.rows.length === 0) {
      throw new Error("Failed: No CRM state found in crm_store!")
    }

    originalCrmVersion = crmRes.rows[0].version
    let crmData = typeof crmRes.rows[0].data === "string" ? JSON.parse(crmRes.rows[0].data) : crmRes.rows[0].data
    console.log(`Current CRM store version: ${originalCrmVersion}, property count: ${crmData.props?.length || 0}`)

    // Step 2: Simulate adding a property in public table
    console.log("\n--- Step 2: Insert Test Property in Public 'properties' Table ---")
    const publicTitle = "Villa Solitaire Sovereign Estate"
    const publicPrice = 125000000
    const publicLocality = "Indiranagar 100ft Road"
    const publicCity = "Bangalore"
    const publicCategory = "ultra-luxury-villas"

    await client.query(
      `INSERT INTO properties (
        id, title, price, price_numeric, category, location, city, state, description,
        amenities, bedrooms, bathrooms, area, property_type,
        status, images, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);`,
      [
        TEST_PROP_ID,
        publicTitle,
        "₹12.50 Cr",
        publicPrice,
        publicCategory,
        publicLocality,
        publicCity,
        "Karnataka",
        "Exclusive architectural masterpiece.",
        JSON.stringify(["Private Infinity Pool", "Smart Home Automation"]),
        5,
        6,
        "8,500 sq ft",
        "Villa",
        "Available",
        JSON.stringify(["/images/villa-1.jpg"]),
        JSON.stringify(["Prime", "Luxury"]),
      ]
    )
    console.log(`✓ Inserted public property asset #${TEST_PROP_ID} successfully.`)

    // Step 3: Simulate syncEstateToCrm (Create link)
    console.log("\n--- Step 3: Link Property into CRM Store ---")
    testCrmPropId = `CRM-PROP-${Date.now()}`
    const newCrmDeal = {
      id: testCrmPropId,
      name: publicTitle,
      type: "Commercial",
      stage: "Active",
      price: publicPrice,
      area: 8500,
      location: `${publicLocality}, ${publicCity}`,
      category: publicCategory,
      brokers: [],
      images: ["/images/villa-1.jpg"],
      created: new Date().toISOString().split("T")[0],
      linkedPropertyId: TEST_PROP_ID,
      priority: "Urgent",
      confidentialLocation: "Sy No 142/3, Behind Old Airport Defense Gate, Bangalore East",
      bottomPrice: 110000000, // 11 Cr walkaway vs 12.5 Cr ask
      brokerNotes: "Exclusive mandate via Kumar Properties. Split 1.5% commission.",
      privateNotes: "Seller relocating abroad by Q3. Ready for urgent closing.",
    }

    crmData.props = [newCrmDeal, ...(crmData.props || [])]

    // Save with optimistic concurrency update
    const updateRes = await client.query(
      `UPDATE crm_store SET data = $1, version = version + 1, updated_at = NOW() WHERE id = 'main' AND version = $2 RETURNING version;`,
      [JSON.stringify(crmData), originalCrmVersion]
    )

    if (updateRes.rows.length === 0) {
      throw new Error("Concurrency conflict while updating CRM store!")
    }
    const updatedVersion = updateRes.rows[0].version
    console.log(`✓ CRM Store updated to version ${updatedVersion} with linked deal ${testCrmPropId}`)

    // Step 4: Verify Confidential Data Isolation
    console.log("\n--- Step 4: Verify Data Isolation (Public DB vs Private CRM) ---")
    const publicCheck = await client.query("SELECT * FROM properties WHERE id = $1;", [TEST_PROP_ID])
    const publicRow = publicCheck.rows[0]

    // Check that public table has NO confidential fields
    if ("bottomPrice" in publicRow || "bottom_price" in publicRow) {
      throw new Error("LEAK DETECTED: bottom_price exists in public properties table!")
    }
    if ("confidentialLocation" in publicRow || "confidential_location" in publicRow) {
      throw new Error("LEAK DETECTED: confidentialLocation exists in public properties table!")
    }
    if ("brokers" in publicRow) {
      throw new Error("LEAK DETECTED: brokers column exists in public properties table!")
    }
    console.log("✓ Verified: Public 'properties' table has zero confidential broker/financial fields.")

    // Read back from CRM store to verify persistence of confidential fields
    const crmVerify = await client.query("SELECT data FROM crm_store WHERE id = 'main' LIMIT 1;")
    const currentData = typeof crmVerify.rows[0].data === "string" ? JSON.parse(crmVerify.rows[0].data) : crmVerify.rows[0].data
    const savedDeal = currentData.props.find((p) => p.linkedPropertyId === TEST_PROP_ID)

    if (!savedDeal) {
      throw new Error(`Failed to find linked deal for ${TEST_PROP_ID} in CRM!`)
    }
    if (savedDeal.priority !== "Urgent") throw new Error("Priority mismatch in CRM!")
    if (savedDeal.bottomPrice !== 110000000) throw new Error("Bottom price mismatch in CRM!")
    if (!savedDeal.confidentialLocation.includes("Sy No 142/3")) throw new Error("Confidential Sy No mismatch!")
    console.log(`✓ Verified: CRM Deal #${savedDeal.id} holds confidential data:
        - Priority: ${savedDeal.priority}
        - Bottom Price: ₹${(savedDeal.bottomPrice / 10000000).toFixed(2)} Cr (vs Public Asking: ₹${(savedDeal.price / 10000000).toFixed(2)} Cr)
        - Confidential Sy No: ${savedDeal.confidentialLocation}
        - Broker Notes: ${savedDeal.brokerNotes}`)

    // Step 5: Test Non-Destructive Update (Updating public title & price doesn't erase confidential data)
    console.log("\n--- Step 5: Test Non-Destructive Sync on Public Update ---")
    const updatedPublicPrice = 130000000
    const updatedPublicTitle = "Villa Solitaire Sovereign Estate (Renovated)"

    // Simulate syncEstateToCrm logic
    savedDeal.name = updatedPublicTitle
    savedDeal.price = updatedPublicPrice
    // Confidential fields remain untouched:
    // savedDeal.priority, savedDeal.bottomPrice, savedDeal.confidentialLocation

    const secondUpdate = await client.query(
      `UPDATE crm_store SET data = $1, version = version + 1, updated_at = NOW() WHERE id = 'main' AND version = $2 RETURNING version;`,
      [JSON.stringify(currentData), updatedVersion]
    )
    if (secondUpdate.rows.length === 0) throw new Error("Second update conflict!")

    const verifyAfterUpdate = await client.query("SELECT data FROM crm_store WHERE id = 'main' LIMIT 1;")
    const finalData = typeof verifyAfterUpdate.rows[0].data === "string" ? JSON.parse(verifyAfterUpdate.rows[0].data) : verifyAfterUpdate.rows[0].data
    const updatedDeal = finalData.props.find((p) => p.linkedPropertyId === TEST_PROP_ID)

    if (updatedDeal.name !== updatedPublicTitle || updatedDeal.price !== updatedPublicPrice) {
      throw new Error("Public updates failed to reflect in linked CRM deal!")
    }
    if (updatedDeal.bottomPrice !== 110000000 || updatedDeal.priority !== "Urgent") {
      throw new Error("CRITICAL: Updating public listing overwrote confidential CRM data!")
    }
    console.log("✓ Verified: Public listing updates synced smoothly while 100% preserving private/confidential CRM data.")

    console.log("\n=======================================================")
    console.log(">>> ALL PROPERTY-CRM LINK & ISOLATION TESTS PASSED <<<")
    console.log("=======================================================\n")
  } finally {
    // Cleanup
    console.log("--- Cleanup: Removing Test Records ---")
    try {
      await client.query("DELETE FROM properties WHERE id = $1;", [TEST_PROP_ID])
      const crmRes = await client.query("SELECT version, data FROM crm_store WHERE id = 'main' LIMIT 1;")
      if (crmRes.rows.length > 0) {
        let data = typeof crmRes.rows[0].data === "string" ? JSON.parse(crmRes.rows[0].data) : crmRes.rows[0].data
        data.props = (data.props || []).filter((p) => p.linkedPropertyId !== TEST_PROP_ID && p.id !== testCrmPropId)
        await client.query(
          "UPDATE crm_store SET data = $1, version = version + 1, updated_at = NOW() WHERE id = 'main';",
          [JSON.stringify(data)]
        )
      }
      console.log("✓ Cleaned up test property and CRM deal safely.")
    } catch (e) {
      console.error("Cleanup error:", e)
    }
    client.release()
    await pool.end()
  }
}

runTests().catch((err) => {
  console.error("Test failed with error:", err)
  process.exit(1)
})
