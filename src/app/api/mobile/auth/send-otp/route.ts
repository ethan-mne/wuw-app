import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendOTPmail } from '@/app/[locale]/(auth)/login/actions';

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const json = (await request.json()) as unknown;
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const result = await sendOTPmail(parsed.data.email);
  return NextResponse.json(result);
}
