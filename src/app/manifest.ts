import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'crackers.org.in',
    short_name: 'Crackers',
    description: 'Sivakasi crackers from verified, licensed sellers',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFBF4',
    theme_color: '#9B1C1C',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
