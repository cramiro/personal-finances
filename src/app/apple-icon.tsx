import { ImageResponse } from 'next/og';

// iOS applies its own rounded corners — no border-radius here
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 108,
            fontWeight: 800,
            color: '#1D9E75',
            fontFamily: 'sans-serif',
            lineHeight: 1,
            marginTop: 8,
          }}
        >
          g
        </span>
      </div>
    ),
    { ...size },
  );
}
