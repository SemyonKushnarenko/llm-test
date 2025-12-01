import type { EnhancedDescription } from '@todo/types';

/**
 * Rate limiter using Cloudflare KV (simple in-memory fallback for local dev)
 */
export class RateLimiter {
  private store: Map<string, { count: number; resetAt: number }>;
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.store = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async check(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now > record.resetAt) {
      // New window
      this.store.set(identifier, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (record.count >= this.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: this.maxRequests - record.count };
  }
}

/**
 * Parse enhanced description JSON safely
 */
export function parseEnhancedDescription(
  jsonString: string | null
): EnhancedDescription | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as EnhancedDescription;
  } catch {
    return null;
  }
}

/**
 * Format enhanced description for display
 */
export function formatEnhancedDescription(desc: EnhancedDescription | null): string {
  if (!desc) return '';
  return JSON.stringify(desc, null, 2);
}

/**
 * Get client IP from Cloudflare request
 */
export function getClientIP(request: Request): string {
  // Cloudflare provides CF-Connecting-IP header
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) return cfIP;

  // Fallback for local dev
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

