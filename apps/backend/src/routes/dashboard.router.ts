import { Router } from 'express';
import {
  getDashboardStats,
  getSourceDistribution,
  getRecentLeads,
} from '../controllers/dashboard.controller.js';

const dashboardRouter = Router();

dashboardRouter.get('/stats', getDashboardStats);
dashboardRouter.get('/source-distribution', getSourceDistribution);
dashboardRouter.get('/recent-leads', getRecentLeads);

export { dashboardRouter };
