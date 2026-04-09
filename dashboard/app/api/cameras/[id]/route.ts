import { NextRequest, NextResponse } from 'next/server';

const VPS = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
const TOKEN = process.env.API_TOKEN;

function headers() {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${VPS}/api/v1/cameras/${params.id}`, { headers: headers(), cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const res = await fetch(`${VPS}/api/v1/cameras/${params.id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${VPS}/api/v1/cameras/${params.id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
