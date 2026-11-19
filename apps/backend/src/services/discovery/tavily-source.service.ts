import { LeadSource, SearchOptions, SearchResult } from './lead-source.interface.js';
import { DiscoveredPost, TargetPlatform, ContentLevel } from '@ai-lead-finder/shared';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import crypto from 'crypto';

export interface TavilySearchOptions extends SearchOptions {
  targetPlatform?: TargetPlatform;
  searchDepth?: 'basic' | 'advanced';
}

export interface TavilyRawResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string | null;
  score?: number;
  published_date?: string | null;
}

export interface TavilyApiResponse {
  query: string;
  results: TavilyRawResult[];
  response_time?: number;
}

export class TavilySourceService implements LeadSource {
  public readonly name = 'TAVILY';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? env.TAVILY_API_KEY ?? '';
  }

  public async search(query: string, options?: TavilySearchOptions): Promise<SearchResult> {
    const rawKey = this.apiKey.replace(/^["']|["']$/g, '').trim();

    if (!rawKey || rawKey === 'your-tavily-api-key-here' || rawKey.startsWith('your-')) {
      logger.error('Attempted to run Tavily search without a valid TAVILY_API_KEY');
      throw new AppError(
        'Tavily API key is not configured. Please set TAVILY_API_KEY in your environment variables to enable Automated Search Mode.',
        400,
        'TAVILY_KEY_MISSING'
      );
    }

    const maxResults = Math.min(25, Math.max(1, options?.maxResults ?? 10));
    const targetPlatform = options?.targetPlatform ?? 'linkedin';
    const searchDepth = options?.searchDepth ?? 'basic';

    // 1. Build targeted query & domain filters
    const { formattedQuery, includeDomains } = this.buildPlatformQuery(query, targetPlatform);

    logger.info(
      { query: formattedQuery, targetPlatform, maxResults, searchDepth, includeDomains },
      'Executing live Tavily automated search'
    );

    // 2. Execute HTTP POST to Tavily API with 15s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AILeadFinder/1.0.0',
        },
        body: JSON.stringify({
          api_key: rawKey,
          query: formattedQuery,
          search_depth: searchDepth,
          include_domains: includeDomains.length > 0 ? includeDomains : undefined,
          max_results: maxResults,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, body: errorText }, 'Tavily API error response');

        if (response.status === 401) {
          throw new AppError(
            'Tavily API Authentication Failed: Invalid API key (HTTP 401). Please verify your TAVILY_API_KEY in .env.',
            401,
            'TAVILY_AUTH_ERROR'
          );
        }

        if (response.status === 429) {
          throw new AppError(
            'Tavily API Rate Limit Exceeded (HTTP 429). You have exceeded your request rate or credit limit. Please try again shortly.',
            429,
            'TAVILY_RATE_LIMIT'
          );
        }

        throw new AppError(
          `Tavily search request failed with status ${response.status}: ${errorText}`,
          response.status,
          'TAVILY_API_ERROR'
        );
      }

      const json = (await response.json()) as TavilyApiResponse;
      const rawResults = json.results || [];

      logger.info({ count: rawResults.length, responseTime: json.response_time }, 'Tavily search completed');

      // 3. Normalize into DiscoveredPost[] with Content-Level Accuracy
      const posts: DiscoveredPost[] = rawResults
        .filter((r) => r.url && r.url.trim().length > 0 && r.content && r.content.trim().length > 0)
        .map((item) => this.normalizeResult(item, targetPlatform, formattedQuery));

      return {
        posts,
        totalFound: posts.length,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AppError) throw error;

      if ((error as Error).name === 'AbortError') {
        throw new AppError('Tavily search request timed out after 15 seconds', 504, 'TAVILY_TIMEOUT');
      }

      throw new AppError(
        `Failed to communicate with Tavily Search API: ${(error as Error).message}`,
        502,
        'TAVILY_NETWORK_ERROR'
      );
    }
  }

  /**
   * Translates platform selector into query syntax and Tavily include_domains.
   */
  private buildPlatformQuery(
    rawQuery: string,
    platform: TargetPlatform
  ): { formattedQuery: string; includeDomains: string[] } {
    const trimmed = rawQuery.trim();

    switch (platform) {
      case 'linkedin': {
        const includeDomains = ['linkedin.com'];
        // If the user hasn't specified site:linkedin.com, ensure it targets public posts
        let formattedQuery = trimmed;
        if (!trimmed.toLowerCase().includes('site:linkedin.com')) {
          formattedQuery = `site:linkedin.com/posts ${trimmed}`;
        }
        return { formattedQuery, includeDomains };
      }
      case 'github': {
        const includeDomains = ['github.com'];
        let formattedQuery = trimmed;
        if (!trimmed.toLowerCase().includes('site:github.com')) {
          formattedQuery = `site:github.com ${trimmed}`;
        }
        return { formattedQuery, includeDomains };
      }
      case 'twitter': {
        const includeDomains = ['x.com', 'twitter.com'];
        return { formattedQuery: trimmed, includeDomains };
      }
      case 'general_web':
      default: {
        return { formattedQuery: trimmed, includeDomains: [] };
      }
    }
  }

  /**
   * Normalizes an individual Tavily result into the application's DiscoveredPost format.
   * Accurately determines content level (SNIPPET_ONLY vs FULL_TEXT) and sets audit metadata.
   */
  public normalizeResult(
    raw: TavilyRawResult,
    targetPlatform: TargetPlatform,
    searchQuery: string
  ): DiscoveredPost {
    const url = raw.url.trim();
    // Deterministic external post ID from canonical URL hash
    const externalPostId = `tavily-${crypto.createHash('md5').update(url).digest('hex').slice(0, 16)}`;

    // Distinguish between verified full source content and search snippet excerpt
    const hasFullContent = Boolean(raw.raw_content && raw.raw_content.trim().length > 300);
    const contentLevel: ContentLevel = hasFullContent ? 'FULL_TEXT' : 'SNIPPET_ONLY';

    const title = raw.title ? raw.title.trim() : null;
    const snippet = raw.content ? raw.content.trim() : null;
    const content = hasFullContent && raw.raw_content
      ? raw.raw_content.trim()
      : title
      ? `${title}\n\n${snippet || ''}`.trim()
      : snippet || '';

    let publishedAt: Date | null = null;
    if (raw.published_date) {
      const parsed = new Date(raw.published_date);
      if (!isNaN(parsed.getTime())) {
        publishedAt = parsed;
      }
    }

    return {
      source: 'TAVILY',
      externalPostId,
      originalUrl: url,
      title,
      content,
      snippet,
      authorName: null,
      authorId: null,
      publishedAt,
      contentLevel,
      rawMetadata: {
        provider: 'TAVILY',
        tavilyScore: raw.score ?? null,
        targetPlatform,
        searchQuery,
        discoveryMethod: 'AUTOMATED',
        isExtractSnippet: !hasFullContent,
        disclaimer: 'Discovered via Tavily web search index; not a direct scrape of private platform data.',
      },
    };
  }
}

export const tavilySourceService = new TavilySourceService();
