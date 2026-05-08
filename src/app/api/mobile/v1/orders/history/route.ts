import { NextResponse } from 'next/server';
import { MobileHttpError } from '@/server/mobile/http';
import { listMobileOrderHistory } from '@/server/mobile/orders.service';

export async function GET() {
  try {
    const orders = await listMobileOrderHistory();
    return NextResponse.json({ data: orders });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
