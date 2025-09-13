const Quiz = require('../models/Quiz.model');
const QuizSubmission = require('../models/QuizSubmission.model');
const { generateQuizWithGroq, generateSuggestionsWithGroq } = require('./groq.service');
const emailService = require('./email.service');

// Quiz Creation 
async function createNewQuiz(title, subject, gradeLevel, numQuestions = 5) {
    try {
        const aiGeneratedData = await generateQuizWithGroq(subject, gradeLevel, numQuestions);

        if (!aiGeneratedData || !aiGeneratedData.questions || aiGeneratedData.questions.length === 0) {
            throw new Error('Failed to generate quiz content from AI service or content is empty.');
        }

        // Validate and structure questions from AI
        const structuredQuestions = aiGeneratedData.questions.map(q => {
            if (!q.questionText || !q.options || !Array.isArray(q.options) || q.options.length < 2 || !q.correctAnswerKey) {
                console.warn("Skipping malformed question from AI:", q);
                return null;
            }
            const validOptions = q.options.filter(opt => opt.optionKey && opt.optionValue).map(opt => ({
                optionKey: String(opt.optionKey),
                optionValue: String(opt.optionValue)
            }));

            if (validOptions.length < 2) {
                console.warn("Skipping question due to insufficient valid options:", q);
                return null;
            }

            return {
                questionText: String(q.questionText),
                options: validOptions,
                correctAnswerKey: String(q.correctAnswerKey),
                hint: q.hint ? String(q.hint) : undefined
            };
        }).filter(q => q !== null);

        if (structuredQuestions.length === 0) {
            throw new Error('No valid questions could be structured from the AI response.');
        }

        const newQuiz = new Quiz({
            title,
            subject,
            gradeLevel,
            questions: structuredQuestions,
            createdByAiTool: 'Groq'
        });
        await newQuiz.save();

        return newQuiz;
    } catch (error) {
        console.error("Error in createNewQuiz service:", error);
        throw error;
    }
}

// Quiz Submission (with email notifications) 
async function submitQuizAnswers(studentId, quizId, answers, userEmail = null) {
    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            throw new Error('Quiz not found');
        }

        let correctAnswersCount = 0;
        const submissionAnswers = [];
        const incorrectAnswerDetailsForSuggestions = [];

        for (const answer of answers) {
            const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
            if (!question) {
                console.warn(`Question with ID ${answer.questionId} not found in quiz ${quizId}. Skipping.`);
                continue;
            }

            const isCorrect = question.correctAnswerKey === answer.selectedAnswerKey;
            if (isCorrect) {
                correctAnswersCount++;
            } else {
                incorrectAnswerDetailsForSuggestions.push({
                    questionText: question.questionText,
                    selectedAnswerKey: answer.selectedAnswerKey,
                    correctAnswerKey: question.correctAnswerKey
                });
            }
            submissionAnswers.push({
                questionId: question._id,
                questionText: question.questionText,
                selectedAnswerKey: answer.selectedAnswerKey,
                correctAnswerKey: question.correctAnswerKey,
                isCorrect: isCorrect
            });
        }

        const totalQuestions = quiz.questions.length;
        const score = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;

        const submission = new QuizSubmission({
            studentId,
            quizId,
            quizTitle: quiz.title,
            subject: quiz.subject,
            gradeLevel: quiz.gradeLevel,
            answers: submissionAnswers,
            score: parseFloat(score.toFixed(2)),
            totalQuestions,
            correctAnswersCount,
            completedDate: new Date()
        });
        await submission.save();

        // Generate AI suggestions
        let improvementSuggestions = null;
        if (incorrectAnswerDetailsForSuggestions.length > 0) {
            try {
                improvementSuggestions = await generateSuggestionsWithGroq(incorrectAnswerDetailsForSuggestions);
            } catch (suggestionError) {
                console.error("Failed to generate improvement suggestions:", suggestionError);
            }
        }

        // Send email notification if email is provided
        if (userEmail && (improvementSuggestions || score < 100)) {
            try {
                await emailService.sendQuizResults(userEmail, submission, improvementSuggestions);
            } catch (emailError) {
                console.error("Failed to send email notification:", emailError.message);
            }
        }

        return { submission, improvementSuggestions };

    } catch (error) {
        console.error("Error in submitQuizAnswers service:", error);
        throw error;
    }
}

// Retrieve Quiz History 
async function getQuizHistory(studentId, filters = {}) {
    try {
        const query = { studentId };

        if (filters.grade) query.gradeLevel = filters.grade;
        if (filters.subject) query.subject = filters.subject;
        if (filters.marks_gte) query.score = { ...query.score, $gte: parseInt(filters.marks_gte) };
        if (filters.marks_lte) query.score = { ...query.score, $lte: parseInt(filters.marks_lte) };

        if (filters.from && filters.to) {
            query.completedDate = {
                $gte: new Date(filters.from),
                $lte: new Date(new Date(filters.to).setDate(new Date(filters.to).getDate() + 1))
            };
        } else if (filters.from) {
            query.completedDate = { $gte: new Date(filters.from) };
        } else if (filters.to) {
            query.completedDate = { $lte: new Date(new Date(filters.to).setDate(new Date(filters.to).getDate() + 1)) };
        }
        if (filters.date) {
             const specificDate = new Date(filters.date);
             const nextDay = new Date(specificDate);
             nextDay.setDate(specificDate.getDate() + 1);
             query.completedDate = { $gte: specificDate, $lt: nextDay };
        }

        const submissions = await QuizSubmission.find(query)
            .populate('quizId', 'title subject gradeLevel')
            .sort({ completedDate: -1 });

        return submissions;
    } catch (error) {
        console.error("Error in getQuizHistory service:", error);
        throw error;
    }
}

// Retry Quiz 
async function retryQuizSubmission(studentId, originalSubmissionId, newAnswers, userEmail = null) {
    try {
        const originalSubmission = await QuizSubmission.findById(originalSubmissionId);
        if (!originalSubmission) {
            throw new Error('Original submission not found');
        }
        if (originalSubmission.studentId !== studentId) {
            throw new Error('Forbidden: You can only retry your own quizzes.');
        }

        const quiz = await Quiz.findById(originalSubmission.quizId);
        if (!quiz) {
            throw new Error('Quiz for original submission not found');
        }

        let correctAnswersCount = 0;
        const submissionAnswers = [];
        const incorrectAnswerDetailsForSuggestions = [];

        for (const answer of newAnswers) {
            const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
            if (!question) {
                console.warn(`Question ID ${answer.questionId} not found in quiz for retry. Skipping.`);
                continue;
            }
            const isCorrect = question.correctAnswerKey === answer.selectedAnswerKey;
            if (isCorrect) {
                correctAnswersCount++;
            } else {
                incorrectAnswerDetailsForSuggestions.push({
                    questionText: question.questionText,
                    selectedAnswerKey: answer.selectedAnswerKey,
                    correctAnswerKey: question.correctAnswerKey
                });
            }
            submissionAnswers.push({
                questionId: question._id,
                questionText: question.questionText,
                selectedAnswerKey: answer.selectedAnswerKey,
                correctAnswerKey: question.correctAnswerKey,
                isCorrect: isCorrect
            });
        }

        const totalQuestions = quiz.questions.length;
        const score = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;

        const retrySubmission = new QuizSubmission({
            studentId,
            quizId: originalSubmission.quizId,
            quizTitle: quiz.title,
            subject: quiz.subject,
            gradeLevel: quiz.gradeLevel,
            answers: submissionAnswers,
            score: parseFloat(score.toFixed(2)),
            totalQuestions,
            correctAnswersCount,
            completedDate: new Date(),
            isRetry: true,
            originalSubmissionId: originalSubmission._id
        });
        await retrySubmission.save();

        let improvementSuggestions = null;
        if (incorrectAnswerDetailsForSuggestions.length > 0) {
            try {
                improvementSuggestions = await generateSuggestionsWithGroq(incorrectAnswerDetailsForSuggestions);
            } catch (suggestionError) {
                console.error("Failed to generate improvement suggestions for retry:", suggestionError);
            }
        }

        // Send email notification for retry if email is provided
        if (userEmail && (improvementSuggestions || score < 100)) {
            try {
                await emailService.sendQuizResults(userEmail, retrySubmission, improvementSuggestions);
            } catch (emailError) {
                console.error("Failed to send retry email notification:", emailError.message);
            }
        }

        return { submission: retrySubmission, improvementSuggestions };
    } catch (error) {
        console.error("Error in retryQuizSubmission service:", error);
        throw error;
    }
}

async function getQuizById(quizId) {
    try {
        // Validate ObjectId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            throw new Error('Invalid quiz ID format');
        }
        
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            throw new Error('Quiz not found');
        }
        return quiz;
    } catch (error) {
        console.error("Error in getQuizById service:", error);
        throw error;
    }
}

module.exports = {
    createNewQuiz,
    submitQuizAnswers,
    getQuizHistory,
    retryQuizSubmission,
    getQuizById,
};