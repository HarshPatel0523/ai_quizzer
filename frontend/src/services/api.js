const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // Use relative path in production
  : 'http://localhost:3000/api';  // Use localhost in development

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.onTokenExpired = null; // Callback for when token expires
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
    // Notify about token removal
    if (this.onTokenExpired) {
      this.onTokenExpired();
    }
  }

  setTokenExpiredCallback(callback) {
    this.onTokenExpired = callback;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration/invalid token
        if (response.status === 401) {
          this.removeToken();
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username, password, email) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { username, password, email },
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  // Quiz endpoints
  async generateQuiz(title, subject, gradeLevel, numQuestions = 5) {
    return this.request('/quizzes/generate', {
      method: 'POST',
      body: { title, subject, gradeLevel, numQuestions },
    });
  }

  async getQuiz(quizId) {
    return this.request(`/quizzes/${quizId}`);
  }

  async submitQuiz(quizId, answers, email) {
    return this.request('/quizzes/submit', {
      method: 'POST',
      body: { quizId, answers, email },
    });
  }

  async retryQuiz(originalSubmissionId, answers, email) {
    return this.request('/quizzes/retry', {
      method: 'POST',
      body: { originalSubmissionId, answers, email },
    });
  }

  async getQuizHistory(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/quizzes/history?${queryString}` : '/quizzes/history';
    
    return this.request(endpoint);
  }

  async getHint(quizId, questionId) {
    return this.request(`/quizzes/${quizId}/questions/${questionId}/hint`);
  }

  async testEmail(email) {
    return this.request('/quizzes/test-email', {
      method: 'POST',
      body: { email },
    });
  }
}

export default new ApiService();