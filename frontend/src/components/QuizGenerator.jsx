import { useState } from 'react';
import ApiService from '../services/api';

const QuizGenerator = ({ onQuizGenerated }) => {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    gradeLevel: '',
    numQuestions: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subjects = [
    'Mathematics', 'Science', 'History', 'Geography', 'English', 
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art'
  ];

  const gradeLevels = [
    'Elementary (K-5)', 'Middle School (6-8)', 'High School (9-12)', 
    'College', 'Advanced'
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.title || !formData.subject || !formData.gradeLevel) {
      setError('Title, subject, and grade level are required');
      setLoading(false);
      return;
    }

    try {
      const quiz = await ApiService.generateQuiz(
        formData.title,
        formData.subject,
        formData.gradeLevel,
        parseInt(formData.numQuestions)
      );
      
      onQuizGenerated(quiz);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Generate New Quiz</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Quiz Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Algebra Basics"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select a subject</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Grade Level
          </label>
          <select
            id="gradeLevel"
            name="gradeLevel"
            value={formData.gradeLevel}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select grade level</option>
            {gradeLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Questions
          </label>
          <select
            id="numQuestions"
            name="numQuestions"
            value={formData.numQuestions}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value={3}>3 Questions</option>
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
            <option value={20}>20 Questions</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white p-3 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400"
        >
          {loading ? 'Generating Quiz...' : 'Generate Quiz'}
        </button>
      </form>
    </div>
  );
};

export default QuizGenerator;