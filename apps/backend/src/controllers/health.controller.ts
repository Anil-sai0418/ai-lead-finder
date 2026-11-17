import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/prisma.js';
import { checkRedisConnection } from '../config/redis.js';
import { env } from '../config/env.js';

export async function getHealthStatus(_req: Request, res: Response): Promise<void> {
  const dbConnected = await checkDatabaseConnection();
  const redisConnected = await checkRedisConnection();

  const isHealthy = dbConnected && redisConnected;
  const isDegraded = dbConnected && !redisConnected;

  const status = isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy';
  const statusCode = isHealthy ? 200 : isDegraded ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected',
    },
    version: '1.0.0',
  });
}
