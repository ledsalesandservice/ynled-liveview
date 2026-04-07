import { NextResponse } from 'next/server';

const VPS = process.env.NEXT_PUBLIC_API_URL;
const TOKEN = process.env.API_TOKEN;

export async function GET() {
  const res = await fetch(`${VPS}/api/v1/stats`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
