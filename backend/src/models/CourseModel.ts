import { query } from '../db.js';
import { Course, CreateCourseRequest, UpdateCourseRequest } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class CourseModel {
  static async findAll(limit: number = 100, offset: number = 0): Promise<Course[]> {
    const result = await query(
      `SELECT 
        c.*, 
        i.title as instructor_title,
        i.avatar_url as instructor_avatar,
        i.bio as instructor_bio,
        i.rating as instructor_rating,
        i.total_courses as instructor_total_courses
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.is_published = true 
       ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async findById(id: number): Promise<Course | null> {
    const result = await query(
      `SELECT 
        c.*,
        i.title as instructor_title,
        i.avatar_url as instructor_avatar,
        i.bio as instructor_bio,
        i.rating as instructor_rating,
        i.total_courses as instructor_total_courses
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUuid(uuid: string): Promise<Course | null> {
    const result = await query(
      `SELECT 
        c.*,
        i.title as instructor_title,
        i.avatar_url as instructor_avatar,
        i.bio as instructor_bio,
        i.rating as instructor_rating,
        i.total_courses as instructor_total_courses
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.uuid = $1`,
      [uuid]
    );
    return result.rows[0] || null;
  }

  static async findByCategory(category: string, limit: number = 100): Promise<Course[]> {
    const result = await query(
      `SELECT 
        c.*,
        i.title as instructor_title,
        i.avatar_url as instructor_avatar,
        i.bio as instructor_bio,
        i.rating as instructor_rating,
        i.total_courses as instructor_total_courses
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.category = $1 AND c.is_published = true 
       ORDER BY c.rating DESC
       LIMIT $2`,
      [category, limit]
    );
    return result.rows;
  }

  static async findByInstructor(instructorId: number): Promise<Course[]> {
    const result = await query(
      `SELECT 
        c.*,
        i.title as instructor_title,
        i.avatar_url as instructor_avatar,
        i.bio as instructor_bio,
        i.rating as instructor_rating,
        i.total_courses as instructor_total_courses
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.instructor_id = $1 ORDER BY c.created_at DESC`,
      [instructorId]
    );
    return result.rows;
  }

  static async search(query_text: string, limit: number = 50): Promise<Course[]> {
    const result = await query(
      `SELECT 
        c.*,
        i.title as instructor_title,
        i.avatar_url as instructor_avatar,
        i.bio as instructor_bio,
        i.rating as instructor_rating,
        i.total_courses as instructor_total_courses
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.is_published = true AND (
         c.title ILIKE $1 OR c.subtitle ILIKE $1 OR c.description ILIKE $1
       )
       ORDER BY c.rating DESC
       LIMIT $2`,
      [`%${query_text}%`, limit]
    );
    return result.rows;
  }

  static async create(
    instructorId: number,
    data: CreateCourseRequest
  ): Promise<Course> {
    const uuid = uuidv4();
    const result = await query(
      `INSERT INTO courses (
        uuid, instructor_id, title, subtitle, description, category, level,
        duration, price, currency, image_url, tags, objectives, requirements, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        uuid,
        instructorId,
        data.title,
        data.subtitle,
        data.description,
        data.category,
        data.level,
        data.duration,
        data.price,
        data.currency || 'MWK',
        data.image_url,
        data.tags || [],
        data.objectives || [],
        data.requirements || [],
        true, // Set is_published to true by default
      ]
    );
    return result.rows[0];
  }

  static async update(id: number, data: Partial<UpdateCourseRequest>): Promise<Course> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = [
      'title',
      'subtitle',
      'description',
      'category',
      'level',
      'duration',
      'price',
      'image_url',
      'tags',
      'objectives',
      'requirements',
      'is_published',
    ];

    Object.entries(data).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        if (['tags', 'objectives', 'requirements'].includes(key)) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value || []);
        } else {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE courses SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }

  static async incrementEnrolledCount(courseId: number): Promise<void> {
    await query(
      'UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = $1',
      [courseId]
    );
  }

  static async decrementEnrolledCount(courseId: number): Promise<void> {
    await query(
      'UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = $1 AND enrolled_count > 0',
      [courseId]
    );
  }

  static async updateRating(courseId: number, newRating: number): Promise<void> {
    await query('UPDATE courses SET rating = $1 WHERE id = $2', [newRating, courseId]);
  }
}
