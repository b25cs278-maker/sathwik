import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, User } from '@/types';
import { AppError, asyncHandler } from './errorHandler';
import { pool } from '@/database/connection';

interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

export const authenticate = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      const userQuery = await pool.query(
        `SELECT id, email, first_name, last_name, avatar_url, location_lat,
         location_lng, location_radius, location_updated_at, total_points,
         account_status, is_admin, created_at, updated_at
         FROM users WHERE id = $1`,
        [decoded.userId]
      );

      if (userQuery.rows.length === 0) {
        throw new AppError('User not found', 401);
      }

      const user: User = userQuery.rows[0];

      if (user.account_status !== 'active') {
        throw new AppError('Account is not active', 401);
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid or expired token', 401);
      }
      throw error;
    }
  }
);

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (roles.length > 0 && !roles.includes(req.user.is_admin ? 'admin' : 'user')) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

export const authorizeAdmin = authorize('admin');