import { NextResponse } from 'next/server';
import { MobileHttpError } from '@/server/mobile/http';
import {
  getMobileProfile,
  mobileProfileUpdateSchema,
  updateMobileProfile,
} from '@/server/mobile/me.service';

export async function GET() {
  try {
    const user = await getMobileProfile();
    return NextResponse.json({ data: user });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PUT(request: Request) {
  const json = (await request.json()) as unknown;
  const parsed = mobileProfileUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const updated = await updateMobileProfile(parsed.data);
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
