import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AIClassificationResult,
  AIClassificationSchema,
  ContentLevel,
} from '@ai-lead-finder/shared';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  GEMINI_SYSTEM_INSTRUCTION,
  buildGeminiPrompt,
} from './prompt-templates.js';
import { IAIService, AIServiceResponse } from './gemini.interface.js';

export class GeminiService implements IAIService {
  private client: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || env.GEMINI_API_KEY;
    this.modelName = modelName || env.GEMINI_MODEL || 'gemini-1.5-flash';

    const isPlaceholder =
      !key ||
      key === 'your-gemini-api-key-here' ||
      key.startsWith('your-') ||
      key.trim() === '';

    if (!isPlaceholder) {
      this.client = new GoogleGenerativeAI(key);
    } else {
      logger.warn(
        'GEMINI_API_KEY is not set or is a placeholder. GeminiService will run in deterministic heuristic simulation mode.'
      );
    }
  }

  public async classifyPost(
    postId: string,
    content: string,
    contentLevel: ContentLevel,
    title?: string | null
  ): Promise<AIServiceResponse> {
    const startTime = Date.now();

    if (!this.client) {
      logger.info({ postId }, 'Running heuristic classification fallback (no API key)');
      const simulated = this.heuristicClassification(postId, content, contentLevel, title);
      const processingTimeMs = Date.now() - startTime;
      return {
        result: simulated,
        model: 'heuristic-simulation-fallback',
        processingTimeMs,
        rawResponse: simulated as unknown as Record<string, unknown>,
      };
    }

    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const prompt = buildGeminiPrompt(postId, content, contentLevel, title);
      const apiResponse = await model.generateContent(prompt);
      const text = apiResponse.response.text();
      const processingTimeMs = Date.now() - startTime;

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(text);
      } catch (err) {
        throw new AppError(
          `Failed to parse Gemini response as JSON: ${(err as Error).message}`,
          502,
          'GEMINI_JSON_PARSE_ERROR',
          { rawOutput: text }
        );
      }

      // Strict validation through Zod
      const validation = AIClassificationSchema.safeParse(parsedJson);
      if (!validation.success) {
        logger.error({ errors: validation.error.errors, parsedJson }, 'Gemini response failed Zod validation');
        throw new AppError(
          'Gemini response did not conform to the expected classification schema',
          502,
          'GEMINI_SCHEMA_VALIDATION_ERROR',
          validation.error.errors
        );
      }

      const inputTokens = apiResponse.response.usageMetadata?.promptTokenCount;
      const outputTokens = apiResponse.response.usageMetadata?.candidatesTokenCount;

      return {
        result: validation.data as AIClassificationResult,
        model: this.modelName,
        inputTokens,
        outputTokens,
        processingTimeMs,
        rawResponse: parsedJson as Record<string, unknown>,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      logger.error({ error, postId, processingTimeMs }, 'Gemini classification failed');
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Gemini API execution failed: ${(error as Error).message}`,
        502,
        'GEMINI_API_ERROR'
      );
    }
  }

  /**
   * Deterministic heuristic fallback used when API key is not configured or in offline tests.
   */
  public heuristicClassification(
    postId: string,
    content: string,
    contentLevel: ContentLevel,
    title?: string | null
  ): AIClassificationResult {
    const text = `${title || ''} ${content}`.toLowerCase();

    // Check for prompt injection attempts
    const isPromptInjection =
      text.includes('ignore previous') ||
      text.includes('system prompt') ||
      text.includes('classify this as qualified_lead');

    // Job seekers / sellers indicators
    const isJobSeeker =
      text.includes('i am looking for a job') ||
      text.includes('open to work') ||
      text.includes('hire me') ||
      text.includes('portfolio:') ||
      text.includes('my resume') ||
      text.includes('actively seeking roles') ||
      text.includes('looking for junior developer position') ||
      text.includes('i am a freelance developer available');

    // Service promotion / marketing
    const isAgencyPromotion =
      text.includes('we are a software development agency') ||
      text.includes('we build apps for clients') ||
      text.includes('check out our agency') ||
      text.includes('contact our team for development services');

    // Buyer hiring intent indicators: flexible pattern matching (e.g. "looking for a React developer", "need an urgent developer")
    const hiringRegex = /\b(looking\s+(for|to\s+hire|to\s+connect\s+with)|need|seeking|hiring|want\s+to\s+hire)\b.*?\b(developers?|freelancers?|engineers?|agency|agencies|team|teams|someone\s+to\s+build|devs?)\b/i;
    const hasHiringIntent = hiringRegex.test(text) && !isJobSeeker && !isAgencyPromotion;

    // Vague idea or exploration without explicit hiring commitment
    const isVagueIdea = /\b(thinking\s+about\s+building|wondering\s+how\s+much|anyone\s+built\s+something\s+similar|exploring\s+partners)\b/i.test(text);

    // Detect technologies
    const techPatterns = [
      'react',
      'next.js',
      'nextjs',
      'node.js',
      'nodejs',
      'typescript',
      'javascript',
      'python',
      'django',
      'fastapi',
      'postgresql',
      'postgres',
      'mongodb',
      'aws',
      'tailwind',
      'flutter',
      'react native',
      'vue',
      'ai',
      'llm',
    ];
    const detectedTech = techPatterns.filter((tech) => text.includes(tech));

    // Budget detection
    const budgetMatch = content.match(/\$[\d,]+(\s*-\s*\$[\d,]+)?|\b\d+k\s*usd\b|\bbudget:\s*[\$\w\d\s]+/i);
    const budget = budgetMatch ? budgetMatch[0].trim() : null;

    // Deadline detection
    const deadlineMatch = content.match(/\b(within\s+\d+\s+(weeks?|days?|months?)|deadline:\s*[\w\d\s]+|by\s+(end of\s+)?(this month|next month|\w+\s+\d{1,2}))\b/i);
    const deadline = deadlineMatch ? deadlineMatch[0].trim() : null;

    // Contact method
    const contactMatch = content.match(/\b(dm\s+me|send\s+dm|email:\s*[\w@.]+|reach\s+out\s+at\s+[\w@.]+)\b/i);
    const contactMethod = contactMatch ? contactMatch[0].trim() : null;

    if (isPromptInjection) {
      return {
        post_id: postId,
        classification: 'NOT_A_LEAD',
        is_hiring: false,
        hiring_intent: 'NONE',
        project_title: null,
        project_description: null,
        technologies: [],
        budget: null,
        deadline: null,
        start_date: null,
        contact_method: null,
        confidence: 0.95,
        missing_information: ['Valid project description'],
        reason: 'Post contains prompt injection override attempts and lacks authentic hiring intent.',
      };
    }

    if (isJobSeeker) {
      return {
        post_id: postId,
        classification: 'NOT_A_LEAD',
        is_hiring: false,
        hiring_intent: 'NONE',
        project_title: null,
        project_description: null,
        technologies: detectedTech,
        budget: null,
        deadline: null,
        start_date: null,
        contact_method: contactMethod,
        confidence: 0.95,
        missing_information: ['Client hiring requirement'],
        reason: 'The author is a job seeker / freelancer advertising personal availability, not an active buyer hiring for a project.',
      };
    }

    if (isAgencyPromotion) {
      return {
        post_id: postId,
        classification: 'NOT_A_LEAD',
        is_hiring: false,
        hiring_intent: 'NONE',
        project_title: null,
        project_description: null,
        technologies: detectedTech,
        budget: null,
        deadline: null,
        start_date: null,
        contact_method: contactMethod,
        confidence: 0.95,
        missing_information: ['Client hiring requirement'],
        reason: 'The post is an agency or service provider promoting their own development capabilities.',
      };
    }

    if (hasHiringIntent) {
      return {
        post_id: postId,
        classification: 'QUALIFIED_LEAD',
        is_hiring: true,
        hiring_intent: 'EXPLICIT',
        project_title: title || (detectedTech.length > 0 ? `${detectedTech.slice(0, 2).join(' / ')} Development Project` : 'Custom Software Project'),
        project_description: content.length > 200 ? content.slice(0, 200) + '...' : content,
        technologies: detectedTech,
        budget,
        deadline,
        start_date: null,
        contact_method: contactMethod,
        confidence: 0.9,
        missing_information: [
          ...(budget ? [] : ['budget']),
          ...(deadline ? [] : ['deadline']),
          ...(detectedTech.length > 0 ? [] : ['explicit tech stack']),
        ],
        reason: 'The author explicitly states they are looking to hire a developer/agency for a software project.',
      };
    }

    // Uncertain, vague idea, or snippet-only
    if (isVagueIdea || contentLevel === 'SNIPPET_ONLY') {
      return {
        post_id: postId,
        classification: 'NEEDS_REVIEW',
        is_hiring: false,
        hiring_intent: 'UNCLEAR',
        project_title: title || (detectedTech.length > 0 ? `${detectedTech.slice(0, 2).join(' / ')} Project Idea` : 'Potential Project Opportunity'),
        project_description: content,
        technologies: detectedTech,
        budget,
        deadline,
        start_date: null,
        contact_method: null,
        confidence: 0.5,
        missing_information: ['Clear hiring commitment', 'Defined scope'],
        reason: isVagueIdea
          ? 'Author is exploring an idea or asking about development costs without explicit hiring commitment.'
          : 'Available content is only a search snippet; hiring intent cannot be confirmed without review.',
      };
    }

    // Default non-lead
    return {
      post_id: postId,
      classification: 'NOT_A_LEAD',
      is_hiring: false,
      hiring_intent: 'NONE',
      project_title: null,
      project_description: null,
      technologies: detectedTech,
      budget: null,
      deadline: null,
      start_date: null,
      contact_method: null,
      confidence: 0.85,
      missing_information: ['Hiring intent'],
      reason: 'General technical discussion, question, or news with no expressed hiring requirement.',
    };
  }
}

export const geminiService = new GeminiService();
