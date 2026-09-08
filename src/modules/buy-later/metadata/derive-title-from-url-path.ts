const MAX_TITLE_LENGTH = 160;

const GENERIC_SEGMENTS = new Set([
  "category",
  "categories",
  "catalog",
  "catalogue",
  "dp",
  "item",
  "items",
  "p",
  "pd",
  "product",
  "products",
  "search",
  "shop",
]);

const CATEGORY_SEGMENTS = new Set(["category", "categories", "catalog", "catalogue"]);
const TERMINAL_STRUCTURAL_SEGMENTS = new Set(["dp", "p", "pd"]);

function decodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function truncateTitle(value: string): string {
  if (value.length <= MAX_TITLE_LENGTH) return value;

  let truncated = "";
  for (const character of value) {
    if (truncated.length + character.length > MAX_TITLE_LENGTH) break;
    truncated += character;
  }

  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace >= Math.floor(MAX_TITLE_LENGTH / 2) ? truncated.slice(0, lastSpace) : truncated).trimEnd();
}

function deriveTitleFromSegment(segment: string): string | null {
  const decoded = decodeSegment(segment);
  if (!decoded) return null;

  const normalized = decoded.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const tokens = normalized.split(" ").filter(Boolean);
  const wordTokens = tokens.filter((token) => /\p{L}/u.test(token));

  if (tokens.length < 3 || wordTokens.length < 2) return null;
  return truncateTitle(`${normalized[0].toUpperCase()}${normalized.slice(1)}`);
}

/**
 * Produces a restrained, local-only title fallback from a product-like URL path.
 * It deliberately ignores generic navigation and ID-shaped path segments.
 */
export function deriveTitleFromUrlPath(value: string): string | undefined {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const candidates: string[] = [];
  let skipCategoryChild = false;

  for (const segment of segments) {
    const decoded = decodeSegment(segment);
    if (!decoded) continue;
    const key = decoded.toLowerCase();

    if (TERMINAL_STRUCTURAL_SEGMENTS.has(key)) break;
    if (skipCategoryChild) {
      skipCategoryChild = false;
      continue;
    }
    if (CATEGORY_SEGMENTS.has(key)) {
      skipCategoryChild = true;
      continue;
    }
    if (GENERIC_SEGMENTS.has(key)) continue;

    const title = deriveTitleFromSegment(segment);
    if (title) candidates.push(title);
  }

  return candidates.sort((left, right) => right.length - left.length)[0];
}
