import { Router } from 'express';
import {
  createSearchQuery,
  getSearchQueries,
  getSearchQueryById,
  updateSearchQuery,
  deleteSearchQuery,
  runSearchQueryNow,
  getExecutions,
  getExecutionById,
  runAutomatedSearch,
} from '../controllers/search.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createRateLimiter } from '../middleware/rate-limit.middleware.js';
import {
  CreateSearchQuerySchema,
  UpdateSearchQuerySchema,
  AutomatedSearchSchema,
} from '@ai-lead-finder/shared';

const searchRouter = Router();

// Rate limiter for external automated searches (15 searches per 15 minutes per client)
const automatedSearchLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Automated search rate limit reached. Please wait before executing more searches.',
});

// Automated Search Mode (Tavily AI Search)
searchRouter.post('/automated', automatedSearchLimiter, validateBody(AutomatedSearchSchema), runAutomatedSearch);

// Search Query CRUD & Execution
searchRouter.post('/', validateBody(CreateSearchQuerySchema), createSearchQuery);
searchRouter.get('/', getSearchQueries);
searchRouter.get('/executions', getExecutions);
searchRouter.get('/executions/:id', getExecutionById);
searchRouter.get('/:id', getSearchQueryById);
searchRouter.patch('/:id', validateBody(UpdateSearchQuerySchema), updateSearchQuery);
searchRouter.delete('/:id', deleteSearchQuery);
searchRouter.post('/:id/run', runSearchQueryNow);

export { searchRouter };
