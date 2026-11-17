import { searchRepository } from '../../repositories/search.repository.js';
import { twitterSourceService } from './twitter-source.service.js';
import { deduplicationService } from '../deduplication/deduplication.service.js';
import { postRepository } from '../../repositories/post.repository.js';
import { leadPipelineService } from '../leads/lead-pipeline.service.js';
import { queueRegistry } from '../../queues/queue.registry.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import { SearchExecution } from '@prisma/client';

export class DiscoveryManagerService {
  /**
   * Executes a search query either via BullMQ background queue or direct synchronous pipeline.
   */
  public async triggerSearchExecution(searchQueryId: string): Promise<SearchExecution> {
    const queryRecord = await searchRepository.findQueryById(searchQueryId);
    if (!queryRecord) {
      throw new AppError('Search query not found', 404, 'SEARCH_QUERY_NOT_FOUND');
    }

    const execution = await searchRepository.createExecution(searchQueryId);
    const discoveryQueue = queueRegistry.getDiscoveryQueue();

    if (discoveryQueue) {
      // Dispatch to BullMQ discovery queue
      await discoveryQueue.add(
        `search-${searchQueryId}-${execution.id}`,
        {
          searchQueryId,
          executionId: execution.id,
          query: queryRecord.query,
          source: queryRecord.source as any,
          maxResults: queryRecord.maxResults,
        },
        { jobId: execution.id }
      );
      logger.info({ searchQueryId, executionId: execution.id }, 'Search execution dispatched to BullMQ discovery queue');
      return execution;
    }

    // Direct synchronous fallback execution (when Redis is offline or in direct mode)
    this.executeSearchSynchronously(queryRecord, execution).catch((err) => {
      logger.error({ err, executionId: execution.id }, 'Synchronous search execution failed');
    });

    return execution;
  }

  public async executeSearchSynchronously(
    queryRecord: { id: string; query: string; source: string; maxResults: number },
    execution: SearchExecution
  ): Promise<void> {
    logger.info({ executionId: execution.id, query: queryRecord.query }, 'Starting direct search execution');

    let resultsFound = 0;
    let newPosts = 0;
    let duplicates = 0;
    let qualifiedLeads = 0;
    let failedJobs = 0;

    try {
      // 1. Fetch posts from provider
      let searchResult;
      if (queryRecord.source === 'TWITTER') {
        searchResult = await twitterSourceService.search(queryRecord.query, {
          maxResults: queryRecord.maxResults,
        });
      } else {
        throw new AppError(`Provider ${queryRecord.source} does not support live search query`, 400);
      }

      resultsFound = searchResult.posts.length;

      // 2. Process each post through deduplication, AI, and deterministic scoring
      for (const discovered of searchResult.posts) {
        try {
          const processed = await leadPipelineService.processPost(discovered);
          if (processed.isDuplicate) {
            duplicates++;
          } else {
            newPosts++;
            if (processed.lead?.classification === 'QUALIFIED_LEAD') {
              qualifiedLeads++;
            }
          }
        } catch (postErr) {
          failedJobs++;
          logger.error({ postErr, postId: discovered.externalPostId }, 'Error processing individual post in search run');
        }
      }

      // 3. Update search execution record
      await searchRepository.updateExecution(execution.id, {
        status: 'COMPLETED',
        completedAt: new Date(),
        resultsFound,
        newPosts,
        duplicates,
        qualifiedLeads,
        failedJobs,
      });

      // Update query last executed timestamp
      await searchRepository.updateQuery(queryRecord.id, {
        lastExecutedAt: new Date(),
      });

      logger.info(
        { executionId: execution.id, resultsFound, newPosts, duplicates, qualifiedLeads },
        'Search execution completed successfully'
      );
    } catch (error) {
      try {
        await searchRepository.updateExecution(execution.id, {
          status: 'FAILED',
          completedAt: new Date(),
          resultsFound,
          newPosts,
          duplicates,
          qualifiedLeads,
          failedJobs,
          errorMessage: (error as Error).message,
        });
      } catch (updateErr) {
        logger.warn({ updateErr }, 'Could not record failed execution status');
      }
      throw error;
    }
  }
}

export const discoveryManagerService = new DiscoveryManagerService();
