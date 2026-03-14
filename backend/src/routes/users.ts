import { Router, Request, Response } from 'express';
import { UserModel, ProfileModel, InstructorModel } from '../models/UserModel.js';
import { EmailService } from '../services/emailService.js';
import { ApiResponse } from '../types.js';

const router = Router();

// ============================================================================
// USER ENDPOINTS
// ============================================================================

// Get or create user
router.post('/get-or-create', async (req: Request, res: Response) => {
  console.log('[USER ROUTE] /get-or-create called with body:', req.body);
  try {
    const { authId, email, role } = req.body;

    if (!authId || !email) {
      console.warn('[USER ROUTE] Missing authId or email');
      return res.status(400).json({
        success: false,
        error: 'authId and email are required',
      });
    }

    console.log('[USER ROUTE] Looking up user by authId:', authId);
    // Try to find existing user by authId
    let user = await UserModel.findByAuthId(authId);
    console.log('[USER ROUTE] findByAuthId result:', user);

    // If not found by authId, try by email
    if (!user) {
      console.log('[USER ROUTE] Looking up user by email:', email);
      user = await UserModel.findByEmail(email);
      console.log('[USER ROUTE] findByEmail result:', user);
    }

    // If still not found, create new user
    if (!user) {
      console.log('[USER ROUTE] Creating new user with email:', email);
      user = await UserModel.create(authId, email, role || 'student');
      console.log('[USER ROUTE] User created:', user);

      // Create profile
      console.log('[USER ROUTE] Creating profile for user:', user.id);
      await ProfileModel.create(user.id, { full_name: email.split('@')[0] });

      // If instructor, create instructor record
      if (role === 'instructor') {
        console.log('[USER ROUTE] Creating instructor record for user:', user.id);
        await InstructorModel.create(user.id, {});
      }
    }

    console.log('[USER ROUTE] Returning user:', user);
    res.json({
      success: true,
      data: user,
      message: user ? 'User fetched' : 'User created',
    });
  } catch (error) {
    console.error('[USER ROUTE] Error getting/creating user:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get/create user',
    });
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

// ============================================================================
// PROFILE ENDPOINTS
// ============================================================================

// Get user profile
router.get('/:userId/profile', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const profile = await ProfileModel.findByUserId(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    // Fetch user info to include email and role
    const user = await UserModel.findById(userId);

    res.json({
      success: true,
      data: {
        ...profile,
        email: user?.email,
        role: user?.role,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
  }
});

// Update user profile
router.put('/:userId/profile', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const userData = req.body;

    // Check if profile exists, create if not
    let profile = await ProfileModel.findByUserId(userId);
    if (!profile) {
      profile = await ProfileModel.create(userId, userData);
    } else {
      profile = await ProfileModel.update(userId, userData);
    }

    // Fetch updated user info to get the latest email
    const user = await UserModel.findById(userId);

    res.json({
      success: true,
      data: {
        ...profile,
        email: user?.email,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// ============================================================================
// INSTRUCTOR ENDPOINTS
// ============================================================================

// Get all instructors
router.get('/instructors/list', async (req: Request, res: Response) => {
  try {
    const instructors = await InstructorModel.findAll();

    const response: ApiResponse<any[]> = {
      success: true,
      data: instructors.map(instr => ({
        id: instr.id,
        user_id: instr.user_id,
        title: instr.title,
        bio: instr.bio,
        avatar_url: instr.avatar_url,
        specializations: instr.specializations,
        rating: instr.rating,
        total_courses: instr.total_courses,
        email: instr.user_email,
      })),
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch instructors',
    });
  }
});

// Create new instructor
router.post('/instructors', async (req: Request, res: Response) => {
  try {
    const { email, title, bio, avatar_url, specializations } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Instructor title/name is required',
      });
    }

    // Check if user with email already exists
    let user = await UserModel.findByEmail(email);

    if (user) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Create new user with instructor role
    const newUser = await UserModel.create(`instructor_${Date.now()}`, email, 'instructor');

    // Create profile
    await ProfileModel.create(newUser.id, {
      full_name: title,
      bio: bio || '',
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    });

    // Create instructor record
    const instructor = await InstructorModel.create(newUser.id, {
      title,
      bio: bio || '',
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      specializations: specializations || [],
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        id: instructor.id,
        user_id: instructor.user_id,
        title: instructor.title,
        bio: instructor.bio,
        avatar_url: instructor.avatar_url,
        specializations: instructor.specializations,
        email: email,
      },
      message: 'Instructor created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating instructor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create instructor',
    });
  }
});

// Get instructor info
router.get('/:userId/instructor', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const instructor = await InstructorModel.findByUserId(userId);

    if (!instructor) {
      return res.status(404).json({
        success: false,
        error: 'Instructor profile not found',
      });
    }

    res.json({
      success: true,
      data: instructor,
    });
  } catch (error) {
    console.error('Error fetching instructor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch instructor',
    });
  }
});

// Update instructor profile
router.put('/:userId/instructor', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const instructorData = req.body;

    // Check if instructor profile exists, create if not
    let instructor = await InstructorModel.findByUserId(userId);
    if (!instructor) {
      instructor = await InstructorModel.create(userId, instructorData);
    } else {
      instructor = await InstructorModel.update(userId, instructorData);
    }

    res.json({
      success: true,
      data: instructor,
      message: 'Instructor profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating instructor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update instructor',
    });
  }
});

// Get instructor stats
router.get('/:userId/stats', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { query } = require('../db.js');

    // Get total courses for this instructor
    const coursesResult = await query(
      `SELECT COUNT(*) as total_courses, 
              AVG(c.rating) as avg_rating
       FROM courses c
       WHERE c.instructor_id = (SELECT id FROM instructors WHERE user_id = $1)`,
      [userId]
    );

    // Get total enrolled students across all courses
    const enrollmentsResult = await query(
      `SELECT SUM(c.enrolled_count) as total_students
       FROM courses c
       WHERE c.instructor_id = (SELECT id FROM instructors WHERE user_id = $1)`,
      [userId]
    );

    // Get total revenue (enrolled * price * 0.7)
    const revenueResult = await query(
      `SELECT SUM(c.enrolled_count * c.price * 0.7) as total_revenue
       FROM courses c
       WHERE c.instructor_id = (SELECT id FROM instructors WHERE user_id = $1)`,
      [userId]
    );

    const stats = {
      total_courses: coursesResult.rows[0]?.total_courses || 0,
      avg_rating: parseFloat(coursesResult.rows[0]?.avg_rating || 0).toFixed(1),
      total_students: enrollmentsResult.rows[0]?.total_students || 0,
      total_revenue: revenueResult.rows[0]?.total_revenue || 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch instructor stats',
    });
  }
});

// ============================================================================
// EMAIL VERIFICATION ENDPOINTS
// ============================================================================

// Send verification email
router.post('/send-verification-email', async (req: Request, res: Response) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'userId and email are required',
      });
    }

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if email already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified',
      });
    }

    // Create verification token
    const token = await UserModel.createVerificationToken(userId);

    // Get user profile for name
    const profile = await ProfileModel.findByUserId(userId);
    const userName = profile?.full_name || email.split('@')[0];

    // Send verification email
    const emailSent = await EmailService.sendVerificationEmail(email, token, userName);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email',
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('[USER ROUTE] Error sending verification email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification email',
    });
  }
});

// Verify email token
router.post('/verify-email-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    // Verify the token
    const user = await UserModel.verifyToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token',
      });
    }

    // Send welcome email
    const profile = await ProfileModel.findByUserId(user.id);
    const userName = profile?.full_name || user.email.split('@')[0];
    await EmailService.sendWelcomeEmail(user.email, userName);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: user,
    });
  } catch (error) {
    console.error('[USER ROUTE] Error verifying email token:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify email',
    });
  }
});

// Check email verification status
router.get('/:userId/verification-status', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        email_verified: user.email_verified,
        email_verified_at: user.email_verified_at,
      },
    });
  } catch (error) {
    console.error('[USER ROUTE] Error checking verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check verification status',
    });
  }
});

export default router;
