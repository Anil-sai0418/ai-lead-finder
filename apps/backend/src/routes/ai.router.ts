import { Router } from 'express';
import { getAILogs, classifyPreview } from '../controllers/ai.controller.js';

const aiRouter = Router();

aiRouter.get('/logs', getAILogs);
aiRouter.post('/classify-preview', classifyPreview);

export { aiRouter };
