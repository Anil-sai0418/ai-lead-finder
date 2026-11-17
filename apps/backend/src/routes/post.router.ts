import { Router } from 'express';
import {
  submitManualPost,
  importGoogleResults,
  getPosts,
} from '../controllers/post.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  ManualPostSubmissionSchema,
  GoogleSearchResultImportSchema,
} from '@ai-lead-finder/shared';

const postRouter = Router();

postRouter.post('/manual', validateBody(ManualPostSubmissionSchema), submitManualPost);
postRouter.post('/import-results', validateBody(GoogleSearchResultImportSchema), importGoogleResults);
postRouter.get('/', getPosts);

export { postRouter };
