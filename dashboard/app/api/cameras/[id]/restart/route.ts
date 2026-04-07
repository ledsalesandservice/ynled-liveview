import { NextRequest, NextResponse } from 'next/server';

const VPS = process.env.NEXT_PUBLIC_API_URL;
const TOKEN = process.env.API_TOKEN;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${VPS}/api/v1/cameras/${params.id}/restart`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
