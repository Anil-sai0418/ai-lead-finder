import { Request, Response, NextFunction } from 'express';
import { aiLogRepository } from '../repositories/ai-log.repository.js';
import { geminiService } from '../services/ai/gemini.service.js';
import { scoringEngineService } from '../services/lead-scoring/scoring-engine.service.js';

export async function getAILogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const { logs, total } = await aiLogRepository.findMany({
      skip,
      take: limit,
    });

    res.status(200).json({
      success: true,
      data: {
        items: logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function classifyPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { content, title, contentLevel } = req.body;

    const aiResponse = await geminiService.classifyPost(
      'preview-id',
      content || '',
      contentLevel || 'FULL_TEXT',
      title
    );

    const scoreResult = scoringEngineService.calculateScore(aiResponse.result);

    res.status(200).json({
      success: true,
      data: {
        classification: aiResponse.result,
        scoreResult,
        model: aiResponse.model,
        processingTimeMs: aiResponse.processingTimeMs,
      },
    });
  } catch (error) {
    next(error);
  }
}
