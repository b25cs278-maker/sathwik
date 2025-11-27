export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  location_lat?: number;
  location_lng?: number;
  location_radius?: number;
  location_updated_at?: Date;
  total_points: number;
  account_status: 'active' | 'suspended' | 'pending';
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category_id: string;
  location_lat: number;
  location_lng: number;
  location_radius: number;
  points_value: number;
  difficulty_level: number;
  time_limit_hours?: number;
  required_evidence: string[];
  status: 'active' | 'paused' | 'expired';
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
  category?: TaskCategory;
  creator?: User;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string;
  submission_data: Record<string, any>;
  media_files: string[];
  submission_lat?: number;
  submission_lng?: number;
  submitted_at: Date;
  validated_at?: Date;
  validated_by?: string;
  validation_status: 'pending' | 'approved' | 'rejected';
  validation_notes?: string;
  points_awarded?: number;
  task?: Task;
  user?: User;
  validator?: User;
}

export interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  file_type: 'photo' | 'video';
  file_size: number;
  storage_url: string;
  thumbnail_url?: string;
  uploaded_by: string;
  upload_metadata: Record<string, any>;
  created_at: Date;
  uploader?: User;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_data: Record<string, any>;
  earned_at: Date;
  user?: User;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  points_change: number;
  reason: string;
  reference_id?: string;
  created_at: Date;
  user?: User;
}

export interface LocationUpdate {
  user_id: string;
  location_lat: number;
  location_lng: number;
  location_radius?: number;
}

export interface TaskFilters {
  category_id?: string;
  min_points?: number;
  max_points?: number;
  difficulty_level?: number;
  status?: Task['status'];
  radius?: number;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: User;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface CreateTaskData {
  title: string;
  description: string;
  category_id: string;
  location_lat: number;
  location_lng: number;
  location_radius?: number;
  points_value: number;
  difficulty_level?: number;
  time_limit_hours?: number;
  required_evidence?: string[];
  expires_at?: Date;
}

export interface SubmitTaskData {
  task_id: string;
  submission_data: Record<string, any>;
  media_files: string[];
  submission_lat: number;
  submission_lng: number;
}

export interface AdminValidationData {
  validation_status: 'approved' | 'rejected';
  validation_notes?: string;
  points_awarded?: number;
}

export interface UpdateUserLocationData {
  location_lat: number;
  location_lng: number;
  location_radius?: number;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}