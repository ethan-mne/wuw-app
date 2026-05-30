import { NextResponse } from 'next/server';

import { MobileHttpError } from '@/server/mobile/http';
import {
  deleteUserPushDeviceByToken,
  getUserPushDeviceStatus,
  upsertPushDeviceSchema,
  upsertUserPushDevice,
} from '@/server/mobile/push-devices.service';

export const dynamic = 'force-dynamic';

function tokenPrefix(token: string): string {
  return token.length <= 12 ? token : `${token.slice(0, 8)}…${token.slice(-4)}`;
}

export async function GET() {
  try {
    const status = await getUserPushDeviceStatus();
    console.log('[mobile/push-token] GET ok', status);
    return NextResponse.json({ data: status });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      console.warn('[mobile/push-token] GET', error.status, error.message);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const json = (await request.json()) as unknown;
  const parsed = upsertPushDeviceSchema.safeParse(json);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? 'Invalid push token or payload';
    console.warn('[mobile/push-token] POST 400', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await upsertUserPushDevice(parsed.data);
    console.log('[mobile/push-token] POST ok', {
      platform: parsed.data.platform,
      tokenPrefix: tokenPrefix(parsed.data.token),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      console.warn('[mobile/push-token] POST', error.status, error.message);
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
