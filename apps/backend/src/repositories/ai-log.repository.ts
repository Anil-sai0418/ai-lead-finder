import { prisma } from '../config/prisma.js';
import { AIProcessingLog, Prisma } from '@prisma/client';

export class AILogRepository {
  public async create(data: {
    postId: string;
    provider?: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    processingStatus: string;
    processingTimeMs: number;
    rawResponse?: Prisma.InputJsonValue;
    errorMessage?: string;
  }): Promise<AIProcessingLog> {
    return prisma.aIProcessingLog.create({
      data: {
        postId: data.postId,
        provider: data.provider || 'GOOGLE_GEMINI',
        model: data.model,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        processingStatus: data.processingStatus,
        processingTimeMs: data.processingTimeMs,
        rawResponse: data.rawResponse,
        errorMessage: data.errorMessage,
      },
    });
  }

  public async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.AIProcessingLogWhereInput;
  }): Promise<{ logs: AIProcessingLog[]; total: number }> {
    const [logs, total] = await Promise.all([
      prisma.aIProcessingLog.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: { createdAt: 'desc' },
        include: { post: true },
      }),
      prisma.aIProcessingLog.count({ where: params.where }),
    ]);

    return { logs, total };
  }
}

export const aiLogRepository = new AILogRepository();
