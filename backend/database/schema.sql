-- PostgreSQL Schema for CTC LMS
-- This file creates all tables needed for the Learning Management System

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  auth_id VARCHAR(255) UNIQUE NOT NULL,  -- From authentication provider
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),  -- NULL if using external auth
  role VARCHAR(50) NOT NULL DEFAULT 'student',  -- 'student', 'instructor', 'admin'
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT valid_role CHECK (role IN ('student', 'instructor', 'admin'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  location VARCHAR(255),
  organization VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,  -- Can store base64 encoded images or URLs
  total_hours_learned DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INSTRUCTORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS instructors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),  -- e.g., "Early Childhood Development Specialist"
  bio TEXT,
  avatar_url TEXT,  -- Can store base64 encoded images or URLs
  specializations TEXT[] DEFAULT '{}',  -- Array of specialization areas
  rating DECIMAL(3, 2) DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- COURSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,  -- For external references
  instructor_id INTEGER NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,
  category VARCHAR(100),
  level VARCHAR(50) NOT NULL,  -- 'Beginner', 'Intermediate', 'Advanced'
  duration VARCHAR(50),  -- e.g., "8 hours"
  price DECIMAL(10, 2) DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  enrolled_count INTEGER DEFAULT 0,
  image_url TEXT,  -- Can store base64 encoded images or URLs
  tags TEXT[] DEFAULT '{}',  -- Array of tags
  objectives TEXT[] DEFAULT '{}',  -- Array of learning objectives
  requirements TEXT[] DEFAULT '{}',  -- Array of course requirements
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_level CHECK (level IN ('Beginner', 'Intermediate', 'Advanced'))
);

CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_uuid ON courses(uuid);

-- ============================================================================
-- MODULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,  -- For ordering modules within a course
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_uuid ON modules(uuid);
CREATE UNIQUE INDEX idx_modules_course_order ON modules(course_id, order_index);

-- ============================================================================
-- LESSONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  lesson_type VARCHAR(50) NOT NULL,  -- 'video', 'reading', 'activity'
  duration VARCHAR(50),  -- e.g., "25 min"
  order_index INTEGER NOT NULL,
  video_url VARCHAR(500),
  resources TEXT[] DEFAULT '{}',  -- Array of resource URLs
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_lesson_type CHECK (lesson_type IN ('video', 'reading', 'activity'))
);

CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_uuid ON lessons(uuid);
CREATE UNIQUE INDEX idx_lessons_module_order ON lessons(module_id, order_index);

-- ============================================================================
-- QUIZZES
-- ============================================================================

CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,  -- NULL means no time limit
  is_exam BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_quizzes_module_id ON quizzes(module_id);
CREATE INDEX idx_quizzes_uuid ON quizzes(uuid);

-- ============================================================================
-- QUIZ QUESTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,  -- 'multiple-choice', 'true-false', 'short-answer'
  options JSONB,  -- For multiple choice and true-false: {"options": ["Option 1", "Option 2"]}
  correct_answer VARCHAR(500) NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 10,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_question_type CHECK (question_type IN ('multiple-choice', 'true-false', 'short-answer'))
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_uuid ON quiz_questions(uuid);
CREATE UNIQUE INDEX idx_quiz_questions_quiz_order ON quiz_questions(quiz_id, order_index);

-- ============================================================================
-- STUDENT ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  certificate_earned BOOLEAN DEFAULT FALSE,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id),
  CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);

-- ============================================================================
-- COMPLETED LESSONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS completed_lessons (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_completed_lessons_user_id ON completed_lessons(user_id);
CREATE INDEX idx_completed_lessons_lesson_id ON completed_lessons(lesson_id);
CREATE INDEX idx_completed_lessons_course_id ON completed_lessons(course_id);
CREATE INDEX idx_completed_lessons_user_course ON completed_lessons(user_id, course_id);

-- ============================================================================
-- QUIZ ATTEMPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,  -- {"question_id": "user_answer"}
  time_spent_seconds INTEGER,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_course_id ON quiz_attempts(course_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);

-- ============================================================================
-- CERTIFICATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_uuid ON certificates(uuid);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
