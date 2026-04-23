import type { Metadata, Viewport } from 'next'
import { DM_Sans, JetBrains_Mono, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const syne = Syne({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-syne' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-jetbrains-mono' })
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000'
const metadataBase = new URL(siteUrl)

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'Coldmailr | AI Cold Email Workspace',
    template: '%s | Coldmailr',
  },
  description: 'AI-powered cold email workspace for drafting, sending, and tracking personalized outreach.',
  applicationName: 'Coldmailr',
  keywords: [
    'cold email',
    'email outreach',
    'AI email writer',
    'gmail integration',
    'sales outreach',
    'freelance outreach',
  ],
  generator: '',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Coldmailr | AI Cold Email Workspace',
    description: 'Draft, optimize, send, and manage cold emails with AI and Gmail integration.',
    siteName: 'Coldmailr',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Coldmailr logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coldmailr | AI Cold Email Workspace',
    description: 'Draft, optimize, send, and manage cold emails with AI and Gmail integration.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        url: '/icons/manifest-icon-192.maskable.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/manifest-icon-512.maskable.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/icons/apple-icon-180.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#0F0F0F] dark">
      <body className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#0F0F0F] text-white`}>
        {children}
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
