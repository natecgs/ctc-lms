import { Router, Request, Response } from 'express';
import { CourseModel } from '../models/CourseModel.js';
import { ModuleModel, LessonModel, QuizModel, QuizQuestionModel } from '../models/ContentModel.js';
import { ApiResponse, Course } from '../types.js';
import { query } from '../db.js';

const router = Router();

// ============================================================================
// COURSE ENDPOINTS
// ============================================================================

// Get all published courses
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const courses = await CourseModel.findAll(limit, offset);

    const response: ApiResponse<Course[]> = {
      success: true,
      data: courses,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses',
    });
  }
});

// Get course by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.id);
    const course = await CourseModel.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    // Fetch course content
    const modules = await ModuleModel.findByCourse(courseId);
    const modulesWithContent = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await LessonModel.findByModule(mod.id);
        return { ...mod, lessons };
      })
    );

    // Build instructor object from course data (now included from JOIN in CourseModel.findById)
    const instructor = course.instructor_id ? {
      id: course.instructor_id,
      title: (course as any).instructor_title,
      bio: (course as any).instructor_bio,
      avatar_url: (course as any).instructor_avatar,
      rating: (course as any).instructor_rating,
      total_courses: (course as any).instructor_total_courses,
    } : null;

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...course,
        modules: modulesWithContent,
        instructor,
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course',
    });
  }
});

// Get course by UUID
router.get('/uuid/:uuid', async (req: Request, res: Response) => {
  try {
    const course = await CourseModel.findByUuid(req.params.uuid);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    const modules = await ModuleModel.findByCourse(course.id);
    const modulesWithContent = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await LessonModel.findByModule(mod.id);
        return { ...mod, lessons };
      })
    );

    // Build instructor object from course data (now included from JOIN in CourseModel.findByUuid)
    const instructor = course.instructor_id ? {
      id: course.instructor_id,
      title: (course as any).instructor_title,
      bio: (course as any).instructor_bio,
      avatar_url: (course as any).instructor_avatar,
      rating: (course as any).instructor_rating,
      total_courses: (course as any).instructor_total_courses,
    } : null;

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...course,
        modules: modulesWithContent,
        instructor,
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course',
    });
  }
});

// Search courses
router.get('/search/:query', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const courses = await CourseModel.search(req.params.query, limit);

    const response: ApiResponse<Course[]> = {
      success: true,
      data: courses,
    };
    res.json(response);
  } catch (error) {
    console.error('Error searching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search courses',
    });
  }
});

// Get courses by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const courses = await CourseModel.findByCategory(req.params.category, limit);

    const response: ApiResponse<Course[]> = {
      success: true,
      data: courses,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching courses by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses',
    });
  }
});

// Create new course (requires authentication)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { instructorId, ...courseData } = req.body;

    if (!instructorId) {
      return res.status(400).json({
        success: false,
        error: 'instructorId is required',
      });
    }

    if (!courseData.title) {
      return res.status(400).json({
        success: false,
        error: 'Course title is required',
      });
    }

    const course = await CourseModel.create(instructorId, courseData);

    const response: ApiResponse<Course> = {
      success: true,
      data: course,
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create course',
    });
  }
});

// Create module for a course
router.post('/:courseId/modules', async (req: Request, res: Response) => {
  try {
    const { title, description, orderIndex } = req.body;
    const courseId = parseInt(req.params.courseId);

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Module title is required',
      });
    }

    const module = await ModuleModel.create(courseId, title, description, orderIndex);

    const response: ApiResponse<any> = {
      success: true,
      data: module,
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create module',
    });
  }
});

// Create lesson for a module
router.post('/:courseId/modules/:moduleId/lessons', async (req: Request, res: Response) => {
  try {
    const { title, lessonType, content, duration, videoUrl, resources } = req.body;
    const moduleId = parseInt(req.params.moduleId);

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Lesson title is required',
      });
    }

    const lesson = await LessonModel.create(
      moduleId,
      title,
      lessonType || 'video',
      {
        content,
        duration,
        videoUrl,
        resources,
      }
    );

    const response: ApiResponse<any> = {
      success: true,
      data: lesson,
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lesson',
    });
  }
});

// ============================================================================
// LESSON ENDPOINTS
// ============================================================================

// Update a course
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.id);
    const { title, subtitle, description, category, level, price, image_url } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Course title is required',
      });
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    // Update course fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (level !== undefined) updateData.level = level;
    if (price !== undefined) updateData.price = price;
    if (image_url !== undefined) updateData.image_url = image_url;

    const updatedCourse = await CourseModel.update(courseId, updateData);

    // Fetch course content
    const modules = await ModuleModel.findByCourse(courseId);
    const modulesWithContent = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await LessonModel.findByModule(mod.id);
        return { ...mod, lessons };
      })
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...updatedCourse,
        modules: modulesWithContent,
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update course',
    });
  }
});

// Delete a course
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.id);

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    await CourseModel.delete(courseId);

    const response: ApiResponse<any> = {
      success: true,
      data: { id: courseId, message: 'Course deleted successfully' },
    };
    res.json(response);
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete course',
    });
  }
});

// Get lesson details
router.get('/:courseId/lessons/:lessonId', async (req: Request, res: Response) => {
  try {
    const lesson = await LessonModel.findById(parseInt(req.params.lessonId));

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found',
      });
    }

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lesson',
    });
  }
});

// Toggle featured status for a course
router.patch('/:id/featured', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.id);
    const { is_featured } = req.body;

    if (typeof is_featured !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'is_featured must be a boolean',
      });
    }

    // If setting this course as featured, unfeature other courses
    if (is_featured) {
      await query('UPDATE courses SET is_featured = FALSE WHERE is_featured = TRUE');
    }

    // Update this course
    const result = await query(
      'UPDATE courses SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_featured, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result.rows[0],
      message: `Course ${is_featured ? 'marked as featured' : 'removed from featured'}`,
    };
    res.json(response);
  } catch (error) {
    console.error('Error updating featured status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update featured status',
    });
  }
});

// Get featured course
router.get('/featured/current', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT c.*, 
              i.title as instructor_title, 
              i.avatar_url as instructor_avatar,
              i.bio as instructor_bio,
              i.rating as instructor_rating,
              i.total_courses as instructor_total_courses,
              i.id as instructor_id
       FROM courses c 
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.is_featured = TRUE AND c.is_published = TRUE
       LIMIT 1`
    );

    const course = result.rows[0];

    if (!course) {
      // Return first published course if no featured course exists
      const fallbackResult = await query(
        `SELECT c.*, 
                i.title as instructor_title, 
                i.avatar_url as instructor_avatar,
                i.bio as instructor_bio,
                i.rating as instructor_rating,
                i.total_courses as instructor_total_courses,
                i.id as instructor_id
         FROM courses c 
         LEFT JOIN instructors i ON c.instructor_id = i.id
         WHERE c.is_published = TRUE
         ORDER BY c.created_at DESC
         LIMIT 1`
      );
      
      if (fallbackResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No courses available',
        });
      }

      return res.json({
        success: true,
        data: fallbackResult.rows[0],
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error fetching featured course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured course',
    });
  }
});

export default router;
