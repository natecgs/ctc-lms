import { Router, Request, Response } from 'express';
import {
  EnrollmentModel,
  CompletedLessonModel,
  QuizAttemptModel,
  CertificateModel,
} from '../models/UserModel';
import { CourseModel } from '../models/CourseModel.js';
import { LessonModel } from '../models/ContentModel.js';
import { ApiResponse } from '../types.js';

const router = Router();

// ============================================================================
// ENROLLMENT ENDPOINTS
// ============================================================================

// Get user enrollments
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const enrollments = await EnrollmentModel.findUserEnrollments(userId);

    // Enrich with course details
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await CourseModel.findById(enrollment.course_id);
        return { ...enrollment, course };
      })
    );

    res.json({
      success: true,
      data: enrichedEnrollments,
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enrollments',
    });
  }
});

// Check if user is enrolled in a course
router.get(
  '/user/:userId/course/:courseId',
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const courseId = parseInt(req.params.courseId);

      const enrollment = await EnrollmentModel.findByUserAndCourse(userId, courseId);

      res.json({
        success: true,
        data: {
          isEnrolled: !! enrollment,
          enrollment: enrollment || null,
        },
      });
    } catch (error) {
      console.error('Error checking enrollment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check enrollment',
      });
    }
  }
);

// Enroll user in a course
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        error: 'userId and courseId are required',
      });
    }

    // Check if already enrolled
    const existing = await EnrollmentModel.findByUserAndCourse(userId, courseId);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'User is already enrolled in this course',
      });
    }

    // Create enrollment
    const enrollment = await EnrollmentModel.create(userId, courseId);

    // Increment course enrollment count
    await CourseModel.incrementEnrolledCount(courseId);

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Successfully enrolled in course',
    });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enroll in course',
    });
  }
});

// ============================================================================
// LESSON COMPLETION ENDPOINTS
// ============================================================================

// Complete a lesson
router.post('/lessons/complete', async (req: Request, res: Response) => {
  try {
    const { userId, lessonId, courseId } = req.body;

    if (!userId || !lessonId || !courseId) {
      return res.status(400).json({
        success: false,
        error: 'userId, lessonId, and courseId are required',
      });
    }

    // Mark lesson as completed
    const completedLesson = await CompletedLessonModel.create(userId, lessonId, courseId);

    // Calculate course progress
    const lessons = await LessonModel.findByCourse(courseId);
    const completedCount = await CompletedLessonModel.getCompletedCount(userId, courseId);
    const totalLessons = lessons.length;
    const progressPercentage = Math.round((completedCount / totalLessons) * 100);

    // Update enrollment progress
    await EnrollmentModel.updateProgress(userId, courseId, progressPercentage);

    // Check if course is completed and issue certificate
    if (progressPercentage >= 100) {
      await CertificateModel.create(userId, courseId);
    }

    res.json({
      success: true,
      data: {
        completedLesson,
        progress: progressPercentage,
        certificateEarned: progressPercentage >= 100,
      },
      message: 'Lesson marked as completed',
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete lesson',
    });
  }
});

// Get completed lessons for a user in a course
router.get('/:userId/completed/:courseId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const courseId = parseInt(req.params.courseId);

    const completedLessons = await CompletedLessonModel.findUserLessons(userId, courseId);
    const completedCount = completedLessons.length;
    const lessons = await LessonModel.findByCourse(courseId);
    const totalLessons = lessons.length;

    res.json({
      success: true,
      data: {
        completedLessons: completedLessons.map((cl) => cl.lesson_id),
        completedCount,
        totalLessons,
        progress: Math.round((completedCount / totalLessons) * 100),
      },
    });
  } catch (error) {
    console.error('Error fetching completed lessons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch completed lessons',
    });
  }
});

// ============================================================================
// QUIZ ATTEMPT ENDPOINTS
// ============================================================================

// Submit quiz attempt
router.post('/quiz/submit', async (req: Request, res: Response) => {
  try {
    const { userId, quizId, courseId, answers, timeSpentSeconds } = req.body;

    if (!userId || !quizId || !courseId || !answers) {
      return res.status(400).json({
        success: false,
        error: 'userId, quizId, courseId, and answers are required',
      });
    }

    // Calculate score based on answers (simplified - actual validation would check correct answers)
    // For now, this is handled by the frontend
    const score = parseInt(req.body.score);
    const passed = score >= 70; // Default passing score

    // Create quiz attempt
    const attempt = await QuizAttemptModel.create(
      userId,
      quizId,
      courseId,
      score,
      passed,
      answers,
      timeSpentSeconds
    );

    res.status(201).json({
      success: true,
      data: {
        attempt,
        passed,
      },
      message: 'Quiz attempt recorded',
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz',
    });
  }
});

// Get user quiz attempts
router.get('/quiz/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;

    const attempts = await QuizAttemptModel.findUserAttempts(userId, courseId);

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz attempts',
    });
  }
});

// ============================================================================
// CERTIFICATE ENDPOINTS
// ============================================================================

// Get user certificates
router.get('/certificates/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const certificates = await CertificateModel.findUserCertificates(userId);

    // Enrich with course info
    const enrichedCerts = await Promise.all(
      certificates.map(async (cert) => {
        const course = await CourseModel.findById(cert.course_id);
        return { ...cert, course };
      })
    );

    res.json({
      success: true,
      data: enrichedCerts,
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificates',
    });
  }
});

// Verify certificate
router.get('/certificate/verify/:uuid', async (req: Request, res: Response) => {
  try {
    const certificate = await CertificateModel.verifyAndGet(req.params.uuid);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found',
      });
    }

    res.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify certificate',
    });
  }
});

export default router;
