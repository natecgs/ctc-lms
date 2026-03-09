# CTC LMS Setup Checklist

Use this checklist to verify your setup is complete and working.

## Prerequisites

- [ ] Node.js v16+ installed: `node --version`
- [ ] npm v7+ installed: `npm --version`
- [ ] PostgreSQL v12+ installed
- [ ] PostgreSQL running (Windows: Services, Mac: brew services, Linux: systemctl)

## Project Setup

### Dependencies Installation
- [ ] Frontend dependencies installed: `npm install`
- [ ] Backend dependencies installed: `cd backend && npm install`

### Environment Configuration
- [ ] Frontend `.env.local` exists with `VITE_API_URL=http://localhost:5000/api`
- [ ] Backend `.env.local` exists with database credentials
- [ ] Verified PostgreSQL credentials in backend `.env.local`

## Database Setup

### PostgreSQL Database
- [ ] PostgreSQL is running
- [ ] Database `ctc_lms` created
  ```bash
  psql -U postgres -c "CREATE DATABASE ctc_lms;"
  ```
- [ ] Schema imported: `psql -U postgres -d ctc_lms -f backend/database/schema.sql`
- [ ] Verified tables exist:
  ```bash
  psql -U postgres -d ctc_lms -c "\dt"
  ```

### Sample Data
- [ ] Sample courses seeded: `cd backend && npm run db:seed`
- [ ] Verified data in database:
  ```bash
  psql -U postgres -d ctc_lms -c "SELECT COUNT(*) FROM courses;"
  ```

## Backend Server

### Start Backend
- [ ] Terminal 1: `cd backend && npm run dev`
- [ ] Backend starts without errors
- [ ] Server message shows: "🚀 Server running on http://localhost:5000"

### Verify Backend APIs
- [ ] Health check works: `curl http://localhost:5000/api/health`
- [ ] Courses endpoint works: `curl http://localhost:5000/api/courses`
- [ ] Response is valid JSON

### Database Connection
- [ ] No database connection errors in terminal
- [ ] Queries execute and return data
- [ ] No SQL syntax errors

## Frontend Application

### Start Frontend
- [ ] Terminal 2: `npm run dev`
- [ ] Frontend compiles without errors
- [ ] Message shows: "ready in X ms" or similar
- [ ] Browser opens to `http://localhost:5173`

### Verify Frontend
- [ ] Page loads successfully
- [ ] No 404 errors in console
- [ ] No CORS errors in console
- [ ] Available courses display

## Feature Testing

### Courses & Content
- [ ] Courses load from page
- [ ] Can view course details
- [ ] Course modules and lessons display
- [ ] Lesson content displays correctly

### User Authentication
- [ ] Can create test account via Supabase
- [ ] User profile page loads
- [ ] Profile information displays

### Enrollment
- [ ] Can enroll in a course
- [ ] Enrollment persists after page reload
- [ ] Course appears in dashboard

### Lesson Completion
- [ ] Can mark lesson as complete
- [ ] Progress updates (visible in UI)
- [ ] Progress saves to database

### Quizzes
- [ ] Quiz displays questions
- [ ] Can submit quiz answers
- [ ] Score calculates correctly
- [ ] Results display

### Certificates
- [ ] Complete a full course (100% progress)
- [ ] Certificate is generated
- [ ] Certificate appears in certificates page
- [ ] Can verify certificate

## Database Verification

### Check Tables
```bash
psql -U postgres -d ctc_lms

# List all tables
\dt

# Check row counts
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM enrollments;
SELECT COUNT(*) FROM completed_lessons;
SELECT COUNT(*) FROM quiz_attempts;
SELECT COUNT(*) FROM certificates;
```

### Check Specific Data
```sql
-- View all courses
SELECT id, title, is_published FROM courses;

-- View enrolled users
SELECT u.id, u.email, e.course_id, e.progress_percentage 
FROM enrollments e
JOIN users u ON e.user_id = u.id;

-- View completed lessons
SELECT cl.id, u.email, cl.lesson_id 
FROM completed_lessons cl
JOIN users u ON cl.user_id = u.id;
```

## API Testing

### Test API Endpoints

Using curl or Postman:

```bash
# Get all courses
curl http://localhost:5000/api/courses

# Get specific course
curl http://localhost:5000/api/courses/1

# Get quizzes for course 1
curl http://localhost:5000/api/quizzes/course/1

# Create test user
curl -X POST http://localhost:5000/api/users/get-or-create \
  -H "Content-Type: application/json" \
  -d '{"authId":"test123","email":"test@example.com","role":"student"}'

# Enroll user (use IDs from your database)
curl -X POST http://localhost:5000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"courseId":1}'
```

## Frontend Network Requests

### Check DevTools Network Tab
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Perform an action in the app
- [ ] Verify API requests appear (e.g., `/api/courses`)
- [ ] Check response status is 200/201 (not 404/500)
- [ ] Response JSON is valid

## Performance Checks

### Frontend
- [ ] Page loads in under 5 seconds
- [ ] No console errors or warnings
- [ ] No memory leaks in DevTools

### Backend
- [ ] Queries complete in under 100ms
- [ ] No error logs in terminal
- [ ] CPU usage is normal

## Common Issues & Fixes

### Issue: "Database connection refused"
- [ ] PostgreSQL is running
- [ ] Credentials in `.env.local` are correct
- [ ] Database `ctc_lms` exists

### Issue: "Courses not loading"
- [ ] Backend server is running
- [ ] Database has course data (run seed script)
- [ ] `VITE_API_URL` is correct in frontend `.env.local`

### Issue: "CORS error"
- [ ] Frontend URL matches `FRONTEND_URL` in backend `.env.local`
- [ ] Backend not running (should be on port 5000)
- [ ] Check browser console for exact error

### Issue: "Progress not updating"
- [ ] Backend is connected to database
- [ ] Network request [POST] appears in DevTools
- [ ] Response status is 200/201

### Issue: "Authentication fails"
- [ ] Supabase keys are correct
- [ ] User email matches Supabase account
- [ ] Check Supabase console for errors

## Production Pre-Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] No hardcoded localhost URLs
- [ ] Environment variables configured for production
- [ ] Database backups in place
- [ ] CORS configured to production domain only
- [ ] Security headers enabled
- [ ] API rate limiting configured
- [ ] Error logging configured
- [ ] Database indexes optimized

## Maintenance Tasks

### Regular Checks
- [ ] Monitor database disk space
- [ ] Review error logs weekly
- [ ] Backup database daily
- [ ] Update dependencies monthly

### Development Workflow
- [ ] Create new branch for features
- [ ] Test locally before committing
- [ ] Update documentation with changes
- [ ] Commit .env.local to .gitignore (DO NOT commit)

## Support Resources

- Backend docs: `backend/README.md`
- Setup guide: `SETUP_GUIDE.md`
- Migration guide: `MIGRATION_GUIDE.md`
- API examples: `src/lib/examples.ts`
- Database schema: `backend/database/schema.sql`

## Sign-Off

When all items are checked:

- [ ] Setup is complete and verified
- [ ] All features are working
- [ ] Database is populated
- [ ] Frontend and backend communicate
- [ ] Ready for development/production use

**Date Completed**: ___________
**Verified By**: ___________
