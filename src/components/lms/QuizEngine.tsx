import React, { useState, useEffect, useCallback } from 'react';

import { useLMS } from '@/contexts/LMSContext';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Award, RotateCcw, ArrowRight
} from 'lucide-react';

const QuizEngine: React.FC = () => {
  const { selectedCourseId, selectedQuizId, getCourse, getQuiz, navigate, submitQuizScore, getEnrolledCourse } = useLMS();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);

  const course = selectedCourseId ? getCourse(selectedCourseId) : null;
  const quiz = selectedQuizId ? getQuiz(selectedQuizId) : null;
  const enrolledData = selectedCourseId ? getEnrolledCourse(selectedCourseId) : null;

  useEffect(() => {
    if (quiz?.timeLimit && started && !submitted) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  }, [quiz, started, submitted]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleSubmit = useCallback(() => {
    if (!quiz) return;
    setSubmitted(true);
    setShowResults(true);

    let correct = 0;
    quiz.questions.forEach(q => {
      const userAnswer = answers[q.id]?.toLowerCase().trim() || '';
      if (q.type === 'short-answer') {
        if (userAnswer.includes(q.correctAnswer.toLowerCase())) correct++;
      } else {
        if (userAnswer === q.correctAnswer.toLowerCase()) correct++;
      }
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    submitQuizScore(quiz.id, score, answers);
  }, [quiz, answers, submitQuizScore]);


  // Auto-submit when time expires
  useEffect(() => {
    if (timeExpired && !submitted) {
      handleSubmit();
    }
  }, [timeExpired, submitted, handleSubmit]);



  if (!course || !quiz) return null;

  const question = quiz.questions[currentQuestion];
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const previousScore = enrolledData?.quizScores[quiz.id];

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach(q => {
      const userAnswer = answers[q.id]?.toLowerCase().trim() || '';
      if (q.type === 'short-answer') {
        if (userAnswer.includes(q.correctAnswer.toLowerCase())) correct++;
      } else {
        if (userAnswer === q.correctAnswer.toLowerCase()) correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const isCorrect = (questionId: string) => {
    const q = quiz.questions.find(qu => qu.id === questionId);
    if (!q) return false;
    const userAnswer = answers[q.id]?.toLowerCase().trim() || '';
    if (q.type === 'short-answer') return userAnswer.includes(q.correctAnswer.toLowerCase());
    return userAnswer === q.correctAnswer.toLowerCase();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
    setCurrentQuestion(0);
    setStarted(false);
    setReviewMode(false);
    setTimeLeft(null);
  };

  // Start Screen
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-8 text-center">
          <div className={`w-16 h-16 ${quiz.isExam ? 'bg-purple-100' : 'bg-amber-100'} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
            <Award className={`w-8 h-8 ${quiz.isExam ? 'text-purple-600' : 'text-amber-600'}`} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          <p className="text-gray-500 mb-6">{course.title}</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-900">{quiz.questions.length}</p>
              <p className="text-xs text-gray-500">Questions</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-900">{quiz.timeLimit || '∞'}</p>
              <p className="text-xs text-gray-500">Minutes</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-900">{quiz.passingScore}%</p>
              <p className="text-xs text-gray-500">To Pass</p>
            </div>
          </div>

          {previousScore != null && (
            <div className="bg-teal-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-teal-700">
                Your best score: <span className="font-bold">{previousScore}%</span>
                {previousScore >= quiz.passingScore ? ' (Passed)' : ' (Not Passed)'}
              </p>
            </div>
          )}

          <div className="space-y-3 text-left mb-8">
            <h3 className="font-semibold text-gray-900 text-sm">Instructions:</h3>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                Answer all questions to the best of your ability
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                You need {quiz.passingScore}% or higher to pass
              </li>
              {quiz.timeLimit && (
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  Time limit: {quiz.timeLimit} minutes. Quiz auto-submits when time expires.
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                You can retake this {quiz.isExam ? 'exam' : 'quiz'} to improve your score
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('course-detail', { courseId: course.id })}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => setStarted(true)}
              className={`flex-1 px-6 py-3 rounded-xl text-white font-semibold transition-colors ${
                quiz.isExam ? 'bg-purple-600 hover:bg-purple-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              Start {quiz.isExam ? 'Exam' : 'Quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    const score = calculateScore();
    const passed = score >= quiz.passingScore;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-8 text-center">
          <div className={`w-20 h-20 ${passed ? 'bg-emerald-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {passed ? (
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {passed ? 'Congratulations!' : 'Keep Trying!'}
          </h1>
          <p className="text-gray-500 mb-6">
            {passed
              ? `You passed the ${quiz.isExam ? 'exam' : 'quiz'} with a great score!`
              : `You need ${quiz.passingScore}% to pass. Don't give up!`}
          </p>

          <div className={`text-6xl font-bold mb-2 ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
            {score}%
          </div>
          <p className="text-gray-500 text-sm mb-8">
            {quiz.questions.filter((q) => isCorrect(q.id)).length} of {quiz.questions.length} correct
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Passing Score</p>
              <p className="text-xl font-bold text-gray-900">{quiz.passingScore}%</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Total Points</p>
              <p className="text-xl font-bold text-gray-900">{totalPoints}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setReviewMode(true); setShowResults(false); setCurrentQuestion(0); }}
              className="w-full px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
            >
              Review Answers
            </button>
            {!passed && (
              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Retake {quiz.isExam ? 'Exam' : 'Quiz'}
              </button>
            )}
            <button
              onClick={() => navigate('course-detail', { courseId: course.id })}
              className="w-full px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              Back to Course <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz/Review Screen
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${quiz.isExam ? 'bg-purple-900' : 'bg-teal-900'} text-white`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('course-detail', { courseId: course.id })}
                className="text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <p className="text-xs text-white/60">{reviewMode ? 'Reviewing' : ''} {quiz.isExam ? 'Final Exam' : 'Module Quiz'}</p>
                <h2 className="font-semibold text-sm">{quiz.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {timeLeft !== null && !reviewMode && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  timeLeft < 60 ? 'bg-red-500/20 text-red-200' : 'bg-white/10 text-white'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-semibold text-sm">{formatTime(timeLeft)}</span>
                </div>
              )}
              <span className="text-sm text-white/60">
                {answeredCount}/{quiz.questions.length} answered
              </span>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-4">
            {quiz.questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(i)}
                className={`h-2 flex-1 rounded-full transition-all ${
                  i === currentQuestion
                    ? quiz.isExam ? 'bg-purple-400' : 'bg-teal-400'
                    : reviewMode
                      ? isCorrect(q.id) ? 'bg-emerald-400' : answers[q.id] ? 'bg-red-400' : 'bg-white/20'
                      : answers[q.id] ? 'bg-white/60' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-gray-500">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
              question.type === 'multiple-choice' ? 'bg-blue-100 text-blue-700' :
              question.type === 'true-false' ? 'bg-green-100 text-green-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {question.type.replace('-', ' ')}
            </span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">{question.question}</h2>

          {/* Answer Options */}
          {(question.type === 'multiple-choice' || question.type === 'true-false') && question.options && (
            <div className="space-y-3">
              {question.options.map((option, i) => {
                const isSelected = answers[question.id] === option;
                const isCorrectAnswer = option === question.correctAnswer;
                const showFeedback = reviewMode || (submitted && isSelected);

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!reviewMode && !submitted) {
                        setAnswers(prev => ({ ...prev, [question.id]: option }));
                      }
                    }}
                    disabled={reviewMode || submitted}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      reviewMode
                        ? isCorrectAnswer
                          ? 'border-emerald-500 bg-emerald-50'
                          : isSelected && !isCorrectAnswer
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                        : isSelected
                          ? quiz.isExam ? 'border-purple-500 bg-purple-50' : 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                      reviewMode
                        ? isCorrectAnswer
                          ? 'bg-emerald-500 text-white'
                          : isSelected && !isCorrectAnswer
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        : isSelected
                          ? quiz.isExam ? 'bg-purple-500 text-white' : 'bg-teal-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {reviewMode ? (
                        isCorrectAnswer ? <CheckCircle className="w-4 h-4" /> :
                        isSelected ? <XCircle className="w-4 h-4" /> :
                        String.fromCharCode(65 + i)
                      ) : String.fromCharCode(65 + i)}
                    </div>
                    <span className="text-gray-900 font-medium">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Short Answer */}
          {question.type === 'short-answer' && (
            <div>
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => {
                  if (!reviewMode && !submitted) {
                    setAnswers(prev => ({ ...prev, [question.id]: e.target.value }));
                  }
                }}
                disabled={reviewMode || submitted}
                placeholder="Type your answer here..."
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl text-gray-700 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50"
              />
              {reviewMode && (
                <div className={`mt-3 p-3 rounded-xl ${isCorrect(question.id) ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-sm font-medium">{isCorrect(question.id) ? 'Correct!' : 'Incorrect'}</p>
                  <p className="text-sm text-gray-600 mt-1">Key concept: {question.correctAnswer}</p>
                </div>
              )}
            </div>
          )}

          {/* Explanation (review mode) */}
          {reviewMode && (
            <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 text-sm mb-1">Explanation</h4>
              <p className="text-sm text-blue-800">{question.explanation}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentQuestion === quiz.questions.length - 1 ? (
              reviewMode ? (
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Retake
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={answeredCount < quiz.questions.length}
                  className={`px-6 py-2.5 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    quiz.isExam ? 'bg-purple-600 hover:bg-purple-700' : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  Submit {quiz.isExam ? 'Exam' : 'Quiz'}
                </button>
              )
            ) : (
              <button
                onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizEngine;
