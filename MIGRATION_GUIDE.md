# Migration Guide: From Hardcoded Data to PostgreSQL Backend

This guide explains how the CTC LMS has been updated to use PostgreSQL instead of hardcoded data.

## What Changed

### Before: Hardcoded Data
- All courses, lessons, quizzes were stored in `src/data/lmsData.ts`
- Student progress was stored in browser state/context
- No persistent data storage
- One user profile used for testing

### After: PostgreSQL Database
- All content is stored in PostgreSQL database
- User data is persisted across sessions
- Real-time progress tracking
- Support for multiple users
- Certificate generation

## Database Tables

The new system uses these main tables:

### Content Tables
- `courses` - Course information
- `modules` - Course modules
- `lessons` - Individual lessons
- `quizzes` - Quiz definitions
- `quiz_questions` - Quiz questions

### User Tables
- `users` - User accounts
- `profiles` - User profile information
- `instructors` - Instructor-specific data

### Progress Tables
- `enrollments` - Course enrollments with progress
- `completed_lessons` - Completed lesson tracking
- `quiz_attempts` - Quiz submission history
- `certificates` - Earned certificates

## API Endpoints

The backend provides REST API endpoints for all operations:

```
GET  /api/courses                    # List all courses
GET  /api/courses/:id               # Get course details
POST /api/enrollments               # Enroll in course
POST /api/enrollments/lessons/complete  # Mark lesson complete
POST /api/enrollments/quiz/submit   # Submit quiz
GET  /api/enrollments/user/:userId  # Get user enrollments
```

See `backend/README.md` for complete API documentation.

## Frontend Changes

### API Client

A new API client is available in `src/lib/api.ts`:

```typescript
import { coursesApi, enrollmentsApi, usersApi, quizzesApi } from '@/lib/api';

// Fetch courses from database
const courses = await coursesApi.getAll();

// Get user enrollments
const enrollments = await enrollmentsApi.getUserEnrollments(userId);

// Complete a lesson
await enrollmentsApi.completeLesson(userId, lessonId, courseId);
```

### LMSContext Updates

The `LMSContext` now:
- Fetches courses from the database API instead of `lmsData.ts`
- Uses Supabase for authentication
- Persists user enrollment data to database
- Automatically calculates progress
- Issues certificates when progress reaches 100%

Example usage:

```typescript
import { useLMS } from '@/contexts/LMSContext';

function MyComponent() {
  const { 
    student,           // Current student profile from database
    navigate,
    enrollInCourse,    // Calls database API
    completeLessonAction,  // Calls database API
    isEnrolled,
    getEnrolledCourse
  } = useLMS();

  return (
    // Component code
  );
}
```

## Data Migration

### Seed Script

The database is populated with sample data using:

```bash
cd backend
npm run db:seed
```

This script:
- Creates a default instructor user
- Inserts all courses from the sample data
- Creates modules, lessons, and quizzes
- Sets up the database structure

### Adding More Courses

To add more courses:

1. Update `backend/src/scripts/seedDB.ts` with new course data
2. Run `npm run db:seed` to populate
3. Or insert directly into database using SQL

Example SQL:
```sql
INSERT INTO courses (
  uuid, instructor_id, title, subtitle, description, 
  category, level, duration, price, image_url, is_published
) VALUES (
  'uuid-here', 1, 'Course Title', 'Subtitle', 'Description',
  'Category', 'Beginner', '8 hours', 49.99, 
  'http://image-url.com/image.jpg', true
);
```

## Environment Configuration

### Backend (.env.local)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ctc_lms
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CTC LMS
VITE_FRONTEND_URL=http://localhost:5173
```

## Running the Application

### Development

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### Production

```bash
cd backend
npm run build
npm start

# In another terminal
npm run build
npm run preview
```

## Key Features

### Automatic Progress Calculation

When a lesson is marked complete:
1. Record saved to `completed_lessons` table
2. Progress percentage calculated in database
3. Enrollment progress updated
4. If progress >= 100%, certificate issued automatically

### Quiz Scoring

When a quiz is submitted:
1. Attempt recorded in `quiz_attempts` table
2. User's best score tracked
3. Quiz results available for review

### User Persistence

User data is retained in:
- `profiles` table - Basic user info
- `enrollments` table - Course enrollments
- `completed_lessons` table - Progress tracking
- `quiz_attempts` table - Quiz history
- `certificates` table - Earned certificates

## Troubleshooting

### Courses Not Showing

1. Check if database is connected (API health check)
2. Verify courses exist in database: 
   ```sql
   SELECT * FROM courses WHERE is_published = true;
   ```
3. Check frontend `VITE_API_URL` configuration

### Progress Not Updating

1. Verify backend is running
2. Check network requests in browser DevTools
3. Confirm lesson exists in database

### Auth Issues

1. Check Supabase configuration
2. Verify user is created in database
3. Check browser console for errors

## Switching Back to Hardcoded Data

If needed to revert (not recommended):

1. Keep `src/data/lmsData.ts` - it's still available
2. Update `LMSContext` to use imported courses instead of API
3. Remove API calls for enrollments/progress

## Performance Considerations

- Database indexes on frequently queried columns
- Efficient SQL queries with proper JOINs
- Pagination support for large course lists
- JSON storage for flexible schema (quiz answers, arrays)

## Security Notes

- All API requests should authenticate users (add auth middleware as needed)
- SQL queries use parameterized statements
- CORS configured to allow only frontend domain
- Passwords hashed for future authentication features

## Next Steps

1. Start both backend and frontend servers
2. Test the application at `http://localhost:5173`
3. Create an account and enroll in a course
4. Complete lessons to test progress tracking
5. Submit a quiz to verify scoring
6. Check certificate generation at 100% progress

## Additional Information

- Full setup guide: `SETUP_GUIDE.md`
- Backend documentation: `backend/README.md`
- Database schema: `backend/database/schema.sql`
- API client implementation: `src/lib/api.ts`
