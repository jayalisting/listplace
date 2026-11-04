import crypto from "crypto"
import { NextRequest } from "next/server"

const SALT = process.env.ADMIN_PASSWORD_SALT || "grolow_jaya_luxury_2026"
// Salted SHA-256 hash
const STORED_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  "e6bf92fba5a7991a2e2cb9ae080e740131649c197268f8d8eb4ec1077d20e41f"

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  "c28f9d01e4a68b209fa817293b04c81048e9c2f6d0a7e58b19a0f329d472c110"

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Validates candidate password against secure salted SHA-256 hash using timing-safe comparison.
 * The plaintext password is NEVER stored in any code or database file.
 */
export function verifyAdminPassword(candidate: string): boolean {
  if (!candidate || typeof candidate !== "string") return false

  const candidateHash = crypto
    .createHash("sha256")
    .update(candidate + SALT)
    .digest("hex")

  try {
    const a = Buffer.from(candidateHash, "hex")
    const b = Buffer.from(STORED_HASH, "hex")
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Generates a cryptographically signed session token.
 */
export function generateAdminSessionToken(): string {
  const timestamp = Date.now().toString()
  const random = crypto.randomBytes(16).toString("hex")
  const payload = `${timestamp}.${random}`
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex")

  return `${payload}.${signature}`
}

/**
 * Validates a signed session token.
 */
export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false

  const parts = token.split(".")
  if (parts.length !== 3) return false

  const [timestampStr, random, signature] = parts
  const timestamp = parseInt(timestampStr, 10)
  if (isNaN(timestamp)) return false

  // Check expiration
  if (Date.now() - timestamp > SESSION_DURATION_MS || timestamp > Date.now() + 60000) {
    return false
  }

  const payload = `${timestampStr}.${random}`
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex")

  try {
    const a = Buffer.from(signature, "hex")
    const b = Buffer.from(expectedSignature, "hex")
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Checks NextRequest for a valid admin session cookie or authorization header.
 */
export function verifyAdminRequest(req: NextRequest): boolean {
  // 1. Check HTTP-only cookie
  const cookieToken = req.cookies.get("jaya_admin_session")?.value
  if (cookieToken && verifyAdminSessionToken(cookieToken)) {
    return true
  }

  // 2. Check Authorization header (Bearer <token>)
  const authHeader = req.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7).trim()
    if (verifyAdminSessionToken(bearerToken)) {
      return true
    }
  }

  // 3. Check custom header x-admin-token
  const customToken = req.headers.get("x-admin-token")
  if (customToken && verifyAdminSessionToken(customToken)) {
    return true
  }

  return false
}
