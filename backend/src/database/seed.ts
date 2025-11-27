import { pool } from './connection';
import bcrypt from 'bcrypt';

const seedData = [
  // Insert task categories
  {
    table: 'task_categories',
    data: [
      {
        name: 'Photography',
        description: 'Take photos of specific locations, objects, or events',
        icon: '📸'
      },
      {
        name: 'Survey & Research',
        description: 'Collect data, conduct surveys, or gather information',
        icon: '📊'
      },
      {
        name: 'Cleanup',
        description: 'Help clean up parks, streets, or public spaces',
        icon: '🧹'
      },
      {
        name: 'Delivery',
        description: 'Deliver items to specific locations',
        icon: '📦'
      },
      {
        name: 'Verification',
        description: 'Verify information or check conditions at locations',
        icon: '✅'
      },
      {
        name: 'Community Help',
        description: 'Assist with community projects and local initiatives',
        icon: '🤝'
      }
    ]
  },
  // Insert sample tasks
  {
    table: 'tasks',
    data: [
      {
        title: 'Photograph Local Landmark',
        description: 'Take 3 clear photos of the town hall from different angles. Make sure to capture the main entrance and any historical plaques.',
        category_id: '1', // Photography category (will be replaced with actual UUID)
        location_lat: 40.7128,
        location_lng: -74.0060,
        location_radius: 100,
        points_value: 50,
        difficulty_level: 2,
        time_limit_hours: 24,
        required_evidence: ['photo_main_entrance', 'photo_historical_plaques', 'photo_different_angle'],
        status: 'active',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      },
      {
        title: 'Park Cleanup Survey',
        description: 'Visit Central Park and document areas that need cleaning. Take photos of trash accumulation areas and note the types of litter found.',
        category_id: '2', // Survey & Research category
        location_lat: 40.7829,
        location_lng: -73.9654,
        location_radius: 500,
        points_value: 75,
        difficulty_level: 3,
        time_limit_hours: 48,
        required_evidence: ['photos_trash_areas', 'litter_types_documentation', 'location_coordinates'],
        status: 'active',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
      },
      {
        title: 'Verify Street Sign Conditions',
        description: 'Check and photograph 5 street signs in the downtown area for visibility, damage, or graffiti. Report any that need maintenance.',
        category_id: '5', // Verification category
        location_lat: 40.7580,
        location_lng: -73.9855,
        location_radius: 200,
        points_value: 40,
        difficulty_level: 1,
        time_limit_hours: 12,
        required_evidence: ['sign_photos', 'condition_report', 'location_tags'],
        status: 'active',
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      },
      {
        title: 'Community Garden Documentation',
        description: 'Visit the community garden and take photos of current plant conditions, water systems, and any areas needing attention.',
        category_id: '6', // Community Help category
        location_lat: 40.7489,
        location_lng: -73.9680,
        location_radius: 50,
        points_value: 60,
        difficulty_level: 2,
        time_limit_hours: 6,
        required_evidence: ['garden_overview', 'plant_conditions', 'water_system_status'],
        status: 'active',
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
      }
    ]
  }
];

export async function seed(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, is_admin, account_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['admin@taskapp.com', adminPasswordHash, 'Admin', 'User', true, 'active']
    );

    const adminId = adminResult.rows[0]?.id;

    if (adminId) {
      console.log('✅ Admin user created successfully');
    }

    // Get category IDs
    const categoryResult = await client.query('SELECT id, name FROM task_categories');
    const categoryMap = categoryResult.rows.reduce((acc, row) => {
      acc[row.name.toLowerCase()] = row.id;
      return acc;
    }, {} as Record<string, string>);

    // Insert categories if they don't exist
    for (const category of seedData[0].data) {
      const existingCategory = categoryResult.rows.find((c: any) => c.name === category.name);
      if (!existingCategory) {
        const result = await client.query(
          `INSERT INTO task_categories (name, description, icon)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [category.name, category.description, category.icon]
        );
        categoryMap[category.name.toLowerCase()] = result.rows[0].id;
      }
    }

    // Insert sample tasks
    const categoryIds = await client.query('SELECT id, name FROM task_categories');
    const categoryLookup = categoryIds.rows.reduce((acc, row) => {
      acc[row.name.toLowerCase().replace(' & research', '').replace(' & ', '_')] = row.id;
      return acc;
    }, {} as Record<string, string>);

    for (const task of seedData[1].data) {
      const categoryName = Object.keys(categoryLookup).find(key =>
        task.category_id.includes(key) || key.includes(task.category_id.toLowerCase())
      );

      const actualCategoryId = categoryName ? categoryLookup[categoryName] : categoryLookup.photography;

      await client.query(
        `INSERT INTO tasks (
          title, description, category_id, location_lat, location_lng,
          location_radius, points_value, difficulty_level, time_limit_hours,
          required_evidence, status, expires_at, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT DO NOTHING`,
        [
          task.title,
          task.description,
          actualCategoryId,
          task.location_lat,
          task.location_lng,
          task.location_radius,
          task.points_value,
          task.difficulty_level,
          task.time_limit_hours,
          JSON.stringify(task.required_evidence),
          task.status,
          task.expires_at,
          adminId
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database seeding completed successfully');
    console.log('👤 Admin login: admin@taskapp.com / admin123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}