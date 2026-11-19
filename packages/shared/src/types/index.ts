export type DiscoverySource = 'TWITTER' | 'GOOGLE_IMPORT' | 'MANUAL' | 'TAVILY';

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

export type TargetPlatform = 'linkedin' | 'general_web' | 'twitter' | 'github';

export interface AutomatedSearchResultItem {
  postId: string;
  leadId?: string;
  title: string | null;
  originalUrl: string;
  source: DiscoverySource;
  contentLevel: ContentLevel;
  isDuplicate: boolean;
  classification?: ClassificationType;
  leadScore?: number;
  priority?: PriorityLevel;
  projectDescription?: string | null;
  technologies?: string[];
  budget?: string | null;
  deadline?: string | null;
  reason?: string;
}

export interface AutomatedSearchExecutionSummary {
  executionId: string;
  query: string;
  targetPlatform: TargetPlatform;
  totalRetrieved: number;
  newDiscovered: number;
  duplicatesSkipped: number;
  sentForClassification: number;
  qualifiedLeads: number;
  notALead: number;
  needsReview: number;
  failedCount: number;
  durationMs: number;
  items: AutomatedSearchResultItem[];
}
