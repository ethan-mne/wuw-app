import { NextResponse } from 'next/server';

import { MobileHttpError } from '@/server/mobile/http';
import { listMobileReferralUsages } from '@/server/mobile/referrals.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const usages = await listMobileReferralUsages();
    return NextResponse.json({ data: usages });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
