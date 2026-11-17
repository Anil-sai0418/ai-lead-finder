import { describe, it, expect } from 'vitest';
import { ScoringEngineService } from '../../src/services/lead-scoring/scoring-engine.service.js';
import { AIClassificationResult } from '@ai-lead-finder/shared';

describe('Deterministic Scoring Engine', () => {
  const scoringEngine = new ScoringEngineService();

  const baseLead: AIClassificationResult = {
    post_id: 'test-lead-1',
    classification: 'QUALIFIED_LEAD',
    is_hiring: true,
    hiring_intent: 'EXPLICIT',
    project_title: 'Full Stack Web App Development',
    project_description: 'Looking to hire a full stack developer to build an MVP with authentication and payment integrations.',
    technologies: ['React', 'Node.js', 'PostgreSQL'],
    budget: '$5,000 - $7,000',
    deadline: 'within 4 weeks',
    start_date: 'immediate',
    contact_method: 'dm on twitter',
    confidence: 0.95,
    missing_information: [],
    reason: 'Clear commercial hiring intent with well-defined parameters.',
  };

  it('should award maximum 100 points and HIGH priority when all 5 criteria are met', () => {
    const result = scoringEngine.calculateScore(baseLead);

    expect(result.score).toBe(100);
    expect(result.priority).toBe('HIGH');
    expect(result.breakdown.explicitHiring.awardedPoints).toBe(30);
    expect(result.breakdown.budgetMentioned.awardedPoints).toBe(20);
    expect(result.breakdown.techRequirements.awardedPoints).toBe(15);
    expect(result.breakdown.timelineMentioned.awardedPoints).toBe(15);
    expect(result.breakdown.clearScope.awardedPoints).toBe(20);
  });

  it('should not award points for missing budget (-20 pts = 80 pts -> HIGH priority)', () => {
    const leadWithoutBudget: AIClassificationResult = {
      ...baseLead,
      budget: null,
    };

    const result = scoringEngine.calculateScore(leadWithoutBudget);

    expect(result.score).toBe(80);
    expect(result.priority).toBe('HIGH');
    expect(result.breakdown.budgetMentioned.awardedPoints).toBe(0);
  });

  it('should calculate MEDIUM priority (65 pts) when budget and deadline are missing', () => {
    const leadWithoutBudgetAndDeadline: AIClassificationResult = {
      ...baseLead,
      budget: null,
      deadline: null,
    };

    const result = scoringEngine.calculateScore(leadWithoutBudgetAndDeadline);

    // 30 (hiring) + 0 (budget) + 15 (tech) + 0 (deadline) + 20 (scope) = 65
    expect(result.score).toBe(65);
    expect(result.priority).toBe('MEDIUM');
    expect(result.breakdown.explicitHiring.awardedPoints).toBe(30);
    expect(result.breakdown.budgetMentioned.awardedPoints).toBe(0);
    expect(result.breakdown.timelineMentioned.awardedPoints).toBe(0);
  });

  it('should calculate LOW priority (45 pts) when only hiring and tech are present with brief scope', () => {
    const lowPriorityLead: AIClassificationResult = {
      ...baseLead,
      budget: null,
      deadline: null,
      project_title: null,
      project_description: 'Short desc', // < 40 chars
    };

    // 30 (hiring) + 0 (budget) + 15 (tech) + 0 (deadline) + 0 (scope) = 45
    const result = scoringEngine.calculateScore(lowPriorityLead);

    expect(result.score).toBe(45);
    expect(result.priority).toBe('LOW');
  });

  it('should award 15 points for implied hiring intent instead of 30', () => {
    const impliedLead: AIClassificationResult = {
      ...baseLead,
      hiring_intent: 'IMPLIED',
      budget: null,
      deadline: null,
    };

    // 15 (implied hiring) + 0 (budget) + 15 (tech) + 0 (deadline) + 20 (scope) = 50
    const result = scoringEngine.calculateScore(impliedLead);

    expect(result.score).toBe(50);
    expect(result.priority).toBe('LOW');
    expect(result.breakdown.explicitHiring.awardedPoints).toBe(15);
  });

  it('should strictly award 0 points to NOT_A_LEAD and never convert to qualified lead', () => {
    const notALead: AIClassificationResult = {
      ...baseLead,
      classification: 'NOT_A_LEAD',
      is_hiring: false,
      hiring_intent: 'NONE',
    };

    const result = scoringEngine.calculateScore(notALead);

    expect(result.score).toBe(0);
    expect(result.priority).toBe('VERY_LOW');
    expect(result.breakdown.explicitHiring.awardedPoints).toBe(0);
    expect(result.breakdown.totalScore).toBe(0);
  });
});
