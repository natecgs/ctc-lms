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

// Create a new quiz
router.post('/', async (req: Request, res: Response) => {
  try {
    const { courseId, title, description, passingScore, timeLimit, isExam, questions } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and title are required',
      });
    }

    // Create quiz
    const quiz = await QuizModel.create(
      courseId,
      title,
      {
        description: description || '',
        passingScore: passingScore || 70,
        timeLimitMinutes: timeLimit || null,
        isExam: isExam || false,
      }
    );

    // Create questions if provided
    let savedQuestions = [];
    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        const savedQuestion = await QuizQuestionModel.create(quiz.id, {
          questionText: q.question,
          questionType: q.type || 'multiple-choice',
          options: q.type === 'multiple-choice' ? q.options : undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          points: q.points || 10,
        });
        savedQuestions.push(savedQuestion);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...quiz,
        questions: savedQuestions,
      },
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create quiz',
    });
  }
});

// Update a quiz
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    const { title, description, passingScore, timeLimit, questions } = req.body;

    // Check if quiz exists
    const existingQuiz = await QuizModel.findById(quizId);
    if (!existingQuiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
      });
    }

    // Update quiz metadata
    const updatedQuiz = await QuizModel.update(quizId, {
      title,
      description: description || '',
      passingScore: passingScore || 70,
      timeLimitMinutes: timeLimit || null,
    });

    // Delete existing questions
    const existingQuestions = await QuizQuestionModel.findByQuiz(quizId);
    for (const q of existingQuestions) {
      await QuizQuestionModel.delete(q.id);
    }

    // Create new questions
    let savedQuestions = [];
    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        const savedQuestion = await QuizQuestionModel.create(quizId, {
          questionText: q.question,
          questionType: q.type || 'multiple-choice',
          options: q.type === 'multiple-choice' ? q.options : undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          points: q.points || 10,
        });
        savedQuestions.push(savedQuestion);
      }
    }

    res.json({
      success: true,
      data: {
        ...updatedQuiz,
        questions: savedQuestions,
      },
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update quiz',
    });
  }
});

// Delete a quiz
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);

    // Check if quiz exists
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
      });
    }

    // Delete all questions associated with the quiz
    const questions = await QuizQuestionModel.findByQuiz(quizId);
    for (const q of questions) {
      await QuizQuestionModel.delete(q.id);
    }

    // Delete the quiz
    await QuizModel.delete(quizId);

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete quiz',
    });
  }
});

export default router;
