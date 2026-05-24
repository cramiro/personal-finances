import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const city    = req.headers.get('x-vercel-ip-city') ?? null;
  const country = req.headers.get('x-vercel-ip-country');

  if (!city && !country) {
    return NextResponse.json({ location: null });
  }

  const decodedCity = city ? decodeURIComponent(city) : null;
  const parts = [decodedCity, country].filter(Boolean);
  return NextResponse.json({ location: parts.join(', ') });
}
