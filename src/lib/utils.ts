import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type ReferalType } from './types';

export const locales = ['en', 'es', 'fr', 'ja', 'il'] as const;

const DEFAULTLOCAL = 'en';

/**
 * Formats the given number or bigint as a currency using the specified locale.
 *
 * @param {number | bigint} value - The number or bigint to format as currency
 * @param {string} local - The locale to use for formatting (default is DEFAULTLOCAL)
 * @return {string} The formatted currency value
 */
export const Formater = (value: number | bigint, local = DEFAULTLOCAL) =>
  new Intl.NumberFormat(local, {
    style: 'currency',
    currency: 'GBP',
  }).format(value);

/**
 * Formats a given date value into a string representation using the specified local.
 *
 * @param {Date} value - The date value to be formatted.
 * @param {string} [local=DEFAULTLOCAL] - The local to be used for formatting. Defaults to DEFAULTLOCAL.
 * @return {string} - The formatted date string.
 */
export const DateFormater = (value: Date, local = DEFAULTLOCAL) => {
  return new Intl.DateTimeFormat(local, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/London',
    hour12: false, // Use 24-hour format, remove this line if 12-hour format is preferred
  }).format(new Date(value));
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate the total cost and reduction based on the ticket number and unit price.
 *
 * @param {number} ticketNumber - the number of tickets purchased
 * @param {number} unitPrice - the price of each ticket
 * @return {object} object containing total cost and reduction percentage
 */
export function calculateTotal(
  ticketNumber: number,
  unitPrice: number,
  coupon?: ReferalType | null,
) {
  let reduction = 0;
  if (ticketNumber >= 15) {
    coupon = null;
  }
  if (ticketNumber >= 15 && ticketNumber < 20) {
    reduction = 0.1;
  }
  if (ticketNumber >= 20 && ticketNumber < 25) {
    reduction = 0.15;
  }
  if (ticketNumber >= 25 && ticketNumber < 50) {
    reduction = 0.2;
  }
  if (ticketNumber >= 50) {
    reduction = 0.25;
  }
  let total = ticketNumber * unitPrice;
  total -= total * reduction;
  // console.log('coupon : ', coupon);
  if (coupon) {
    total -= total * coupon.discount_rate;
  }
  return { total, reduction };
}

/**
 * Calculate simplified winning odds in the form `1/x` from selected tickets
 * against total available tickets.
 *
 * @param {number} ticketsBought - the number of tickets selected
 * @param {number} totalTickets - the total number of tickets available
 * @return {string} odds as a string in the form of 1/x
 */
export function calculateOddsString(
  ticketsBought: number,
  totalTickets: number,
  maxWinners = 1,
): string {
  if (ticketsBought <= 0 || totalTickets <= 0) {
    return '0';
  }

  if (ticketsBought > totalTickets) {
    ticketsBought = totalTickets;
  }
  if (ticketsBought === totalTickets) {
    return '1/1';
  }

  const normalizedMaxWinners = Math.max(1, maxWinners);
  const effectiveTickets = ticketsBought * normalizedMaxWinners;
  const odds = totalTickets / effectiveTickets;
  if (odds < 1) {
    return '1/Infinity';
  }
  const roundedOdds = Math.max(1, Math.round(odds));

  return `1/${roundedOdds}`;
}
