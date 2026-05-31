import { NextResponse } from 'next/server';
import { z } from 'zod';

import { loginWithDemoEmail } from '@/server/auth/demo-login';

export const dynamic = 'force-dynamic';

const demoLoginSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const json = (await request.json()) as unknown;
  const parsed = demoLoginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const result = await loginWithDemoEmail(parsed.data.email);

  if (result.status === 'error') {
    if (result.code === 'disabled') {
      return NextResponse.json({ error: 'Demo login is disabled' }, { status: 403 });
    }
    if (result.code === 'invalid_email') {
      return NextResponse.json({ status: 'error', code: 'invalid_email' }, { status: 200 });
    }
    return NextResponse.json({ status: 'error', code: 'unexpected' }, { status: 500 });
  }

  return NextResponse.json({ token: result.token });
}
