import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const subscribeDrawAlertBodySchema = z
  .object({
    token: z.string().min(1).max(512).optional(),
    platform: z.enum(['android', 'ios']).optional(),
    apnsEnvironment: z.enum(['sandbox', 'production']).optional(),
    delivery: z.enum(['local', 'push']).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.token) {
      return;
    }
    if (!data.platform) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'platform is required when token is provided',
        path: ['platform'],
      });
    }
  });

describe('subscribeDrawAlertBodySchema', () => {
  it('accepts empty body for local-only subscription', () => {
    expect(subscribeDrawAlertBodySchema.safeParse({}).success).toBe(true);
    expect(subscribeDrawAlertBodySchema.safeParse({ delivery: 'local' }).success).toBe(true);
  });

  it('requires platform when token is provided', () => {
    expect(
      subscribeDrawAlertBodySchema.safeParse({ token: 'abc', delivery: 'push' }).success,
    ).toBe(false);
  });
});
