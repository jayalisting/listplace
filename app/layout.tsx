import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jayalisting.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#881337' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'JayaListing | Luxury Real Estate & Commercial Assets',
    template: '%s | JayaListing',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#881337',
      },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JayaListing',
  },
  other: {
    'msapplication-TileColor': '#881337',
    'msapplication-config': '/browserconfig.xml',
  },
  description:
    'Discover curated luxury residences, commercial towers, industrial logistics parks, and prime farmlands in India with verified clear legal titles on JayaListing.',
  keywords: [
    'JayaListing',
    'luxury real estate India',
    'duplex penthouses Mumbai',
    'commercial land Mangaluru',
    'industrial logistics warehouse',
    'agricultural farmland Karnataka',
    'Jaya Developers',
    'Jaya Listing Estates',
  ],
  authors: [{ name: 'JayaListing' }],
  creator: 'JayaListing',
  publisher: 'Jaya Developers',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'JayaListing',
    title: 'JayaListing | Luxury Real Estate & Commercial Assets',
    description:
      'Curated residential mansions, commercial developments, and industrial parks with verified legal titles.',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'JayaListing Luxury Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JayaListing | Luxury Real Estate',
    description:
      'Curated residential mansions, commercial towers, and industrial estates across India on JayaListing.',
    images: ['/placeholder.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const siteSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'JayaListing',
      description: 'Exclusive Luxury Real Estate and Commercial Asset Portfolio in India',
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
      inLanguage: 'en-IN',
    },
    {
      '@type': 'RealEstateAgent',
      '@id': `${SITE_URL}/#organization`,
      name: 'JayaListing',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      telephone: '+91 82965 30609',
      email: 'concierge@jayalisting.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Mangaluru',
        addressRegion: 'Karnataka',
        addressCountry: 'IN',
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
