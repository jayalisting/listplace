import { NextRequest, NextResponse } from "next/server"
import { getCrmStore, saveCrmStore, getDbProperties } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * POST /api/crm/sync
 * Syncs active JayaListing portfolio estates into the CRM pipeline.
 */
export async function POST(req: NextRequest) {
  try {
    const [crmState, { properties }] = await Promise.all([
      getCrmStore(),
      getDbProperties(),
    ])

    const existingNames = new Set(crmState.props.map((p) => p.name.toLowerCase().trim()))
    const newProps = []

    for (const est of properties) {
      const cleanTitle = (est.title || "").trim()
      if (!cleanTitle || existingNames.has(cleanTitle.toLowerCase())) continue

      let crmType = "Villa"
      if (est.category === "residential") crmType = "Villa"
      else if (est.category === "commercial") crmType = "Commercial"
      else if (est.category === "industrial") crmType = "Plot / site"
      else if (est.category === "agriculture") crmType = "Agricultural land"

      const nextIdNum = 1 + Math.max(0, ...crmState.props.map((p) => parseInt(p.id.replace(/\D/g, "") || "0", 10)))
      const newId = `PROP-${String(nextIdNum).padStart(4, "0")}`

      const crmProp = {
        id: newId,
        name: est.title,
        type: crmType,
        status: "Listed",
        village: est.location || est.city || "",
        area: est.area ? est.area.replace(/\D/g, "") : "",
        unit: est.area?.includes("acre") ? "acre" : "sq ft",
        price: est.price_numeric || 0,
        quote: est.price_numeric || 0,
        description: est.tagline || "",
        owners: [],
        brokers: [],
        log: [
          {
            t: Date.now(),
            x: `Imported from JayaListing portfolio (Asset #${est.id})`,
          },
        ],
        updated: Date.now(),
        starred: est.is_exclusive || est.is_trophy || false,
        tags: ["JayaListing", est.category],
        timeline: [],
      }

      newProps.push(crmProp)
      existingNames.add(cleanTitle.toLowerCase())
    }

    if (newProps.length > 0) {
      const updatedProps = [...crmState.props, ...newProps]
      await saveCrmStore({ props: updatedProps }, crmState.version)
    }

    const refreshed = await getCrmStore()

    return NextResponse.json({
      success: true,
      importedCount: newProps.length,
      totalProps: refreshed.props.length,
      data: refreshed,
    })
  } catch (err: any) {
    console.error("CRM Sync error:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Failed to sync portfolio into CRM" },
      { status: 500 }
    )
  }
}

