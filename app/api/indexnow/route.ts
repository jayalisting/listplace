import { NextResponse } from 'next/server'

/**
 * IndexNow Notification Endpoint
 * Pings participating search engines (Bing, Yandex, Seznam, Naver)
 * immediately when a listing is published, updated, or unpublished.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const host = process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
      : 'jayalisting.com'

    const key = process.env.INDEXNOW_KEY || 'jayalisting_indexnow_key_2026'
    const keyLocation = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jayalisting.com'}/${key}.txt`

    const urlList: string[] = Array.isArray(body.urlList)
      ? body.urlList
      : body.url
      ? [body.url]
      : []

    if (urlList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'url or urlList is required' },
        { status: 400 }
      )
    }

    // Submit payload to IndexNow API (Bing Gateway)
    const payload = {
      host,
      key,
      keyLocation,
      urlList,
    }

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    })

    const status = response.status

    return NextResponse.json({
      success: status === 200 || status === 202,
      status,
      submittedUrls: urlList.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('IndexNow ping error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'IndexNow request failed' },
      { status: 500 }
    )
  }
}
