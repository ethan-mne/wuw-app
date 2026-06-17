import { NextResponse } from 'next/server';
import { MobileHttpError } from '@/server/mobile/http';
import { listMobileActiveEntries } from '@/server/mobile/me.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const entries = await listMobileActiveEntries();
    return NextResponse.json({ data: entries });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
