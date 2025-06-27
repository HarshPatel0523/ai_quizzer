const express = require('express');
const router = express.Router();
const quizController = require('./quiz.controller');
const authenticateToken = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/generate', quizController.generateQuiz);
router.post('/submit', quizController.submitQuiz);
router.get('/history', quizController.getHistory);
router.post('/retry', quizController.retryQuiz);
router.get('/:quizId', quizController.getQuiz);
router.get('/:quizId/questions/:questionId/hint', quizController.getHint);
router.post('/test-email', quizController.testEmail);

module.exports = router;