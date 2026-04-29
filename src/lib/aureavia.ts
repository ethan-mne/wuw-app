import { createHash } from 'crypto';
import { env } from '@/env';
import type { Order } from '@prisma/client';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import { z } from 'zod';

// Zod schema for Aureavia notification parameters
export const aureaviaNotificationSchema = z.object({
  reply_code: z.string(),
  reply_desc: z.string(),
  trans_id: z.string(),
  trans_date: z.string(),
  trans_amount: z.string(),
  trans_currency: z.string(),
  trans_order: z.string(),
  merchant_id: z.string(),
  client_fullname: z.string(),
  client_phone: z.string(),
  client_email: z.string(),
  payment_details: z.string(),
  trans_type: z.string(),
  debit_company: z.string().optional(),
  debrefnum: z.string().optional(),
  bin_country: z.string(),
  pm: z.string(),
  StorageID: z.string(),
  ExpMonth: z.string().optional(),
  ExpYear: z.string().optional(),
  signature: z.string(),
});

export type AureaviaNotification = z.infer<typeof aureaviaNotificationSchema>;

export const ParsingAureaviaNotification = (formData: FormData) =>
  aureaviaNotificationSchema.parse(Object.fromEntries(formData.entries()));

export const HashFunc = (paymentOptions: Record<string, string>) =>
  createHash('sha256')
    .update(Object.values(paymentOptions).join('') + env.AUREAVIA_HASH_KEY)
    .digest()
    .toString('base64');

// base64( hash('sha256', trans_id + trans_order + reply_code + trans_amount + trans_currency + merchanthash))
export const verifyAureaviaSignature = (
  {
    trans_id,
    trans_order,
    reply_code,
    trans_amount,
    trans_currency,
    signature,
  }: AureaviaNotification,
  AUREAVIA_HASH_KEY = env.AUREAVIA_HASH_KEY,
) => {
  const dataString =
    trans_id +
    trans_order +
    reply_code +
    trans_amount +
    trans_currency +
    AUREAVIA_HASH_KEY;

  // Calculate the expected signature
  const expectedSignature = createHash('sha256')
    .update(dataString)
    .digest()
    .toString('base64');
  return signature === expectedSignature;
};

/**
 * Extracts the national number from an international phone number
 * @param phoneNumber The international phone number (e.g., +33618965447)
 * @returns The national number without country code
 * @throws Error if the phone number is invalid
 */
function getNationalNumber(phoneNumber: string): string {
  try {
    const parsedNumber = parsePhoneNumberWithError(phoneNumber);
    if (!parsedNumber.isValid()) {
      throw new Error('Invalid phone number');
    }
    return parsedNumber.nationalNumber.toString();
  } catch (error) {
    throw new Error(`Failed to parse phone number:`);
  }
}
export const generateAureaviaPaymentOptions = (
  order: Order,
  baseUrl: string,
  url_redirect: string,
  paymentId?: string,
) => {
  const paymentOptions = {
    merchantID: env.AUREAVIA_MERCHANT_ID,
    trans_type: '0', // '0' for Sale
    trans_amount: parseFloat(order.totalPrice.toString()).toFixed(2),
    trans_currency: 'GBP',
    trans_installments: '1',
    disp_payFor: `Order ID :${order.id}`,
    // `${baseUrl}/api/webhooks/aureavia/${order.id}`,
    notification_url: `http://winuwatch.com/api/webhooks/aureavia/${order.id}`,
    url_redirect,
    client_fullName: `${order.first_name} ${order.last_name}`,
    client_email: order.email,
    client_phoneNum: getNationalNumber(order.phone),
    client_billCountry: order.country ?? 'GB',
    client_billZipcode: order.zip,
    client_billCity: order.town,
    client_billAddress1: order.address,
    client_billState: order.town,
    trans_refNum:
      paymentId ?? `${order.id}-${Math.random().toString(36).substring(2, 8)}`, // Append the short UUID to the order ID
    PLID: order.id,
    terms_url: `${baseUrl}/terms-and-conditions`,
    // show_edit: 'false', // this is for the user to be able to edit the payment details on the Aureavia page (true/false)
  };
  // console.log(
  //   '🚀 ~ generateAureaviaPaymentOptions ~ paymentOptions:',
  //   paymentOptions,
  // );
  // TODO: I think null values need to be removed from the payment options
  const CleanPaymentOptions = Object.fromEntries(
    Object.entries(paymentOptions).filter(([_, value]) => value !== null),
  ) as Record<string, string>;

  return {
    paymentOptions: CleanPaymentOptions,
    signature: HashFunc(CleanPaymentOptions),
    queryParams: new URLSearchParams(CleanPaymentOptions),
  };
};
