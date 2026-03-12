import { NextResponse } from 'next/server';
import { getBuiltInTemplates } from '@/lib/templates/library';

export async function GET() {
  return NextResponse.json({ templates: getBuiltInTemplates() });
}
