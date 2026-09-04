export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = "/find-it",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }

  return value;
}
