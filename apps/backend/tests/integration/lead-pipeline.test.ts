import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { postRepository } from '../../src/repositories/post.repository.js';
import { leadRepository } from '../../src/repositories/lead.repository.js';
import { aiLogRepository } from '../../src/repositories/ai-log.repository.js';

describe('Lead Pipeline & Discovery Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/posts/manual', () => {
    it('should reject invalid payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/posts/manual')
        .send({
          originalUrl: 'not-a-valid-url',
          content: 'short', // less than 10 characters
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should ingest and classify a new valid manual post', async () => {
      // Mock repository methods
      vi.spyOn(postRepository, 'findByContentHash').mockResolvedValue(null);
      vi.spyOn(postRepository, 'create').mockImplementation(async (data: any) => ({
        id: 'mock-post-1',
        source: data.source,
        externalPostId: data.externalPostId || null,
        contentHash: data.contentHash,
        originalUrl: data.originalUrl,
        title: data.title || null,
        content: data.content,
        snippet: null,
        authorName: data.authorName || null,
        authorId: null,
        publishedAt: null,
        discoveredAt: new Date(),
        contentLevel: data.contentLevel,
        rawMetadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      vi.spyOn(aiLogRepository, 'create').mockResolvedValue({} as any);

      vi.spyOn(leadRepository, 'upsert').mockImplementation(async (data: any) => ({
        id: 'mock-lead-1',
        postId: data.postId,
        classification: data.classification,
        isHiring: data.isHiring,
        hiringIntent: data.hiringIntent,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        technologies: data.technologies || [],
        budget: data.budget,
        deadline: data.deadline,
        startDate: data.startDate,
        contactMethod: data.contactMethod,
        confidence: data.confidence,
        missingInformation: data.missingInformation || [],
        reason: data.reason,
        leadScore: data.leadScore,
        scoreBreakdown: data.scoreBreakdown,
        priority: data.priority,
        status: 'NEW',
        notes: null,
        manualCorrection: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request(app)
        .post('/api/v1/posts/manual')
        .send({
          sourcePlatform: 'MANUAL',
          originalUrl: 'https://twitter.com/client/status/123456789',
          content: 'Looking for a React and Node.js developer to build a SaaS dashboard. Budget is $5,000.',
          authorName: 'Alex Founder',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isDuplicate).toBe(false);
      expect(res.body.data.lead.classification).toBe('QUALIFIED_LEAD');
      expect(res.body.data.lead.leadScore).toBeGreaterThanOrEqual(60);
    });

    it('should identify duplicate post submissions and return 200 without creating a new lead', async () => {
      const existingPost = {
        id: 'existing-post-99',
        source: 'MANUAL',
        externalPostId: null,
        contentHash: 'somehash',
        originalUrl: 'https://twitter.com/client/status/123456789',
        title: null,
        content: 'Existing post content here',
        snippet: null,
        authorName: null,
        authorId: null,
        publishedAt: null,
        discoveredAt: new Date(),
        contentLevel: 'MANUAL_TEXT',
        rawMetadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(postRepository, 'findByContentHash').mockResolvedValue(existingPost as any);
      vi.spyOn(leadRepository, 'findByPostId').mockResolvedValue({
        id: 'existing-lead-99',
        postId: existingPost.id,
        classification: 'QUALIFIED_LEAD',
        leadScore: 80,
      } as any);

      const res = await request(app)
        .post('/api/v1/posts/manual')
        .send({
          sourcePlatform: 'MANUAL',
          originalUrl: 'https://twitter.com/client/status/123456789',
          content: 'Existing post content here for testing duplicate prevention',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isDuplicate).toBe(true);
      expect(res.body.data.postId).toBe('existing-post-99');
    });
  });

  describe('POST /api/v1/posts/import-results (Google Search Snippets)', () => {
    it('should bulk import Google search snippet items', async () => {
      vi.spyOn(postRepository, 'findByContentHash').mockResolvedValue(null);
      vi.spyOn(postRepository, 'create').mockImplementation(async (data: any) => ({
        id: 'mock-imported-post',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      vi.spyOn(aiLogRepository, 'create').mockResolvedValue({} as any);
      vi.spyOn(leadRepository, 'upsert').mockImplementation(async (data: any) => ({
        id: 'mock-imported-lead',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request(app)
        .post('/api/v1/posts/import-results')
        .send({
          items: [
            {
              title: 'Looking for a Senior Python Developer - Contract',
              snippet: 'We need an experienced Python developer to build our ETL data pipeline within 4 weeks. Budget $3,000.',
              originalUrl: 'https://linkedin.com/posts/example-1',
              source: 'GOOGLE_IMPORT',
            },
            {
              title: 'React Dev Available For Hire',
              snippet: 'I am a frontend developer open to work. Portfolio at mydev.com',
              originalUrl: 'https://linkedin.com/posts/example-2',
              source: 'GOOGLE_IMPORT',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalReceived).toBe(2);
      expect(res.body.data.processedCount).toBe(2);
      expect(res.body.data.duplicateCount).toBe(0);
    });
  });

  describe('PATCH /api/v1/leads/:id/status', () => {
    it('should update lead status and notes', async () => {
      vi.spyOn(leadRepository, 'findById').mockResolvedValue({
        id: 'lead-1',
        postId: 'post-1',
        status: 'NEW',
      } as any);

      vi.spyOn(leadRepository, 'updateStatus').mockResolvedValue({
        id: 'lead-1',
        postId: 'post-1',
        status: 'CONTACTED',
        notes: 'Reached out via email to schedule discovery call.',
      } as any);

      const res = await request(app)
        .patch('/api/v1/leads/lead-1/status')
        .send({
          status: 'CONTACTED',
          notes: 'Reached out via email to schedule discovery call.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CONTACTED');
    });
  });

  describe('POST /api/v1/leads/:id/review (Manual Correction)', () => {
    it('should recalculate deterministic score and update classification upon review', async () => {
      vi.spyOn(leadRepository, 'findById').mockResolvedValue({
        id: 'lead-needs-review-1',
        postId: 'post-1',
        classification: 'NEEDS_REVIEW',
        isHiring: false,
        leadScore: 20,
        technologies: ['React'],
      } as any);

      vi.spyOn(leadRepository, 'applyManualCorrection').mockImplementation(
        async (_id, correction, newScore, newPriority, breakdown) => ({
          id: 'lead-needs-review-1',
          postId: 'post-1',
          classification: correction.classification,
          isHiring: correction.isHiring,
          leadScore: newScore,
          priority: newPriority,
          scoreBreakdown: breakdown,
          status: 'REVIEWED',
          manualCorrection: correction,
        } as any)
      );

      const res = await request(app)
        .post('/api/v1/leads/lead-needs-review-1/review')
        .send({
          classification: 'QUALIFIED_LEAD',
          isHiring: true,
          projectTitle: 'E-commerce React Redesign',
          projectDescription: 'Client confirmed budget and hiring need during manual review.',
          technologies: ['React', 'Next.js'],
          budget: '$6,000',
          deadline: '3 weeks',
          reviewNote: 'Verified direct communication from client on LinkedIn.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.classification).toBe('QUALIFIED_LEAD');
      expect(res.body.data.leadScore).toBeGreaterThanOrEqual(80);
      expect(res.body.data.priority).toBe('HIGH');
    });
  });
});
