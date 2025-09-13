import { useState } from 'react';
import ApiService from '../services/api';

const QuizResults = ({ result, onRetryQuiz, onBackToHome }) => {
  const [retryLoading, setRetryLoading] = useState(false);
  const [error, setError] = useState('');

  // Safety checks for result and submission data
  if (!result) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <div className="text-center text-red-600">
          <p>Error: No quiz result data available</p>
          <button
            onClick={onBackToHome}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { submission, improvementSuggestions } = result;
  
  if (!submission) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <div className="text-center text-red-600">
          <p>Error: No quiz submission data available</p>
          <button
            onClick={onBackToHome}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { quizTitle, subject, gradeLevel, score, totalQuestions, correctAnswersCount, completedDate, quizId } = submission;
  
  const percentage = Math.round(score || 0);  // score is already a percentage from backend
  
  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = () => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const handleRetry = async () => {
    setRetryLoading(true);
    setError('');
    
    if (!quizId || !submission._id) {
      setError('Missing quiz or submission ID. Cannot retry quiz.');
      setRetryLoading(false);
      return;
    }
    
    try {
      // Try to fetch the quiz data first
      const quizData = await ApiService.getQuiz(quizId);
      onRetryQuiz(quizData, submission._id);
    } catch (fetchError) {
      console.error('Failed to fetch quiz for retry:', fetchError);
      setError(`Cannot retry this quiz: ${fetchError.message}. The original quiz data may no longer be available. Please create a new quiz instead.`);
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Results</h2>
        <h3 className="text-lg text-gray-600">{quizTitle || 'Untitled Quiz'}</h3>
        <p className="text-sm text-gray-500">{subject || 'Unknown Subject'} - {gradeLevel || 'Unknown Grade'}</p>
      </div>

      {/* Score Display */}
      <div className={`${getScoreBackground()} p-6 rounded-lg mb-6`}>
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor()} mb-2`}>
            {correctAnswersCount} / {totalQuestions}
          </div>
          <div className={`text-2xl ${getScoreColor()} mb-2`}>
            {percentage}%
          </div>
          <div className="text-gray-700">
            {percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : 'Keep Practicing!'}
          </div>
        </div>
      </div>

      {/* Quiz Details */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Quiz Details</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Total Questions:</span> {totalQuestions}</p>
            <p><span className="font-medium">Correct Answers:</span> {correctAnswersCount}</p>
            <p><span className="font-medium">Completed:</span> {completedDate ? new Date(completedDate).toLocaleString() : 'Date not available'}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Performance</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Score:</span> {percentage}%</p>
            <p><span className="font-medium">Grade:</span> 
              <span className={`ml-1 ${getScoreColor()}`}>
                {percentage >= 90 ? 'A' : percentage >= 75 ? 'B' : percentage >= 60 ? 'C' : percentage >= 45 ? 'D' : percentage >= 35 ? 'E' : 'F'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Improvement Suggestions */}
      {improvementSuggestions && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-blue-800 mb-2">💡 Improvement Suggestions</h4>
          <p className="text-blue-700 text-sm leading-relaxed">
            {improvementSuggestions}
          </p>
        </div>
      )}

      {/* Answer Review */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">Answer Review</h4>
        <div className="space-y-3">
          {submission.answers && submission.answers.length > 0 ? submission.answers.map((answer, index) => {
            const isCorrect = answer.isCorrect;
            
            return (
              <div key={answer.questionId || index} className={`p-3 rounded-lg border ${
                isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-gray-800">
                    Question {index + 1}: {answer.questionText}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Your answer:</span> 
                    <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                      {answer.selectedAnswerKey.toUpperCase()}.
                    </span>
                  </p>
                  
                  {!isCorrect && (
                    <p><span className="font-medium">Correct answer:</span> 
                      <span className="text-green-700">
                        {answer.correctAnswerKey.toUpperCase()}.
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="text-center text-gray-500 p-4">
              No answer data available for review.
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleRetry}
          disabled={retryLoading}
          className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-400"
        >
          {retryLoading ? 'Loading...' : 'Retry Quiz'}
        </button>
        
        <button
          onClick={onBackToHome}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create New Quiz
        </button>
        
        <button
          onClick={onBackToHome}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default QuizResults;