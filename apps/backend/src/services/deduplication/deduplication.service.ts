import { postRepository } from '../../repositories/post.repository.js';
import { computeContentHash, sanitizeUrl } from '../../utils/hash.js';
import { DiscoverySource, Post } from '@prisma/client';

export interface DeduplicationCheckResult {
  isDuplicate: boolean;
  existingPost: Post | null;
  contentHash: string;
  sanitizedUrl: string;
}

export class DeduplicationService {
  public async check(params: {
    source: DiscoverySource;
    content: string;
    originalUrl: string;
    externalPostId?: string | null;
  }): Promise<DeduplicationCheckResult> {
    const sanitizedUrl = sanitizeUrl(params.originalUrl);
    const contentHash = computeContentHash(params.content, sanitizedUrl);

    // 1. Check external post ID if available
    if (params.externalPostId) {
      const byExternal = await postRepository.findByExternalId(params.source, params.externalPostId);
      if (byExternal) {
        return {
          isDuplicate: true,
          existingPost: byExternal,
          contentHash,
          sanitizedUrl,
        };
      }
    }

    // 2. Check content hash (catches reposts / cross-posts / imported text duplicates)
    const byHash = await postRepository.findByContentHash(contentHash);
    if (byHash) {
      return {
        isDuplicate: true,
        existingPost: byHash,
        contentHash,
        sanitizedUrl,
      };
    }

    return {
      isDuplicate: false,
      existingPost: null,
      contentHash,
      sanitizedUrl,
    };
  }
}

export const deduplicationService = new DeduplicationService();
