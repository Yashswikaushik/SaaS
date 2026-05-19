import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import CookieBanner from '@/components/marketing/cookie-banner-mount';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Bharat Leads — B2B leads + mapped CRM for India', template: '%s · Bharat Leads' },
  description:
    'Find verified Indian B2B leads on a map, write AI cold emails in English or Hindi, route your field reps, and close — built for Indian SMBs.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  applicationName: 'Bharat Leads',
  authors: [{ name: 'Bharat Leads' }],
  keywords: [
    'B2B leads India',
    'CRM India',
    'cold email India',
    'WhatsApp marketing',
    'mapped CRM',
    'lead finder India',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Bharat Leads',
    title: 'Bharat Leads — B2B leads + mapped CRM',
    description: 'Find verified Indian B2B leads on a map and close faster with AI + WhatsApp.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bharat Leads — B2B leads + mapped CRM',
    description: 'Find verified Indian B2B leads on a map and close faster.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1437' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <Providers>
          <Toaster>{children}</Toaster>
        </Providers>
        <CookieBanner />
      </body>
    </html>
  );
}
