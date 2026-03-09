import React, { useState, useEffect } from 'react';
import { useLMS } from '@/contexts/LMSContext';
import { coursesApi } from '@/lib/api';
import { usersApi } from '@/lib/api';
import {
  Plus, BookOpen, Users, Award, TrendingUp, BarChart3,
  FileText, Settings, Eye, Edit, Trash2, ChevronRight,
  PlusCircle, Save, X, GripVertical, CheckCircle
} from 'lucide-react';

type InstructorTab = 'overview' | 'courses' | 'create-course' | 'create-quiz' | 'students' | 'instructors';

interface NewCourse {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  price: string;
  image: string;
  instructorId: string;
  modules: { title: string; lessons: { title: string; type: string; duration: string }[] }[];
}

interface NewQuiz {
  title: string;
  courseId: string;
  timeLimit: string;
  passingScore: string;
  questions: { question: string; type: string; options: string[]; correctAnswer: string; explanation: string }[];
}

interface InstructorOption {
  id: string;
  user_id: number;
  title: string;
  bio?: string;
  avatar_url?: string;
  email?: string;
}

const InstructorPanel: React.FC = () => {
  const { navigate, courses, user, refreshCourses } = useLMS();
  const [activeTab, setActiveTab] = useState<InstructorTab>('overview');
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [newCourse, setNewCourse] = useState<NewCourse>({
    title: '', subtitle: '', description: '', category: 'Infant Care', level: 'Beginner', price: '',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop',
    instructorId: user?.id?.toString() || '',
    modules: [{ title: '', lessons: [{ title: '', type: 'video', duration: '' }] }],
  });
  const [newQuiz, setNewQuiz] = useState<NewQuiz>({
    title: '', courseId: '', timeLimit: '15', passingScore: '70',
    questions: [{ question: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', explanation: '' }],
  });
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [featuredCourseId, setFeaturedCourseId] = useState<string | null>(null);
  const [showAddInstructorModal, setShowAddInstructorModal] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    email: '',
    title: '',
    bio: '',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    specializations: [] as string[],
  });
  const [isAddingInstructor, setIsAddingInstructor] = useState(false);
  const [editingInstructorId, setEditingInstructorId] = useState<string | null>(null);
  const [instructorStats, setInstructorStats] = useState({
    total_courses: 0,
    total_students: 0,
    avg_rating: '0',
    total_revenue: 0,
  });

  // Fetch instructors on mount
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const data = await usersApi.getInstructors();
        if (data && Array.isArray(data)) {
          setInstructors(data.map((instr: any) => ({
            id: String(instr.id),
            user_id: instr.user_id,
            title: instr.title,
            bio: instr.bio,
            avatar_url: instr.avatar_url,
            email: instr.email,
          })));
        }
      } catch (error) {
        console.error('Error fetching instructors:', error);
      }
    };
    fetchInstructors();
  }, []);

  // Fetch instructor stats from database
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      try {
        const stats = await usersApi.getInstructorStats(user.id);
        if (stats) {
          setInstructorStats({
            total_courses: stats.total_courses || 0,
            total_students: stats.total_students || 0,
            avg_rating: String(stats.avg_rating || '0'),
            total_revenue: stats.total_revenue || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching instructor stats:', error);
      }
    };
    fetchStats();
  }, [user?.id]);

  // Build stats display array
  const statsDisplay = [
    { icon: BookOpen, label: 'Total Courses', value: String(instructorStats.total_courses), color: 'bg-blue-100 text-blue-600' },
    { icon: Users, label: 'Total Students', value: (instructorStats.total_students || 0).toLocaleString(), color: 'bg-emerald-100 text-emerald-600' },
    { icon: Award, label: 'Avg. Rating', value: `${instructorStats.avg_rating}★`, color: 'bg-amber-100 text-amber-600' },
    { icon: TrendingUp, label: 'Total Revenue', value: `R${((instructorStats.total_revenue || 0) / 1000).toFixed(1)}k`, color: 'bg-purple-100 text-purple-600' },
  ];

  const handleSaveCourse = async () => {
    try {
      setSaveError(null);

      // Validate required fields
      if (!newCourse.title.trim()) {
        setSaveError('Course title is required');
        return;
      }

      if (!newCourse.instructorId) {
        setSaveError('Instructor is required');
        return;
      }

      if (!user?.id) {
        setSaveError('User not authenticated');
        return;
      }

      // Filter out empty modules and lessons
      const modules = newCourse.modules
        .filter(m => m.title.trim())
        .map(m => ({
          title: m.title,
          lessons: m.lessons.filter(l => l.title.trim()).map(l => ({
            title: l.title,
            type: l.type || 'video',
            duration: l.duration || '0',
          })),
        }))
        .filter(m => m.lessons.length > 0);

      if (modules.length === 0) {
        setSaveError('At least one module with lessons is required');
        return;
      }

      // Create course data payload (without modules)
      const courseData = {
        title: newCourse.title,
        subtitle: newCourse.subtitle,
        description: newCourse.description,
        category: newCourse.category,
        level: newCourse.level,
        price: parseFloat(newCourse.price) || 0,
        image_url: newCourse.image || 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop',
      };

      // Call API to create course with selected instructor
      const createdCourse = await coursesApi.create(parseInt(newCourse.instructorId), courseData);

      // Create modules and lessons
      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const moduleData = modules[moduleIndex];
        console.log(`Creating module: ${moduleData.title}`);

        try {
          const createdModule = await coursesApi.createModule(
            parseInt(createdCourse.id),
            moduleData.title
          );

          // Create lessons for this module
          for (const lesson of moduleData.lessons) {
            console.log(`Creating lesson: ${lesson.title}`);
            await coursesApi.createLesson(
              parseInt(createdCourse.id),
              createdModule.id,
              lesson.title,
              (lesson.type as 'video' | 'reading' | 'activity') || 'video',
              {
                duration: lesson.duration,
              }
            );
          }
        } catch (error) {
          console.error(`Error creating module or lessons:`, error);
          throw new Error(`Failed to create module: ${moduleData.title}`);
        }
      }

      // Refresh courses list to show the new course
      await refreshCourses();

      setShowSaveSuccess(true);
      // Reset form
      setNewCourse({
        title: '', subtitle: '', description: '', category: 'Infant Care', level: 'Beginner', price: '',
        image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop',
        instructorId: user?.id?.toString() || '',
        modules: [{ title: '', lessons: [{ title: '', type: 'video', duration: '' }] }],
      });

      setTimeout(() => {
        setShowSaveSuccess(false);
        setActiveTab('courses');
      }, 2000);
    } catch (error) {
      console.error('Error saving course:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save course');
    }
  };

  const handleSaveQuiz = () => {
    setShowSaveSuccess(true);
    setTimeout(() => { setShowSaveSuccess(false); setActiveTab('courses'); }, 2000);
  };

  const handleEditCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setNewCourse({
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        category: course.category,
        level: course.level,
        price: String(course.price),
        image: course.image,
        instructorId: String(course.instructorId || user?.id || ''),
        modules: course.modules.map(m => ({
          title: m.title,
          lessons: m.lessons.map(l => ({
            title: l.title,
            type: l.type || 'video',
            duration: l.duration || '',
          })),
        })),
      });
      setEditingCourseId(courseId);
      setActiveTab('create-course');
    }
  };

  const handleSaveEditCourse = async () => {
    if (!editingCourseId) return;
    
    try {
      setSaveError(null);

      if (!newCourse.title.trim()) {
        setSaveError('Course title is required');
        return;
      }

      if (!newCourse.instructorId) {
        setSaveError('Instructor is required');
        return;
      }

      const courseData = {
        title: newCourse.title,
        subtitle: newCourse.subtitle,
        description: newCourse.description,
        category: newCourse.category,
        level: newCourse.level,
        price: parseFloat(newCourse.price) || 0,
        image_url: newCourse.image,
      };

      await coursesApi.update(parseInt(editingCourseId), courseData);
      await refreshCourses();

      setShowSaveSuccess(true);
      setNewCourse({
        title: '', subtitle: '', description: '', category: 'Infant Care', level: 'Beginner', price: '',
        image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop',
        instructorId: user?.id?.toString() || '',
        modules: [{ title: '', lessons: [{ title: '', type: 'video', duration: '' }] }],
      });
      setEditingCourseId(null);

      setTimeout(() => {
        setShowSaveSuccess(false);
        setActiveTab('courses');
      }, 2000);
    } catch (error) {
      console.error('Error updating course:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to update course');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewCourse(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInstructorAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewInstructor(prev => ({ ...prev, avatar_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!deleteConfirmId) return;
    
    try {
      setIsDeleting(true);
      setSaveError(null);
      await coursesApi.delete(parseInt(courseId));
      await refreshCourses();
      setShowSaveSuccess(true);
      setDeleteConfirmId(null);
      
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error deleting course:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to delete course');
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetFeatured = async (courseId: string) => {
    try {
      setSaveError(null);
      const isFeatured = featuredCourseId === courseId ? false : true;
      await coursesApi.setFeatured(parseInt(courseId), isFeatured);
      setFeaturedCourseId(isFeatured ? courseId : null);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error setting featured course:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to set featured course');
    }
  };

  const handleAddInstructor = async () => {
    try {
      setSaveError(null);

      if (!newInstructor.email.trim()) {
        setSaveError('Email is required');
        return;
      }

      if (!newInstructor.title.trim()) {
        setSaveError('Instructor name/title is required');
        return;
      }

      setIsAddingInstructor(true);

      if (editingInstructorId) {
        // Edit mode - find and update the instructor in the list
        const instructorToUpdate = instructors.find(instr => instr.id === editingInstructorId);
        if (instructorToUpdate) {
          await usersApi.updateInstructor(instructorToUpdate.user_id, {
            title: newInstructor.title,
            bio: newInstructor.bio,
            avatar_url: newInstructor.avatar_url,
          });

          // Update in local state
          setInstructors(instructors.map(instr =>
            instr.id === editingInstructorId
              ? {
                  ...instr,
                  title: newInstructor.title,
                  bio: newInstructor.bio,
                  avatar_url: newInstructor.avatar_url,
                }
              : instr
          ));
        }
      } else {
        // Add mode
        const createdInstructor = await usersApi.createInstructor(newInstructor);

        // Add to instructors list
        setInstructors([...instructors, {
          id: String(createdInstructor.id),
          user_id: createdInstructor.user_id,
          title: createdInstructor.title,
          bio: createdInstructor.bio,
          avatar_url: createdInstructor.avatar_url,
          email: createdInstructor.email,
        }]);
      }

      setShowSaveSuccess(true);
      setNewInstructor({
        email: '',
        title: '',
        bio: '',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        specializations: [],
      });
      setEditingInstructorId(null);
      setShowAddInstructorModal(false);

      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving instructor:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save instructor');
    } finally {
      setIsAddingInstructor(false);
    }
  };

  const addModule = () => {
    setNewCourse(prev => ({
      ...prev,
      modules: [...prev.modules, { title: '', lessons: [{ title: '', type: 'video', duration: '' }] }],
    }));
  };

  const addLesson = (moduleIndex: number) => {
    setNewCourse(prev => {
      const modules = [...prev.modules];
      modules[moduleIndex] = {
        ...modules[moduleIndex],
        lessons: [...modules[moduleIndex].lessons, { title: '', type: 'video', duration: '' }],
      };
      return { ...prev, modules };
    });
  };

  const addQuestion = () => {
    setNewQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', explanation: '' }],
    }));
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'courses' as const, label: 'My Courses', icon: BookOpen },
    { id: 'create-course' as const, label: 'Create Course', icon: Plus },
    { id: 'create-quiz' as const, label: 'Create Quiz', icon: FileText },
    { id: 'instructors' as const, label: 'Instructors', icon: Users },
    { id: 'students' as const, label: 'Students', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      {showSaveSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
          <CheckCircle className="w-5 h-5" /> Saved successfully!
        </div>
      )}

      {/* Error Toast */}
      {saveError && (
        <div className="fixed top-20 right-4 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
          <span>✕</span> {saveError}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
            <p className="text-gray-500">Manage your courses, quizzes, and students</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statsDisplay.map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Top Courses */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Top Performing Courses</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">Course</th>
                      <th className="pb-3 font-medium">Enrolled</th>
                      <th className="pb-3 font-medium">Completion</th>
                      <th className="pb-3 font-medium">Rating</th>
                      <th className="pb-3 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.slice(0, 6).map(course => (
                      <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img src={course.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-medium text-gray-900">{course.title}</p>
                              <p className="text-xs text-gray-500">{course.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-gray-700">{course.enrolled.toLocaleString()}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.round(60 + Math.random() * 30)}%` }} />
                            </div>
                            <span className="text-gray-700">{Math.round(60 + Math.random() * 30)}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-700">{course.rating}</td>
                        <td className="py-3 font-medium text-gray-900">R{(course.enrolled * course.price * 0.7).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Enrollments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Active Courses ({courses.length})</h3>
              <div className="space-y-3">
                {courses.length > 0 ? (
                  courses.slice(0, 4).map(course => (
                    <div key={course.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <img src={course.image} alt="" className="w-8 h-8 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900"><span className="font-medium">{course.title}</span></p>
                        <p className="text-xs text-gray-500">{course.enrolled} students enrolled</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-teal-600">{course.rating}★</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No courses yet. Create your first course to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Courses */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Courses ({courses.length})</h2>
              <button
                onClick={() => setActiveTab('create-course')}
                className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Course
              </button>
            </div>
            <div className="grid gap-4">
              {courses.map(course => (
                <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <img src={course.image} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{course.title}</h3>
                      <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">Published</span>
                    </div>
                    <p className="text-sm text-gray-500">{course.category} · {course.level} · {course.modules.length} modules</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{course.enrolled} students</span>
                      <span>Rating: {course.rating}</span>
                      <span>R{course.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleSetFeatured(course.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        featuredCourseId === course.id
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                      }`}
                      title={featuredCourseId === course.id ? 'Remove from featured' : 'Mark as featured'}
                    >
                      <Award className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('course-detail', { courseId: course.id })}
                      className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditCourse(course.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(course.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Course?</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this course? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCourse(deleteConfirmId)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Course */}
        {activeTab === 'create-course' && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingCourseId ? 'Edit Course' : 'Create New Course'}</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                    <select
                      value={newCourse.instructorId}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, instructorId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select an instructor</option>
                      {instructors.map(instr => (
                        <option key={instr.id} value={instr.user_id}>
                          {instr.title} {instr.email && `(${instr.email})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Advanced Infant Care Techniques"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={newCourse.subtitle}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="A brief description of the course"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed course description..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Image URL</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newCourse.image}
                          onChange={(e) => setNewCourse(prev => ({ ...prev, image: e.target.value }))}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                        <label className="px-4 py-3 bg-teal-50 text-teal-600 border border-teal-200 rounded-xl text-sm font-medium hover:bg-teal-100 transition-colors cursor-pointer">
                          Browse
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {newCourse.image && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                          <img src={newCourse.image} alt="Course Preview" className="w-full h-full object-cover" onError={(e) => {e.currentTarget.src = 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop'}} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newCourse.category}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option>Infant Care</option>
                        <option>Toddler Development</option>
                        <option>Safety & Health</option>
                        <option>Professional Development</option>
                        <option>Special Needs</option>
                        <option>Curriculum Planning</option>
                        <option>Family Engagement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                      <select
                        value={newCourse.level}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, level: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (R)</label>
                    <input
                      type="number"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="49.99"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modules */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Course Modules</h3>
                <div className="space-y-4">
                  {newCourse.modules.map((module, mi) => (
                    <div key={mi} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-500">Module {mi + 1}</span>
                        {mi > 0 && (
                          <button
                            onClick={() => setNewCourse(prev => ({ ...prev, modules: prev.modules.filter((_, i) => i !== mi) }))}
                            className="ml-auto text-red-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => {
                          const modules = [...newCourse.modules];
                          modules[mi] = { ...modules[mi], title: e.target.value };
                          setNewCourse(prev => ({ ...prev, modules }));
                        }}
                        placeholder="Module title"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      {module.lessons.map((lesson, li) => (
                        <div key={li} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => {
                              const modules = [...newCourse.modules];
                              modules[mi].lessons[li] = { ...modules[mi].lessons[li], title: e.target.value };
                              setNewCourse(prev => ({ ...prev, modules }));
                            }}
                            placeholder="Lesson title"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                          <select
                            value={lesson.type}
                            onChange={(e) => {
                              const modules = [...newCourse.modules];
                              modules[mi].lessons[li] = { ...modules[mi].lessons[li], type: e.target.value };
                              setNewCourse(prev => ({ ...prev, modules }));
                            }}
                            className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                          >
                            <option value="video">Video</option>
                            <option value="reading">Reading</option>
                            <option value="activity">Activity</option>
                          </select>
                          <input
                            type="text"
                            value={lesson.duration}
                            onChange={(e) => {
                              const modules = [...newCourse.modules];
                              modules[mi].lessons[li] = { ...modules[mi].lessons[li], duration: e.target.value };
                              setNewCourse(prev => ({ ...prev, modules }));
                            }}
                            placeholder="Duration"
                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => addLesson(mi)}
                        className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 mt-2"
                      >
                        <PlusCircle className="w-4 h-4" /> Add Lesson
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addModule}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Module
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setActiveTab('courses');
                    setEditingCourseId(null);
                    setNewCourse({
                      title: '', subtitle: '', description: '', category: 'Infant Care', level: 'Beginner', price: '',
                      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop',
                      instructorId: user?.id?.toString() || '',
                      modules: [{ title: '', lessons: [{ title: '', type: 'video', duration: '' }] }],
                    });
                  }}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingCourseId ? handleSaveEditCourse : handleSaveCourse}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
                >
                  <Save className="w-4 h-4" /> {editingCourseId ? 'Update Course' : 'Save Course'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Quiz */}
        {activeTab === 'create-quiz' && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Quiz / Exam</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
                  <input
                    type="text"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Module 1 Assessment"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Associated Course</label>
                  <select
                    value={newQuiz.courseId}
                    onChange={(e) => setNewQuiz(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">Select a course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (min)</label>
                    <input
                      type="number"
                      value={newQuiz.timeLimit}
                      onChange={(e) => setNewQuiz(prev => ({ ...prev, timeLimit: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pass Score (%)</label>
                    <input
                      type="number"
                      value={newQuiz.passingScore}
                      onChange={(e) => setNewQuiz(prev => ({ ...prev, passingScore: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
                <div className="space-y-4">
                  {newQuiz.questions.map((q, qi) => (
                    <div key={qi} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-500">Question {qi + 1}</span>
                        {qi > 0 && (
                          <button
                            onClick={() => setNewQuiz(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qi) }))}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={q.question}
                        onChange={(e) => {
                          const questions = [...newQuiz.questions];
                          questions[qi] = { ...questions[qi], question: e.target.value };
                          setNewQuiz(prev => ({ ...prev, questions }));
                        }}
                        placeholder="Enter your question..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 resize-none focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const questions = [...newQuiz.questions];
                            questions[qi] = { ...questions[qi], type: e.target.value };
                            setNewQuiz(prev => ({ ...prev, questions }));
                          }}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="true-false">True/False</option>
                          <option value="short-answer">Short Answer</option>
                        </select>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={(e) => {
                            const questions = [...newQuiz.questions];
                            questions[qi] = { ...questions[qi], correctAnswer: e.target.value };
                            setNewQuiz(prev => ({ ...prev, questions }));
                          }}
                          placeholder="Correct answer"
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      {q.type === 'multiple-choice' && (
                        <div className="space-y-2 mb-3">
                          {q.options.map((opt, oi) => (
                            <input
                              key={oi}
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const questions = [...newQuiz.questions];
                                const options = [...questions[qi].options];
                                options[oi] = e.target.value;
                                questions[qi] = { ...questions[qi], options };
                                setNewQuiz(prev => ({ ...prev, questions }));
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                          ))}
                        </div>
                      )}
                      <textarea
                        value={q.explanation}
                        onChange={(e) => {
                          const questions = [...newQuiz.questions];
                          questions[qi] = { ...questions[qi], explanation: e.target.value };
                          setNewQuiz(prev => ({ ...prev, questions }));
                        }}
                        placeholder="Explanation for the correct answer..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addQuestion}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setActiveTab('courses')}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuiz}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructors Management */}
        {activeTab === 'instructors' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Manage Instructors</h2>
              <button
                onClick={() => setShowAddInstructorModal(true)}
                className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Instructor
              </button>
            </div>

            <div className="grid gap-4">
              {instructors.length > 0 ? (
                instructors.map(instructor => (
                  <div key={instructor.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <img 
                      src={instructor.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'} 
                      alt={instructor.title} 
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{instructor.title}</h3>
                      <p className="text-sm text-gray-500">{instructor.email}</p>
                      {instructor.bio && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{instructor.bio}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingInstructorId(instructor.id);
                          setNewInstructor({
                            email: instructor.email || '',
                            title: instructor.title || '',
                            bio: instructor.bio || '',
                            avatar_url: instructor.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                            specializations: [],
                          });
                          setShowAddInstructorModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Instructors Yet</h3>
                  <p className="text-gray-500 mb-4">Add instructors to assign them to courses.</p>
                  <button
                    onClick={() => setShowAddInstructorModal(true)}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                  >
                    Add First Instructor
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Instructor Modal */}
        {showAddInstructorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingInstructorId ? 'Edit Instructor' : 'Add New Instructor'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-end">
                      <label className="flex-1 px-4 py-3 bg-teal-50 text-teal-600 border border-teal-200 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors cursor-pointer">
                        Upload Avatar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleInstructorAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {newInstructor.avatar_url && (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border border-gray-200">
                        <img 
                          src={newInstructor.avatar_url} 
                          alt="Avatar Preview" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}} 
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email {editingInstructorId && '(Display Only)'}</label>
                  <input
                    type="email"
                    value={newInstructor.email}
                    onChange={(e) => !editingInstructorId && setNewInstructor(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!!editingInstructorId}
                    placeholder="instructor@example.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name/Title</label>
                  <input
                    type="text"
                    value={newInstructor.title}
                    onChange={(e) => setNewInstructor(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Dr. Maria Rodriguez"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={newInstructor.bio}
                    onChange={(e) => setNewInstructor(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Brief biography or credentials"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddInstructorModal(false);
                    setEditingInstructorId(null);
                    setNewInstructor({
                      email: '',
                      title: '',
                      bio: '',
                      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                      specializations: [],
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddInstructor}
                  disabled={isAddingInstructor}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {isAddingInstructor ? 'Saving...' : editingInstructorId ? 'Update Instructor' : 'Add Instructor'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Students */}
        {activeTab === 'students' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Course Analytics</h2>
            <div className="grid gap-6">
              {courses.length > 0 ? (
                courses.map(course => (
                  <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <img src={course.image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-500">{course.category} • {course.level}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{course.enrolled.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Students Enrolled</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{course.rating}★</p>
                        <p className="text-xs text-gray-500 mt-1">Course Rating</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">R{(course.price * course.enrolled * 0.7).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-gray-500 mt-1">Revenue Generated</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{course.modules?.length || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Modules</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first course to see student analytics and engagement metrics.</p>
                  <button
                    onClick={() => setActiveTab('create-course')}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                  >
                    Create Course
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorPanel;
