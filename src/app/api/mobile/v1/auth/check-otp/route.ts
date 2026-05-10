import { NextResponse } from 'next/server';
import { checkOtpSchema, isMobileOtpValid } from '@/server/mobile/otp.service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const json = (await request.json()) as unknown;
  const parsed = checkOtpSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const valid = await isMobileOtpValid(parsed.data.otpId);
  return NextResponse.json({ valid });
}
