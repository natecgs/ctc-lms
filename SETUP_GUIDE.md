# CTC LMS - Complete Database Integration Setup

This document provides a complete guide to setting up and running the CTC LMS application with PostgreSQL database backend.

## Project Structure

```
ctc-lms/
├── frontend (Vite + React + TypeScript)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── backend (Express.js + Node.js + PostgreSQL)
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── scripts/        # Database setup/seed
│   │   ├── server.ts       # Express app
│   │   ├── db.ts           # Database connection
│   │   └── types.ts        # TypeScript types
│   ├── database/
│   │   └── schema.sql      # PostgreSQL schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── README.md               # This file
```

## System Architecture

```
┌─────────────────────┐
│   React Frontend    │
│  (Vite + TypeScript)│
│  Port: 5173        │
└──────────┬──────────┘
           │ HTTP/REST
           ↓
┌──────────────────────────┐
│   Express.js Backend     │
│  (Node.js + TypeScript)  │
│  Port: 5000              │
└──────────┬───────────────┘
           │ SQL
           ↓
┌──────────────────────────┐
│   PostgreSQL Database    │
│  Port: 5432              │
│  Database: ctc_lms       │
└──────────────────────────┘
```

## Prerequisites

- **Node.js**: v16 or higher
- **npm**: v7 or higher (comes with Node.js)
- **PostgreSQL**: v12 or higher
- **Git**: For version control (optional)

## Quick Start

### 1. Clone or Extract Project

```bash
cd ctc-lms
```

### 2. Install Dependencies

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
cd ..
```

### 3. Setup PostgreSQL Database

#### Create Database

```bash
# Start PostgreSQL (if not already running)
# On Windows with PostgreSQL installed:
# The service is usually auto-started

# Connect to PostgreSQL with psql
psql -U postgres

# Create the database
CREATE DATABASE ctc_lms;

# Exit psql
\q
```

#### Initialize Schema

```bash
# Run the schema file to create all tables
psql -U postgres -d ctc_lms -f backend/database/schema.sql
```

### 4. Configure Environment Variables

#### Backend Configuration

```bash
cd backend
cp .env.example .env.local
```

Edit `backend/.env.local`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password  # Change this!
DB_NAME=ctc_lms

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration

The `.env.local` file is already created in the project root with:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CTC LMS
VITE_FRONTEND_URL=http://localhost:5173
```

### 5. Seed Database with Sample Data

```bash
cd backend
npm run build
npm run db:seed
cd ..
```

This will compile TypeScript and populate the database with sample courses and data.

### 6. Run the Application

#### Terminal 1: Backend Server

```bash
cd backend
npm run dev
# Server will start at http://localhost:5000
```

#### Terminal 2: Frontend Development Server

```bash
npm run dev
# App will open at http://localhost:5173
```

## Database Design

### Core Entities

#### Users & Authentication (`users` table)
- Stores user accounts with authentication provider IDs
- Roles: student, instructor, admin
- Tracks creation/update timestamps

#### Profiles (`profiles` table)
- Extended user information (name, avatar, location, etc.)
- One-to-one relationship with users table
- Tracks total hours learned

#### Instructors (`instructors` table)
- Additional instructor information
- Specializations, rating, course count
- Optional for instructor users

#### Courses (`courses` table)
- Course metadata (title, description, price, etc.)
- Instructor relationship
- Publishing status, ratings, enrollment count
- Tags, objectives, requirements

#### Content Hierarchy
- **Modules** (`modules` table) - Organize lessons within a course
- **Lessons** (`lessons` table) - Individual content units (video, reading, activity)
- **Quizzes** (`quizzes` table) - Assessment tools
- **Quiz Questions** (`quiz_questions` table) - Question items within quizzes

#### Learning Progress
- **Enrollments** (`enrollments` table) - User-Course relationships
- **Completed Lessons** (`completed_lessons` table) - Tracks which lessons are completed
- **Quiz Attempts** (`quiz_attempts` table) - Records of quiz submissions
- **Certificates** (`certificates` table) - Earned certificates with unique IDs

### Key Features

- **Automatic Progress Calculation**: Progress updates when lessons are completed
- **Auto Certificate Issuance**: Certificates are issued when progress reaches 100%
- **Best Quiz Score Tracking**: Stores best score even with multiple attempts
- **Audit Logging**: `audit_logs` table tracks system activity
- **Timestamps**: All tables include `created_at` and `updated_at` for audit trails

## API Endpoints

### Health Check
- `GET /api/health` - Check API server status

### Courses
- `GET /api/courses` - List all published courses
- `GET /api/courses/:id` - Get course details with modules and lessons
- `GET /api/courses/uuid/:uuid` - Get course by UUID
- `GET /api/courses/search/:query` - Search courses by title/description
- `GET /api/courses/category/:category` - Filter courses by category

### Quizzes
- `GET /api/quizzes/course/:courseId` - Get all quizzes for a course
- `GET /api/quizzes/:id` - Get quiz with all questions
- `GET /api/quizzes/uuid/:uuid` - Get quiz by UUID

### Enrollments & Progress
- `GET /api/enrollments/user/:userId` - Get user's course enrollments
- `GET /api/enrollments/user/:userId/course/:courseId` - Check if enrolled
- `POST /api/enrollments` - Enroll user in course
- `POST /api/enrollments/lessons/complete` - Mark lesson as complete
- `GET /api/enrollments/:userId/completed/:courseId` - List completed lessons
- `POST /api/enrollments/quiz/submit` - Submit quiz attempt
- `GET /api/enrollments/quiz/:userId` - Get quiz attempts history

### Certificates
- `GET /api/enrollments/certificates/:userId` - List user's certificates
- `GET /api/enrollments/certificate/verify/:uuid` - Verify certificate authenticity

### Users & Profiles
- `POST /api/users/get-or-create` - Create user if not exists
- `GET /api/users/:id` - Get user basic info
- `GET /api/users/:userId/profile` - Get user profile
- `PUT /api/users/:userId/profile` - Update user profile
- `GET /api/users/:userId/instructor` - Get instructor details
- `PUT /api/users/:userId/instructor` - Update instructor profile

## Frontend Integration

The frontend uses the API client in `src/lib/api.ts` which provides typed methods:

```typescript
import { coursesApi, enrollmentsApi, usersApi, quizzesApi } from '@/lib/api';

// Get all courses
const courses = await coursesApi.getAll();

// Get user enrollments
const enrollments = await enrollmentsApi.getUserEnrollments(userId);

// Complete a lesson
await enrollmentsApi.completeLesson(userId, lessonId, courseId);

// Submit quiz
await enrollmentsApi.submitQuiz(userId, quizId, courseId, score, answers);
```

## LMSContext Integration

The `LMSContext` has been updated to use the PostgreSQL backend API instead of hardcoded data:

- Courses are fetched from the `courses` API endpoint
- Enrollments are retrieved from the database
- Lesson completion is persisted to the database
- Quiz attempts are recorded and scored
- Certificates are automatically generated

## Running Individual Components

### Backend Only (API Server)
```bash
cd backend
npm run dev
# API available at http://localhost:5000/api
```

### Frontend Only
```bash
npm run dev
# Frontend at http://localhost:5173 (requires backend running)
```

### Build for Production

#### Frontend
```bash
npm run build    # Creates dist/ folder
npm run preview  # Preview production build locally
```

#### Backend
```bash
cd backend
npm run build    # Creates dist/ folder
npm start        # Run production server
```

## Troubleshooting

### PostgreSQL Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
1. Ensure PostgreSQL is running
2. Check connection details in `.env.local`
3. Verify database `ctc_lms` exists
4. Check username/password are correct

### Database Already Exists

```
ERROR: database "ctc_lms" already exists
```

**Solution**:
- If you need to reset: `psql -U postgres -c "DROP DATABASE ctc_lms;"`
- Then recreate the database and run schema import again

### Port Already in Use

For Backend (Port 5000):
```bash
# Windows
netstat -ano | findstr :5000
# Then kill the process or change PORT in .env.local
```

For Frontend (Port 5173):
- The dev server will automatically use next available port

### API Not Responding

1. Check backend server is running: `http://localhost:5000/api/health`
2. Verify `VITE_API_URL` in frontend `.env.local`
3. Check CORS settings in backend `src/server.ts`

### Missing Dependencies

```bash
# Reinstall all dependencies
npm install
cd backend && npm install && cd ..
```

## Development Workflow

### Adding a New Course

1. Manually insert into database or use admin panel
2. Set `is_published = true` to make visible
3. Frontend automatically fetches from API

### Creating a New User

```bash
curl -X POST http://localhost:5000/api/users/get-or-create \
  -H "Content-Type: application/json" \
  -d '{"authId":"user123","email":"user@example.com","role":"student"}'
```

### Enrolling in a Course

```bash
curl -X POST http://localhost:5000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"courseId":1}'
```

## Performance Considerations

- Database queries use indexes on frequently searched columns
- Pagination support on list endpoints for better performance
- Quiz attempts store all answers in JSONB for flexible schema
- Progress calculation is done in the database layer

## Security Notes

- All SQL queries use parameterized statements to prevent SQL injection
- CORS is configured to only allow the frontend URL
- Consider adding authentication middleware in production
- Helmet.js provides security headers
- Never commit `.env.local` with real credentials to version control

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up PostgreSQL database
3. ✅ Configure environment files
4. ✅ Run database schema and seed
5. ✅ Start backend server
6. ✅ Start frontend development server
7. Test the application at `http://localhost:5173`

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Support

For issues or questions, refer to:
- Backend: `backend/README.md`
- API Documentation: Available at `/api/health` endpoint
- Database Schema: `backend/database/schema.sql`
