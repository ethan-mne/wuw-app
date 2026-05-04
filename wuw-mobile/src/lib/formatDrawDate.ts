/** Display draw dates as dd/mm/yyyy. ISO YYYY-MM-DD is split without Date parsing to avoid TZ shifts. */
export function formatDrawDateDdMmYyyy(value: string): string {
  const trimmed = value.trim();
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return [
      String(parsed.getDate()).padStart(2, '0'),
      String(parsed.getMonth() + 1).padStart(2, '0'),
      String(parsed.getFullYear()),
    ].join('/');
  }
  return value;
}
