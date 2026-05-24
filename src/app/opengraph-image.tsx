import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0E1117',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '0 100px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#1D9E75',
            letterSpacing: '-2px',
            fontFamily: 'sans-serif',
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          gastly
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: '#F2F2F0',
            fontFamily: 'sans-serif',
            lineHeight: 1.25,
            maxWidth: 750,
            marginBottom: 28,
          }}
        >
          Sabé en qué gastás, sin que sea un trabajo.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#6B6B6B',
            fontFamily: 'sans-serif',
          }}
        >
          Registro de gastos del hogar para hogares argentinos
        </div>

        {/* Accent dot */}
        <div
          style={{
            position: 'absolute',
            right: 100,
            top: '50%',
            width: 200,
            height: 200,
            borderRadius: 100,
            background: '#1D9E75',
            opacity: 0.12,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
