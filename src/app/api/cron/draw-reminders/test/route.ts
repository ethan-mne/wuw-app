import { handleDrawReminderCron } from '@/server/draw-reminders/cron-http';

export const dynamic = 'force-dynamic';

function withTestFlag(request: Request): Request {
  const url = new URL(request.url);
  url.searchParams.set('test', 'true');
  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
  });
}

export async function GET(request: Request) {
  return handleDrawReminderCron(withTestFlag(request));
}

export async function POST(request: Request) {
  return handleDrawReminderCron(withTestFlag(request));
}
