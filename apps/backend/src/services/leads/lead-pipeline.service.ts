import { postRepository } from '../../repositories/post.repository.js';
import { leadRepository } from '../../repositories/lead.repository.js';
import { aiLogRepository } from '../../repositories/ai-log.repository.js';
import { deduplicationService } from '../deduplication/deduplication.service.js';
import { geminiService } from '../ai/gemini.service.js';
import { scoringEngineService } from '../lead-scoring/scoring-engine.service.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  DiscoveredPost,
  AIClassificationResult,
  DeterministicScoreResult,
} from '@ai-lead-finder/shared';
import { Post, Lead } from '@prisma/client';

export interface PipelineExecutionResult {
  post: Post;
  lead?: Lead;
  isDuplicate: boolean;
  scoreResult?: DeterministicScoreResult;
  classification?: AIClassificationResult;
}

export class LeadPipelineService {
  /**
   * Processes a single discovered or imported post synchronously through the full pipeline.
   */
  public async processPost(discovered: DiscoveredPost): Promise<PipelineExecutionResult> {
    const { source, content, originalUrl, externalPostId, title, snippet, authorName, authorId, contentLevel, rawMetadata } = discovered;

    // 1. Deduplication Check
    const dedup = await deduplicationService.check({
      source,
      content,
      originalUrl,
      externalPostId,
    });

    let targetPost: Post;

    if (dedup.isDuplicate && dedup.existingPost) {
      const existingLead = await leadRepository.findByPostId(dedup.existingPost.id);
      if (existingLead) {
        logger.info(
          { postId: dedup.existingPost.id, contentHash: dedup.contentHash },
          'Post identified as duplicate with existing lead; returning record'
        );
        return {
          post: dedup.existingPost,
          lead: existingLead,
          isDuplicate: true,
        };
      }
      // Post exists in DB but lead creation was interrupted; recover and generate lead
      logger.info(
        { postId: dedup.existingPost.id },
        'Post exists without lead; recovering and completing lead classification'
      );
      targetPost = dedup.existingPost;
    } else {
      // 2. Persist Post to DB
      targetPost = await postRepository.create({
        source,
        externalPostId: externalPostId || null,
        contentHash: dedup.contentHash,
        originalUrl: dedup.sanitizedUrl,
        title: title || null,
        content,
        snippet: snippet || null,
        authorName: authorName || null,
        authorId: authorId || null,
        contentLevel,
        rawMetadata: (rawMetadata as any) || undefined,
      });
    }

    // 3. AI Classification
    let aiResponse;
    try {
      aiResponse = await geminiService.classifyPost(
        targetPost.id,
        content,
        contentLevel,
        title
      );
    } catch (aiErr) {
      logger.error({ err: aiErr, postId: targetPost.id }, 'AI classification failed during pipeline execution');
      await aiLogRepository.create({
        postId: targetPost.id,
        model: 'gemini',
        processingStatus: 'FAILED',
        processingTimeMs: 0,
        errorMessage: (aiErr as Error).message,
      });
      throw new AppError(
        `Failed to classify post with AI: ${(aiErr as Error).message}`,
        502,
        'PIPELINE_AI_ERROR'
      );
    }

    // 4. Log AI Processing Record
    await aiLogRepository.create({
      postId: targetPost.id,
      model: aiResponse.model,
      inputTokens: aiResponse.inputTokens,
      outputTokens: aiResponse.outputTokens,
      processingStatus: 'SUCCESS',
      processingTimeMs: aiResponse.processingTimeMs,
      rawResponse: aiResponse.rawResponse as any,
    });

    // 5. Deterministic Scoring
    const scoreResult = scoringEngineService.calculateScore(aiResponse.result);

    // 6. Upsert Lead
    const createdLead = await leadRepository.upsert({
      postId: targetPost.id,
      classification: aiResponse.result.classification,
      isHiring: aiResponse.result.is_hiring,
      hiringIntent: aiResponse.result.hiring_intent,
      projectTitle: aiResponse.result.project_title,
      projectDescription: aiResponse.result.project_description,
      technologies: aiResponse.result.technologies,
      budget: aiResponse.result.budget,
      deadline: aiResponse.result.deadline,
      startDate: aiResponse.result.start_date,
      contactMethod: aiResponse.result.contact_method,
      confidence: aiResponse.result.confidence,
      missingInformation: aiResponse.result.missing_information,
      reason: aiResponse.result.reason,
      leadScore: scoreResult.score,
      scoreBreakdown: scoreResult.breakdown as any,
      priority: scoreResult.priority,
      status: 'NEW',
    });

    return {
      post: targetPost,
      lead: createdLead,
      isDuplicate: dedup.isDuplicate,
      scoreResult,
      classification: aiResponse.result,
    };
  }

  /**
   * Bulk import Google search result items.
   */
  public async processGoogleSearchImport(
    items: Array<{
      title: string;
      snippet: string;
      originalUrl: string;
      source?: string;
      authorName?: string | null;
      searchDate?: string | null;
    }>
  ): Promise<{
    totalReceived: number;
    processedCount: number;
    duplicateCount: number;
    qualifiedCount: number;
    items: Array<{ postId?: string; isDuplicate: boolean; classification?: string; leadScore?: number }>;
  }> {
    let duplicateCount = 0;
    let qualifiedCount = 0;
    const itemSummaries = [];

    for (const item of items) {
      try {
        const result = await this.processPost({
          source: 'GOOGLE_IMPORT',
          title: item.title,
          content: `${item.title}\n\n${item.snippet}`,
          snippet: item.snippet,
          originalUrl: item.originalUrl,
          authorName: item.authorName || null,
          contentLevel: 'SNIPPET_ONLY',
          publishedAt: item.searchDate ? new Date(item.searchDate) : null,
        });

        if (result.isDuplicate) {
          duplicateCount++;
          itemSummaries.push({
            postId: result.post.id,
            isDuplicate: true,
          });
        } else {
          if (result.lead?.classification === 'QUALIFIED_LEAD') {
            qualifiedCount++;
          }
          itemSummaries.push({
            postId: result.post.id,
            isDuplicate: false,
            classification: result.lead?.classification,
            leadScore: result.lead?.leadScore,
          });
        }
      } catch (err) {
        logger.error({ err, itemUrl: item.originalUrl }, 'Failed to process imported search item');
      }
    }

    return {
      totalReceived: items.length,
      processedCount: items.length - duplicateCount,
      duplicateCount,
      qualifiedCount,
      items: itemSummaries,
    };
  }
}

export const leadPipelineService = new LeadPipelineService();
