import { NextResponse } from 'next/server';
import { signMobileSessionToken } from '@/server/mobile/mobile-session-token';
import { consumeMobileOtp, verifyOtpSchema } from '@/server/mobile/otp.service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const json = (await request.json()) as unknown;
  const parsed = verifyOtpSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const user = await consumeMobileOtp(parsed.data.otpId, parsed.data.otp);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
  }

  const token = await signMobileSessionToken(user.id, user.email ?? null);
  return NextResponse.json({ token });
}
