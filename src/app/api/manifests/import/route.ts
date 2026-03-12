import { NextResponse } from 'next/server';
import { importManifest } from '@/lib/generator/service';

export async function POST(request: Request) {
  const payload = await request.text();
  try {
    const manifest = importManifest(payload);
    return NextResponse.json({ manifest });
  } catch {
    return NextResponse.json({ error: 'Invalid manifest JSON.' }, { status: 400 });
  }
}
