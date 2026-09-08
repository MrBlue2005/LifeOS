import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type ResolvedAddress = Readonly<{ address: string; family: 4 | 6 }>;
export type ResolveHostname = (hostname: string) => Promise<readonly ResolvedAddress[]>;

const INTERNAL_HOSTNAMES = new Set([
  "instance-data",
  "kubernetes",
  "metadata",
  "metadata.google.internal",
]);

function parseIpv4(address: string): readonly number[] | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map(Number);
  if (octets.some((part, index) => !/^\d+$/.test(parts[index]) || part < 0 || part > 255)) return null;
  return octets;
}

function isPublicIpv4(address: string): boolean {
  const octets = parseIpv4(address);
  if (!octets) return false;
  const [a, b, c] = octets;

  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function ipv6ToBytes(address: string): readonly number[] | null {
  const normalized = address.toLowerCase().split("%")[0];
  const halves = normalized.split("::");
  if (halves.length > 2) return null;

  const parseHalf = (half: string): number[] | null => {
    if (!half) return [];
    const groups = half.split(":");
    const result: number[] = [];
    for (const group of groups) {
      if (group.includes(".")) {
        const ipv4 = parseIpv4(group);
        if (!ipv4) return null;
        result.push((ipv4[0] << 8) | ipv4[1], (ipv4[2] << 8) | ipv4[3]);
      } else {
        if (!/^[\da-f]{1,4}$/.test(group)) return null;
        result.push(Number.parseInt(group, 16));
      }
    }
    return result;
  };

  const left = parseHalf(halves[0]);
  const right = parseHalf(halves[1] ?? "");
  if (!left || !right) return null;
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const groups = [...left, ...Array.from({ length: missing }, () => 0), ...right];
  if (groups.length !== 8) return null;
  return groups.flatMap((group) => [group >> 8, group & 0xff]);
}

function hasPrefix(bytes: readonly number[], prefix: readonly number[], bits: number): boolean {
  const wholeBytes = Math.floor(bits / 8);
  const remainingBits = bits % 8;
  for (let index = 0; index < wholeBytes; index += 1) {
    if (bytes[index] !== prefix[index]) return false;
  }
  if (!remainingBits) return true;
  const mask = 0xff << (8 - remainingBits);
  return (bytes[wholeBytes] & mask) === (prefix[wholeBytes] & mask);
}

function isPublicIpv6(address: string): boolean {
  const bytes = ipv6ToBytes(address);
  if (!bytes) return false;

  const mappedIpv4 = hasPrefix(bytes, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff], 96);
  if (mappedIpv4) return isPublicIpv4(bytes.slice(12).join("."));

  // Only globally routable unicast space is eligible, with documentation space excluded.
  if (!hasPrefix(bytes, [0x20, 0], 3)) return false;
  return !hasPrefix(bytes, [0x20, 0x01, 0x0d, 0xb8], 32);
}

export function isPublicNetworkAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPublicIpv4(address);
  if (version === 6) return isPublicIpv6(address);
  return false;
}

function isValidPublicHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!normalized || normalized.length > 253) return false;
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".home") ||
    normalized.endsWith(".lan") ||
    INTERNAL_HOSTNAMES.has(normalized)
  ) {
    return false;
  }
  if (isIP(normalized)) return isPublicNetworkAddress(normalized);
  if (!normalized.includes(".")) return false;
  return normalized.split(".").every((label) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label));
}

const resolveHostname: ResolveHostname = async (hostname) => {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.map(({ address, family }) => ({ address, family: family === 6 ? 6 : 4 }));
};

export async function validateMetadataUrl(
  value: string,
  resolve: ResolveHostname = resolveHostname,
): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
  if ((url.protocol === "http:" && url.port && url.port !== "80") || (url.protocol === "https:" && url.port && url.port !== "443")) {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!isValidPublicHostname(hostname)) return null;
  if (isIP(hostname)) return url;

  try {
    const addresses = await resolve(hostname);
    if (!addresses.length || addresses.some(({ address }) => !isPublicNetworkAddress(address))) return null;
  } catch {
    return null;
  }
  return url;
}
