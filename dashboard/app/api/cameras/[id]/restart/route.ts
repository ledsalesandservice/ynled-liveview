import { NextRequest, NextResponse } from 'next/server';

const VPS = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
const TOKEN = process.env.API_TOKEN;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${VPS}/api/v1/cameras/${params.id}/restart`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
