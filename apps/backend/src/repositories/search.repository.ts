import { prisma } from '../config/prisma.js';
import { SearchQuery, SearchExecution, Prisma, ExecutionStatus } from '@prisma/client';

export class SearchRepository {
  public async createQuery(data: Prisma.SearchQueryCreateInput): Promise<SearchQuery> {
    return prisma.searchQuery.create({ data });
  }

  public async findQueryById(id: string): Promise<(SearchQuery & { executions: SearchExecution[] }) | null> {
    return prisma.searchQuery.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  public async findQueries(params?: {
    isActive?: boolean;
    category?: string;
  }): Promise<Array<SearchQuery & { lastExecution?: SearchExecution | null }>> {
    const queries = await prisma.searchQuery.findMany({
      where: {
        ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
        ...(params?.category ? { category: params.category } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    return queries.map((q) => ({
      ...q,
      lastExecution: q.executions[0] || null,
    }));
  }

  public async updateQuery(id: string, data: Prisma.SearchQueryUpdateInput): Promise<SearchQuery> {
    return prisma.searchQuery.update({
      where: { id },
      data,
    });
  }

  public async deleteQuery(id: string): Promise<SearchQuery> {
    return prisma.searchQuery.delete({
      where: { id },
    });
  }

  public async createExecution(searchQueryId?: string | null): Promise<SearchExecution> {
    return prisma.searchExecution.create({
      data: {
        searchQueryId: searchQueryId || null,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
  }

  public async updateExecution(
    id: string,
    data: {
      status: ExecutionStatus;
      completedAt?: Date;
      resultsFound?: number;
      newPosts?: number;
      duplicates?: number;
      qualifiedLeads?: number;
      failedJobs?: number;
      errorMessage?: string | null;
    }
  ): Promise<SearchExecution> {
    return prisma.searchExecution.update({
      where: { id },
      data,
    });
  }

  public async findExecutions(params: {
    skip?: number;
    take?: number;
    searchQueryId?: string;
  }): Promise<{ executions: SearchExecution[]; total: number }> {
    const where: Prisma.SearchExecutionWhereInput = params.searchQueryId
      ? { searchQueryId: params.searchQueryId }
      : {};

    const [executions, total] = await Promise.all([
      prisma.searchExecution.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: { startedAt: 'desc' },
        include: { searchQuery: true },
      }),
      prisma.searchExecution.count({ where }),
    ]);

    return { executions, total };
  }

  public async findExecutionById(id: string): Promise<SearchExecution | null> {
    return prisma.searchExecution.findUnique({
      where: { id },
      include: { searchQuery: true },
    });
  }
}

export const searchRepository = new SearchRepository();
