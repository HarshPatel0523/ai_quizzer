import { useState } from 'react';
import ApiService from '../services/api';

const QuizTaking = ({ quiz, onQuizSubmit, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState({});
  const [hints, setHints] = useState({});
  const [loadingHint, setLoadingHint] = useState({});

  // Safety checks to prevent errors
  if (!quiz) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center text-red-600">
          <p>Error: No quiz data available</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center text-red-600">
          <p>Error: Quiz has no questions</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Additional safety check for current question
  if (!currentQuestion) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center text-red-600">
          <p>Error: Current question not found</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (questionId, answerKey) => {
    setAnswers({
      ...answers,
      [questionId]: answerKey
    });
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getHint = async (questionId) => {
    if (!questionId || !quiz._id) {
      console.error('Missing questionId or quiz._id for hint request');
      return;
    }

    if (hints[questionId]) {
      setShowHint({
        ...showHint,
        [questionId]: !showHint[questionId]
      });
      return;
    }

    setLoadingHint({
      ...loadingHint,
      [questionId]: true
    });

    try {
      const response = await ApiService.getHint(quiz._id, questionId);
      setHints({
        ...hints,
        [questionId]: response.hint
      });
      setShowHint({
        ...showHint,
        [questionId]: true
      });
    } catch (err) {
      console.error('Failed to get hint:', err);
    } finally {
      setLoadingHint({
        ...loadingHint,
        [questionId]: false
      });
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    setError('');

    if (!quiz._id) {
      setError('Quiz ID is missing. Cannot submit quiz.');
      setLoading(false);
      return;
    }

    const formattedAnswers = Object.keys(answers).map(questionId => ({
      questionId,
      selectedAnswerKey: answers[questionId]
    }));

    if (formattedAnswers.length === 0) {
      setError('Please answer at least one question before submitting');
      setLoading(false);
      return;
    }

    try {
      const result = await ApiService.submitQuiz(quiz._id, formattedAnswers);
      onQuizSubmit(result);
    } catch (err) {
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const isAnswered = (questionId) => {
    return answers[questionId] !== undefined;
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">{quiz.title || 'Untitled Quiz'}</h2>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md border border-gray-300"
          >
            ← Back
          </button>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{quiz.subject || 'Unknown Subject'} - {quiz.gradeLevel || 'Unknown Grade'}</span>
          <span>{answeredCount} of {totalQuestions} answered</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {quiz.questions && quiz.questions.map((question, index) => (
            <button
              key={question._id || index}
              onClick={() => goToQuestion(index)}
              className={`w-8 h-8 rounded-full text-sm font-medium ${
                index === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : isAnswered(question._id)
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-200 text-gray-600'
              } hover:opacity-80`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Current Question */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-medium text-gray-800">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </h3>
          <button
            onClick={() => getHint(currentQuestion._id)}
            disabled={loadingHint[currentQuestion._id] || !currentQuestion._id}
            className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md border border-blue-300"
          >
            {loadingHint[currentQuestion._id] ? 'Loading...' : 'Get Hint'}
          </button>
        </div>
        
        <p className="text-gray-700 mb-4">{currentQuestion.questionText || 'Question text not available'}</p>

        {/* Hint */}
        {showHint[currentQuestion._id] && hints[currentQuestion._id] && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Hint:</strong> {hints[currentQuestion._id]}
            </p>
          </div>
        )}

        {/* Answer Options */}
        <div className="space-y-2">
          {currentQuestion.options && Array.isArray(currentQuestion.options) 
            ? currentQuestion.options.map((option) => (
                <button
                  key={option.optionKey || option._id}
                  onClick={() => handleAnswerSelect(currentQuestion._id || currentQuestion.id, option.optionKey)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    answers[currentQuestion._id || currentQuestion.id] === option.optionKey
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium mr-2">{option.optionKey?.toUpperCase()}.</span>
                  {option.optionValue}
                </button>
              ))
            : currentQuestion.options && typeof currentQuestion.options === 'object' 
            ? Object.entries(currentQuestion.options).map(([key, option]) => (
                <button
                  key={key}
                  onClick={() => handleAnswerSelect(currentQuestion._id || currentQuestion.id, key)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    answers[currentQuestion._id || currentQuestion.id] === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium mr-2">{key.toUpperCase()}.</span>
                  {option}
                </button>
              ))
            : null
          }
          
          {(!currentQuestion.options || 
            (Array.isArray(currentQuestion.options) && currentQuestion.options.length === 0) ||
            (typeof currentQuestion.options === 'object' && Object.keys(currentQuestion.options).length === 0)) && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              No answer options available for this question.
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex gap-2">
          {currentQuestionIndex < totalQuestions - 1 ? (
            <button
              onClick={nextQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default QuizTaking;