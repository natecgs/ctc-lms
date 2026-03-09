import React from 'react';
import { useLMS } from '@/contexts/LMSContext';
import { Course } from '@/data/lmsData';
import { Clock, Users, Star, BookOpen, ArrowRight } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'compact' | 'featured';
}

const CourseCard: React.FC<CourseCardProps> = ({ course, variant = 'default' }) => {
  const { navigate, isEnrolled, getEnrolledCourse } = useLMS();
  const enrolled = isEnrolled(course.id);
  const enrolledData = getEnrolledCourse(course.id);

  const levelColors = {
    Beginner: 'bg-green-100 text-green-700',
    Intermediate: 'bg-amber-100 text-amber-700',
    Advanced: 'bg-purple-100 text-purple-700',
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={() => navigate('course-detail', { courseId: course.id })}
        className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md cursor-pointer transition-all group"
      >
        <img src={course.image} alt={course.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm group-hover:text-teal-700 transition-colors truncate">{course.title}</h4>
          <p className="text-xs text-gray-500 mt-1">{course.instructor}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {course.duration}
            </span>
            {enrolled && enrolledData && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${enrolledData.progress}%` }} />
                </div>
                <span className="text-xs text-teal-600 font-medium">{enrolledData.progress}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-teal-300 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
      onClick={() => navigate('course-detail', { courseId: course.id })}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelColors[course.level]}`}>
            {course.level}
          </span>
        </div>
        {enrolled && (
          <div className="absolute top-3 right-3 bg-teal-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            Enrolled
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-16" />
        <span className="absolute bottom-3 left-3 text-white text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md">
          {course.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-teal-700 transition-colors line-clamp-2">
          {course.title}
        </h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.subtitle}</p>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-3">
          <img src={course.instructorAvatar} alt={course.instructor} className="w-6 h-6 rounded-full object-cover" />
          <span className="text-xs text-gray-600">{course.instructor}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> {course.lessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {course.enrolled.toLocaleString()}
          </span>
        </div>

        {/* Progress bar for enrolled courses */}
        {enrolled && enrolledData && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500">Progress</span>
              <span className="font-semibold text-teal-600">{enrolledData.progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${enrolledData.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-gray-900">{course.rating}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">R{course.price}</span>
            <ArrowRight className="w-4 h-4 text-teal-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
