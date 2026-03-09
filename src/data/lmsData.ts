export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'activity';
  content: string;
  completed?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  courseId: string;
  moduleIndex: number;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number; // minutes
  isExam?: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  quizId?: string;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  lessons: number;
  modules: Module[];
  instructor: string;
  instructorTitle: string;
  instructorAvatar: string;
  instructorBio?: string;
  instructorRating?: number;
  instructorTotalCourses?: number;
  instructorId?: number;
  image: string;
  price: number;
  rating: number;
  enrolled: number;
  objectives: string[];
  requirements: string[];
  tags: string[];
}

export interface EnrolledCourse {
  courseId: string;
  progress: number;
  completedLessons: string[];
  quizScores: Record<string, number>;
  enrolledDate: string;
  lastAccessed: string;
  certificateEarned: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'instructor' | 'admin';
  enrolledCourses: EnrolledCourse[];
  certificates: string[];
  totalHoursLearned: number;
  joinDate: string;
}

export const categories = [
  'All Courses',
  'Infant Care',
  'Toddler Development',
  'Safety & Health',
  'Professional Development',
  'Special Needs',
  'Curriculum Planning',
  'Family Engagement',
];

export const courses: Course[] = [
  {
    id: 'course-1',
    title: 'Infant Care Fundamentals',
    subtitle: 'Essential skills for caring for infants aged 0-12 months',
    description: 'This comprehensive course covers everything you need to know about providing high-quality care for infants. From feeding and diapering to developmental milestones and safe sleep practices, you will gain the knowledge and confidence to excel in infant care.',
    category: 'Infant Care',
    level: 'Beginner',
    duration: '8 hours',
    lessons: 24,
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
          { id: 'l-1-1-1', title: 'Welcome & Course Overview', duration: '10 min', type: 'video', content: 'Welcome to Infant Care Fundamentals! In this course, you will learn the essential skills needed to provide excellent care for infants aged 0-12 months. We will cover developmental milestones, feeding, sleep safety, and much more.' },
          { id: 'l-1-1-2', title: 'Understanding Infant Growth Stages', duration: '25 min', type: 'video', content: 'Infants go through remarkable changes in their first year. This lesson covers the key physical, cognitive, and social-emotional milestones you should expect and monitor.' },
          { id: 'l-1-1-3', title: 'The Role of the Caregiver', duration: '15 min', type: 'reading', content: 'As a caregiver, you play a crucial role in an infant\'s development. Learn about attachment theory, responsive caregiving, and how your interactions shape brain development.' },
        ],
        quizId: 'quiz-1-1',
      },
      {
        id: 'mod-1-2',
        title: 'Feeding & Nutrition',
        lessons: [
          { id: 'l-1-2-1', title: 'Breastfeeding Support Basics', duration: '20 min', type: 'video', content: 'Learn how to support breastfeeding mothers, proper storage of breast milk, and how to identify feeding cues in infants.' },
          { id: 'l-1-2-2', title: 'Formula Preparation & Safety', duration: '15 min', type: 'video', content: 'Proper formula preparation is critical for infant health. This lesson covers types of formula, preparation steps, and safety guidelines.' },
          { id: 'l-1-2-3', title: 'Introduction to Solid Foods', duration: '20 min', type: 'reading', content: 'When and how to introduce solid foods is an important milestone. Learn about readiness signs, appropriate first foods, and allergy awareness.' },
        ],
        quizId: 'quiz-1-2',
      },
      {
        id: 'mod-1-3',
        title: 'Safe Sleep Practices',
        lessons: [
          { id: 'l-1-3-1', title: 'AAP Safe Sleep Guidelines', duration: '20 min', type: 'video', content: 'The American Academy of Pediatrics provides clear guidelines for safe infant sleep. Learn the ABCs of safe sleep and how to create a safe sleep environment.' },
          { id: 'l-1-3-2', title: 'Creating a Safe Sleep Environment', duration: '15 min', type: 'activity', content: 'Practice setting up a safe crib environment. Identify and remove potential hazards, and learn about proper crib standards.' },
        ],
      },
    ],
  },
  {
    id: 'course-2',
    title: 'Toddler Behavior & Guidance',
    subtitle: 'Positive strategies for managing toddler behavior',
    description: 'Learn evidence-based strategies for understanding and guiding toddler behavior. This course covers developmental expectations, positive discipline techniques, and how to create environments that support healthy social-emotional development.',
    category: 'Toddler Development',
    level: 'Intermediate',
    duration: '10 hours',
    lessons: 30,
    instructor: 'Maria Rodriguez, M.Ed.',
    instructorTitle: 'Child Behavior Specialist',
    instructorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=600&h=400&fit=crop',
    price: 59.99,
    rating: 4.9,
    enrolled: 987,
    objectives: [
      'Understand typical toddler behavior and developmental expectations',
      'Implement positive guidance strategies effectively',
      'Create environments that minimize challenging behaviors',
      'Support social-emotional development through daily interactions',
      'Communicate effectively with families about behavior concerns',
    ],
    requirements: ['Basic understanding of child development', '6+ months experience in childcare'],
    tags: ['toddler', 'behavior', 'positive discipline', 'guidance'],
    modules: [
      {
        id: 'mod-2-1',
        title: 'Understanding Toddler Development',
        lessons: [
          { id: 'l-2-1-1', title: 'The Toddler Brain', duration: '20 min', type: 'video', content: 'Understanding how the toddler brain works helps us respond appropriately to their behavior. Learn about brain development, emotional regulation, and why toddlers act the way they do.' },
          { id: 'l-2-1-2', title: 'Developmental Milestones 12-36 Months', duration: '25 min', type: 'video', content: 'Explore the key developmental milestones for toddlers, including language, motor skills, and social-emotional development.' },
          { id: 'l-2-1-3', title: 'Temperament & Individual Differences', duration: '15 min', type: 'reading', content: 'Every toddler is unique. Learn about temperament types and how to adapt your caregiving approach to each child.' },
        ],
        quizId: 'quiz-2-1',
      },
      {
        id: 'mod-2-2',
        title: 'Positive Guidance Strategies',
        lessons: [
          { id: 'l-2-2-1', title: 'Setting Appropriate Limits', duration: '20 min', type: 'video', content: 'Learn how to set clear, consistent, and developmentally appropriate limits for toddlers.' },
          { id: 'l-2-2-2', title: 'Redirecting & Distraction Techniques', duration: '15 min', type: 'activity', content: 'Practice redirecting toddler behavior using positive techniques that respect the child\'s autonomy.' },
        ],
      },
    ],
  },
  {
    id: 'course-3',
    title: 'Child Safety & First Aid',
    subtitle: 'Comprehensive safety training for childcare professionals',
    description: 'This essential course covers all aspects of child safety in childcare settings, including first aid, CPR basics, emergency preparedness, and creating safe indoor and outdoor environments.',
    category: 'Safety & Health',
    level: 'Beginner',
    duration: '6 hours',
    lessons: 18,
    instructor: 'James Thompson, RN',
    instructorTitle: 'Pediatric Nurse & Safety Trainer',
    instructorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop',
    price: 39.99,
    rating: 4.7,
    enrolled: 2156,
    objectives: [
      'Perform basic first aid for common childhood injuries',
      'Conduct thorough safety inspections of childcare environments',
      'Develop and implement emergency action plans',
      'Recognize signs of child abuse and understand mandatory reporting',
      'Maintain proper health and hygiene standards',
    ],
    requirements: ['No prior experience required'],
    tags: ['safety', 'first aid', 'CPR', 'emergency', 'health'],
    modules: [
      {
        id: 'mod-3-1',
        title: 'Emergency Preparedness',
        lessons: [
          { id: 'l-3-1-1', title: 'Creating an Emergency Action Plan', duration: '20 min', type: 'video', content: 'Every childcare facility needs a comprehensive emergency action plan. Learn how to create, implement, and practice emergency procedures.' },
          { id: 'l-3-1-2', title: 'Fire Safety & Evacuation', duration: '15 min', type: 'video', content: 'Fire safety is critical in childcare settings. Learn about fire prevention, evacuation routes, and conducting fire drills with young children.' },
          { id: 'l-3-1-3', title: 'Natural Disaster Preparedness', duration: '20 min', type: 'reading', content: 'Be prepared for natural disasters including earthquakes, tornadoes, and severe weather. Learn about shelter-in-place procedures and emergency supply kits.' },
        ],
        quizId: 'quiz-3-1',
      },
      {
        id: 'mod-3-2',
        title: 'Basic First Aid',
        lessons: [
          { id: 'l-3-2-1', title: 'Treating Common Injuries', duration: '25 min', type: 'video', content: 'Learn how to treat cuts, bruises, bumps, and other common childhood injuries with proper first aid techniques.' },
          { id: 'l-3-2-2', title: 'Choking Response', duration: '20 min', type: 'video', content: 'Choking is a leading cause of injury in young children. Learn the proper response techniques for infants and children.' },
        ],
      },
    ],
  },
  {
    id: 'course-4',
    title: 'Curriculum Design for Early Learners',
    subtitle: 'Create engaging, developmentally appropriate curricula',
    description: 'Master the art of designing curricula that engage young learners and support their development across all domains. This course covers planning frameworks, assessment strategies, and creating inclusive learning experiences.',
    category: 'Curriculum Planning',
    level: 'Intermediate',
    duration: '12 hours',
    lessons: 36,
    instructor: 'Dr. Emily Chen',
    instructorTitle: 'Curriculum Development Expert',
    instructorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop',
    price: 79.99,
    rating: 4.9,
    enrolled: 654,
    objectives: [
      'Design age-appropriate curriculum frameworks',
      'Integrate play-based learning across all developmental domains',
      'Create inclusive activities for diverse learners',
      'Implement authentic assessment strategies',
      'Align curriculum with state early learning standards',
    ],
    requirements: ['1+ year experience in early childhood education', 'Basic understanding of child development'],
    tags: ['curriculum', 'planning', 'lesson plans', 'activities'],
    modules: [
      {
        id: 'mod-4-1',
        title: 'Foundations of Curriculum Design',
        lessons: [
          { id: 'l-4-1-1', title: 'Curriculum Frameworks Overview', duration: '25 min', type: 'video', content: 'Explore different curriculum frameworks used in early childhood education, including HighScope, Creative Curriculum, and Reggio Emilia.' },
          { id: 'l-4-1-2', title: 'Understanding Learning Standards', duration: '20 min', type: 'reading', content: 'Learn about state and national early learning standards and how to align your curriculum with these benchmarks.' },
          { id: 'l-4-1-3', title: 'Planning for All Domains', duration: '30 min', type: 'video', content: 'Effective curriculum addresses all developmental domains: cognitive, physical, social-emotional, and language. Learn how to plan holistically.' },
        ],
        quizId: 'quiz-4-1',
      },
    ],
  },
  {
    id: 'course-5',
    title: 'Supporting Children with Special Needs',
    subtitle: 'Inclusive practices for diverse learning needs',
    description: 'Develop the skills and knowledge to effectively support children with special needs in inclusive childcare settings. Learn about common disabilities, individualized planning, and collaboration with families and specialists.',
    category: 'Special Needs',
    level: 'Advanced',
    duration: '14 hours',
    lessons: 42,
    instructor: 'Dr. Lisa Park',
    instructorTitle: 'Special Education Consultant',
    instructorAvatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop',
    price: 89.99,
    rating: 4.8,
    enrolled: 432,
    objectives: [
      'Identify common developmental delays and disabilities',
      'Implement individualized education strategies',
      'Create inclusive classroom environments',
      'Collaborate effectively with families and specialists',
      'Understand legal requirements including ADA and IDEA',
    ],
    requirements: ['2+ years experience in childcare', 'Completion of a basic child development course'],
    tags: ['special needs', 'inclusion', 'disabilities', 'IEP'],
    modules: [
      {
        id: 'mod-5-1',
        title: 'Understanding Special Needs',
        lessons: [
          { id: 'l-5-1-1', title: 'Overview of Common Disabilities', duration: '30 min', type: 'video', content: 'Learn about autism spectrum disorder, ADHD, speech and language delays, and other common conditions you may encounter in childcare.' },
          { id: 'l-5-1-2', title: 'Early Identification & Screening', duration: '25 min', type: 'video', content: 'Early identification is key to getting children the support they need. Learn about developmental screening tools and red flags.' },
          { id: 'l-5-1-3', title: 'Person-First Language & Attitudes', duration: '15 min', type: 'reading', content: 'Language matters. Learn about person-first language, avoiding stereotypes, and fostering positive attitudes toward disability.' },
        ],
        quizId: 'quiz-5-1',
      },
    ],
  },
  {
    id: 'course-6',
    title: 'Family Communication & Engagement',
    subtitle: 'Building strong partnerships with families',
    description: 'Effective family engagement is essential for quality childcare. This course teaches communication strategies, conflict resolution, and how to build meaningful partnerships with diverse families.',
    category: 'Family Engagement',
    level: 'Beginner',
    duration: '6 hours',
    lessons: 18,
    instructor: 'Patricia Williams, LCSW',
    instructorTitle: 'Family Services Coordinator',
    instructorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=600&h=400&fit=crop',
    price: 34.99,
    rating: 4.6,
    enrolled: 876,
    objectives: [
      'Develop effective communication strategies with families',
      'Navigate difficult conversations with empathy and professionalism',
      'Create welcoming environments for diverse families',
      'Implement family engagement activities and events',
      'Document and share children\'s progress effectively',
    ],
    requirements: ['No prior experience required'],
    tags: ['family', 'communication', 'engagement', 'partnerships'],
    modules: [
      {
        id: 'mod-6-1',
        title: 'Communication Foundations',
        lessons: [
          { id: 'l-6-1-1', title: 'Active Listening Skills', duration: '15 min', type: 'video', content: 'Active listening is the foundation of effective communication. Learn techniques to truly hear and understand families.' },
          { id: 'l-6-1-2', title: 'Written Communication Best Practices', duration: '20 min', type: 'reading', content: 'From newsletters to daily reports, written communication is key. Learn how to write clearly, professionally, and warmly.' },
        ],
      },
    ],
  },
  {
    id: 'course-7',
    title: 'Nutrition & Meal Planning',
    subtitle: 'Healthy eating for growing children',
    description: 'Learn how to plan nutritious meals and snacks for children in childcare settings. This course covers dietary guidelines, food allergies, mealtime routines, and creating positive eating environments.',
    category: 'Safety & Health',
    level: 'Beginner',
    duration: '5 hours',
    lessons: 15,
    instructor: 'Amanda Foster, RD',
    instructorTitle: 'Registered Dietitian',
    instructorAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&h=400&fit=crop',
    price: 29.99,
    rating: 4.5,
    enrolled: 1567,
    objectives: [
      'Plan balanced meals following USDA guidelines for childcare',
      'Manage food allergies and dietary restrictions safely',
      'Create positive mealtime environments',
      'Teach children about healthy eating habits',
    ],
    requirements: ['No prior experience required'],
    tags: ['nutrition', 'meals', 'food safety', 'health'],
    modules: [
      {
        id: 'mod-7-1',
        title: 'Nutrition Basics for Children',
        lessons: [
          { id: 'l-7-1-1', title: 'USDA Guidelines for Childcare', duration: '20 min', type: 'video', content: 'Understanding USDA nutrition guidelines helps ensure children receive proper nutrition. Learn about food groups, portion sizes, and meal patterns.' },
          { id: 'l-7-1-2', title: 'Managing Food Allergies', duration: '25 min', type: 'video', content: 'Food allergies can be life-threatening. Learn how to identify, manage, and prevent allergic reactions in childcare settings.' },
        ],
        quizId: 'quiz-7-1',
      },
    ],
  },
  {
    id: 'course-8',
    title: 'Professional Ethics in Childcare',
    subtitle: 'Ethical standards and professional conduct',
    description: 'Explore the ethical responsibilities of childcare professionals. This course covers the NAEYC Code of Ethics, professional boundaries, confidentiality, and ethical decision-making in complex situations.',
    category: 'Professional Development',
    level: 'Intermediate',
    duration: '4 hours',
    lessons: 12,
    instructor: 'Dr. Robert Kim',
    instructorTitle: 'Ethics & Professional Development Trainer',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop',
    price: 24.99,
    rating: 4.7,
    enrolled: 543,
    objectives: [
      'Understand the NAEYC Code of Ethical Conduct',
      'Apply ethical decision-making frameworks',
      'Maintain professional boundaries appropriately',
      'Handle confidential information responsibly',
    ],
    requirements: ['Currently working in or studying childcare'],
    tags: ['ethics', 'professional', 'NAEYC', 'conduct'],
    modules: [
      {
        id: 'mod-8-1',
        title: 'Foundations of Professional Ethics',
        lessons: [
          { id: 'l-8-1-1', title: 'NAEYC Code of Ethics Overview', duration: '20 min', type: 'video', content: 'The NAEYC Code of Ethical Conduct provides a framework for ethical decision-making. Learn about its core values and ideals.' },
          { id: 'l-8-1-2', title: 'Ethical Dilemmas in Practice', duration: '25 min', type: 'activity', content: 'Work through real-world ethical scenarios and practice applying the code of ethics to complex situations.' },
        ],
        quizId: 'quiz-8-1',
      },
    ],
  },
  {
    id: 'course-9',
    title: 'Creative Arts in Early Childhood',
    subtitle: 'Fostering creativity through art, music, and movement',
    description: 'Discover how to integrate creative arts into your childcare program. This course covers visual arts, music, dramatic play, and movement activities that support development and self-expression.',
    category: 'Curriculum Planning',
    level: 'Beginner',
    duration: '7 hours',
    lessons: 21,
    instructor: 'Jennifer Adams, M.A.',
    instructorTitle: 'Arts Education Specialist',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop',
    price: 44.99,
    rating: 4.8,
    enrolled: 789,
    objectives: [
      'Plan process-oriented art activities for young children',
      'Integrate music and movement into daily routines',
      'Support dramatic play and creative expression',
      'Create an environment that encourages creativity',
    ],
    requirements: ['No prior experience required'],
    tags: ['arts', 'music', 'creativity', 'movement', 'play'],
    modules: [
      {
        id: 'mod-9-1',
        title: 'Visual Arts for Young Children',
        lessons: [
          { id: 'l-9-1-1', title: 'Process vs. Product Art', duration: '15 min', type: 'video', content: 'Understanding the difference between process and product art is fundamental. Learn why process art is more developmentally appropriate for young children.' },
          { id: 'l-9-1-2', title: 'Age-Appropriate Art Materials', duration: '20 min', type: 'reading', content: 'Choosing the right materials for different age groups ensures safety and engagement. Explore materials from finger paints to collage supplies.' },
        ],
      },
    ],
  },
  {
    id: 'course-10',
    title: 'Outdoor Learning Environments',
    subtitle: 'Designing and utilizing outdoor spaces for learning',
    description: 'Transform your outdoor spaces into rich learning environments. This course covers nature-based learning, outdoor safety, garden activities, and how to extend indoor curriculum to outdoor settings.',
    category: 'Curriculum Planning',
    level: 'Intermediate',
    duration: '6 hours',
    lessons: 18,
    instructor: 'David Martinez, Ph.D.',
    instructorTitle: 'Environmental Education Expert',
    instructorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=600&h=400&fit=crop',
    price: 44.99,
    rating: 4.6,
    enrolled: 345,
    objectives: [
      'Design engaging outdoor learning environments',
      'Implement nature-based curriculum activities',
      'Ensure outdoor safety for all age groups',
      'Integrate outdoor learning with indoor curriculum',
    ],
    requirements: ['Basic understanding of early childhood education'],
    tags: ['outdoor', 'nature', 'environment', 'garden'],
    modules: [
      {
        id: 'mod-10-1',
        title: 'Designing Outdoor Spaces',
        lessons: [
          { id: 'l-10-1-1', title: 'Elements of Effective Outdoor Environments', duration: '25 min', type: 'video', content: 'Learn about the key elements that make outdoor spaces effective for learning, including natural materials, sensory experiences, and risk-taking opportunities.' },
          { id: 'l-10-1-2', title: 'Safety in Outdoor Settings', duration: '20 min', type: 'video', content: 'Outdoor safety requires careful planning. Learn about supervision strategies, hazard identification, and age-appropriate risk management.' },
        ],
        quizId: 'quiz-10-1',
      },
    ],
  },
  {
    id: 'course-11',
    title: 'Language & Literacy Development',
    subtitle: 'Building strong foundations for reading and communication',
    description: 'Support children\'s language and literacy development from birth through age 5. This course covers oral language, phonological awareness, print concepts, and creating literacy-rich environments.',
    category: 'Toddler Development',
    level: 'Intermediate',
    duration: '9 hours',
    lessons: 27,
    instructor: 'Dr. Karen White',
    instructorTitle: 'Literacy Development Researcher',
    instructorAvatar: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop',
    price: 54.99,
    rating: 4.9,
    enrolled: 678,
    objectives: [
      'Support oral language development across age groups',
      'Implement phonological awareness activities',
      'Create literacy-rich classroom environments',
      'Select and use high-quality children\'s literature',
      'Support dual language learners effectively',
    ],
    requirements: ['Basic understanding of child development'],
    tags: ['language', 'literacy', 'reading', 'communication'],
    modules: [
      {
        id: 'mod-11-1',
        title: 'Foundations of Language Development',
        lessons: [
          { id: 'l-11-1-1', title: 'How Children Learn Language', duration: '25 min', type: 'video', content: 'Understanding how children acquire language helps us support their development. Explore theories of language development and key milestones.' },
          { id: 'l-11-1-2', title: 'Creating a Language-Rich Environment', duration: '20 min', type: 'video', content: 'The environment plays a crucial role in language development. Learn how to set up spaces that encourage communication and literacy.' },
        ],
        quizId: 'quiz-11-1',
      },
    ],
  },
  {
    id: 'course-12',
    title: 'Child Abuse Prevention & Reporting',
    subtitle: 'Mandatory reporter training for childcare professionals',
    description: 'This critical training covers recognizing signs of child abuse and neglect, understanding mandatory reporting laws, and implementing prevention strategies in your childcare program.',
    category: 'Safety & Health',
    level: 'Beginner',
    duration: '4 hours',
    lessons: 12,
    instructor: 'Angela Davis, MSW',
    instructorTitle: 'Child Welfare Specialist',
    instructorAvatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1509909756405-be0199881695?w=600&h=400&fit=crop',
    price: 19.99,
    rating: 4.8,
    enrolled: 3421,
    objectives: [
      'Recognize physical, emotional, and behavioral signs of abuse and neglect',
      'Understand mandatory reporting laws and procedures',
      'Implement prevention strategies in childcare settings',
      'Support children and families affected by abuse',
    ],
    requirements: ['No prior experience required', 'Required for all childcare professionals'],
    tags: ['abuse prevention', 'mandatory reporting', 'child protection'],
    modules: [
      {
        id: 'mod-12-1',
        title: 'Recognizing Abuse & Neglect',
        lessons: [
          { id: 'l-12-1-1', title: 'Types of Child Abuse', duration: '25 min', type: 'video', content: 'Learn about the four types of child maltreatment: physical abuse, emotional abuse, sexual abuse, and neglect. Understand the signs and indicators of each.' },
          { id: 'l-12-1-2', title: 'Behavioral Indicators', duration: '20 min', type: 'video', content: 'Children may not verbally disclose abuse, but their behavior can tell us a lot. Learn about behavioral indicators that may signal abuse or neglect.' },
        ],
        quizId: 'quiz-12-1',
      },
    ],
  },
  {
    id: 'course-13',
    title: 'STEM Activities for Preschoolers',
    subtitle: 'Hands-on science, technology, engineering, and math',
    description: 'Bring STEM to life in your preschool classroom with hands-on, age-appropriate activities. This course covers inquiry-based learning, simple experiments, building challenges, and mathematical thinking.',
    category: 'Curriculum Planning',
    level: 'Intermediate',
    duration: '8 hours',
    lessons: 24,
    instructor: 'Dr. Michael Lee',
    instructorTitle: 'STEM Education Researcher',
    instructorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&h=400&fit=crop',
    price: 54.99,
    rating: 4.7,
    enrolled: 567,
    objectives: [
      'Design inquiry-based STEM activities for preschoolers',
      'Integrate technology appropriately in early childhood settings',
      'Support mathematical thinking through play',
      'Create engineering challenges for young learners',
    ],
    requirements: ['Experience working with preschool-aged children'],
    tags: ['STEM', 'science', 'math', 'engineering', 'technology'],
    modules: [
      {
        id: 'mod-13-1',
        title: 'Introduction to Early STEM',
        lessons: [
          { id: 'l-13-1-1', title: 'Why STEM Matters in Early Childhood', duration: '15 min', type: 'video', content: 'STEM skills begin developing in the earliest years. Learn why early STEM education matters and how young children are natural scientists.' },
          { id: 'l-13-1-2', title: 'Inquiry-Based Learning Approach', duration: '25 min', type: 'video', content: 'Inquiry-based learning puts children at the center of their learning. Learn how to facilitate investigations and support children\'s natural curiosity.' },
        ],
        quizId: 'quiz-13-1',
      },
    ],
  },
  {
    id: 'course-14',
    title: 'Infant & Toddler Mental Health',
    subtitle: 'Supporting social-emotional wellness from birth',
    description: 'Understand the foundations of infant and toddler mental health and learn strategies to support healthy social-emotional development in the earliest years of life.',
    category: 'Infant Care',
    level: 'Advanced',
    duration: '10 hours',
    lessons: 30,
    instructor: 'Dr. Sarah Mitchell',
    instructorTitle: 'Early Childhood Development Specialist',
    instructorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=400&fit=crop',
    price: 69.99,
    rating: 4.9,
    enrolled: 321,
    objectives: [
      'Understand attachment theory and its implications for caregiving',
      'Recognize signs of social-emotional concerns in infants and toddlers',
      'Implement relationship-based caregiving practices',
      'Support families in promoting infant mental health',
    ],
    requirements: ['Completion of Infant Care Fundamentals or equivalent', '1+ year experience with infants/toddlers'],
    tags: ['mental health', 'social-emotional', 'attachment', 'wellness'],
    modules: [
      {
        id: 'mod-14-1',
        title: 'Attachment & Relationships',
        lessons: [
          { id: 'l-14-1-1', title: 'Attachment Theory Basics', duration: '25 min', type: 'video', content: 'John Bowlby\'s attachment theory is foundational to understanding infant mental health. Learn about attachment styles and their impact on development.' },
          { id: 'l-14-1-2', title: 'Building Secure Attachments in Care', duration: '20 min', type: 'video', content: 'As a caregiver, you can support secure attachment through responsive, consistent care. Learn practical strategies for building strong relationships.' },
        ],
        quizId: 'quiz-14-1',
      },
    ],
  },
  {
    id: 'course-15',
    title: 'Childcare Business Management',
    subtitle: 'Running a successful childcare program',
    description: 'Learn the business side of childcare including licensing, budgeting, staffing, marketing, and quality improvement. Perfect for directors and aspiring program leaders.',
    category: 'Professional Development',
    level: 'Advanced',
    duration: '16 hours',
    lessons: 48,
    instructor: 'Patricia Williams, LCSW',
    instructorTitle: 'Family Services Coordinator',
    instructorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    price: 99.99,
    rating: 4.7,
    enrolled: 234,
    objectives: [
      'Navigate childcare licensing requirements',
      'Develop and manage program budgets',
      'Recruit, train, and retain quality staff',
      'Market your childcare program effectively',
      'Implement quality improvement processes',
    ],
    requirements: ['3+ years experience in childcare', 'Interest in program leadership'],
    tags: ['business', 'management', 'licensing', 'leadership'],
    modules: [
      {
        id: 'mod-15-1',
        title: 'Licensing & Regulations',
        lessons: [
          { id: 'l-15-1-1', title: 'Understanding Licensing Requirements', duration: '30 min', type: 'video', content: 'Childcare licensing varies by state but shares common elements. Learn about the licensing process, requirements, and maintaining compliance.' },
          { id: 'l-15-1-2', title: 'Quality Rating Systems', duration: '25 min', type: 'reading', content: 'Quality Rating and Improvement Systems (QRIS) help programs improve quality. Learn about QRIS standards and how to achieve higher ratings.' },
        ],
        quizId: 'quiz-15-1',
      },
    ],
  },
  {
    id: 'course-16',
    title: 'Diversity & Cultural Competence',
    subtitle: 'Creating culturally responsive childcare environments',
    description: 'Build your cultural competence and learn to create inclusive, anti-bias environments that celebrate diversity and support all children and families.',
    category: 'Professional Development',
    level: 'Intermediate',
    duration: '8 hours',
    lessons: 24,
    instructor: 'Maria Rodriguez, M.Ed.',
    instructorTitle: 'Child Behavior Specialist',
    instructorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
    price: 44.99,
    rating: 4.8,
    enrolled: 456,
    objectives: [
      'Examine personal biases and cultural assumptions',
      'Implement anti-bias curriculum approaches',
      'Create culturally responsive environments',
      'Support children\'s identity development',
      'Engage diverse families respectfully',
    ],
    requirements: ['Open mind and willingness to self-reflect'],
    tags: ['diversity', 'culture', 'inclusion', 'anti-bias'],
    modules: [
      {
        id: 'mod-16-1',
        title: 'Understanding Cultural Competence',
        lessons: [
          { id: 'l-16-1-1', title: 'What is Cultural Competence?', duration: '20 min', type: 'video', content: 'Cultural competence is a journey, not a destination. Learn about the continuum of cultural competence and where you are on it.' },
          { id: 'l-16-1-2', title: 'Examining Personal Biases', duration: '25 min', type: 'activity', content: 'Self-reflection is essential for cultural growth. Engage in activities designed to help you examine your own biases and assumptions.' },
        ],
        quizId: 'quiz-16-1',
      },
    ],
  },
];

export const quizzes: Quiz[] = [
  {
    id: 'quiz-1-1',
    title: 'Infant Development Basics',
    courseId: 'course-1',
    moduleIndex: 0,
    passingScore: 70,
    timeLimit: 15,
    questions: [
      {
        id: 'q-1-1-1',
        question: 'At what age do most infants begin to sit without support?',
        type: 'multiple-choice',
        options: ['2-3 months', '4-5 months', '6-7 months', '9-10 months'],
        correctAnswer: '6-7 months',
        explanation: 'Most infants develop the core strength to sit independently around 6-7 months of age.',
        points: 10,
      },
      {
        id: 'q-1-1-2',
        question: 'Responsive caregiving supports secure attachment in infants.',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Research consistently shows that responsive, consistent caregiving is the foundation of secure attachment.',
        points: 10,
      },
      {
        id: 'q-1-1-3',
        question: 'Which of the following is NOT a typical milestone for a 3-month-old infant?',
        type: 'multiple-choice',
        options: ['Social smiling', 'Tracking objects with eyes', 'Walking independently', 'Cooing and babbling'],
        correctAnswer: 'Walking independently',
        explanation: 'Walking independently typically occurs around 12 months. At 3 months, infants are developing social smiling, visual tracking, and early vocalizations.',
        points: 10,
      },
      {
        id: 'q-1-1-4',
        question: 'What is the recommended room temperature for infant sleep environments?',
        type: 'multiple-choice',
        options: ['60-65°F', '68-72°F', '75-80°F', '80-85°F'],
        correctAnswer: '68-72°F',
        explanation: 'The AAP recommends keeping the room temperature between 68-72°F (20-22°C) for safe infant sleep.',
        points: 10,
      },
      {
        id: 'q-1-1-5',
        question: 'Describe one way a caregiver can support an infant\'s cognitive development during daily routines.',
        type: 'short-answer',
        correctAnswer: 'narrate',
        explanation: 'Narrating daily activities, providing sensory experiences, playing peek-a-boo, and offering age-appropriate toys are all ways to support cognitive development.',
        points: 10,
      },
    ],
  },
  {
    id: 'quiz-1-2',
    title: 'Feeding & Nutrition Quiz',
    courseId: 'course-1',
    moduleIndex: 1,
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        id: 'q-1-2-1',
        question: 'At what age is it generally recommended to introduce solid foods to infants?',
        type: 'multiple-choice',
        options: ['2 months', '4 months', 'Around 6 months', '9 months'],
        correctAnswer: 'Around 6 months',
        explanation: 'The AAP recommends introducing solid foods around 6 months of age when infants show signs of readiness.',
        points: 10,
      },
      {
        id: 'q-1-2-2',
        question: 'Breast milk should be stored at room temperature for no more than 4 hours.',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Freshly expressed breast milk can be stored at room temperature (up to 77°F) for up to 4 hours.',
        points: 10,
      },
      {
        id: 'q-1-2-3',
        question: 'Which of the following is a common food allergen that should be introduced carefully?',
        type: 'multiple-choice',
        options: ['Rice cereal', 'Bananas', 'Peanuts', 'Sweet potatoes'],
        correctAnswer: 'Peanuts',
        explanation: 'Peanuts are one of the top 8 food allergens. Current guidelines recommend early introduction under guidance.',
        points: 10,
      },
    ],
  },
  {
    id: 'quiz-2-1',
    title: 'Toddler Development Quiz',
    courseId: 'course-2',
    moduleIndex: 0,
    passingScore: 70,
    timeLimit: 15,
    questions: [
      {
        id: 'q-2-1-1',
        question: 'Tantrums in toddlers are primarily a result of poor parenting.',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Tantrums are a normal part of toddler development, resulting from immature emotional regulation and communication skills.',
        points: 10,
      },
      {
        id: 'q-2-1-2',
        question: 'Which part of the brain is last to fully develop, making emotional regulation difficult for toddlers?',
        type: 'multiple-choice',
        options: ['Amygdala', 'Prefrontal cortex', 'Hippocampus', 'Cerebellum'],
        correctAnswer: 'Prefrontal cortex',
        explanation: 'The prefrontal cortex, responsible for impulse control and emotional regulation, continues developing into the mid-20s.',
        points: 10,
      },
      {
        id: 'q-2-1-3',
        question: 'What is the most effective first response to a toddler\'s challenging behavior?',
        type: 'multiple-choice',
        options: ['Time out', 'Acknowledging their feelings', 'Ignoring the behavior', 'Offering a reward'],
        correctAnswer: 'Acknowledging their feelings',
        explanation: 'Acknowledging feelings helps toddlers feel understood and begins the process of emotional co-regulation.',
        points: 10,
      },
    ],
  },
  {
    id: 'quiz-3-1',
    title: 'Emergency Preparedness Quiz',
    courseId: 'course-3',
    moduleIndex: 0,
    passingScore: 80,
    timeLimit: 10,
    questions: [
      {
        id: 'q-3-1-1',
        question: 'How often should fire drills be conducted in a childcare facility?',
        type: 'multiple-choice',
        options: ['Once a year', 'Every 6 months', 'Monthly', 'Weekly'],
        correctAnswer: 'Monthly',
        explanation: 'Most state licensing regulations require monthly fire drills in childcare facilities.',
        points: 10,
      },
      {
        id: 'q-3-1-2',
        question: 'Emergency contact information should be easily accessible to all staff.',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'All staff should have quick access to emergency contacts, medical information, and emergency procedures.',
        points: 10,
      },
    ],
  },
  // Final exam
  {
    id: 'exam-1',
    title: 'Infant Care Fundamentals - Final Exam',
    courseId: 'course-1',
    moduleIndex: -1,
    passingScore: 80,
    timeLimit: 45,
    isExam: true,
    questions: [
      {
        id: 'e-1-1',
        question: 'According to the AAP, infants should always be placed on their back to sleep.',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'The "Back to Sleep" campaign recommends placing infants on their backs for every sleep to reduce SIDS risk.',
        points: 15,
      },
      {
        id: 'e-1-2',
        question: 'Which of the following items should NOT be in an infant\'s crib?',
        type: 'multiple-choice',
        options: ['Fitted sheet', 'Stuffed animals', 'Firm mattress', 'None of the above'],
        correctAnswer: 'Stuffed animals',
        explanation: 'Cribs should be bare except for a fitted sheet on a firm mattress. Stuffed animals, blankets, and pillows are suffocation hazards.',
        points: 15,
      },
      {
        id: 'e-1-3',
        question: 'At what age do most infants say their first words?',
        type: 'multiple-choice',
        options: ['6 months', '9 months', '12 months', '18 months'],
        correctAnswer: '12 months',
        explanation: 'Most infants say their first recognizable words around 12 months, though babbling begins much earlier.',
        points: 15,
      },
      {
        id: 'e-1-4',
        question: 'What is the primary benefit of tummy time for infants?',
        type: 'multiple-choice',
        options: ['Better sleep', 'Strengthening neck and shoulder muscles', 'Faster weight gain', 'Improved hearing'],
        correctAnswer: 'Strengthening neck and shoulder muscles',
        explanation: 'Tummy time helps infants develop the neck, shoulder, and core muscles needed for rolling, crawling, and sitting.',
        points: 15,
      },
      {
        id: 'e-1-5',
        question: 'Explain why responsive caregiving is important for infant brain development.',
        type: 'short-answer',
        correctAnswer: 'neural connections',
        explanation: 'Responsive caregiving creates serve-and-return interactions that build neural connections, support attachment, and promote healthy brain architecture.',
        points: 20,
      },
    ],
  },
];

export const defaultStudentProfile: StudentProfile = {
  id: 'student-1',
  name: 'Jessica Anderson',
  email: 'jessica.anderson@email.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  role: 'student',
  enrolledCourses: [
    {
      courseId: 'course-1',
      progress: 65,
      completedLessons: ['l-1-1-1', 'l-1-1-2', 'l-1-1-3', 'l-1-2-1', 'l-1-2-2'],
      quizScores: { 'quiz-1-1': 90 },
      enrolledDate: '2026-01-15',
      lastAccessed: '2026-02-27',
      certificateEarned: false,
    },
    {
      courseId: 'course-3',
      progress: 100,
      completedLessons: ['l-3-1-1', 'l-3-1-2', 'l-3-1-3', 'l-3-2-1', 'l-3-2-2'],
      quizScores: { 'quiz-3-1': 95, 'exam-3': 88 },
      enrolledDate: '2025-11-01',
      lastAccessed: '2026-02-20',
      certificateEarned: true,
    },
    {
      courseId: 'course-4',
      progress: 30,
      completedLessons: ['l-4-1-1'],
      quizScores: {},
      enrolledDate: '2026-02-10',
      lastAccessed: '2026-02-25',
      certificateEarned: false,
    },
    {
      courseId: 'course-7',
      progress: 100,
      completedLessons: ['l-7-1-1', 'l-7-1-2'],
      quizScores: { 'quiz-7-1': 85 },
      enrolledDate: '2025-10-05',
      lastAccessed: '2026-01-15',
      certificateEarned: true,
    },
  ],
  certificates: ['course-3', 'course-7'],
  totalHoursLearned: 42,
  joinDate: '2025-09-01',
};
