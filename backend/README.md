### Demo Video
[![Watch the video](https://img.youtube.com/vi/HtK9XOsYpcQ/0.jpg)](https://www.youtube.com/watch?v=HtK9XOsYpcQ)

# AI Quizzer Microservice

This microservice provides REST API endpoints for an AI Quizzer application. It handles user authentication (mock), quiz generation using the Groq AI API, quiz submissions, scoring, and history tracking.

## Table of Contents
1.  [Features](#features)
2.  [Tech Stack](#tech-stack)
3.  [Prerequisites](#prerequisites)
4.  [Setup and Installation](#setup-and-installation)
5.  [Environment Variables](#environment-variables)
6.  [Running the Application](#running-the-application)
7.  [API Endpoints](#api-endpoints)
8.  [Database Schema](#database-schema)
9.  [Docker Deployment](#docker-deployment)
10. [Bonus Functionalities](#bonus-functionalities)

## Features

*   **Mock User Authentication:** Login with any username/password to get a JWT.
*   **AI-Powered Quiz Generation:** Dynamically creates quizzes based on subject and grade level using Groq.
*   **Quiz Submission & Scoring:** Allows users to submit answers and receive evaluated scores.
*   **Quiz History:** Retrieves past quiz attempts with filtering options.
*   **Quiz Retries:** Allows users to retake quizzes.
*   **(Bonus) AI Hints:** Provides hints for questions.
*   **(Bonus) AI Improvement Suggestions:** Offers suggestions based on incorrect answers.

## Tech Stack

*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (with Mongoose ODM)
*   **AI Integration:** Groq API
*   **Authentication:** JSON Web Tokens (JWT)
*   **Containerization:** Docker

## Prerequisites

*   Node.js (v16 or higher recommended)
*   npm (comes with Node.js)
*   MongoDB (local instance or a MongoDB Atlas account)
*   Groq API Key (from [GroqCloud](https://groq.com/))
*   Docker (optional, for containerized deployment)

## Setup and Installation

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    Create a `.env` file in the root directory of the project. Copy the contents from `.env.example` (if provided) or use the template below and fill in your actual credentials.

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string # e.g., mongodb://localhost:27017/ai_quizzer_db or Atlas URI
JWT_SECRET=your_super_secret_and_long_jwt_key # Choose a strong, random string
GROQ_API_KEY=your_groq_api_key_from_groq_dashboard
```
**Important:** Ensure `JWT_SECRET` is a strong, unique key. Do NOT commit your `.env` file to version control.

## Running the Application

*   **Development Mode (with Nodemon for auto-restarts):**
    ```bash
    npm run dev
    ```

The application will start on the port specified in your `.env` file (default: 3000).
Access it at `http://localhost:3000`.

## API Endpoints

(You will need to document these using Postman Collection or Swagger/OpenAPI specification as required by the task)

**Base URL:** `http://localhost:3000/api`

### Authentication

*   **`POST /auth/login`**
    *   **Description:** Mock login. Accepts any username/password.
    *   **Request Body:**
        ```json
        {
            "username": "anyuser",
            "password": "anypassword"
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
            "message": "Login successful",
            "token": "your.jwt.token",
            "user": { "username": "anyuser" }
        }
        ```

### Quizzes (Protected - Requires `Authorization: Bearer <token>` header)

*   **`POST /quizzes/generate`**
    *   **Description:** Generates a new quiz using AI.
    *   **Request Body:**
        ```json
        {
            "title": "Introduction to Algebra",
            "subject": "Mathematics",
            "gradeLevel": "8th Grade",
            "numQuestions": 5 // Optional, defaults to 5 in service
        }
        ```
    *   **Response (Success 201):** The generated quiz object.

*   **`POST /quizzes/submit`**
    *   **Description:** Submits answers for a quiz.
    *   **Request Body:**
        ```json
        {
            "quizId": "mongoose_object_id_of_quiz",
            "answers": [
                { "questionId": "mongoose_object_id_of_question1", "selectedAnswerKey": "a" },
                { "questionId": "mongoose_object_id_of_question2", "selectedAnswerKey": "c" }
            ]
        }
        ```
    *   **Response (Success 200):** Submission result, score, and (bonus) improvement suggestions.

*   **`GET /quizzes/history`**
    *   **Description:** Retrieves quiz submission history for the authenticated user.
    *   **Query Parameters (Optional Filters):**
        *   `subject` (e.g., `Mathematics`)
        *   `grade` (e.g., `8th Grade`)
        *   `marks_gte` (e.g., `70` - score greater than or equal to)
        *   `marks_lte` (e.g., `90` - score less than or equal to)
        *   `from` (e.g., `2024-01-01` - completed date from)
        *   `to` (e.g., `2024-12-31` - completed date to)
        *   `date` (e.g., `2024-07-15` - specific completed date)
    *   **Response (Success 200):** Array of submission objects.

*   **`POST /quizzes/retry`**
    *   **Description:** Allows a user to retry a previously submitted quiz.
    *   **Request Body:**
        ```json
        {
            "originalSubmissionId": "mongoose_object_id_of_original_submission",
            "answers": [ // New set of answers
                { "questionId": "mongoose_object_id_of_question1", "selectedAnswerKey": "b" },
                { "questionId": "mongoose_object_id_of_question2", "selectedAnswerKey": "d" }
            ]
        }
        ```
    *   **Response (Success 200):** New submission result for the retry.

*   **`GET /quizzes/:quizId`**
    *   **Description:** Retrieves a specific quiz by its ID.
    *   **Response (Success 200):** The quiz object.

*   **`GET /quizzes/:quizId/questions/:questionId/hint` (Bonus)**
    *   **Description:** Retrieves a hint for a specific question in a quiz.
    *   **Response (Success 200):**
        ```json
        {
            "hint": "The hint text..."
        }
        ```

## Database Schema

The application uses MongoDB. The main Mongoose models are:

*   **User:** (Optional for mock auth, but good for future expansion)
    *   `username` (String, unique, required)
    *   `createdAt` (Date)
*   **Quiz:**
    *   `title` (String, required)
    *   `subject` (String, required)
    *   `gradeLevel` (String, required)
    *   `questions` (Array of Question subdocuments)
        *   `questionText` (String, required)
        *   `options` (Array of {optionKey: String, optionValue: String}, required)
        *   `correctAnswerKey` (String, required)
        *   `hint` (String, optional)
    *   `createdByAiTool` (String)
    *   `createdAt` (Date)
*   **QuizSubmission:**
    *   `studentId` (String, required - username from JWT)
    *   `quizId` (ObjectId, ref: 'Quiz', required)
    *   `quizTitle`, `subject`, `gradeLevel` (Denormalized Strings)
    *   `answers` (Array of SubmissionAnswer subdocuments)
        *   `questionId` (ObjectId, required)
        *   `questionText`, `correctAnswerKey` (Denormalized Strings)
        *   `selectedAnswerKey` (String, required)
        *   `isCorrect` (Boolean, required)
    *   `score` (Number, required)
    *   `totalQuestions`, `correctAnswersCount` (Number)
    *   `submissionTime`, `completedDate` (Date)
    *   `isRetry` (Boolean)
    *   `originalSubmissionId` (ObjectId, ref: 'QuizSubmission', nullable)

## Bonus Functionalities

*   **Hints:** Integrated via `GET /api/quizzes/:quizId/questions/:questionId/hint`.
*   **Email Notifications:** *TODO: Implement an email service (e.g., using Nodemailer with SendGrid, Mailgun, or SMTP) to send results and suggestions.*
*   **Improvement Suggestions:** Integrated into quiz submission and retry responses.
*   **Caching Layer (Redis):** *TODO: Implement Redis caching for quiz data to reduce latency. This would involve:
    *   Adding `ioredis` or `redis` npm package.
    *   Setting up a Redis client.
    *   Modifying service functions (e.g., `getQuizById`, potentially `getQuizHistory` for common queries) to check cache first, and if not found, fetch from DB and store in cache.*

## 🎯 Bonus Features

### Email Notifications

The application can send beautiful HTML email notifications with quiz results and AI-generated improvement suggestions.

**Setup:**
1. Configure email settings in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password  # Use App Password for Gmail
EMAIL_FROM=AI Quizzer <your_email@gmail.com>
```

2. For Gmail, enable 2FA and create an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

**Usage:**
- Include `email` field in login request
- Include `email` field in quiz submission/retry requests
- Test with: `POST /api/quizzes/test-email`


### AI Improvement Suggestions

Personalized learning recommendations based on incorrect answers.

**Features:**
- Analyzes wrong answers using Groq AI
- Generates 2 specific improvement suggestions
- Included in email notifications
- Available in API responses

**Example Suggestions:**
```json
{
  "improvementSuggestions": [
    "Focus on reviewing the differences between plant and animal cells, particularly cell wall structures.",
    "Practice more problems involving photosynthesis and cellular respiration to strengthen your understanding."
  ]
}
```
