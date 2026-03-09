import { query, getClient } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

// Seed data structure
interface SeedCourse {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  instructor: string;
  instructorTitle: string;
  instructorAvatar: string;
  image: string;
  price: number;
  rating: number;
  enrolled: number;
  objectives: string[];
  requirements: string[];
  tags: string[];
  modules: SeedModule[];
}

interface SeedModule {
  id: string;
  title: string;
  lessons: SeedLesson[];
  quizId?: string;
}

interface SeedLesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'activity';
  content: string;
}

interface SeedQuiz {
  id: string;
  title: string;
  courseId: string;
  moduleIndex: number;
  questions: SeedQuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  isExam?: boolean;
}

interface SeedQuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

// Sample seed data - This would normally be imported from lmsData.ts
const sampleCourses: SeedCourse[] = [
  {
    id: 'course-1',
    title: 'Infant Care Fundamentals',
    subtitle: 'Essential skills for caring for infants aged 0-12 months',
    description:
      'This comprehensive course covers everything you need to know about providing high-quality care for infants. From feeding and diapering to developmental milestones and safe sleep practices, you will gain the knowledge and confidence to excel in infant care.',
    category: 'Infant Care',
    level: 'Beginner',
    duration: '8 hours',
    instructor: 'Dr. Sarah Mitchell',
    instructorTitle: 'Early Childhood Development Specialist',
    instructorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop',
    price: 49.99,
    rating: 4.8,
    enrolled: 1243,
    objectives: [
      'Understand infant developmental milestones from birth to 12 months',
      'Master safe feeding practices including breastfeeding support and bottle preparation',
      'Implement safe sleep environments following current AAP guidelines',
      'Recognize signs of common infant illnesses and when to seek medical attention',
      'Create age-appropriate sensory and motor development activities',
    ],
    requirements: ['No prior experience required', 'Access to a computer or mobile device'],
    tags: ['infant', 'newborn', 'baby care', 'development'],
    modules: [
      {
        id: 'mod-1-1',
        title: 'Introduction to Infant Development',
        lessons: [
          {
            id: 'l-1-1-1',
            title: 'Welcome & Course Overview',
            duration: '10 min',
            type: 'video',
            content:
              'Welcome to Infant Care Fundamentals! In this course, you will learn the essential skills needed to provide excellent care for infants aged 0-12 months.',
          },
          {
            id: 'l-1-1-2',
            title: 'Understanding Infant Growth Stages',
            duration: '25 min',
            type: 'video',
            content:
              'Infants go through remarkable changes in their first year. This lesson covers the key physical, cognitive, and social-emotional milestones.',
          },
        ],
        quizId: 'quiz-1-1',
      },
    ],
  },
];

async function seedDatabase() {
  const client = await getClient();

  try {
    console.log('🌱 Starting database seed...');

    // Create a default instructor user
    console.log('Creating default instructor user...');
    const userResult = await client.query(
      `INSERT INTO users (auth_id, email, role) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (auth_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      ['instructor-seed', 'instructor@ctc-lms.com', 'instructor']
    );

    const instructorUserId = userResult.rows[0].id;

    // Create instructor profile
    const instrResult = await client.query(
      `INSERT INTO instructors (user_id, title, bio, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [
        instructorUserId,
        'Course Instructor',
        'Professional child care educator',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      ]
    );

    const instructorId = instrResult.rows[0].id;

    // Seed courses
    console.log('Seeding courses...');
    for (const course of sampleCourses) {
      const courseUuid = uuidv4();
      const courseResult = await client.query(
        `INSERT INTO courses (
          uuid, instructor_id, title, subtitle, description, category, level,
          duration, price, rating, enrolled_count, image_url, tags, objectives, requirements, is_published
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::text[], $14::text[], $15::text[], true)
         RETURNING id`,
        [
          courseUuid,
          instructorId,
          course.title,
          course.subtitle,
          course.description,
          course.category,
          course.level,
          course.duration,
          course.price,
          course.rating,
          course.enrolled,
          course.image,
          course.tags,
          course.objectives,
          course.requirements,
        ]
      );

      const courseId = courseResult.rows[0].id;
      console.log(`✓ Created course: ${course.title}`);

      // Seed modules
      for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
        const module = course.modules[moduleIndex];
        const moduleUuid = uuidv4();

        const moduleResult = await client.query(
          `INSERT INTO modules (uuid, course_id, title, description, order_index)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [moduleUuid, courseId, module.title, '', moduleIndex]
        );

        const moduleId = moduleResult.rows[0].id;

        // Seed lessons
        for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
          const lesson = module.lessons[lessonIndex];
          const lessonUuid = uuidv4();

          await client.query(
            `INSERT INTO lessons (
              uuid, module_id, title, content, lesson_type, duration, order_index
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              lessonUuid,
              moduleId,
              lesson.title,
              lesson.content,
              lesson.type,
              lesson.duration,
              lessonIndex,
            ]
          );
        }
      }
    }

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
