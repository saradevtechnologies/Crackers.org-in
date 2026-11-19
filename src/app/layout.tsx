import type { Metadata, Viewport } from 'next';
import { SwRegister } from '@/components/SwRegister';
import './globals.css';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Noto+Sans+Tamil:wght@400;500&display=swap"
        />
      </head>
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
