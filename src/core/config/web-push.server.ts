type WebPushServerConfig = Readonly<{
  publicKey: string;
  privateKey: string;
  subject: string;
}>;

const publicKeyPattern = /^[A-Za-z0-9_-]{80,200}$/;
const privateKeyPattern = /^[A-Za-z0-9_-]{43}$/;

function isValidSubject(value: string): boolean {
  if (value.startsWith("mailto:")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.slice("mailto:".length));
  try { const url = new URL(value); return url.protocol === "https:"; } catch { return false; }
}

export function parseWebPushServerConfig(environment: Record<string, string | undefined>): WebPushServerConfig | null {
  const publicKey = environment.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = environment.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  const subject = environment.WEB_PUSH_VAPID_SUBJECT?.trim();
  if (!publicKey && !privateKey && !subject) return null;
  if (!publicKey || !privateKey || !subject || !publicKeyPattern.test(publicKey) || !privateKeyPattern.test(privateKey) || !isValidSubject(subject)) {
    throw new Error("Web Push server configuration is invalid.");
  }
  const browserKey = environment.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  if (browserKey && browserKey !== publicKey) throw new Error("Web Push public keys do not match.");
  return { publicKey, privateKey, subject };
}

export function getWebPushServerConfig(): WebPushServerConfig | null {
  return parseWebPushServerConfig(process.env);
}
