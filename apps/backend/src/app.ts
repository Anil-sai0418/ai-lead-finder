import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.router.js';
import { postRouter } from './routes/post.router.js';
import { leadRouter } from './routes/lead.router.js';
import { errorMiddleware } from './middleware/error.middleware.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsers
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Root welcome / basic ping
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'AI Lead Finder API',
      status: 'online',
      version: '1.0.0',
      docs: '/api/v1/health',
    });
  });

  // Health check routes
  app.use('/health', healthRouter);
  app.use('/api/v1/health', healthRouter);

  // Core API routes
  app.use('/api/v1/posts', postRouter);
  app.use('/api/v1/leads', leadRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    });
  });

  // Centralized Error Handling
  app.use(errorMiddleware);

  return app;
}
