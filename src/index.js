const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/env.config');

const authRoutes = require('./api/auth/auth.routes');
const quizRoutes = require('./api/quizzes/quiz.routes');

const app = express();

const cors = require('cors');
app.use(cors()); 

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 


mongoose.connect(config.mongoURI)
.then(() => console.log('MongoDB Connected successfully.'))
.catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1); 
});

mongoose.connection.on('error', err => {
  console.error(`MongoDB connection error: ${err}`);
});


app.get('/', (req, res) => {
    res.send('AI Quizzer Service is alive and running! Current time: ' + new Date().toUTCString());
});

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);

app.use((req, res, next) => {
    res.status(404).json({ message: 'Resource not found on this server.' });
});


app.use((err, req, res, next) => {
    console.error("Global Error Handler Caught:", err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected internal server error occurred.';
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message
    });
});

const PORT = config.port;
app.listen(PORT, () => {
    console.log(`AI Quizzer Service is running on http://localhost:${PORT}`);
    console.log(`Connected to MongoDB: ${config.mongoURI}`); 
    console.log(`Groq API Key Loaded: ${config.groqApiKey ? 'Yes' : 'No (Quiz generation will fail!)'}`);
    if (!config.jwtSecret || config.jwtSecret === 'your_very_strong_and_secret_jwt_key_here') {
        console.warn('WARNING: JWT_SECRET is not set or is using the default weak secret. Please set a strong secret in your .env file!');
    }
});