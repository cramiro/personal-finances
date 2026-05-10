import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gastly',
    short_name: 'Gastly',
    description: 'La forma más rápida de trackear gastos del hogar',
    start_url: '/cargar',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1A1A1A',
    theme_color: '#1D9E75',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
