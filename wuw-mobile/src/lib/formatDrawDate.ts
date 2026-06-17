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

/** Display order timestamps as dd/mm/yyyy, hh:mm in local time (24h). */
export function formatDateTimeDdMmYyyyHhMm(value: string): string {
  const parsed = new Date(value.trim());
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = String(parsed.getFullYear());
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
