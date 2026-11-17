import { prisma } from './config/prisma.js';
import { geminiService } from './services/ai/gemini.service.js';
import { scoringEngineService } from './services/lead-scoring/scoring-engine.service.js';
import { leadRepository } from './repositories/lead.repository.js';
import { aiLogRepository } from './repositories/ai-log.repository.js';

async function backfill() {
  console.log('🔄 Checking posts without leads...');
  const posts = await prisma.post.findMany({
    where: { lead: null },
  });

  console.log(`Found ${posts.length} posts without leads. Processing...`);

  for (const post of posts) {
    try {
      const aiResponse = await geminiService.classifyPost(
        post.id,
        post.content,
        post.contentLevel as any,
        post.title
      );

      await aiLogRepository.create({
        postId: post.id,
        model: aiResponse.model,
        inputTokens: aiResponse.inputTokens,
        outputTokens: aiResponse.outputTokens,
        processingStatus: 'SUCCESS',
        processingTimeMs: aiResponse.processingTimeMs,
        rawResponse: aiResponse.rawResponse as any,
      });

      const scoreResult = scoringEngineService.calculateScore(aiResponse.result);

      const lead = await leadRepository.upsert({
        postId: post.id,
        classification: aiResponse.result.classification,
        isHiring: aiResponse.result.is_hiring,
        hiringIntent: aiResponse.result.hiring_intent,
        projectTitle: aiResponse.result.project_title,
        projectDescription: aiResponse.result.project_description,
        technologies: aiResponse.result.technologies,
        budget: aiResponse.result.budget,
        deadline: aiResponse.result.deadline,
        startDate: aiResponse.result.start_date,
        contactMethod: aiResponse.result.contact_method,
        confidence: aiResponse.result.confidence,
        missingInformation: aiResponse.result.missing_information,
        reason: aiResponse.result.reason,
        leadScore: scoreResult.score,
        scoreBreakdown: scoreResult.breakdown as any,
        priority: scoreResult.priority,
        status: 'NEW',
      });

      console.log(`✅ Processed post ${post.id}: ${lead.classification} (${lead.leadScore} pts, Priority: ${lead.priority})`);
    } catch (err) {
      console.error(`❌ Failed processing post ${post.id}:`, err);
    }
  }

  const finalLeads = await prisma.lead.count();
  console.log(`🎉 Total leads in database now: ${finalLeads}`);
  await prisma.$disconnect();
}

backfill();
