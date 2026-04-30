import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db';

const bodySchema = z.object({
  otpId: z.string().min(1),
});

export async function POST(request: Request) {
  const json = (await request.json()) as unknown;
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const otp = await db.oTP.findFirst({
    where: {
      id: parsed.data.otpId,
      used: false,
      expires: {
        gte: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json({ valid: Boolean(otp) });
}
