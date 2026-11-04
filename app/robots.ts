import { MetadataRoute } from 'next'
import { getImageSeoSettings } from '@/lib/db'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jayalisting.com'
  let settings = null
  try {
    settings = await getImageSeoSettings()
  } catch {
    // fallback gracefully
  }

  const rules: MetadataRoute.Robots['rules'] = [
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
  ]

  // Image Search Crawlers
  if (settings?.crawlerRules) {
    const { googlebotImage, bingbot, gptBot, oaiSearchBot, chatGptUser, claudeBot, claudeSearchBot, claudeUser, perplexityBot, perplexityUser, ccBot } = settings.crawlerRules

    if (googlebotImage) {
      rules.push({ userAgent: 'Googlebot-Image', allow: ['/uploads/', '/placeholder.jpg', '/'] })
    } else {
      rules.push({ userAgent: 'Googlebot-Image', disallow: ['/uploads/'] })
    }

    if (bingbot) {
      rules.push({ userAgent: 'Bingbot', allow: ['/', '/uploads/'], disallow: ['/admin', '/api/admin'] })
    }

    // AI Search Crawlers
    const allowedAiSearch: string[] = []
    const disallowedAiSearch: string[] = []

    if (oaiSearchBot) allowedAiSearch.push('OAI-SearchBot')
    else disallowedAiSearch.push('OAI-SearchBot')

    if (chatGptUser) allowedAiSearch.push('ChatGPT-User')
    else disallowedAiSearch.push('ChatGPT-User')

    if (perplexityBot) allowedAiSearch.push('PerplexityBot')
    else disallowedAiSearch.push('PerplexityBot')

    if (perplexityUser) allowedAiSearch.push('Perplexity-User')
    else disallowedAiSearch.push('Perplexity-User')

    if (claudeSearchBot) allowedAiSearch.push('Claude-SearchBot')
    else disallowedAiSearch.push('Claude-SearchBot')

    if (claudeUser) allowedAiSearch.push('Claude-User')
    else disallowedAiSearch.push('Claude-User')

    if (allowedAiSearch.length > 0) {
      rules.push({
        userAgent: allowedAiSearch,
        allow: ['/', '/residential', '/commercial', '/industrial', '/agriculture', '/property/*', '/api/properties', '/llms.txt', '/uploads/'],
        disallow: ['/admin', '/api/admin', '/add-listing'],
      })
    }

    if (disallowedAiSearch.length > 0) {
      rules.push({
        userAgent: disallowedAiSearch,
        disallow: ['/'],
      })
    }

    // AI Training Scrapers
    const blockedScrapers: string[] = []
    if (!gptBot) blockedScrapers.push('GPTBot')
    if (!claudeBot) blockedScrapers.push('ClaudeBot')
    if (!ccBot) blockedScrapers.push('CCBot')

    if (blockedScrapers.length > 0) {
      rules.push({
        userAgent: blockedScrapers,
        disallow: ['/uploads/', '/api/'],
        allow: ['/llms.txt'],
      })
    }
  } else {
    // Default fallback rules
    rules.push(
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
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
      }
    )
  }

  return {
    rules,
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap-images.xml`],
    host: baseUrl,
  }
}
