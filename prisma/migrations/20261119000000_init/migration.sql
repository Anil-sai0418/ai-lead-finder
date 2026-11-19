-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DiscoverySource" AS ENUM ('TWITTER', 'GOOGLE_IMPORT', 'MANUAL', 'TAVILY');

-- CreateEnum
CREATE TYPE "ContentLevel" AS ENUM ('FULL_TEXT', 'SNIPPET_ONLY', 'MANUAL_TEXT');

-- CreateEnum
CREATE TYPE "ClassificationType" AS ENUM ('QUALIFIED_LEAD', 'NOT_A_LEAD', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "HiringIntent" AS ENUM ('EXPLICIT', 'IMPLIED', 'UNCLEAR', 'NONE');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'VERY_LOW');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'REVIEWED', 'INTERESTED', 'CONTACTED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "source" "DiscoverySource" NOT NULL,
    "externalPostId" TEXT,
    "contentHash" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "snippet" TEXT,
    "authorName" TEXT,
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentLevel" "ContentLevel" NOT NULL DEFAULT 'FULL_TEXT',
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "classification" "ClassificationType" NOT NULL,
    "isHiring" BOOLEAN NOT NULL DEFAULT false,
    "hiringIntent" "HiringIntent" NOT NULL DEFAULT 'NONE',
    "projectTitle" TEXT,
    "projectDescription" TEXT,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budget" TEXT,
    "deadline" TEXT,
    "startDate" TEXT,
    "contactMethod" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "missingInformation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reason" TEXT NOT NULL,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "scoreBreakdown" JSONB,
    "priority" "PriorityLevel" NOT NULL DEFAULT 'VERY_LOW',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "manualCorrection" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_queries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "source" "DiscoverySource" NOT NULL DEFAULT 'TWITTER',
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "maxResults" INTEGER NOT NULL DEFAULT 20,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_executions" (
    "id" TEXT NOT NULL,
    "searchQueryId" TEXT,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "resultsFound" INTEGER NOT NULL DEFAULT 0,
    "newPosts" INTEGER NOT NULL DEFAULT 0,
    "duplicates" INTEGER NOT NULL DEFAULT 0,
    "qualifiedLeads" INTEGER NOT NULL DEFAULT 0,
    "failedJobs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_processing_logs" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'GOOGLE_GEMINI',
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "processingStatus" TEXT NOT NULL,
    "processingTimeMs" INTEGER NOT NULL,
    "rawResponse" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_processing_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "posts_contentHash_key" ON "posts"("contentHash");

-- CreateIndex
CREATE INDEX "posts_source_idx" ON "posts"("source");

-- CreateIndex
CREATE INDEX "posts_discoveredAt_idx" ON "posts"("discoveredAt");

-- CreateIndex
CREATE INDEX "posts_publishedAt_idx" ON "posts"("publishedAt");

-- CreateIndex
CREATE INDEX "posts_originalUrl_idx" ON "posts"("originalUrl");

-- CreateIndex
CREATE INDEX "posts_source_discoveredAt_idx" ON "posts"("source", "discoveredAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "posts_source_externalPostId_key" ON "posts"("source", "externalPostId");

-- CreateIndex
CREATE UNIQUE INDEX "leads_postId_key" ON "leads"("postId");

-- CreateIndex
CREATE INDEX "leads_classification_idx" ON "leads"("classification");

-- CreateIndex
CREATE INDEX "leads_priority_idx" ON "leads"("priority");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_leadScore_idx" ON "leads"("leadScore");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE INDEX "leads_priority_leadScore_idx" ON "leads"("priority", "leadScore" DESC);

-- CreateIndex
CREATE INDEX "leads_classification_priority_leadScore_idx" ON "leads"("classification", "priority", "leadScore" DESC);

-- CreateIndex
CREATE INDEX "leads_status_createdAt_idx" ON "leads"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "leads_leadScore_createdAt_idx" ON "leads"("leadScore" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "search_queries_isActive_idx" ON "search_queries"("isActive");

-- CreateIndex
CREATE INDEX "search_queries_category_idx" ON "search_queries"("category");

-- CreateIndex
CREATE INDEX "search_executions_searchQueryId_createdAt_idx" ON "search_executions"("searchQueryId", "createdAt");

-- CreateIndex
CREATE INDEX "search_executions_status_idx" ON "search_executions"("status");

-- CreateIndex
CREATE INDEX "search_executions_searchQueryId_status_startedAt_idx" ON "search_executions"("searchQueryId", "status", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "ai_processing_logs_postId_idx" ON "ai_processing_logs"("postId");

-- CreateIndex
CREATE INDEX "ai_processing_logs_processingStatus_idx" ON "ai_processing_logs"("processingStatus");

-- CreateIndex
CREATE INDEX "ai_processing_logs_createdAt_idx" ON "ai_processing_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_executions" ADD CONSTRAINT "search_executions_searchQueryId_fkey" FOREIGN KEY ("searchQueryId") REFERENCES "search_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_processing_logs" ADD CONSTRAINT "ai_processing_logs_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
