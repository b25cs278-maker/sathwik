import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '@/middleware/auth';
import {
  updateLocation,
  getProfile,
  updateProfile,
  getPointsHistory,
  getAchievements,
  getNearbyTasks
} from '@/controllers/userController';

const router = Router();

router.use(authenticate);

const locationValidation = [
  body('location_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude (-90 to 90) is required'),
  body('location_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude (-180 to 180) is required'),
  body('location_radius')
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage('Location radius must be between 100m and 50km')
];

const profileUpdateValidation = [
  body('first_name')
    .notEmpty()
    .trim()
    .withMessage('First name is required'),
  body('last_name')
    .notEmpty()
    .trim()
    .withMessage('Last name is required'),
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const nearbyTasksValidation = [
  query('radius')
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage('Search radius must be between 100m and 50km'),
  query('category_id')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  query('min_points')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum points must be non-negative'),
  query('max_points')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum points must be non-negative'),
  query('difficulty_level')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Difficulty level must be between 1 and 5')
];

router.put('/location', locationValidation, updateLocation);
router.get('/profile', getProfile);
router.put('/profile', profileUpdateValidation, updateProfile);
router.get('/points/history', paginationValidation, getPointsHistory);
router.get('/achievements', getAchievements);
router.get('/nearby-tasks', [...nearbyTasksValidation, ...paginationValidation], getNearbyTasks);

export { router as userRoutes };