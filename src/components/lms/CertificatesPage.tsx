import React from 'react';
import { useLMS } from '@/contexts/LMSContext';
import { Award, Download, Share2, Calendar, Clock, ExternalLink, LogIn } from 'lucide-react';

const CertificatesPage: React.FC = () => {
  const { student, navigate, courses, isLoggedIn, toggleAuth, setAuthMode } = useLMS();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your certificates</h2>
          <p className="text-gray-500 mb-4">Earn certificates by completing courses.</p>
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

  const earnedCertificates = student.enrolledCourses
    .filter(ec => ec.certificateEarned)
    .map(ec => {
      const course = courses.find(c => String(c.id) === String(ec.courseId));
      return { ...ec, course };
    })
    .filter(ec => ec.course);

  const inProgressCourses = student.enrolledCourses
    .filter(ec => !ec.certificateEarned && ec.progress > 0)
    .map(ec => {
      const course = courses.find(c => String(c.id) === String(ec.courseId));
      return { ...ec, course };
    })
    .filter(ec => ec.course);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-500">View and download your earned certificates</p>
        </div>

        {/* Earned Certificates */}
        {earnedCertificates.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {earnedCertificates.map(cert => (
              <div key={cert.courseId} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Certificate Preview */}
                <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20.5h-2zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H24v-2zm0 4h20v2H24v-2zm0 4h20v2H24v-2zm0 4h20v2H24v-2z\' fill=\'%23fff\' fill-opacity=\'.05\'/%3E%3C/svg%3E")',
                  }} />
                  <div className="relative">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-amber-300" />
                    </div>
                    <p className="text-teal-200 text-xs uppercase tracking-widest mb-2">Certificate of Completion</p>
                    <h3 className="text-white font-bold text-lg mb-2">{cert.course!.title}</h3>
                    <p className="text-teal-200 text-sm">Awarded to <span className="text-white font-semibold">{student.name}</span></p>
                    <div className="mt-4 flex items-center justify-center gap-4 text-teal-300 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(cert.enrolledDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {cert.course!.duration}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cert.course!.title}</p>
                    <p className="text-xs text-gray-500">{cert.course!.instructor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Share">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('course-detail', { courseId: cert.courseId })}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Course"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 mb-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
            <p className="text-gray-500 mb-4">Complete a course to earn your first certificate!</p>
            <button
              onClick={() => navigate('catalog')}
              className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        )}

        {/* In Progress */}
        {inProgressCourses.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">In Progress</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressCourses.map(ec => (
                <div
                  key={ec.courseId}
                  onClick={() => navigate('course-detail', { courseId: ec.courseId })}
                  className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img src={ec.course!.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{ec.course!.title}</h3>
                      <p className="text-xs text-gray-500">{ec.course!.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-semibold text-teal-600">{ec.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" style={{ width: `${ec.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;
