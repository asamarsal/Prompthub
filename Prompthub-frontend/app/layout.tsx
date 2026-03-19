import type { Metadata, Viewport } from 'next'
import { Outfit, Oxanium } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-display" });

import { WalletProvider } from '@/lib/wallet-context'

export const metadata: Metadata = {
  title: 'PromptHub // Dapps on Stacks',
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
      <head>
        {/* Fix for Wallet Extensions (Leather/Hiro) conflict with setImmediate polyfills */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && !window.setImmediate) {
                window.setImmediate = function(fn) {
                  var args = Array.prototype.slice.call(arguments, 1);
                  return setTimeout(function() {
                    fn.apply(null, args);
                  }, 0);
                };
                window.clearImmediate = clearTimeout;
              }
            `,
          }}
        />
      </head>
      <body className={`${outfit.variable} ${oxanium.variable} font-sans antialiased overflow-x-hidden`} suppressHydrationWarning>
        <WalletProvider>
          {children}
        </WalletProvider>
        <Toaster theme="dark" position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
