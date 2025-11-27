import { pool } from '@/database/connection';

interface AchievementData {
  userId: string;
  pointsEarned: number;
  taskId: string;
  taskTitle: string;
  categoryName: string;
}

export class AchievementService {
  static async checkAndAwardAchievements(data: AchievementData): Promise<void> {
    const { userId, pointsEarned, taskId, taskTitle, categoryName } = data;

    await Promise.all([
      this.checkFirstTaskCompletion(userId),
      this.checkPointsMilestones(userId),
      this.checkCategoryMasters(userId, categoryName),
      this.checkStreakAchievements(userId),
      this.checkQualityAchievements(userId),
      this.checkLocationAchievements(userId)
    ]);
  }

  private static async checkFirstTaskCompletion(userId: string): Promise<void> {
    const submissionCountQuery = await pool.query(
      `SELECT COUNT(*) as completed_tasks
       FROM task_submissions
       WHERE user_id = $1 AND validation_status = 'approved'`,
      [userId]
    );

    const completedTasks = parseInt(submissionCountQuery.rows[0].completed_tasks);

    if (completedTasks === 1) {
      await this.awardAchievement(userId, 'first_task', {
        title: 'First Steps',
        description: 'Completed your first task!',
        icon: '🎯',
        points_awarded: 10
      });
    }
  }

  private static async checkPointsMilestones(userId: string): Promise<void> {
    const userQuery = await pool.query(
      'SELECT total_points FROM users WHERE id = $1',
      [userId]
    );

    const totalPoints = userQuery.rows[0].total_points;

    const milestones = [
      { points: 100, title: 'Rising Star', description: 'Earned 100 points', icon: '⭐' },
      { points: 500, title: 'Task Master', description: 'Earned 500 points', icon: '🏆' },
      { points: 1000, title: 'Community Hero', description: 'Earned 1000 points', icon: '🦸' },
      { points: 2500, title: 'Legendary Contributor', description: 'Earned 2500 points', icon: '👑' },
      { points: 5000, title: 'Living Legend', description: 'Earned 5000 points', icon: '🌟' }
    ];

    for (const milestone of milestones) {
      if (totalPoints >= milestone.points) {
        await this.awardAchievement(userId, `points_${milestone.points}`, {
          title: milestone.title,
          description: milestone.description,
          icon: milestone.icon,
          points_awarded: Math.floor(milestone.points / 10)
        });
      }
    }
  }

  private static async checkCategoryMasters(userId: string, categoryName: string): Promise<void> {
    const categoryCountQuery = await pool.query(
      `SELECT COUNT(*) as category_tasks
       FROM task_submissions ts
       JOIN tasks t ON ts.task_id = t.id
       JOIN task_categories tc ON t.category_id = tc.id
       WHERE ts.user_id = $1 AND ts.validation_status = 'approved' AND tc.name = $2`,
      [userId, categoryName]
    );

    const categoryTasks = parseInt(categoryCountQuery.rows[0].category_tasks);

    if (categoryTasks === 5) {
      await this.awardAchievement(userId, `category_${categoryName.toLowerCase()}_5`, {
        title: `${categoryName} Enthusiast`,
        description: `Completed 5 ${categoryName.toLowerCase()} tasks`,
        icon: '📚',
        points_awarded: 25
      });
    } else if (categoryTasks === 10) {
      await this.awardAchievement(userId, `category_${categoryName.toLowerCase()}_10`, {
        title: `${categoryName} Expert`,
        description: `Completed 10 ${categoryName.toLowerCase()} tasks`,
        icon: '🎓',
        points_awarded: 50
      });
    } else if (categoryTasks === 25) {
      await this.awardAchievement(userId, `category_${categoryName.toLowerCase()}_25`, {
        title: `${categoryName} Master`,
        description: `Completed 25 ${categoryName.toLowerCase()} tasks`,
        icon: '🏅',
        points_awarded: 100
      });
    }
  }

  private static async checkStreakAchievements(userId: string): Promise<void> {
    const streakQuery = await pool.query(
      `WITH daily_submissions AS (
         SELECT DATE(validated_at) as submission_date
         FROM task_submissions
         WHERE user_id = $1 AND validation_status = 'approved'
         GROUP BY DATE(validated_at)
         ORDER BY submission_date DESC
       ),
       consecutive_days AS (
         SELECT
           submission_date,
           submission_date - (ROW_NUMBER() OVER (ORDER BY submission_date DESC) - 1) * INTERVAL '1 day' as streak_date
         FROM daily_submissions
       )
       SELECT COUNT(*) as current_streak
       FROM consecutive_days
       GROUP BY streak_date
       ORDER BY streak_date DESC
       LIMIT 1`,
      [userId]
    );

    const currentStreak = parseInt(streakQuery.rows[0]?.current_streak || '0');

    if (currentStreak === 3) {
      await this.awardAchievement(userId, 'streak_3', {
        title: 'On a Roll',
        description: '3-day submission streak',
        icon: '🔥',
        points_awarded: 15
      });
    } else if (currentStreak === 7) {
      await this.awardAchievement(userId, 'streak_7', {
        title: 'Week Warrior',
        description: '7-day submission streak',
        icon: '💪',
        points_awarded: 50
      });
    } else if (currentStreak === 14) {
      await this.awardAchievement(userId, 'streak_14', {
        title: 'Fortnight Champion',
        description: '14-day submission streak',
        icon: '🎖️',
        points_awarded: 100
      });
    } else if (currentStreak === 30) {
      await this.awardAchievement(userId, 'streak_30', {
        title: 'Monthly Master',
        description: '30-day submission streak',
        icon: '🗓️',
        points_awarded: 250
      });
    }
  }

  private static async checkQualityAchievements(userId: string): Promise<void> {
    const qualityStatsQuery = await pool.query(
      `SELECT
         COUNT(*) as total_submissions,
         COUNT(CASE WHEN validation_status = 'approved' THEN 1 END) as approved_submissions,
         AVG(points_awarded) as avg_points_per_submission
       FROM task_submissions
       WHERE user_id = $1 AND points_awarded IS NOT NULL`,
      [userId]
    );

    const stats = qualityStatsQuery.rows[0];
    const approvalRate = stats.total_submissions > 0 ? (stats.approved_submissions / stats.total_submissions) * 100 : 0;

    if (stats.approved_submissions >= 10 && approvalRate >= 95) {
      await this.awardAchievement(userId, 'quality_expert', {
        title: 'Quality Expert',
        description: '10+ approved submissions with 95%+ approval rate',
        icon: '✨',
        points_awarded: 75
      });
    }

    if (stats.avg_points_per_submission >= 80) {
      await this.awardAchievement(userId, 'high_scorer', {
        title: 'High Scorer',
        description: 'Average 80+ points per submission',
        icon: '📈',
        points_awarded: 50
      });
    }
  }

  private static async checkLocationAchievements(userId: string): Promise<void> {
    const locationStatsQuery = await pool.query(
      `SELECT COUNT(DISTINCT ROUND(location_lat::numeric, 4) || ',' || ROUND(location_lng::numeric, 4)) as unique_locations
       FROM task_submissions
       WHERE user_id = $1 AND validation_status = 'approved'`,
      [userId]
    );

    const uniqueLocations = parseInt(locationStatsQuery.rows[0].unique_locations);

    if (uniqueLocations >= 5) {
      await this.awardAchievement(userId, 'explorer_5', {
        title: 'Neighborhood Explorer',
        description: 'Completed tasks in 5 different locations',
        icon: '🗺️',
        points_awarded: 30
      });
    } else if (uniqueLocations >= 10) {
      await this.awardAchievement(userId, 'explorer_10', {
        title: 'City Explorer',
        description: 'Completed tasks in 10 different locations',
        icon: '🌆',
        points_awarded: 60
      });
    } else if (uniqueLocations >= 25) {
      await this.awardAchievement(userId, 'explorer_25', {
        title: 'Regional Explorer',
        description: 'Completed tasks in 25 different locations',
        icon: '🌍',
        points_awarded: 150
      });
    }
  }

  private static async awardAchievement(
    userId: string,
    achievementType: string,
    achievementData: {
      title: string;
      description: string;
      icon: string;
      points_awarded: number;
    }
  ): Promise<void> {
    const existingAchievementQuery = await pool.query(
      'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_type = $2',
      [userId, achievementType]
    );

    if (existingAchievementQuery.rows.length > 0) {
      return;
    }

    await pool.query(
      'INSERT INTO user_achievements (user_id, achievement_type, achievement_data) VALUES ($1, $2, $3)',
      [userId, achievementType, JSON.stringify(achievementData)]
    );

    await pool.query(
      'UPDATE users SET total_points = total_points + $1 WHERE id = $2',
      [achievementData.points_awarded, userId]
    );

    await pool.query(
      'INSERT INTO points_history (user_id, points_change, reason) VALUES ($1, $2, $3)',
      [userId, achievementData.points_awarded, `Achievement: ${achievementData.title}`]
    );
  }

  static async getUserAchievements(userId: string): Promise<any[]> {
    const achievementsQuery = await pool.query(
      `SELECT achievement_type, achievement_data, earned_at
       FROM user_achievements
       WHERE user_id = $1
       ORDER BY earned_at DESC`,
      [userId]
    );

    return achievementsQuery.rows.map(row => ({
      ...row,
      achievement_data: JSON.parse(row.achievement_data as string)
    }));
  }

  static async getLeaderboard(limit: number = 50, locationBased: boolean = false): Promise<any[]> {
    if (locationBased) {
      return this.getLocationBasedLeaderboard(limit);
    } else {
      return this.getGlobalLeaderboard(limit);
    }
  }

  private static async getGlobalLeaderboard(limit: number): Promise<any[]> {
    const leaderboardQuery = await pool.query(
      `SELECT
         id, first_name, last_name, avatar_url, total_points,
         RANK() OVER (ORDER BY total_points DESC) as rank
       FROM users
       WHERE account_status = 'active' AND total_points > 0
       ORDER BY total_points DESC
       LIMIT $1`,
      [limit]
    );

    return leaderboardQuery.rows;
  }

  private static async getLocationBasedLeaderboard(limit: number): Promise<any[]> {
    const locationLeaderboardQuery = await pool.query(
      `SELECT
         u.id, u.first_name, u.last_name, u.avatar_url, u.total_points,
         COUNT(ts.id) as completed_tasks,
         u.location_lat, u.location_lng,
         RANK() OVER (ORDER BY COUNT(ts.id) DESC, u.total_points DESC) as rank
       FROM users u
       LEFT JOIN task_submissions ts ON u.id = ts.user_id AND ts.validation_status = 'approved'
       WHERE u.account_status = 'active' AND u.location_lat IS NOT NULL AND u.location_lng IS NOT NULL
       GROUP BY u.id, u.first_name, u.last_name, u.avatar_url, u.total_points, u.location_lat, u.location_lng
       HAVING COUNT(ts.id) > 0
       ORDER BY completed_tasks DESC, u.total_points DESC
       LIMIT $1`,
      [limit]
    );

    return locationLeaderboardQuery.rows;
  }
}