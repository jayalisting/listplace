import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Phase 5 Image Tuning:
    // Limit deviceSizes, imageSizes, and qualities to prevent expensive combinatorial on-demand transforms
    deviceSizes: [640, 1080, 1600],
    imageSizes: [96, 256, 384],
    qualities: [75, 80],
    minimumCacheTTL: 31536000, // 1 year immutable Edge cache
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "jayalisting.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/llms.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ]
  },
}

export default nextConfig
