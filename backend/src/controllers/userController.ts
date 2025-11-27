import { Response } from 'express';
import { AuthRequest, ApiResponse, UpdateUserLocationData } from '@/types';
import { AppError, asyncHandler } from '@/middleware/errorHandler';
import { pool } from '@/database/connection';

export const updateLocation = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const { location_lat, location_lng, location_radius = 1000 }: UpdateUserLocationData = req.body;

  if (!location_lat || !location_lng) {
    throw new AppError('Latitude and longitude are required', 400);
  }

  if (typeof location_lat !== 'number' || typeof location_lng !== 'number') {
    throw new AppError('Location coordinates must be numbers', 400);
  }

  if (location_lat < -90 || location_lat > 90) {
    throw new AppError('Latitude must be between -90 and 90', 400);
  }

  if (location_lng < -180 || location_lng > 180) {
    throw new AppError('Longitude must be between -180 and 180', 400);
  }

  if (location_radius < 100 || location_radius > 50000) {
    throw new AppError('Location radius must be between 100m and 50km', 400);
  }

  const userId = req.user!.id;

  const updateQuery = await pool.query(
    `UPDATE users
     SET location_lat = $1, location_lng = $2, location_radius = $3, location_updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING location_lat, location_lng, location_radius, location_updated_at`,
    [location_lat, location_lng, location_radius, userId]
  );

  res.json({
    success: true,
    data: {
      location: updateQuery.rows[0]
    }
  });
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;

  const userQuery = await pool.query(
    `SELECT id, email, first_name, last_name, avatar_url, location_lat, location_lng,
     location_radius, location_updated_at, total_points, account_status, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (userQuery.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = userQuery.rows[0];

  const pointsHistoryQuery = await pool.query(
    `SELECT points_change, reason, created_at
     FROM points_history
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  );

  const achievementsQuery = await pool.query(
    `SELECT achievement_type, achievement_data, earned_at
     FROM user_achievements
     WHERE user_id = $1
     ORDER BY earned_at DESC`,
    [userId]
  );

  const submissionsCountQuery = await pool.query(
    `SELECT
       COUNT(*) as total_submissions,
       COUNT(CASE WHEN validation_status = 'approved' THEN 1 END) as approved_submissions,
       COUNT(CASE WHEN validation_status = 'pending' THEN 1 END) as pending_submissions,
       COUNT(CASE WHEN validation_status = 'rejected' THEN 1 END) as rejected_submissions
     FROM task_submissions
     WHERE user_id = $1`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        stats: {
          ...submissionsCountQuery.rows[0]
        },
        points_history: pointsHistoryQuery.rows,
        achievements: achievementsQuery.rows
      }
    }
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const { first_name, last_name, avatar_url } = req.body;

  if (!first_name || !last_name) {
    throw new AppError('First name and last name are required', 400);
  }

  const updateQuery = await pool.query(
    `UPDATE users
     SET first_name = $1, last_name = $2, avatar_url = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING id, email, first_name, last_name, avatar_url, updated_at`,
    [first_name.trim(), last_name.trim(), avatar_url, userId]
  );

  res.json({
    success: true,
    data: {
      user: updateQuery.rows[0]
    }
  });
});

export const getPointsHistory = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const { page = 1, limit = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const historyQuery = await pool.query(
    `SELECT points_change, reason, reference_id, created_at
     FROM points_history
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, Number(limit), offset]
  );

  const countQuery = await pool.query(
    'SELECT COUNT(*) as total FROM points_history WHERE user_id = $1',
    [userId]
  );

  const total = parseInt(countQuery.rows[0].total);
  const totalPages = Math.ceil(total / Number(limit));

  res.json({
    success: true,
    data: historyQuery.rows,
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

export const getAchievements = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;

  const achievementsQuery = await pool.query(
    `SELECT achievement_type, achievement_data, earned_at
     FROM user_achievements
     WHERE user_id = $1
     ORDER BY earned_at DESC`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      achievements: achievementsQuery.rows
    }
  });
});

export const getNearbyTasks = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>) => {
  const userId = req.user!.id;
  const { radius, limit = 20, offset = 0, category_id, min_points, max_points, difficulty_level } = req.query;

  const userLocationQuery = await pool.query(
    'SELECT location_lat, location_lng, location_radius FROM users WHERE id = $1',
    [userId]
  );

  if (userLocationQuery.rows.length === 0 || !userLocationQuery.rows[0].location_lat) {
    throw new AppError('User location not set. Please update your location first.', 400);
  }

  const userLocation = userLocationQuery.rows[0];
  const searchRadius = Number(radius) || userLocation.location_radius;

  let whereConditions = [
    't.status = $1',
    '(t.expires_at IS NULL OR t.expires_at > CURRENT_TIMESTAMP)',
    `ST_DWithin(
      ST_MakePoint(t.location_lng, t.location_lat)::geography,
      ST_MakePoint($2, $3)::geography,
      $4
    )`
  ];

  let queryParams: any[] = ['active', userLocation.location_lng, userLocation.location_lat, searchRadius];
  let paramIndex = 5;

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

  const tasksQuery = `
    SELECT
      t.*,
      tc.name as category_name,
      tc.icon as category_icon,
      ST_Distance(
        ST_MakePoint(t.location_lng, t.location_lat)::geography,
        ST_MakePoint($2, $3)::geography
      ) as distance_meters,
      u.first_name || ' ' || u.last_name as creator_name
    FROM tasks t
    LEFT JOIN task_categories tc ON t.category_id = tc.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY distance_meters ASC, t.points_value DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  queryParams.push(Number(limit), Number(offset));

  const result = await pool.query(tasksQuery, queryParams);

  const tasksWithDistance = result.rows.map(task => ({
    ...task,
    distance: Number(task.distance_meters),
    distance_km: Math.round(Number(task.distance_meters) / 100) / 10
  }));

  res.json({
    success: true,
    data: tasksWithDistance
  });
});