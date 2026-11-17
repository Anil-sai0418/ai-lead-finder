import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { DiscoveryJobData, queueRegistry } from '../queues/queue.registry.js';
import { twitterSourceService } from '../services/discovery/twitter-source.service.js';
import { deduplicationService } from '../services/deduplication/deduplication.service.js';
import { postRepository } from '../repositories/post.repository.js';
import { searchRepository } from '../repositories/search.repository.js';

export function startDiscoveryWorker(): Worker<DiscoveryJobData> {
  const worker = new Worker<DiscoveryJobData>(
    'discovery-queue',
    async (job: Job<DiscoveryJobData>) => {
      const { searchQueryId, executionId, query, source, maxResults } = job.data;
      logger.info({ jobId: job.id, query, executionId }, 'DiscoveryWorker started job');

      let resultsFound = 0;
      let newPosts = 0;
      let duplicates = 0;

      try {
        const searchResult = await twitterSourceService.search(query, { maxResults });
        resultsFound = searchResult.posts.length;

        const classificationQueue = queueRegistry.getClassificationQueue();

        for (const post of searchResult.posts) {
          const dedup = await deduplicationService.check({
            source: post.source,
            content: post.content,
            originalUrl: post.originalUrl,
            externalPostId: post.externalPostId,
          });

          if (dedup.isDuplicate) {
            duplicates++;
            continue;
          }

          // Persist post
          const savedPost = await postRepository.create({
            source: post.source,
            externalPostId: post.externalPostId || null,
            contentHash: dedup.contentHash,
            originalUrl: dedup.sanitizedUrl,
            title: post.title || null,
            content: post.content,
            snippet: post.snippet || null,
            authorName: post.authorName || null,
            authorId: post.authorId || null,
            contentLevel: post.contentLevel,
          });
          newPosts++;

          // Push to classification queue
          if (classificationQueue) {
            await classificationQueue.add(`classify-${savedPost.id}`, {
              postId: savedPost.id,
              content: savedPost.content,
              contentLevel: savedPost.contentLevel,
              title: savedPost.title,
              executionId,
            });
          }
        }

        await searchRepository.updateExecution(executionId, {
          status: 'COMPLETED',
          completedAt: new Date(),
          resultsFound,
          newPosts,
          duplicates,
        });

        logger.info({ executionId, resultsFound, newPosts, duplicates }, 'DiscoveryWorker completed execution');
      } catch (err) {
        logger.error({ err, executionId }, 'DiscoveryWorker job failed');
        await searchRepository.updateExecution(executionId, {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: (err as Error).message,
        });
        throw err;
      }
    },
    {
      connection: getRedisClient(),
      concurrency: 2,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'DiscoveryWorker job encountered failure');
  });

  return worker;
}
