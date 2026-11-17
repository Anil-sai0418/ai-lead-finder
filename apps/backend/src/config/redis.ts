import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;
let isConnected = false;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      reconnectOnError(err) {
        logger.warn({ err: err.message }, 'Redis reconnecting on error');
        return true;
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('Connected to Redis');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('Redis connection is ready');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.warn({ err: err.message }, 'Redis connection error (queue operations may be degraded)');
    });

    redisClient.on('close', () => {
      isConnected = false;
      logger.warn('Redis connection closed');
    });
  }

  return redisClient;
}

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (client.status === 'wait') {
      await client.connect();
    }
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    return false;
  }
}

export function isRedisConnected(): boolean {
  return isConnected;
}
