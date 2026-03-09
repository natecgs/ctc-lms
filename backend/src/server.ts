import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import routes
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import userRoutes from './routes/users.js';
import quizRoutes from './routes/quizzes.js';

const app: Express = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0'; // Listen on all interfaces

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet());

// CORS configuration  
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      'http://[::1]:5173',
      'http://[::1]:3000',
      'http://[::1]:8080',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    
    console.log('[CORS] Request origin:', origin, 'Allowed:', allowedOrigins.includes(origin || ''));
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow for now, restrict in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Logging
app.use(morgan('combined'));

// Request timeout middleware - 10 seconds
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(10000, () => {
    console.error(`[TIMEOUT] Request timed out after 10s:  ${req.method} ${req.path}`);
    res.status(408).json({
      success: false,
      error: 'Request timeout',
    });
  });
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// API ROUTES
// ============================================================================

console.log('[ROUTES] Registering API routes...');
app.use('/api/courses', courseRoutes);
console.log('[ROUTES] Registered /api/courses');

app.use('/api/enrollments', enrollmentRoutes);
console.log('[ROUTES] Registered /api/enrollments');

app.use('/api/quizzes', quizRoutes);
console.log('[ROUTES] Registered /api/quizzes');

app.use('/api/users', userRoutes);
console.log('[ROUTES] Registered /api/users');

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`   Local: http://127.0.0.1:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

export default app;
