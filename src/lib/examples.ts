/**
 * EXAMPLE: How to use the PostgreSQL Backend APIs in the Frontend
 * 
 * This file demonstrates various use cases for interacting with the backend
 * database through the API client.
 */

import { coursesApi, enrollmentsApi, usersApi, quizzesApi } from '@/lib/api';
import type { Course, Enrollment } from '@/types/api';

// ============================================================================
// COURSES - Fetching Course Data
// ============================================================================

/**
 * Example: Fetch all published courses
 */
export async function fetchAllCourses() {
  try {
    const response = await coursesApi.getAll(100, 0);
    if (response.success) {
      console.log('Courses:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Failed to fetch courses:', error);
  }
}

/**
 * Example: Get detailed course with modules and lessons
 */
export async function fetchCourseDetails(courseId: number) {
  try {
    const response = await coursesApi.getById(courseId);
    if (response.success) {
      const course = response.data;
      console.log('Course:', course.title);
      console.log('Modules:', course.modules);
      console.log('Total lessons:', 
        course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
      );
      return course;
    }
  } catch (error) {
    console.error('Failed to fetch course:', error);
  }
}

/**
 * Example: Search courses
 */
export async function searchCourses(query: string) {
  try {
    const response = await coursesApi.search(query);
    if (response.success) {
      return response.data;
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
}

/**
 * Example: Get courses by category
 */
export async function getCoursesByCategory(category: string) {
  try {
    const response = await coursesApi.getByCategory(category);
    if (response.success) {
      return response.data;
    }
  } catch (error) {
    console.error('Failed to fetch courses:', error);
  }
}

// ============================================================================
// ENROLLMENTS - Course Registration & Progress
// ============================================================================

/**
 * Example: Enroll user in a course
 */
export async function enrollInCourse(userId: number, courseId: number) {
  try {
    const response = await enrollmentsApi.enroll(userId, courseId);
    if (response.success) {
      console.log('Successfully enrolled!');
      return response.data;
    }
  } catch (error) {
    console.error('Enrollment failed:', error);
  }
}

/**
 * Example: Check if user is already enrolled
 */
export async function checkEnrollment(userId: number, courseId: number) {
  try {
    const response = await enrollmentsApi.checkEnrollment(userId, courseId);
    if (response.success) {
      const { isEnrolled, enrollment } = response.data;
      console.log('Is enrolled:', isEnrolled);
      console.log('Progress:', enrollment?.progress_percentage);
      return isEnrolled;
    }
  } catch (error) {
    console.error('Check failed:', error);
  }
}

/**
 * Example: Get all user enrollments
 */
export async function getUserEnrollments(userId: number) {
  try {
    const response = await enrollmentsApi.getUserEnrollments(userId);
    if (response.success) {
      const enrollments = response.data;
      console.log('User enrolled in', enrollments.length, 'courses');
      enrollments.forEach((e: any) => {
        console.log(`${e.course?.title} - ${e.progress_percentage}% complete`);
      });
      return enrollments;
    }
  } catch (error) {
    console.error('Failed to fetch enrollments:', error);
  }
}

// ============================================================================
// LESSONS - Completing Lessons & Tracking Progress
// ============================================================================

/**
 * Example: Mark a lesson as complete
 */
export async function completeLessonExample(
  userId: number,
  lessonId: number,
  courseId: number
) {
  try {
    const response = await enrollmentsApi.completeLesson(userId, lessonId, courseId);
    if (response.success) {
      const { progress, certificateEarned } = response.data;
      console.log(`Lesson completed! Progress: ${progress}%`);
      if (certificateEarned) {
        console.log('🎉 Course completed! Certificate issued!');
      }
      return response.data;
    }
  } catch (error) {
    console.error('Failed to complete lesson:', error);
  }
}

/**
 * Example: Get completed lessons for a course
 */
export async function getCompletedLessons(userId: number, courseId: number) {
  try {
    const response = await enrollmentsApi.getCompletedLessons(userId, courseId);
    if (response.success) {
      const { completedLessons, progress, totalLessons } = response.data;
      console.log(`Completed ${completedLessons.length} of ${totalLessons} lessons`);
      console.log(`Overall progress: ${progress}%`);
      return response.data;
    }
  } catch (error) {
    console.error('Failed to fetch completed lessons:', error);
  }
}

// ============================================================================
// QUIZZES - Getting & Submitting Quizzes
// ============================================================================

/**
 * Example: Get all quizzes for a course
 */
export async function getCourseQuizzes(courseId: number) {
  try {
    const response = await quizzesApi.getCourseLessons(courseId);
    if (response.success) {
      const quizzes = response.data;
      console.log('Quizzes for this course:', quizzes.length);
      quizzes.forEach((q: any) => {
        console.log(`${q.title} - ${q.questions.length} questions`);
      });
      return quizzes;
    }
  } catch (error) {
    console.error('Failed to fetch quizzes:', error);
  }
}

/**
 * Example: Get detailed quiz with all questions
 */
export async function getQuizDetails(quizId: number) {
  try {
    const response = await quizzesApi.getById(quizId);
    if (response.success) {
      const quiz = response.data;
      console.log('Quiz:', quiz.title);
      console.log('Passing score:', quiz.passing_score);
      console.log('Time limit:', quiz.time_limit_minutes, 'minutes');
      console.log('Questions:', quiz.questions.length);
      return quiz;
    }
  } catch (error) {
    console.error('Failed to fetch quiz:', error);
  }
}

/**
 * Example: Submit quiz attempt
 */
export async function submitQuizAttempt(
  userId: number,
  quizId: number,
  courseId: number,
  answers: Record<string, string>,
  calculatedScore: number
) {
  try {
    const response = await enrollmentsApi.submitQuiz(
      userId,
      quizId,
      courseId,
      calculatedScore,
      answers,
      300 // 5 minutes spent
    );

    if (response.success) {
      const { attempt, passed } = response.data;
      console.log('Quiz submitted!');
      console.log(`Score: ${attempt.score}%`);
      console.log(`Result: ${passed ? 'PASSED ✓' : 'FAILED ✗'}`);
      return response.data;
    }
  } catch (error) {
    console.error('Failed to submit quiz:', error);
  }
}

/**
 * Example: Get quiz attempt history
 */
export async function getQuizAttempts(userId: number, courseId?: number) {
  try {
    const response = await enrollmentsApi.getQuizAttempts(userId, courseId);
    if (response.success) {
      const attempts = response.data;
      console.log('Quiz attempts:', attempts.length);
      attempts.forEach((attempt: any) => {
        console.log(`Quiz ${attempt.quiz_id}: ${attempt.score}% on ${attempt.attempted_at}`);
      });
      return attempts;
    }
  } catch (error) {
    console.error('Failed to fetch attempts:', error);
  }
}

// ============================================================================
// CERTIFICATES - Certificate Management
// ============================================================================

/**
 * Example: Get user certificates
 */
export async function getUserCertificates(userId: number) {
  try {
    const response = await enrollmentsApi.getCertificates(userId);
    if (response.success) {
      const certificates = response.data;
      console.log('Certificates earned:', certificates.length);
      certificates.forEach((cert: any) => {
        console.log(`${cert.course?.title} - Issued: ${cert.issued_at}`);
      });
      return certificates;
    }
  } catch (error) {
    console.error('Failed to fetch certificates:', error);
  }
}

/**
 * Example: Verify certificate authenticity
 */
export async function verifyCertificate(certificateUuid: string) {
  try {
    const response = await enrollmentsApi.verifyCertificate(certificateUuid);
    if (response.success) {
      const cert = response.data;
      if (cert) {
        console.log(`Certificate verified for ${cert.student_name}`);
        console.log(`Course: ${cert.course_title}`);
        console.log(`Certificate #: ${cert.certificate_number}`);
        return cert;
      } else {
        console.log('Certificate not found');
      }
    }
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

// ============================================================================
// USERS & PROFILES - User Management
// ============================================================================

/**
 * Example: Create or get user
 */
export async function getOrCreateUser(
  authId: string,
  email: string,
  role: 'student' | 'instructor' = 'student'
) {
  try {
    const response = await usersApi.getOrCreate(authId, email, role);
    if (response.success) {
      console.log('User:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Failed to get/create user:', error);
  }
}

/**
 * Example: Get user profile
 */
export async function getUserProfile(userId: number) {
  try {
    const response = await usersApi.getProfile(userId);
    if (response.success) {
      const profile = response.data;
      console.log('Profile:', profile.full_name);
      console.log('Total hours learned:', profile.total_hours_learned);
      return profile;
    }
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
}

/**
 * Example: Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updates: {
    full_name?: string;
    phone?: string;
    location?: string;
    bio?: string;
    avatar_url?: string;
  }
) {
  try {
    const response = await usersApi.updateProfile(userId, updates);
    if (response.success) {
      console.log('Profile updated!');
      return response.data;
    }
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
}

// ============================================================================
// COMPLETE WORKFLOW EXAMPLE
// ============================================================================

/**
 * Complete workflow: User signs up, enrolls, completes lessons, takes quiz
 */
export async function completeWorkflow() {
  console.log('=== Complete LMS Workflow ===\n');

  // Step 1: Create/get user
  console.log('1. Creating/getting user...');
  const user = await getOrCreateUser('auth-123', 'student@example.com', 'student');
  const userId = user.id;

  // Step 2: Get courses
  console.log('\n2. Fetching courses...');
  const courses = await fetchAllCourses();

  // Step 3: Enroll in a course
  if (courses && courses.length > 0) {
    const courseId = courses[0].id;
    console.log(`\n3. Enrolling in course: ${courses[0].title}`);
    await enrollInCourse(userId, courseId);

    // Step 4: Get course details
    console.log('\n4. Getting course details...');
    const courseDetails = await fetchCourseDetails(courseId);

    // Step 5: Complete a lesson
    if (courseDetails && courseDetails.modules.length > 0) {
      const lessonId = courseDetails.modules[0].lessons[0].id;
      console.log(`\n5. Completing lesson: ${courseDetails.modules[0].lessons[0].title}`);
      await completeLessonExample(userId, lessonId, courseId);

      // Step 6: Check progress
      console.log('\n6. Checking progress...');
      await getCompletedLessons(userId, courseId);

      // Step 7: Get quizzes
      console.log('\n7. Getting quizzes...');
      const quizzes = await getCourseQuizzes(courseId);

      // Step 8: Take a quiz
      if (quizzes && quizzes.length > 0) {
        const quizId = quizzes[0].id;
        console.log(`\n8. Taking quiz: ${quizzes[0].title}`);

        // Simulate answering questions
        const answers: Record<string, string> = {};
        quizzes[0].questions.forEach((q: any) => {
          answers[q.id] = q.correctAnswer; // For demo, use correct answers
        });

        await submitQuizAttempt(userId, quizId, courseId, answers, 100);
      }

      // Step 9: Get certificates
      console.log('\n9. Checking certificates...');
      await getUserCertificates(userId);
    }
  }

  console.log('\n=== Workflow Complete ===');
}

// ============================================================================
// ERROR HANDLING EXAMPLE
// ============================================================================

/**
 * Example: Robust error handling
 */
export async function robustFetchExample(courseId: number) {
  try {
    const response = await coursesApi.getById(courseId);

    if (!response.success) {
      console.error('API Error:', response.error);
      return null;
    }

    if (!response.data) {
      console.error('No data returned');
      return null;
    }

    return response.data;
  } catch (networkError) {
    console.error('Network Error:', networkError);
    // Handle offline, timeout, etc.
    return null;
  }
}

export default {
  fetchAllCourses,
  fetchCourseDetails,
  searchCourses,
  getCoursesByCategory,
  enrollInCourse,
  checkEnrollment,
  getUserEnrollments,
  completeLessonExample,
  getCompletedLessons,
  getCourseQuizzes,
  getQuizDetails,
  submitQuizAttempt,
  getQuizAttempts,
  getUserCertificates,
  verifyCertificate,
  getOrCreateUser,
  getUserProfile,
  updateUserProfile,
  completeWorkflow,
  robustFetchExample,
};
