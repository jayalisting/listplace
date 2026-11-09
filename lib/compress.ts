import zlib from "zlib"

/**
 * 1-Byte Format Version Header:
 * 0x00: Raw UTF-8 payload (used when size < 512 bytes to avoid negative compression ratio)
 * 0x01: Brotli-compressed payload (quality 6 - optimal ratio/CPU balance for serverless writes)
 */
const FORMAT_RAW = 0x00
const FORMAT_BROTLI = 0x01
const COMPRESSION_THRESHOLD_BYTES = 512

/**
 * Encodes a text string into a compact binary buffer with a 1-byte format header.
 * Skips Brotli compression if the raw byte size is below 512 bytes.
 */
export function encodeText(input: string | null | undefined): Buffer | null {
  if (input === null || input === undefined) return null
  const str = String(input)
  if (str.length === 0) return Buffer.from([FORMAT_RAW])

  const rawBuffer = Buffer.from(str, "utf8")
  if (rawBuffer.length < COMPRESSION_THRESHOLD_BYTES) {
    const output = Buffer.allocUnsafe(rawBuffer.length + 1)
    output[0] = FORMAT_RAW
    rawBuffer.copy(output, 1)
    return output
  }

  // Compress using Brotli with Quality 6 (balanced for fast serverless execution)
  const compressed = zlib.brotliCompressSync(rawBuffer, {
    params: {
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      [zlib.constants.BROTLI_PARAM_QUALITY]: 6,
    },
  })

  // If compression didn't actually reduce size, store as raw
  if (compressed.length >= rawBuffer.length) {
    const output = Buffer.allocUnsafe(rawBuffer.length + 1)
    output[0] = FORMAT_RAW
    rawBuffer.copy(output, 1)
    return output
  }

  const output = Buffer.allocUnsafe(compressed.length + 1)
  output[0] = FORMAT_BROTLI
  compressed.copy(output, 1)
  return output
}

/**
 * Decodes a binary buffer into a UTF-8 string according to its 1-byte format header.
 * Transparently falls back to raw string decoding if uncompressed or legacy plain text.
 */
export function decodeText(buffer: Buffer | Uint8Array | null | undefined): string {
  if (!buffer || buffer.length === 0) return ""
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)

  const header = buf[0]
  if (header === FORMAT_RAW) {
    return buf.subarray(1).toString("utf8")
  }

  if (header === FORMAT_BROTLI) {
    try {
      const decompressed = zlib.brotliDecompressSync(buf.subarray(1))
      return decompressed.toString("utf8")
    } catch (err) {
      console.warn("[lib/compress] Brotli decompression fallback to raw:", err)
      return buf.toString("utf8")
    }
  }

  // Legacy or raw buffer without format header
  return buf.toString("utf8")
}

/**
 * Encodes an arbitrary JavaScript object/JSON into a compact binary buffer.
 */
export function encodeJson(data: any): Buffer | null {
  if (data === null || data === undefined) return null
  const jsonString = JSON.stringify(data)
  return encodeText(jsonString)
}

/**
 * Decodes a binary buffer back into a parsed JSON object.
 */
export function decodeJson<T = any>(buffer: Buffer | Uint8Array | null | undefined): T | null {
  if (!buffer || buffer.length === 0) return null
  const text = decodeText(buffer)
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch (err) {
    console.warn("[lib/compress] JSON parse error on decoded buffer:", err)
    return null
  }
}
