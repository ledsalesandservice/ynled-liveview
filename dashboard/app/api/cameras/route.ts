import { NextRequest, NextResponse } from 'next/server';

const VPS = process.env.NEXT_PUBLIC_API_URL;
const TOKEN = process.env.API_TOKEN;

function headers() {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

export async function GET() {
  const res = await fetch(`${VPS}/api/v1/cameras`, { headers: headers(), cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${VPS}/api/v1/cameras`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
