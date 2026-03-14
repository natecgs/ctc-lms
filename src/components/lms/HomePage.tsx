import React from 'react';
import { useLMS } from '@/contexts/LMSContext';
import HeroSection from './HeroSection';
import CourseCard from './CourseCard';
import {
  ArrowRight, Star, Users, BookOpen, Award, Shield,
  Clock, Zap, Heart, ChevronRight
} from 'lucide-react';

const HomePage: React.FC = () => {
  const { navigate, setSelectedCategory, courses } = useLMS();

  const popularCourses = [...courses].sort((a, b) => b.enrolled - a.enrolled).slice(0, 8);

  // Extract unique categories from courses
  const categories = Array.from(new Set(courses.map(c => c.category))).sort();

  const categoryIcons: Record<string, React.ReactNode> = {
    'Infant Care': <Heart className="w-6 h-6" />,
    'Toddler Development': <Zap className="w-6 h-6" />,
    'Safety & Health': <Shield className="w-6 h-6" />,
    'Professional Development': <Award className="w-6 h-6" />,
    'Special Needs': <Users className="w-6 h-6" />,
    'Curriculum Planning': <BookOpen className="w-6 h-6" />,
    'Family Engagement': <Heart className="w-6 h-6" />,
  };

  const categoryColors: Record<string, string> = {
    'Infant Care': 'from-pink-500 to-rose-600',
    'Toddler Development': 'from-amber-500 to-orange-600',
    'Safety & Health': 'from-red-500 to-red-600',
    'Professional Development': 'from-purple-500 to-indigo-600',
    'Special Needs': 'from-blue-500 to-cyan-600',
    'Curriculum Planning': 'from-teal-500 to-emerald-600',
    'Family Engagement': 'from-pink-400 to-fuchsia-600',
  };

  const testimonials = [
    {
      name: 'Amanda Torres',
      role: 'Lead Teacher, Bright Beginnings',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop',
      text: 'The courses here have transformed my approach to childcare. The content is practical, evidence-based, and immediately applicable in my classroom.',
      rating: 5,
    },
    {
      name: 'David Kim',
      role: 'Childcare Center Director',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop',
      text: 'I require all my staff to complete training through this platform. The quality of instruction and the convenience of online learning make it the perfect choice.',
      rating: 5,
    },
    {
      name: 'Rachel Green',
      role: 'Family Childcare Provider',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop',
      text: 'As a home-based provider, finding quality training was always a challenge. This platform made it easy to earn my CEU credits on my own schedule.',
      rating: 5,
    },
  ];

  const whyChooseUs = [
    { icon: Award, title: 'Accredited Courses', desc: 'All courses are approved for CEU credits by state licensing boards.' },
    { icon: Clock, title: 'Learn at Your Pace', desc: 'Self-paced courses that fit your busy schedule. Access anytime, anywhere.' },
    { icon: Users, title: 'Expert Instructors', desc: 'Learn from experienced professionals in early childhood education.' },
    { icon: Shield, title: 'Instant Certificates', desc: 'Download your certificates immediately upon course completion.' },
  ];

  return (
    <div>
      <HeroSection />

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Explore by Category</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Find the perfect course for your professional development needs</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.filter(c => c !== 'All Courses').map(cat => {
              const courseCount = courses.filter(c => c.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); navigate('catalog'); }}
                  className="group relative bg-white rounded-2xl border border-gray-200 p-6 text-left hover:shadow-xl hover:border-transparent transition-all overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[cat] || 'from-teal-500 to-teal-600'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10">
                    <div className={`w-12 h-12 bg-gradient-to-br ${categoryColors[cat] || 'from-teal-500 to-teal-600'} rounded-xl flex items-center justify-center text-white mb-4 group-hover:bg-white/20 transition-colors`}>
                      {categoryIcons[cat] || <BookOpen className="w-6 h-6" />}
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-white transition-colors mb-1">{cat}</h3>
                    <p className="text-sm text-gray-500 group-hover:text-white/80 transition-colors">{courseCount} courses</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Most Popular Courses</h2>
              <p className="text-gray-500">Join thousands of childcare professionals already learning</p>
            </div>
            <button
              onClick={() => navigate('catalog')}
              className="hidden sm:flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 transition-colors"
            >
              View All Courses <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <div className="sm:hidden text-center mt-8">
            <button
              onClick={() => navigate('catalog')}
              className="inline-flex items-center gap-2 text-teal-600 font-semibold"
            >
              View All Courses <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose Our Platform?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We're committed to providing the highest quality training for childcare professionals</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="text-center p-6 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-teal-200 transition-all">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {/* <section className="py-16 bg-gradient-to-br from-teal-900 to-teal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">What Our Students Say</h2>
            <p className="text-teal-200">Hear from childcare professionals who have transformed their careers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-teal-100 text-sm leading-relaxed mb-6">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-white font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-teal-300 text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Advance Your Career?</h2>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
            Join over 15,000 childcare professionals who trust our platform for their professional development. Start learning today!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('catalog')}
              className="group flex items-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-teal-700 transition-all shadow-lg shadow-teal-200"
            >
              Browse All Courses
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('dashboard')}
              className="px-8 py-4 rounded-xl font-semibold border-2 border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-700 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
