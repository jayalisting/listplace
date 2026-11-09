import { NextRequest, NextResponse } from "next/server"
import { storeFile } from "@/lib/storage"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"
export const revalidate = 0

const CRM_FILES_DIR = path.join(process.cwd(), "public", "uploads", "crm")

function safePath(subPath: string): string | null {
  const resolved = path.resolve(CRM_FILES_DIR, subPath)
  if (resolved.startsWith(CRM_FILES_DIR + path.sep) || resolved === CRM_FILES_DIR) {
    return resolved
  }
  return null
}

/**
 * POST /api/crm/files
 * Saves CRM document/photo to Vercel Blob / persistent storage with local disk fallback.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const pid = String(formData.get("pid") || "general").replace(/[^\w-]/g, "")
    const id = String(formData.get("id") || Date.now().toString(36)).replace(/[^\w-]/g, "")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const cleanName = file.name.replace(/[^\w.\- ]/g, "_")
    const relKey = `crm/${pid}/${id}-${cleanName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Store in cloud object storage or local disk
    const stored = await storeFile(relKey, buffer, file.type || "application/octet-stream")

    // Keep local path in sync
    const localTargetDir = path.join(CRM_FILES_DIR, pid)
    fs.mkdirSync(localTargetDir, { recursive: true })
    const localFilePath = path.join(localTargetDir, `${id}-${cleanName}`)
    if (!fs.existsSync(localFilePath)) {
      fs.writeFileSync(localFilePath, buffer)
    }

    return NextResponse.json({
      path: `${pid}/${id}-${cleanName}`,
      url: stored.url,
      size: buffer.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "File upload failed" }, { status: 500 })
  }
}

/**
 * GET /api/crm/files?p=<path>&t=<mime>
 * Serves CRM document/photo.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const p = searchParams.get("p") || ""
    const target = safePath(p)

    if (!target || !fs.existsSync(target)) {
      const fallback = path.join(process.cwd(), "public", "uploads", p)
      if (fs.existsSync(fallback)) {
        const buf = fs.readFileSync(fallback)
        return new NextResponse(buf, {
          headers: {
            "Content-Type": searchParams.get("t") || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        })
      }
      return new NextResponse("File not found", { status: 404 })
    }

    const fileBuffer = fs.readFileSync(target)
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": searchParams.get("t") || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (err: any) {
    return new NextResponse("Error reading file", { status: 500 })
  }
}

/**
 * DELETE /api/crm/files?p=<path>
 * Deletes CRM document/photo.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const p = searchParams.get("p") || ""
    const target = safePath(p)

    if (target && fs.existsSync(target)) {
      fs.unlinkSync(target)
    }

    return NextResponse.json({ ok: 1 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

