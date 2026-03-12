import { NextResponse } from 'next/server';
import { CreateProjectRequestSchema } from '@/lib/generator/schema';
import { buildScaffold } from '@/lib/generator/scaffold';
import { stableJSONStringify } from '@/lib/utils/deterministic';

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = CreateProjectRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scaffold = buildScaffold(parsed.data);
  return new NextResponse(stableJSONStringify(scaffold.manifest), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  });
}
