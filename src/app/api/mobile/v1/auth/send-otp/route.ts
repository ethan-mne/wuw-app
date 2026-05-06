import { NextResponse } from 'next/server';
import { sendMobileOtp, sendOtpSchema } from '@/server/mobile/otp.service';

export async function POST(request: Request) {
  const json = (await request.json()) as unknown;
  const parsed = sendOtpSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const result = await sendMobileOtp(parsed.data.email);
  return NextResponse.json(result);
}
