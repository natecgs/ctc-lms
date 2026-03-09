import React from 'react';
import { LMSProvider, useLMS } from '@/contexts/LMSContext';
import Navbar from './lms/Navbar';
import HomePage from './lms/HomePage';
import CourseCatalog from './lms/CourseCatalog';
import CourseDetail from './lms/CourseDetail';
import LessonPlayer from './lms/LessonPlayer';
import QuizEngine from './lms/QuizEngine';
import StudentDashboard from './lms/StudentDashboard';
import InstructorPanel from './lms/InstructorPanel';
import CertificatesPage from './lms/CertificatesPage';
import ProfilePage from './lms/ProfilePage';
import AuthModal from './lms/AuthModal';
import Footer from './lms/Footer';

const LMSContent: React.FC = () => {
  const { currentView } = useLMS();

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomePage />;
      case 'catalog': return <CourseCatalog />;
      case 'course-detail': return <CourseDetail />;
      case 'lesson-player': return <LessonPlayer />;
      case 'quiz': return <QuizEngine />;
      case 'dashboard': return <StudentDashboard />;
      case 'instructor': return <InstructorPanel />;
      case 'certificates': return <CertificatesPage />;
      case 'profile': return <ProfilePage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {renderView()}
      </main>
      {currentView !== 'lesson-player' && currentView !== 'quiz' && <Footer />}
      <AuthModal />
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <LMSProvider>
      <LMSContent />
    </LMSProvider>
  );
};

export default AppLayout;
