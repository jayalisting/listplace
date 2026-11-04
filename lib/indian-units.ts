/**
 * Indian Real Estate Measurement & Currency Conversion Utilities.
 * Tailored for Karnataka / Pan-India markets (Cent, Guntha, Acre, Sq Ft, Sq M, Sq Yd, Hectare).
 */

export type AreaUnit = "sq_ft" | "sq_m" | "sq_yd" | "cent" | "guntha" | "acre" | "hectare"

export interface AreaUnitOption {
  key: AreaUnit
  label: string
  shortLabel: string
  toSqMeters: number // Canonical conversion factor
}

// Canonical conversion factors to Square Meters (m²)
export const AREA_UNITS: Record<AreaUnit, AreaUnitOption> = {
  sq_ft: {
    key: "sq_ft",
    label: "Square Feet (sq ft)",
    shortLabel: "sq ft",
    toSqMeters: 0.092903,
  },
  sq_m: {
    key: "sq_m",
    label: "Square Meters (sq m)",
    shortLabel: "sq m",
    toSqMeters: 1.0,
  },
  sq_yd: {
    key: "sq_yd",
    label: "Square Yards (Gaj)",
    shortLabel: "sq yd",
    toSqMeters: 0.836127,
  },
  cent: {
    key: "cent",
    label: "Cents (Coastal Karnataka / Mangaluru)",
    shortLabel: "cents",
    toSqMeters: 40.4686, // 1 cent = 435.6 sq ft = 40.4686 sq m
  },
  guntha: {
    key: "guntha",
    label: "Gunthas (North Karnataka / Maharashtra)",
    shortLabel: "gunthas",
    toSqMeters: 101.17, // 1 guntha = 1,089 sq ft = 101.17 sq m
  },
  acre: {
    key: "acre",
    label: "Acres",
    shortLabel: "acres",
    toSqMeters: 4046.86, // 1 acre = 100 cents = 43,560 sq ft
  },
  hectare: {
    key: "hectare",
    label: "Hectares",
    shortLabel: "hectares",
    toSqMeters: 10000.0,
  },
}

export const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  sq_ft: "Square Feet (sq ft)",
  sq_m: "Square Meters (sq m)",
  sq_yd: "Square Yards (Gaj)",
  cent: "Cents (Mangaluru / Udupi)",
  guntha: "Gunthas (Karnataka)",
  acre: "Acres",
  hectare: "Hectares",
}

/**
 * Converts area from one unit to another via canonical square meters.
 */
export function convertArea(value: number, fromUnit: AreaUnit, toUnit: AreaUnit): number {
  if (!value || isNaN(value)) return 0
  if (fromUnit === toUnit) return value
  const sqMeters = value * AREA_UNITS[fromUnit].toSqMeters
  const converted = sqMeters / AREA_UNITS[toUnit].toSqMeters
  return parseFloat(converted.toFixed(3))
}

/**
 * Formats currency in Indian Numbering System (Lakhs & Crores).
 * Example: 3500000 -> "₹ 35 Lakh", 45000000 -> "₹ 4.50 Cr"
 */
export function formatIndianCurrency(amountInr: number, compact = false): string {
  if (amountInr === undefined || amountInr === null || isNaN(amountInr)) return "₹ 0"
  if (amountInr === 0) return "Price on Request"

  if (amountInr >= 10000000) {
    // 1 Crore = 10,000,000
    const cr = amountInr / 10000000
    return compact
      ? `₹ ${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`
      : `₹ ${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Crore`
  } else if (amountInr >= 100000) {
    // 1 Lakh = 100,000
    const lakh = amountInr / 100000
    return compact
      ? `₹ ${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} L`
      : `₹ ${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakh`
  } else {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amountInr)
  }
}

/**
 * Calculates and formats price per unit (e.g. ₹ 4.5 Lakh / cent, ₹ 8,500 / sq ft).
 */
export function formatPricePerUnit(
  totalPriceInr: number,
  areaValue: number,
  areaUnit: AreaUnit
): string {
  if (!totalPriceInr || !areaValue || areaValue <= 0) return ""
  const rate = totalPriceInr / areaValue
  const unitLabel = AREA_UNITS[areaUnit]?.shortLabel || areaUnit

  if (rate >= 10000000) {
    return `₹ ${(rate / 10000000).toFixed(2)} Cr / ${unitLabel}`
  } else if (rate >= 100000) {
    return `₹ ${(rate / 100000).toFixed(2)} Lakh / ${unitLabel}`
  } else {
    return `₹ ${Math.round(rate).toLocaleString("en-IN")} / ${unitLabel}`
  }
}
