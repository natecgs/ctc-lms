import { query } from '../db.js';
import {
  Enrollment,
  CompletedLesson,
  QuizAttempt,
  Certificate,
  User,
  Profile,
  Instructor,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// USER MODEL
// ============================================================================

export class UserModel {
  static async findById(id: number): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findByAuthId(authId: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE auth_id = $1', [authId]);
    return result.rows[0] || null;
  }

  static async create(
    authId: string,
    email: string,
    role: 'student' | 'instructor' | 'admin' = 'student'
  ): Promise<User> {
    const result = await query(
      `INSERT INTO users (auth_id, email, role) VALUES ($1, $2, $3) RETURNING *`,
      [authId, email, role]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    data: Partial<{ role: string; is_active: boolean; email_verified: boolean }>
  ): Promise<User> {
    const result = await query(
      `UPDATE users SET role = COALESCE($1, role),
                        is_active = COALESCE($2, is_active),
                        email_verified = COALESCE($3, email_verified),
                        email_verified_at = CASE WHEN $3 = TRUE THEN CURRENT_TIMESTAMP ELSE email_verified_at END,
                        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [data.role, data.is_active, data.email_verified, id]
    );
    return result.rows[0];
  }

  static async createVerificationToken(userId: number, expiresIn: number = 24): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
    return token;
  }

  static async findVerificationToken(token: string): Promise<any | null> {
    const result = await query(
      `SELECT * FROM email_verification_tokens 
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [token]
    );
    return result.rows[0] || null;
  }

  static async deleteVerificationToken(token: string): Promise<void> {
    await query(`DELETE FROM email_verification_tokens WHERE token = $1`, [token]);
  }

  static async verifyToken(token: string): Promise<User | null> {
    const tokenRow = await this.findVerificationToken(token);
    if (!tokenRow) return null;

    // Mark email as verified
    const result = await query(
      `UPDATE users SET email_verified = TRUE, 
                        email_verified_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [tokenRow.user_id]
    );

    // Delete the token
    await this.deleteVerificationToken(token);

    return result.rows[0] || null;
  }
}

// ============================================================================
// PROFILE MODEL
// ============================================================================

export class ProfileModel {
  static async findByUserId(userId: number): Promise<Profile | null> {
    const result = await query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  static async create(userId: number, data: Partial<Profile>): Promise<Profile> {
    const result = await query(
      `INSERT INTO profiles (user_id, full_name, phone, location, organization, bio, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        data.full_name,
        data.phone,
        data.location,
        data.organization,
        data.bio,
        data.avatar_url,
      ]
    );
    return result.rows[0];
  }

  static async update(userId: number, data: Partial<Profile>): Promise<Profile> {
    // If email is being updated, update it in the users table
    if (data.email) {
      await query(
        `UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [data.email, userId]
      );
    }

    const result = await query(
      `UPDATE profiles 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           location = COALESCE($3, location),
           organization = COALESCE($4, organization),
           bio = COALESCE($5, bio),
           avatar_url = COALESCE($6, avatar_url),
           total_hours_learned = COALESCE($7, total_hours_learned),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $8 RETURNING *`,
      [
        data.full_name,
        data.phone,
        data.location,
        data.organization,
        data.bio,
        data.avatar_url,
        data.total_hours_learned,
        userId,
      ]
    );
    return result.rows[0];
  }
}

// ============================================================================
// INSTRUCTOR MODEL
// ============================================================================

export class InstructorModel {
  static async findById(id: number): Promise<Instructor | null> {
    const result = await query('SELECT * FROM instructors WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(): Promise<(Instructor & { user_id: number; email: string; user_email?: string })[]> {
    const result = await query(
      `SELECT i.*, u.id as user_id, u.email as user_email
       FROM instructors i
       JOIN users u ON i.user_id = u.id
       ORDER BY i.title ASC`
    );
    return result.rows;
  }

  static async findByUserId(userId: number): Promise<Instructor | null> {
    const result = await query('SELECT * FROM instructors WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  static async create(userId: number, data: Partial<Instructor>): Promise<Instructor> {
    const result = await query(
      `INSERT INTO instructors (user_id, title, bio, avatar_url, specializations)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        userId,
        data.title,
        data.bio,
        data.avatar_url,
        JSON.stringify(data.specializations || []),
      ]
    );
    return result.rows[0];
  }

  static async update(userId: number, data: Partial<Instructor>): Promise<Instructor> {
    const result = await query(
      `UPDATE instructors 
       SET title = COALESCE($1, title),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url),
           specializations = COALESCE($4, specializations),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5 RETURNING *`,
      [
        data.title,
        data.bio,
        data.avatar_url,
        data.specializations ? JSON.stringify(data.specializations) : undefined,
        userId,
      ]
    );
    return result.rows[0];
  }
}

// ============================================================================
// ENROLLMENT MODEL
// ============================================================================

export class EnrollmentModel {
  static async findUserEnrollments(userId: number): Promise<Enrollment[]> {
    const result = await query(
      'SELECT * FROM enrollments WHERE user_id = $1 ORDER BY enrolled_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async findById(id: number): Promise<Enrollment | null> {
    const result = await query('SELECT * FROM enrollments WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUserAndCourse(userId: number, courseId: number): Promise<Enrollment | null> {
    const result = await query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    return result.rows[0] || null;
  }

  static async create(userId: number, courseId: number): Promise<Enrollment> {
    const result = await query(
      `INSERT INTO enrollments (user_id, course_id)
       VALUES ($1, $2) RETURNING *`,
      [userId, courseId]
    );
    return result.rows[0];
  }

  static async updateProgress(
    userId: number,
    courseId: number,
    progressPercentage: number
  ): Promise<Enrollment> {
    const certificateEarned = progressPercentage >= 100;

    const result = await query(
      `UPDATE enrollments 
       SET progress_percentage = $1,
           certificate_earned = $2,
           last_accessed_at = CURRENT_TIMESTAMP,
           completed_at = CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE completed_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3 AND course_id = $4 RETURNING *`,
      [progressPercentage, certificateEarned, userId, courseId]
    );
    return result.rows[0];
  }

  static async getCourseStats(courseId: number): Promise<{
    totalEnrolled: number;
    avgProgress: number;
    completed: number;
  }> {
    const result = await query(
      `SELECT 
        COUNT(*) as total_enrolled,
        ROUND(AVG(progress_percentage)) as avg_progress,
        COUNT(CASE WHEN progress_percentage = 100 THEN 1 END) as completed
       FROM enrollments WHERE course_id = $1`,
      [courseId]
    );
    const row = result.rows[0];
    return {
      totalEnrolled: parseInt(row.total_enrolled),
      avgProgress: parseInt(row.avg_progress) || 0,
      completed: parseInt(row.completed),
    };
  }
}

// ============================================================================
// COMPLETED LESSON MODEL
// ============================================================================

export class CompletedLessonModel {
  static async findUserLessons(userId: number, courseId?: number): Promise<CompletedLesson[]> {
    const query_text =
      courseId
        ? 'SELECT * FROM completed_lessons WHERE user_id = $1 AND course_id = $2 ORDER BY completed_at DESC'
        : 'SELECT * FROM completed_lessons WHERE user_id = $1 ORDER BY completed_at DESC';
    const params = courseId ? [userId, courseId] : [userId];
    const result = await query(query_text, params);
    return result.rows;
  }

  static async findByLessonAndUser(
    userId: number,
    lessonId: number
  ): Promise<CompletedLesson | null> {
    const result = await query(
      'SELECT * FROM completed_lessons WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );
    return result.rows[0] || null;
  }

  static async create(
    userId: number,
    lessonId: number,
    courseId: number
  ): Promise<CompletedLesson> {
    const result = await query(
      `INSERT INTO completed_lessons (user_id, lesson_id, course_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, lessonId, courseId]
    );
    return result.rows[0];
  }

  static async getCompletedCount(userId: number, courseId: number): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM completed_lessons 
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );
    return parseInt(result.rows[0].count);
  }
}

// ============================================================================
// QUIZ ATTEMPT MODEL
// ============================================================================

export class QuizAttemptModel {
  static async findUserAttempts(userId: number, courseId?: number): Promise<QuizAttempt[]> {
    const query_text =
      courseId
        ? 'SELECT * FROM quiz_attempts WHERE user_id = $1 AND course_id = $2 ORDER BY attempted_at DESC'
        : 'SELECT * FROM quiz_attempts WHERE user_id = $1 ORDER BY attempted_at DESC';
    const params = courseId ? [userId, courseId] : [userId];
    const result = await query(query_text, params);
    return result.rows;
  }

  static async findByQuizAndUser(
    userId: number,
    quizId: number
  ): Promise<QuizAttempt | null> {
    const result = await query(
      'SELECT * FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2 ORDER BY attempted_at DESC LIMIT 1',
      [userId, quizId]
    );
    return result.rows[0] || null;
  }

  static async getBestScore(userId: number, quizId: number): Promise<number | null> {
    const result = await query(
      'SELECT MAX(score) as best_score FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2',
      [userId, quizId]
    );
    return result.rows[0]?.best_score ?? null;
  }

  static async create(
    userId: number,
    quizId: number,
    courseId: number,
    score: number,
    passed: boolean,
    answers: Record<string, string>,
    timeSpentSeconds?: number
  ): Promise<QuizAttempt> {
    const result = await query(
      `INSERT INTO quiz_attempts (
        user_id, quiz_id, course_id, score, passed, answers, time_spent_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, quizId, courseId, score, passed, JSON.stringify(answers), timeSpentSeconds]
    );
    return result.rows[0];
  }

  static async getAllAttempts(userId: number): Promise<
    (QuizAttempt & { best_score: number })[]
  > {
    const result = await query(
      `SELECT 
        qa.*,
        MAX(qa.score) OVER (PARTITION BY qa.quiz_id) as best_score
      FROM quiz_attempts qa
      WHERE qa.user_id = $1
      ORDER BY qa.attempted_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

// ============================================================================
// CERTIFICATE MODEL
// ============================================================================

export class CertificateModel {
  static async findUserCertificates(userId: number): Promise<Certificate[]> {
    const result = await query(
      'SELECT * FROM certificates WHERE user_id = $1 ORDER BY issued_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async findByUserAndCourse(
    userId: number,
    courseId: number
  ): Promise<Certificate | null> {
    const result = await query(
      'SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    return result.rows[0] || null;
  }

  static async findByUuid(uuid: string): Promise<Certificate | null> {
    const result = await query('SELECT * FROM certificates WHERE uuid = $1', [uuid]);
    return result.rows[0] || null;
  }

  static async create(userId: number, courseId: number): Promise<Certificate> {
    const uuid = uuidv4();
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const result = await query(
      `INSERT INTO certificates (uuid, user_id, course_id, certificate_number)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, course_id) DO UPDATE SET issued_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [uuid, userId, courseId, certificateNumber]
    );
    return result.rows[0];
  }

  static async verifyAndGet(uuid: string): Promise<Certificate | null> {
    const result = await query(
      `SELECT c.*, p.full_name as student_name, cr.title as course_title
       FROM certificates c
       JOIN profiles p ON c.user_id = p.user_id
       JOIN courses cr ON c.course_id = cr.id
       WHERE c.uuid = $1`,
      [uuid]
    );
    return result.rows[0] || null;
  }
}
