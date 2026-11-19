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
 * Normalizes URL by removing tracking query parameters (utm_*, ref, trk, etc.),
 * stripping hash fragments, normalizing trailing slashes, and sorting params.
 */
export function sanitizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    
    // Normalize protocol and hostname to lowercase
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    
    // Remove hash/fragment
    url.hash = '';

    // Strip known marketing, tracking, and referral query parameters
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'source',
      'trk',
      'trackingid',
      'fbclid',
      'gclid',
      'originalsubdomain',
      's',
      't',
      'rc',
    ];

    const currentKeys = Array.from(url.searchParams.keys());
    for (const key of currentKeys) {
      if (trackingParams.includes(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        url.searchParams.delete(key);
      }
    }

    // Sort remaining parameters for deterministic canonical URL
    url.searchParams.sort();

    let clean = url.toString();
    
    // Remove trailing slash if path is longer than '/'
    if (clean.endsWith('/') && url.pathname.length > 1) {
      clean = clean.slice(0, -1);
    }
    
    return clean;
  } catch {
    return rawUrl.trim();
  }
}
