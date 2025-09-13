import { useState, useEffect } from 'react';
import ApiService from '../services/api';

const QuizHistory = ({ onViewResult, onBackToHome }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    grade: '',
    subject: '',
    marks_gte: '',
    marks_lte: '',
    from: '',
    to: '',
  });

  const subjects = [
    'Mathematics', 'Science', 'History', 'Geography', 'English', 
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art'
  ];

  const gradeLevels = [
    'Elementary (K-5)', 'Middle School (6-8)', 'High School (9-12)', 
    'College', 'Advanced'
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async (appliedFilters = {}) => {
    setLoading(true);
    setError('');
    
    try {
      const data = await ApiService.getQuizHistory(appliedFilters);
      
      // Ensure data is an array and filter out invalid submissions
      const validHistory = Array.isArray(data) ? data.filter(submission => 
        submission && typeof submission === 'object'
      ) : [];
      
      setHistory(validHistory);
    } catch (err) {
      setError(err.message || 'Failed to fetch quiz history');
      setHistory([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value)
    );
    fetchHistory(activeFilters);
  };

  const clearFilters = () => {
    setFilters({
      grade: '',
      subject: '',
      marks_gte: '',
      marks_lte: '',
      from: '',
      to: '',
    });
    fetchHistory();
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (percentage) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quiz history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Quiz History</h2>
        <button
          onClick={onBackToHome}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back to Home
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <form onSubmit={applyFilters} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label htmlFor="subject" className="block text-xs font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="grade" className="block text-xs font-medium text-gray-700 mb-1">
                Grade Level
              </label>
              <select
                id="grade"
                name="grade"
                value={filters.grade}
                onChange={handleFilterChange}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Grades</option>
                {gradeLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="marks_gte" className="block text-xs font-medium text-gray-700 mb-1">
                Min Score
              </label>
              <input
                type="number"
                id="marks_gte"
                name="marks_gte"
                value={filters.marks_gte}
                onChange={handleFilterChange}
                placeholder="0"
                min="0"
                max="100"
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="marks_lte" className="block text-xs font-medium text-gray-700 mb-1">
                Max Score
              </label>
              <input
                type="number"
                id="marks_lte"
                name="marks_lte"
                value={filters.marks_lte}
                onChange={handleFilterChange}
                placeholder="100"
                min="0"
                max="100"
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="from" className="block text-xs font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="from"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="to" className="block text-xs font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="to"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
            >
              Clear All
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Quiz History List */}
      {!Array.isArray(history) || history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No quiz history found.</p>
          <p className="text-sm mt-1">Take some quizzes to see your history here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((submission) => {
            const percentage = Math.round(((submission.score || 0) / (submission.totalQuestions || 1)) * 100);
            
            // Safety checks for submission data
            if (!submission) {
              return (
                <div key={Math.random()} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <p className="text-red-600 text-sm">Invalid submission data</p>
                </div>
              );
            }
            
            return (
              <div key={submission._id || Math.random()} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{submission.quizTitle || 'Untitled Quiz'}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs ${getScoreBackground(percentage)} ${getScoreColor(percentage)}`}>
                      {percentage}%
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    <p><span className="font-medium">Subject:</span> {submission.subject || 'Unknown Subject'}</p>
                    <p><span className="font-medium">Grade:</span> {submission.gradeLevel || 'Unknown Grade'}</p>
                    <p><span className="font-medium">Score:</span> {submission.score || 0}/{submission.totalQuestions || 0}</p>
                  </div>                    <div className="mt-2 text-xs text-gray-500">
                      <p>Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Date not available'}</p>
                      {(submission.retryCount || 0) > 0 && (
                        <p className="text-blue-600">Retried {submission.retryCount} time(s)</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewResult(submission)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizHistory;