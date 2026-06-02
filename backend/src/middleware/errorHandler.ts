import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
};

export const notFound = (_req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Route not found' });
};
