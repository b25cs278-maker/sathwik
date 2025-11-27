import { Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { AuthRequest, ApiResponse } from '@/types';
import { AppError, asyncHandler } from '@/middleware/errorHandler';
import { pool } from '@/database/connection';

const UPLOAD_DIR = path.join(__dirname, '../../../uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isPhoto = ALLOWED_PHOTO_TYPES.includes(file.mimetype);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);

  if (isPhoto || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, MP4, WebM, and MOV files are allowed.'));
  }
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const fileKey = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${fileKey}${extension}`;

    const fileType = ALLOWED_PHOTO_TYPES.includes(file.mimetype) ? 'photos' : 'videos';
    const uploadPath = path.join(UPLOAD_DIR, fileType);

    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error);
    }
  },
  filename: (req, file, cb) => {
    const fileKey = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${fileKey}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Maximum 5 files per request
  },
  fileFilter
});

export const uploadFiles = asyncHandler(async (req: any, res: Response<ApiResponse>) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    throw new AppError('No files uploaded', 400);
  }

  const userId = req.user!.id;
  const files = req.files as Express.Multer.File[];

  const uploadedFiles = [];

  for (const file of files) {
    const fileType = ALLOWED_PHOTO_TYPES.includes(file.mimetype) ? 'photo' : 'video';

    const newFileQuery = await pool.query(
      `INSERT INTO media_files (
         id, filename, original_name, file_type, file_size,
         storage_url, uploaded_by, upload_metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        uuidv4(),
        file.filename,
        file.originalname,
        fileType,
        file.size,
        `/uploads/${fileType}/${file.filename}`,
        userId,
        JSON.stringify({
          mimetype: file.mimetype,
          path: file.path
        })
      ]
    );

    uploadedFiles.push(newFileQuery.rows[0]);
  }

  res.status(201).json({
    success: true,
    data: {
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    }
  });
});

export const getFileMetadata = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { id } = req.params;

  const fileQuery = await pool.query(
    `SELECT mf.*, u.first_name || ' ' || u.last_name as uploader_name
     FROM media_files mf
     LEFT JOIN users u ON mf.uploaded_by = u.id
     WHERE mf.id = $1`,
    [id]
  );

  if (fileQuery.rows.length === 0) {
    throw new AppError('File not found', 404);
  }

  const file = fileQuery.rows[0];

  if (req.user && file.uploaded_by !== req.user.id && !req.user.is_admin) {
    throw new AppError('Access denied', 403);
  }

  res.json({
    success: true,
    data: file
  });
});

export const deleteFile = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const fileQuery = await pool.query(
    'SELECT * FROM media_files WHERE id = $1',
    [id]
  );

  if (fileQuery.rows.length === 0) {
    throw new AppError('File not found', 404);
  }

  const file = fileQuery.rows[0];

  if (file.uploaded_by !== userId && !req.user.is_admin) {
    throw new AppError('Access denied', 403);
  }

  await pool.query('DELETE FROM media_files WHERE id = $1', [id]);

  try {
    const filePath = path.join(UPLOAD_DIR, file.file_type === 'photo' ? 'photos' : 'videos', file.filename);
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Failed to delete file from disk:', error);
  }

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
});

export const getUserFiles = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const { file_type, page = 1, limit = 20 } = req.query;

  let whereConditions = ['uploaded_by = $1'];
  let queryParams: any[] = [userId];
  let paramIndex = 2;

  if (file_type) {
    const validTypes = ['photo', 'video'];
    if (!validTypes.includes(file_type as string)) {
      throw new AppError('File type must be photo or video', 400);
    }
    whereConditions.push(`file_type = $${paramIndex++}`);
    queryParams.push(file_type);
  }

  const whereClause = whereConditions.join(' AND ');

  const offset = (Number(page) - 1) * Number(limit);

  const filesQuery = `
    SELECT *
    FROM media_files
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  queryParams.push(Number(limit), offset);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM media_files
    WHERE ${whereClause}
  `;

  const [filesResult, countResult] = await Promise.all([
    pool.query(filesQuery, queryParams),
    pool.query(countQuery, queryParams.slice(0, -2))
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / Number(limit));

  res.json({
    success: true,
    data: filesResult.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
      hasNext: Number(page) < totalPages,
      hasPrev: Number(page) > 1
    }
  });
});

export const serveFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { filename } = req.params;
  const { type } = req.query;

  if (!filename) {
    throw new AppError('Filename is required', 400);
  }

  const fileType = type === 'video' ? 'videos' : 'photos';
  const filePath = path.join(UPLOAD_DIR, fileType, filename);

  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (error) {
    throw new AppError('File not found', 404);
  }
});

export { upload };