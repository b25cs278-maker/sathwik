import { pool } from './connection';

const migrations = [
  // Create extension for PostGIS
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "postgis";`,

  // Create users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_radius INTEGER DEFAULT 1000, -- search radius in meters
    location_updated_at TIMESTAMP,
    total_points INTEGER DEFAULT 0,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Create task categories table
  `CREATE TABLE IF NOT EXISTS task_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Create tasks table
  `CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES task_categories(id),
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    location_radius INTEGER DEFAULT 100,
    points_value INTEGER NOT NULL,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    time_limit_hours INTEGER,
    required_evidence JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
  );`,

  // Create task submissions table
  `CREATE TABLE IF NOT EXISTS task_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    user_id UUID NOT NULL REFERENCES users(id),
    submission_data JSONB DEFAULT '{}'::jsonb,
    media_files JSONB DEFAULT '[]'::jsonb,
    submission_lat DECIMAL(10, 8),
    submission_lng DECIMAL(11, 8),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP,
    validated_by UUID REFERENCES users(id),
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
    validation_notes TEXT,
    points_awarded INTEGER,
    UNIQUE(task_id, user_id) -- One submission per task per user
  );`,

  // Create media files table
  `CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('photo', 'video')),
    file_size INTEGER NOT NULL,
    storage_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    upload_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Create user achievements table
  `CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    achievement_type VARCHAR(50) NOT NULL,
    achievement_data JSONB DEFAULT '{}'::jsonb,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_type)
  );`,

  // Create points history table
  `CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    points_change INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    reference_id UUID, -- Can reference task_submissions or other tables
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Create spatial indexes for location queries
  `CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (
    ST_MakePoint(location_lng, location_lat)
  );`,

  `CREATE INDEX IF NOT EXISTS idx_tasks_location ON tasks USING GIST (
    ST_MakePoint(location_lng, location_lat)
  );`,

  `CREATE INDEX IF NOT EXISTS idx_task_submissions_location ON task_submissions USING GIST (
    ST_MakePoint(submission_lng, submission_lat)
  );`,

  // Create other useful indexes
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  `CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_task_submissions_user ON task_submissions(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(validation_status);`,
  `CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);`,
  `CREATE INDEX IF NOT EXISTS idx_points_history_user ON points_history(user_id);`,

  // Create function to auto-update updated_at timestamp
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';`,

  // Create triggers for updated_at
  `DROP TRIGGER IF EXISTS update_users_updated_at ON users;
   CREATE TRIGGER update_users_updated_at
   BEFORE UPDATE ON users
   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,

  `DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
   CREATE TRIGGER update_tasks_updated_at
   BEFORE UPDATE ON tasks
   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
];

export async function migrate(): Promise<void> {
  console.log('🔄 Starting database migration...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration ${i + 1}/${migrations.length}...`);
      await client.query(migrations[i]);
    }

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}