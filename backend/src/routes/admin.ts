import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorizeAdmin } from '@/middleware/auth';
import {
  getPendingSubmissions,
  getSubmissionDetails,
  approveSubmission,
  rejectSubmission,
  getAnalytics,
  getUsers
} from '@/controllers/adminController';

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);

const uuidValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid ID is required')
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

const validationValidation = [
  body('validation_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Validation notes must be less than 1000 characters'),
  body('points_awarded')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Points awarded must be between 0 and 10000')
];

const analyticsValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

const submissionFiltersValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected'),
  query('user_id')
    .optional()
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  query('task_id')
    .optional()
    .isUUID()
    .withMessage('Task ID must be a valid UUID')
];

const userFiltersValidation = [
  query('account_status')
    .optional()
    .isIn(['active', 'suspended', 'pending'])
    .withMessage('Account status must be active, suspended, or pending'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2 and 100 characters')
];

router.get('/submissions', [...submissionFiltersValidation, ...paginationValidation], getPendingSubmissions);
router.get('/submissions/:id', uuidValidation, getSubmissionDetails);
router.post('/submissions/:id/approve', [...uuidValidation, ...validationValidation], approveSubmission);
router.post('/submissions/:id/reject', [...uuidValidation, body('validation_notes').notEmpty().withMessage('Rejection reason is required'), ...validationValidation], rejectSubmission);
router.get('/analytics', analyticsValidation, getAnalytics);
router.get('/users', [...userFiltersValidation, ...paginationValidation], getUsers);

export { router as adminRoutes };