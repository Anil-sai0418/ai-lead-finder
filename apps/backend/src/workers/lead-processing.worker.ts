import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { LeadProcessingJobData } from '../queues/queue.registry.js';
import { scoringEngineService } from '../services/lead-scoring/scoring-engine.service.js';
import { leadRepository } from '../repositories/lead.repository.js';

export function startLeadProcessingWorker(): Worker<LeadProcessingJobData> {
  const worker = new Worker<LeadProcessingJobData>(
    'lead-processing-queue',
    async (job: Job<LeadProcessingJobData>) => {
      const { postId, classification } = job.data;
      logger.info({ jobId: job.id, postId }, 'LeadProcessingWorker calculating score and saving lead');

      try {
        const scoreResult = scoringEngineService.calculateScore(classification);

        await leadRepository.upsert({
          postId,
          classification: classification.classification,
          isHiring: classification.is_hiring,
          hiringIntent: classification.hiring_intent,
          projectTitle: classification.project_title,
          projectDescription: classification.project_description,
          technologies: classification.technologies,
          budget: classification.budget,
          deadline: classification.deadline,
          startDate: classification.start_date,
          contactMethod: classification.contact_method,
          confidence: classification.confidence,
          missingInformation: classification.missing_information,
          reason: classification.reason,
          leadScore: scoreResult.score,
          scoreBreakdown: scoreResult.breakdown as any,
          priority: scoreResult.priority,
          status: 'NEW',
        });

        logger.info(
          { postId, score: scoreResult.score, priority: scoreResult.priority },
          'Lead successfully saved by LeadProcessingWorker'
        );
      } catch (err) {
        logger.error({ err, postId }, 'LeadProcessingWorker error');
        throw err;
      }
    },
    {
      connection: getRedisClient(),
      concurrency: 5,
    }
  );

  return worker;
}
