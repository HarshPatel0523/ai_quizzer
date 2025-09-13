const quizService = require('../../services/quiz.service');
const { generateHintWithGroq } = require('../../services/groq.service');
const Quiz = require('../../models/Quiz.model');
const emailService = require('../../services/email.service');

// Generate new quiz
exports.generateQuiz = async (req, res) => {
    try {
        const { title, subject, gradeLevel, numQuestions } = req.body;
        if (!title || !subject || !gradeLevel) {
            return res.status(400).json({ message: 'Title, subject, and gradeLevel are required.' });
        }

        const quiz = await quizService.createNewQuiz(title, subject, gradeLevel, numQuestions);
        res.status(201).json(quiz);
    } catch (error) {
        console.error("Error in generateQuiz controller:", error.message);
        if (error.message.includes('AI service') || error.message.includes('Failed to generate quiz content')) {
            return res.status(502).json({ message: 'Error generating quiz from AI service.', details: error.message });
        }
        res.status(500).json({ message: 'Error generating quiz.', details: error.message });
    }
};

// Submit quiz answers
exports.submitQuiz = async (req, res) => {
    try {
        const { quizId, answers, email } = req.body;
        const studentId = req.user.userId;
        const userEmail = email || req.user.email; 

        if (!quizId || !answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: 'Quiz ID and a non-empty array of answers are required.' });
        }
        for (const ans of answers) {
            if (!ans.questionId || !ans.selectedAnswerKey) {
                 return res.status(400).json({ message: 'Each answer must have a questionId and selectedAnswerKey.' });
            }
        }

        const { submission, improvementSuggestions } = await quizService.submitQuizAnswers(studentId, quizId, answers, userEmail);

        res.status(200).json({
            message: 'Quiz submitted successfully.',
            submission,
            improvementSuggestions,
            emailSent: !!userEmail 
        });
    } catch (error) {
        console.error("Error in submitQuiz controller:", error.message);
        if (error.message === 'Quiz not found') return res.status(404).json({ message: error.message });
        res.status(500).json({ message: 'Error submitting quiz.', details: error.message });
    }
};

// Retry a quiz
exports.retryQuiz = async (req, res) => {
    try {
        const { originalSubmissionId, answers, email } = req.body;
        const studentId = req.user.userId;
        const userEmail = email || req.user.email;

        if (!originalSubmissionId || !answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: 'Original Submission ID and new answers are required.' });
        }
        for (const ans of answers) {
            if (!ans.questionId || !ans.selectedAnswerKey) {
                 return res.status(400).json({ message: 'Each answer for retry must have a questionId and selectedAnswerKey.' });
            }
        }

        const { submission, improvementSuggestions } = await quizService.retryQuizSubmission(studentId, originalSubmissionId, answers, userEmail);

        res.status(200).json({
            message: 'Quiz retried successfully.',
            submission,
            improvementSuggestions,
            emailSent: !!userEmail
        });
    } catch (error) {
        console.error("Error in retryQuiz controller:", error.message);
        if (error.message.includes('not found')) return res.status(404).json({ message: error.message });
        if (error.message.includes('Forbidden')) return res.status(403).json({ message: error.message });
        res.status(500).json({ message: 'Error retrying quiz.', details: error.message });
    }
};

// Retrieve quiz history
exports.getHistory = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const filters = {
            grade: req.query.grade,
            subject: req.query.subject,
            marks_gte: req.query.marks_gte,
            marks_lte: req.query.marks_lte,
            from: req.query.from,
            to: req.query.to,
            date: req.query.date
        };
        Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

        const history = await quizService.getQuizHistory(studentId, filters);
        res.status(200).json(history);
    } catch (error) {
        console.error("Error in getHistory controller:", error.message);
        res.status(500).json({ message: 'Error retrieving quiz history.', details: error.message });
    }
};

// Get a specific quiz by ID
exports.getQuiz = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const quiz = await quizService.getQuizById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json(quiz);
    } catch (error) {
        console.error("Error in getQuiz controller:", error.message);
        if (error.message === 'Quiz not found') return res.status(404).json({ message: error.message });
        res.status(500).json({ message: 'Error retrieving quiz.', details: error.message });
    }
};

// Bonus: Get hint for a question
exports.getHint = async (req, res) => {
    try {
        const { quizId, questionId } = req.params;
        if (!quizId || !questionId) {
            return res.status(400).json({ message: 'Quiz ID and Question ID are required.' });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }
        const question = quiz.questions.id(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found in this quiz.' });
        }

        let hint = question.hint;
        if (!hint) {
            hint = await generateHintWithGroq(question.questionText);
            if (hint) {
                question.hint = hint;
                await quiz.save();
            }
        }

        if (!hint) {
            return res.status(404).json({ message: 'No hint available or could be generated for this question.' });
        }

        res.status(200).json({ hint });
    } catch (error) {
        console.error("Error in getHint controller:", error);
        res.status(500).json({ message: 'Error retrieving hint.', details: error.message });
    }
};

// Test email functionality
exports.testEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email address is required' });
        }

        await emailService.sendTestEmail(email);
        res.status(200).json({ message: 'Test email sent successfully' });
    } catch (error) {
        console.error("Error sending test email:", error);
        res.status(500).json({ message: 'Failed to send test email', details: error.message });
    }
};