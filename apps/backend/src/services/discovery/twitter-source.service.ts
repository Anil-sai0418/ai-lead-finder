import { LeadSource, SearchOptions, SearchResult } from './lead-source.interface.js';
import { DiscoveredPost } from '@ai-lead-finder/shared';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/error.middleware.js';

export class TwitterSourceService implements LeadSource {
  public readonly name = 'TWITTER';
  private bearerToken: string;
  private isConfigured: boolean;

  constructor(token?: string) {
    const rawToken = token || env.X_BEARER_TOKEN || '';
    const isPlaceholder =
      !rawToken ||
      rawToken === 'your-x-api-bearer-token-here' ||
      rawToken.startsWith('your-') ||
      rawToken.trim() === '';

    this.bearerToken = rawToken;
    this.isConfigured = !isPlaceholder;

    if (!this.isConfigured) {
      logger.info('X API Bearer Token is not configured. TwitterSourceService is operating in mock discovery mode.');
    }
  }

  public async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    const maxResults = Math.min(100, Math.max(10, options?.maxResults || 20));

    if (!this.isConfigured) {
      return this.simulateSearch(query, maxResults, options?.nextToken);
    }

    return this.executeLiveSearch(query, maxResults, options?.nextToken);
  }

  private async executeLiveSearch(
    query: string,
    maxResults: number,
    nextToken?: string,
    retryCount = 0
  ): Promise<SearchResult> {
    const url = new URL('https://api.x.com/2/tweets/search/recent');
    url.searchParams.set('query', `${query} -is:retweet`);
    url.searchParams.set('max_results', String(maxResults));
    url.searchParams.set('tweet.fields', 'created_at,author_id,public_metrics,text');
    if (nextToken) {
      url.searchParams.set('next_token', nextToken);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          'User-Agent': 'AILeadFinder/1.0.0',
        },
      });

      if (response.status === 429) {
        const resetHeader = response.headers.get('x-rate-limit-reset');
        const resetSeconds = resetHeader ? Math.max(1, parseInt(resetHeader) - Math.floor(Date.now() / 1000)) : 60;
        logger.warn({ resetSeconds }, 'X API rate limit reached (429)');

        if (retryCount < 2 && resetSeconds <= 15) {
          await new Promise((r) => setTimeout(r, resetSeconds * 1000));
          return this.executeLiveSearch(query, maxResults, nextToken, retryCount + 1);
        }

        throw new AppError(
          `X API rate limit reached. Reset in ${resetSeconds} seconds.`,
          429,
          'X_API_RATE_LIMIT',
          { resetSeconds }
        );
      }

      if (response.status >= 500 && retryCount < 3) {
        const backoffMs = Math.pow(2, retryCount) * 1000;
        logger.warn({ status: response.status, retryCount }, `X API server error, retrying in ${backoffMs}ms`);
        await new Promise((r) => setTimeout(r, backoffMs));
        return this.executeLiveSearch(query, maxResults, nextToken, retryCount + 1);
      }

      if (!response.ok) {
        const errBody = await response.text();
        logger.error({ status: response.status, body: errBody }, 'X API error response');
        throw new AppError(
          `X API request failed with status ${response.status}: ${errBody}`,
          response.status,
          'X_API_ERROR'
        );
      }

      const json = (await response.json()) as any;
      const rawTweets = json.data || [];
      const meta = json.meta || {};

      const posts: DiscoveredPost[] = rawTweets.map((t: any) => ({
        source: 'TWITTER',
        externalPostId: t.id,
        originalUrl: `https://twitter.com/i/web/status/${t.id}`,
        content: t.text,
        snippet: null,
        authorId: t.author_id,
        publishedAt: t.created_at ? new Date(t.created_at) : null,
        contentLevel: 'FULL_TEXT',
        rawMetadata: {
          publicMetrics: t.public_metrics,
        },
      }));

      return {
        posts,
        nextToken: meta.next_token,
        totalFound: posts.length,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to reach X API: ${(error as Error).message}`,
        502,
        'X_API_NETWORK_ERROR'
      );
    }
  }

  /**
   * Simulation generator for development when live X API Bearer Token is not provided.
   */
  private simulateSearch(query: string, maxResults: number, nextToken?: string): SearchResult {
    const pageIndex = nextToken ? parseInt(nextToken) : 0;
    const samplePool = [
      {
        id: `sim-tw-${pageIndex}-1`,
        text: `Looking for a React developer to build a modern dashboard for our analytics startup. Budget: $4,500. Deadline in 3 weeks. DM with portfolio!`,
        author_id: 'user_401',
      },
      {
        id: `sim-tw-${pageIndex}-2`,
        text: `Need an experienced Python / FastAPI backend developer to integrate Stripe and OpenAI APIs. $3,000 budget. Send DM if interested.`,
        author_id: 'user_402',
      },
      {
        id: `sim-tw-${pageIndex}-3`,
        text: `Looking for a software development agency to build a complete telehealth web application in Next.js and PostgreSQL. Budget: $20,000+.`,
        author_id: 'user_403',
      },
      {
        id: `sim-tw-${pageIndex}-4`,
        text: `I am a freelance full-stack developer with 5 years experience looking for exciting projects. #hireme #react`,
        author_id: 'user_404',
      },
      {
        id: `sim-tw-${pageIndex}-5`,
        text: `Has anyone tried the new Claude 3.5 Sonnet model? The coding benchmark improvements look impressive.`,
        author_id: 'user_405',
      },
    ];

    const slice = samplePool.slice(0, maxResults);
    const posts: DiscoveredPost[] = slice.map((t) => ({
      source: 'TWITTER',
      externalPostId: t.id,
      originalUrl: `https://twitter.com/i/web/status/${t.id}`,
      content: t.text,
      snippet: null,
      authorId: t.author_id,
      publishedAt: new Date(),
      contentLevel: 'FULL_TEXT',
    }));

    const hasNext = pageIndex < 2;
    return {
      posts,
      nextToken: hasNext ? String(pageIndex + 1) : undefined,
      totalFound: posts.length,
    };
  }
}

export const twitterSourceService = new TwitterSourceService();
