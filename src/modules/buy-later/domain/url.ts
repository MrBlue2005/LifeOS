export function normalizeProductUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function productDomain(value: string): string | null {
  const normalized = normalizeProductUrl(value);
  if (!normalized) return null;
  return new URL(normalized).hostname.replace(/^www\./i, "");
}
