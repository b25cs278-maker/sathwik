import { Router } from 'express';
import { param, query } from 'express-validator';
import { authenticate, authorizeAdmin } from '@/middleware/auth';
import { upload, uploadFiles, getFileMetadata, deleteFile, getUserFiles, serveFile } from '@/controllers/mediaController';

const router = Router();

router.use(authenticate);

const uuidValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid file ID is required')
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
  query('file_type')
    .optional()
    .isIn(['photo', 'video'])
    .withMessage('File type must be photo or video')
];

router.post('/upload', upload.array('files', 5), uploadFiles);
router.get('/files/my', paginationValidation, getUserFiles);
router.get('/files/:id', uuidValidation, getFileMetadata);
router.delete('/files/:id', uuidValidation, deleteFile);
router.get('/files/:filename', serveFile);

export { router as mediaRoutes };