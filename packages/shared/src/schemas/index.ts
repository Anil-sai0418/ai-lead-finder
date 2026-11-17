import { z } from 'zod';

export const AIClassificationSchema = z.object({
  post_id: z.string().min(1, 'post_id is required'),
  classification: z.enum(['QUALIFIED_LEAD', 'NOT_A_LEAD', 'NEEDS_REVIEW']),
  is_hiring: z.boolean(),
  hiring_intent: z.enum(['EXPLICIT', 'IMPLIED', 'UNCLEAR', 'NONE']),
  project_title: z.string().nullable().optional().transform((val) => val ?? null),
  project_description: z.string().nullable().optional().transform((val) => val ?? null),
  technologies: z.array(z.string()).default([]),
  budget: z.string().nullable().optional().transform((val) => val ?? null),
  deadline: z.string().nullable().optional().transform((val) => val ?? null),
  start_date: z.string().nullable().optional().transform((val) => val ?? null),
  contact_method: z.string().nullable().optional().transform((val) => val ?? null),
  confidence: z.number().min(0).max(1),
  missing_information: z.array(z.string()).default([]),
  reason: z.string().min(1, 'Reason is required'),
});

export type AIClassificationSchemaType = z.infer<typeof AIClassificationSchema>;

export const ManualPostSubmissionSchema = z.object({
  sourcePlatform: z.enum(['TWITTER', 'GOOGLE_IMPORT', 'MANUAL']).default('MANUAL'),
  originalUrl: z.string().url('A valid URL is required'),
  content: z.string().min(10, 'Post content must be at least 10 characters'),
  title: z.string().optional().nullable(),
  authorName: z.string().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export type ManualPostSubmissionInput = z.infer<typeof ManualPostSubmissionSchema>;

export const GoogleSearchResultItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  snippet: z.string().min(1, 'Snippet is required'),
  originalUrl: z.string().url('A valid URL is required'),
  source: z.string().default('GOOGLE_IMPORT'),
  searchDate: z.string().optional().nullable(),
  authorName: z.string().optional().nullable(),
});

export const GoogleSearchResultImportSchema = z.object({
  items: z.array(GoogleSearchResultItemSchema).min(1, 'At least one item is required'),
});

export type GoogleSearchResultImportInput = z.infer<typeof GoogleSearchResultImportSchema>;

export const CreateSearchQuerySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  query: z.string().min(3, 'Query must be at least 3 characters'),
  source: z.enum(['TWITTER', 'GOOGLE_IMPORT', 'MANUAL']).default('TWITTER'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  frequency: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MANUAL']).default('DAILY'),
  maxResults: z.number().int().min(5).max(100).default(20),
  isActive: z.boolean().default(true),
});

export type CreateSearchQueryInput = z.infer<typeof CreateSearchQuerySchema>;

export const UpdateSearchQuerySchema = CreateSearchQuerySchema.partial();
export type UpdateSearchQueryInput = z.infer<typeof UpdateSearchQuerySchema>;

export const UpdateLeadStatusSchema = z.object({
  status: z.enum(['NEW', 'REVIEWED', 'INTERESTED', 'CONTACTED', 'CLOSED', 'REJECTED']),
  notes: z.string().optional(),
});

export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusSchema>;

export const ManualReviewCorrectionSchema = z.object({
  classification: z.enum(['QUALIFIED_LEAD', 'NOT_A_LEAD', 'NEEDS_REVIEW']),
  isHiring: z.boolean(),
  projectTitle: z.string().optional().nullable(),
  projectDescription: z.string().optional().nullable(),
  technologies: z.array(z.string()).optional(),
  budget: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  reviewNote: z.string().min(3, 'Review note explaining the decision is required'),
});

export type ManualReviewCorrectionInput = z.infer<typeof ManualReviewCorrectionSchema>;
