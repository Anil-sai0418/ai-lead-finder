import { z } from 'zod';
export declare const AIClassificationSchema: z.ZodObject<{
    post_id: z.ZodString;
    classification: z.ZodEnum<["QUALIFIED_LEAD", "NOT_A_LEAD", "NEEDS_REVIEW"]>;
    is_hiring: z.ZodBoolean;
    hiring_intent: z.ZodEnum<["EXPLICIT", "IMPLIED", "UNCLEAR", "NONE"]>;
    project_title: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null, string | null | undefined>;
    project_description: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null, string | null | undefined>;
    technologies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    budget: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null, string | null | undefined>;
    deadline: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null, string | null | undefined>;
    start_date: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null, string | null | undefined>;
    contact_method: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | null, string | null | undefined>;
    confidence: z.ZodNumber;
    missing_information: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    post_id: string;
    classification: "QUALIFIED_LEAD" | "NOT_A_LEAD" | "NEEDS_REVIEW";
    is_hiring: boolean;
    hiring_intent: "EXPLICIT" | "IMPLIED" | "UNCLEAR" | "NONE";
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
}, {
    post_id: string;
    classification: "QUALIFIED_LEAD" | "NOT_A_LEAD" | "NEEDS_REVIEW";
    is_hiring: boolean;
    hiring_intent: "EXPLICIT" | "IMPLIED" | "UNCLEAR" | "NONE";
    confidence: number;
    reason: string;
    project_title?: string | null | undefined;
    project_description?: string | null | undefined;
    technologies?: string[] | undefined;
    budget?: string | null | undefined;
    deadline?: string | null | undefined;
    start_date?: string | null | undefined;
    contact_method?: string | null | undefined;
    missing_information?: string[] | undefined;
}>;
export type AIClassificationSchemaType = z.infer<typeof AIClassificationSchema>;
export declare const ManualPostSubmissionSchema: z.ZodObject<{
    sourcePlatform: z.ZodDefault<z.ZodEnum<["TWITTER", "GOOGLE_IMPORT", "MANUAL"]>>;
    originalUrl: z.ZodString;
    content: z.ZodString;
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    authorName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    publishedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    sourcePlatform: "TWITTER" | "GOOGLE_IMPORT" | "MANUAL";
    originalUrl: string;
    content: string;
    title?: string | null | undefined;
    authorName?: string | null | undefined;
    publishedAt?: string | null | undefined;
}, {
    originalUrl: string;
    content: string;
    sourcePlatform?: "TWITTER" | "GOOGLE_IMPORT" | "MANUAL" | undefined;
    title?: string | null | undefined;
    authorName?: string | null | undefined;
    publishedAt?: string | null | undefined;
}>;
export type ManualPostSubmissionInput = z.infer<typeof ManualPostSubmissionSchema>;
export declare const GoogleSearchResultItemSchema: z.ZodObject<{
    title: z.ZodString;
    snippet: z.ZodString;
    originalUrl: z.ZodString;
    source: z.ZodDefault<z.ZodString>;
    searchDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    authorName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    originalUrl: string;
    title: string;
    snippet: string;
    source: string;
    authorName?: string | null | undefined;
    searchDate?: string | null | undefined;
}, {
    originalUrl: string;
    title: string;
    snippet: string;
    authorName?: string | null | undefined;
    source?: string | undefined;
    searchDate?: string | null | undefined;
}>;
export declare const GoogleSearchResultImportSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        snippet: z.ZodString;
        originalUrl: z.ZodString;
        source: z.ZodDefault<z.ZodString>;
        searchDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        authorName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        originalUrl: string;
        title: string;
        snippet: string;
        source: string;
        authorName?: string | null | undefined;
        searchDate?: string | null | undefined;
    }, {
        originalUrl: string;
        title: string;
        snippet: string;
        authorName?: string | null | undefined;
        source?: string | undefined;
        searchDate?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        originalUrl: string;
        title: string;
        snippet: string;
        source: string;
        authorName?: string | null | undefined;
        searchDate?: string | null | undefined;
    }[];
}, {
    items: {
        originalUrl: string;
        title: string;
        snippet: string;
        authorName?: string | null | undefined;
        source?: string | undefined;
        searchDate?: string | null | undefined;
    }[];
}>;
export type GoogleSearchResultImportInput = z.infer<typeof GoogleSearchResultImportSchema>;
export declare const CreateSearchQuerySchema: z.ZodObject<{
    name: z.ZodString;
    query: z.ZodString;
    source: z.ZodDefault<z.ZodEnum<["TWITTER", "GOOGLE_IMPORT", "MANUAL", "TAVILY"]>>;
    category: z.ZodString;
    frequency: z.ZodDefault<z.ZodEnum<["HOURLY", "DAILY", "WEEKLY", "MANUAL"]>>;
    maxResults: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    source: "TWITTER" | "GOOGLE_IMPORT" | "MANUAL" | "TAVILY";
    name: string;
    query: string;
    category: string;
    frequency: "MANUAL" | "HOURLY" | "DAILY" | "WEEKLY";
    maxResults: number;
    isActive: boolean;
}, {
    name: string;
    query: string;
    category: string;
    source?: "TWITTER" | "GOOGLE_IMPORT" | "MANUAL" | "TAVILY" | undefined;
    frequency?: "MANUAL" | "HOURLY" | "DAILY" | "WEEKLY" | undefined;
    maxResults?: number | undefined;
    isActive?: boolean | undefined;
}>;
export type CreateSearchQueryInput = z.infer<typeof CreateSearchQuerySchema>;
export declare const AutomatedSearchSchema: z.ZodObject<{
    query: z.ZodString;
    targetPlatform: z.ZodDefault<z.ZodEnum<["linkedin", "general_web", "twitter", "github"]>>;
    maxResults: z.ZodDefault<z.ZodNumber>;
    searchDepth: z.ZodDefault<z.ZodEnum<["basic", "advanced"]>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults: number;
    targetPlatform: "linkedin" | "general_web" | "twitter" | "github";
    searchDepth: "basic" | "advanced";
}, {
    query: string;
    maxResults?: number | undefined;
    targetPlatform?: "linkedin" | "general_web" | "twitter" | "github" | undefined;
    searchDepth?: "basic" | "advanced" | undefined;
}>;
export type AutomatedSearchInput = z.infer<typeof AutomatedSearchSchema>;
export declare const UpdateSearchQuerySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    query: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodDefault<z.ZodEnum<["TWITTER", "GOOGLE_IMPORT", "MANUAL", "TAVILY"]>>>;
    category: z.ZodOptional<z.ZodString>;
    frequency: z.ZodOptional<z.ZodDefault<z.ZodEnum<["HOURLY", "DAILY", "WEEKLY", "MANUAL"]>>>;
    maxResults: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    source?: "TWITTER" | "GOOGLE_IMPORT" | "MANUAL" | "TAVILY" | undefined;
    name?: string | undefined;
    query?: string | undefined;
    category?: string | undefined;
    frequency?: "MANUAL" | "HOURLY" | "DAILY" | "WEEKLY" | undefined;
    maxResults?: number | undefined;
    isActive?: boolean | undefined;
}, {
    source?: "TWITTER" | "GOOGLE_IMPORT" | "MANUAL" | "TAVILY" | undefined;
    name?: string | undefined;
    query?: string | undefined;
    category?: string | undefined;
    frequency?: "MANUAL" | "HOURLY" | "DAILY" | "WEEKLY" | undefined;
    maxResults?: number | undefined;
    isActive?: boolean | undefined;
}>;
export type UpdateSearchQueryInput = z.infer<typeof UpdateSearchQuerySchema>;
export declare const UpdateLeadStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["NEW", "REVIEWED", "INTERESTED", "CONTACTED", "CLOSED", "REJECTED"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "NEW" | "REVIEWED" | "INTERESTED" | "CONTACTED" | "CLOSED" | "REJECTED";
    notes?: string | undefined;
}, {
    status: "NEW" | "REVIEWED" | "INTERESTED" | "CONTACTED" | "CLOSED" | "REJECTED";
    notes?: string | undefined;
}>;
export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusSchema>;
export declare const ManualReviewCorrectionSchema: z.ZodObject<{
    classification: z.ZodEnum<["QUALIFIED_LEAD", "NOT_A_LEAD", "NEEDS_REVIEW"]>;
    isHiring: z.ZodBoolean;
    projectTitle: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projectDescription: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    technologies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    budget: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    deadline: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reviewNote: z.ZodString;
}, "strip", z.ZodTypeAny, {
    classification: "QUALIFIED_LEAD" | "NOT_A_LEAD" | "NEEDS_REVIEW";
    isHiring: boolean;
    reviewNote: string;
    technologies?: string[] | undefined;
    budget?: string | null | undefined;
    deadline?: string | null | undefined;
    projectTitle?: string | null | undefined;
    projectDescription?: string | null | undefined;
}, {
    classification: "QUALIFIED_LEAD" | "NOT_A_LEAD" | "NEEDS_REVIEW";
    isHiring: boolean;
    reviewNote: string;
    technologies?: string[] | undefined;
    budget?: string | null | undefined;
    deadline?: string | null | undefined;
    projectTitle?: string | null | undefined;
    projectDescription?: string | null | undefined;
}>;
export type ManualReviewCorrectionInput = z.infer<typeof ManualReviewCorrectionSchema>;
//# sourceMappingURL=index.d.ts.map