// API Response Helpers
import { NextResponse } from 'next/server';

// Standard API response types
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Response builders
export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    } as SuccessResponse<T>,
    { status }
  );
}

export function errorResponse(error: string, status = 500, code?: string, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details,
    } as ErrorResponse,
    { status }
  );
}

// Common error responses
export function badRequestError(message: string, details?: any) {
  return errorResponse(message, 400, 'BAD_REQUEST', details);
}

export function unauthorizedError(message = 'Unauthorized') {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

export function forbiddenError(message = 'Forbidden') {
  return errorResponse(message, 403, 'FORBIDDEN');
}

export function notFoundError(message = 'Not found') {
  return errorResponse(message, 404, 'NOT_FOUND');
}

export function conflictError(message: string) {
  return errorResponse(message, 409, 'CONFLICT');
}

export function rateLimitError(message = 'Too many requests') {
  return errorResponse(message, 429, 'RATE_LIMIT_EXCEEDED');
}

export function serverError(message = 'Internal server error') {
  return errorResponse(message, 500, 'INTERNAL_ERROR');
}

// Pagination helpers
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  params: PaginationParams,
  status = 200
) {
  const totalPages = Math.ceil(total / params.limit);
  const hasMore = params.page < totalPages;

  return NextResponse.json(
    {
      success: true,
      data: {
        items,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasMore,
        },
      },
    } as SuccessResponse<PaginatedResponse<T>>,
    { status }
  );
}

// Error logging helper
export function logError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
  
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// Safe async handler wrapper
export function asyncHandler<T = any>(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      logError(handler.name || 'Unknown handler', error);
      
      if (error instanceof Error) {
        return serverError(error.message);
      }
      
      return serverError();
    }
  };
}
