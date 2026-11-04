import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { rename, existsSync } from "fs"
import { promisify } from "util"
import { getImageSeoRecord, saveImageSeoRecord, add301Redirect, pool } from "@/lib/db"

const renameAsync = promisify(rename)

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const { oldUrl, newFileName } = await req.json()

    if (!oldUrl || !newFileName) {
      return NextResponse.json({ success: false, error: "oldUrl and newFileName are required" }, { status: 400 })
    }

    // Slugify new file name to lowercase-with-hyphens
    const ext = path.extname(newFileName) || ".webp"
    const baseName = path.basename(newFileName, ext)
    const cleanBase = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    const cleanNewFileName = `${cleanBase}${ext.toLowerCase()}`

    let newUrl = oldUrl

    // If local file in /uploads
    if (oldUrl.startsWith("/uploads/")) {
      const oldFileName = path.basename(oldUrl)
      const uploadsDir = path.join(process.cwd(), "public", "uploads")
      const oldFilePath = path.join(uploadsDir, oldFileName)
      const newFilePath = path.join(uploadsDir, cleanNewFileName)

      if (existsSync(oldFilePath)) {
        await renameAsync(oldFilePath, newFilePath)
      }
      newUrl = `/uploads/${cleanNewFileName}`
    } else {
      // Remote or external URL — track logical SEO file name
      newUrl = oldUrl
    }

    // 1. Add 301 Permanent Redirect
    if (oldUrl !== newUrl) {
      await add301Redirect(oldUrl, newUrl)
    }

    // 2. Update Image SEO Record
    const existing = await getImageSeoRecord(oldUrl)
    if (existing) {
      const updated = {
        ...existing,
        url: newUrl,
        seoFileName: cleanNewFileName,
      }
      await saveImageSeoRecord(updated)
    }

    // 3. Update any properties table records that reference oldUrl
    if (oldUrl !== newUrl) {
      try {
        await pool.query(
          `
          UPDATE properties
          SET images = (
            SELECT jsonb_agg(
              CASE 
                WHEN elem::text = $1::text OR elem::text = ('"' || $2 || '"')::text THEN to_jsonb($3::text)
                ELSE elem
              END
            )
            FROM jsonb_array_elements(images) AS elem
          )
          WHERE images::text LIKE $4;
          `,
          [oldUrl, oldUrl, newUrl, `%${oldUrl}%`]
        )
      } catch (e) {
        console.warn("Notice updating properties table for renamed image:", e)
      }
    }

    return NextResponse.json({
      success: true,
      oldUrl,
      newUrl,
      seoFileName: cleanNewFileName,
      redirect301Added: oldUrl !== newUrl,
      message: `Image renamed to "${cleanNewFileName}" with 301 Permanent Redirect established.`,
    })
  } catch (err: any) {
    console.error("Rename API error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

