const axios = require('axios');
const config = require('../config/env.config');

const groqApiKey = config.groqApiKey;
const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions'; 

/*
 * Generates a quiz using the Groq API.
 * @param {string} subject The subject of the quiz.
 * @param {string} gradeLevel The grade level for the quiz.
 * @param {number} numQuestions The number of questions for the quiz.
 * @returns {Promise<object|null>} The parsed quiz data or null if an error occurs.
*/

async function generateQuizWithGroq(subject, gradeLevel, numQuestions = 5) {
    if (!groqApiKey) {
        console.error('Groq API key is not configured.');
        throw new Error('AI service not configured.');
    }

    const prompt = `
        Generate a quiz with ${numQuestions} multiple-choice questions for a ${gradeLevel} student on the subject of "${subject}".
        For each question, provide:
        1. "questionText": The text of the question.
        2. "options": An array of objects, where each object has "optionKey" (e.g., "a", "b", "c", "d") and "optionValue" (the text of the option). Provide 4 options.
        3. "correctAnswerKey": The key of the correct option (e.g., "a").
        4. "hint": (Optional) A brief hint for the question.

        Return the entire quiz as a single JSON object with a top-level key "questions" which is an array of these question objects.
        Ensure the JSON is valid. Example for one question:
        {
            "questionText": "What is 2+2?",
            "options": [
                {"optionKey": "a", "optionValue": "3"},
                {"optionKey": "b", "optionValue": "4"},
                {"optionKey": "c", "optionValue": "5"},
                {"optionKey": "d", "optionValue": "6"}
            ],
            "correctAnswerKey": "b",
            "hint": "It's an even number."
        }
    `;

    try {
        console.log("Sending request to Groq API...");
        const response = await axios.post(groqApiUrl, {
            model: "llama-3.1-8b-instant", 
            messages: [
                {
                    role: "system",
                    content: "You are an AI assistant that generates educational quizzes in JSON format."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7, 
            max_tokens: 2048, 
            response_format: { type: "json_object" } 
        }, {
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Groq API response received.");

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const content = response.data.choices[0].message.content;
            try {
                const parsedQuiz = JSON.parse(content);
                
                if (parsedQuiz && Array.isArray(parsedQuiz.questions)) {
                    return parsedQuiz; // Expecting { questions: [...] }
                } else {
                    console.error("Groq response content is not in the expected JSON structure:", content);
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch && jsonMatch[0]) {
                        try {
                            const fallbackParsed = JSON.parse(jsonMatch[0]);
                             if (fallbackParsed && Array.isArray(fallbackParsed.questions)) {
                                console.log("Successfully parsed JSON from fallback match.");
                                return fallbackParsed;
                            }
                        } catch (e) {
                            console.error("Fallback JSON parsing also failed:", e);
                        }
                    }
                    throw new Error('Groq response content is not in the expected structure.');
                }
            } catch (parseError) {
                console.error('Error parsing JSON from Groq response:', parseError);
                console.error('Raw Groq response content:', content);
                throw new Error('Failed to parse quiz data from AI service.');
            }
        } else {
            console.error('No choices found in Groq API response or unexpected response structure:', response.data);
            throw new Error('Failed to generate quiz: No response from AI model.');
        }
    } catch (error) {
        if (error.response) {
            console.error('Error calling Groq API:', error.response.status, error.response.data);
        } else {
            console.error('Error setting up Groq API request:', error.message);
        }
        throw new Error('An error occurred while communicating with the AI service.');
    }
}


async function generateHintWithGroq(questionText) {
    if (!groqApiKey) throw new Error('AI service not configured.');

    const prompt = `Provide a concise hint for the following multiple-choice question. Do not reveal the answer directly.
    Question: "${questionText}"
    Return only the hint as a short string.`;

    try {
        const response = await axios.post(groqApiUrl, {
            model: "llama-3.1-8b-instant", 
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 50
        }, { headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' } });

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content.trim();
        }
        return null;
    } catch (error) {
        console.error('Error generating hint with Groq:', error.response ? error.response.data : error.message);
        return null;
    }
}


async function generateSuggestionsWithGroq(incorrectAnswers) {
    if (!groqApiKey) throw new Error('AI service not configured.');
    if (!incorrectAnswers || incorrectAnswers.length === 0) return [];

    const questionsSummary = incorrectAnswers.map(ans =>
        `For the question "${ans.questionText}", the user answered "${ans.selectedAnswerKey}" but the correct answer was "${ans.correctAnswerKey}".`
    ).join('\n');

    const prompt = `
        Based on the following incorrectly answered questions, provide two distinct and actionable suggestions for the student to improve their understanding of the related topics.
        Keep each suggestion concise.
        Incorrect answers:
        ${questionsSummary}

        Return the suggestions as a JSON array of strings. For example: ["Suggestion 1", "Suggestion 2"]
    `;

    try {
        const response = await axios.post(groqApiUrl, {
            model: "llama-3.1-8b-instant", 
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            max_tokens: 200,
            response_format: { type: "json_object" }
        }, { headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' } });

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const content = response.data.choices[0].message.content;
            try {
                const parsedSuggestions = JSON.parse(content);
                
                if (parsedSuggestions.suggestions && Array.isArray(parsedSuggestions.suggestions)) {
                    return parsedSuggestions.suggestions;
                } else if (Array.isArray(parsedSuggestions)) {
                    return parsedSuggestions;
                }
                console.error("Groq suggestions response not in expected array format:", content);
                return null;

            } catch (parseError) {
                console.error('Error parsing suggestions JSON from Groq:', parseError, "Content:", content);
                return null;
            }
        }
        return null;
    } catch (error) {
        console.error('Error generating suggestions with Groq:', error.response ? error.response.data : error.message);
        return null;
    }
}


module.exports = {
    generateQuizWithGroq,
    generateHintWithGroq,
    generateSuggestionsWithGroq,
};