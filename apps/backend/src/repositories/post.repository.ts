import { prisma } from '../config/prisma.js';
import { Post, Prisma } from '@prisma/client';

export class PostRepository {
  public async findByContentHash(contentHash: string): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { contentHash },
      include: { lead: true },
    });
  }

  public async findByExternalId(source: Post['source'], externalPostId: string): Promise<Post | null> {
    return prisma.post.findUnique({
      where: {
        source_externalPostId: {
          source,
          externalPostId,
        },
      },
      include: { lead: true },
    });
  }

  public async findById(id: string): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { id },
      include: { lead: true, aiLogs: true },
    });
  }

  public async findByUrl(originalUrl: string): Promise<Post | null> {
    return prisma.post.findFirst({
      where: { originalUrl },
      include: { lead: true },
    });
  }

  public async create(data: Prisma.PostCreateInput): Promise<Post> {
    return prisma.post.create({
      data,
      include: { lead: true },
    });
  }

  public async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<{ posts: Post[]; total: number }> {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy || { discoveredAt: 'desc' },
        include: { lead: true },
      }),
      prisma.post.count({ where: params.where }),
    ]);

    return { posts, total };
  }
}

export const postRepository = new PostRepository();
