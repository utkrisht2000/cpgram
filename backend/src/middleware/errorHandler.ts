import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Server-side technical logging
  console.error(`[SuGam Server Error] ${req.method} ${req.path}:`, err);

  const status = err.status || 500;
  const message = err.clientMessage || (status === 500 ? 'An unexpected system error occurred. Please try again.' : err.message);

  res.status(status).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
