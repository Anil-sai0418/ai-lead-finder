import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { getRedisClient } from './config/redis.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 AI Lead Finder backend listening on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
});

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected.');
    } catch (err) {
      logger.error({ err }, 'Error disconnecting Prisma');
    }

    try {
      const redis = getRedisClient();
      await redis.quit();
      logger.info('Redis connection closed.');
    } catch (err) {
      logger.error({ err }, 'Error closing Redis connection');
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});
