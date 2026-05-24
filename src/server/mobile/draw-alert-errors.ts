import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { MobileHttpError } from '@/server/mobile/http';

function isMissingDrawAlertTable(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2021' || error.code === 'P2022')
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes('draw_alert_subscription');
}

export function mapDrawAlertRouteError(error: unknown): NextResponse {
  if (error instanceof MobileHttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (isMissingDrawAlertTable(error)) {
    return NextResponse.json(
      {
        error:
          'Draw alerts are not available yet. Apply the draw-alert database migration on PlanetScale.',
      },
      { status: 503 },
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('MODULE_NOT_FOUND') && message.includes('vendor-chunks')) {
    return NextResponse.json(
      {
        error:
          'Server build is out of date. Stop the dev server, delete the .next folder, and run npm run dev again.',
      },
      { status: 503 },
    );
  }

  throw error;
}
