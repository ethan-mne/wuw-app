import 'server-only';
import { S3Client } from '@aws-sdk/client-s3';
import { env } from '@/env';
export const s3 = new S3Client({
  credentials: {
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: 'AKIAQ3XMJ254HVCDC5NT',
  },
  region: 'eu-west-3',
});
