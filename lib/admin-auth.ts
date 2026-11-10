import crypto from "crypto"
import type { NextRequest } from "next/server"

const SALT = process.env.ADMIN_PASSWORD_SALT || "grolow_jaya_luxury_2026"
// Salted SHA-256 hash
const STORED_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  "1c69157757df9302d329b873ad599b6fc17a955865604a7924913358f232f3a2"

// PBKDF2 key derivation parameters (standard 100,000 iterations for secure brute-force defense)
const PBKDF2_ITERATIONS = 100000
const PBKDF2_KEYLEN = 64
const PBKDF2_DIGEST = "sha512"

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  "c28f9d01e4a68b209fa817293b04c81048e9c2f6d0a7e58b19a0f329d472c110"

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Validates candidate password at login using secure key derivation.
 * PBKDF2 runs only ONCE at login to avoid CPU strain on per-request checks.
 * Once verified, a signed HMAC session cookie is issued for sub-millisecond per-request verification.
 */
export function verifyAdminPassword(candidate: string): boolean {
  if (!candidate || typeof candidate !== "string") return false

  // 1. If PBKDF2 hash is configured in environment, verify against 100k iterations
  if (process.env.ADMIN_PBKDF2_HASH) {
    try {
      const derivedKey = crypto
        .pbkdf2Sync(candidate, SALT, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
        .toString("hex")
      const a = Buffer.from(derivedKey, "hex")
      const b = Buffer.from(process.env.ADMIN_PBKDF2_HASH, "hex")
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true
    } catch {}
  }

  // 2. Verified fallback against established salted SHA-256 hash
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
