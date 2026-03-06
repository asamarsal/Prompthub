import type { Metadata, Viewport } from 'next'
import { Outfit, Oxanium } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: 'PromptChain // Future Edition - The Prompt Economy',
  description: 'Buy, sell, and trade AI prompts on Bitcoin. Marketplace powered by the Stacks network.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${oxanium.variable} font-sans antialiased overflow-x-hidden`}>
        {children}
        <Toaster theme="dark" />
        <Analytics />
      </body>
    </html>
  )
}
