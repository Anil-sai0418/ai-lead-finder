import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  updateLeadStatus,
  reviewLead,
} from '../controllers/lead.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  UpdateLeadStatusSchema,
  ManualReviewCorrectionSchema,
} from '@ai-lead-finder/shared';

const leadRouter = Router();

leadRouter.get('/', getLeads);
leadRouter.get('/:id', getLeadById);
leadRouter.patch('/:id/status', validateBody(UpdateLeadStatusSchema), updateLeadStatus);
leadRouter.post('/:id/review', validateBody(ManualReviewCorrectionSchema), reviewLead);

export { leadRouter };
