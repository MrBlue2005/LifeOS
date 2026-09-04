export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = "/find-it",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
