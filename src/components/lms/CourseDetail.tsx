import React, { useState, useEffect } from 'react';
import { useLMS } from '@/contexts/LMSContext';
import { coursesApi } from '@/lib/api';
import { getCurrencySymbol } from '@/lib/currencies';

import {
  ArrowLeft, Clock, Users, Star, BookOpen, Award, Play, FileText,
  CheckCircle, Lock, ChevronDown, ChevronUp, Target, AlertCircle, Loader2
} from 'lucide-react';

const CourseDetail: React.FC = () => {
  const { selectedCourseId, getCourse, navigate, enrollInCourse, isEnrolled, getEnrolledCourse, quizzes, coursesLoading } = useLMS();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor'>('overview');
  const [fullCourse, setFullCourse] = useState<any>(null);
  const [loadingFullCourse, setLoadingFullCourse] = useState(false);

  // Get course from context (lightweight version)
  const contextCourse = selectedCourseId ? getCourse(selectedCourseId) : null;
  
  // Fetch full course details with modules when selectedCourseId changes
  useEffect(() => {
    if (selectedCourseId) {
      setLoadingFullCourse(true);
      coursesApi.getById(parseInt(selectedCourseId))
        .then(data => {
          setFullCourse(data);
          setLoadingFullCourse(false);
        })
        .catch(err => {
          console.error('Error fetching full course details:', err);
          setLoadingFullCourse(false);
        });
    }
  }, [selectedCourseId]);

  // Use full course if available, otherwise use context course
  const course = fullCourse || contextCourse;
  
  // Show loading state while courses are being fetched
  if ((coursesLoading || loadingFullCourse) && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Loading course details...</h2>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Course not found</h2>
          <p className="text-gray-500 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('catalog')}
            className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const enrolled = isEnrolled(course.id);
  const enrolledData = getEnrolledCourse(course.id);
  const courseQuizzes = quizzes.filter(q => q.courseId === course.id);
  const finalExam = courseQuizzes.find(q => q.isExam);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleEnroll = () => {
    enrollInCourse(course.id);
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'reading': return FileText;
      case 'activity': return Target;
      default: return BookOpen;
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'curriculum' as const, label: 'Curriculum' },
    { id: 'instructor' as const, label: 'Instructor' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('catalog')}
            className="flex items-center gap-2 text-teal-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-teal-700 text-teal-100 text-xs font-semibold px-3 py-1 rounded-full">{course.category}</span>
                <span className="bg-teal-700 text-teal-100 text-xs font-semibold px-3 py-1 rounded-full">{course.level}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">{course.title}</h1>
              <p className="text-teal-100 text-lg mb-4">{course.subtitle}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-teal-200">
               {/*  <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-white font-semibold">{course.rating}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> {course.enrolled.toLocaleString()} students
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {course.duration}
                </span> */}
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> {course.lessons} lessons
                </span>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <img src={course.instructorAvatar} alt={course.instructor} className="w-10 h-10 rounded-full object-cover border-2 border-teal-400" />
                <div>
                  <p className="text-white font-medium text-sm">{course.instructor}</p>
                  <p className="text-teal-300 text-xs">{course.instructorTitle}</p>
                </div>
              </div>
            </div>

            {/* Enrollment Card */}
            <div className="bg-white rounded-2xl p-6 text-gray-900 shadow-xl">
              <img src={course.image} alt={course.title} className="w-full h-40 object-cover rounded-xl mb-4" />

              {enrolled && enrolledData ? (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Your Progress</span>
                      <span className="font-bold text-teal-600">{enrolledData.progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all" style={{ width: `${enrolledData.progress}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const firstModule = course.modules[0];
                      if (firstModule?.lessons[0]) {
                        navigate('lesson-player', { courseId: course.id, lessonId: firstModule.lessons[0].id });
                      }
                    }}
                    className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Continue Learning
                  </button>
                  {enrolledData.certificateEarned && (
                    <div className="mt-3 flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl p-3">
                      <Award className="w-5 h-5" />
                      <span className="text-sm font-medium">Certificate Earned!</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-gray-900">{getCurrencySymbol(course.currency || 'MWK')}{course.price}</span>
                    <span className="text-gray-500 text-sm ml-1">{course.currency || 'MWK'}</span>
                  </div>
                  <button
                    onClick={handleEnroll}
                    className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors mb-3"
                  >
                    Enrol Now
                  </button>
                  {/* <p className="text-xs text-gray-500 text-center">30-day money-back guarantee</p> */}
                </>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-teal-500" /> Full lifetime access
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-teal-500" /> Certificate of completion
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-teal-500" /> Acredited childcare training
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Course</h2>
                <p className="text-gray-600 leading-relaxed mb-8">{course.description}</p>

                <h3 className="text-xl font-bold text-gray-900 mb-4">What You'll Learn</h3>
                <div className="grid sm:grid-cols-2 gap-3 mb-8">
                  {course.objectives.map((obj, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-teal-50 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{obj}</span>
                    </div>
                  ))}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements</h3>
                <ul className="space-y-2 mb-8">
                  {course.requirements.map((req, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 text-amber-500" /> {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
                <div className="space-y-3">
                  {course.modules.map((module, moduleIdx) => {
                    const isExpanded = expandedModules.includes(module.id);
                    const moduleQuiz = courseQuizzes.find(q => q.moduleIndex === moduleIdx);
                    const completedInModule = enrolled && enrolledData
                      ? module.lessons.filter(l => enrolledData.completedLessons.includes(l.id)).length
                      : 0;

                    return (
                      <div key={module.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 font-bold text-sm">
                              {moduleIdx + 1}
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-gray-900 text-sm">{module.title}</h4>
                              <p className="text-xs text-gray-500">
                                {module.lessons.length} lessons
                                {enrolled && ` · ${completedInModule}/${module.lessons.length} completed`}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        {isExpanded && (
                          <div className="border-t border-gray-100">
                            {module.lessons.map((lesson, lessonIdx) => {
                              const LessonIcon = getLessonIcon(lesson.type);
                              const isCompleted = enrolled && enrolledData?.completedLessons.includes(lesson.id);

                              return (
                                <div
                                  key={lesson.id}
                                  onClick={() => {
                                    if (enrolled) {
                                      navigate('lesson-player', { courseId: course.id, lessonId: lesson.id });
                                    }
                                  }}
                                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${
                                    enrolled ? 'cursor-pointer hover:bg-teal-50' : ''
                                  } transition-colors`}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isCompleted ? 'bg-emerald-100' : 'bg-gray-100'
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    ) : enrolled ? (
                                      <LessonIcon className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <Lock className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-sm ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>
                                      {lesson.title}
                                    </p>
                                    <p className="text-xs text-gray-400 capitalize">{lesson.type} · {lesson.duration}</p>
                                  </div>
                                </div>
                              );
                            })}

                            {moduleQuiz && (
                              <div
                                onClick={() => {
                                  if (enrolled) navigate('quiz', { courseId: course.id, quizId: moduleQuiz.id });
                                }}
                                className={`flex items-center gap-3 px-4 py-3 bg-amber-50 ${enrolled ? 'cursor-pointer hover:bg-amber-100' : ''} transition-colors`}
                              >
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                  <Award className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-amber-800">{moduleQuiz.title}</p>
                                  <p className="text-xs text-amber-600">
                                    {moduleQuiz.questions.length} questions · {moduleQuiz.timeLimit} min
                                    {enrolled && enrolledData?.quizScores[moduleQuiz.id] != null && (
                                      <span className="ml-2 font-semibold">Score: {enrolledData.quizScores[moduleQuiz.id]}%</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Final Exam */}
                  {finalExam && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-purple-900">{finalExam.title}</h4>
                          <p className="text-sm text-purple-600">
                            {finalExam.questions.length} questions · {finalExam.timeLimit} min · Passing: {finalExam.passingScore}%
                          </p>
                        </div>
                        {enrolled && (
                          <button
                            onClick={() => navigate('quiz', { courseId: course.id, quizId: finalExam.id })}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                          >
                            Take Exam
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'instructor' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Instructor</h2>
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-start gap-4">
                    <img src={course.instructorAvatar} alt={course.instructor} className="w-20 h-20 rounded-xl object-cover" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{course.instructor}</h3>
                      <p className="text-teal-600 font-medium">{course.instructorTitle}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                       {/*  <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {course.instructorRating} Rating</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.instructorTotalCourses}+ Students</span> */}
                        <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {course.instructor_total_courses || 0} Courses</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    {course.instructorBio || `With extensive experience in early childhood education, ${course.instructor} brings a wealth of knowledge and practical expertise to every course. Their passion for supporting childcare professionals shines through in their engaging teaching style and evidence-based approach.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Related info */}
          <div className="hidden lg:block">
            <div className="sticky top-32 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-3">Course Includes</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><Play className="w-4 h-4 text-teal-500" /> {course.duration} of video content</div>
                  <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-500" /> {course.lessons} lessons</div>
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-teal-500" /> Downloadable resources</div>
                  <div className="flex items-center gap-2"><Award className="w-4 h-4 text-teal-500" /> Certificate of completion</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-teal-500" /> Full lifetime access</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
