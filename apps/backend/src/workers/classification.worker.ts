import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { ClassificationJobData, queueRegistry } from '../queues/queue.registry.js';
import { geminiService } from '../services/ai/gemini.service.js';
import { aiLogRepository } from '../repositories/ai-log.repository.js';

export function startClassificationWorker(): Worker<ClassificationJobData> {
  const worker = new Worker<ClassificationJobData>(
    'classification-queue',
    async (job: Job<ClassificationJobData>) => {
      const { postId, content, contentLevel, title, executionId } = job.data;
      logger.info({ jobId: job.id, postId }, 'ClassificationWorker started job');

      try {
        const aiResponse = await geminiService.classifyPost(
          postId,
          content,
          contentLevel,
          title
        );

        // Store AI Log
        await aiLogRepository.create({
          postId,
          model: aiResponse.model,
          inputTokens: aiResponse.inputTokens,
          outputTokens: aiResponse.outputTokens,
          processingStatus: 'SUCCESS',
          processingTimeMs: aiResponse.processingTimeMs,
          rawResponse: aiResponse.rawResponse as any,
        });

        // Forward to Lead Processing Queue
        const leadQueue = queueRegistry.getLeadProcessingQueue();
        if (leadQueue) {
          await leadQueue.add(`lead-process-${postId}`, {
            postId,
            classification: aiResponse.result,
            executionId,
          });
        }
      } catch (err) {
        logger.error({ err, postId }, 'ClassificationWorker encountered error');
        await aiLogRepository.create({
          postId,
          model: 'gemini',
          processingStatus: 'FAILED',
          processingTimeMs: 0,
          errorMessage: (err as Error).message,
        });
        throw err;
      }
    },
    {
      connection: getRedisClient(),
      concurrency: 3,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'ClassificationWorker job failed after retries');
  });

  return worker;
}
