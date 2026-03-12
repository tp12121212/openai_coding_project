import { NextResponse } from 'next/server';
import { getJob } from '@/lib/orchestration/store';

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  return NextResponse.json({ job }, { status: 200 });
}
