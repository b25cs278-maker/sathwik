import { Response } from 'express';
import { AuthRequest, ApiResponse, TaskFilters, CreateTaskData, SubmitTaskData } from '@/types';
import { AppError, asyncHandler } from '@/middleware/errorHandler';
import { pool } from '@/database/connection';
import { v4 as uuidv4 } from 'uuid';

export const getTasks = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const {
    category_id,
    min_points,
    max_points,
    difficulty_level,
    status = 'active',
    radius,
    limit = 20,
    offset = 0
  } = req.query as any;

  let whereConditions = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  whereConditions.push(`t.status = $${paramIndex++}`);
  queryParams.push(status);

  if (whereConditions.length > 0) {
    whereConditions.push('(t.expires_at IS NULL OR t.expires_at > CURRENT_TIMESTAMP)');
  }

  if (category_id) {
    whereConditions.push(`t.category_id = $${paramIndex++}`);
    queryParams.push(category_id);
  }

  if (min_points) {
    whereConditions.push(`t.points_value >= $${paramIndex++}`);
    queryParams.push(Number(min_points));
  }

  if (max_points) {
    whereConditions.push(`t.points_value <= $${paramIndex++}`);
    queryParams.push(Number(max_points));
  }

  if (difficulty_level) {
    whereConditions.push(`t.difficulty_level = $${paramIndex++}`);
    queryParams.push(Number(difficulty_level));
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const tasksQuery = `
    SELECT
      t.*,
      tc.name as category_name,
      tc.icon as category_icon,
      u.first_name || ' ' || u.last_name as creator_name,
      u.avatar_url as creator_avatar
    FROM tasks t
    LEFT JOIN task_categories tc ON t.category_id = tc.id
    LEFT JOIN users u ON t.created_by = u.id
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  queryParams.push(Number(limit), Number(offset));

  const result = await pool.query(tasksQuery, queryParams);

  res.json({
    success: true,
    data: result.rows
  });
});

export const getTaskById = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { id } = req.params;

  const taskQuery = await pool.query(
    `SELECT
       t.*,
       tc.name as category_name,
       tc.icon as category_icon,
       u.first_name || ' ' || u.last_name as creator_name,
       u.avatar_url as creator_avatar
     FROM tasks t
     LEFT JOIN task_categories tc ON t.category_id = tc.id
     LEFT JOIN users u ON t.created_by = u.id
     WHERE t.id = $1`,
    [id]
  );

  if (taskQuery.rows.length === 0) {
    throw new AppError('Task not found', 404);
  }

  const task = taskQuery.rows[0];

  const userSubmissionQuery = req.user ? await pool.query(
    `SELECT id, submission_status, submitted_at, validation_status, points_awarded
     FROM task_submissions
     WHERE task_id = $1 AND user_id = $2`,
    [id, req.user.id]
  ) : { rows: [] };

  res.json({
    success: true,
    data: {
      ...task,
      user_submission: userSubmissionQuery.rows[0] || null
    }
  });
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user?.is_admin) {
    throw new AppError('Admin access required', 403);
  }

  const {
    title,
    description,
    category_id,
    location_lat,
    location_lng,
    location_radius = 100,
    points_value,
    difficulty_level = 1,
    time_limit_hours,
    required_evidence = [],
    expires_at
  }: CreateTaskData = req.body;

  if (!title || !description || !category_id || !location_lat || !location_lng || !points_value) {
    throw new AppError('Title, description, category, location, and points are required', 400);
  }

  const categoryQuery = await pool.query('SELECT id FROM task_categories WHERE id = $1', [category_id]);
  if (categoryQuery.rows.length === 0) {
    throw new AppError('Invalid category', 400);
  }

  const newTaskQuery = await pool.query(
    `INSERT INTO tasks (
       title, description, category_id, location_lat, location_lng,
       location_radius, points_value, difficulty_level, time_limit_hours,
       required_evidence, created_by, expires_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      title.trim(),
      description.trim(),
      category_id,
      location_lat,
      location_lng,
      location_radius,
      points_value,
      difficulty_level,
      time_limit_hours,
      JSON.stringify(required_evidence),
      req.user.id,
      expires_at
    ]
  );

  const newTask = newTaskQuery.rows[0];

  res.status(201).json({
    success: true,
    data: newTask
  });
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user?.is_admin) {
    throw new AppError('Admin access required', 403);
  }

  const { id } = req.params;
  const updates = req.body;

  const taskQuery = await pool.query('SELECT id FROM tasks WHERE id = $1', [id]);
  if (taskQuery.rows.length === 0) {
    throw new AppError('Task not found', 404);
  }

  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  const allowedFields = [
    'title', 'description', 'category_id', 'location_lat', 'location_lng',
    'location_radius', 'points_value', 'difficulty_level', 'time_limit_hours',
    'required_evidence', 'status', 'expires_at'
  ];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramIndex++}`);
      if (key === 'required_evidence') {
        updateValues.push(JSON.stringify(value));
      } else {
        updateValues.push(value);
      }
    }
  }

  if (updateFields.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  updateValues.push(id);

  const updateQuery = `
    UPDATE tasks
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, updateValues);

  res.json({
    success: true,
    data: result.rows[0]
  });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user?.is_admin) {
    throw new AppError('Admin access required', 403);
  }

  const { id } = req.params;

  const taskQuery = await pool.query('SELECT id FROM tasks WHERE id = $1', [id]);
  if (taskQuery.rows.length === 0) {
    throw new AppError('Task not found', 404);
  }

  await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
});

export const submitTask = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const taskId = req.params.id;

  const { task_id, submission_data, media_files, submission_lat, submission_lng }: SubmitTaskData = req.body;

  if (task_id !== taskId) {
    throw new AppError('Task ID mismatch', 400);
  }

  if (!submission_lat || !submission_lng) {
    throw new AppError('Submission location coordinates are required', 400);
  }

  const taskQuery = await pool.query(
    `SELECT t.*, tc.name as category_name
     FROM tasks t
     LEFT JOIN task_categories tc ON t.category_id = tc.id
     WHERE t.id = $1 AND t.status = 'active'
     AND (t.expires_at IS NULL OR t.expires_at > CURRENT_TIMESTAMP)`,
    [taskId]
  );

  if (taskQuery.rows.length === 0) {
    throw new AppError('Task not found or not active', 404);
  }

  const task = taskQuery.rows[0];

  const existingSubmissionQuery = await pool.query(
    'SELECT id FROM task_submissions WHERE task_id = $1 AND user_id = $2',
    [taskId, userId]
  );

  if (existingSubmissionQuery.rows.length > 0) {
    throw new AppError('You have already submitted this task', 409);
  }

  const submissionId = uuidv4();

  const newSubmissionQuery = await pool.query(
    `INSERT INTO task_submissions (
       id, task_id, user_id, submission_data, media_files,
       submission_lat, submission_lng
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      submissionId,
      taskId,
      userId,
      JSON.stringify(submission_data || {}),
      JSON.stringify(media_files || []),
      submission_lat,
      submission_lng
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      submission: newSubmissionQuery.rows[0],
      task: {
        id: task.id,
        title: task.title,
        points_value: task.points_value,
        category_name: task.category_name
      }
    }
  });
});

export const getMySubmissions = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const { status, page = 1, limit = 20 } = req.query;

  let whereConditions = ['ts.user_id = $1'];
  let queryParams: any[] = [userId];
  let paramIndex = 2;

  if (status) {
    whereConditions.push(`ts.validation_status = $${paramIndex++}`);
    queryParams.push(status);
  }

  const whereClause = whereConditions.join(' AND ');

  const offset = (Number(page) - 1) * Number(limit);

  const submissionsQuery = `
    SELECT
      ts.*,
      t.title as task_title,
      t.points_value,
      tc.name as category_name,
      tc.icon as category_icon,
      u.first_name || ' ' || u.last_name as validator_name,
      u.avatar_url as validator_avatar
    FROM task_submissions ts
    JOIN tasks t ON ts.task_id = t.id
    LEFT JOIN task_categories tc ON t.category_id = tc.id
    LEFT JOIN users u ON ts.validated_by = u.id
    WHERE ${whereClause}
    ORDER BY ts.submitted_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  queryParams.push(Number(limit), offset);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM task_submissions ts
    WHERE ${whereClause}
  `;

  const [submissionsResult, countResult] = await Promise.all([
    pool.query(submissionsQuery, queryParams),
    pool.query(countQuery, queryParams.slice(0, -2))
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / Number(limit));

  res.json({
    success: true,
    data: submissionsResult.rows,
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

export const getSubmissionById = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const submissionQuery = await pool.query(
    `SELECT
       ts.*,
       t.title as task_title,
       t.description as task_description,
       t.required_evidence,
       t.points_value,
       tc.name as category_name,
       tc.icon as category_icon,
       u.first_name || ' ' || u.last_name as validator_name,
       u.avatar_url as validator_avatar
     FROM task_submissions ts
     JOIN tasks t ON ts.task_id = t.id
     LEFT JOIN task_categories tc ON t.category_id = tc.id
     LEFT JOIN users u ON ts.validated_by = u.id
     WHERE ts.id = $1 AND ts.user_id = $2`,
    [id, userId]
  );

  if (submissionQuery.rows.length === 0) {
    throw new AppError('Submission not found', 404);
  }

  res.json({
    success: true,
    data: submissionQuery.rows[0]
  });
});