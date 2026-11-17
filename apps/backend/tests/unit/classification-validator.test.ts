import { describe, it, expect } from 'vitest';
import { AIClassificationSchema } from '@ai-lead-finder/shared';
import { GeminiService } from '../../src/services/ai/gemini.service.js';
import { ScoringEngineService } from '../../src/services/lead-scoring/scoring-engine.service.js';
import benchmarkPosts from '../fixtures/20-sample-posts.benchmark.json';

describe('AI Classification & 20-Sample Benchmark Validation', () => {
  const geminiService = new GeminiService();
  const scoringEngine = new ScoringEngineService();

  describe('Zod Schema Strict Validation', () => {
    it('should validate a complete and correct AI response', () => {
      const validPayload = {
        post_id: 'post-123',
        classification: 'QUALIFIED_LEAD',
        is_hiring: true,
        hiring_intent: 'EXPLICIT',
        project_title: 'React Dashboard',
        project_description: 'Build a Next.js 15 dashboard with Stripe',
        technologies: ['React', 'Next.js', 'Stripe'],
        budget: '$5,000',
        deadline: '2 weeks',
        start_date: null,
        contact_method: 'dm',
        confidence: 0.95,
        missing_information: [],
        reason: 'Client explicitly hiring for specific project.',
      };

      const parsed = AIClassificationSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
    });

    it('should reject invalid classification enum', () => {
      const invalidPayload = {
        post_id: 'post-123',
        classification: 'HOT_LEAD', // Invalid enum
        is_hiring: true,
        hiring_intent: 'EXPLICIT',
        confidence: 0.9,
        technologies: [],
        missing_information: [],
        reason: 'Test',
      };

      const parsed = AIClassificationSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
    });

    it('should reject confidence score outside 0-1', () => {
      const invalidPayload = {
        post_id: 'post-123',
        classification: 'QUALIFIED_LEAD',
        is_hiring: true,
        hiring_intent: 'EXPLICIT',
        confidence: 1.5, // Out of range
        technologies: [],
        missing_information: [],
        reason: 'Test',
      };

      const parsed = AIClassificationSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
    });
  });

  describe('20 Benchmark Sample Posts Evaluation', () => {
    it('benchmark dataset should contain at least 20 items', () => {
      expect(benchmarkPosts.length).toBeGreaterThanOrEqual(20);
    });

    benchmarkPosts.forEach((post) => {
      it(`should correctly evaluate ${post.id}: ${post.description}`, () => {
        const classification = geminiService.heuristicClassification(
          post.id,
          post.content,
          post.contentLevel as 'FULL_TEXT' | 'SNIPPET_ONLY' | 'MANUAL_TEXT'
        );

        // Verify structure conforms to Zod schema
        const validation = AIClassificationSchema.safeParse(classification);
        expect(validation.success).toBe(true);

        // Verify Ground-Truth classification
        expect(classification.classification).toBe(post.expectedClassification);
        expect(classification.hiring_intent).toBe(post.expectedHiringIntent);

        // Verify Deterministic Scoring
        const scoreResult = scoringEngine.calculateScore(classification);

        if ('expectedMinScore' in post && post.expectedMinScore !== undefined) {
          expect(scoreResult.score).toBeGreaterThanOrEqual(post.expectedMinScore);
        }

        if ('expectedMaxScore' in post && post.expectedMaxScore !== undefined) {
          expect(scoreResult.score).toBeLessThanOrEqual(post.expectedMaxScore);
        }
      });
    });
  });
});
