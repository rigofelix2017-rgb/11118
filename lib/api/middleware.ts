// API Middleware
import { NextRequest, NextResponse } from 'next/server';
import { unauthorizedError, rateLimitError } from './response';

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default rate limit: 100 requests per minute
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const identifier = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(identifier);
    
    if (!entry || now > entry.resetAt) {
      // Create new entry
      entry = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      rateLimitStore.set(identifier, entry);
    } else {
      // Increment count
      entry.count++;
      
      if (entry.count > config.maxRequests) {
        return rateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((entry.resetAt - now) / 1000)}s`);
      }
    }

    // Clean up old entries every 1000 requests
    if (Math.random() < 0.001) {
      for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetAt) {
          rateLimitStore.delete(key);
        }
      }
    }

    return handler(request);
  };
}

/**
 * Authentication middleware (placeholder - implement with your auth system)
 */
export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'moderator';
  };
}

export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // TODO: Implement actual authentication
    // Example: Check JWT token, session, etc.
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    
    // TODO: Verify token and get user
    // For now, mock user
    const user = {
      id: 'user123',
      email: 'user@example.com',
      role: 'user' as const,
    };

    // Extend request with user
    (request as AuthenticatedRequest).user = user;

    return handler(request as AuthenticatedRequest);
  };
}

/**
 * CORS middleware
 */
export function withCORS(
  handler: (request: NextRequest) => Promise<NextResponse>,
  allowedOrigins: string[] = ['*']
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const origin = request.headers.get('origin');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigins.includes('*') ? '*' : (origin || ''),
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await handler(request);

    // Add CORS headers to response
    response.headers.set(
      'Access-Control-Allow-Origin',
      allowedOrigins.includes('*') ? '*' : (origin || '')
    );
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  };
}

/**
 * Logging middleware
 */
export function withLogging(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const start = Date.now();
    const method = request.method;
    const url = request.url;

    console.log(`[API] ${method} ${url} - Started`);

    try {
      const response = await handler(request);
      const duration = Date.now() - start;
      
      console.log(`[API] ${method} ${url} - ${response.status} (${duration}ms)`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[API] ${method} ${url} - Error (${duration}ms)`, error);
      throw error;
    }
  };
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(
  ...middleware: Array<(handler: any) => any>
) {
  return (handler: any) => {
    return middleware.reduceRight((acc, mw) => mw(acc), handler);
  };
}

// Common middleware combinations
export const withAuthAndRateLimit = composeMiddleware(withRateLimit, withAuth);
export const withCORSAndLogging = composeMiddleware(withLogging, withCORS);
export const withAll = composeMiddleware(withLogging, withCORS, withRateLimit, withAuth);
