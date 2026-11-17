import { prisma } from '../config/prisma.js';
import { Lead, Prisma, LeadStatus } from '@prisma/client';

export class LeadRepository {
  public async findById(id: string): Promise<(Lead & { post: unknown }) | null> {
    return prisma.lead.findUnique({
      where: { id },
      include: {
        post: {
          include: {
            aiLogs: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });
  }

  public async findByPostId(postId: string): Promise<Lead | null> {
    return prisma.lead.findUnique({
      where: { postId },
      include: { post: true },
    });
  }

  public async upsert(data: {
    postId: string;
    classification: Lead['classification'];
    isHiring: boolean;
    hiringIntent: Lead['hiringIntent'];
    projectTitle?: string | null;
    projectDescription?: string | null;
    technologies?: string[];
    budget?: string | null;
    deadline?: string | null;
    startDate?: string | null;
    contactMethod?: string | null;
    confidence: number;
    missingInformation?: string[];
    reason: string;
    leadScore: number;
    scoreBreakdown?: Prisma.InputJsonValue;
    priority: Lead['priority'];
    status?: LeadStatus;
  }): Promise<Lead> {
    return prisma.lead.upsert({
      where: { postId: data.postId },
      create: {
        postId: data.postId,
        classification: data.classification,
        isHiring: data.isHiring,
        hiringIntent: data.hiringIntent,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        technologies: data.technologies || [],
        budget: data.budget,
        deadline: data.deadline,
        startDate: data.startDate,
        contactMethod: data.contactMethod,
        confidence: data.confidence,
        missingInformation: data.missingInformation || [],
        reason: data.reason,
        leadScore: data.leadScore,
        scoreBreakdown: data.scoreBreakdown,
        priority: data.priority,
        status: data.status || 'NEW',
      },
      update: {
        classification: data.classification,
        isHiring: data.isHiring,
        hiringIntent: data.hiringIntent,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        technologies: data.technologies || [],
        budget: data.budget,
        deadline: data.deadline,
        startDate: data.startDate,
        contactMethod: data.contactMethod,
        confidence: data.confidence,
        missingInformation: data.missingInformation || [],
        reason: data.reason,
        leadScore: data.leadScore,
        scoreBreakdown: data.scoreBreakdown,
        priority: data.priority,
      },
      include: { post: true },
    });
  }

  public async updateStatus(id: string, status: LeadStatus, notes?: string): Promise<Lead> {
    return prisma.lead.update({
      where: { id },
      data: {
        status,
        ...(notes ? { notes } : {}),
        reviewedAt: new Date(),
      },
      include: { post: true },
    });
  }

  public async applyManualCorrection(
    id: string,
    correction: {
      classification: Lead['classification'];
      isHiring: boolean;
      projectTitle?: string | null;
      projectDescription?: string | null;
      technologies?: string[];
      budget?: string | null;
      deadline?: string | null;
      reviewNote: string;
    },
    newScore: number,
    newPriority: Lead['priority'],
    newBreakdown: Prisma.InputJsonValue
  ): Promise<Lead> {
    return prisma.lead.update({
      where: { id },
      data: {
        classification: correction.classification,
        isHiring: correction.isHiring,
        ...(correction.projectTitle ? { projectTitle: correction.projectTitle } : {}),
        ...(correction.projectDescription ? { projectDescription: correction.projectDescription } : {}),
        ...(correction.technologies ? { technologies: correction.technologies } : {}),
        ...(correction.budget !== undefined ? { budget: correction.budget } : {}),
        ...(correction.deadline !== undefined ? { deadline: correction.deadline } : {}),
        leadScore: newScore,
        priority: newPriority,
        scoreBreakdown: newBreakdown,
        status: 'REVIEWED',
        reviewedAt: new Date(),
        manualCorrection: correction as Prisma.InputJsonValue,
      },
      include: { post: true },
    });
  }

  public async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.LeadWhereInput;
    orderBy?: Prisma.LeadOrderByWithRelationInput;
  }): Promise<{ leads: Lead[]; total: number }> {
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy || { createdAt: 'desc' },
        include: { post: true },
      }),
      prisma.lead.count({ where: params.where }),
    ]);

    return { leads, total };
  }
}

export const leadRepository = new LeadRepository();
