export const normalizePrice = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const raw = String(value).trim();
  const sanitized = raw
    .replace(/,/g, '.')
    .replace(/[^0-9.-]/g, '')
    .replace(/(\..*)\./g, '$1');

  const parsed = Number.parseFloat(sanitized);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Number(parsed.toFixed(2));
};

export const formatPrice = (value: string | number | null | undefined): string => {
  return normalizePrice(value).toFixed(2);
};
