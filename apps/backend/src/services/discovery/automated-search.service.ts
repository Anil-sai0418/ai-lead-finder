import { tavilySourceService, TavilySearchOptions } from './tavily-source.service.js';
import { leadPipelineService } from '../leads/lead-pipeline.service.js';
import { deduplicationService } from '../deduplication/deduplication.service.js';
import { searchRepository } from '../../repositories/search.repository.js';
import { prisma } from '../../config/prisma.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  AutomatedSearchInput,
  AutomatedSearchExecutionSummary,
  AutomatedSearchResultItem,
} from '@ai-lead-finder/shared';

export class AutomatedSearchService {
  /**
   * Orchestrates an automated lead discovery run using the official Tavily Search API.
   * Tracks full execution metrics in SearchExecution, normalizes results, performs
   * 3-tier deduplication, and routes new candidates through Gemini AI & deterministic scoring.
   */
  public async executeAutomatedSearch(
    input: AutomatedSearchInput & { searchQueryId?: string }
  ): Promise<AutomatedSearchExecutionSummary> {
    const startTime = Date.now();
    const { query, targetPlatform, maxResults, searchDepth, searchQueryId } = input;

    // 1. Resolve or create SearchQuery record to maintain audit history
    let queryId = searchQueryId;
    if (!queryId) {
      try {
        const existingQuery = await prisma.searchQuery.findFirst({
          where: { query, source: 'TAVILY' },
        });

        if (existingQuery) {
          queryId = existingQuery.id;
        } else {
          const platformLabel = targetPlatform.charAt(0).toUpperCase() + targetPlatform.slice(1);
          const created = await searchRepository.createQuery({
            name: `${platformLabel} Web: ${query.slice(0, 30)}`,
            query,
            source: 'TAVILY',
            category: `${platformLabel} Discovery`,
            frequency: 'MANUAL',
            maxResults,
            isActive: true,
          });
          queryId = created.id;
        }
      } catch (err) {
        logger.warn({ err }, 'Could not associate search execution with query record; continuing ad-hoc');
      }
    }

    // 2. Start SearchExecution audit record
    const execution = await searchRepository.createExecution(queryId || null);

    let totalRetrieved = 0;
    let newDiscovered = 0;
    let duplicatesSkipped = 0;
    let sentForClassification = 0;
    let qualifiedLeads = 0;
    let notALead = 0;
    let needsReview = 0;
    let failedCount = 0;
    const items: AutomatedSearchResultItem[] = [];

    try {
      // 3. Query Tavily Search API
      const searchResult = await tavilySourceService.search(query, {
        targetPlatform,
        maxResults,
        searchDepth,
      });

      totalRetrieved = searchResult.posts.length;

      // 4. Process each search result
      for (const discovered of searchResult.posts) {
        try {
          // Check for duplicate by canonical URL, external ID, or content hash
          const dedup = await deduplicationService.check({
            source: discovered.source,
            content: discovered.content,
            originalUrl: discovered.originalUrl,
            externalPostId: discovered.externalPostId,
          });

          if (dedup.isDuplicate && dedup.existingPost) {
            duplicatesSkipped++;
            logger.info(
              { url: discovered.originalUrl, postId: dedup.existingPost.id },
              'Duplicate post skipped from automated search'
            );

            // Fetch existing lead details to include in response summary
            const existingLead = await prisma.lead.findUnique({
              where: { postId: dedup.existingPost.id },
            });

            items.push({
              postId: dedup.existingPost.id,
              leadId: existingLead?.id,
              title: dedup.existingPost.title || discovered.title || null,
              originalUrl: dedup.existingPost.originalUrl,
              source: dedup.existingPost.source,
              contentLevel: dedup.existingPost.contentLevel,
              isDuplicate: true,
              classification: existingLead?.classification,
              leadScore: existingLead?.leadScore,
              priority: existingLead?.priority,
              projectDescription: existingLead?.projectDescription,
              technologies: existingLead?.technologies || [],
              budget: existingLead?.budget,
              deadline: existingLead?.deadline,
              reason: existingLead?.reason,
            });
            continue;
          }

          // New post: Route to Gemini AI classification and deterministic scoring
          sentForClassification++;
          const processed = await leadPipelineService.processPost(discovered);
          newDiscovered++;

          const classification = processed.lead?.classification;
          if (classification === 'QUALIFIED_LEAD') {
            qualifiedLeads++;
          } else if (classification === 'NOT_A_LEAD') {
            notALead++;
          } else if (classification === 'NEEDS_REVIEW') {
            needsReview++;
          }

          items.push({
            postId: processed.post.id,
            leadId: processed.lead?.id,
            title: processed.post.title || discovered.title || null,
            originalUrl: processed.post.originalUrl,
            source: processed.post.source,
            contentLevel: processed.post.contentLevel,
            isDuplicate: false,
            classification: processed.lead?.classification,
            leadScore: processed.lead?.leadScore,
            priority: processed.lead?.priority,
            projectDescription: processed.lead?.projectDescription,
            technologies: processed.lead?.technologies || [],
            budget: processed.lead?.budget,
            deadline: processed.lead?.deadline,
            reason: processed.lead?.reason,
          });
        } catch (itemError) {
          failedCount++;
          logger.error(
            { err: itemError, url: discovered.originalUrl },
            'Failed processing individual Tavily search result'
          );
        }
      }

      // 5. Update SearchExecution record with completion metrics
      await searchRepository.updateExecution(execution.id, {
        status: 'COMPLETED',
        completedAt: new Date(),
        resultsFound: totalRetrieved,
        newPosts: newDiscovered,
        duplicates: duplicatesSkipped,
        qualifiedLeads,
        failedJobs: failedCount,
        errorMessage: null,
      });

      if (queryId) {
        await searchRepository.updateQuery(queryId, {
          lastExecutedAt: new Date(),
        });
      }

      const durationMs = Date.now() - startTime;

      logger.info(
        {
          executionId: execution.id,
          totalRetrieved,
          newDiscovered,
          duplicatesSkipped,
          qualifiedLeads,
          durationMs,
        },
        'Automated search execution completed successfully'
      );

      return {
        executionId: execution.id,
        query,
        targetPlatform,
        totalRetrieved,
        newDiscovered,
        duplicatesSkipped,
        sentForClassification,
        qualifiedLeads,
        notALead,
        needsReview,
        failedCount,
        durationMs,
        items,
      };
    } catch (error) {
      // 6. Record failure on SearchExecution
      await searchRepository.updateExecution(execution.id, {
        status: 'FAILED',
        completedAt: new Date(),
        resultsFound: totalRetrieved,
        newPosts: newDiscovered,
        duplicates: duplicatesSkipped,
        qualifiedLeads,
        failedJobs: failedCount,
        errorMessage: (error as Error).message,
      });

      logger.error({ err: error, executionId: execution.id }, 'Automated search execution failed');
      throw error;
    }
  }
}

export const automatedSearchService = new AutomatedSearchService();
