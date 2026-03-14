/**
 * API Client for LMS Backend
 * Provides typed methods for all backend API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

/**
 * Make API request with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    );
    url += `?${queryString}`;
  }

  // Set default headers
  fetchOptions.headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  console.log(`[API] ${fetchOptions.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response body is not JSON, use the status message
        errorMessage = response.statusText || errorMessage;
      }
      console.error(`[API Error] ${endpoint}: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`[API Success] ${endpoint}:`, data);
    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`API Error [${endpoint}]:`, errorMsg);
    throw new Error(errorMsg);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform backend course to frontend format
 */
function transformCourse(backendCourse: any) {
  // Handle both nested instructor object format and flat instructor field format
  const instructorData = backendCourse.instructor || {
    title: backendCourse.instructor_title,
    avatar_url: backendCourse.instructor_avatar,
    bio: backendCourse.instructor_bio,
    rating: backendCourse.instructor_rating,
    total_courses: backendCourse.instructor_total_courses,
  };

  return {
    id: String(backendCourse.id),
    title: backendCourse.title || '',
    subtitle: backendCourse.subtitle || '',
    description: backendCourse.description || '',
    category: backendCourse.category || '',
    level: backendCourse.level || 'Beginner',
    duration: backendCourse.duration || '',
    code: backendCourse.code || '',
    lessons: backendCourse.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0) || 0,
    modules: backendCourse.modules || [],
    instructor: instructorData?.title || 'Course Instructor',
    instructorTitle: instructorData?.title || 'Instructor',
    instructorAvatar: instructorData?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    instructorBio: instructorData?.bio || '',
    instructorRating: instructorData?.rating || 4.5,
    instructorTotalCourses: instructorData?.total_courses || 0,
    instructorId: backendCourse.instructor_id || null,
    image: backendCourse.image_url || 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop',
    price: backendCourse.price || 0,
    rating: backendCourse.rating || 4.5,
    enrolled: backendCourse.enrolled_count || 0,
    objectives: backendCourse.objectives || [],
    requirements: backendCourse.requirements || [],
    tags: backendCourse.tags || [],
  };
}

// ============================================================================
// COURSES API
// ============================================================================

export const coursesApi = {
  /**
   * Get all published courses
   */
  async getAll(limit: number = 100, offset: number = 0) {
    const response = await apiCall<{ success: boolean; data: any }>('/courses', {
      params: { limit, offset },
    });
    return (response.data || []).map(transformCourse);
  },

  /**
   * Get course by ID
   */
  async getById(id: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/courses/${id}`);
    return transformCourse(response.data);
  },

  /**
   * Get course by UUID
   */
  async getByUuid(uuid: string) {
    const response = await apiCall<{ success: boolean; data: any }>(`/courses/uuid/${uuid}`);
    return transformCourse(response.data);
  },

  /**
   * Search courses
   */
  async search(query: string, limit: number = 50) {
    const response = await apiCall<{ success: boolean; data: any }>(`/courses/search/${encodeURIComponent(query)}`, {
      params: { limit },
    });
    return (response.data || []).map(transformCourse);
  },

  /**
   * Get courses by category
   */
  async getByCategory(category: string, limit: number = 100) {
    const response = await apiCall<{ success: boolean; data: any }>(`/courses/category/${encodeURIComponent(category)}`, {
      params: { limit },
    });
    return (response.data || []).map(transformCourse);
  },

  /**
   * Get lesson details
   */
  async getLesson(courseId: number, lessonId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/courses/${courseId}/lessons/${lessonId}`);
    return response.data;
  },

  /**
   * Create a new course
   */
  async create(instructorId: number, courseData: any) {
    const response = await apiCall<{ success: boolean; data: any }>('/courses', {
      method: 'POST',
      body: JSON.stringify({
        instructorId,
        ...courseData,
      }),
    });
    return transformCourse(response.data);
  },

  /**
   * Create a module for a course
   */
  async createModule(courseId: number, title: string, description?: string, orderIndex?: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        orderIndex,
      }),
    });
    return response.data;
  },

  /**
   * Create a lesson for a module
   */
  async createLesson(
    courseId: number,
    moduleId: number,
    title: string,
    lessonType: 'video' | 'reading' | 'activity' = 'video',
    options?: {
      content?: string;
      duration?: string;
      videoUrl?: string;
      resources?: string[];
    }
  ) {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/courses/${courseId}/modules/${moduleId}/lessons`,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          lessonType,
          ...options,
        }),
      }
    );
    return response.data;
  },

  /**
   * Delete a module and all its lessons
   */
  async deleteModule(courseId: number, moduleId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(
      `/courses/${courseId}/modules/${moduleId}`,
      {
        method: 'DELETE',
      }
    );
    return response.data;
  },

  /**
   * Update a course
   */
  async update(courseId: number, courseData: any) {
    const response = await apiCall<{ success: boolean; data: any }>(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
    return transformCourse(response.data);
  },

  /**
   * Delete a course
   */
  async delete(courseId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/courses/${courseId}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  /**
   * Toggle featured status for a course
   */
  async setFeatured(courseId: number, isFeatured: boolean) {
    const response = await apiCall<{ success: boolean; data: any }>(`/courses/${courseId}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({ is_featured: isFeatured }),
    });
    return response.data;
  },

  /**
   * Get the current featured course (or first course if none featured)
   */
  async getFeatured() {
    const response = await apiCall<{ success: boolean; data: any }>('/courses/featured/current');
    return response.data ? transformCourse(response.data) : null;
  },
};

// ============================================================================
// QUIZZES API
// ============================================================================

export const quizzesApi = {
  /**
   * Get all quizzes for a course
   */
  async getCourseLessons(courseId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/quizzes/course/${courseId}`);
    return response.data;
  },

  /**
   * Get quiz by ID with questions
   */
  async getById(id: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/quizzes/${id}`);
    return response.data;
  },

  /**
   * Get quiz by UUID
   */
  async getByUuid(uuid: string) {
    const response = await apiCall<{ success: boolean; data: any }>(`/quizzes/uuid/${uuid}`);
    return response.data;
  },

  /**
   * Create a new quiz
   */
  async create(courseId: number, quizData: any) {
    const response = await apiCall<{ success: boolean; data: any }>('/quizzes', {
      method: 'POST',
      body: JSON.stringify({
        courseId,
        ...quizData,
      }),
    });
    return response.data;
  },

  /**
   * Update an existing quiz
   */
  async update(quizId: number, quizData: any) {
    const response = await apiCall<{ success: boolean; data: any }>(`/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(quizData),
    });
    return response.data;
  },

  /**
   * Delete a quiz
   */
  async delete(quizId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/quizzes/${quizId}`, {
      method: 'DELETE',
    });
    return response.data;
  },
};

// ============================================================================
// ENROLLMENTS API
// ============================================================================

export const enrollmentsApi = {
  /**
   * Get user enrollments
   */
  async getUserEnrollments(userId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/enrollments/user/${userId}`);
    return response.data;
  },

  /**
   * Check if user is enrolled in a course
   */
  async checkEnrollment(userId: number, courseId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/enrollments/user/${userId}/course/${courseId}`);
    return response.data;
  },

  /**
   * Enroll user in a course
   */
  async enroll(userId: number, courseId: number) {
    const response = await apiCall<{ success: boolean; data: any }>('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
    return response.data;
  },

  /**
   * Complete a lesson
   */
  async completeLesson(userId: number, lessonId: number, courseId: number) {
    const response = await apiCall<{ success: boolean; data: any }>('/enrollments/lessons/complete', {
      method: 'POST',
      body: JSON.stringify({ userId, lessonId, courseId }),
    });
    return response.data;
  },

  /**
   * Get completed lessons for a user in a course
   */
  async getCompletedLessons(userId: number, courseId?: number) {
    if (courseId) {
      const response = await apiCall<{ success: boolean; data: any }>(`/enrollments/${userId}/completed/${courseId}`);
      return response.data;
    }
    // Handle case where we get all completed lessons
    const response = await apiCall<{ success: boolean; data: any }>(`/enrollments/${userId}/completed`);
    return response.data;
  },

  /**
   * Submit quiz attempt
   */
  async submitQuiz(
    userId: number,
    quizId: number,
    courseId: number,
    score: number,
    answers: Record<string, string>,
    timeSpentSeconds?: number
  ) {
    const response = await apiCall<{ success: boolean; data: any }>('/enrollments/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        quizId,
        courseId,
        score,
        answers,
        timeSpentSeconds,
      }),
    });
    return response.data;
  },

  /**
   * Get user quiz attempts
   */
  async getQuizAttempts(userId: number, courseId?: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/enrollments/quiz/${userId}`, {
      params: courseId ? { courseId } : {},
    });
    return response.data;
  },

  /**
   * Get user certificates
   */
  async getCertificates(userId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/enrollments/certificates/${userId}`);
    return response.data;
  },

  /**
   * Verify certificate
   */
  async verifyCertificate(uuid: string) {
    const response = await apiCall<{ success: boolean; data: any }>(`/enrollments/certificate/verify/${uuid}`);
    return response.data;
  },
};

// ============================================================================
// USERS API
// ============================================================================

export const usersApi = {
  /**
   * Get or create user
   */
  async getOrCreate(authId: string, email: string, role?: 'student' | 'instructor' | 'admin') {
    const response = await apiCall<{ success: boolean; data: any }>('/users/get-or-create', {
      method: 'POST',
      body: JSON.stringify({ authId, email, role }),
    });
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getById(id: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/users/${id}`);
    return response.data;
  },

  /**
   * Get user profile
   */
  async getProfile(userId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/users/${userId}/profile`);
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: number, profile: Record<string, any>) {
    const response = await apiCall<{ success: boolean; data: any }>(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    return response.data;
  },

  /**
   * Get instructor info
   */
  async getInstructor(userId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/users/${userId}/instructor`);
    return response.data;
  },

  /**
   * Get all instructors
   */
  async getInstructors() {
    const response = await apiCall<{ success: boolean; data: any }>(`/users/instructors/list`);
    return response.data;
  },

  /**
   * Create new instructor
   */
  async createInstructor(instructor: { email: string; title: string; bio?: string; avatar_url?: string; specializations?: string[] }) {
    const response = await apiCall<{ success: boolean; data: any }>(`/users/instructors`, {
      method: 'POST',
      body: JSON.stringify(instructor),
    });
    return response.data;
  },

  /**
   * Update instructor profile
   */
  async updateInstructor(userId: number, instructor: Record<string, any>) {
    const response = await apiCall<{ success: boolean; data: any }>(`/users/${userId}/instructor`, {
      method: 'PUT',
      body: JSON.stringify(instructor),
    });
    return response.data;
  },

  /**
   * Get instructor stats (courses, students, rating, revenue)
   */
  async getInstructorStats(userId: number) {
    const response = await apiCall<{ success: boolean; data: any }>(`/users/${userId}/stats`);
    return response.data;
  },

  /**
   * Update user's preferred currency
   */
  async updateCurrencyPreference(userId: number, currencyCode: string) {
    const response = await apiCall<{ success: boolean; data: any }>(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify({ preferred_currency: currencyCode }),
    });
    return response.data;
  },
};

// ============================================================================
// CURRENCIES API
// ============================================================================

export const currenciesApi = {
  /**
   * Get all active currencies
   */
  async getAll() {
    const response = await apiCall<{ success: boolean; data: any; count: number }>('/currencies', {
      params: { active_only: 'true' },
    });
    return response.data;
  },

  /**
   * Get currency by code
   */
  async getByCode(code: string) {
    const response = await apiCall<{ success: boolean; data: any }>(`/currencies/${code}`);
    return response.data;
  },

  /**
   * Create new currency (Admin only)
   */
  async create(currencyData: { code: string; name: string; symbol: string; country?: string; exchange_rate?: number }) {
    const response = await apiCall<{ success: boolean; data: any }>('/currencies', {
      method: 'POST',
      body: JSON.stringify(currencyData),
    });
    return response.data;
  },

  /**
   * Update currency (Admin only)
   */
  async update(code: string, updates: Record<string, any>) {
    const response = await apiCall<{ success: boolean; data: any }>(`/currencies/${code}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  },

  /**
   * Deactivate currency (Admin only, soft delete)
   */
  async delete(code: string) {
    const response = await apiCall<{ success: boolean; data: any }>(`/currencies/${code}`, {
      method: 'DELETE',
    });
    return response.data;
  },
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiCall('/health' as any);
    return response.status === 'ok';
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

export default {
  coursesApi,
  quizzesApi,
  enrollmentsApi,
  usersApi,
  checkApiHealth,
};
