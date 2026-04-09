import { NextResponse } from 'next/server';

const VPS = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
const TOKEN = process.env.API_TOKEN;

export async function GET() {
  const res = await fetch(`${VPS}/api/v1/health`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
