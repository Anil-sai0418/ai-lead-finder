import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { searchRepository } from '../../src/repositories/search.repository.js';
import { prisma } from '../../src/config/prisma.js';

describe('Search Management & Dashboard API Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/searches', () => {
    it('should validate and create a new search query', async () => {
      vi.spyOn(searchRepository, 'createQuery').mockResolvedValue({
        id: 'query-1',
        name: 'React Developers',
        query: 'looking for a React developer',
        source: 'TWITTER',
        category: 'Frontend Development',
        isActive: true,
        frequency: 'DAILY',
        maxResults: 25,
        lastExecutedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/searches')
        .send({
          name: 'React Developers',
          query: 'looking for a React developer',
          source: 'TWITTER',
          category: 'Frontend Development',
          frequency: 'DAILY',
          maxResults: 25,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('query-1');
      expect(res.body.data.name).toBe('React Developers');
    });

    it('should reject invalid search query with 400', async () => {
      const res = await request(app)
        .post('/api/v1/searches')
        .send({
          name: 'R', // too short
          query: 'ab', // too short
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/searches', () => {
    it('should return search queries list', async () => {
      vi.spyOn(searchRepository, 'findQueries').mockResolvedValue([
        {
          id: 'query-1',
          name: 'Python Engineers',
          query: 'looking for python developer',
          source: 'TWITTER',
          category: 'Backend',
          isActive: true,
          frequency: 'DAILY',
          maxResults: 20,
          lastExecutedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastExecution: null,
        },
      ]);

      const res = await request(app).get('/api/v1/searches');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Python Engineers');
    });
  });

  describe('POST /api/v1/searches/:id/run', () => {
    it('should trigger search execution and return 202 Accepted', async () => {
      vi.spyOn(searchRepository, 'findQueryById').mockResolvedValue({
        id: 'query-1',
        name: 'AI Developers',
        query: 'looking for an AI developer',
        source: 'TWITTER',
        category: 'AI Projects',
        isActive: true,
        frequency: 'DAILY',
        maxResults: 10,
        lastExecutedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        executions: [],
      });

      vi.spyOn(searchRepository, 'createExecution').mockResolvedValue({
        id: 'exec-1',
        searchQueryId: 'query-1',
        status: 'RUNNING',
        startedAt: new Date(),
        completedAt: null,
        resultsFound: 0,
        newPosts: 0,
        duplicates: 0,
        qualifiedLeads: 0,
        failedJobs: 0,
        errorMessage: null,
        createdAt: new Date(),
      });

      const res = await request(app).post('/api/v1/searches/query-1/run');
      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.executionId).toBe('exec-1');
    });
  });

  describe('GET /api/v1/dashboard/stats', () => {
    it('should return aggregated platform statistics', async () => {
      vi.spyOn(prisma.post, 'count').mockResolvedValue(120);
      vi.spyOn(prisma.lead, 'count')
        .mockResolvedValueOnce(45) // qualified
        .mockResolvedValueOnce(15) // needs review
        .mockResolvedValueOnce(10) // rejected
        .mockResolvedValueOnce(25); // high priority

      const res = await request(app).get('/api/v1/dashboard/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalPosts', 120);
      expect(res.body.data).toHaveProperty('totalQualified', 45);
      expect(res.body.data).toHaveProperty('totalHighPriority', 25);
    });
  });

  describe('POST /api/v1/ai/classify-preview', () => {
    it('should classify raw post text on-demand for sandbox preview', async () => {
      const res = await request(app)
        .post('/api/v1/ai/classify-preview')
        .send({
          content: 'Looking for a Next.js and Tailwind developer to build our company homepage. Budget $2,000.',
          contentLevel: 'FULL_TEXT',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.classification.classification).toBe('QUALIFIED_LEAD');
      expect(res.body.data.scoreResult.score).toBeGreaterThanOrEqual(60);
    });
  });
});
