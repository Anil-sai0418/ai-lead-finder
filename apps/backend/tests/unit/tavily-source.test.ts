import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TavilySourceService } from '../../src/services/discovery/tavily-source.service.js';
import { AppError } from '../../src/middleware/error.middleware.js';

describe('TavilySourceService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw an AppError when TAVILY_API_KEY is not configured', async () => {
    const service = new TavilySourceService('');
    await expect(service.search('looking for a developer')).rejects.toThrow(
      /Tavily API key is not configured/
    );
  });

  it('should reject placeholder API key in production', async () => {
    const service = new TavilySourceService('your-tavily-api-key-here');
    await expect(service.search('looking for a developer')).rejects.toThrow(
      /Tavily API key is not configured/
    );
  });

  it('should handle Tavily 401 Unauthorized error with clear message', async () => {
    const service = new TavilySourceService('tvly-invalid-key');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized: Invalid API key',
      })
    );

    await expect(service.search('looking for a developer')).rejects.toThrow(
      /Tavily API Authentication Failed/
    );
  });

  it('should handle Tavily 429 Rate Limit error with clear message', async () => {
    const service = new TavilySourceService('tvly-valid-key');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      })
    );

    await expect(service.search('looking for a developer')).rejects.toThrow(
      /Tavily API Rate Limit Exceeded/
    );
  });

  it('should format LinkedIn platform query with include_domains and site: prefix', async () => {
    const service = new TavilySourceService('tvly-test-key');

    let capturedBody: any = null;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url, init) => {
        capturedBody = JSON.parse(init.body);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            query: capturedBody.query,
            results: [],
            response_time: 0.5,
          }),
        });
      })
    );

    const result = await service.search('need a Next.js engineer', {
      targetPlatform: 'linkedin',
      maxResults: 10,
    });

    expect(capturedBody).toBeDefined();
    expect(capturedBody.query).toContain('site:linkedin.com/posts');
    expect(capturedBody.include_domains).toEqual(['linkedin.com']);
    expect(result.posts).toEqual([]);
    expect(result.totalFound).toBe(0);
  });

  it('should accurately set contentLevel to FULL_TEXT when raw_content is returned', async () => {
    const service = new TavilySourceService('tvly-test-key');

    const longRawContent = 'A'.repeat(350); // > 300 chars
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          query: 'developer needed',
          results: [
            {
              title: 'Hiring Lead Developer',
              url: 'https://linkedin.com/posts/acme-corp-hiring-123',
              content: 'Short excerpt here',
              raw_content: longRawContent,
              score: 0.95,
              published_date: '2026-11-18T10:00:00Z',
            },
          ],
        }),
      })
    );

    const result = await service.search('developer needed', { targetPlatform: 'linkedin' });

    expect(result.posts.length).toBe(1);
    const post = result.posts[0];
    expect(post.contentLevel).toBe('FULL_TEXT');
    expect(post.content).toBe(longRawContent);
    expect(post.source).toBe('TAVILY');
    expect(post.originalUrl).toBe('https://linkedin.com/posts/acme-corp-hiring-123');
  });

  it('should accurately set contentLevel to SNIPPET_ONLY when only excerpt content is returned', async () => {
    const service = new TavilySourceService('tvly-test-key');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          query: 'developer needed',
          results: [
            {
              title: 'Need a freelance developer',
              url: 'https://linkedin.com/posts/freelance-developer-456',
              content: 'We need someone to build a dashboard in React. Budget $3,000.',
              raw_content: null,
              score: 0.88,
            },
          ],
        }),
      })
    );

    const result = await service.search('developer needed', { targetPlatform: 'linkedin' });

    expect(result.posts.length).toBe(1);
    const post = result.posts[0];
    expect(post.contentLevel).toBe('SNIPPET_ONLY');
    expect(post.snippet).toBe('We need someone to build a dashboard in React. Budget $3,000.');
    expect(post.content).toContain('Need a freelance developer');
    expect(post.rawMetadata?.isExtractSnippet).toBe(true);
  });
});
