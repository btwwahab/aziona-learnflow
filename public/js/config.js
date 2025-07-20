// Configuration settings for the application
const CONFIG = {
    // App Information
    APP_NAME: 'Aziona LearnFlow',
    VERSION: '1.0.0',

    // API URLs - Updated for local development
    YOUTUBE_API_URL: 'https://www.googleapis.com/youtube/v3/search',
    YOUTUBE_DETAILS_URL: 'https://www.googleapis.com/youtube/v3/videos',
    GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',

    // Your actual API keys


    // Rest of your configuration remains the same...
    GROQ_MODEL: 'llama3-8b-8192',
    GROQ_TEMPERATURE: 0.7,
    GROQ_MAX_TOKENS: 1024,

    // YouTube Search Parameters
    YOUTUBE_SEARCH_PARAMS: {
        part: 'snippet',
        type: 'video',
        videoDuration: 'medium',
        videoDefinition: 'high',
        order: 'relevance'
    },

    // Animation Settings
    ANIMATION_DURATION: 300,
    STAGGER_DELAY: 100,

    // Quiz Settings
    QUIZ_QUESTIONS: 5,
    QUIZ_TIME_LIMIT: 300, // 5 minutes in seconds

    // Learning Settings
    VIDEOS_PER_TOPIC: 10,
    SELECTED_VIDEOS: 5,
    MAX_VIDEOS: 20,

    // Storage Keys
    STORAGE_KEYS: {
        USER_PROFILE: 'user-profile',
        LEARNING_PROGRESS: 'learning-progress',
        QUIZ_HISTORY: 'quiz-history',
        THEME: 'selected-theme'
    },

    // Learning Goals Configuration
    LEARNING_GOALS: {
        'Python Programming': {
            keywords: ['python', 'programming', 'tutorial', 'beginner'],
            prerequisites: [],
            difficulty: 'beginner'
        },
        'JavaScript Programming': {
            keywords: ['javascript', 'js', 'programming', 'tutorial'],
            prerequisites: [],
            difficulty: 'beginner'
        },
        'Web Development': {
            keywords: ['web development', 'html', 'css', 'frontend'],
            prerequisites: [],
            difficulty: 'beginner'
        },
        'UI/UX Design': {
            keywords: ['ui ux design', 'user interface', 'user experience'],
            prerequisites: [],
            difficulty: 'beginner'
        },
        'Machine Learning': {
            keywords: ['machine learning', 'ml', 'artificial intelligence'],
            prerequisites: ['Python Programming'],
            difficulty: 'intermediate'
        },
        'Data Science': {
            keywords: ['data science', 'data analysis', 'statistics'],
            prerequisites: ['Python Programming'],
            difficulty: 'intermediate'
        }
    },

    // Skill Levels Configuration
    SKILL_LEVELS: {
        'beginner': {
            searchModifier: 'beginner tutorial basics',
            difficulty: 1
        },
        'intermediate': {
            searchModifier: 'intermediate advanced',
            difficulty: 2
        },
        'expert': {
            searchModifier: 'advanced expert professional',
            difficulty: 3
        }
    },

    // Error Messages
    ERROR_MESSAGES: {
        API_ERROR: 'Failed to connect to the service. Please check your internet connection.',
        YOUTUBE_API_ERROR: 'YouTube service is temporarily unavailable.',
        GROQ_API_ERROR: 'AI service is temporarily unavailable.',
        STORAGE_ERROR: 'Failed to save data. Please check your browser settings.',
        NETWORK_ERROR: 'Network connection error. Please try again.',
        VALIDATION_ERROR: 'Please check your input and try again.',
        UNKNOWN_ERROR: 'An unexpected error occurred. Please refresh the page.'
    },

    // AI Prompts
    AI_PROMPTS: {
        VIDEO_SELECTION: `You are an AI learning curator. Analyze the provided YouTube videos and select the {count} best videos for learning {topic} at {skillLevel} level. 
        
        Consider:
        - Video quality and educational value
        - Appropriate difficulty level
        - Clear explanations and good production
        - Logical learning progression
        
        Return a JSON object with:
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
                "prerequisites": ["prereq1"],
                "expectedOutcome": "what_student_will_learn"
            }
        }`,

        QUIZ_GENERATION: `Generate {count} multiple choice questions about "{title}" for {skillLevel} level. 
        
        Return JSON:
        {
            "questions": [
                {
                    "type": "multiple_choice",
                    "question": "Question text",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": "A",
                    "explanation": "Why this is correct",
                    "difficulty": "easy|medium|hard"
                }
            ]
        }`,

        REVISION_NOTES: `Generate comprehensive revision notes for a {skillLevel} level learner studying {topic}.
        
        Include:
        1. Key concepts and definitions
        2. Important points to remember
        3. Common mistakes to avoid
        4. Practice recommendations
        5. Next learning steps
        
        Format as clear, structured notes.`,

        CHAT_TUTOR: `You are an AI tutor helping a {skillLevel} student learn {topic}. 
        
        Current video: {videoTitle}
        Question: {question}
        Context: {context}
        
        Provide helpful, encouraging responses. Explain concepts clearly and offer examples when needed.`,

        CHAPTER_BREAKDOWN: `Analyze the video "{title}" and create a detailed chapter breakdown for a {skillLevel} learner.
        
        Return JSON:
        {
            "chapters": [
                {
                    "title": "Chapter Title",
                    "timestamp": "0:00",
                    "concepts": ["concept1", "concept2"],
                    "importance": "high|medium|low"
                }
            ],
            "keyTakeaways": ["takeaway1", "takeaway2"],
            "practicalTips": ["tip1", "tip2"]
        }`,

        CHAT_RESPONSE: `You are an AI tutor helping with "{title}" for a {skillLevel} learner.
        Question: {question}
        Provide helpful, clear explanations.`
    },

    // Theme Configuration
    THEMES: {
        light: 'Light Theme',
        dark: 'Dark Theme',
        nebula: 'Nebula Theme'
    }
};

// Make CONFIG available globally
window.CONFIG = CONFIG;

// Create missing global variables that your app expects
window.storage = {
    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    },
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove: (key) => {
        localStorage.removeItem(key);
    },
    clear: () => {
        localStorage.clear();
    }
};

// Create StorageManager class if it doesn't exist
if (typeof StorageManager === 'undefined') {
    window.StorageManager = class StorageManager {
        constructor() {
            this.storage = window.storage;
        }

        get(key) {
            return this.storage.get(key);
        }

        set(key, value) {
            return this.storage.set(key, value);
        }

        remove(key) {
            return this.storage.remove(key);
        }

        clear() {
            return this.storage.clear();
        }
    };
}

// Create AnimationManager class if it doesn't exist
if (typeof AnimationManager === 'undefined') {
    window.AnimationManager = class AnimationManager {
        constructor() {
            this.duration = CONFIG.ANIMATION_DURATION;
            this.staggerDelay = CONFIG.STAGGER_DELAY;
        }

        fadeIn(element, duration = this.duration) {
            if (element && typeof gsap !== 'undefined') {
                gsap.from(element, { opacity: 0, duration: duration / 1000 });
            }
        }

        fadeOut(element, duration = this.duration) {
            if (element && typeof gsap !== 'undefined') {
                gsap.to(element, { opacity: 0, duration: duration / 1000 });
            }
        }

        slideUp(element, duration = this.duration) {
            if (element && typeof gsap !== 'undefined') {
                gsap.from(element, { y: 20, opacity: 0, duration: duration / 1000 });
            }
        }

        staggerIn(elements, duration = this.duration, stagger = this.staggerDelay) {
            if (elements && typeof gsap !== 'undefined') {
                gsap.from(elements, {
                    y: 20,
                    opacity: 0,
                    duration: duration / 1000,
                    stagger: stagger / 1000
                });
            }
        }

        animateProgress(element, progress) {
            if (element && typeof gsap !== 'undefined') {
                gsap.to(element, { width: `${progress}%`, duration: 0.5 });
            }
        }

        animateCircularProgress(element, progress) {
            if (element && typeof gsap !== 'undefined') {
                gsap.to(element, {
                    '--progress': progress,
                    duration: 1,
                    ease: "power2.out"
                });
            }
        }
    };
}

// Log initialization
console.log('✅ CONFIG initialized:', CONFIG.APP_NAME, CONFIG.VERSION);
console.log('✅ Storage utilities initialized');
console.log('✅ Animation utilities initialized');