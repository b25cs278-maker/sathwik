import { Response } from 'express';
import { AuthRequest, ApiResponse, AdminValidationData } from '@/types';
import { AppError, asyncHandler } from '@/middleware/errorHandler';
import { pool } from '@/database/connection';

export const getPendingSubmissions = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user?.is_admin) {
    throw new AppError('Admin access required', 403);
  }

  const { status = 'pending', page = 1, limit = 20, user_id, task_id } = req.query as any;

  let whereConditions = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  whereConditions.push(`ts.validation_status = $${paramIndex++}`);
  queryParams.push(status);

  if (user_id) {
    whereConditions.push(`ts.user_id = $${paramIndex++}`);
    queryParams.push(user_id);
  }

  if (task_id) {
    whereConditions.push(`ts.task_id = $${paramIndex++}`);
    queryParams.push(task_id);
  }

  const whereClause = whereConditions.join(' AND ');

  const offset = (Number(page) - 1) * Number(limit);

  const submissionsQuery = `
    SELECT
      ts.*,
      t.title as task_title,
      t.description as task_description,
      t.required_evidence,
      t.points_value as task_points_value,
      tc.name as category_name,
      tc.icon as category_icon,
      u.id as user_id,
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      u.email as user_email,
      u.total_points as user_total_points,
      u.avatar_url as user_avatar
    FROM task_submissions ts
    JOIN tasks t ON ts.task_id = t.id
    LEFT JOIN task_categories tc ON t.category_id = tc.id
    LEFT JOIN users u ON ts.user_id = u.id
    WHERE ${whereClause}
    ORDER BY ts.submitted_at ASC
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

  const submissions = submissionsResult.rows.map(row => ({
    ...row,
    user: {
      id: row.user_id,
      first_name: row.user_first_name,
      last_name: row.user_last_name,
      email: row.user_email,
      total_points: row.user_total_points,
      avatar_url: row.user_avatar
    },
    task: {
      title: row.task_title,
      description: row.task_description,
      required_evidence: row.required_evidence,
      points_value: row.task_points_value,
      category_name: row.category_name,
      category_icon: row.category_icon
    }
  }));

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / Number(limit));

  res.json({
    success: true,
    data: submissions,
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

export const getSubmissionDetails = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user?.is_admin) {
    throw new AppError('Admin access required', 403);
  }

  const { id } = req.params;

  const submissionQuery = await pool.query(
    `SELECT
       ts.*,
       t.title as task_title,
       t.description as task_description,
       t.required_evidence,
       t.points_value as task_points_value,
       t.location_lat as task_location_lat,
       t.location_lng as task_location_lng,
       t.location_radius as task_location_radius,
       tc.name as category_name,
       tc.icon as category_icon,
       u.id as user_id,
       u.first_name as user_first_name,
       u.last_name as user_last_name,
       u.email as user_email,
       u.total_points as user_total_points,
       u.avatar_url as user_avatar,
       u.location_lat as user_location_lat,
       u.location_lng as user_location_lng,
       u.location_updated_at as user_location_updated_at
     FROM task_submissions ts
     JOIN tasks t ON ts.task_id = t.id
     LEFT JOIN task_categories tc ON t.category_id = tc.id
     LEFT JOIN users u ON ts.user_id = u.id
     WHERE ts.id = $1`,
    [id]
  );

  if (submissionQuery.rows.length === 0) {
    throw new AppError('Submission not found', 404);
  }

  const row = submissionQuery.rows[0];

  const submission = {
    ...row,
    user: {
      id: row.user_id,
      first_name: row.user_first_name,
      last_name: row.user_last_name,
      email: row.user_email,
      total_points: row.user_total_points,
      avatar_url: row.user_avatar,
      location_lat: row.user_location_lat,
      location_lng: row.user_location_lng,
      location_updated_at: row.user_location_updated_at
    },
    task: {
      title: row.task_title,
      description: row.task_description,
      required_evidence: row.required_evidence,
      points_value: row.task_points_value,
      location_lat: row.task_location_lat,
      location_lng: row.task_location_lng,
      location_radius: row.task_location_radius,
      category_name: row.category_name,
      category_icon: row.category_icon
    }
  };

  const mediaFilesQuery = await pool.query(
    `SELECT * FROM media_files
     WHERE id = ANY($1)
     ORDER BY created_at DESC`,
    [row.media_files]
  );

  res.json({
    success: true,
    data: {
      ...submission,
      media_files: mediaFilesQuery.rows
    }
  });
});

export const approveSubmission = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user?.is_admin) {
    throw new AppError('Admin access required', 403);
  }

  const { id } = req.params;
  const { validation_notes, points_awarded }: AdminValidationData = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const submissionQuery = await client.query(
      `SELECT ts.*, t.points_value, ts.user_id
       FROM task_submissions ts
       JOIN tasks t ON ts.task_id = t.id
       WHERE ts.id = $1 AND ts.validation_status = 'pending'`,
      [id]
    );

    if (submissionQuery.rows.length === 0) {
      throw new AppError('Submission not found or already validated', 404);
    }

    const submission = submissionQuery.rows[0];
    const finalPointsAwarded = points_awarded || submission.points_value;

    await client.query(
      `UPDATE task_submissions
       SET validation_status = 'approved',
           validation_notes = $1,
           points_awarded = $2,
           validated_by = $3,
           validated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [validation_notes, finalPointsAwarded, req.user.id, id]
    );

    await client.query(
      `UPDATE users
       SET total_points = total_points + $1
       WHERE id = $2`,
      [finalPointsAwarded, submission.user_id]
    );

    await client.query(
      `INSERT INTO points_history (user_id, points_change, reason, reference_id)
       VALUES ($1, $2, $3, $4)`,
      [
        submission.user_id,
        finalPointsAwarded,
        `Task completed: ${submission.task_id}`,
        id
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        message: 'Submission approved successfully',
        points_awarded: finalPointsAwarded
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const rejectSubmission = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user?.is_admin) {
    throw new AppError('Admin access required', 403);
  }

  const { id } = req.params;
  const { validation_notes }: AdminValidationData = req.body;

  if (!validation_notes || validation_notes.trim().length === 0) {
    throw new AppError('Rejection reason is required', 400);
  }

  const submissionQuery = await pool.query(
    'UPDATE task_submissions SET validation_status = $1, validation_notes = $2, validated_by = $3, validated_at = CURRENT_TIMESTAMP WHERE id = $4 AND validation_status = $5 RETURNING *',
    ['rejected', validation_notes.trim(), req.user.id, id, 'pending']
  );

  if (submissionQuery.rows.length === 0) {
    throw new AppError('Submission not found or already validated', 404);
  }

  res.json({
    success: true,
    data: {
      message: 'Submission rejected successfully',
      validation_notes: validation_notes.trim()
    }
  });
});

export const getAnalytics = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user?.is_admin) {
    throw new AppError('Admin access required', 403);
  }

  const { days = 30 } = req.query as any;
  const daysFilter = Math.max(1, Math.min(365, Number(days)));

  const [
    totalUsersResult,
    activeUsersResult,
    totalTasksResult,
    activeTasksResult,
    totalSubmissionsResult,
    pendingSubmissionsResult,
    approvedSubmissionsResult,
    rejectedSubmissionsResult,
    recentActivityResult,
    topPerformersResult,
    categoryStatsResult
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) as count FROM users'),
    pool.query(`SELECT COUNT(*) as count FROM users WHERE location_updated_at > CURRENT_TIMESTAMP - INTERVAL '${daysFilter} days'`),
    pool.query('SELECT COUNT(*) as count FROM tasks'),
    pool.query(`SELECT COUNT(*) as count FROM tasks WHERE status = 'active' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`),
    pool.query(`SELECT COUNT(*) as count FROM task_submissions WHERE submitted_at > CURRENT_TIMESTAMP - INTERVAL '${daysFilter} days'`),
    pool.query('SELECT COUNT(*) as count FROM task_submissions WHERE validation_status = $1', ['pending']),
    pool.query(`SELECT COUNT(*) as count FROM task_submissions WHERE validation_status = 'approved' AND validated_at > CURRENT_TIMESTAMP - INTERVAL '${daysFilter} days'`),
    pool.query(`SELECT COUNT(*) as count FROM task_submissions WHERE validation_status = 'rejected' AND validated_at > CURRENT_TIMESTAMP - INTERVAL '${daysFilter} days'`),
    pool.query(
      `SELECT
         DATE_TRUNC('day', created_at) as date,
         COUNT(*) as new_users
       FROM users
       WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '${daysFilter} days'
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY date DESC
       LIMIT 30`
    ),
    pool.query(
      `SELECT
         u.id,
         u.first_name,
         u.last_name,
         u.total_points,
         COUNT(ts.id) as approved_submissions
       FROM users u
       LEFT JOIN task_submissions ts ON u.id = ts.user_id AND ts.validation_status = 'approved'
       GROUP BY u.id, u.first_name, u.last_name, u.total_points
       ORDER BY u.total_points DESC
       LIMIT 10`
    ),
    pool.query(
      `SELECT
         tc.name as category_name,
         tc.icon,
         COUNT(t.id) as total_tasks,
         COUNT(ts.id) as total_submissions,
         COUNT(CASE WHEN ts.validation_status = 'approved' THEN 1 END) as approved_submissions
       FROM task_categories tc
       LEFT JOIN tasks t ON tc.id = t.category_id
       LEFT JOIN task_submissions ts ON t.id = ts.task_id
       GROUP BY tc.id, tc.name, tc.icon
       ORDER BY total_submissions DESC`
    )
  ]);

  const analytics = {
    overview: {
      total_users: parseInt(totalUsersResult.rows[0].count),
      active_users: parseInt(activeUsersResult.rows[0].count),
      total_tasks: parseInt(totalTasksResult.rows[0].count),
      active_tasks: parseInt(activeTasksResult.rows[0].count),
      total_submissions: parseInt(totalSubmissionsResult.rows[0].count),
      pending_submissions: parseInt(pendingSubmissionsResult.rows[0].count),
      approved_submissions: parseInt(approvedSubmissionsResult.rows[0].count),
      rejected_submissions: parseInt(rejectedSubmissionsResult.rows[0].count),
      approval_rate: parseInt(approvedSubmissionsResult.rows[0].count) / Math.max(1, parseInt(approvedSubmissionsResult.rows[0].count) + parseInt(rejectedSubmissionsResult.rows[0].count)) * 100
    },
    recent_activity: recentActivityResult.rows,
    top_performers: topPerformersResult.rows,
    category_stats: categoryStatsResult.rows
  };

  res.json({
    success: true,
    data: analytics
  });
});

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user?.is_admin) {
    throw new AppError('Admin access required', 403);
  }

  const { page = 1, limit = 20, account_status, search } = req.query as any;

  let whereConditions = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (account_status) {
    whereConditions.push(`account_status = $${paramIndex++}`);
    queryParams.push(account_status);
  }

  if (search) {
    whereConditions.push(`(first_name ILIKE $${paramIndex++} OR last_name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++})`);
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const offset = (Number(page) - 1) * Number(limit);

  const usersQuery = `
    SELECT
      id, email, first_name, last_name, avatar_url, location_lat, location_lng,
      location_radius, location_updated_at, total_points, account_status,
      is_admin, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  queryParams.push(Number(limit), offset);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM users
    ${whereClause}
  `;

  const [usersResult, countResult] = await Promise.all([
    pool.query(usersQuery, queryParams),
    pool.query(countQuery, queryParams.slice(0, -2))
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / Number(limit));

  res.json({
    success: true,
    data: usersResult.rows,
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