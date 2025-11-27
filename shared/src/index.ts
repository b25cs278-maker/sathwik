export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  location_lat?: number;
  location_lng?: number;
  location_radius?: number;
  location_updated_at?: string;
  total_points: number;
  account_status: 'active' | 'suspended' | 'pending';
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
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
  created_at: string;
  updated_at: string;
  expires_at?: string;
  category?: TaskCategory;
  creator?: User;
  distance?: number;
  distance_km?: number;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string;
  submission_data: Record<string, any>;
  media_files: string[];
  submission_lat?: number;
  submission_lng?: number;
  submitted_at: string;
  validated_at?: string;
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
  created_at: string;
  uploader?: User;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_data: AchievementData;
  earned_at: string;
  user?: User;
}

export interface AchievementData {
  title: string;
  description: string;
  icon: string;
  points_awarded: number;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  points_change: number;
  reason: string;
  reference_id?: string;
  created_at: string;
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
  expires_at?: string;
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SocketEvents {
  // Client to Server
  join_location: { location_lat: number; location_lng: number; radius?: number };
  leave_location: { location_lat: number; location_lng: number };
  task_created: { task_id: string; location_lat: number; location_lng: number };
  task_submitted: { task_id: string; submission_id: string };

  // Server to Client
  location_joined: { location_key: string; nearby_users: number };
  new_task_nearby: { task_id: string; title: string; points_value: number; category_name: string; distance_text: string; message: string };
  submission_confirmed: { task_id: string; submission_id: string; message: string };
  task_validated: { task_id: string; submission_id: string; validation_status: string; points_awarded?: number; validation_notes?: string; message: string };
  achievement_unlocked: { achievement_type: string; title: string; description: string; icon: string; points_awarded: number; message: string };
  admin_notification: { type: string; message: string; data?: any };
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapLocation {
  lat: number;
  lng: number;
}

export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface TaskFormData {
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
  expires_at?: string;
}

export interface SubmissionFormData {
  task_id: string;
  submission_data: Record<string, any>;
  media_files: File[];
  submission_lat: number;
  submission_lng: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  total_points: number;
  completed_tasks?: number;
  location_lat?: number;
  location_lng?: number;
}