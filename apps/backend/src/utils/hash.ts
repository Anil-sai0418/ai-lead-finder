import crypto from 'crypto';

/**
 * Normalizes text by trimming whitespace, collapsing multiple spaces, and converting to lowercase.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Computes a deterministic SHA-256 hash of normalized text for collision-free deduplication.
 */
export function computeContentHash(content: string, url?: string): string {
  const normalized = normalizeText(content);
  const normalizedUrl = url ? url.trim().toLowerCase().split('?')[0] : '';
  const payload = `${normalized}|${normalizedUrl}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Normalizes URL by removing tracking query parameters (utm_*, ref, etc.)
 */
export function sanitizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'];
    trackingParams.forEach((param) => url.searchParams.delete(param));
    return url.toString();
  } catch {
    return rawUrl.trim();
  }
}
