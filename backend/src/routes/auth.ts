import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '@/middleware/auth';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe
} from '@/controllers/authController';

const router = Router();

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('first_name')
    .notEmpty()
    .trim()
    .withMessage('First name is required'),
  body('last_name')
    .notEmpty()
    .trim()
    .withMessage('Last name is required')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshTokenValidation, refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export { router as authRoutes };