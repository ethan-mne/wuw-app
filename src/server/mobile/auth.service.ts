import { getServerAuthSession } from '@/server/auth';
import { MobileHttpError } from '@/server/mobile/http';

type SessionRequirement = 'userId' | 'email';

export async function requireMobileSession(requirement: SessionRequirement) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  const email = session?.user?.email ?? null;

  if (!session?.user || !userId) {
    throw new MobileHttpError('Unauthorized', 401);
  }

  if (requirement === 'email' && !email) {
    throw new MobileHttpError('Unauthorized', 401);
  }

  return {
    session,
    userId,
    email,
  };
}
