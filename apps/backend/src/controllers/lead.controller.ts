import { Request, Response, NextFunction } from 'express';
import { leadRepository } from '../repositories/lead.repository.js';
import { scoringEngineService } from '../services/lead-scoring/scoring-engine.service.js';
import { AppError } from '../middleware/error.middleware.js';
import {
  UpdateLeadStatusInput,
  ManualReviewCorrectionInput,
  AIClassificationResult,
} from '@ai-lead-finder/shared';

export async function getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const classification = req.query.classification as any;
    const priority = req.query.priority as any;
    const status = req.query.status as any;
    const minScore = req.query.minScore ? parseInt(req.query.minScore as string) : undefined;
    const technology = req.query.technology as string | undefined;
    const source = req.query.source as any;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'newest';

    const where: any = {};

    if (classification) {
      where.classification = classification;
    }
    if (priority) {
      where.priority = priority;
    }
    if (status) {
      where.status = status;
    }
    if (minScore !== undefined) {
      where.leadScore = { gte: minScore };
    }
    if (technology) {
      where.technologies = { has: technology.toLowerCase() };
    }
    if (source) {
      where.post = { source };
    }
    if (search) {
      where.OR = [
        { projectTitle: { contains: search, mode: 'insensitive' } },
        { projectDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = sortBy === 'highest_score' ? { leadScore: 'desc' } : { createdAt: 'desc' };

    const { leads, total } = await leadRepository.findMany({
      skip,
      take: limit,
      where,
      orderBy,
    });

    res.status(200).json({
      success: true,
      data: {
        items: leads,
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

export async function getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const lead = await leadRepository.findById(id);

    if (!lead) {
      throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLeadStatus(
  req: Request<{ id: string }, unknown, UpdateLeadStatusInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const existing = await leadRepository.findById(id);
    if (!existing) {
      throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    const updated = await leadRepository.updateStatus(id, status, notes);

    res.status(200).json({
      success: true,
      message: `Lead status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewLead(
  req: Request<{ id: string }, unknown, ManualReviewCorrectionInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const correction = req.body;

    const existing = await leadRepository.findById(id);
    if (!existing) {
      throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    // Recalculate deterministic score based on corrected facts
    const simulatedClassification: AIClassificationResult = {
      post_id: existing.postId,
      classification: correction.classification,
      is_hiring: correction.isHiring,
      hiring_intent: correction.isHiring ? 'EXPLICIT' : 'NONE',
      project_title: correction.projectTitle || existing.projectTitle,
      project_description: correction.projectDescription || existing.projectDescription,
      technologies: correction.technologies || existing.technologies,
      budget: correction.budget !== undefined ? correction.budget : existing.budget,
      deadline: correction.deadline !== undefined ? correction.deadline : existing.deadline,
      start_date: existing.startDate,
      contact_method: existing.contactMethod,
      confidence: 1.0,
      missing_information: [],
      reason: `Manually reviewed: ${correction.reviewNote}`,
    };

    const recalculated = scoringEngineService.calculateScore(simulatedClassification);

    const updated = await leadRepository.applyManualCorrection(
      id,
      correction,
      recalculated.score,
      recalculated.priority,
      recalculated.breakdown as any
    );

    res.status(200).json({
      success: true,
      message: 'Lead review correction applied successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
