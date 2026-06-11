import { db } from '@/server/db';
import { requireMobileSession } from '@/server/mobile/auth.service';
import { MobileHttpError } from '@/server/mobile/http';

export async function requireAdminSession() {
  const { session, userId } = await requireMobileSession('userId');

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { is_admin: true, email: true },
  });

  if (!user?.is_admin) {
    throw new MobileHttpError('Forbidden', 403);
  }

  return {
    session,
    userId,
    email: user.email,
  };
}
