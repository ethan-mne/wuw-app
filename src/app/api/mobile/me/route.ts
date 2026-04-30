import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db';
import { getServerAuthSession } from '@/server/auth';

const updateProfileSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  country: z.string(),
  zip: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
});

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  return NextResponse.json({ data: user });
}

export async function PUT(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = (await request.json()) as unknown;
  const parsed = updateProfileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const input = parsed.data;
  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      firstName: input.firstname,
      lastName: input.lastname,
      email: input.email,
      phone: input.phone,
      zipCode: input.zip,
      address: input.address,
      city: input.city,
      country: input.country,
    },
  });

  return NextResponse.json({ data: updated });
}
