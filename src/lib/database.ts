import { usersApi, enrollmentsApi } from './api';

// ─── Profile ───────────────────────────────────────────────────────────────────

export interface DBProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  role: string;
  phone: string;
  location: string;
  organization: string;
  bio: string;
  total_hours_learned: number;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<DBProfile | null> {
  try {
    const profile = await usersApi.getProfile(userId);
    return profile;
  } catch (error) {
    console.error('getProfile error:', error);
    return null;
  }
}

export async function upsertProfile(profile: Partial<DBProfile> & { id: string }) {
  try {
    const data = await usersApi.updateProfile(profile.id, {
      full_name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
    });
    return { data, error: null };
  } catch (error) {
    console.error('upsertProfile error:', error);
    return { data: null, error };
  }
}

export async function updateProfile(userId: string, updates: Partial<DBProfile>) {
  try {
    const data = await usersApi.updateProfile(userId, updates);
    return { data, error: null };
  } catch (error) {
    console.error('updateProfile error:', error);
    return { data: null, error };
  }
}

// ─── Enrollments ───────────────────────────────────────────────────────────────

export interface DBEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  certificate_earned: boolean;
  enrolled_at: string;
  last_accessed_at: string;
}

export async function getEnrollments(userId: string): Promise<DBEnrollment[]> {
  try {
    const enrollments = await enrollmentsApi.getUserEnrollments(userId);
    return enrollments.map((e: any) => ({
      id: e.id?.toString() || '',
      user_id: userId,
      course_id: e.course_id?.toString() || '',
      progress: e.progress || 0,
      certificate_earned: e.certificate_earned || false,
      enrolled_at: e.enrolled_at || '',
      last_accessed_at: e.last_accessed_at || '',
    }));
  } catch (error) {
    console.error('getEnrollments error:', error);
    return [];
  }
}

export async function enrollInCourseDB(userId: string, courseId: string) {
  try {
    const data = await enrollmentsApi.enroll(userId, parseInt(courseId));
    return { data, error: null };
  } catch (error) {
    console.error('enrollInCourse error:', error);
    return { data: null, error };
  }
}

export async function updateEnrollmentProgress(userId: string, courseId: string, progress: number, certificateEarned: boolean) {
  try {
    // The API updates progress internally, so we just call completeLesson
    // This will be handled through completeLessonDB
    return { data: null, error: null };
  } catch (error) {
    console.error('updateEnrollmentProgress error:', error);
    return { data: null, error };
  }
}

// ─── Completed Lessons ─────────────────────────────────────────────────────────

export interface DBCompletedLesson {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  completed_at: string;
}

export async function getCompletedLessons(userId: string, courseId?: string): Promise<DBCompletedLesson[]> {
  try {
    const completed = await enrollmentsApi.getCompletedLessons(userId);
    if (courseId) {
      return completed.filter(c => c.course_id.toString() === courseId);
    }
    return completed;
  } catch (error) {
    console.error('getCompletedLessons error:', error);
    return [];
  }
}

export async function completeLessonDB(userId: string, courseId: string, lessonId: string) {
  try {
    const result = await enrollmentsApi.completeLesson(userId, lessonId, parseInt(courseId));
    
    // The API returns progress and certificate_earned
    const progress = result.progress || 0;
    const certificateEarned = result.certificate_earned || false;
    
    return { progress, certificateEarned };
  } catch (error) {
    console.error('completeLesson error:', error);
    return { progress: 0, certificateEarned: false };
  }
}

// ─── Quiz Attempts ─────────────────────────────────────────────────────────────

export interface DBQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  course_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  attempted_at: string;
}

export async function getQuizAttempts(userId: string, courseId?: string): Promise<DBQuizAttempt[]> {
  try {
    const attempts = await enrollmentsApi.getQuizAttempts(userId);
    let filtered = attempts.map((a: any) => ({
      id: a.id?.toString() || '',
      user_id: userId,
      quiz_id: a.quiz_id?.toString() || '',
      course_id: a.course_id?.toString() || '',
      score: a.score || 0,
      passed: a.score >= 60,
      answers: a.answers || {},
      attempted_at: a.attempted_at || '',
    }));
    
    if (courseId) {
      filtered = filtered.filter(a => a.course_id === courseId);
    }
    return filtered;
  } catch (error) {
    console.error('getQuizAttempts error:', error);
    return [];
  }
}

export async function getBestQuizScores(userId: string): Promise<Record<string, number>> {
  try {
    const attempts = await getQuizAttempts(userId);
    const best: Record<string, number> = {};
    for (const a of attempts) {
      if (!best[a.quiz_id] || a.score > best[a.quiz_id]) {
        best[a.quiz_id] = a.score;
      }
    }
    return best;
  } catch (error) {
    console.error('getBestQuizScores error:', error);
    return {};
  }
}

export async function submitQuizAttemptDB(
  userId: string,
  quizId: string,
  courseId: string,
  score: number,
  passed: boolean,
  answers: Record<string, string>
) {
  try {
    const data = await enrollmentsApi.submitQuiz(userId, parseInt(quizId), parseInt(courseId), score, answers);
    return { data, error: null };
  } catch (error) {
    console.error('submitQuizAttempt error:', error);
    return { data: null, error };
  }
}

// ─── Certificates ──────────────────────────────────────────────────────────────

export interface DBCertificate {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  certificate_number: string;
}

export async function getCertificates(userId: string): Promise<DBCertificate[]> {
  try {
    const certificates = await enrollmentsApi.getCertificates(userId);
    return certificates.map((c: any) => ({
      id: c.id?.toString() || '',
      user_id: userId,
      course_id: c.course_id?.toString() || '',
      issued_at: c.issued_at || c.created_at || '',
      certificate_number: c.uuid || '',
    }));
  } catch (error) {
    console.error('getCertificates error:', error);
    return [];
  }
}

// ─── Full user data loader ─────────────────────────────────────────────────────

export interface UserLMSData {
  profile: DBProfile;
  enrollments: DBEnrollment[];
  completedLessons: DBCompletedLesson[];
  quizScores: Record<string, number>;
  certificates: DBCertificate[];
}

export async function loadUserData(userId: string): Promise<UserLMSData | null> {
  const profile = await getProfile(userId);
  if (!profile) return null;

  const [enrollments, completedLessons, quizScores, certificates] = await Promise.all([
    getEnrollments(userId),
    getCompletedLessons(userId),
    getBestQuizScores(userId),
    getCertificates(userId),
  ]);

  return { profile, enrollments, completedLessons, quizScores, certificates };
}
