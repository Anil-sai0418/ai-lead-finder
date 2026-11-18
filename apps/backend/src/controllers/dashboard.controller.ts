import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPosts,
      totalQualified,
      totalNeedsReview,
      totalRejected,
      totalHighPriority,
      todayDiscovered,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.lead.count({ where: { classification: 'QUALIFIED_LEAD' } }),
      prisma.lead.count({ where: { classification: 'NEEDS_REVIEW' } }),
      prisma.lead.count({ where: { status: 'REJECTED' } }),
      prisma.lead.count({ where: { priority: 'HIGH' } }),
      prisma.post.count({ where: { discoveredAt: { gte: today } } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPosts,
        totalQualified,
        totalNeedsReview,
        totalRejected,
        totalHighPriority,
        todayDiscovered,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSourceDistribution(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const counts = await prisma.post.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    const distribution = counts.map((c) => ({
      source: c.source,
      count: c._count.id,
    }));

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecentLeads(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const leads = await prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { post: true },
    });

    const serializedLeads = leads.map((lead: any) => ({
      ...lead,
      originalUrl: lead.post?.originalUrl || null,
      source: lead.post?.source || null,
      authorName: lead.post?.authorName || null,
    }));

    res.status(200).json({
      success: true,
      data: serializedLeads,
    });
  } catch (error) {
    next(error);
  }
}
