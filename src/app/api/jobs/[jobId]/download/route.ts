import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getJob } from '@/lib/orchestration/store';

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

function getDownloadName(bundlePath: string): string {
  const parsed = path.basename(bundlePath);
  return parsed.toLowerCase().endsWith('.zip') ? parsed : `${parsed}.zip`;
}

export async function GET(_: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = getJob(jobId);
  const bundlePath = typeof job?.result?.bundlePath === 'string' ? job.result.bundlePath : null;

  if (!bundlePath || job?.state !== 'completed') {
    return NextResponse.json({ error: 'Bundle is not available for this job.' }, { status: 404 });
  }

  try {
    const buffer = await fs.readFile(bundlePath);
    const fileName = getDownloadName(bundlePath);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch {
    return NextResponse.json({ error: 'Unable to read bundle file.' }, { status: 410 });
  }
}
