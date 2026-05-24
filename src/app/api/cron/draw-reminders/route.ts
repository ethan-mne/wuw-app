import { handleDrawReminderCron } from '@/server/draw-reminders/cron-http';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleDrawReminderCron(request);
}

export async function POST(request: Request) {
  return handleDrawReminderCron(request);
}
