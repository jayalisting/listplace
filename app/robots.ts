import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jayalisting.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/admin',
          '/api/admin/',
          '/add-listing',
          '/add-listing/',
          '/api/upload',
        ],
      },
      {
        userAgent: ['Googlebot-Image', 'Bingbot'],
        allow: ['/uploads/', '/placeholder.jpg', '/'],
        disallow: ['/admin', '/api/admin'],
      },
      {
        userAgent: [
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'Perplexity-User',
          'Claude-SearchBot',
          'Claude-User',
        ],
        allow: [
          '/',
          '/residential',
          '/commercial',
          '/industrial',
          '/agriculture',
          '/property/*',
          '/api/properties',
          '/llms.txt',
          '/uploads/',
        ],
        disallow: ['/admin', '/api/admin', '/add-listing'],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'CCBot'],
        allow: ['/', '/llms.txt'],
        disallow: ['/admin', '/api/admin', '/add-listing', '/api/', '/uploads/'],
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap-images.xml`],
    host: baseUrl,
  }
}
