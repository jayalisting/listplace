import { NextResponse } from "next/server"
import { getAllImageSeoRecords } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

export async function GET() {
  try {
    const records = await getAllImageSeoRecords()

    const headers = [
      "URL",
      "Alt Text",
      "Is Decorative",
      "Title",
      "Caption",
      "Description",
      "SEO File Name",
      "Focus Keyword",
      "Image Type",
      "AI Description",
      "Brand Entity",
      "Product Entity",
      "Place Entity",
      "Topic Entity",
      "Creator",
      "Credit",
      "Copyright",
      "License",
      "Allow Index",
      "Include In Sitemap",
      "SEO Score",
    ]

    const rows = records.map((img) => [
      escapeCsv(img.url),
      escapeCsv(img.alt),
      escapeCsv(img.isDecorative ? "true" : "false"),
      escapeCsv(img.title),
      escapeCsv(img.caption),
      escapeCsv(img.description),
      escapeCsv(img.seoFileName),
      escapeCsv(img.focusKeyword),
      escapeCsv(img.imageType),
      escapeCsv(img.aiDescription),
      escapeCsv(img.entities?.brand || ""),
      escapeCsv(img.entities?.product || ""),
      escapeCsv(img.entities?.place || ""),
      escapeCsv(img.entities?.topic || ""),
      escapeCsv(img.creator),
      escapeCsv(img.credit),
      escapeCsv(img.copyright),
      escapeCsv(img.license),
      escapeCsv(img.allowIndex !== false ? "true" : "false"),
      escapeCsv(img.includeInSitemap !== false ? "true" : "false"),
      escapeCsv(img.score ?? 85),
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jayalisting-image-seo-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

