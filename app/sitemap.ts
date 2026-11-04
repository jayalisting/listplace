import { MetadataRoute } from 'next'
import { pool } from '@/lib/db'
import { LUXURY_PROPERTIES } from '@/lib/luxury-properties'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jayalisting.com'
  const now = new Date()

  // 1. Core User-Side Pages (Home + 4 Category Listing Pages)
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/residential`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/commercial`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/industrial`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agriculture`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // 2. Dynamic Published Property Pages
  let propertyRoutes: MetadataRoute.Sitemap = []

  try {
    const res = await pool.query(
      `SELECT id, updated_at, created_at, status, visibility 
       FROM properties 
       WHERE (visibility IS NULL OR visibility = 'public' OR visibility = 'published') 
       ORDER BY updated_at DESC`
    )

    if (res.rows && res.rows.length > 0) {
      propertyRoutes = res.rows.map((row) => ({
        url: `${baseUrl}/property/${row.id}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : new Date(row.created_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.85,
      }))
    }
  } catch (err) {
    // Database fallback to static properties
  }

  if (propertyRoutes.length === 0) {
    propertyRoutes = LUXURY_PROPERTIES.filter(
      (p) => !p.visibility || p.visibility === 'public'
    ).map((p) => ({
      url: `${baseUrl}/property/${p.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    }))
  }

  return [...coreRoutes, ...propertyRoutes]
}
