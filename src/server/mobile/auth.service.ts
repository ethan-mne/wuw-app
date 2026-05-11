import { headers } from 'next/headers';

import { getServerAuthSession } from '@/server/auth';
import { MobileHttpError } from '@/server/mobile/http';
import { verifyMobileSessionToken } from '@/server/mobile/mobile-session-token';

type SessionRequirement = 'userId' | 'email';

export async function requireMobileSession(requirement: SessionRequirement) {
  const headerList = await headers();
  const authHeader = headerList.get('authorization');

  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const raw = authHeader.slice(7).trim();
    if (!raw) {
      throw new MobileHttpError('Unauthorized', 401);
    }
    const payload = await verifyMobileSessionToken(raw);
    if (!payload?.sub) {
      throw new MobileHttpError('Unauthorized', 401);
    }
    const userId = payload.sub;
    const email = payload.email;
    if (requirement === 'email' && !email) {
      throw new MobileHttpError('Unauthorized', 401);
    }
    const session = await getServerAuthSession();
    return {
      session,
      userId,
      email,
    };
  }

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
