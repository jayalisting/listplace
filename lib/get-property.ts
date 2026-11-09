import { getDbPropertyById } from "./db"
import { getLuxuryPropertyById, LuxuryProperty } from "./luxury-properties"

export async function fetchPropertyById(id: string): Promise<LuxuryProperty | null> {
  // Try PostgreSQL first with explicit column selection and cached amenities lookup
  try {
    const dbProperty = await getDbPropertyById(id)
    if (dbProperty) {
      return dbProperty
    }
  } catch {
    // Database unavailable — silently fall back to static properties
  }

  // Fallback to static bundled luxury properties
  return getLuxuryPropertyById(id) || null
}
