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
} from '../controllers/search.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  CreateSearchQuerySchema,
  UpdateSearchQuerySchema,
} from '@ai-lead-finder/shared';

const searchRouter = Router();

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
