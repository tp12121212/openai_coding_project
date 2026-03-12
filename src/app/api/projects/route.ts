import path from 'node:path';
import { NextResponse } from 'next/server';
import { CreateProjectRequestSchema } from '@/lib/generator/schema';
import { createProjectScaffold } from '@/lib/generator/service';

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = CreateProjectRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const outputRoot = process.env.OUTPUT_ROOT
      ? path.resolve(process.env.OUTPUT_ROOT)
      : path.resolve(process.cwd(), 'output');

    const result = await createProjectScaffold(parsed.data, outputRoot);
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
