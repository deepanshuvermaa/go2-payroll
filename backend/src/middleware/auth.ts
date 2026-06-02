import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';
import { Role } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  orgId: string;
  role: Role;
  employeeId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new AppError(401, 'Authentication required');
  try {
    req.user = jwt.verify(token, config.jwt.secret) as AuthPayload;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (!roles.includes(req.user.role)) throw new AppError(403, 'Insufficient permissions');
    next();
  };
};
