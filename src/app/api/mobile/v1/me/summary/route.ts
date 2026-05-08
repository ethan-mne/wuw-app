import { NextResponse } from 'next/server';
import { MobileHttpError } from '@/server/mobile/http';
import { getMobileAccountSummary } from '@/server/mobile/me.service';

export async function GET() {
  try {
    const summary = await getMobileAccountSummary();
    return NextResponse.json({ data: summary });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
