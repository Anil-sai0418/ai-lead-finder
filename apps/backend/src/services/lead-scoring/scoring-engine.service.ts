import {
  AIClassificationResult,
  DeterministicScoreResult,
  PriorityLevel,
  ScoreBreakdown,
} from '@ai-lead-finder/shared';

export class ScoringEngineService {
  /**
   * Deterministically calculates a 100-point lead score based on extracted facts.
   */
  public calculateScore(classification: AIClassificationResult): DeterministicScoreResult {
    // If the classification is definitively NOT_A_LEAD, the final score must reflect 0 actionable points
    if (classification.classification === 'NOT_A_LEAD') {
      const breakdown: ScoreBreakdown = {
        explicitHiring: {
          criterion: 'Explicit hiring request (developer/agency)',
          maxPoints: 30,
          awardedPoints: 0,
          reason: 'Author is not seeking to hire or buy software development services.',
        },
        budgetMentioned: {
          criterion: 'Budget explicitly mentioned',
          maxPoints: 20,
          awardedPoints: 0,
          reason: 'Not applicable for non-leads.',
        },
        techRequirements: {
          criterion: 'Technologies or technical requirements mentioned',
          maxPoints: 15,
          awardedPoints: 0,
          reason: 'Not applicable for non-leads.',
        },
        timelineMentioned: {
          criterion: 'Deadline or delivery timeline mentioned',
          maxPoints: 15,
          awardedPoints: 0,
          reason: 'Not applicable for non-leads.',
        },
        clearScope: {
          criterion: 'Clear project scope and requirements',
          maxPoints: 20,
          awardedPoints: 0,
          reason: 'No client project scope present.',
        },
        totalScore: 0,
      };

      return {
        score: 0,
        priority: 'VERY_LOW',
        breakdown,
      };
    }

    let totalScore = 0;

    // Rule 1: Explicit request to hire a developer or agency: 30 points
    let hiringPoints = 0;
    let hiringReason = 'No explicit hiring request identified.';
    if (classification.is_hiring && classification.hiring_intent === 'EXPLICIT') {
      hiringPoints = 30;
      hiringReason = 'Explicit client request to hire a developer, freelancer, or software agency (+30 pts).';
    } else if (classification.is_hiring && classification.hiring_intent === 'IMPLIED') {
      hiringPoints = 15;
      hiringReason = 'Implied or indirect project engagement requirement (+15 pts).';
    }
    totalScore += hiringPoints;

    // Rule 2: Budget explicitly mentioned: 20 points
    let budgetPoints = 0;
    let budgetReason = 'No budget mentioned in post.';
    if (classification.budget && classification.budget.trim().length > 0) {
      budgetPoints = 20;
      budgetReason = `Budget explicitly mentioned: "${classification.budget}" (+20 pts).`;
    }
    totalScore += budgetPoints;

    // Rule 3: Technologies or technical requirements mentioned: 15 points
    let techPoints = 0;
    let techReason = 'No technical requirements or tech stack specified.';
    if (classification.technologies && classification.technologies.length > 0) {
      techPoints = 15;
      techReason = `Technologies specified (${classification.technologies.join(', ')}) (+15 pts).`;
    }
    totalScore += techPoints;

    // Rule 4: Deadline or delivery timeline mentioned: 15 points
    let timelinePoints = 0;
    let timelineReason = 'No deadline or project timeline provided.';
    if (classification.deadline && classification.deadline.trim().length > 0) {
      timelinePoints = 15;
      timelineReason = `Deadline explicitly specified: "${classification.deadline}" (+15 pts).`;
    }
    totalScore += timelinePoints;

    // Rule 5: Clear project scope and requirements: 20 points
    let scopePoints = 0;
    let scopeReason = 'Project scope is ambiguous or lacking actionable requirements.';
    const hasDetailedDesc =
      classification.project_description &&
      classification.project_description.trim().length >= 40;
    const hasProjectTitle =
      classification.project_title &&
      classification.project_title.trim().length >= 5;

    if (hasDetailedDesc && hasProjectTitle) {
      scopePoints = 20;
      scopeReason = 'Clear and detailed project scope and objectives defined (+20 pts).';
    } else if (hasDetailedDesc || hasProjectTitle) {
      scopePoints = 10;
      scopeReason = 'Partially defined project scope (+10 pts).';
    }
    totalScore += scopePoints;

    // Priority mapping
    let priority: PriorityLevel = 'VERY_LOW';
    if (totalScore >= 80) {
      priority = 'HIGH';
    } else if (totalScore >= 60) {
      priority = 'MEDIUM';
    } else if (totalScore >= 40) {
      priority = 'LOW';
    } else {
      priority = 'VERY_LOW';
    }

    const breakdown: ScoreBreakdown = {
      explicitHiring: {
        criterion: 'Explicit hiring request (developer/agency)',
        maxPoints: 30,
        awardedPoints: hiringPoints,
        reason: hiringReason,
      },
      budgetMentioned: {
        criterion: 'Budget explicitly mentioned',
        maxPoints: 20,
        awardedPoints: budgetPoints,
        reason: budgetReason,
      },
      techRequirements: {
        criterion: 'Technologies or technical requirements mentioned',
        maxPoints: 15,
        awardedPoints: techPoints,
        reason: techReason,
      },
      timelineMentioned: {
        criterion: 'Deadline or delivery timeline mentioned',
        maxPoints: 15,
        awardedPoints: timelinePoints,
        reason: timelineReason,
      },
      clearScope: {
        criterion: 'Clear project scope and requirements',
        maxPoints: 20,
        awardedPoints: scopePoints,
        reason: scopeReason,
      },
      totalScore,
    };

    return {
      score: totalScore,
      priority,
      breakdown,
    };
  }
}

export const scoringEngineService = new ScoringEngineService();
