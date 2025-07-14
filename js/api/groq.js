// Groq API integration for LLaMA 3 AI assistance
class GroqAPI {
    constructor() {
        this.apiUrl = CONFIG.GROQ_API_URL; // Direct API URL
        this.apiKey = CONFIG.GROQ_API_KEY;
        this.model = CONFIG.GROQ_MODEL;
        this.defaultParams = {
            temperature: CONFIG.GROQ_TEMPERATURE,
            max_tokens: CONFIG.GROQ_MAX_TOKENS,
            top_p: 1,
            stream: false
        };
    }
    
    // Make API request directly to Groq
    async makeRequest(messages, options = {}) {
        try {
            const requestBody = {
                model: this.model,
                messages: messages,
                ...this.defaultParams,
                ...options
            };
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Groq API Error:', response.status, errorText);
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            console.error('Error making API request:', error);
            throw new Error(CONFIG.ERROR_MESSAGES.GROQ_API_ERROR);
        }
    }
    
// Select best videos from YouTube search results
async selectBestVideos(videos, learningGoal, skillLevel, count = CONFIG.SELECTED_VIDEOS) {
    try {
        const videosData = videos.map(video => ({
            videoId: video.videoId,
            title: video.title,
            description: video.description ? video.description.substring(0, 200) : ''
        }));
        
        const prompt = `You are an AI learning curator. Analyze the provided YouTube videos and select the ${count} best videos for learning ${learningGoal} at ${skillLevel} level.

Consider:
- Video quality and educational value
- Appropriate difficulty level
- Clear explanations and good production
- Logical learning progression

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
    "selectedVideos": [
        {
            "videoId": "video_id",
            "title": "video_title",
            "reason": "why_selected",
            "order": 1,
            "concepts": ["concept1", "concept2"]
        }
    ],
    "learningPlan": {
        "sequence": "recommended_learning_order",
        "focusAreas": ["area1", "area2"],
        "prerequisites": [],
        "expectedOutcome": "what_student_will_learn"
    }
}

Keep concepts arrays short (max 5 items). Do not include any text before or after the JSON.`;
        
        const messages = [
            {
                role: 'system',
                content: prompt
            },
            {
                role: 'user',
                content: `Here are the YouTube videos to analyze:\n\n${JSON.stringify(videosData, null, 2)}`
            }
        ];
        
        const response = await this.makeRequest(messages);
        
        // Clean the response to extract JSON
        let jsonResponse = this.cleanJsonResponse(response);
        
        // Try to parse JSON response
        try {
            const parsedResponse = JSON.parse(jsonResponse);
            
            // Validate the response structure
            if (!parsedResponse.selectedVideos || !Array.isArray(parsedResponse.selectedVideos)) {
                throw new Error('Invalid response structure');
            }
            
            // Ensure we have the right number of videos
            if (parsedResponse.selectedVideos.length === 0) {
                throw new Error('No videos selected');
            }
            
            // Limit to requested count
            parsedResponse.selectedVideos = parsedResponse.selectedVideos.slice(0, count);
            
            // Ensure learningPlan exists
            if (!parsedResponse.learningPlan) {
                parsedResponse.learningPlan = {
                    sequence: `Progressive learning path for ${learningGoal}`,
                    focusAreas: [learningGoal, 'Practical Application'],
                    prerequisites: CONFIG.LEARNING_GOALS[learningGoal]?.prerequisites || [],
                    expectedOutcome: `Master ${learningGoal} fundamentals`
                };
            }
            
            return parsedResponse;
            
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            console.log('Raw response:', response);
            console.log('Cleaned response:', jsonResponse);
            
            // Enhanced fallback: create a structured response
            const fallbackVideos = videos.slice(0, count).map((video, index) => ({
                videoId: video.videoId,
                title: video.title,
                reason: `Selected as video ${index + 1} for ${learningGoal} learning`,
                order: index + 1,
                concepts: this.extractConceptsFromTitle(video.title, learningGoal)
            }));
            
            return {
                selectedVideos: fallbackVideos,
                learningPlan: {
                    sequence: `Progressive learning path for ${learningGoal}`,
                    focusAreas: [learningGoal, 'Practical Application', 'Best Practices'],
                    prerequisites: CONFIG.LEARNING_GOALS[learningGoal]?.prerequisites || [],
                    expectedOutcome: `Master ${learningGoal} fundamentals and gain practical skills`
                }
            };
        }
        
    } catch (error) {
        console.error('Error selecting best videos:', error);
        
        // Final fallback if everything fails
        const fallbackVideos = videos.slice(0, count).map((video, index) => ({
            videoId: video.videoId,
            title: video.title,
            reason: 'Selected by fallback method',
            order: index + 1,
            concepts: ['General concepts']
        }));
        
        return {
            selectedVideos: fallbackVideos,
            learningPlan: {
                sequence: 'Sequential learning',
                focusAreas: [learningGoal],
                prerequisites: [],
                expectedOutcome: `Learn ${learningGoal} basics`
            }
        };
    }
}

// Helper method to extract concepts from video title
extractConceptsFromTitle(title, learningGoal) {
    const concepts = [];
    
    // Common programming concepts
    const conceptKeywords = {
        'JavaScript Programming': ['variables', 'functions', 'objects', 'arrays', 'loops', 'conditions'],
        'Python Programming': ['variables', 'functions', 'classes', 'loops', 'data structures'],
        'Web Development': ['HTML', 'CSS', 'JavaScript', 'responsive design', 'frontend'],
        'Machine Learning': ['algorithms', 'models', 'data processing', 'neural networks'],
        'Data Science': ['analysis', 'visualization', 'statistics', 'pandas', 'numpy'],
        'UI/UX Design': ['user interface', 'user experience', 'design principles', 'prototyping']
    };
    
    const keywords = conceptKeywords[learningGoal] || ['fundamentals', 'basics', 'concepts'];
    
    // Extract relevant concepts from title
    const lowerTitle = title.toLowerCase();
    keywords.forEach(keyword => {
        if (lowerTitle.includes(keyword.toLowerCase())) {
            concepts.push(keyword);
        }
    });
    
    // If no concepts found, use default
    if (concepts.length === 0) {
        concepts.push('Core concepts', 'Fundamentals');
    }
    
    return concepts.slice(0, 3); // Limit to 3 concepts
}
    
// Generate chapter breakdown for a video
async generateChapterBreakdown(videoTitle, videoDescription, skillLevel) {
    try {
        const prompt = `Analyze the video "${videoTitle}" and create a detailed chapter breakdown for a ${skillLevel} learner.

IMPORTANT: Respond with ONLY valid JSON in this exact format:
{
    "chapters": [
        {
            "title": "Chapter Title",
            "timestamp": "0:00",
            "concepts": ["concept1", "concept2"],
            "importance": "high"
        }
    ],
    "keyTakeaways": ["takeaway1", "takeaway2"],
    "practicalTips": ["tip1", "tip2"]
}

Do not include any text before or after the JSON.`;
        
        const messages = [
            {
                role: 'system',
                content: prompt
            },
            {
                role: 'user',
                content: `Generate chapter breakdown for: ${videoTitle}\n\nDescription: ${videoDescription.substring(0, 300)}`
            }
        ];
        
        const response = await this.makeRequest(messages);
        
        try {
            let jsonResponse = this.cleanJsonResponse(response);
            return JSON.parse(jsonResponse);
        } catch (parseError) {
            console.error('Failed to parse chapter breakdown:', parseError);
            // Fallback response
            return {
                chapters: [
                    {
                        title: 'Introduction',
                        timestamp: '0:00',
                        concepts: ['Overview', 'Getting Started'],
                        importance: 'high'
                    },
                    {
                        title: 'Main Content',
                        timestamp: '2:00',
                        concepts: ['Core Concepts', 'Implementation'],
                        importance: 'high'
                    },
                    {
                        title: 'Practical Examples',
                        timestamp: '10:00',
                        concepts: ['Examples', 'Use Cases'],
                        importance: 'high'
                    },
                    {
                        title: 'Conclusion',
                        timestamp: '15:00',
                        concepts: ['Summary', 'Next Steps'],
                        importance: 'medium'
                    }
                ],
                keyTakeaways: [`Key points from ${videoTitle}`, 'Practical applications', 'Best practices'],
                practicalTips: ['Practice regularly', 'Take notes', 'Build projects', 'Review concepts']
            };
        }
        
    } catch (error) {
        console.error('Error generating chapter breakdown:', error);
        throw error;
    }
}
    
async generateQuiz(videoTitle, videoDescription, skillLevel, questionCount = CONFIG.QUIZ_QUESTIONS) {
    try {
        const prompt = `Generate ${questionCount} multiple choice questions about "${videoTitle}" for ${skillLevel} level learners.

IMPORTANT: Respond with ONLY valid JSON in this exact format:
{
    "questions": [
        {
            "type": "multiple_choice",
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A",
            "explanation": "Why this is correct",
            "difficulty": "easy"
        }
    ]
}

Make sure:
- Questions are relevant to the video content
- Options are realistic and plausible
- Difficulty matches the skill level (${skillLevel})
- Explanations are clear and educational
- Use only "easy", "medium", or "hard" for difficulty

Do not include any text before or after the JSON.`;
        
        const messages = [
            {
                role: 'system',
                content: prompt
            },
            {
                role: 'user',
                content: `Generate quiz for: ${videoTitle}\n\nDescription: ${videoDescription ? videoDescription.substring(0, 300) : 'No description available'}\n\nSkill Level: ${skillLevel}`
            }
        ];
        
        const response = await this.makeRequest(messages);
        
        try {
            // Clean and parse JSON response
            let jsonResponse = this.cleanJsonResponse(response);
            
            // Try to parse the JSON
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(jsonResponse);
            } catch (parseError) {
                console.warn('Failed to parse AI response, using fallback quiz');
                return this.generateFallbackQuiz(videoTitle, skillLevel, questionCount);
            }
            
            // Validate response structure
            if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
                console.warn('Invalid AI response structure, using fallback quiz');
                return this.generateFallbackQuiz(videoTitle, skillLevel, questionCount);
            }
            
            // Ensure we have enough questions
            if (parsedResponse.questions.length < questionCount) {
                console.warn('Not enough questions from AI, using fallback quiz');
                return this.generateFallbackQuiz(videoTitle, skillLevel, questionCount);
            }
            
            // Ensure each question has required fields and clean the options
            parsedResponse.questions = parsedResponse.questions.map((q, index) => {
                // Clean options by removing letter prefixes
                const cleanedOptions = q.options ? q.options.map(option => {
                    // Remove "A ", "B ", "C ", "D " prefixes
                    return option.replace(/^[A-D]\s+/i, '').trim();
                }) : ['Option A', 'Option B', 'Option C', 'Option D'];

                // Clean correct answer
                const cleanedCorrectAnswer = q.correct_answer ? 
                    q.correct_answer.replace(/^[A-D]\s+/i, '').trim() : cleanedOptions[0];

                return {
                    type: q.type || 'multiple_choice',
                    question: q.question || `Question ${index + 1}`,
                    options: cleanedOptions,
                    correct_answer: cleanedCorrectAnswer,
                    explanation: q.explanation || 'No explanation provided',
                    difficulty: q.difficulty || 'medium'
                };
            });
            
            // Limit to requested count
            parsedResponse.questions = parsedResponse.questions.slice(0, questionCount);
            
            console.log('✅ AI quiz generated successfully');
            return parsedResponse;
            
        } catch (parseError) {
            console.error('Failed to parse quiz:', parseError);
            console.log('Raw response:', response);
            
            // Fallback quiz generation
            return this.generateFallbackQuiz(videoTitle, skillLevel, questionCount);
        }
        
    } catch (error) {
        console.error('Error generating quiz:', error);
        // Return fallback quiz
        return this.generateFallbackQuiz(videoTitle, skillLevel, questionCount);
    }
}
    
    // Chat with AI tutor
    async chatWithTutor(question, videoTitle, skillLevel, context = '') {
        try {
            const prompt = CONFIG.AI_PROMPTS.CHAT_RESPONSE
                .replace('{title}', videoTitle)
                .replace('{skillLevel}', skillLevel)
                .replace('{question}', question);
            
            const messages = [
                {
                    role: 'system',
                    content: prompt
                }
            ];
            
            // Add context if provided
            if (context) {
                messages.push({
                    role: 'user',
                    content: `Context: ${context}`
                });
            }
            
            messages.push({
                role: 'user',
                content: question
            });
            
            const response = await this.makeRequest(messages);
            return response;
            
        } catch (error) {
            console.error('Error chatting with tutor:', error);
            throw error;
        }
    }

// Generate fallback quiz when AI fails
generateFallbackQuiz(videoTitle, skillLevel, questionCount) {
    const fallbackQuestions = [];
    
    // Generate basic questions about the video
    for (let i = 0; i < questionCount; i++) {
        const questionTemplates = [
            {
                question: `What is the main topic covered in "${videoTitle}"?`,
                options: [
                    'The primary concept discussed in the video',
                    'A secondary supporting topic',
                    'An unrelated concept',
                    'Background information only'
                ],
                correct_answer: 'The primary concept discussed in the video',
                explanation: 'This video focuses on the main topic mentioned in the title.'
            },
            {
                question: `For a ${skillLevel} learner, what is the most important takeaway from this video?`,
                options: [
                    'Understanding the fundamental concepts',
                    'Memorizing specific details',
                    'Skipping to advanced topics',
                    'Focusing only on examples'
                ],
                correct_answer: 'Understanding the fundamental concepts',
                explanation: 'Building a strong foundation is crucial for effective learning.'
            },
            {
                question: `What should you do after watching this video?`,
                options: [
                    'Practice the concepts shown',
                    'Immediately move to the next video',
                    'Skip the practical exercises',
                    'Only watch more videos'
                ],
                correct_answer: 'Practice the concepts shown',
                explanation: 'Active practice reinforces learning and helps retain knowledge.'
            },
            {
                question: `How does this video relate to your ${skillLevel} learning journey?`,
                options: [
                    'It builds essential foundation knowledge',
                    'It\'s not relevant to my level',
                    'It only covers advanced topics',
                    'It\'s purely theoretical'
                ],
                correct_answer: 'It builds essential foundation knowledge',
                explanation: 'Each video is selected to match your current skill level and learning goals.'
            },
            {
                question: `What is the best way to retain information from this video?`,
                options: [
                    'Take notes and practice regularly',
                    'Watch it once and move on',
                    'Only focus on the conclusion',
                    'Skip the explanations'
                ],
                correct_answer: 'Take notes and practice regularly',
                explanation: 'Active engagement through note-taking and practice improves retention.'
            }
        ];
        
        const template = questionTemplates[i % questionTemplates.length];
        fallbackQuestions.push({
            type: 'multiple_choice',
            question: template.question,
            options: template.options,
            correct_answer: template.correct_answer,
            explanation: template.explanation,
            difficulty: skillLevel === 'beginner' ? 'easy' : skillLevel === 'expert' ? 'hard' : 'medium'
        });
    }
    
    return {
        questions: fallbackQuestions.slice(0, questionCount)
    };
}

cleanJsonResponse(response) {
    if (!response || typeof response !== 'string') {
        throw new Error('Invalid response format');
    }
    
    // Remove any text before the first {
    let cleaned = response.substring(response.indexOf('{'));
    
    // Remove any text after the last }
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
        cleaned = cleaned.substring(0, lastBrace + 1);
    }
    
    // Remove any markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any extra whitespace and newlines
    cleaned = cleaned.trim();
    
    return cleaned;
}
    
    // Generate revision notes
    async generateRevisionNotes(topic, skillLevel, completedVideos = []) {
        try {
            const prompt = CONFIG.AI_PROMPTS.REVISION_NOTES
                .replace('{skillLevel}', skillLevel)
                .replace('{topic}', topic);
            
            const videoTitles = completedVideos.map(v => v.title).join(', ');
            
            const messages = [
                {
                    role: 'system',
                    content: prompt
                },
                {
                    role: 'user',
                    content: `Generate revision notes for ${topic} based on these completed videos: ${videoTitles}`
                }
            ];
            
            const response = await this.makeRequest(messages);
            return response;
            
        } catch (error) {
            console.error('Error generating revision notes:', error);
            throw error;
        }
    }
    
    // Analyze learning progress and provide feedback
    async analyzeProgress(progressData) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: `You are an AI learning analyst. Analyze the student's learning progress and provide constructive feedback and recommendations.`
                },
                {
                    role: 'user',
                    content: `Here's the learning progress data:\n\n${JSON.stringify(progressData, null, 2)}\n\nProvide analysis and recommendations.`
                }
            ];
            
            const response = await this.makeRequest(messages);
            return response;
            
        } catch (error) {
            console.error('Error analyzing progress:', error);
            throw error;
        }
    }
    
    // Get learning recommendations
    async getRecommendations(userProfile, completedTopics = []) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: `You are an AI learning advisor. Based on the user's profile and completed learning, recommend next steps and advanced topics.`
                },
                {
                    role: 'user',
                    content: `User profile: ${JSON.stringify(userProfile)}\nCompleted topics: ${completedTopics.join(', ')}\n\nWhat should they learn next?`
                }
            ];
            
            const response = await this.makeRequest(messages);
            return response;
            
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }
    
    // Generate study plan
    async generateStudyPlan(learningGoal, skillLevel, timeAvailable, preferences = {}) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: `You are an AI study planner. Create a detailed study plan based on the user's goals, skill level, and time availability.`
                },
                {
                    role: 'user',
                    content: `Goal: ${learningGoal}\nSkill Level: ${skillLevel}\nTime Available: ${timeAvailable}\nPreferences: ${JSON.stringify(preferences)}\n\nCreate a structured study plan.`
                }
            ];
            
            const response = await this.makeRequest(messages);
            return response;
            
        } catch (error) {
            console.error('Error generating study plan:', error);
            throw error;
        }
    }
    
    // Explain concepts in simple terms
    async explainConcept(concept, skillLevel, context = '') {
        try {
            const messages = [
                {
                    role: 'system',
                    content: `You are an AI tutor. Explain concepts clearly and appropriately for the user's skill level. Use analogies and examples when helpful.`
                },
                {
                    role: 'user',
                    content: `Explain "${concept}" for a ${skillLevel} learner. ${context ? `Context: ${context}` : ''}`
                }
            ];
            
            const response = await this.makeRequest(messages);
            return response;
            
        } catch (error) {
            console.error('Error explaining concept:', error);
            throw error;
        }
    }
    
    // Generate practice exercises
    async generatePracticeExercises(topic, skillLevel, exerciseType = 'mixed') {
        try {
            const messages = [
                {
                    role: 'system',
                    content: `You are an AI instructor. Generate practical exercises for students to practice their skills.`
                },
                {
                    role: 'user',
                    content: `Generate ${exerciseType} practice exercises for ${topic} at ${skillLevel} level. Include solutions and explanations.`
                }
            ];
            
            const response = await this.makeRequest(messages);
            return response;
            
        } catch (error) {
            console.error('Error generating practice exercises:', error);
            throw error;
        }
    }
    
    // Rate limit handling
    async makeRequestWithRetry(messages, options = {}, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.makeRequest(messages, options);
            } catch (error) {
                lastError = error;
                
                // Check if it's a rate limit error
                if (error.message.includes('rate limit')) {
                    const delay = Math.pow(2, i) * 1000; // Exponential backoff
                    console.log(`Rate limited, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                
                // For other errors, don't retry
                throw error;
            }
        }
        
        throw lastError;
    }

// Update the chatWithAI method:

async chatWithAI(message, currentVideo, learningSession) {
    try {
        const context = currentVideo ? {
            videoTitle: currentVideo.title,
            skillLevel: learningSession?.skillLevel || 'beginner',
            learningGoal: learningSession?.learningGoal || 'General Learning'
        } : {};
        
        let systemPrompt = 'You are a helpful AI tutor. Answer the student\'s question clearly and helpfully.';
        
        if (context.videoTitle) {
            systemPrompt = `You are an AI tutor helping a ${context.skillLevel} student learn ${context.learningGoal}. 
            
            The student is currently watching: "${context.videoTitle}"
            
            Provide helpful, clear explanations that match their skill level. Use examples when appropriate and be encouraging.`;
        }
        
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: message
            }
        ];
        
        const response = await this.makeRequest(messages);
        return response;
        
    } catch (error) {
        console.error('Error in AI chat:', error);
        
        // Return helpful fallback responses based on message content
        return this.getFallbackResponse(message, currentVideo, learningSession);
    }
}

// Add fallback response method
getFallbackResponse(message, currentVideo, learningSession) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
        return `I'd be happy to help explain that! However, I'm currently having trouble connecting to the AI service. 
        
        For now, I recommend:
        1. Reviewing the current video: "${currentVideo?.title || 'the current lesson'}"
        2. Taking notes on key concepts
        3. Trying the question again in a moment
        
        The AI service should be back online shortly. Thank you for your patience!`;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('don\'t understand')) {
        return `I understand you need help! While I'm having trouble connecting to the AI service right now, here are some suggestions:
        
        1. Pause the video and rewatch the relevant section
        2. Check if there are any provided resources or documentation
        3. Break down the concept into smaller parts
        4. Try asking a more specific question
        
        I'll be back online soon to provide better assistance!`;
    }
    
    if (lowerMessage.includes('summary') || lowerMessage.includes('recap')) {
        return `I'd love to provide a summary! Unfortunately, I'm currently experiencing connection issues with the AI service.
        
        In the meantime, try:
        1. Reviewing the key points from "${currentVideo?.title || 'the current video'}"
        2. Writing down the main concepts covered
        3. Creating your own summary notes
        
        This will actually help with retention while I get back online!`;
    }
    
    // Generic fallback
    return `Thank you for your question! I'm currently having trouble connecting to the AI service, but I'll be back online shortly.
    
    While you wait:
    - Continue with the current lesson
    - Take notes on anything unclear
    - Try asking again in a few moments
    
    I'm here to help as soon as the connection is restored!`;
}

// Generate learning summary
async generateLearningSummary(progress, userData) {
    try {
        const completedVideos = progress.videos.filter(v => v.completed);
        const statistics = {
            totalVideos: progress.videos.length,
            completedVideos: completedVideos.length,
            progressPercentage: progress.overallProgress,
            averageQuizScore: completedVideos.length > 0 
                ? Math.round(completedVideos.reduce((sum, v) => sum + (v.quizScore || 0), 0) / completedVideos.length)
                : 0
        };
        
        const prompt = `Generate a comprehensive learning summary for a student who has completed their learning journey.

        Student Information:
        - Name: ${userData.name}
        - Learning Goal: ${userData.learningGoal}
        - Skill Level: ${userData.skillLevel}
        - Videos Completed: ${statistics.completedVideos}/${statistics.totalVideos}
        - Overall Progress: ${statistics.progressPercentage}%
        - Average Quiz Score: ${statistics.averageQuizScore}%

        Please provide:
        1. A congratulatory message
        2. Key achievements and progress made
        3. Skills acquired and knowledge gained
        4. Areas of strength based on performance
        5. Suggestions for continued learning
        6. Motivational closing

        Keep the tone encouraging and personalized. Focus on the student's journey and growth.`;
        
        const messages = [
            {
                role: 'system',
                content: 'You are an AI learning coach providing personalized feedback to students. Be encouraging, specific, and motivational.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];
        
        const response = await this.makeRequest(messages);
        return response;
        
    } catch (error) {
        console.error('Error generating learning summary:', error);
        
        // Fallback summary
        return `Congratulations, ${userData.name}! 🎉

        You've successfully completed your ${userData.learningGoal} learning journey! Here's what you've accomplished:

        ✅ **Progress Made:**
        - Completed ${progress.videos.filter(v => v.completed).length} out of ${progress.videos.length} videos
        - Achieved ${progress.overallProgress}% overall progress
        - Demonstrated ${userData.skillLevel} level understanding

        🎯 **Key Achievements:**
        - Built a solid foundation in ${userData.learningGoal}
        - Developed practical skills through video lessons
        - Showed commitment to continuous learning

        🚀 **Next Steps:**
        - Practice what you've learned with real projects
        - Explore advanced topics in ${userData.learningGoal}
        - Share your knowledge with others
        - Consider related areas of study

        Keep up the excellent work! Learning is a journey, and you've taken important steps forward. Your dedication and effort will serve you well in your continued growth.`;
    }
}

}

const groqAPI = new GroqAPI();
window.groqAPI = groqAPI;

// Debug: Log available methods
console.log('GroqAPI methods:', Object.getOwnPropertyNames(groqAPI));
console.log('GroqAPI prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(groqAPI)));