export type DiscoverySource = 'TWITTER' | 'GOOGLE_IMPORT' | 'MANUAL';

export type ContentLevel = 'FULL_TEXT' | 'SNIPPET_ONLY' | 'MANUAL_TEXT';

export type ClassificationType = 'QUALIFIED_LEAD' | 'NOT_A_LEAD' | 'NEEDS_REVIEW';

export type HiringIntent = 'EXPLICIT' | 'IMPLIED' | 'UNCLEAR' | 'NONE';

export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';

export type LeadStatus =
  | 'NEW'
  | 'REVIEWED'
  | 'INTERESTED'
  | 'CONTACTED'
  | 'CLOSED'
  | 'REJECTED';

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ScoreBreakdownItem {
  criterion: string;
  maxPoints: number;
  awardedPoints: number;
  reason: string;
}

export interface ScoreBreakdown {
  explicitHiring: ScoreBreakdownItem;
  budgetMentioned: ScoreBreakdownItem;
  techRequirements: ScoreBreakdownItem;
  timelineMentioned: ScoreBreakdownItem;
  clearScope: ScoreBreakdownItem;
  totalScore: number;
}

export interface DiscoveredPost {
  source: DiscoverySource;
  externalPostId?: string | null;
  originalUrl: string;
  title?: string | null;
  content: string;
  snippet?: string | null;
  authorName?: string | null;
  authorId?: string | null;
  publishedAt?: Date | string | null;
  contentLevel: ContentLevel;
  rawMetadata?: Record<string, unknown> | null;
}

export interface AIClassificationResult {
  post_id: string;
  classification: ClassificationType;
  is_hiring: boolean;
  hiring_intent: HiringIntent;
  project_title: string | null;
  project_description: string | null;
  technologies: string[];
  budget: string | null;
  deadline: string | null;
  start_date: string | null;
  contact_method: string | null;
  confidence: number;
  missing_information: string[];
  reason: string;
}

export interface DeterministicScoreResult {
  score: number;
  priority: PriorityLevel;
  breakdown: ScoreBreakdown;
}
