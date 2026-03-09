# CTC LMS - Quick Reference Guide

A quick reference for common tasks and important information.

## Quick Commands

### Setup (First Time)
```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Create database
psql -U postgres -c "CREATE DATABASE ctc_lms;"

# 3. Import schema
psql -U postgres -d ctc_lms -f backend/database/schema.sql

# 4. Seed data
cd backend && npm run db:seed && cd ..
```

### Development (Every Session)
```bash
# Terminal 1: Backend API server
cd backend && npm run dev

# Terminal 2: Frontend dev server
npm run dev
```

### Building for Production
```bash
# Build backend
cd backend && npm run build

# Build frontend
npm run build

# Run production versions
cd backend && npm start  # Terminal 1
npm run preview        # Terminal 2
```

## Project URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React app |
| Backend API | http://localhost:5000/api | Express server |
| Database | localhost:5432 | PostgreSQL |
| API Health | http://localhost:5000/api/health | Server status |

## Environment Variables

### Frontend `.env.local`
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CTC LMS
VITE_FRONTEND_URL=http://localhost:5173
```

### Backend `backend/.env.local`
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

## Common Tasks

### Testing an API Endpoint
```bash
# Get all courses
curl http://localhost:5000/api/courses

# Get specific course
curl http://localhost:5000/api/courses/1

# Create/get user
curl -X POST http://localhost:5000/api/users/get-or-create \
  -H "Content-Type: application/json" \
  -d '{"authId":"test123","email":"test@example.com"}'
```

### Checking Database
```bash
# Connect to database
psql -U postgres -d ctc_lms

# List tables
\dt

# Check courses
SELECT id, title, is_published FROM courses;

# Check enrollments
SELECT u.email, c.title, e.progress_percentage 
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id;
```

### Resetting Database
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE ctc_lms;"
psql -U postgres -c "CREATE DATABASE ctc_lms;"
psql -U postgres -d ctc_lms -f backend/database/schema.sql
cd backend && npm run db:seed
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/server.ts` | Express app configuration |
| `backend/src/db.ts` | Database connection |
| `backend/database/schema.sql` | Database structure |
| `src/lib/api.ts` | Frontend API client |
| `src/contexts/LMSContext.tsx` | App state management |
| `.env.local` | Frontend config |
| `backend/.env.local` | Backend config |

## API Methods (Frontend)

### Getting Data
```typescript
import { coursesApi, enrollmentsApi, usersApi, quizzesApi } from '@/lib/api';

// Courses
const courses = await coursesApi.getAll();
const course = await coursesApi.getById(1);

// Enrollments
const enrollments = await enrollmentsApi.getUserEnrollments(userId);
const isEnrolled = await enrollmentsApi.checkEnrollment(userId, courseId);

// Quizzes
const quizzes = await quizzesApi.getCourseLessons(courseId);
const quiz = await quizzesApi.getById(quizId);

// Users
const user = await usersApi.getOrCreate(authId, email);
const profile = await usersApi.getProfile(userId);
```

### Taking Actions
```typescript
// Enroll in course
await enrollmentsApi.enroll(userId, courseId);

// Complete lesson
await enrollmentsApi.completeLesson(userId, lessonId, courseId);

// Submit quiz
await enrollmentsApi.submitQuiz(userId, quizId, courseId, score, answers);

// Update profile
await usersApi.updateProfile(userId, { full_name: 'John Doe' });
```

## Database Schema Quick Reference

### Users Table
```sql
id (PK) | auth_id | email | role | is_active | created_at | updated_at
```

### Courses Table
```sql
id (PK) | uuid | instructor_id (FK) | title | subtitle | description | 
category | level | duration | price | rating | enrolled_count | 
image_url | tags | objectives | requirements | is_published | 
created_at | updated_at
```

### Enrollments Table
```sql
id (PK) | user_id (FK) | course_id (FK) | progress_percentage | 
certificate_earned | enrolled_at | last_accessed_at | completed_at | 
created_at | updated_at
```

### Modules Table
```sql
id (PK) | uuid | course_id (FK) | title | description | order_index | 
created_at | updated_at
```

### Lessons Table
```sql
id (PK) | uuid | module_id (FK) | title | content | lesson_type | 
duration | order_index | video_url | resources | created_at | updated_at
```

### Quizzes Table
```sql
id (PK) | uuid | course_id (FK) | module_id (FK) | title | description | 
passing_score | time_limit_minutes | is_exam | created_at | updated_at
```

### Quiz Questions Table
```sql
id (PK) | uuid | quiz_id (FK) | question_text | question_type | 
options (JSONB) | correct_answer | explanation | points | order_index | 
created_at | updated_at
```

### Completed Lessons Table
```sql
id (PK) | user_id (FK) | lesson_id (FK) | course_id (FK) | completed_at | created_at
```

### Quiz Attempts Table
```sql
id (PK) | user_id (FK) | quiz_id (FK) | course_id (FK) | score | passed | 
answers (JSONB) | time_spent_seconds | attempted_at | created_at
```

### Certificates Table
```sql
id (PK) | uuid | user_id (FK) | course_id (FK) | certificate_number | 
issued_at | created_at
```

## Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql -U postgres -c "\l"  # List databases

# Verify credentials in backend/.env.local
# Verify database exists
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname = 'ctc_lms';"
```

### "API not responding"
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check port not in use
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000

# Check CORS - should see request in DevTools Network tab
```

### "Courses not loading"
```bash
# Run seed script
cd backend && npm run db:seed

# Verify courses in database
psql -U postgres -d ctc_lms -c "SELECT COUNT(*) FROM courses WHERE is_published = true;"
```

### "Authentication fails"
```bash
# Check Supabase keys in frontend
# Verify user exists in Supabase

# Check user created in database
psql -U postgres -d ctc_lms -c "SELECT * FROM users WHERE email = 'user@example.com';"
```

## Performance Tips

1. **Database Indexes** - Already created on frequently queried columns
2. **Pagination** - Use limit/offset on list endpoints
3. **Caching** - Consider implementing with React Query
4. **Connection Pooling** - Already configured in `backend/src/db.ts`
5. **Query Optimization** - Use DevTools to monitor network requests

## Security Checklist

- [ ] Never commit `.env.local` to version control
- [ ] Use strong database passwords in production
- [ ] Enable HTTPS in production
- [ ] Configure CORS for production domain only
- [ ] Implement rate limiting
- [ ] Add input validation on frontend and backend
- [ ] Use parameterized queries (already done)
- [ ] Hash passwords for any user-created accounts
- [ ] Enable SQL query logging for audit trail

## Documentation Links

| Document | Content |
|----------|---------|
| `SETUP_GUIDE.md` | Comprehensive setup instructions |
| `MIGRATION_GUIDE.md` | Explanation of database integration |
| `SETUP_CHECKLIST.md` | Verification checklist |
| `backend/README.md` | Backend-specific documentation |
| `DATABASE_INTEGRATION_SUMMARY.md` | Overview of implementation |
| `src/lib/examples.ts` | Usage examples of all APIs |

## Getting Help

### Error in Console?
1. Check browser DevTools Network tab
2. Look at backend terminal for error messages
3. Search error in `SETUP_GUIDE.md` Troubleshooting
4. Check `src/lib/examples.ts` for correct usage

### Still Stuck?
1. Verify database connection: `psql -U postgres -d ctc_lms -c "\dt"`
2. Test backend: `curl http://localhost:5000/api/health`
3. Check `.env.local` files are correct
4. Restart both servers (kill and restart)
5. Clear browser cache (Ctrl+Shift+Delete)

## Useful VS Code Extensions

```json
{
  "recommended": [
    "ms-vscode.makefile-tools",           // Makefile support
    "ms-vscode.powershell",               // PowerShell terminal
    "ms-vscode-remote.remote-wsl",        // WSL support
    "GitHub.copilot",                     // AI assistance
    "esbenp.prettier-vscode",             // Code formatting
    "dbaeumer.vscode-eslint",             // ESLint
    "ms-mssql.sql-database-projects-vscode" // SQL support
  ]
}
```

## Important Reminders

⚠️ **DO NOT:**
- Commit `.env.local` files to git
- Use hardcoded API URLs in production
- Store passwords in environment files
- Run production database on localhost
- Skip database backups

✅ **DO:**
- Use `.env.example` as template
- Keep dependencies updated
- Monitor database performance
- Backup database regularly
- Test locally before deploying
- Document custom changes

---

Last Updated: February 28, 2026
