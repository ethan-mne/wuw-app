import { createDecipheriv } from 'crypto';
import { z } from 'zod';

export const PaymentPayloadSchema = z.object({
  id: z.string(),
  paymentType: z.string(),
  paymentBrand: z.string(),
  presentationAmount: z.string(),
  presentationCurrency: z.string(),
  descriptor: z.string().optional(),
  merchantTransactionId: z.string().optional(),
  result: z.object({
    code: z.string(),
    description: z.string(),
  }),
  resultDetails: z.record(z.string()).optional(),
  // card: z.object({
  //   bin: z.string(),
  //   last4Digits: z.string(),
  //   holder: z.string(),
  //   expiryMonth: z.string(),
  //   expiryYear: z.string(),
  // }),
});

export const PaymentResponseSchema = z.object({
  type: z.enum(['PAYMENT', 'REGISTRATION', 'SCHEDULE', 'RISK']),
  action: z.enum(['CREATED', 'UPDATED', 'DELETED']).optional(),
  payload: PaymentPayloadSchema,
});

const EncryptedWebhookBodySchema = z.object({
  encryptedBody: z.string(),
});

type EncryptedWebhookBody = z.infer<typeof EncryptedWebhookBodySchema>;

export async function decryptRequest(
  body: unknown,
  headers: Headers,
  secret: string,
): Promise<{
  data: z.infer<typeof PaymentResponseSchema> | null;
  error: string | null;
}> {
  try {
    console.log('🔑 Starting decryption process...');
    // console.log('Secret length:', secret.length);
    // Get headers
    const authTag = headers.get('x-authentication-tag');
    const initVector = headers.get('x-initialization-vector');
    // Check required headers
    if (!authTag || !initVector) {
      return {
        data: null,
        error: '❌ Missing required headers for decryption',
      };
    }

    // Get and validate request body
    const rawBody = body as Partial<EncryptedWebhookBody>;
    console.log('📦 Raw body received:', {
      encryptedBodyLength: rawBody.encryptedBody?.length ?? 0,
      sample: rawBody.encryptedBody
        ? rawBody.encryptedBody.slice(0, 20) + '...'
        : 'N/A',
    });

    const parseResult = EncryptedWebhookBodySchema.safeParse(rawBody);

    if (!parseResult.success) {
      return {
        data: null,
        error: '❌ Invalid encrypted body format',
      };
    }

    // Convert to buffers
    console.log('🔄 Converting inputs to buffers...');
    const key = Buffer.from(secret, 'hex');
    const iv = Buffer.from(initVector, 'hex');
    const tag = Buffer.from(authTag, 'hex');
    const encrypted = Buffer.from(parseResult.data.encryptedBody, 'hex');

    console.log('📊 Buffer lengths:', {
      key: key.length,
      iv: iv.length,
      tag: tag.length,
      encrypted: encrypted.length,
    });

    // Create decipher with AES-256-GCM
    console.log('🔓 Creating decipher...');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    // Decrypt the payload
    console.log('🔄 Decrypting payload...');
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    console.log('📝 Decrypted length:', decrypted.length);
    console.log(
      '📝 Decrypted sample:',
      decrypted.toString().slice(0, 100) + '...',
    );

    // Parse and validate the decrypted JSON
    console.log('🔍 Parsing and validating JSON...');
    const decryptedJson = JSON.parse(decrypted.toString()) as Record<
      string,
      unknown
    >;
    console.log('📋 Parsed JSON keys:', Object.keys(decryptedJson));

    const paymentResponse = PaymentResponseSchema.safeParse(decryptedJson);
    if (!paymentResponse.success) {
      console.error('❌ Invalid decrypted JSON format:', paymentResponse.error);
      return {
        data: null,
        error: '❌ Invalid decrypted JSON format',
      };
    }
    console.log('✅ Successfully validated payment response schema');
    return {
      data: paymentResponse.data,
      error: null,
    };
  } catch (error) {
    console.error('❌ Webhook decryption error:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return {
      data: null,
      error: '❌ Webhook decryption error',
    };
  }
}

export function isValidPaymentCode(code: string): boolean {
  const confirmedCode = /^(000.000.|000.100.1|000.[36]|000.400.[1][12]0)/;
  return confirmedCode.test(code);
}

export function isPendingPaymentCode(code: string): boolean {
  const pendingCode = /^(000\.200)/;
  return pendingCode.test(code);
}

export function isErrorPaymentCode(code: string): boolean {
  const chargebackCode = /^(000\.100\.2)/;
  const rejectedCode = /^(100\.39[765])/;
  const rejectdExternalCode = /^(800\.[17]00|800\.800\.[123])/;
  const threeDSecureCode = /^(800\.400\.2|100\.390)/;
  return (
    chargebackCode.test(code) ||
    rejectedCode.test(code) ||
    rejectdExternalCode.test(code) ||
    threeDSecureCode.test(code)
  );
}
