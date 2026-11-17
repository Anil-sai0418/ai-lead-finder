import { DiscoveredPost } from '@ai-lead-finder/shared';

export interface SearchOptions {
  maxResults?: number;
  nextToken?: string;
  sinceId?: string;
}

export interface SearchResult {
  posts: DiscoveredPost[];
  nextToken?: string;
  totalFound: number;
}

export interface LeadSource {
  readonly name: string;
  search(query: string, options?: SearchOptions): Promise<SearchResult>;
}
