import { pool } from "./db"
import { getLuxuryPropertyById, LuxuryProperty } from "./luxury-properties"

export async function fetchPropertyById(id: string): Promise<LuxuryProperty | null> {
  // Try database first, fall back to static luxury properties
  try {
    const client = await pool.connect()
    try {
      const res = await client.query("SELECT * FROM properties WHERE id = $1 LIMIT 1", [id])
      if (res.rows.length > 0) {
        const row = res.rows[0]
        return {
          id: row.id,
          title: row.title,
          tagline: row.tagline || "",
          category: row.category,
          propertyType: row.property_type,
          price: row.price,
          originalPrice: row.original_price,
          priceNumeric: Number(row.price_numeric || 0),
          priceSuffix: row.price_suffix,
          location: row.location,
          city: row.city,
          state: row.state,
          area: row.area,
          carpetArea: row.carpet_area,
          bedrooms: row.bedrooms,
          bathrooms: row.bathrooms,
          parking: row.parking,
          facing: row.facing,
          floor: row.floor,
          age: row.age,
          status: row.status,
          listingType: row.listing_type || "sell",
          rating: Number(row.rating || 4.9),
          reviews: Number(row.reviews || 12),
          isNew: row.is_new,
          isExclusive: row.is_exclusive,
          isTrophy: row.is_trophy,
          tags: Array.isArray(row.tags) ? row.tags : [],
          images: Array.isArray(row.images) ? row.images : [],
          description: row.description || "",
          highlights: Array.isArray(row.highlights) ? row.highlights : [],
          amenities: Array.isArray(row.amenities) ? row.amenities : [],
          subType: row.sub_type,
          purpose: row.purpose,
          ownership: row.ownership,
          visibility: row.visibility || "public",
          strengthScore: row.strength_score,
          verificationTier: row.verification_tier,
          attributes: row.attributes || {},
          facilities: row.facilities || [],
          documents: row.documents || [],
          customFaqs: Array.isArray(row.custom_faqs)
            ? row.custom_faqs
            : typeof row.custom_faqs === "string"
            ? JSON.parse(row.custom_faqs)
            : Array.isArray(row.attributes?.customFaqs)
            ? row.attributes.customFaqs
            : [],
          displayOrder: row.display_order !== null && row.display_order !== undefined ? Number(row.display_order) : 100,
          featuredHome: Boolean(row.featured_home),
          details: row.details || {},
          landmarks: row.landmarks || [],
          seller: row.seller || {},
          roi: row.roi,
          coordinates: row.coordinates || { lat: 18.9696, lng: 72.8081 },
        }
      }
    } finally {
      client.release()
    }
  } catch {
    // Database unavailable — silently fall back to static properties
  }

  return getLuxuryPropertyById(id) || null
}
