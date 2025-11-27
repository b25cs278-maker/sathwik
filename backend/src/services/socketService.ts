import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AppError } from '@/middleware/errorHandler';
import { pool } from '@/database/connection';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

export function setupSocketHandlers(io: SocketIOServer): void {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new AppError('Authentication token required', 401));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const userQuery = await pool.query(
        'SELECT id, email, is_admin, account_status FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userQuery.rows.length === 0 || userQuery.rows[0].account_status !== 'active') {
        return next(new AppError('Invalid or inactive user', 401));
      }

      const user = userQuery.rows[0];
      socket.userId = user.id;
      socket.userEmail = user.email;
      socket.isAdmin = user.is_admin;

      next();
    } catch (error) {
      next(new AppError('Invalid authentication token', 401));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`📱 User connected: ${socket.userEmail} (${socket.userId})`);

    socket.join(`user:${socket.userId}`);

    if (socket.isAdmin) {
      socket.join('admins');
    }

    socket.on('join_location', (data: { location_lat: number; location_lng: number; radius?: number }) => {
      if (!data.location_lat || !data.location_lng) {
        return;
      }

      const locationKey = `location:${Math.floor(data.location_lat * 100)}_${Math.floor(data.location_lng * 100)}`;
      socket.join(locationKey);

      socket.emit('location_joined', {
        location_key: locationKey,
        nearby_users: io.sockets.adapter.rooms.get(locationKey)?.size || 0
      });
    });

    socket.on('leave_location', (data: { location_lat: number; location_lng: number }) => {
      if (!data.location_lat || !data.location_lng) {
        return;
      }

      const locationKey = `location:${Math.floor(data.location_lat * 100)}_${Math.floor(data.location_lng * 100)}`;
      socket.leave(locationKey);
    });

    socket.on('task_created', (data: { task_id: string; location_lat: number; location_lng: number }) => {
      if (!socket.isAdmin) {
        return;
      }

      const nearbyLocationKey = `location:${Math.floor(data.location_lat * 100)}_${Math.floor(data.location_lng * 100)}`;

      socket.to(nearbyLocationKey).emit('new_task_nearby', {
        task_id: data.task_id,
        message: 'A new task is available near your location!'
      });

      io.to('admins').emit('admin_notification', {
        type: 'task_created',
        message: `New task created: ${data.task_id}`,
        data: data
      });
    });

    socket.on('task_submitted', (data: { task_id: string; submission_id: string }) => {
      io.to('admins').emit('admin_notification', {
        type: 'task_submitted',
        message: `New task submission requires validation: ${data.submission_id}`,
        data: data
      });

      socket.to(`user:${socket.userId}`).emit('submission_confirmed', {
        task_id: data.task_id,
        submission_id: data.submission_id,
        message: 'Your task submission has been received and is pending validation.'
      });
    });

    socket.on('disconnect', () => {
      console.log(`📱 User disconnected: ${socket.userEmail} (${socket.userId})`);
    });
  });
}

export function broadcastTaskCreation(io: SocketIOServer, taskData: any): void {
  const locationKey = `location:${Math.floor(taskData.location_lat * 100)}_${Math.floor(taskData.location_lng * 100)}`;

  io.to(locationKey).emit('new_task_nearby', {
    task_id: taskData.id,
    title: taskData.title,
    points_value: taskData.points_value,
    category_name: taskData.category_name,
    distance_text: 'near your location',
    message: `New ${taskData.category_name.toLowerCase()} task available!`
  });
}

export function broadcastTaskValidation(io: SocketIOServer, validationData: {
  user_id: string;
  task_id: string;
  submission_id: string;
  validation_status: 'approved' | 'rejected';
  points_awarded?: number;
  validation_notes?: string;
}): void {
  const { user_id, validation_status, points_awarded, validation_notes } = validationData;

  io.to(`user:${user_id}`).emit('task_validated', {
    task_id: validationData.task_id,
    submission_id: validationData.submission_id,
    validation_status,
    points_awarded,
    validation_notes,
    message: validation_status === 'approved'
      ? `Congratulations! Your task was approved and you earned ${points_awarded} points!`
      : `Your task was ${validation_status.toLowerCase()}. ${validation_notes || ''}`
  });

  io.to('admins').emit('admin_notification', {
    type: 'task_validated',
    message: `Task submission ${validationData.submission_id} has been ${validation_status}`,
    data: validationData
  });
}

export function broadcastNewAchievement(io: SocketIOServer, achievementData: {
  user_id: string;
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  points_awarded: number;
}): void {
  io.to(`user:${achievementData.user_id}`).emit('achievement_unlocked', {
    achievement_type: achievementData.achievement_type,
    title: achievementData.title,
    description: achievementData.description,
    icon: achievementData.icon,
    points_awarded: achievementData.points_awarded,
    message: `🎉 Achievement Unlocked: ${achievementData.title}! You earned ${achievementData.points_awarded} bonus points!`
  });

  io.to('admins').emit('admin_notification', {
    type: 'achievement_unlocked',
    message: `User unlocked achievement: ${achievementData.title}`,
    data: achievementData
  });
}