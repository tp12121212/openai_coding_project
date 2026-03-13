import { NextResponse } from 'next/server';
import { getRuntimeConfigStatus, logRuntimeConfigValidation } from '@/lib/runtime-config';

export async function GET() {
  logRuntimeConfigValidation('runtime config check endpoint');
  return NextResponse.json(getRuntimeConfigStatus(), { status: 200 });
}
