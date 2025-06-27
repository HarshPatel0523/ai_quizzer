const nodemailer = require('nodemailer');
const config = require('../config/env.config');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialize();
    }

    async initialize() {
        if (!config.email.host || !config.email.user) {
            console.warn('Email configuration incomplete. Email notifications will be disabled.');
            return;
        }

        try {
            this.transporter = nodemailer.createTransport({
                host: config.email.host,
                port: config.email.port,
                secure: false, 
                auth: {
                    user: config.email.user,
                    pass: config.email.pass
                },
                tls: {
                    rejectUnauthorized: false 
                }
            });

            await this.transporter.verify();
            console.log('Email service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize email service:', error.message);
            this.transporter = null;
        }
    }

    async sendQuizResults(userEmail, quizResults, improvementSuggestions = []) {
        if (!this.transporter) {
            console.warn('Email service not available. Skipping email notification.');
            return false;
        }

        if (!userEmail) {
            console.warn('No email provided for quiz results notification.');
            return false;
        }

        try {
            const emailContent = this.generateQuizResultsEmail(quizResults, improvementSuggestions);

            const mailOptions = {
                from: config.email.from,
                to: userEmail,
                subject: `Quiz Results: ${quizResults.quizTitle}`,
                html: emailContent.html,
                text: emailContent.text
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Quiz results email sent successfully:', result.messageId);
            return true;
        } catch (error) {
            console.error('Failed to send quiz results email:', error.message);
            return false;
        }
    }

    generateQuizResultsEmail(quizResults, improvementSuggestions) {
        const { quizTitle, subject, gradeLevel, score, totalQuestions, correctAnswersCount, submissionTime } = quizResults;

        const percentageScore = score;
        const scoreColor = percentageScore >= 80 ? '#4CAF50' : percentageScore >= 60 ? '#FF9800' : '#F44336';
        const performanceMessage = percentageScore >= 80 ? 'Excellent work!' :
            percentageScore >= 60 ? 'Good job!' : 'Keep practicing!';

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Quiz Results</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .score-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .score-number { font-size: 48px; font-weight: bold; margin: 10px 0; }
                .suggestions { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .suggestion-item { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2196F3; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎯 Quiz Results</h1>
                <p>Your performance summary is ready!</p>
            </div>
            
            <div class="content">
                <div class="score-card">
                    <h2>${performanceMessage}</h2>
                    <div class="score-number" style="color: ${scoreColor};">${percentageScore}%</div>
                    <p>You got <strong>${correctAnswersCount}</strong> out of <strong>${totalQuestions}</strong> questions correct</p>
                </div>

                <h3>📊 Quiz Details</h3>
                <div class="detail-row">
                    <span><strong>Quiz Title:</strong></span>
                    <span>${quizTitle}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Subject:</strong></span>
                    <span>${subject}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Grade Level:</strong></span>
                    <span>${gradeLevel}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Completed:</strong></span>
                    <span>${new Date(submissionTime).toLocaleString()}</span>
                </div>

                ${improvementSuggestions && improvementSuggestions.length > 0 ? `
                <div class="suggestions">
                    <h3>💡 AI-Powered Improvement Suggestions</h3>
                    <p>Based on your quiz responses, here are personalized recommendations to enhance your learning:</p>
                    ${improvementSuggestions.map((suggestion, index) => `
                        <div class="suggestion-item">
                            <strong>Suggestion ${index + 1}:</strong> ${suggestion}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <div class="footer">
                    <p>Keep learning and improving! 🚀</p>
                    <p><em>This email was sent by AI Quizzer - Your intelligent learning companion</em></p>
                </div>
            </div>
        </body>
        </html>
        `;

        const text = `
            Quiz Results - ${quizTitle}

            ${performanceMessage}
            Score: ${percentageScore}% (${correctAnswersCount}/${totalQuestions})

            Quiz Details:
            - Subject: ${subject}
            - Grade Level: ${gradeLevel}
            - Completed: ${new Date(submissionTime).toLocaleString()}

            ${improvementSuggestions && improvementSuggestions.length > 0 ? `
            AI-Powered Improvement Suggestions:
            ${improvementSuggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}
            ` : ''}

            Keep learning and improving!
            - AI Quizzer Team
                    `;

                    return { html, text };
        }

    async sendTestEmail(toEmail) {
        if (!this.transporter) {
            throw new Error('Email service not configured');
        }

        const mailOptions = {
            from: config.email.from,
            to: toEmail,
            subject: 'AI Quizzer - Email Service Test',
            html: '<h1>Email Service Working!</h1><p>Your AI Quizzer email configuration is set up correctly.</p>',
            text: 'Email Service Working! Your AI Quizzer email configuration is set up correctly.'
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService();