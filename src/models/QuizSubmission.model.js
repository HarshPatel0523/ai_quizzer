const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const submissionAnswerSchema = new Schema({
    questionId: { 
        type: Schema.Types.ObjectId, 
        required: true 
    }, 
    questionText: { 
        type: String, 
        required: true 
    }, 
    selectedAnswerKey: { 
        type: String, 
        required: true 
    }, 
    correctAnswerKey: { 
        type: String, 
        required: true 
    }, 
    isCorrect: { 
        type: Boolean, 
        required: true 
    }
}, { 
    _id: false 
}); 

const quizSubmissionSchema = new Schema({
    studentId: { 
        type: String, 
        required: true 
    }, 
    quizId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Quiz', 
        required: true 
    },
    quizTitle: { 
        type: String, 
        required: true 
    }, 
    subject: {
        type: String 
    }, 
    gradeLevel: {
        type: String 
    }, 
    answers: [submissionAnswerSchema],
    score: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 100 
    }, 
    totalQuestions: { 
        type: Number, 
        required: true 
    },
    correctAnswersCount: { 
        type: Number, 
        required: true
    },
    submissionTime: { 
        type: Date, 
        default: Date.now 
    },
    completedDate: { 
        type: Date, 
        default: Date.now 
    }, 
    isRetry: { 
        type: Boolean, 
        default: false 
    },
    originalSubmissionId: { 
        type: Schema.Types.ObjectId, 
        ref: 'QuizSubmission', 
        default: null 
    } 
});

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema);