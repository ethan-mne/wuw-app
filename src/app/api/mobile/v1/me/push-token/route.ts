import { NextResponse } from 'next/server';

import { MobileHttpError } from '@/server/mobile/http';
import {
  deleteUserPushDeviceByToken,
  upsertPushDeviceSchema,
  upsertUserPushDevice,
} from '@/server/mobile/push-devices.service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const json = (await request.json()) as unknown;
  const parsed = upsertPushDeviceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await upsertUserPushDevice(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  let token: string | undefined;
  try {
    const json = (await request.json()) as { token?: unknown };
    token = typeof json.token === 'string' ? json.token : undefined;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (!token?.trim()) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  try {
    await deleteUserPushDeviceByToken(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
