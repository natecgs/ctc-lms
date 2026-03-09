# CTC LMS Backend Setup Guide

This guide will help you set up and run the Express.js backend for the CTC LMS application with PostgreSQL database.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and update with your database credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database connection details:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=ctc_lms

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ctc_lms;

# Exit psql
\q
```

### 4. Initialize Database Schema

Run the SQL schema file to create all tables:

```bash
psql -U postgres -d ctc_lms -f backend/database/schema.sql
```

Or alternatively, during development:

```bash
npm run db:setup
```

### 5. Seed Initial Data (Optional)

To populate the database with sample courses and data:

```bash
npm run db:seed
```

## Running the Server

### Development Mode

With hot-reload enabled using tsx:

```bash
npm run dev
```

The server will start at `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express app setup
│   ├── db.ts                  # Database connection pool
│   ├── types.ts               # TypeScript type definitions
│   ├── models/
│   │   ├── CourseModel.ts     # Course data queries
│   │   ├── ContentModel.ts    # Modules, Lessons, Quizzes
│   │   └── UserModel.ts       # Users, Profiles, Enrollments
│   ├── routes/
│   │   ├── courses.ts         # Course API endpoints
│   │   ├── quizzes.ts         # Quiz API endpoints
│   │   ├── enrollments.ts     # Enrollment API endpoints
│   │   └── users.ts           # User API endpoints
│   └── scripts/
│       └── seedDB.ts          # Database seeding script
├── database/
│   └── schema.sql             # Database schema
├── package.json
├── tsconfig.json
└── .env.example               # Environment template
```

## Database Schema

### Core Tables

#### Users & Authentication
- `users` - User accounts with authentication info
- `profiles` - User profile information
- `instructors` - Instructor-specific information

#### Course Content
- `courses` - Course metadata
- `modules` - Course modules
- `lessons` - Individual lessons within modules
- `quizzes` - Quiz definitions
- `quiz_questions` - Questions within quizzes

#### Learning Progress
- `enrollments` - User course enrollments
- `completed_lessons` - Tracked lesson completions
- `quiz_attempts` - Quiz attempt records
- `certificates` - Earned certificates

#### Audit & Logging
- `audit_logs` - System activity logs

## API Endpoints

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course by ID
- `GET /api/courses/uuid/:uuid` - Get course by UUID
- `GET /api/courses/search/:query` - Search courses
- `GET /api/courses/category/:category` - Get courses by category
- `GET /api/courses/:courseId/lessons/:lessonId` - Get lesson details

### Quizzes
- `GET /api/quizzes/course/:courseId` - Get quizzes for a course
- `GET /api/quizzes/:id` - Get quiz by ID
- `GET /api/quizzes/uuid/:uuid` - Get quiz by UUID

### Enrollments
- `GET /api/enrollments/user/:userId` - Get user enrollments
- `GET /api/enrollments/user/:userId/course/:courseId` - Check enrollment
- `POST /api/enrollments` - Enroll in course
- `POST /api/enrollments/lessons/complete` - Complete lesson
- `GET /api/enrollments/:userId/completed/:courseId` - Get completed lessons
- `POST /api/enrollments/quiz/submit` - Submit quiz attempt
- `GET /api/enrollments/quiz/:userId` - Get quiz attempts
- `GET /api/enrollments/certificates/:userId` - Get certificates
- `GET /api/enrollments/certificate/verify/:uuid` - Verify certificate

### Users
- `POST /api/users/get-or-create` - Get or create user
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:userId/profile` - Get user profile
- `PUT /api/users/:userId/profile` - Update user profile
- `GET /api/users/:userId/instructor` - Get instructor info
- `PUT /api/users/:userId/instructor` - Update instructor info

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "message": "Optional success message",
  "error": "Optional error message"
}
```

## Error Handling

- `400` - Bad Request (missing/invalid parameters)
- `404` - Resource not found
- `409` - Conflict (e.g., already enrolled)
- `500` - Server error

## Database Queries

The backend uses the `pg` library for PostgreSQL connections. All database queries are in the model files:

- Look at `src/models/CourseModel.ts` for course queries
- Look at `src/models/ContentModel.ts` for content (modules, lessons, quizzes)
- Look at `src/models/UserModel.ts` for user and enrollment queries

## Testing the API

### Using curl

```bash
# Get all courses
curl http://localhost:5000/api/courses

# Get specific course
curl http://localhost:5000/api/courses/1

# Check API health
curl http://localhost:5000/api/health
```

### Using Postman

Import the endpoints and test them with Postman or similar API testing tool.

## Troubleshooting

### Database Connection Error

**Problem**: `failed to connect to database`

**Solution**:
- Check PostgreSQL is running
- Verify DB credentials in `.env.local`
- Ensure database `ctc_lms` exists

### Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::5000`

**Solution**:
- Change PORT in `.env.local` to different value
- Or kill process using port 5000

### Schema Error

**Problem**: `relation "courses" does not exist`

**Solution**:
- Run: `psql -U postgres -d ctc_lms -f backend/database/schema.sql`
- Or run: `npm run db:setup`

## Frontend Integration

The frontend should set the API URL in environment variables:

```env
VITE_API_URL=http://localhost:5000/api
```

See `src/lib/api.ts` for the frontend API client implementation.

## Development Notes

- Use TypeScript for type safety
- All database queries are parameterized to prevent SQL injection
- Indexes are created on frequently queried columns
- Progress percentage is automatically calculated on lesson completion
- Certificates are automatically issued when progress reaches 100%

## Next Steps

1. Install dependencies: `npm install`
2. Set up `.env.local` with database credentials
3. Create PostgreSQL database
4. Run schema: `npm run db:setup`
5. Seed data: `npm run db:seed`
6. Start development server: `npm run dev`
