import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest, ApiResponse, UserRegistrationData, UserLoginData } from '@/types';
import { AppError, asyncHandler } from '@/middleware/errorHandler';
import { pool } from '@/database/connection';

const generateTokens = (userId: string, email: string, isAdmin: boolean) => {
  const accessToken = jwt.sign(
    { userId, email, isAdmin },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email, isAdmin },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { email, password, first_name, last_name }: UserRegistrationData = req.body;

  if (!email || !password || !first_name || !last_name) {
    throw new AppError('All fields are required', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format', 400);
  }

  const existingUserQuery = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUserQuery.rows.length > 0) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const newUserQuery = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, account_status, is_admin)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, first_name, last_name, total_points, account_status, is_admin, created_at`,
    [email.toLowerCase(), passwordHash, first_name, last_name, 'active', false]
  );

  const newUser = newUserQuery.rows[0];

  const { accessToken, refreshToken } = generateTokens(newUser.id, newUser.email, newUser.is_admin);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        total_points: newUser.total_points,
        account_status: newUser.account_status,
        is_admin: newUser.is_admin,
        created_at: newUser.created_at
      },
      accessToken,
      refreshToken
    }
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { email, password }: UserLoginData = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const userQuery = await pool.query(
    `SELECT id, email, password_hash, first_name, last_name, avatar_url,
     location_lat, location_lng, location_radius, location_updated_at,
     total_points, account_status, is_admin, created_at, updated_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (userQuery.rows.length === 0) {
    throw new AppError('Invalid credentials', 401);
  }

  const user = userQuery.rows[0];

  if (user.account_status !== 'active') {
    throw new AppError('Account is not active', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  const { password_hash, ...userWithoutPassword } = user;

  const { accessToken, refreshToken } = generateTokens(
    userWithoutPassword.id,
    userWithoutPassword.email,
    userWithoutPassword.is_admin
  );

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    }
  });
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    const userQuery = await pool.query(
      `SELECT id, email, first_name, last_name, avatar_url,
       location_lat, location_lng, location_radius, location_updated_at,
       total_points, account_status, is_admin, created_at, updated_at
       FROM users WHERE id = $1 AND account_status = 'active'`,
      [decoded.userId]
    );

    if (userQuery.rows.length === 0) {
      throw new AppError('User not found or inactive', 401);
    }

    const user = userQuery.rows[0];

    const newTokens = generateTokens(user.id, user.email, user.is_admin);

    res.json({
      success: true,
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid refresh token', 401);
    }
    throw error;
  }
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});