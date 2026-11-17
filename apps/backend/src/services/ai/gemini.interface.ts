import { AIClassificationResult, ContentLevel } from '@ai-lead-finder/shared';

export interface AIServiceResponse {
  result: AIClassificationResult;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  processingTimeMs: number;
  rawResponse: Record<string, unknown>;
}

export interface IAIService {
  classifyPost(
    postId: string,
    content: string,
    contentLevel: ContentLevel,
    title?: string | null
  ): Promise<AIServiceResponse>;
}
