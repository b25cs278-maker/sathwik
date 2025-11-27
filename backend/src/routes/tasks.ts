import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorizeAdmin } from '@/middleware/auth';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  submitTask,
  getMySubmissions,
  getSubmissionById
} from '@/controllers/taskController';

const router = Router();

const uuidValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid task ID is required')
];

const createTaskValidation = [
  body('title')
    .notEmpty()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('description')
    .notEmpty()
    .trim()
    .withMessage('Description is required'),
  body('category_id')
    .isUUID()
    .withMessage('Valid category ID is required'),
  body('location_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude (-90 to 90) is required'),
  body('location_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude (-180 to 180) is required'),
  body('location_radius')
    .optional()
    .isInt({ min: 10, max: 10000 })
    .withMessage('Location radius must be between 10m and 10km'),
  body('points_value')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Points value must be between 1 and 10000'),
  body('difficulty_level')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Difficulty level must be between 1 and 5'),
  body('time_limit_hours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Time limit must be between 1 hour and 7 days'),
  body('required_evidence')
    .optional()
    .isArray()
    .withMessage('Required evidence must be an array'),
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Valid expiration date is required')
];

const submitTaskValidation = [
  body('task_id')
    .isUUID()
    .withMessage('Valid task ID is required'),
  body('submission_data')
    .optional()
    .isObject()
    .withMessage('Submission data must be an object'),
  body('media_files')
    .optional()
    .isArray()
    .withMessage('Media files must be an array'),
  body('submission_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid submission latitude is required'),
  body('submission_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid submission longitude is required')
];

const taskFiltersValidation = [
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
    .withMessage('Difficulty level must be between 1 and 5'),
  query('status')
    .optional()
    .isIn(['active', 'paused', 'expired'])
    .withMessage('Status must be active, paused, or expired'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected')
];

router.get('/', taskFiltersValidation, getTasks);
router.get('/:id', uuidValidation, getTaskById);
router.post('/', authenticate, authorizeAdmin, createTaskValidation, createTask);
router.put('/:id', authenticate, authorizeAdmin, [...uuidValidation, ...createTaskValidation], updateTask);
router.delete('/:id', authenticate, authorizeAdmin, uuidValidation, deleteTask);
router.post('/:id/submit', authenticate, [...uuidValidation, ...submitTaskValidation], submitTask);
router.get('/submissions/my', authenticate, paginationValidation, getMySubmissions);
router.get('/submissions/:id', authenticate, param('id').isUUID().withMessage('Valid submission ID is required'), getSubmissionById);

export { router as taskRoutes };