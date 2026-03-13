import { NextResponse } from 'next/server';
import { createZipBuffer } from '@/lib/generator/service';
import { CreateProjectRequestSchema } from '@/lib/generator/schema';
import { buildScaffold } from '@/lib/generator/scaffold';

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = CreateProjectRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scaffold = buildScaffold(parsed.data);
  const buffer = await createZipBuffer(scaffold.files);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${parsed.data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.zip"`
    }
  });
}
