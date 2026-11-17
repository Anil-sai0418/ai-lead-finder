import { Request, Response, NextFunction } from 'express';
import { leadPipelineService } from '../services/leads/lead-pipeline.service.js';
import { postRepository } from '../repositories/post.repository.js';
import {
  ManualPostSubmissionInput,
  GoogleSearchResultImportInput,
} from '@ai-lead-finder/shared';

export async function submitManualPost(
  req: Request<unknown, unknown, ManualPostSubmissionInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sourcePlatform, originalUrl, content, title, authorName, publishedAt } = req.body;

    const result = await leadPipelineService.processPost({
      source: sourcePlatform,
      originalUrl,
      content,
      title: title || null,
      authorName: authorName || null,
      contentLevel: 'MANUAL_TEXT',
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    });

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      message: result.isDuplicate ? 'Post was already discovered previously (duplicate)' : 'Post successfully ingested and classified',
      data: {
        postId: result.post.id,
        isDuplicate: result.isDuplicate,
        lead: result.lead,
        classification: result.classification,
        scoreResult: result.scoreResult,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function importGoogleResults(
  req: Request<unknown, unknown, GoogleSearchResultImportInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { items } = req.body;
    const summary = await leadPipelineService.processGoogleSearchImport(items);

    res.status(200).json({
      success: true,
      message: `Imported ${summary.processedCount} search results (${summary.duplicateCount} duplicates skipped)`,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const source = req.query.source as any;

    const where: any = {};
    if (source) {
      where.source = source;
    }

    const { posts, total } = await postRepository.findMany({
      skip,
      take: limit,
      where,
      orderBy: { discoveredAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: {
        items: posts,
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
