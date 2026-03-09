import { Router, Request, Response } from 'express';
import { QuizModel, QuizQuestionModel } from '../models/ContentModel.js';
import { ApiResponse } from '../types.js';

const router = Router();

// ============================================================================
// QUIZ ENDPOINTS
// ============================================================================

// Get all quizzes for a course
router.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const quizzes = await QuizModel.findByCourse(courseId);

    // Fetch questions for each quiz
    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await QuizQuestionModel.findByQuiz(quiz.id);
        return { ...quiz, questions };
      })
    );

    res.json({
      success: true,
      data: quizzesWithQuestions,
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quizzes',
    });
  }
});

// Get quiz by ID with questions
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    const quiz = await QuizModel.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
      });
    }

    // Fetch questions
    const questions = await QuizQuestionModel.findByQuiz(quizId);

    res.json({
      success: true,
      data: {
        ...quiz,
        questions,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz',
    });
  }
});

// Get quiz by UUID
router.get('/uuid/:uuid', async (req: Request, res: Response) => {
  try {
    const quiz = await QuizModel.findByUuid(req.params.uuid);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
      });
    }

    // Fetch questions
    const questions = await QuizQuestionModel.findByQuiz(quiz.id);

    res.json({
      success: true,
      data: {
        ...quiz,
        questions,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz',
    });
  }
});

export default router;
