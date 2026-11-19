import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { tavilySourceService } from '../../src/services/discovery/tavily-source.service.js';

describe('Automated Search Mode API (Tavily Integration)', () => {
  const app = createApp();

  it('POST /api/v1/searches/automated > should reject empty query with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/searches/automated')
      .send({
        query: '  ',
        targetPlatform: 'linkedin',
        maxResults: 10,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/searches/automated > should reject invalid maxResults with 400', async () => {
    const res = await request(app)
      .post('/api/v1/searches/automated')
      .send({
        query: 'looking for developer',
        targetPlatform: 'linkedin',
        maxResults: 999, // exceeds max 25
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/searches/automated > should execute search, deduplicate, classify with AI, and track execution', async () => {
    const uniqueId = Date.now();
    const mockPostUrl = `https://www.linkedin.com/posts/test-client-${uniqueId}`;

    // Mock tavilySourceService.search for test isolation without burning API credits
    vi.spyOn(tavilySourceService, 'search').mockResolvedValueOnce({
      totalFound: 1,
      posts: [
        {
          source: 'TAVILY',
          externalPostId: `tavily-test-${uniqueId}`,
          originalUrl: mockPostUrl,
          title: 'Looking for a Senior Next.js Developer for SaaS MVP',
          content: 'We need an experienced Next.js and TypeScript developer to build a MVP. Budget: $5,000. Start immediately.',
          snippet: 'We need an experienced Next.js and TypeScript developer...',
          authorName: 'Alex Founder',
          authorId: null,
          publishedAt: new Date(),
          contentLevel: 'SNIPPET_ONLY',
          rawMetadata: { targetPlatform: 'linkedin' },
        },
      ],
    });

    const res = await request(app)
      .post('/api/v1/searches/automated')
      .send({
        query: 'site:linkedin.com/posts "Next.js developer"',
        targetPlatform: 'linkedin',
        maxResults: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalRetrieved).toBe(1);
    expect(res.body.data.newDiscovered).toBe(1);
    expect(res.body.data.duplicatesSkipped).toBe(0);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].originalUrl).toContain(mockPostUrl);
    expect(res.body.data.items[0].isDuplicate).toBe(false);

    // Second execution with identical URL should trigger duplicate skip
    vi.spyOn(tavilySourceService, 'search').mockResolvedValueOnce({
      totalFound: 1,
      posts: [
        {
          source: 'TAVILY',
          externalPostId: `tavily-test-${uniqueId}`,
          originalUrl: `${mockPostUrl}?utm_source=linkedin&ref=feed`, // tracking params to test URL normalization
          title: 'Looking for a Senior Next.js Developer for SaaS MVP',
          content: 'We need an experienced Next.js and TypeScript developer to build a MVP. Budget: $5,000. Start immediately.',
          snippet: 'We need an experienced Next.js and TypeScript developer...',
          authorName: 'Alex Founder',
          authorId: null,
          publishedAt: new Date(),
          contentLevel: 'SNIPPET_ONLY',
        },
      ],
    });

    const secondRes = await request(app)
      .post('/api/v1/searches/automated')
      .send({
        query: 'site:linkedin.com/posts "Next.js developer"',
        targetPlatform: 'linkedin',
        maxResults: 5,
      });

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.data.totalRetrieved).toBe(1);
    expect(secondRes.body.data.duplicatesSkipped).toBe(1);
    expect(secondRes.body.data.newDiscovered).toBe(0);
    expect(secondRes.body.data.items[0].isDuplicate).toBe(true);
  });

  it('Manual Mode Regression: POST /api/v1/posts/manual still functions properly', async () => {
    const manualUrl = `https://twitter.com/manual_client/status/${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/posts/manual')
      .send({
        sourcePlatform: 'MANUAL',
        originalUrl: manualUrl,
        content: 'Urgent: Looking for React Native freelance developer to build mobile app. Budget $3,000.',
        title: 'React Native Developer Needed',
        authorName: 'David Freelancer Buyer',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lead).toBeDefined();
    expect(res.body.data.lead.classification).toBeDefined();
  });
});
