import React, { useState, useMemo } from 'react';
import { useLMS } from '@/contexts/LMSContext';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Play, FileText,
  Target, BookOpen, Clock, Bookmark, BookmarkCheck, Award
} from 'lucide-react';

const LessonPlayer: React.FC = () => {
  const { selectedCourseId, selectedLessonId, getCourse, navigate, completeLessonAction, getEnrolledCourse } = useLMS();
  const [bookmarked, setBookmarked] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const course = selectedCourseId ? getCourse(selectedCourseId) : null;
  const enrolledData = selectedCourseId ? getEnrolledCourse(selectedCourseId) : null;

  const allLessons = useMemo(() => {
    if (!course) return [];
    return course.modules.flatMap((m, mi) =>
      m.lessons.map(l => ({ ...l, moduleTitle: m.title, moduleIndex: mi, quizId: m.quizId }))
    );
  }, [course]);

  const currentIndex = allLessons.findIndex(l => l.id === selectedLessonId);
  const currentLesson = currentIndex >= 0 ? allLessons[currentIndex] : null;
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const isCompleted = enrolledData?.completedLessons.includes(currentLesson?.id || '');

  if (!course || !currentLesson) return null;

  const handleComplete = () => {
    if (selectedCourseId && currentLesson) {
      completeLessonAction(selectedCourseId, currentLesson.id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'reading': return FileText;
      case 'activity': return Target;
      default: return BookOpen;
    }
  };

  const TypeIcon = getTypeIcon(currentLesson.type);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('course-detail', { courseId: course.id })}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Course
          </button>
          <div className="text-center hidden sm:block">
            <p className="text-xs text-gray-500">{course.title}</p>
            <p className="text-sm font-semibold text-gray-900">{currentLesson.moduleTitle}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{currentIndex + 1} / {allLessons.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Video/Content Area */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
              {currentLesson.type === 'video' ? (
                <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/30 transition-colors">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    <p className="text-white/80 text-sm">{currentLesson.title}</p>
                    <p className="text-white/50 text-xs mt-1">{currentLesson.duration}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: isCompleted ? '100%' : '0%' }} />
                      </div>
                      <span className="text-white/60 text-xs">{currentLesson.duration}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-8 flex items-center justify-center min-h-[200px]">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <TypeIcon className="w-8 h-8 text-teal-600" />
                    </div>
                    <p className="text-teal-800 font-semibold">{currentLesson.type === 'reading' ? 'Reading Material' : 'Interactive Activity'}</p>
                    <p className="text-teal-600 text-sm mt-1">{currentLesson.duration}</p>
                  </div>
                </div>
              )}

              {/* Lesson Content */}
              <div className="p-6 lg:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        currentLesson.type === 'video' ? 'bg-blue-100 text-blue-700' :
                        currentLesson.type === 'reading' ? 'bg-amber-100 text-amber-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {currentLesson.type}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" /> {currentLesson.duration}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h1>
                  </div>
                  <button
                    onClick={() => setBookmarked(!bookmarked)}
                    className={`p-2 rounded-lg transition-colors ${bookmarked ? 'text-teal-600 bg-teal-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  >
                    {bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                </div>

                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed text-base">{currentLesson.content}</p>

                  <div className="mt-8 bg-teal-50 rounded-xl p-6 border border-teal-100">
                    <h3 className="text-lg font-semibold text-teal-900 mb-2">Key Takeaways</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-teal-800">
                        <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                        Understanding the core concepts covered in this lesson is essential for your professional development.
                      </li>
                      <li className="flex items-start gap-2 text-sm text-teal-800">
                        <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                        Apply these principles in your daily practice to see immediate improvements.
                      </li>
                      <li className="flex items-start gap-2 text-sm text-teal-800">
                        <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                        Review the supplementary materials for deeper understanding.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mt-6">
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-sm font-medium text-teal-600 hover:text-teal-700 mb-3"
                  >
                    {showNotes ? 'Hide Notes' : 'Add Notes'}
                  </button>
                  {showNotes && (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Write your notes here..."
                      className="w-full h-32 p-4 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                  {!isCompleted ? (
                    <button
                      onClick={handleComplete}
                      className="w-full sm:w-auto bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" /> Mark as Complete
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Lesson Completed</span>
                    </div>
                  )}

                  {currentLesson.quizId && (
                    <button
                      onClick={() => navigate('quiz', { courseId: course.id, quizId: currentLesson.quizId })}
                      className="w-full sm:w-auto bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Award className="w-5 h-5" /> Take Module Quiz
                    </button>
                  )}
                </div>

                {/* Navigation */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
                  {prevLesson ? (
                    <button
                      onClick={() => navigate('lesson-player', { courseId: course.id, lessonId: prevLesson.id })}
                      className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <div className="text-left">
                        <p className="text-xs text-gray-400">Previous</p>
                        <p className="text-sm font-medium">{prevLesson.title}</p>
                      </div>
                    </button>
                  ) : <div />}

                  {nextLesson ? (
                    <button
                      onClick={() => navigate('lesson-player', { courseId: course.id, lessonId: nextLesson.id })}
                      className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors text-right"
                    >
                      <div>
                        <p className="text-xs text-gray-400">Next</p>
                        <p className="text-sm font-medium">{nextLesson.title}</p>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : <div />}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Lesson List */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-gray-200 sticky top-32 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Course Content</h3>
                {enrolledData && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-semibold text-teal-600">{enrolledData.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${enrolledData.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {allLessons.map((lesson, idx) => {
                  const isActive = lesson.id === selectedLessonId;
                  const isLessonCompleted = enrolledData?.completedLessons.includes(lesson.id);
                  const LIcon = getTypeIcon(lesson.type);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => navigate('lesson-player', { courseId: course.id, lessonId: lesson.id })}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 transition-colors ${
                        isActive ? 'bg-teal-50 border-l-2 border-l-teal-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isLessonCompleted ? 'bg-emerald-100' : isActive ? 'bg-teal-100' : 'bg-gray-100'
                      }`}>
                        {isLessonCompleted ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <LIcon className={`w-3 h-3 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${isActive ? 'font-semibold text-teal-700' : 'text-gray-700'}`}>
                          {lesson.title}
                        </p>
                        <p className="text-[10px] text-gray-400">{lesson.duration}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;
