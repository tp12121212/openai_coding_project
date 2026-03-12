import path from 'node:path';
import { NextResponse } from 'next/server';
import { CreateProjectRequestSchema } from '@/lib/generator/schema';
import { runOrchestration } from '@/lib/orchestration/service';

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = CreateProjectRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const outputRoot = process.env.OUTPUT_ROOT
    ? path.resolve(process.env.OUTPUT_ROOT)
    : path.resolve(process.cwd(), 'output');

  const { job, jobPath } = await runOrchestration(parsed.data, outputRoot);
  const status = job.state === 'failed' ? 500 : 201;
  return NextResponse.json({ job, jobPath }, { status });
}
