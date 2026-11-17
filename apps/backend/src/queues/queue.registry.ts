import { Queue } from 'bullmq';
import { getRedisClient, isRedisConnected } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { DiscoveredPost, AIClassificationResult } from '@ai-lead-finder/shared';

export interface DiscoveryJobData {
  searchQueryId: string;
  executionId: string;
  query: string;
  source: 'TWITTER' | 'GOOGLE_IMPORT' | 'MANUAL';
  maxResults: number;
}

export interface ClassificationJobData {
  postId: string;
  content: string;
  contentLevel: 'FULL_TEXT' | 'SNIPPET_ONLY' | 'MANUAL_TEXT';
  title?: string | null;
  executionId?: string;
}

export interface LeadProcessingJobData {
  postId: string;
  classification: AIClassificationResult;
  executionId?: string;
}

class QueueRegistry {
  private discoveryQueue: Queue<DiscoveryJobData> | null = null;
  private classificationQueue: Queue<ClassificationJobData> | null = null;
  private leadProcessingQueue: Queue<LeadProcessingJobData> | null = null;

  public getDiscoveryQueue(): Queue<DiscoveryJobData> | null {
    if (!isRedisConnected()) return null;
    if (!this.discoveryQueue) {
      this.discoveryQueue = new Queue<DiscoveryJobData>('discovery-queue', {
        connection: getRedisClient(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      });
    }
    return this.discoveryQueue;
  }

  public getClassificationQueue(): Queue<ClassificationJobData> | null {
    if (!isRedisConnected()) return null;
    if (!this.classificationQueue) {
      this.classificationQueue = new Queue<ClassificationJobData>('classification-queue', {
        connection: getRedisClient(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      });
    }
    return this.classificationQueue;
  }

  public getLeadProcessingQueue(): Queue<LeadProcessingJobData> | null {
    if (!isRedisConnected()) return null;
    if (!this.leadProcessingQueue) {
      this.leadProcessingQueue = new Queue<LeadProcessingJobData>('lead-processing-queue', {
        connection: getRedisClient(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      });
    }
    return this.leadProcessingQueue;
  }

  public async closeAll(): Promise<void> {
    try {
      if (this.discoveryQueue) await this.discoveryQueue.close();
      if (this.classificationQueue) await this.classificationQueue.close();
      if (this.leadProcessingQueue) await this.leadProcessingQueue.close();
      logger.info('BullMQ queues closed');
    } catch (err) {
      logger.error({ err }, 'Error closing BullMQ queues');
    }
  }
}

export const queueRegistry = new QueueRegistry();
