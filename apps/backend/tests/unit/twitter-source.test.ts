import { describe, it, expect, vi } from 'vitest';
import { TwitterSourceService } from '../../src/services/discovery/twitter-source.service.js';

describe('TwitterSourceService (X API)', () => {
  it('should run in simulated discovery mode when token is placeholder or omitted', async () => {
    const service = new TwitterSourceService('your-x-api-bearer-token-here');
    const result = await service.search('looking for a React developer', { maxResults: 10 });

    expect(result.posts.length).toBeGreaterThan(0);
    expect(result.posts[0].source).toBe('TWITTER');
    expect(result.posts[0].originalUrl).toContain('twitter.com');
  });

  it('should handle pagination with nextToken', async () => {
    const service = new TwitterSourceService();
    const page1 = await service.search('looking for a developer', { maxResults: 5 });

    expect(page1.nextToken).toBeDefined();

    const page2 = await service.search('looking for a developer', {
      maxResults: 5,
      nextToken: page1.nextToken,
    });

    expect(page2.posts.length).toBeGreaterThan(0);
    expect(page2.posts[0].externalPostId).not.toBe(page1.posts[0].externalPostId);
  });

  it('should handle 429 rate limit with structured error details', async () => {
    const service = new TwitterSourceService('mock_live_token_123');

    // Mock global fetch to return 429
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 429,
        ok: false,
        headers: new Headers({
          'x-rate-limit-reset': String(Math.floor(Date.now() / 1000) + 120),
        }),
        text: async () => 'Rate limit exceeded',
      })
    );

    await expect(service.search('looking for Next.js developer')).rejects.toThrow(
      /X API rate limit reached/
    );

    vi.unstubAllGlobals();
  });
});
