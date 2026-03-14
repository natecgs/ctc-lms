import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { usersApi, coursesApi, currenciesApi } from '@/lib/api';
import {
  Course, Quiz, EnrolledCourse, StudentProfile,
  quizzes as allQuizzes, defaultStudentProfile
} from '@/data/lmsData';
import {
  loadUserData, upsertProfile, enrollInCourseDB, completeLessonDB,
  submitQuizAttemptDB, updateProfile as updateProfileDB,
  getCompletedLessons, getEnrollments, getBestQuizScores, getCertificates,
  DBProfile, DBEnrollment, DBCompletedLesson, DBCertificate,
} from '@/lib/database';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '@/lib/currencies';

// Simple user interface for API-based authentication
interface SimpleUser {
  id: number;
  email: string;
  role: 'student' | 'instructor' | 'admin';
}

export type ViewType =
  | 'home'
  | 'catalog'
  | 'course-detail'
  | 'lesson-player'
  | 'quiz'
  | 'dashboard'
  | 'instructor'
  | 'certificates'
  | 'profile';

interface LMSState {
  currentView: ViewType;
  selectedCourseId: string | null;
  selectedLessonId: string | null;
  selectedQuizId: string | null;
  student: StudentProfile;
  searchQuery: string;
  selectedCategory: string;
  isLoggedIn: boolean;
  showAuthModal: boolean;
  authMode: 'login' | 'signup';
  authLoading: boolean;
  authError: string | null;
  dataLoading: boolean;
  user: SimpleUser | null;
  courses: Course[];
  quizzes: Quiz[];
  coursesLoading: boolean;
  selectedCurrency: string;
  showEmailVerification: boolean;
  pendingVerificationUserId: number | null;
  pendingVerificationEmail: string | null;
}

interface LMSContextType extends LMSState {
  navigate: (view: ViewType, params?: { courseId?: string; lessonId?: string; quizId?: string }) => void;
  enrollInCourse: (courseId: string) => void;
  completeLessonAction: (courseId: string, lessonId: string) => void;
  submitQuizScore: (quizId: string, score: number, answers?: Record<string, string>) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setCurrency: (currency: string) => void;
  getCourse: (id: string) => Course | undefined;
  getQuiz: (id: string) => Quiz | undefined;
  getEnrolledCourse: (courseId: string) => EnrolledCourse | undefined;
  isEnrolled: (courseId: string) => boolean;
  toggleAuth: () => void;
  setAuthMode: (mode: 'login' | 'signup') => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<DBProfile>) => Promise<void>;
  filteredCourses: Course[];
  refreshUserData: () => Promise<void>;
  refreshCourses: () => Promise<void>;
  closeEmailVerification: () => void;
  completeEmailVerification: () => void;
}

const LMSContext = createContext<LMSContextType | null>(null);

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) throw new Error('useLMS must be used within LMSProvider');
  return context;
};

// Helper: convert DB data to the StudentProfile shape used by UI components
function buildStudentProfile(
  userId: string,
  profile: DBProfile | null,
  enrollments: DBEnrollment[],
  completedLessons: DBCompletedLesson[],
  quizScores: Record<string, number>,
  certificates: DBCertificate[],
): StudentProfile {
  const enrolledCourses: EnrolledCourse[] = enrollments.map(e => {
    const courseLessons = completedLessons.filter(cl => cl.course_id === e.course_id);
    return {
      courseId: e.course_id,
      progress: e.progress,
      completedLessons: courseLessons.map(cl => cl.lesson_id),
      quizScores,
      enrolledDate: e.enrolled_at?.split('T')[0] || '',
      lastAccessed: e.last_accessed_at?.split('T')[0] || '',
      certificateEarned: e.certificate_earned,
    };
  });

  return {
    id: userId,
    name: profile?.full_name || '',
    email: profile?.email || '',
    avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    role: (profile?.role as 'student' | 'instructor' | 'admin') || 'student',
    enrolledCourses,
    certificates: certificates.map(c => c.course_id),
    totalHoursLearned: profile?.total_hours_learned || 0,
    joinDate: profile?.created_at?.split('T')[0] || '',
  };
}

const emptyProfile: StudentProfile = {
  id: '', name: '', email: '', avatar: '', role: 'student',
  enrolledCourses: [], certificates: [], totalHoursLearned: 0, joinDate: '',
};

export const LMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize currency from localStorage or use default
  const getInitialCurrency = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ctc_lms_currency') || DEFAULT_CURRENCY;
    }
    return DEFAULT_CURRENCY;
  };

  const [state, setState] = useState<LMSState>({
    currentView: 'home',
    selectedCourseId: null,
    selectedLessonId: null,
    selectedQuizId: null,
    student: emptyProfile,
    searchQuery: '',
    selectedCategory: 'All Courses',
    isLoggedIn: false,
    showAuthModal: false,
    authMode: 'login',
    authLoading: true,
    authError: null,
    dataLoading: false,
    user: null,
    courses: [],
    quizzes: allQuizzes,
    coursesLoading: true,
    selectedCurrency: getInitialCurrency(),
    showEmailVerification: false,
    pendingVerificationUserId: null,
    pendingVerificationEmail: null,
  });

  const loadingRef = useRef(false);

  // ─── Load user data from DB ────────────────────────────────────────────────
  const refreshUserData = useCallback(async (userId?: string | number) => {
    const uid = userId || state.user?.id;
    if (!uid || loadingRef.current) return;
    loadingRef.current = true;
    setState(prev => ({ ...prev, dataLoading: true }));
    try {
      const userData = await loadUserData(String(uid));
      if (userData) {
        const studentProfile = buildStudentProfile(
          String(uid), userData.profile, userData.enrollments,
          userData.completedLessons, userData.quizScores, userData.certificates
        );
        setState(prev => ({ ...prev, student: studentProfile, dataLoading: false }));
      } else {
        setState(prev => ({ ...prev, dataLoading: false }));
      }
    } catch (err) {
      console.error('refreshUserData error:', err);
      setState(prev => ({ ...prev, dataLoading: false }));
    } finally {
      loadingRef.current = false;
    }
  }, [state.user?.id]);

  // ─── Auth persistence via localStorage ──────────────────────────────────────
  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUserId = localStorage.getItem('ctc_lms_user_id');
    const storedRole = (localStorage.getItem('ctc_lms_user_role') as 'student' | 'instructor' | 'admin') || 'student';
    if (storedUserId) {
      try {
        const userId = parseInt(storedUserId);
        setState(prev => ({
          ...prev,
          user: { id: userId, email: '', role: storedRole },
          isLoggedIn: true,
          authLoading: false,
          currentView: storedRole === 'instructor' ? 'instructor' : 'dashboard',
        }));
        refreshUserData(userId);
      } catch (err) {
        console.error('Error loading user from localStorage:', err);
        setState(prev => ({ ...prev, authLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, authLoading: false }));
    }
  }, []);

  // ─── Fetch courses from database ────────────────────────────────────────────
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setState(prev => ({ ...prev, coursesLoading: true }));
        const fetchedCourses = await coursesApi.getAll(200, 0);
        setState(prev => ({
          ...prev,
          courses: fetchedCourses || [],
          coursesLoading: false,
        }));
      } catch (err) {
        console.error('Error fetching courses:', err);
        // Fall back to empty courses if fetch fails
        setState(prev => ({ ...prev, coursesLoading: false }));
      }
    };
    fetchCourses();
  }, []);

  // ─── Refresh courses function ───────────────────────────────────────────────
  const refreshCourses = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, coursesLoading: true }));
      const fetchedCourses = await coursesApi.getAll(200, 0);
      setState(prev => ({
        ...prev,
        courses: fetchedCourses || [],
        coursesLoading: false,
      }));
    } catch (err) {
      console.error('Error refreshing courses:', err);
      setState(prev => ({ ...prev, coursesLoading: false }));
    }
  }, []);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const navigate = useCallback((view: ViewType, params?: { courseId?: string; lessonId?: string; quizId?: string }) => {
    setState(prev => ({
      ...prev,
      currentView: view,
      selectedCourseId: params?.courseId ?? prev.selectedCourseId,
      selectedLessonId: params?.lessonId ?? null,
      selectedQuizId: params?.quizId ?? null,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ─── Auth actions ──────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, authLoading: true, authError: null }));
    try {
      console.log('[LMS] Login attempt for:', email);
      
      // For now, we simply look up the user by email via the API
      // In production, you'd want proper JWT/session authentication
      // Using email as authId for now (should be replaced with proper auth)
      const user = await usersApi.getOrCreate(email, email);
      
      if (!user || !user.id) {
        throw new Error('User creation/fetch returned invalid data');
      }
      
      console.log('[LMS] Login: User returned from getOrCreate:', user);
      
      // Fetch the actual profile to get the correct role from database
      const profile = await usersApi.getProfile(user.id);
      console.log('[LMS] Login: Profile fetched:', profile);
      
      if (!profile) {
        throw new Error('Failed to fetch user profile');
      }
      
      const userRole = profile?.role || user.role || 'student';
      console.log('[LMS] Login: Determined user role:', userRole);
      
      // Load user's preferred currency from profile
      const userCurrency = profile?.preferred_currency || DEFAULT_CURRENCY;
      localStorage.setItem('ctc_lms_currency', userCurrency);
      
      // Store user ID and role in localStorage
      localStorage.setItem('ctc_lms_user_id', String(user.id));
      localStorage.setItem('ctc_lms_user_email', email);
      localStorage.setItem('ctc_lms_user_role', userRole);
      
      const dashboardView: ViewType = userRole === 'instructor' ? 'instructor' : 'dashboard';
      console.log('[LMS] Login: Setting currentView to:', dashboardView);
      
      setState(prev => ({
        ...prev,
        user: { id: user.id, email, role: userRole },
        isLoggedIn: true,
        authLoading: false,
        showAuthModal: false,
        authError: null,
        currentView: dashboardView,
        selectedCurrency: userCurrency,
      }));
      
      // Load user data
      refreshUserData(user.id);
      
      console.log('[LMS] Login successful for user:', user.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[LMS] Login failed:', errorMessage);
      setState(prev => ({
        ...prev,
        authLoading: false,
        authError: errorMessage || 'Login failed',
      }));
    }
  }, [refreshUserData]);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    setState(prev => ({ ...prev, authLoading: true, authError: null }));
    try {
      console.log('[LMS] Signup attempt for:', email);
      
      // Create user via API (without specifying role - will default to 'student')
      const user = await usersApi.getOrCreate(email, email);
      
      if (!user || !user.id) {
        throw new Error('User creation returned invalid data');
      }
      
      // Update profile with full name
      await usersApi.updateProfile(user.id, {
        full_name: fullName,
        email,
      });

      // Fetch the actual profile to get the role from database
      const profile = await usersApi.getProfile(user.id);
      const userRole = profile?.role || user.role || 'student';

      // Store user ID, email, and role in localStorage
      localStorage.setItem('ctc_lms_user_id', String(user.id));
      localStorage.setItem('ctc_lms_user_email', email);
      localStorage.setItem('ctc_lms_user_role', userRole);

      // Show email verification modal instead of logging in immediately
      setState(prev => ({
        ...prev,
        authLoading: false,
        showAuthModal: false,
        authError: null,
        showEmailVerification: true,
        pendingVerificationUserId: user.id,
        pendingVerificationEmail: email,
      }));

      console.log('[LMS] Signup successful, showing email verification for user:', user.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[LMS] Signup failed:', errorMessage);
      setState(prev => ({
        ...prev,
        authLoading: false,
        authError: errorMessage || 'Signup failed',
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('ctc_lms_user_id');
    localStorage.removeItem('ctc_lms_user_email');
    localStorage.removeItem('ctc_lms_user_role');
    setState(prev => ({
      ...prev,
      isLoggedIn: false,
      user: null,
      student: emptyProfile,
      currentView: 'home',
    }));
  }, []);

  // ─── Enrollment ────────────────────────────────────────────────────────────
  const enrollInCourse = useCallback(async (courseId: string) => {
    if (!state.user) {
      setState(prev => ({ ...prev, showAuthModal: true, authMode: 'signup' }));
      return;
    }
    // Optimistic update
    setState(prev => {
      const alreadyEnrolled = prev.student.enrolledCourses.some(ec => ec.courseId === courseId);
      if (alreadyEnrolled) return prev;
      const newEnrollment: EnrolledCourse = {
        courseId, progress: 0, completedLessons: [], quizScores: {},
        enrolledDate: new Date().toISOString().split('T')[0],
        lastAccessed: new Date().toISOString().split('T')[0],
        certificateEarned: false,
      };
      return {
        ...prev,
        student: {
          ...prev.student,
          enrolledCourses: [...prev.student.enrolledCourses, newEnrollment],
        },
      };
    });
    await enrollInCourseDB(String(state.user.id), courseId);
  }, [state.user?.id]);

  // ─── Complete lesson ───────────────────────────────────────────────────────
  const completeLessonAction = useCallback(async (courseId: string, lessonId: string) => {
    if (!state.user) return;
    // Optimistic update
    setState(prev => {
      const enrolledCourses = prev.student.enrolledCourses.map(ec => {
        if (ec.courseId !== courseId) return ec;
        if (ec.completedLessons.includes(lessonId)) return ec;
        const newCompleted = [...ec.completedLessons, lessonId];
        const course = state.courses.find(c => String(c.id) === courseId);
        const totalLessons = course?.modules ? course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) : 1;
        const progress = Math.min(Math.round((newCompleted.length / totalLessons) * 100), 100);
        return {
          ...ec,
          completedLessons: newCompleted,
          progress,
          lastAccessed: new Date().toISOString().split('T')[0],
          certificateEarned: progress >= 100,
        };
      });
      const certs = enrolledCourses.filter(ec => ec.certificateEarned).map(ec => ec.courseId);
      return {
        ...prev,
        student: { ...prev.student, enrolledCourses, certificates: certs },
      };
    });
    await completeLessonDB(String(state.user.id), courseId, lessonId);
  }, [state.user?.id, state.courses]);

  // ─── Submit quiz ───────────────────────────────────────────────────────────
  const submitQuizScore = useCallback(async (quizId: string, score: number, answers?: Record<string, string>) => {
    if (!state.user) return;
    const quiz = state.quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    const passed = score >= quiz.passingScore;

    // Optimistic update
    setState(prev => {
      const enrolledCourses = prev.student.enrolledCourses.map(ec => {
        if (ec.courseId !== String(quiz.courseId)) return ec;
        return {
          ...ec,
          quizScores: {
            ...ec.quizScores,
            [quizId]: Math.max(ec.quizScores[quizId] || 0, score),
          },
        };
      });
      return { ...prev, student: { ...prev.student, enrolledCourses } };
    });

    await submitQuizAttemptDB(String(state.user.id), quizId, String(quiz.courseId), score, passed, answers || {});
  }, [state.user?.id, state.quizzes]);

  // ─── Update profile ────────────────────────────────────────────────────────
  const updateUserProfile = useCallback(async (updates: Partial<DBProfile>) => {
    if (!state.user) return;
    const { data } = await updateProfileDB(String(state.user.id), updates);
    if (data) {
      setState(prev => ({
        ...prev,
        student: {
          ...prev.student,
          name: data.full_name || prev.student.name,
          email: data.email || prev.student.email,
          avatar: data.avatar_url || prev.student.avatar,
        },
      }));
    }
  }, [state.user?.id]);

  // ─── Static data helpers ───────────────────────────────────────────────────
  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setSelectedCategory = useCallback((category: string) => {
    setState(prev => ({ ...prev, selectedCategory: category }));
  }, []);

  const setCurrency = useCallback((currency: string) => {
    setState(prev => ({ ...prev, selectedCurrency: currency }));
    localStorage.setItem('ctc_lms_currency', currency);
    
    // Persist to database if user is logged in
    if (state.user?.id) {
      usersApi.updateCurrencyPreference(state.user.id, currency).catch(err => {
        console.error('[LMS] Error saving currency preference:', err);
      });
    }
  }, [state.user?.id]);

  const getCourse = useCallback((id: string) => state.courses.find(c => String(c.id) === id), [state.courses]);
  const getQuiz = useCallback((id: string) => state.quizzes.find(q => q.id === id), [state.quizzes]);

  const getEnrolledCourse = useCallback((courseId: string) => {
    return state.student.enrolledCourses.find(ec => ec.courseId === courseId);
  }, [state.student.enrolledCourses]);

  const isEnrolled = useCallback((courseId: string) => {
    return state.student.enrolledCourses.some(ec => ec.courseId === courseId);
  }, [state.student.enrolledCourses]);

  const toggleAuth = useCallback(() => {
    setState(prev => ({ ...prev, showAuthModal: !prev.showAuthModal, authError: null }));
  }, []);

  const setAuthMode = useCallback((mode: 'login' | 'signup') => {
    setState(prev => ({ ...prev, authMode: mode, authError: null }));
  }, []);

  // ─── Email Verification ────────────────────────────────────────────────────
  const closeEmailVerification = useCallback(() => {
    setState(prev => ({
      ...prev,
      showEmailVerification: false,
      pendingVerificationUserId: null,
      pendingVerificationEmail: null,
    }));
  }, []);

  const completeEmailVerification = useCallback(() => {
    const userId = state.pendingVerificationUserId;
    const email = state.pendingVerificationEmail;

    if (!userId || !email) return;

    // Complete the login process
    const userRole = localStorage.getItem('ctc_lms_user_role') || 'student';
    const dashboardView: ViewType = userRole === 'instructor' ? 'instructor' : 'dashboard';

    setState(prev => ({
      ...prev,
      user: { id: userId, email, role: userRole as 'student' | 'instructor' | 'admin' },
      isLoggedIn: true,
      currentView: dashboardView,
      showEmailVerification: false,
      pendingVerificationUserId: null,
      pendingVerificationEmail: null,
    }));

    // Load user data
    refreshUserData(userId);
  }, [state.pendingVerificationUserId, state.pendingVerificationEmail, refreshUserData]);

  const filteredCourses = state.courses.filter(course => {
    const matchesSearch = state.searchQuery === '' ||
      course.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (course.tags && course.tags.some(t => t.toLowerCase().includes(state.searchQuery.toLowerCase())));
    const matchesCategory = state.selectedCategory === 'All Courses' || course.category === state.selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <LMSContext.Provider value={{
      ...state,
      navigate,
      enrollInCourse,
      completeLessonAction,
      submitQuizScore,
      setSearchQuery,
      setSelectedCategory,
      setCurrency,
      getCourse,
      getQuiz,
      getEnrolledCourse,
      isEnrolled,
      toggleAuth,
      setAuthMode,
      login,
      signup,
      logout,
      updateUserProfile,
      filteredCourses,
      refreshUserData: () => refreshUserData(),
      refreshCourses,
      closeEmailVerification,
      completeEmailVerification,
    }}>
      {children}
    </LMSContext.Provider>
  );
};
