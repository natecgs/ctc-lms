import React from 'react';
import { useLMS } from '@/contexts/LMSContext';
import CourseCard from './CourseCard';
import {
  BookOpen, Clock, Award, TrendingUp, Play, Target,
  Calendar, ChevronRight, BarChart3, LogIn, Loader2
} from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { student, navigate, courses, isLoggedIn, toggleAuth, setAuthMode, dataLoading } = useLMS();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LogIn className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your dashboard</h2>
          <p className="text-gray-500 mb-4">Track your progress, manage enrollments, and earn certificates.</p>
          <button
            onClick={() => { setAuthMode('login'); toggleAuth(); }}
            className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Redirect instructors to instructor panel
  if ((student.role as string) === 'instructor') {
    console.log('StudentDashboard: Redirecting instructor to panel. Role:', student.role);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructor Dashboard</h2>
          <p className="text-gray-500 mb-6">Please navigate to the instructor panel to manage your courses.</p>
          <button
            onClick={() => navigate('instructor')}
            className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
          >
            Go to Instructor Panel
          </button>
        </div>
      </div>
    );
  }

  // Debug: Log the student profile to understand what's being loaded
  React.useEffect(() => {
    console.log('StudentDashboard: Student profile:', { 
      role: student.role, 
      name: student.name,
      roleType: typeof student.role,
      isStringInstructor: (student.role as string) === 'instructor'
    });
  }, [student]);

  if (dataLoading && student.enrolledCourses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const enrolledCourseData = student.enrolledCourses.map(ec => ({
    ...ec,
    course: courses.find(c => String(c.id) === String(ec.courseId))!,
  })).filter(ec => ec.course);

  const inProgressCourses = enrolledCourseData.filter(ec => ec.progress > 0 && ec.progress < 100);
  const completedCourses = enrolledCourseData.filter(ec => ec.progress >= 100);
  const notStartedCourses = enrolledCourseData.filter(ec => ec.progress === 0);

  const totalProgress = enrolledCourseData.length > 0
    ? Math.round(enrolledCourseData.reduce((sum, ec) => sum + ec.progress, 0) / enrolledCourseData.length)
    : 0;

  const stats = [
    { icon: BookOpen, label: 'Enrolled Courses', value: student.enrolledCourses.length, color: 'bg-blue-100 text-blue-600' },
    { icon: Clock, label: 'Hours Learned', value: student.totalHoursLearned, color: 'bg-amber-100 text-amber-600' },
    { icon: Award, label: 'Certificates', value: student.certificates.length, color: 'bg-emerald-100 text-emerald-600' },
    { icon: TrendingUp, label: 'Avg. Progress', value: `${totalProgress}%`, color: 'bg-purple-100 text-purple-600' },
  ];

  const recentActivity = [
    { action: 'Completed lesson', detail: 'Formula Preparation & Safety', course: 'Infant Care Fundamentals', time: '2 hours ago' },
    { action: 'Scored 90%', detail: 'Infant Development Basics Quiz', course: 'Infant Care Fundamentals', time: '3 hours ago' },
    { action: 'Started module', detail: 'Foundations of Curriculum Design', course: 'Curriculum Design for Early Learners', time: '2 days ago' },
    { action: 'Earned certificate', detail: 'Course Completed', course: 'Child Safety & First Aid', time: '1 week ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <img src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'} alt={student.name || 'User'} className="w-14 h-14 rounded-xl object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {(student.role as string) === 'instructor' 
                  ? `Welcome, Instructor${student.name ? ` ${student.name.split(' ')[0]}` : ''}!`
                  : `Welcome back${student.name ? `, ${student.name.split(' ')[0]}` : ''}!`
                }
              </h1>
              <p className="text-gray-500">
                {(student.role as string) === 'instructor' 
                  ? 'Manage your courses and track student progress'
                  : 'Continue your learning journey'
                }
              </p>
            </div>
          </div>
        </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            {inProgressCourses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Continue Learning</h2>
                  <button onClick={() => navigate('catalog')} className="text-sm text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {inProgressCourses.map(ec => (
                    <div
                      key={ec.courseId}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate('course-detail', { courseId: ec.courseId })}
                    >
                      <div className="flex gap-4">
                        <img src={ec.course.image} alt={ec.course.title} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-gray-900 mb-1">{ec.course.title}</h3>
                              <p className="text-sm text-gray-500">{ec.course.instructor}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const firstLesson = ec.course.modules[0]?.lessons[0];
                                if (firstLesson) navigate('lesson-player', { courseId: ec.courseId, lessonId: firstLesson.id });
                              }}
                              className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition-colors flex-shrink-0"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="text-gray-500">{ec.completedLessons.length} of {ec.course.modules.reduce((s, m) => s + m.lessons.length, 0)} lessons</span>
                              <span className="font-semibold text-teal-600">{ec.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all" style={{ width: `${ec.progress}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Not Started */}
            {notStartedCourses.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Ready to Start</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {notStartedCourses.map(ec => (
                    <div
                      key={ec.courseId}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate('course-detail', { courseId: ec.courseId })}
                    >
                      <img src={ec.course.image} alt={ec.course.title} className="w-full h-32 rounded-lg object-cover mb-3" />
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{ec.course.title}</h3>
                      <p className="text-xs text-gray-500 mb-3">{ec.course.duration} · {ec.course.lessons} lessons</p>
                      <button className="w-full bg-teal-50 text-teal-700 py-2 rounded-lg text-sm font-semibold hover:bg-teal-100 transition-colors">
                        Start Course
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Courses */}
            {completedCourses.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Courses</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {completedCourses.map(ec => (
                    <div
                      key={ec.courseId}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer relative"
                      onClick={() => navigate('course-detail', { courseId: ec.courseId })}
                    >
                      <div className="absolute top-6 right-6 bg-emerald-100 text-emerald-700 p-1.5 rounded-full">
                        <Award className="w-4 h-4" />
                      </div>
                      <img src={ec.course.image} alt={ec.course.title} className="w-full h-32 rounded-lg object-cover mb-3" />
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{ec.course.title}</h3>
                      <p className="text-xs text-emerald-600 font-medium">Completed · Certificate Earned</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Courses */}
            <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
                  <button onClick={() => navigate('catalog')} className="text-sm text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
                    Browse All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {courses
                    .filter(c => !student.enrolledCourses.some(ec => ec.courseId === c.id))
                    .slice(0, 4)
                    .map(course => (
                      <CourseCard key={course.id} course={course} variant="compact" />
                    ))}
                </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weekly Goal */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-gray-900">Weekly Goal</h3>
              </div>
              <div className="text-center mb-4">
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#14b8a6" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - 0.6)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">3/5</p>
                      <p className="text-xs text-gray-500">hours</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">You're 60% to your weekly goal. Keep it up!</p>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-gray-900">Recent Activity</h3>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.action}</span>
                        {' '}{activity.detail}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{activity.course} · {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-gray-900">Upcoming</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Module 2 Quiz</p>
                    <p className="text-xs text-gray-500">Infant Care Fundamentals</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Final Exam</p>
                    <p className="text-xs text-gray-500">Infant Care Fundamentals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
