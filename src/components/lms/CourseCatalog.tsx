import React, { useState } from 'react';
import { useLMS } from '@/contexts/LMSContext';

import CourseCard from './CourseCard';
import { Search, SlidersHorizontal, Grid3X3, List, ChevronDown } from 'lucide-react';

const CourseCatalog: React.FC = () => {
  const { filteredCourses, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, courses } = useLMS();
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price-low' | 'price-high' | 'newest'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const categories = ['All Courses', ...Array.from(new Set(courses.map(c => c.category))).sort()];

  let displayCourses = [...filteredCourses];

  // Level filter
  if (selectedLevel !== 'All') {
    displayCourses = displayCourses.filter(c => c.level === selectedLevel);
  }

  // Sort
  switch (sortBy) {
    case 'popular': displayCourses.sort((a, b) => b.enrolled - a.enrolled); break;
    case 'rating': displayCourses.sort((a, b) => b.rating - a.rating); break;
    case 'price-low': displayCourses.sort((a, b) => a.price - b.price); break;
    case 'price-high': displayCourses.sort((a, b) => b.price - a.price); break;
    case 'newest': displayCourses.sort((a, b) => b.id.localeCompare(a.id)); break;
  }

  return (
    <section className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Course Catalog</h2>
          <p className="text-gray-600">Explore our comprehensive library of childcare training courses</p>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex items-center bg-gray-100 rounded-xl px-4 py-3 gap-3 focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white transition-all">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by course name, topic, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-sm">
                  Clear
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none bg-gray-100 rounded-xl px-4 py-3 pr-10 text-sm text-gray-700 font-medium cursor-pointer hover:bg-gray-200 transition-colors outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  showFilters ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>

              <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-400'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Level</label>
                  <div className="flex flex-wrap gap-2">
                    {levels.map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedLevel === level
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{displayCourses.length}</span> courses
            {searchQuery && <span> for "<span className="text-teal-600">{searchQuery}</span>"</span>}
          </p>
        </div>

        {/* Course Grid */}
        {displayCourses.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'flex flex-col gap-4'
          }>
            {displayCourses.map(course => (
              <CourseCard key={course.id} course={course} variant={viewMode === 'list' ? 'compact' : 'default'} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All Courses'); setSelectedLevel('All'); }}
              className="text-teal-600 font-medium hover:text-teal-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CourseCatalog;
