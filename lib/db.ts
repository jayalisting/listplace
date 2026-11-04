import { Pool } from "pg"
import { LUXURY_PROPERTIES, LuxuryProperty } from "./luxury-properties"
import { ImageSeoData, ImageSeoSettings, DEFAULT_IMAGE_SEO_SETTINGS, createDefaultImageSeo } from "./image-seo"

// Global pool instance to prevent connection exhaustion in Next.js hot reload
const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined
}

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL || "postgres://nikhilkotian@localhost:5432/grolow_db",
    ssl:
      (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost") && !process.env.DATABASE_URL.includes("127.0.0.1") && process.env.NODE_ENV === "production")
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool
}

let isInitialized = false

/**
 * Initializes the PostgreSQL schema and seeds default luxury properties if empty.
 */
export async function initializeDatabase(): Promise<boolean> {
  if (isInitialized) return true

  try {
    // Test connection
    const client = await pool.connect()
    try {
      // Create properties table
      await client.query(`
        CREATE TABLE IF NOT EXISTS properties (
          id VARCHAR(50) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          tagline TEXT,
          category VARCHAR(50) NOT NULL,
          property_type VARCHAR(100) NOT NULL,
          price VARCHAR(50) NOT NULL,
          original_price VARCHAR(50),
          price_numeric NUMERIC(10, 2) NOT NULL DEFAULT 0,
          price_suffix VARCHAR(50),
          location VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(100) NOT NULL,
          area VARCHAR(100) NOT NULL,
          carpet_area VARCHAR(100),
          bedrooms INT,
          bathrooms INT,
          parking VARCHAR(100),
          facing VARCHAR(100),
          floor VARCHAR(100),
          age VARCHAR(100),
          status VARCHAR(50) DEFAULT 'For Sale',
          listing_type VARCHAR(50) DEFAULT 'sell',
          rating NUMERIC(3, 2) DEFAULT 4.9,
          reviews INT DEFAULT 12,
          is_new BOOLEAN DEFAULT true,
          is_exclusive BOOLEAN DEFAULT true,
          is_trophy BOOLEAN DEFAULT true,
          tags JSONB DEFAULT '[]'::jsonb,
          images JSONB DEFAULT '[]'::jsonb,
          highlights JSONB DEFAULT '[]'::jsonb,
          amenities JSONB DEFAULT '[]'::jsonb,
          details JSONB DEFAULT '{}'::jsonb,
          landmarks JSONB DEFAULT '[]'::jsonb,
          seller JSONB DEFAULT '{}'::jsonb,
          roi VARCHAR(100),
          coordinates JSONB DEFAULT '{"lat": 18.9696, "lng": 72.8081}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Ensure schema registry columns exist
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS sub_type VARCHAR(100);")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS purpose VARCHAR(50);")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership VARCHAR(100);")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'public';")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS strength_score INT DEFAULT 85;")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS verification_tier VARCHAR(50) DEFAULT 'verified';")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS facilities JSONB DEFAULT '[]'::jsonb;")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_faqs JSONB DEFAULT '[]'::jsonb;")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 100;")
      await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS featured_home BOOLEAN DEFAULT false;")

      // Create Single-Use VIP Share Tokens Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS vip_share_tokens (
          id SERIAL PRIMARY KEY,
          token VARCHAR(100) UNIQUE NOT NULL,
          property_id VARCHAR(50) NOT NULL,
          client_name VARCHAR(255),
          client_phone VARCHAR(50),
          status VARCHAR(20) DEFAULT 'active',
          max_views INT DEFAULT 1,
          view_count INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          first_viewed_at TIMESTAMP WITH TIME ZONE,
          last_viewed_at TIMESTAMP WITH TIME ZONE
        );
        CREATE INDEX IF NOT EXISTS idx_vip_tokens_lookup ON vip_share_tokens(token, property_id);

        CREATE TABLE IF NOT EXISTS vip_tour_bookings (
          id SERIAL PRIMARY KEY,
          property_id VARCHAR(50) NOT NULL,
          property_title VARCHAR(255) NOT NULL,
          property_price VARCHAR(50),
          property_location VARCHAR(255),
          tour_type VARCHAR(50) NOT NULL DEFAULT 'in-person',
          tour_date VARCHAR(50) NOT NULL,
          tour_time VARCHAR(50) NOT NULL,
          client_name VARCHAR(255) NOT NULL,
          client_phone VARCHAR(50) NOT NULL,
          client_email VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_vip_bookings_created ON vip_tour_bookings(created_at DESC);

        -- Image SEO & Metadata Registry Table
        CREATE TABLE IF NOT EXISTS image_seo_records (
          url VARCHAR(500) PRIMARY KEY,
          seo_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Image SEO Global Settings Table
        CREATE TABLE IF NOT EXISTS image_seo_settings (
          id VARCHAR(50) PRIMARY KEY,
          settings JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Image 301 Permanent Redirects Table
        CREATE TABLE IF NOT EXISTS image_301_redirects (
          old_url VARCHAR(500) PRIMARY KEY,
          new_url VARCHAR(500) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Check if table has rows
      const countRes = await client.query("SELECT COUNT(*) FROM properties")
      const count = parseInt(countRes.rows[0].count, 10)

      if (count === 0) {
        // Seed default luxury properties
        console.log("Seeding PostgreSQL properties table with luxury assets...")
        for (const prop of LUXURY_PROPERTIES) {
          await client.query(
            `
            INSERT INTO properties (
              id, title, tagline, category, property_type, price, original_price,
              price_numeric, price_suffix, location, city, state, area, carpet_area,
              bedrooms, bathrooms, parking, facing, floor, age, status, listing_type,
              rating, reviews, is_new, is_exclusive, is_trophy, tags, images,
              description, highlights, details, landmarks, seller, roi, coordinates, amenities
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
              $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
              $28, $29, $30, $31, $32, $33, $34, $35, $36, $37
            ) ON CONFLICT (id) DO NOTHING;
          `,
            [
              prop.id,
              prop.title,
              prop.tagline,
              prop.category,
              prop.propertyType,
              prop.price,
              prop.originalPrice || null,
              prop.priceNumeric,
              prop.priceSuffix || null,
              prop.location,
              prop.city,
              prop.state,
              prop.area,
              prop.carpetArea || null,
              prop.bedrooms || null,
              prop.bathrooms || null,
              prop.parking,
              prop.facing || null,
              prop.floor || null,
              prop.age || null,
              prop.status,
              prop.listingType,
              prop.rating,
              prop.reviews,
              prop.isNew ?? true,
              prop.isExclusive ?? true,
              prop.isTrophy ?? true,
              JSON.stringify(prop.tags),
              JSON.stringify(prop.images),
              prop.description,
              JSON.stringify(prop.highlights),
              JSON.stringify(prop.details),
              JSON.stringify(prop.landmarks),
              JSON.stringify(prop.seller),
              prop.roi || null,
              JSON.stringify(prop.coordinates),
              JSON.stringify(prop.amenities || prop.highlights || []),
            ]
          )
        }
        console.log("PostgreSQL seeding complete.")
      }

      isInitialized = true
      return true
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("PostgreSQL initialization notice:", error)
    return false
  }
}

/**
 * Maps a raw PostgreSQL row to the LuxuryProperty TypeScript interface.
 */
function mapRowToProperty(row: any): LuxuryProperty {
  return {
    id: String(row.id),
    title: row.title,
    tagline: row.tagline || "",
    category: row.category as any,
    propertyType: row.property_type,
    price: row.price,
    originalPrice: row.original_price || undefined,
    priceNumeric: Number(row.price_numeric) || 0,
    priceSuffix: row.price_suffix || undefined,
    location: row.location,
    city: row.city,
    state: row.state,
    area: row.area,
    carpetArea: row.carpet_area || undefined,
    bedrooms: row.bedrooms ? Number(row.bedrooms) : undefined,
    bathrooms: row.bathrooms ? Number(row.bathrooms) : undefined,
    parking: row.parking || "",
    facing: row.facing || undefined,
    floor: row.floor || undefined,
    age: row.age || undefined,
    status: row.status || "For Sale",
    listingType: row.listing_type || "sell",
    rating: Number(row.rating) || 4.9,
    reviews: Number(row.reviews) || 12,
    isNew: Boolean(row.is_new),
    isExclusive: Boolean(row.is_exclusive),
    isTrophy: Boolean(row.is_trophy),
    tags: Array.isArray(row.tags) ? row.tags : typeof row.tags === "string" ? JSON.parse(row.tags) : [],
    images: Array.isArray(row.images) ? row.images : typeof row.images === "string" ? JSON.parse(row.images) : [],
    description: row.description || "",
    highlights: Array.isArray(row.highlights) ? row.highlights : typeof row.highlights === "string" ? JSON.parse(row.highlights) : [],
    amenities: Array.isArray(row.amenities)
      ? row.amenities
      : typeof row.amenities === "string"
      ? JSON.parse(row.amenities)
      : Array.isArray(row.highlights)
      ? row.highlights
      : [],
    details: typeof row.details === "object" ? row.details : typeof row.details === "string" ? JSON.parse(row.details) : {},
    landmarks: Array.isArray(row.landmarks) ? row.landmarks : typeof row.landmarks === "string" ? JSON.parse(row.landmarks) : [],
    seller: typeof row.seller === "object" ? row.seller : typeof row.seller === "string" ? JSON.parse(row.seller) : {},
    roi: row.roi || undefined,
    coordinates: typeof row.coordinates === "object" ? row.coordinates : typeof row.coordinates === "string" ? JSON.parse(row.coordinates) : { lat: 18.9696, lng: 72.8081 },
    subType: row.sub_type || undefined,
    purpose: row.purpose || undefined,
    ownership: row.ownership || undefined,
    visibility: row.visibility || "public",
    strengthScore: Number(row.strength_score) || 85,
    verificationTier: row.verification_tier || "verified",
    attributes: typeof row.attributes === "object" ? row.attributes : typeof row.attributes === "string" ? JSON.parse(row.attributes) : {},
    facilities: Array.isArray(row.facilities) ? row.facilities : typeof row.facilities === "string" ? JSON.parse(row.facilities) : [],
    documents: Array.isArray(row.documents) ? row.documents : typeof row.documents === "string" ? JSON.parse(row.documents) : [],
    customFaqs: Array.isArray(row.custom_faqs)
      ? row.custom_faqs
      : typeof row.custom_faqs === "string"
      ? JSON.parse(row.custom_faqs)
      : Array.isArray(row.attributes?.customFaqs)
      ? row.attributes.customFaqs
      : [],
    displayOrder: row.display_order !== null && row.display_order !== undefined ? Number(row.display_order) : 100,
    featuredHome: Boolean(row.featured_home),
  }
}

/**
 * Fetch all properties from PostgreSQL, ordered by Category and ID.
 */
export async function getDbProperties(category?: string, includePrivate = false): Promise<LuxuryProperty[]> {
  try {
    await initializeDatabase()
    let query = "SELECT * FROM properties"
    const params: any[] = []
    const whereClauses: string[] = []

    if (!includePrivate) {
      whereClauses.push("(visibility IS NULL OR visibility != 'private')")
    }

    if (category && category !== "all") {
      params.push(category)
      whereClauses.push(`category = $${params.length}`)
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`
    }

    query += " ORDER BY featured_home DESC, display_order ASC, id DESC"
    const res = await pool.query(query, params)

    // Direct reflection of database state:
    return res.rows.map(mapRowToProperty)
  } catch (error) {
    console.error("Error querying PostgreSQL, falling back to local memory:", error)
    let list = LUXURY_PROPERTIES
    if (!includePrivate) {
      list = list.filter((p) => p.visibility !== "private")
    }
    return category && category !== "all"
      ? list.filter((p) => p.category === category)
      : list
  }
}

/**
 * Fetch a single property by ID from PostgreSQL.
 * Returns null if not found (e.g. if deleted).
 */
export async function getDbPropertyById(id: string): Promise<LuxuryProperty | null> {
  try {
    await initializeDatabase()
    const res = await pool.query("SELECT * FROM properties WHERE id = $1", [id])
    if (res.rows.length > 0) {
      return mapRowToProperty(res.rows[0])
    }
    return null
  } catch (error) {
    console.error("Error fetching property by ID from PostgreSQL:", error)
    return null
  }
}

/**
 * Create a new property in PostgreSQL.
 */
export async function createDbProperty(data: Partial<LuxuryProperty>): Promise<LuxuryProperty> {
  await initializeDatabase()

  // Generate ID if not provided
  const id = data.id || String(Date.now())
  const priceNumeric = data.priceNumeric || (data.price ? parseFloat(data.price.replace(/[^0-9.]/g, "")) : 20.0)

  const newProperty: LuxuryProperty = {
    id,
    title: data.title || "Untitled Luxury Estate",
    tagline: data.tagline || "Exclusive Private Portfolio",
    category: (data.category as any) || "residential",
    propertyType: data.propertyType || "Luxury Estate",
    price: data.price || "₹25.0 Cr",
    originalPrice: data.originalPrice,
    priceNumeric,
    priceSuffix: data.priceSuffix,
    location: data.location || "Mumbai, Maharashtra",
    city: data.city || "Mumbai",
    state: data.state || "Maharashtra",
    area: data.area || "5,000 sq ft",
    carpetArea: data.carpetArea,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    parking: data.parking || "4 Covered Bays",
    facing: data.facing,
    floor: data.floor,
    age: data.age || "Ready to Move",
    status: data.status || "For Sale",
    listingType: data.listingType || "sell",
    rating: data.rating || 4.95,
    reviews: data.reviews || 10,
    isNew: data.isNew ?? true,
    isExclusive: data.isExclusive ?? true,
    isTrophy: data.isTrophy ?? true,
    tags: data.tags || ["Ultra-Luxury", "Vetted Title"],
    images: data.images && data.images.length > 0 ? data.images : [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
    ],
    description: data.description || "Exclusive private treaty asset with premier finishes and complete legal clearance.",
    highlights: data.highlights || [
      "High-security biometric private access",
      "Prime micro-market with excellent appreciation",
      "Full title documentation vetted by legal counsel"
    ],
    amenities: data.amenities && data.amenities.length > 0 ? data.amenities : (data.highlights || [
      "Private Heated Pool",
      "Biometric Access",
      "24/7 Security Concierge",
      "100% DG Power Backup"
    ]),
    details: data.details || {
      area: data.area || "5,000 sq ft",
      parking: data.parking || "4 Covered Bays",
      security: "Biometric 24/7",
      water: "24/7 Treated Supply",
      electricity: "100% Dual DG Backup",
    },
    landmarks: data.landmarks || [
      { name: "Private Jet Terminal", type: "airport", distance: "8.5 km", color: "bg-blue-100 text-blue-700" }
    ],
    seller: data.seller || {
      name: "Rohit Singhania",
      title: "Senior VP, JayaListing Royal Portfolio",
      phone: "+91 82965 30609",
      email: "rohit.singhania@jayalisting.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      verified: true,
      portfolioCount: 15,
    },
    roi: data.roi || "10.5% Projected Annual ROI",
    coordinates: data.coordinates || { lat: 18.9696, lng: 72.8081 },
    subType: data.subType || null,
    purpose: data.purpose || "sale",
    ownership: data.ownership || "freehold",
    visibility: data.visibility || "public",
    strengthScore: data.strengthScore ?? 80,
    verificationTier: data.verificationTier || "standard",
    attributes: {
      ...(data.attributes || {}),
      customFaqs: data.customFaqs || (data.attributes?.customFaqs as any) || [],
    },
    facilities: data.facilities || [],
    documents: data.documents || [],
    customFaqs: data.customFaqs || (data.attributes?.customFaqs as any) || [],
    displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : 100,
    featuredHome: Boolean(data.featuredHome),
  }

  const client = await pool.connect()
  try {
    await client.query(
      `
      INSERT INTO properties (
        id, title, tagline, category, property_type, price, original_price,
        price_numeric, price_suffix, location, city, state, area, carpet_area,
        bedrooms, bathrooms, parking, facing, floor, age, status, listing_type,
        rating, reviews, is_new, is_exclusive, is_trophy, tags, images,
        description, highlights, details, landmarks, seller, roi, coordinates, amenities,
        sub_type, purpose, ownership, visibility, strength_score, verification_tier,
        attributes, facilities, documents, custom_faqs, display_order, featured_home
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32, $33, $34, $35, $36, $37,
        $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49
      );
    `,
      [
        newProperty.id,
        newProperty.title,
        newProperty.tagline,
        newProperty.category,
        newProperty.propertyType,
        newProperty.price,
        newProperty.originalPrice || null,
        newProperty.priceNumeric,
        newProperty.priceSuffix || null,
        newProperty.location,
        newProperty.city,
        newProperty.state,
        newProperty.area,
        newProperty.carpetArea || null,
        newProperty.bedrooms || null,
        newProperty.bathrooms || null,
        newProperty.parking,
        newProperty.facing || null,
        newProperty.floor || null,
        newProperty.age || null,
        newProperty.status,
        newProperty.listingType,
        newProperty.rating,
        newProperty.reviews,
        newProperty.isNew,
        newProperty.isExclusive,
        newProperty.isTrophy,
        JSON.stringify(newProperty.tags),
        JSON.stringify(newProperty.images),
        newProperty.description,
        JSON.stringify(newProperty.highlights),
        JSON.stringify(newProperty.details),
        JSON.stringify(newProperty.landmarks),
        JSON.stringify(newProperty.seller),
        newProperty.roi || null,
        JSON.stringify(newProperty.coordinates),
        JSON.stringify(newProperty.amenities),
        newProperty.subType || null,
        newProperty.purpose || null,
        newProperty.ownership || null,
        newProperty.visibility || "public",
        newProperty.strengthScore ?? 80,
        newProperty.verificationTier || "standard",
        JSON.stringify(newProperty.attributes || {}),
        JSON.stringify(newProperty.facilities || []),
        JSON.stringify(newProperty.documents || []),
        JSON.stringify(newProperty.customFaqs || []),
        newProperty.displayOrder ?? 100,
        newProperty.featuredHome ?? false,
      ]
    )
    return newProperty
  } finally {
    client.release()
  }
}

/**
 * Delete a property from PostgreSQL.
 */
export async function deleteDbProperty(id: string): Promise<boolean> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query("DELETE FROM properties WHERE id = $1", [id])
    return (res.rowCount ?? 0) > 0
  } finally {
    client.release()
  }
}

/**
 * Fully update any/all customizable fields of a property in PostgreSQL.
 */
export async function updateDbProperty(id: string, updates: Partial<LuxuryProperty>): Promise<LuxuryProperty | null> {
  await initializeDatabase()
  const existing = await getDbPropertyById(id)
  if (!existing) {
    return null
  }

  // Handle price numeric calculation if price is updated but priceNumeric isn't provided
  let priceNumeric = updates.priceNumeric !== undefined ? Number(updates.priceNumeric) : existing.priceNumeric
  if (updates.price && updates.priceNumeric === undefined) {
    const cleanStr = updates.price.replace(/[^\d.]/g, "")
    const parsed = parseFloat(cleanStr)
    if (!isNaN(parsed)) {
      priceNumeric = parsed
    }
  }

  const merged: LuxuryProperty = {
    ...existing,
    ...updates,
    id, // lock ID
    priceNumeric,
    amenities: updates.amenities !== undefined ? updates.amenities : (existing.amenities || existing.highlights || []),
    highlights: updates.highlights !== undefined ? updates.highlights : (existing.highlights || []),
    tags: updates.tags !== undefined ? updates.tags : (existing.tags || []),
    images: updates.images !== undefined ? updates.images : (existing.images || []),
    details: updates.details !== undefined ? { ...existing.details, ...updates.details } : existing.details,
    landmarks: updates.landmarks !== undefined ? updates.landmarks : (existing.landmarks || []),
    seller: updates.seller !== undefined ? { ...existing.seller, ...updates.seller } : existing.seller,
    coordinates: updates.coordinates !== undefined ? updates.coordinates : existing.coordinates,
    subType: updates.subType !== undefined ? updates.subType : existing.subType,
    purpose: updates.purpose !== undefined ? updates.purpose : existing.purpose,
    ownership: updates.ownership !== undefined ? updates.ownership : existing.ownership,
    visibility: updates.visibility !== undefined ? updates.visibility : existing.visibility,
    strengthScore: updates.strengthScore !== undefined ? updates.strengthScore : existing.strengthScore,
    verificationTier: updates.verificationTier !== undefined ? updates.verificationTier : existing.verificationTier,
    attributes: {
      ...(updates.attributes !== undefined ? updates.attributes : existing.attributes),
      customFaqs: updates.customFaqs !== undefined ? updates.customFaqs : (existing.customFaqs || (existing.attributes?.customFaqs as any) || []),
    },
    facilities: updates.facilities !== undefined ? updates.facilities : existing.facilities,
    documents: updates.documents !== undefined ? updates.documents : existing.documents,
    customFaqs: updates.customFaqs !== undefined ? updates.customFaqs : (existing.customFaqs || (existing.attributes?.customFaqs as any) || []),
    displayOrder: updates.displayOrder !== undefined ? Number(updates.displayOrder) : (existing.displayOrder ?? 100),
    featuredHome: updates.featuredHome !== undefined ? Boolean(updates.featuredHome) : Boolean(existing.featuredHome),
  }

  const client = await pool.connect()
  try {
    const res = await client.query(
      `
      UPDATE properties SET
        title = $1,
        tagline = $2,
        category = $3,
        property_type = $4,
        price = $5,
        original_price = $6,
        price_numeric = $7,
        price_suffix = $8,
        location = $9,
        city = $10,
        state = $11,
        area = $12,
        carpet_area = $13,
        bedrooms = $14,
        bathrooms = $15,
        parking = $16,
        facing = $17,
        floor = $18,
        age = $19,
        status = $20,
        listing_type = $21,
        rating = $22,
        reviews = $23,
        is_new = $24,
        is_exclusive = $25,
        is_trophy = $26,
        tags = $27,
        images = $28,
        description = $29,
        highlights = $30,
        details = $31,
        landmarks = $32,
        seller = $33,
        roi = $34,
        coordinates = $35,
        amenities = $36,
        sub_type = $37,
        purpose = $38,
        ownership = $39,
        visibility = $40,
        strength_score = $41,
        verification_tier = $42,
        attributes = $43,
        facilities = $44,
        documents = $45,
        custom_faqs = $46,
        display_order = $47,
        featured_home = $48,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $49
      RETURNING *;
      `,
      [
        merged.title,
        merged.tagline,
        merged.category,
        merged.propertyType,
        merged.price,
        merged.originalPrice || null,
        merged.priceNumeric,
        merged.priceSuffix || null,
        merged.location,
        merged.city,
        merged.state,
        merged.area,
        merged.carpetArea || null,
        merged.bedrooms ?? null,
        merged.bathrooms ?? null,
        merged.parking,
        merged.facing || null,
        merged.floor || null,
        merged.age || null,
        merged.status,
        merged.listingType,
        merged.rating,
        merged.reviews,
        merged.isNew ?? true,
        merged.isExclusive ?? true,
        merged.isTrophy ?? true,
        JSON.stringify(merged.tags),
        JSON.stringify(merged.images),
        merged.description,
        JSON.stringify(merged.highlights),
        JSON.stringify(merged.details),
        JSON.stringify(merged.landmarks),
        JSON.stringify(merged.seller),
        merged.roi || null,
        JSON.stringify(merged.coordinates),
        JSON.stringify(merged.amenities),
        merged.subType || null,
        merged.purpose || null,
        merged.ownership || null,
        merged.visibility || "public",
        merged.strengthScore ?? 80,
        merged.verificationTier || "standard",
        JSON.stringify(merged.attributes || {}),
        JSON.stringify(merged.facilities || []),
        JSON.stringify(merged.documents || []),
        JSON.stringify(merged.customFaqs || []),
        merged.displayOrder ?? 100,
        merged.featuredHome ?? false,
        id,
      ]
    )

    if (res.rows.length > 0) {
      return mapRowToProperty(res.rows[0])
    }
    return null
  } finally {
    client.release()
  }
}

/**
 * Update amenities for an existing property in PostgreSQL.
 */
export async function updateDbPropertyAmenities(id: string, amenities: string[]): Promise<LuxuryProperty | null> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query(
      "UPDATE properties SET amenities = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [JSON.stringify(amenities), id]
    )
    if (res.rows.length > 0) {
      return mapRowToProperty(res.rows[0])
    }
    return null
  } finally {
    client.release()
  }
}

/**
 * Re-seed default luxury properties or restore database.
 */
export async function seedDefaultProperties(force = false): Promise<number> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    if (force) {
      await client.query("DELETE FROM properties")
    }
    let count = 0
    for (const prop of LUXURY_PROPERTIES) {
      await client.query(
        `
        INSERT INTO properties (
          id, title, tagline, category, property_type, price, original_price,
          price_numeric, price_suffix, location, city, state, area, carpet_area,
          bedrooms, bathrooms, parking, facing, floor, age, status, listing_type,
          rating, reviews, is_new, is_exclusive, is_trophy, tags, images,
          description, highlights, details, landmarks, seller, roi, coordinates, amenities
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
          $28, $29, $30, $31, $32, $33, $34, $35, $36, $37
        ) ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          price = EXCLUDED.price,
          amenities = EXCLUDED.amenities,
          updated_at = CURRENT_TIMESTAMP;
      `,
        [
          prop.id,
          prop.title,
          prop.tagline,
          prop.category,
          prop.propertyType,
          prop.price,
          prop.originalPrice || null,
          prop.priceNumeric,
          prop.priceSuffix || null,
          prop.location,
          prop.city,
          prop.state,
          prop.area,
          prop.carpetArea || null,
          prop.bedrooms || null,
          prop.bathrooms || null,
          prop.parking,
          prop.facing || null,
          prop.floor || null,
          prop.age || null,
          prop.status,
          prop.listingType,
          prop.rating,
          prop.reviews,
          prop.isNew ?? true,
          prop.isExclusive ?? true,
          prop.isTrophy ?? true,
          JSON.stringify(prop.tags),
          JSON.stringify(prop.images),
          prop.description,
          JSON.stringify(prop.highlights),
          JSON.stringify(prop.details),
          JSON.stringify(prop.landmarks),
          JSON.stringify(prop.seller),
          prop.roi || null,
          JSON.stringify(prop.coordinates),
          JSON.stringify(prop.amenities || prop.highlights || []),
        ]
      )
      count++
    }
    return count
  } finally {
    client.release()
  }
}

export interface VipShareToken {
  id: number
  token: string
  property_id: string
  client_name?: string
  client_phone?: string
  status: "active" | "used" | "revoked"
  max_views: number
  view_count: number
  created_at: string
  first_viewed_at?: string
  last_viewed_at?: string
}

export async function createVipShareToken(
  propertyId: string,
  clientName?: string,
  clientPhone?: string,
  maxViews: number = 1
): Promise<VipShareToken> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const rawToken = "vip_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    const res = await client.query(
      `
      INSERT INTO vip_share_tokens (
        token, property_id, client_name, client_phone, max_views, status
      ) VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *;
      `,
      [rawToken, propertyId, clientName || null, clientPhone || null, maxViews]
    )
    return res.rows[0]
  } finally {
    client.release()
  }
}

export async function getVipShareTokens(propertyId: string): Promise<VipShareToken[]> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query(
      `
      SELECT * FROM vip_share_tokens
      WHERE property_id = $1
      ORDER BY created_at DESC;
      `,
      [propertyId]
    )
    return res.rows
  } finally {
    client.release()
  }
}

export async function revokeVipShareToken(tokenId: number | string): Promise<boolean> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query(
      `
      UPDATE vip_share_tokens
      SET status = 'revoked'
      WHERE id = $1
      RETURNING id;
      `,
      [tokenId]
    )
    return res.rows.length > 0
  } finally {
    client.release()
  }
}

export async function verifyAndConsumeVipToken(
  token: string,
  propertyId: string
): Promise<{
  valid: boolean
  reason?: "invalid" | "already_used" | "revoked"
  message: string
  tokenData?: VipShareToken
}> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query(
      `
      SELECT * FROM vip_share_tokens
      WHERE token = $1 AND property_id = $2
      LIMIT 1;
      `,
      [token, propertyId]
    )

    if (res.rows.length === 0) {
      return {
        valid: false,
        reason: "invalid",
        message: "This VIP access link is invalid or does not match this asset.",
      }
    }

    const row = res.rows[0] as VipShareToken

    if (row.status === "revoked") {
      return {
        valid: false,
        reason: "revoked",
        message: "This VIP link has been revoked by the estate director.",
        tokenData: row,
      }
    }

    // If already used/viewed
    if (row.status === "used" || row.view_count >= row.max_views) {
      return {
        valid: false,
        reason: "already_used",
        message: "This single-use private VIP dossier has already been accessed and is now permanently deactivated.",
        tokenData: row,
      }
    }

    // Mark as consumed immediately on first access!
    const updateRes = await client.query(
      `
      UPDATE vip_share_tokens
      SET
        status = 'used',
        view_count = view_count + 1,
        first_viewed_at = COALESCE(first_viewed_at, CURRENT_TIMESTAMP),
        last_viewed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
      `,
      [row.id]
    )

    return {
      valid: true,
      message: "One-time VIP access granted. Link has now been consumed and permanently disabled for future viewers.",
      tokenData: updateRes.rows[0],
    }
  } finally {
    client.release()
  }
}

export interface VipTourBookingRecord {
  id: number
  property_id: string
  property_title: string
  property_price?: string
  property_location?: string
  tour_type: "in-person" | "virtual"
  tour_date: string
  tour_time: string
  client_name: string
  client_phone: string
  client_email: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  notes?: string
  created_at: string
  updated_at: string
}

/**
 * Save a new VIP Tour Booking to PostgreSQL
 */
export async function createDbVipTourBooking(data: {
  propertyId: string
  propertyTitle: string
  propertyPrice?: string
  propertyLocation?: string
  tourType: "in-person" | "virtual"
  tourDate: string
  tourTime: string
  clientName: string
  clientPhone: string
  clientEmail: string
  notes?: string
}): Promise<VipTourBookingRecord> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query(
      `
      INSERT INTO vip_tour_bookings (
        property_id, property_title, property_price, property_location,
        tour_type, tour_date, tour_time, client_name, client_phone, client_email,
        notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *;
      `,
      [
        data.propertyId,
        data.propertyTitle,
        data.propertyPrice || null,
        data.propertyLocation || null,
        data.tourType || "in-person",
        data.tourDate,
        data.tourTime,
        data.clientName,
        data.clientPhone,
        data.clientEmail,
        data.notes || null,
      ]
    )
    return res.rows[0]
  } finally {
    client.release()
  }
}

/**
 * Retrieve all VIP Tour Bookings ordered by latest first
 */
export async function getDbVipTourBookings(): Promise<VipTourBookingRecord[]> {
  try {
    await initializeDatabase()
    const client = await pool.connect()
    try {
      const res = await client.query(
        "SELECT * FROM vip_tour_bookings ORDER BY created_at DESC;"
      )
      return res.rows
    } finally {
      client.release()
    }
  } catch (err) {
    console.error("Error fetching VIP tour bookings:", err)
    return []
  }
}

/**
 * Update the status of a VIP Tour Booking (pending, confirmed, completed, cancelled)
 */
export async function updateDbVipTourBookingStatus(
  id: number | string,
  status: "pending" | "confirmed" | "completed" | "cancelled"
): Promise<VipTourBookingRecord | null> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query(
      `
      UPDATE vip_tour_bookings
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
      `,
      [status, id]
    )
    return res.rows[0] || null
  } finally {
    client.release()
  }
}

/**
 * Delete a VIP Tour Booking
 */
export async function deleteDbVipTourBooking(id: number | string): Promise<boolean> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query(
      "DELETE FROM vip_tour_bookings WHERE id = $1 RETURNING id;",
      [id]
    )
    return res.rows.length > 0
  } finally {
    client.release()
  }
}

/**
 * ============================================================================
 * IMAGE SEO, AEO & GEO REGISTRY FUNCTIONS
 * ============================================================================
 */

/**
 * Fetch SEO metadata for a single image URL from PostgreSQL
 */
export async function getImageSeoRecord(url: string): Promise<ImageSeoData | null> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query("SELECT seo_data FROM image_seo_records WHERE url = $1 LIMIT 1", [url])
    if (res.rows.length > 0) {
      return res.rows[0].seo_data as ImageSeoData
    }
    return null
  } catch (error) {
    console.error("Error fetching Image SEO record:", error)
    return null
  } finally {
    client.release()
  }
}

/**
 * Save or update Image SEO metadata
 */
export async function saveImageSeoRecord(data: ImageSeoData): Promise<ImageSeoData> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const sanitized = {
      ...data,
      updatedAt: new Date().toISOString(),
    }
    await client.query(
      `
      INSERT INTO image_seo_records (url, seo_data, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (url) DO UPDATE
      SET seo_data = $2, updated_at = CURRENT_TIMESTAMP;
      `,
      [data.url, JSON.stringify(sanitized)]
    )
    return sanitized
  } finally {
    client.release()
  }
}

/**
 * Fetch all registered Image SEO records
 */
export async function getAllImageSeoRecords(): Promise<ImageSeoData[]> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query("SELECT seo_data FROM image_seo_records ORDER BY updated_at DESC")
    return res.rows.map((r) => r.seo_data as ImageSeoData)
  } catch (error) {
    console.error("Error fetching all Image SEO records:", error)
    return []
  } finally {
    client.release()
  }
}

/**
 * Fetch global Image SEO & Crawler settings
 */
export async function getImageSeoSettings(): Promise<ImageSeoSettings> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query("SELECT settings FROM image_seo_settings WHERE id = 'global' LIMIT 1")
    if (res.rows.length > 0) {
      return { ...DEFAULT_IMAGE_SEO_SETTINGS, ...res.rows[0].settings }
    }
    return DEFAULT_IMAGE_SEO_SETTINGS
  } catch {
    return DEFAULT_IMAGE_SEO_SETTINGS
  } finally {
    client.release()
  }
}

/**
 * Save global Image SEO settings
 */
export async function saveImageSeoSettings(settings: Partial<ImageSeoSettings>): Promise<ImageSeoSettings> {
  await initializeDatabase()
  const current = await getImageSeoSettings()
  const merged = { ...current, ...settings }
  const client = await pool.connect()
  try {
    await client.query(
      `
      INSERT INTO image_seo_settings (id, settings, updated_at)
      VALUES ('global', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE
      SET settings = $1, updated_at = CURRENT_TIMESTAMP;
      `,
      [JSON.stringify(merged)]
    )
    return merged
  } finally {
    client.release()
  }
}

/**
 * Add a 301 Permanent Redirect for renamed image files
 */
export async function add301Redirect(oldUrl: string, newUrl: string): Promise<boolean> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    await client.query(
      `
      INSERT INTO image_301_redirects (old_url, new_url)
      VALUES ($1, $2)
      ON CONFLICT (old_url) DO UPDATE SET new_url = $2;
      `,
      [oldUrl, newUrl]
    )
    return true
  } finally {
    client.release()
  }
}

/**
 * Check if a 301 Redirect exists for an image
 */
export async function get301Redirect(oldUrl: string): Promise<string | null> {
  await initializeDatabase()
  const client = await pool.connect()
  try {
    const res = await client.query("SELECT new_url FROM image_301_redirects WHERE old_url = $1 LIMIT 1", [oldUrl])
    return res.rows[0]?.new_url || null
  } catch {
    return null
  } finally {
    client.release()
  }
}


