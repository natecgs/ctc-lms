import { query } from '../db.js';
import { Module, Lesson, Quiz, QuizQuestion } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// MODULE MODEL
// ============================================================================

export class ModuleModel {
  static async findByCourse(courseId: number): Promise<Module[]> {
    const result = await query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index ASC',
      [courseId]
    );
    return result.rows;
  }

  static async findById(id: number): Promise<Module | null> {
    const result = await query('SELECT * FROM modules WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUuid(uuid: string): Promise<Module | null> {
    const result = await query('SELECT * FROM modules WHERE uuid = $1', [uuid]);
    return result.rows[0] || null;
  }

  static async create(
    courseId: number,
    title: string,
    description?: string,
    orderIndex?: number
  ): Promise<Module> {
    const uuid = uuidv4();
    const order = orderIndex ?? (await this.getNextOrderIndex(courseId));

    const result = await query(
      `INSERT INTO modules (uuid, course_id, title, description, order_index)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [uuid, courseId, title, description, order]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    data: Partial<{ title: string; description: string }>
  ): Promise<Module> {
    const result = await query(
      `UPDATE modules 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [data.title, data.description, id]
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM modules WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }

  private static async getNextOrderIndex(courseId: number): Promise<number> {
    const result = await query(
      'SELECT MAX(order_index) as max_order FROM modules WHERE course_id = $1',
      [courseId]
    );
    return (result.rows[0]?.max_order ?? -1) + 1;
  }
}

// ============================================================================
// LESSON MODEL
// ============================================================================

export class LessonModel {
  static async findByModule(moduleId: number): Promise<Lesson[]> {
    const result = await query(
      'SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index ASC',
      [moduleId]
    );
    return result.rows;
  }

  static async findById(id: number): Promise<Lesson | null> {
    const result = await query('SELECT * FROM lessons WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUuid(uuid: string): Promise<Lesson | null> {
    const result = await query('SELECT * FROM lessons WHERE uuid = $1', [uuid]);
    return result.rows[0] || null;
  }

  static async findByCourse(courseId: number): Promise<Lesson[]> {
    const result = await query(
      `SELECT l.* FROM lessons l
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = $1
       ORDER BY m.order_index ASC, l.order_index ASC`,
      [courseId]
    );
    return result.rows;
  }

  static async create(
    moduleId: number,
    title: string,
    lessonType: 'video' | 'reading' | 'activity',
    data: Partial<{
      content: string;
      duration: string;
      videoUrl: string;
      resources: string[];
    }>
  ): Promise<Lesson> {
    const uuid = uuidv4();
    const orderIndex = await this.getNextOrderIndex(moduleId);

    const result = await query(
      `INSERT INTO lessons (
        uuid, module_id, title, lesson_type, content, duration,
        video_url, resources, order_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        uuid,
        moduleId,
        title,
        lessonType,
        data.content,
        data.duration,
        data.videoUrl,
        data.resources || [],
        orderIndex,
      ]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    data: Partial<{
      title: string;
      content: string;
      duration: string;
      videoUrl: string;
      resources: string[];
    }>
  ): Promise<Lesson> {
    const result = await query(
      `UPDATE lessons 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           duration = COALESCE($3, duration),
           video_url = COALESCE($4, video_url),
           resources = COALESCE($5, resources),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [
        data.title,
        data.content,
        data.duration,
        data.videoUrl,
        data.resources,
        id,
      ]
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM lessons WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }

  private static async getNextOrderIndex(moduleId: number): Promise<number> {
    const result = await query(
      'SELECT MAX(order_index) as max_order FROM lessons WHERE module_id = $1',
      [moduleId]
    );
    return (result.rows[0]?.max_order ?? -1) + 1;
  }
}

// ============================================================================
// QUIZ MODEL
// ============================================================================

export class QuizModel {
  static async findByCourse(courseId: number): Promise<Quiz[]> {
    const result = await query(
      'SELECT * FROM quizzes WHERE course_id = $1 ORDER BY created_at DESC',
      [courseId]
    );
    return result.rows;
  }

  static async findByModule(moduleId: number): Promise<Quiz | null> {
    const result = await query('SELECT * FROM quizzes WHERE module_id = $1', [moduleId]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<Quiz | null> {
    const result = await query('SELECT * FROM quizzes WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUuid(uuid: string): Promise<Quiz | null> {
    const result = await query('SELECT * FROM quizzes WHERE uuid = $1', [uuid]);
    return result.rows[0] || null;
  }

  static async create(
    courseId: number,
    title: string,
    data: Partial<{
      moduleId: number;
      description: string;
      passingScore: number;
      timeLimitMinutes: number;
      isExam: boolean;
    }>
  ): Promise<Quiz> {
    const uuid = uuidv4();
    const result = await query(
      `INSERT INTO quizzes (
        uuid, course_id, module_id, title, description, passing_score,
        time_limit_minutes, is_exam
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        uuid,
        courseId,
        data.moduleId,
        title,
        data.description,
        data.passingScore ?? 70,
        data.timeLimitMinutes,
        data.isExam ?? false,
      ]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      passingScore: number;
      timeLimitMinutes: number;
    }>
  ): Promise<Quiz> {
    const result = await query(
      `UPDATE quizzes 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           passing_score = COALESCE($3, passing_score),
           time_limit_minutes = COALESCE($4, time_limit_minutes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [data.title, data.description, data.passingScore, data.timeLimitMinutes, id]
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM quizzes WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }
}

// ============================================================================
// QUIZ QUESTION MODEL
// ============================================================================

export class QuizQuestionModel {
  static async findByQuiz(quizId: number): Promise<QuizQuestion[]> {
    const result = await query(
      'SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC',
      [quizId]
    );
    return result.rows;
  }

  static async findById(id: number): Promise<QuizQuestion | null> {
    const result = await query('SELECT * FROM quiz_questions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUuid(uuid: string): Promise<QuizQuestion | null> {
    const result = await query('SELECT * FROM quiz_questions WHERE uuid = $1', [uuid]);
    return result.rows[0] || null;
  }

  static async create(
    quizId: number,
    question: {
      questionText: string;
      questionType: 'multiple-choice' | 'true-false' | 'short-answer';
      options?: string[];
      correctAnswer: string;
      explanation?: string;
      points?: number;
    }
  ): Promise<QuizQuestion> {
    const uuid = uuidv4();
    const orderIndex = await this.getNextOrderIndex(quizId);

    const result = await query(
      `INSERT INTO quiz_questions (
        uuid, quiz_id, question_text, question_type, options,
        correct_answer, explanation, points, order_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        uuid,
        quizId,
        question.questionText,
        question.questionType,
        question.options ? JSON.stringify({ options: question.options }) : null,
        question.correctAnswer,
        question.explanation,
        question.points ?? 10,
        orderIndex,
      ]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    question: Partial<{
      questionText: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      points: number;
    }>
  ): Promise<QuizQuestion> {
    const result = await query(
      `UPDATE quiz_questions 
       SET question_text = COALESCE($1, question_text),
           options = COALESCE($2, options),
           correct_answer = COALESCE($3, correct_answer),
           explanation = COALESCE($4, explanation),
           points = COALESCE($5, points),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [
        question.questionText,
        question.options ? JSON.stringify({ options: question.options }) : undefined,
        question.correctAnswer,
        question.explanation,
        question.points,
        id,
      ]
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM quiz_questions WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  private static async getNextOrderIndex(quizId: number): Promise<number> {
    const result = await query(
      'SELECT MAX(order_index) as max_order FROM quiz_questions WHERE quiz_id = $1',
      [quizId]
    );
    return (result.rows[0]?.max_order ?? -1) + 1;
  }
}
