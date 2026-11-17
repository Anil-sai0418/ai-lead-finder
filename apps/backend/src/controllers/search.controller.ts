import { Request, Response, NextFunction } from 'express';
import { searchRepository } from '../repositories/search.repository.js';
import { discoveryManagerService } from '../services/discovery/discovery-manager.service.js';
import { AppError } from '../middleware/error.middleware.js';
import {
  CreateSearchQueryInput,
  UpdateSearchQueryInput,
} from '@ai-lead-finder/shared';

export async function createSearchQuery(
  req: Request<unknown, unknown, CreateSearchQueryInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, query, source, category, frequency, maxResults, isActive } = req.body;

    const created = await searchRepository.createQuery({
      name,
      query,
      source,
      category,
      frequency,
      maxResults,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: 'Search query created successfully',
      data: created,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSearchQueries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const category = req.query.category as string | undefined;

    const queries = await searchRepository.findQueries({ isActive, category });

    res.status(200).json({
      success: true,
      data: queries,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSearchQueryById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const query = await searchRepository.findQueryById(id);

    if (!query) {
      throw new AppError('Search query not found', 404, 'SEARCH_QUERY_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: query,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSearchQuery(
  req: Request<{ id: string }, unknown, UpdateSearchQueryInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await searchRepository.findQueryById(id);
    if (!existing) {
      throw new AppError('Search query not found', 404, 'SEARCH_QUERY_NOT_FOUND');
    }

    const updated = await searchRepository.updateQuery(id, data);

    res.status(200).json({
      success: true,
      message: 'Search query updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSearchQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);

    const existing = await searchRepository.findQueryById(id);
    if (!existing) {
      throw new AppError('Search query not found', 404, 'SEARCH_QUERY_NOT_FOUND');
    }

    await searchRepository.deleteQuery(id);

    res.status(200).json({
      success: true,
      message: 'Search query deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function runSearchQueryNow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const execution = await discoveryManagerService.triggerSearchExecution(id);

    res.status(202).json({
      success: true,
      message: 'Search execution started',
      data: {
        executionId: execution.id,
        searchQueryId: id,
        status: execution.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getExecutions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const searchQueryId = req.query.searchQueryId as string | undefined;

    const { executions, total } = await searchRepository.findExecutions({
      skip,
      take: limit,
      searchQueryId,
    });

    res.status(200).json({
      success: true,
      data: {
        items: executions,
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

export async function getExecutionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const execution = await searchRepository.findExecutionById(id);

    if (!execution) {
      throw new AppError('Search execution not found', 404, 'EXECUTION_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: execution,
    });
  } catch (error) {
    next(error);
  }
}
