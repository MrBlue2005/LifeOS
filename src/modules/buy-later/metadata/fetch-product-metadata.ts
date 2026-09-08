import { extractProductTitle } from "./extract-title";
import { type ResolveHostname, validateMetadataUrl } from "./network-safety";

const FETCH_TIMEOUT_MS = 3_500;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_REDIRECTS = 3;

export type ProductMetadata = Readonly<{ title: string | null }>;

type MetadataDependencies = Readonly<{
  fetch?: typeof fetch;
  resolveHostname?: ResolveHostname;
}>;

async function readLimitedBody(response: Response): Promise<string | null> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    await response.body?.cancel().catch(() => undefined);
    return null;
  }
  if (!response.body) return null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let html = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      html += decoder.decode(value, { stream: true });
    }
    html += decoder.decode();
    return html;
  } catch {
    await reader.cancel().catch(() => undefined);
    return null;
  }
}

export async function fetchProductMetadata(
  value: string,
  dependencies: MetadataDependencies = {},
): Promise<ProductMetadata | null> {
  const request = dependencies.fetch ?? fetch;
  let current = value;

  try {
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      const safeUrl = await validateMetadataUrl(current, dependencies.resolveHostname);
      if (!safeUrl) return null;

      const response = await request(safeUrl, {
        cache: "no-store",
        credentials: "omit",
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "RX-LifeOS-Metadata/1.0",
        },
        redirect: "manual",
        referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel().catch(() => undefined);
        if (!location || redirectCount === MAX_REDIRECTS) return null;
        current = new URL(location, safeUrl).toString();
        continue;
      }

      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        return null;
      }
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.startsWith("text/html") && !contentType.startsWith("application/xhtml+xml")) {
        await response.body?.cancel().catch(() => undefined);
        return null;
      }
      const html = await readLimitedBody(response);
      return html === null ? null : { title: extractProductTitle(html) };
    }
  } catch {
    return null;
  }
  return null;
}
