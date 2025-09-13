import { useState, useEffect } from 'react';
import './App.css';

import Login from './components/Login';
import QuizGenerator from './components/QuizGenerator';
import QuizTaking from './components/QuizTaking';
import RetryQuiz from './components/RetryQuiz';
import QuizResults from './components/QuizResults';
import QuizHistory from './components/QuizHistory';
import ApiService from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [retryData, setRetryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');

  useEffect(() => {
    // Set up token expiration callback
    ApiService.setTokenExpiredCallback(() => {
      setSessionExpiredMessage('Your session has expired. Please log in again.');
      setUser(null);
      setCurrentView('home');
      setCurrentQuiz(null);
      setQuizResult(null);
      setRetryData(null);
    });

    // Check if user is already logged in and token is valid
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token by making a simple API call
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      // Try to fetch user's quiz history to validate token
      await ApiService.getQuizHistory();
      // If successful, user is logged in with valid token
      setUser({ token: localStorage.getItem('token') });
    } catch (error) {
      // Token is invalid or expired, clear it
      console.log('Token validation failed:', error.message);
      ApiService.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('home');
    setSessionExpiredMessage(''); // Clear message on successful login
  };

  const handleLogout = () => {
    ApiService.removeToken();
    setUser(null);
    setCurrentView('home');
    setCurrentQuiz(null);
    setQuizResult(null);
    setRetryData(null);
  };

  const handleQuizGenerated = (quiz) => {
    setCurrentQuiz(quiz);
    setCurrentView('taking-quiz');
  };

  const handleQuizSubmit = (result) => {
    setQuizResult(result);
    setCurrentView('quiz-results');
    setCurrentQuiz(null);
    setRetryData(null);
  };

  const handleRetryQuiz = (quiz, originalSubmissionId) => {
    setCurrentQuiz(quiz);
    setRetryData({ originalSubmissionId });
    setCurrentView('retry-quiz');
  };

  const handleViewResult = (submission) => {
    // Transform submission data to match expected result format
    const result = {
      submission,
      improvementSuggestions: submission.improvementSuggestions || null
    };
    setQuizResult(result);
    setCurrentView('quiz-results');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setCurrentQuiz(null);
    setQuizResult(null);
    setRetryData(null);
  };

  const handleViewHistory = () => {
    setCurrentView('history');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} sessionExpiredMessage={sessionExpiredMessage} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">AI Quizzer</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.username}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'home' && (
          <div className="space-y-6">
            {/* Navigation Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Create New Quiz</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Generate AI-powered quizzes on any subject and difficulty level.
                </p>
                <QuizGenerator onQuizGenerated={handleQuizGenerated} />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Quiz History</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View your past quiz attempts, scores, and detailed results.
                </p>
                <button
                  onClick={handleViewHistory}
                  className="w-full bg-blue-600 text-white p-3 rounded-md font-medium hover:bg-blue-700"
                >
                  View History
                </button>
              </div>
            </div>

            {/* Quick Stats or Welcome Message */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Welcome to AI Quizzer!</h3>
              <p className="text-blue-700 text-sm">
                Create custom quizzes powered by AI, test your knowledge, and track your progress. 
                Get started by generating a new quiz or reviewing your quiz history.
              </p>
            </div>
          </div>
        )}

        {currentView === 'taking-quiz' && currentQuiz && (
          <QuizTaking 
            quiz={currentQuiz} 
            onQuizSubmit={handleQuizSubmit}
            onBack={handleBackToHome}
          />
        )}

        {currentView === 'retry-quiz' && currentQuiz && retryData && (
          <RetryQuiz 
            quiz={currentQuiz} 
            originalSubmissionId={retryData.originalSubmissionId}
            onQuizSubmit={handleQuizSubmit}
            onBack={handleBackToHome}
          />
        )}

        {currentView === 'quiz-results' && quizResult && (
          <QuizResults 
            result={quizResult}
            onRetryQuiz={handleRetryQuiz}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentView === 'history' && (
          <QuizHistory 
            onViewResult={handleViewResult}
            onBackToHome={handleBackToHome}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            AI Quizzer - Powered by AI for Better Learning
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
