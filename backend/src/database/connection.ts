import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'location_based_tasks',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

export async function connectDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully');
    console.log(`📅 Database time: ${result.rows[0].now}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
  console.log('🔌 Database connection closed');
}