require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    groqApiKey: process.env.GROQ_API_KEY,
    
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM || 'AI Quizzer <noreply@aiquizzer.com>'
    }
};