const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User.model'); 

const questionSchema = new Schema({
    questionText: { 
        type: String, 
        required: true 
    },
    options: [{ 
        optionKey: { 
            type: String, 
            required: true 
        }, 
        optionValue: { 
            type: String, 
            required: true 
        } 
    }],
    correctAnswerKey: { 
        type: String, 
        required: true 
    }, 
    hint: { 
        type: String 
    } 
}, { 
    _id: true 
}); 

const quizSchema = new Schema({
    title: { 
        type: String, 
        required: true 
    },
    subject: { 
        type: String, 
        required: true 
    },
    gradeLevel: { 
        type: String, 
        required: true 
    },
    questions: [questionSchema], 
    createdByAiTool: { 
        type: String, 
        default: 'Groq' 
    },
    studentId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }, 
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Quiz', quizSchema);