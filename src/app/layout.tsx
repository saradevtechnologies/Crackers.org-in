import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Noto_Sans_Tamil, Playfair_Display, Poppins } from 'next/font/google';
import { SwRegister } from '@/components/SwRegister';
import { RouteProgress } from '@/components/RouteProgress';
import './globals.css';

const sans = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' });
const display = Playfair_Display({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap' });
const tamil = Noto_Sans_Tamil({ subsets: ['tamil'], weight: ['400', '500', '600'], variable: '--font-tamil', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'crackers.org.in · Sivakasi crackers from verified sellers', template: '%s · crackers.org.in' },
  description: 'Buy Sivakasi crackers and gift boxes directly from licensed, verified sellers.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Crackers', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = {
  themeColor: '#9B1C1C',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${tamil.variable}`}>
      <body>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
