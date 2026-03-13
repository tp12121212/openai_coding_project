import path from 'node:path';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/auth';
import { CreateProjectRequestSchema } from '@/lib/generator/schema';
import { runOrchestration } from '@/lib/orchestration/service';

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = CreateProjectRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getServerSession(getAuthOptions());
  const token = session?.githubAccessToken;

  if (parsed.data.deliveryMode !== 'zip' && !token) {
    return NextResponse.json({ error: 'GitHub authentication is required for this delivery mode.' }, { status: 401 });
  }

  const outputRoot = process.env.OUTPUT_ROOT
    ? path.resolve(process.env.OUTPUT_ROOT)
    : path.resolve(process.cwd(), 'output');

  const { job, jobPath } = await runOrchestration(parsed.data, outputRoot, token);
  const status = job.state === 'failed' ? 500 : 201;
  return NextResponse.json({ job, jobPath }, { status });
}
