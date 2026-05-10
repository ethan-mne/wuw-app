import { db } from '@/server/db';

interface CouponResult {
  code: string | null;
}

export async function getReferralCouponCodeByEmail(
  email: string,
): Promise<string | null> {
  if (!email) {
    return null;
  }
  try {
    const coupon = await db.$queryRaw<CouponResult[]>`
      select r.code  from referrals r 
      left join User u on r.user_id = u.id 
      where u.email = ${email}
    `;
    return coupon[0] ? coupon[0].code : null;
  } catch (e) {
    console.log(e);
    return null;
  }
}
