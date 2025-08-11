import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  const body = { env:'OK', policies:{ byok:true }, build:{ tag:'qaadi-5.1-cloud-p1' } };
  const res = NextResponse.json(body);
  res.headers.set('Cache-Control','no-store');
  res.headers.set('X-Content-Type-Options','nosniff');
  return res;
}
