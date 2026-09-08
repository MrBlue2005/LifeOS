const MAX_TITLE_LENGTH = 160;

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  apos: "'",
  copy: "©",
  gt: ">",
  hellip: "…",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  nbsp: " ",
  ndash: "–",
  quot: '"',
  rdquo: "”",
  reg: "®",
  rsquo: "’",
  trade: "™",
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, token: string) => {
    if (token.startsWith("#")) {
      const hexadecimal = token[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(token.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      if (Number.isFinite(codePoint) && codePoint > 0 && codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff)) {
        return String.fromCodePoint(codePoint);
      }
      return entity;
    }
    return NAMED_ENTITIES[token.toLowerCase()] ?? entity;
  });
}

function normalizeTitle(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, MAX_TITLE_LENGTH).trimEnd();
}

function readAttributes(tag: string): Readonly<Record<string, string>> {
  const attributes: Record<string, string> = {};
  const expression = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of tag.matchAll(expression)) {
    const name = match[1].toLowerCase();
    if (name === "meta") continue;
    attributes[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

export function extractProductTitle(html: string): string | null {
  let openGraphTitle: string | null = null;
  let twitterTitle: string | null = null;

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = readAttributes(match[0]);
    const key = (attributes.property ?? attributes.name ?? "").toLowerCase();
    if (key === "og:title" && !openGraphTitle) openGraphTitle = normalizeTitle(attributes.content);
    if (key === "twitter:title" && !twitterTitle) twitterTitle = normalizeTitle(attributes.content);
  }

  if (openGraphTitle) return openGraphTitle;
  const documentTitle = normalizeTitle(html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]);
  return documentTitle ?? twitterTitle;
}
