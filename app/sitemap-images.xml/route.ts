import { NextResponse } from "next/server"
import { getAllImageSeoRecords, pool } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 3600 // Cache for 1 hour, auto-invalidates on update

/**
 * Dedicated Google-Compliant Image Sitemap
 * Standard: https://www.google.com/schemas/sitemap-image/1.1/
 */
export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jayalisting.com"
    const registeredImages = await getAllImageSeoRecords()

    // Map by image URL
    const imageMap = new Map<string, any>()
    for (const img of registeredImages) {
      if (img.allowIndex !== false && img.includeInSitemap !== false) {
        imageMap.set(img.url, img)
      }
    }

    // Also collect properties images
    const propImagesByPage = new Map<string, string[]>()
    try {
      const res = await pool.query(
        "SELECT id, images, visibility FROM properties WHERE visibility IS NULL OR visibility != 'private'"
      )
      for (const row of res.rows) {
        const pageUrl = `${baseUrl}/property/${row.id}`
        const imgs = Array.isArray(row.images) ? row.images : []
        propImagesByPage.set(pageUrl, imgs)
      }
    } catch (e) {
      console.warn("Notice querying properties for image sitemap:", e)
    }

    // Build XML structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`
    xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`

    // Add Home page images
    xml += `  <url>\n`
    xml += `    <loc>${baseUrl}</loc>\n`
    xml += `    <image:image>\n`
    xml += `      <image:loc>${baseUrl}/placeholder.jpg</image:loc>\n`
    xml += `      <image:title>JayaListing Luxury Real Estate Portfolio</image:title>\n`
    xml += `    </image:image>\n`
    xml += `  </url>\n`

    // Add per-estate pages with their associated gallery images
    for (const [pageUrl, images] of propImagesByPage.entries()) {
      const validImages = images.filter((imgUrl) => {
        const meta = imageMap.get(imgUrl)
        if (meta) {
          return meta.allowIndex !== false && meta.includeInSitemap !== false
        }
        return true
      })

      if (validImages.length === 0) continue

      xml += `  <url>\n`
      xml += `    <loc>${pageUrl}</loc>\n`
      for (const imgUrl of validImages) {
        const fullImgLoc = imgUrl.startsWith("http") ? imgUrl : `${baseUrl}${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`
        const meta = imageMap.get(imgUrl)
        xml += `    <image:image>\n`
        xml += `      <image:loc>${fullImgLoc.replace(/&/g, "&amp;")}</image:loc>\n`
        if (meta?.title) {
          xml += `      <image:title><![CDATA[${meta.title}]]></image:title>\n`
        }
        if (meta?.caption) {
          xml += `      <image:caption><![CDATA[${meta.caption}]]></image:caption>\n`
        }
        xml += `    </image:image>\n`
      }
      xml += `  </url>\n`
    }

    xml += `</urlset>\n`

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (err: any) {
    return new NextResponse(`<error>${err.message}</error>`, {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    })
  }
}

