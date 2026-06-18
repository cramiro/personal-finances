import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gastly.ar';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Gastly — Trackeo de gastos del hogar',
  description: 'Sabé en qué gastás, sin que sea un trabajo. Registro de gastos compartido para hogares argentinos.',
  applicationName: 'Gastly',
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'Gastly',
    title: 'Gastly — Trackeo de gastos del hogar',
    description: 'Sabé en qué gastás, sin que sea un trabajo. Registro compartido para hogares argentinos.',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gastly — Trackeo de gastos del hogar',
    description: 'Sabé en qué gastás, sin que sea un trabajo.',
    images: ['/opengraph-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gastly',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1D9E75',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
