import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface ClientRecord {
  timestamps: number[];
}

/**
 * Lightweight in-memory sliding-window rate limiter for sensitive external provider endpoints.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const clients = new Map<string, ClientRecord>();
  const { windowMs, max, message } = options;

  // Periodic cleanup of stale client records every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        clients.delete(ip);
      }
    }
  }, 10 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();

    let record = clients.get(ip);
    if (!record) {
      record = { timestamps: [] };
      clients.set(ip, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= max) {
      const earliest = record.timestamps[0];
      const resetTimeSec = Math.ceil((windowMs - (now - earliest)) / 1000);
      res.setHeader('Retry-After', resetTimeSec);

      return next(
        new AppError(
          message || `Rate limit exceeded. Maximum ${max} searches allowed every ${Math.round(windowMs / 60000)} minutes. Please wait ${resetTimeSec}s.`,
          429,
          'RATE_LIMIT_EXCEEDED',
          { retryAfterSeconds: resetTimeSec }
        )
      );
    }

    record.timestamps.push(now);
    next();
  };
}
