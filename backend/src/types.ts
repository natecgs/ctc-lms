// User and Profile types
export interface User {
  id: number;
  auth_id: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  email_verified: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Profile {
  id: number;
  user_id: number;
  full_name: string | null;
  email?: string | null;
  phone: string | null;
  location: string | null;
  organization: string | null;
  bio: string | null;
  avatar_url: string | null;
  total_hours_learned: number;
  created_at: string;
  updated_at: string;
}

export interface Instructor {
  id: number;
  user_id: number;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  specializations: string[];
  rating: number;
  total_courses: number;
  created_at: string;
  updated_at: string;
}

// Course and related types
export interface Course {
  id: number;
  uuid: string;
  instructor_id: number;
  title: string;
  code: string | null;
  subtitle: string | null;
  description: string | null;
  category: string | null;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string | null;
  price: number;
  currency: string; // MWK, ZAR, ZWL, TZS, ZMW
  rating: number;
  enrolled_count: number;
  image_url: string | null;
  tags: string[];
  objectives: string[];
  requirements: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  uuid: string;
  course_id: number;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  uuid: string;
  module_id: number;
  title: string;
  content: string | null;
  lesson_type: 'video' | 'reading' | 'activity';
  duration: string | null;
  order_index: number;
  video_url: string | null;
  resources: string[];
  created_at: string;
  updated_at: string;
}

// Quiz types
export interface Quiz {
  id: number;
  uuid: string;
  course_id: number;
  module_id: number | null;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  is_exam: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: number;
  uuid: string;
  quiz_id: number;
  question_text: string;
  question_type: 'multiple-choice' | 'true-false' | 'short-answer';
  options: { options: string[] } | null;
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Enrollment and progress tracking types
export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  progress_percentage: number;
  certificate_earned: boolean;
  enrolled_at: string;
  last_accessed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompletedLesson {
  id: number;
  user_id: number;
  lesson_id: number;
  course_id: number;
  completed_at: string;
  created_at: string;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  quiz_id: number;
  course_id: number;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  time_spent_seconds: number | null;
  attempted_at: string;
  created_at: string;
}

export interface Certificate {
  id: number;
  uuid: string;
  user_id: number;
  course_id: number;
  certificate_number: string;
  issued_at: string;
  created_at: string;
}

// API Request/Response types
export interface CreateCourseRequest {
  title: string;
  code?: string;  // Unique course code
  subtitle?: string;
  description?: string;
  category?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  price?: number;
  currency?: string; // MWK, ZAR, ZWL, TZS, ZMW (defaults to MWK)
  image_url?: string;
  tags?: string[];
  objectives?: string[];
  requirements?: string[];
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  id: number;
}

export interface CreateEnrollmentRequest {
  user_id: number;
  course_id: number;
}

export interface CompleteLessonRequest {
  user_id: number;
  lesson_id: number;
  course_id: number;
}

export interface SubmitQuizRequest {
  user_id: number;
  quiz_id: number;
  course_id: number;
  answers: Record<string, string>;
  time_spent_seconds?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
