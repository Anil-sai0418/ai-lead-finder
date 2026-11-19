"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualReviewCorrectionSchema = exports.UpdateLeadStatusSchema = exports.UpdateSearchQuerySchema = exports.AutomatedSearchSchema = exports.CreateSearchQuerySchema = exports.GoogleSearchResultImportSchema = exports.GoogleSearchResultItemSchema = exports.ManualPostSubmissionSchema = exports.AIClassificationSchema = void 0;
const zod_1 = require("zod");
exports.AIClassificationSchema = zod_1.z.object({
    post_id: zod_1.z.string().min(1, 'post_id is required'),
    classification: zod_1.z.enum(['QUALIFIED_LEAD', 'NOT_A_LEAD', 'NEEDS_REVIEW']),
    is_hiring: zod_1.z.boolean(),
    hiring_intent: zod_1.z.enum(['EXPLICIT', 'IMPLIED', 'UNCLEAR', 'NONE']),
    project_title: zod_1.z.string().nullable().optional().transform((val) => val ?? null),
    project_description: zod_1.z.string().nullable().optional().transform((val) => val ?? null),
    technologies: zod_1.z.array(zod_1.z.string()).default([]),
    budget: zod_1.z.string().nullable().optional().transform((val) => val ?? null),
    deadline: zod_1.z.string().nullable().optional().transform((val) => val ?? null),
    start_date: zod_1.z.string().nullable().optional().transform((val) => val ?? null),
    contact_method: zod_1.z.string().nullable().optional().transform((val) => val ?? null),
    confidence: zod_1.z.number().min(0).max(1),
    missing_information: zod_1.z.array(zod_1.z.string()).default([]),
    reason: zod_1.z.string().min(1, 'Reason is required'),
});
exports.ManualPostSubmissionSchema = zod_1.z.object({
    sourcePlatform: zod_1.z.enum(['TWITTER', 'GOOGLE_IMPORT', 'MANUAL']).default('MANUAL'),
    originalUrl: zod_1.z.string().url('A valid URL is required'),
    content: zod_1.z.string().min(10, 'Post content must be at least 10 characters'),
    title: zod_1.z.string().optional().nullable(),
    authorName: zod_1.z.string().optional().nullable(),
    publishedAt: zod_1.z.string().datetime().optional().nullable(),
});
exports.GoogleSearchResultItemSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    snippet: zod_1.z.string().min(1, 'Snippet is required'),
    originalUrl: zod_1.z.string().url('A valid URL is required'),
    source: zod_1.z.string().default('GOOGLE_IMPORT'),
    searchDate: zod_1.z.string().optional().nullable(),
    authorName: zod_1.z.string().optional().nullable(),
});
exports.GoogleSearchResultImportSchema = zod_1.z.object({
    items: zod_1.z.array(exports.GoogleSearchResultItemSchema).min(1, 'At least one item is required'),
});
exports.CreateSearchQuerySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    query: zod_1.z.string().min(3, 'Query must be at least 3 characters'),
    source: zod_1.z.enum(['TWITTER', 'GOOGLE_IMPORT', 'MANUAL', 'TAVILY']).default('TWITTER'),
    category: zod_1.z.string().min(2, 'Category must be at least 2 characters'),
    frequency: zod_1.z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MANUAL']).default('DAILY'),
    maxResults: zod_1.z.number().int().min(5).max(100).default(20),
    isActive: zod_1.z.boolean().default(true),
});
exports.AutomatedSearchSchema = zod_1.z.object({
    query: zod_1.z.string().min(3, 'Search query must be at least 3 characters').max(500, 'Search query must not exceed 500 characters'),
    targetPlatform: zod_1.z.enum(['linkedin', 'general_web', 'twitter', 'github']).default('linkedin'),
    maxResults: zod_1.z.number().int().min(1, 'At least 1 result must be requested').max(25, 'Maximum 25 results allowed per search').default(10),
    searchDepth: zod_1.z.enum(['basic', 'advanced']).default('basic'),
});
exports.UpdateSearchQuerySchema = exports.CreateSearchQuerySchema.partial();
exports.UpdateLeadStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['NEW', 'REVIEWED', 'INTERESTED', 'CONTACTED', 'CLOSED', 'REJECTED']),
    notes: zod_1.z.string().optional(),
});
exports.ManualReviewCorrectionSchema = zod_1.z.object({
    classification: zod_1.z.enum(['QUALIFIED_LEAD', 'NOT_A_LEAD', 'NEEDS_REVIEW']),
    isHiring: zod_1.z.boolean(),
    projectTitle: zod_1.z.string().optional().nullable(),
    projectDescription: zod_1.z.string().optional().nullable(),
    technologies: zod_1.z.array(zod_1.z.string()).optional(),
    budget: zod_1.z.string().optional().nullable(),
    deadline: zod_1.z.string().optional().nullable(),
    reviewNote: zod_1.z.string().min(3, 'Review note explaining the decision is required'),
});
//# sourceMappingURL=index.js.map