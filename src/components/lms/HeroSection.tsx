import React, { useState, useEffect } from 'react';
import { useLMS } from '@/contexts/LMSContext';
import { coursesApi } from '@/lib/api';
import { Play, BookOpen, Users, Award, ArrowRight, CheckCircle } from 'lucide-react';

const HeroSection: React.FC = () => {
  const { navigate } = useLMS();
  const [featuredCourse, setFeaturedCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedCourse = async () => {
      try {
        const course = await coursesApi.getFeatured();
        setFeaturedCourse(course);
      } catch (error) {
        console.error('Error fetching featured course:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedCourse();
  }, []);

  const stats = [
    { icon: BookOpen, value: '50+', label: 'Expert Courses' },
    { icon: Users, value: '15,000+', label: 'Active Learners' },
    { icon: Award, value: '8,500+', label: 'Certificates Issued' },
  ];

  const features = [
    'State-approved CEU credits',
    'Self-paced online learning',
    'Expert-led video courses',
    'Instant certificate generation',
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-700/50 backdrop-blur-sm text-teal-100 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Now enrolling for {new Date().getFullYear()} courses!
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Advance Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                Childcare Career
              </span>
            </h1>

            <p className="text-lg text-teal-100 mb-8 max-w-xl leading-relaxed">
              Professional development courses designed specifically for childcare providers. 
              Earn CEU credits, gain new skills, and make a greater impact on the children in your care.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-teal-100">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('catalog')}
                className="group flex items-center gap-2 bg-white text-teal-900 px-6 py-3.5 rounded-xl font-semibold hover:bg-teal-50 transition-all shadow-lg shadow-black/20"
              >
                Browse Courses
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('dashboard')}
                className="flex items-center gap-2 bg-teal-700/50 backdrop-blur-sm text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-teal-700/70 transition-all border border-teal-500/30"
              >
                <Play className="w-4 h-4" />
                My Dashboard
              </button>
            </div>
          </div>

          {/* Right Content - Featured Course Card */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl" />

              <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 shadow-2xl">
                <img
                  src={featuredCourse?.image || 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=600&h=300&fit=crop'}
                  alt="Featured course"
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full">Featured</span>
                  <span className="text-teal-200 text-xs">{featuredCourse?.duration || '10 hours'}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{featuredCourse?.title || 'Toddler Behavior & Guidance'}</h3>
                <p className="text-teal-200 text-sm mb-4">{featuredCourse?.description || 'Positive strategies for managing toddler behavior with evidence-based approaches.'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={featuredCourse?.instructorAvatar || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=40&h=40&fit=crop'}
                      alt="Instructor"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-teal-200 text-sm">{featuredCourse?.instructor || 'Childcare Training College'}</span>
                  </div>
                  <button
                    onClick={() => navigate('course-detail', { courseId: featuredCourse?.id || 'course-2' })}
                    className="text-emerald-300 text-sm font-semibold hover:text-emerald-200 transition-colors"
                  >
                    View Course →
                  </button>
                </div>
              </div>

              {/* Floating stats card */}
              {/* <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">987</p>
                  <p className="text-xs text-gray-500">Students enrolled</p>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 pt-8 border-t border-teal-700/50">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-700/50 rounded-xl mb-3">
                  <stat.icon className="w-6 h-6 text-emerald-300" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-teal-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
