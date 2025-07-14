// Quiz generator component for creating and managing quizzes
class QuizGeneratorComponent {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.quizStartTime = null;
        this.initializeEventListeners();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Quiz navigation buttons
        const prevButton = document.getElementById('prev-question');
        const nextButton = document.getElementById('next-question');
        const submitButton = document.getElementById('submit-quiz');

        if (prevButton) {
            prevButton.addEventListener('click', () => this.previousQuestion());
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => this.nextQuestion());
        }

        if (submitButton) {
            submitButton.addEventListener('click', () => this.submitQuiz());
        }

        // Results buttons
        const continueButton = document.getElementById('continue-learning');
        const retakeButton = document.getElementById('retake-quiz');

        if (continueButton) {
            continueButton.addEventListener('click', () => this.continueLearning());
        }

        if (retakeButton) {
            retakeButton.addEventListener('click', () => this.retakeQuiz());
        }

        // Quiz option selection
        document.addEventListener('change', (e) => {
            if (e.target.type === 'radio' && e.target.name.startsWith('question-')) {
                this.handleAnswerSelection(e.target);
            }
        });

        // Text answer input
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('text-answer')) {
                this.handleTextAnswer(e.target);
            }
        });
    }

    // Start quiz for current video
async startQuiz() {
    try {
        console.log('🧠 Starting quiz...');
        
        // Close any existing modals first
        const existingModals = document.querySelectorAll('.modal.show');
        existingModals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });

        const userProfile = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
        let currentVideo = null;

        // Try to get current video from multiple sources
        if (window.videoPlayerComponent && window.videoPlayerComponent.currentVideo) {
            currentVideo = window.videoPlayerComponent.currentVideo;
        } else if (window.azionaApp && window.azionaApp.currentVideo) {
            currentVideo = window.azionaApp.currentVideo;
        } else {
            // Try to get from storage
            const sessionData = storage.get('current-session');
            if (sessionData && sessionData.selectedVideos && sessionData.selectedVideos.length > 0) {
                // Get the first incomplete video
                const progress = progressManager.getProgress();
                if (progress) {
                    const nextVideo = progressManager.getNextVideo();
                    if (nextVideo) {
                        currentVideo = sessionData.selectedVideos.find(v => v.videoId === nextVideo.videoId);
                    }
                }

                // If still no video, use the first one
                if (!currentVideo) {
                    currentVideo = sessionData.selectedVideos[0];
                }
            }
        }

        if (!currentVideo) {
            throw new Error('No video selected. Please select a video first.');
        }

        // Generate quiz
        await this.generateQuiz(currentVideo, userProfile);

        // Show quiz section with a small delay to ensure modal is closed
        setTimeout(() => {
            if (window.pageTransitionManager) {
                window.pageTransitionManager.showSection('quiz-section');
            } else if (window.azionaApp) {
                window.azionaApp.showSection('quiz-section');
            }
        }, 300);

    } catch (error) {
        console.error('Error starting quiz:', error);
        this.showError('Failed to start quiz: ' + error.message);
    }
}

async generateQuiz(video, userProfile) {
    try {
        // Show loading state
        this.showQuizLoading();
        
        let quizData;
        
        // Check if groqAPI is available and working
        if (typeof groqAPI === 'undefined') {
            console.warn('groqAPI is not defined, using fallback quiz');
            quizData = this.generateFallbackQuizData(video, userProfile);
        } else {
            try {
                // Try to use groqAPI first
                console.log('Attempting to generate quiz with AI...');
                quizData = await groqAPI.generateQuiz(
                    video.title,
                    video.description,
                    userProfile.skillLevel,
                    CONFIG.QUIZ_QUESTIONS
                );
                
                // Validate AI response
                if (!quizData || !quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
                    throw new Error('Invalid AI response');
                }
                
                console.log('✅ AI quiz generated successfully');
                
            } catch (apiError) {
                console.warn('AI quiz generation failed, using fallback:', apiError.message);
                quizData = this.generateFallbackQuizData(video, userProfile);
            }
        }
        
        // Final validation
        if (!quizData || !quizData.questions || !Array.isArray(quizData.questions)) {
            console.error('Quiz data validation failed');
            quizData = this.generateFallbackQuizData(video, userProfile);
        }
        
        // Process quiz data
        this.currentQuiz = {
            videoId: video.videoId,
            videoTitle: video.title,
            questions: quizData.questions,
            skillLevel: userProfile.skillLevel,
            createdAt: new Date().toISOString()
        };
        
        // Reset state
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.quizStartTime = new Date();
        
        // Display quiz
        this.displayQuiz();
        
    } catch (error) {
        console.error('Error generating quiz:', error);
        
        // Last resort fallback
        try {
            const fallbackQuiz = this.generateFallbackQuizData(video, userProfile);
            this.currentQuiz = {
                videoId: video.videoId,
                videoTitle: video.title,
                questions: fallbackQuiz.questions,
                skillLevel: userProfile.skillLevel,
                createdAt: new Date().toISOString()
            };
            
            this.currentQuestionIndex = 0;
            this.userAnswers = [];
            this.quizStartTime = new Date();
            
            this.displayQuiz();
            
        } catch (fallbackError) {
            console.error('Fallback quiz generation failed:', fallbackError);
            this.showError('Failed to generate quiz. Please try again.');
        }
    }
}

    // Complete the generateFallbackQuizData method

    generateFallbackQuizData(video, userProfile) {
        const questions = [
            {
                type: 'multiple_choice',
                question: `What is the main topic of "${video.title}"?`,
                options: [
                    'The primary concept discussed in the video',
                    'A secondary supporting topic',
                    'An unrelated concept',
                    'Background information only'
                ],
                correct_answer: 'The primary concept discussed in the video',
                explanation: 'This video focuses on the main topic mentioned in the title.',
                difficulty: 'easy'
            },
            {
                type: 'multiple_choice',
                question: `For a ${userProfile.skillLevel} learner, what should you focus on while watching this video?`,
                options: [
                    'Understanding the fundamental concepts',
                    'Memorizing specific details',
                    'Skipping to advanced topics',
                    'Focusing only on examples'
                ],
                correct_answer: 'Understanding the fundamental concepts',
                explanation: 'Building a strong foundation is crucial for effective learning.',
                difficulty: 'medium'
            },
            {
                type: 'multiple_choice',
                question: 'What is the best way to retain information from educational videos?',
                options: [
                    'Take notes and practice regularly',
                    'Watch once and move on',
                    'Only focus on the conclusion',
                    'Skip the explanations'
                ],
                correct_answer: 'Take notes and practice regularly',
                explanation: 'Active engagement through note-taking and practice improves retention.',
                difficulty: 'easy'
            },
            {
                type: 'multiple_choice',
                question: `How can you apply what you learn from "${video.title}"?`,
                options: [
                    'Practice with real-world examples',
                    'Just memorize the content',
                    'Move to advanced topics immediately',
                    'Skip practical applications'
                ],
                correct_answer: 'Practice with real-world examples',
                explanation: 'Practical application helps solidify your understanding.',
                difficulty: 'medium'
            },
            {
                type: 'multiple_choice',
                question: `What should you do if you don't understand a concept in this video?`,
                options: [
                    'Rewatch the relevant section and take notes',
                    'Skip it and move on',
                    'Assume it\'s not important',
                    'Just memorize without understanding'
                ],
                correct_answer: 'Rewatch the relevant section and take notes',
                explanation: 'Taking time to understand concepts thoroughly is essential for learning.',
                difficulty: 'easy'
            }
        ];

        return {
            questions: questions.slice(0, CONFIG.QUIZ_QUESTIONS || 3)
        };
    }

    // Show quiz loading state
    showQuizLoading() {
        const quizContent = document.getElementById('quiz-content');
        if (quizContent) {
            quizContent.innerHTML = `
                <div class="quiz-loading">
                    <div class="loading-spinner"></div>
                    <p>Generating personalized quiz questions...</p>
                </div>
            `;
        }
    }

    // Display quiz
    displayQuiz() {
        if (!this.currentQuiz) return;

        // Update quiz header
        const totalQuestions = document.getElementById('total-questions');
        if (totalQuestions) {
            totalQuestions.textContent = this.currentQuiz.questions.length;
        }

        // Display current question
        this.displayCurrentQuestion();

        // Update navigation
        this.updateNavigationButtons();

        // Initialize progress
        this.updateQuizProgress();

        // Animate quiz appearance
        const quizCard = document.querySelector('.quiz-card');
        if (quizCard) {
            animationManager.scaleIn(quizCard, 0.5);
        }
    }

    // Display current question
    displayCurrentQuestion() {
        // Check if we have valid quiz data
        if (!this.currentQuiz || !this.currentQuiz.questions || !Array.isArray(this.currentQuiz.questions)) {
            console.error('No quiz data available for display');
            this.showError('Quiz data is not available. Please try starting the quiz again.');
            return;
        }

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const quizContent = document.getElementById('quiz-content');

        if (!question) {
            console.error('No question data at index:', this.currentQuestionIndex);
            this.showError('Question data is not available. Please try restarting the quiz.');
            return;
        }

        if (!quizContent) {
            console.error('Quiz content element not found');
            return;
        }

        let questionHTML = `
        <div class="quiz-question">
            <h4>${question.question}</h4>
            <div class="quiz-options">
    `;

        if (question.type === 'multiple_choice' && question.options && Array.isArray(question.options)) {
            questionHTML += question.options.map((option, index) => `
            <div class="quiz-option">
                <input type="radio" 
                       id="option-${index}" 
                       name="question-${this.currentQuestionIndex}" 
                       value="${option}">
                <label for="option-${index}">${option}</label>
            </div>
        `).join('');
        } else {
            // Fallback for missing options
            questionHTML += `
            <div class="quiz-option">
                <input type="radio" id="option-0" name="question-${this.currentQuestionIndex}" value="True">
                <label for="option-0">True</label>
            </div>
            <div class="quiz-option">
                <input type="radio" id="option-1" name="question-${this.currentQuestionIndex}" value="False">
                <label for="option-1">False</label>
            </div>
        `;
        }

        questionHTML += `
            </div>
            <div class="question-info">
                <span class="difficulty-badge difficulty-${question.difficulty || 'medium'}">${question.difficulty || 'medium'}</span>
            </div>
        </div>
    `;

        quizContent.innerHTML = questionHTML;

        // Restore previous answer if exists
        this.restorePreviousAnswer();

        // Animate question
        const questionElement = quizContent.querySelector('.quiz-question');
        if (questionElement && typeof animationManager !== 'undefined') {
            animationManager.fadeIn(questionElement, 0.3);
        }
    }

    // Restore previous answer
    restorePreviousAnswer() {
        const previousAnswer = this.userAnswers[this.currentQuestionIndex];
        if (!previousAnswer) return;

        const question = this.currentQuiz.questions[this.currentQuestionIndex];

        if (question.type === 'multiple_choice') {
            const radioButton = document.querySelector(`input[value="${previousAnswer}"]`);
            if (radioButton) {
                radioButton.checked = true;
            }
        } else if (question.type === 'short_answer') {
            const textArea = document.querySelector('.text-answer');
            if (textArea) {
                textArea.value = previousAnswer;
            }
        }
    }

    // Handle answer selection
    handleAnswerSelection(radio) {
        const questionIndex = parseInt(radio.name.split('-')[1]);
        this.userAnswers[questionIndex] = radio.value;

        // Animate selection
        animationManager.scaleIn(radio.parentElement, 0.2);

        // Update navigation
        this.updateNavigationButtons();
    }

    // Handle text answer
    handleTextAnswer(textarea) {
        const questionIndex = parseInt(textarea.name.split('-')[1]);
        this.userAnswers[questionIndex] = textarea.value;

        // Update navigation
        this.updateNavigationButtons();
    }

    // Move to next question
    nextQuestion() {
        // Check if currentQuiz exists and has questions
        if (!this.currentQuiz || !this.currentQuiz.questions || !Array.isArray(this.currentQuiz.questions)) {
            console.error('No quiz data available');
            this.showError('Quiz data is not available. Please try starting the quiz again.');
            return;
        }

        if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayCurrentQuestion();
            this.updateNavigationButtons();
            this.updateQuizProgress();
        }
    }

    // Move to previous question with better error handling
    previousQuestion() {
        // Check if currentQuiz exists and has questions
        if (!this.currentQuiz || !this.currentQuiz.questions || !Array.isArray(this.currentQuiz.questions)) {
            console.error('No quiz data available');
            this.showError('Quiz data is not available. Please try starting the quiz again.');
            return;
        }

        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayCurrentQuestion();
            this.updateNavigationButtons();
            this.updateQuizProgress();
        }
    }

    // Update navigation buttons
    updateNavigationButtons() {
        const prevButton = document.getElementById('prev-question');
        const nextButton = document.getElementById('next-question');
        const submitButton = document.getElementById('submit-quiz');

        if (prevButton) {
            prevButton.disabled = this.currentQuestionIndex === 0;
        }

        const isLastQuestion = this.currentQuestionIndex === this.currentQuiz.questions.length - 1;
        const hasAnswer = this.userAnswers[this.currentQuestionIndex] !== undefined;

        if (nextButton) {
            nextButton.style.display = isLastQuestion ? 'none' : 'inline-block';
            nextButton.disabled = !hasAnswer;
        }

        if (submitButton) {
            submitButton.style.display = isLastQuestion ? 'inline-block' : 'none';
            submitButton.disabled = !this.allQuestionsAnswered();
        }
    }

    // Update quiz progress
    updateQuizProgress() {
        const questionNumber = document.getElementById('question-number');
        if (questionNumber) {
            questionNumber.textContent = this.currentQuestionIndex + 1;
        }

        // Update progress bar if exists
        const progressBar = document.querySelector('.quiz-progress-bar');
        if (progressBar) {
            const progress = ((this.currentQuestionIndex + 1) / this.currentQuiz.questions.length) * 100;
            animationManager.animateProgress(progressBar, progress);
        }
    }

    // Check if all questions are answered
    allQuestionsAnswered() {
        return this.userAnswers.length === this.currentQuiz.questions.length &&
            this.userAnswers.every(answer => answer !== undefined && answer !== '');
    }

    // Submit quiz
    async submitQuiz() {
        try {
            if (!this.allQuestionsAnswered()) {
                this.showError('Please answer all questions before submitting.');
                return;
            }

            // Calculate results
            const results = this.calculateResults();

            // Save results
            await this.saveQuizResults(results);

            // Show results
            await this.showResults(results);

        } catch (error) {
            console.error('Error submitting quiz:', error);
            this.showError('Failed to submit quiz. Please try again.');
        }
    }

calculateResults() {
    const results = {
        totalQuestions: this.currentQuiz.questions.length,
        correctAnswers: 0,
        score: 0,
        timeSpent: new Date() - this.quizStartTime,
        questionResults: []
    };

    // Calculate results for each question
    this.currentQuiz.questions.forEach((question, index) => {
        const userAnswer = this.userAnswers[index];
        const isCorrect = this.isAnswerCorrect(question, userAnswer);

        results.questionResults.push({
            question: question.question,
            userAnswer: userAnswer || 'No answer provided',
            correctAnswer: question.correct_answer,
            isCorrect: isCorrect,
            explanation: question.explanation || 'No explanation available',
            difficulty: question.difficulty || 'medium'
        });

        if (isCorrect) {
            results.correctAnswers++;
        }
    });

    // Calculate percentage score
    results.score = results.totalQuestions > 0 
        ? Math.round((results.correctAnswers / results.totalQuestions) * 100) 
        : 0;
    
    results.performance = this.getPerformanceLevel(results.score);

    console.log('Quiz Results Calculated:', results);
    return results;
}

// Update the isAnswerCorrect method to handle edge cases:
isAnswerCorrect(question, userAnswer) {
    if (!userAnswer || !question.correct_answer) {
        return false;
    }

    if (question.type === 'multiple_choice') {
        // Normalize both answers for comparison
        const normalizedUserAnswer = userAnswer.trim().toLowerCase();
        const normalizedCorrectAnswer = question.correct_answer.trim().toLowerCase();
        return normalizedUserAnswer === normalizedCorrectAnswer;
    } else if (question.type === 'short_answer') {
        const normalizedUserAnswer = userAnswer.toLowerCase().trim();
        const normalizedCorrectAnswer = question.correct_answer.toLowerCase().trim();
        return normalizedUserAnswer === normalizedCorrectAnswer;
    }
    
    return false;
}

    // Get performance level
    getPerformanceLevel(score) {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 70) return 'satisfactory';
        if (score >= 60) return 'needs-improvement';
        return 'poor';
    }

    // Save quiz results
    async saveQuizResults(results) {
        try {
            // Save to progress manager
            progressManager.updateQuizScore(this.currentQuiz.videoId, results.score);

            // Save detailed results
            const quizHistory = storage.get('quiz-history', []);
            quizHistory.push({
                videoId: this.currentQuiz.videoId,
                videoTitle: this.currentQuiz.videoTitle,
                results,
                completedAt: new Date().toISOString()
            });

            storage.set('quiz-history', quizHistory);

        } catch (error) {
            console.error('Error saving quiz results:', error);
        }
    }

async showResults(results) {
    try {
        console.log('🎯 Showing quiz results with score:', results.score + '%');
        
        // Stay in quiz section and show results there
        const quizContent = document.getElementById('quiz-content');
        if (!quizContent) {
            console.error('Quiz content element not found');
            return;
        }

        // Update the quiz header to show "Results" instead of question progress
        const quizHeader = document.querySelector('.quiz-header h3');
        if (quizHeader) {
            quizHeader.textContent = 'Quiz Results';
        }

        // Hide quiz navigation
        const quizNavigation = document.querySelector('.quiz-navigation');
        if (quizNavigation) {
            // quizNavigation.style.display = 'none';
        }

        // Update quiz progress to show completion
        const questionNumber = document.getElementById('question-number');
        const totalQuestions = document.getElementById('total-questions');
        if (questionNumber && totalQuestions) {
            questionNumber.textContent = results.totalQuestions;
            totalQuestions.textContent = results.totalQuestions;
        }

        // Display results in quiz content area
        this.displayResults(results);

    } catch (error) {
        console.error('Error showing results:', error);
        this.showError('Failed to display quiz results: ' + error.message);
    }
}

// Add method to update quiz header score:
updateQuizHeaderScore(score) {
    // Update all possible score display elements
    const scoreElements = [
        document.getElementById('quiz-score'),
        document.querySelector('.quiz-score'),
        document.querySelector('.score-display'),
        document.querySelector('.quiz-header .score'),
        document.querySelector('#results-section .score-percentage')
    ];
    
    scoreElements.forEach(element => {
        if (element) {
            element.textContent = `${score}%`;
        }
    });
    
    // Also update any progress circles or score indicators
    const progressCircles = document.querySelectorAll('.progress-circle .progress-text');
    progressCircles.forEach(circle => {
        if (circle && circle.closest('.quiz-section, .results-section')) {
            circle.textContent = `${score}%`;
        }
    });
    
    console.log('Updated quiz header score to:', score + '%');
}

displayResults(results) {
    const quizContent = document.getElementById('quiz-content');
    if (!quizContent) {
        console.error('Quiz content element not found');
        return;
    }

    // Check if this is the last video
    const isLastVideo = this.checkIfLastVideo();

    // Ensure we're displaying the CORRECT score
    console.log('📊 Displaying results with score:', results.score + '%');

    quizContent.innerHTML = `
        <div class="quiz-results-container">
            <div class="results-header">
                <div class="completion-message">
                    <h4>🎯 Quiz Complete!</h4>
                    <p>Here's how you performed:</p>
                </div>
                <div class="final-score">
                    <div class="score-circle">
                        <div class="score-percentage">${results.score}%</div>
                        <div class="score-label">Final Score</div>
                    </div>
                </div>
            </div>
            
            <div class="score-breakdown">
                <div class="score-detail">
                    <div class="score-icon">✅</div>
                    <div class="score-info">
                        <span class="score-value">${results.correctAnswers}</span>
                        <span class="score-label">Correct</span>
                    </div>
                </div>
                <div class="score-detail">
                    <div class="score-icon">❌</div>
                    <div class="score-info">
                        <span class="score-value">${results.totalQuestions - results.correctAnswers}</span>
                        <span class="score-label">Incorrect</span>
                    </div>
                </div>
                <div class="score-detail">
                    <div class="score-icon">⏱️</div>
                    <div class="score-info">
                        <span class="score-value">${this.formatTime(results.timeSpent)}</span>
                        <span class="score-label">Time</span>
                    </div>
                </div>
            </div>
            
            <div class="performance-badge ${results.performance}">
                <div class="badge-content">
                    ${this.getPerformanceBadge(results.performance)}
                    <div class="performance-message">${this.getPerformanceMessage(results.performance)}</div>
                </div>
            </div>
            
            <div class="results-breakdown">
                <h5>📝 Question Breakdown:</h5>
                <div class="question-results">
                    ${results.questionResults.map((result, index) => `
                        <div class="question-result ${result.isCorrect ? 'correct' : 'incorrect'}">
                            <div class="question-header">
                                <span class="question-number">Q${index + 1}</span>
                                <span class="result-icon">
                                    ${result.isCorrect ? 
                                        '<i class="fas fa-check-circle text-success"></i>' : 
                                        '<i class="fas fa-times-circle text-danger"></i>'
                                    }
                                </span>
                                <span class="result-status ${result.isCorrect ? 'correct' : 'incorrect'}">
                                    ${result.isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                            </div>
                            <div class="question-text">${result.question}</div>
                            <div class="answer-comparison">
                                <div class="user-answer ${result.isCorrect ? 'correct-answer' : 'wrong-answer'}">
                                    <strong>Your Answer:</strong> ${result.userAnswer}
                                </div>
                                ${!result.isCorrect ? `
                                    <div class="correct-answer">
                                        <strong>Correct Answer:</strong> ${result.correctAnswer}
                                    </div>
                                ` : ''}
                            </div>
                            ${result.explanation ? `
                                <div class="explanation">
                                    <div class="explanation-header">
                                        <i class="fas fa-lightbulb"></i>
                                        <strong>Explanation:</strong>
                                    </div>
                                    <div class="explanation-text">${result.explanation}</div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="results-feedback">
                ${this.getPerformanceFeedback(results)}
            </div>
            
            <div class="results-actions">
                ${isLastVideo ? `
                    <button class="btn btn-success btn-lg quiz-action-btn" id="complete-course">
                        <i class="fas fa-trophy"></i> Complete Course
                    </button>
                ` : `
                    <button class="btn btn-primary btn-lg quiz-action-btn" id="continue-learning">
                        <i class="fas fa-arrow-right"></i> Continue Learning
                    </button>
                `}
                <button class="btn btn-outline-primary quiz-action-btn" id="retake-quiz">
                    <i class="fas fa-redo"></i> Retake Quiz
                </button>
                <button class="btn btn-outline-secondary quiz-action-btn" id="back-to-video">
                    <i class="fas fa-video"></i> Back to Video
                </button>
            </div>
        </div>
    `;

    // Add event listeners for all buttons
    this.attachResultsEventListeners(isLastVideo);

    // Animate results
    const resultsContainer = document.querySelector('.quiz-results-container');
    if (resultsContainer && typeof animationManager !== 'undefined') {
        animationManager.scaleIn(resultsContainer, 0.5);
    }

    // Update score in other parts of the page
    this.updateGlobalScoreDisplays(results.score);
}

// Add method to attach event listeners:
attachResultsEventListeners(isLastVideo) {
    const continueBtn = document.getElementById('continue-learning');
    const completeBtn = document.getElementById('complete-course');
    const retakeBtn = document.getElementById('retake-quiz');
    const backToVideoBtn = document.getElementById('back-to-video');

    if (continueBtn) {
        continueBtn.addEventListener('click', () => this.continueLearning());
    }

    if (completeBtn) {
        completeBtn.addEventListener('click', () => this.completeCourse());
    }

    if (retakeBtn) {
        retakeBtn.addEventListener('click', () => this.retakeQuiz());
    }

    if (backToVideoBtn) {
        backToVideoBtn.addEventListener('click', () => this.backToVideo());
    }
}

// Add method to go back to video:
async backToVideo() {
    console.log('📹 Returning to video dashboard...');
    
    if (window.azionaApp) {
        window.azionaApp.showSection('dashboard-section');
        window.azionaApp.showSuccessMessage('📹 Returned to video dashboard');
    }
}

// Add method to check if last video:
checkIfLastVideo() {
    try {
        if (window.progressManager && typeof window.progressManager.getNextVideo === 'function') {
            const nextVideo = window.progressManager.getNextVideo();
            return !nextVideo;
        }
        
        // Fallback check
        const progress = storage.get(CONFIG.STORAGE_KEYS.LEARNING_PROGRESS);
        if (progress && progress.videos) {
            const uncompletedVideos = progress.videos.filter(v => !v.completed);
            return uncompletedVideos.length <= 1; // Current video will be marked as completed
        }
        
        return false;
    } catch (error) {
        console.error('Error checking if last video:', error);
        return false;
    }
}

// Add method to update global score displays:
updateGlobalScoreDisplays(score) {
    // Update quiz score in sidebar/dashboard
    const quizScoreElements = [
        document.getElementById('quiz-score'),
        document.querySelector('.quiz-score'),
        document.querySelector('#quiz-score .stat-value')
    ];
    
    quizScoreElements.forEach(element => {
        if (element) {
            element.textContent = `${score}%`;
        }
    });
    
    console.log('🎯 Updated global score displays to:', score + '%');
}

// Add method to get performance message:
getPerformanceMessage(performance) {
    const messages = {
        excellent: "Outstanding! You've mastered this topic!",
        good: "Great job! You have a solid understanding.",
        satisfactory: "Good work! You're on the right track.",
        'needs-improvement': "Keep practicing! You're getting there.",
        poor: "Don't give up! Learning takes time and effort."
    };
    
    return messages[performance] || "Quiz completed!";
}

// Add method to complete course
async completeCourse() {
    console.log('🎉 Course completion initiated from quiz');
    
    if (window.azionaApp) {
        await window.azionaApp.showCourseCompletionCelebration();
        setTimeout(async () => {
            await window.azionaApp.showLearningComplete();
        }, 3000);
    }
}

// Add method to get performance badge
getPerformanceBadge(performance) {
    const badges = {
        excellent: '🌟 Excellent!',
        good: '👍 Good Job!',
        satisfactory: '✅ Well Done!',
        'needs-improvement': '📚 Keep Learning!',
        poor: '💪 Practice More!'
    };
    
    return badges[performance] || '✅ Quiz Complete!';
}

    // Get performance feedback
    getPerformanceFeedback(results) {
        const feedback = {
            excellent: {
                message: "🎉 Outstanding performance! You have a solid understanding of the material.",
                tips: ["Consider exploring advanced topics", "Share your knowledge with others", "Apply what you've learned in real projects"]
            },
            good: {
                message: "👍 Great job! You're on the right track with good understanding.",
                tips: ["Review any missed concepts", "Practice with additional exercises", "Continue building on this foundation"]
            },
            satisfactory: {
                message: "✅ Good effort! You understand the basics but could improve.",
                tips: ["Review the video content again", "Focus on areas where you struggled", "Practice more examples"]
            },
            'needs-improvement': {
                message: "📚 Keep working! You're learning but need more practice.",
                tips: ["Rewatch the video carefully", "Take detailed notes", "Ask for help with difficult concepts"]
            },
            poor: {
                message: "💪 Don't give up! Learning takes time and practice.",
                tips: ["Start with simpler concepts", "Break down complex topics", "Consider seeking additional resources"]
            }
        };

        const performanceFeedback = feedback[results.performance];

        return `
            <div class="feedback-message">
                ${performanceFeedback.message}
            </div>
            <div class="feedback-tips">
                <h5>Tips for Improvement:</h5>
                <ul>
                    ${performanceFeedback.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Format time
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Continue learning
async continueLearning() {
    console.log('📚 Continuing learning journey...');
    
    if (window.pageTransitionManager) {
        await window.pageTransitionManager.showSection('dashboard-section');
    } else if (window.azionaApp) {
        window.azionaApp.showSection('dashboard-section');
    }

    // Check if there are more videos
    const nextVideo = progressManager.getNextVideo();
    if (nextVideo) {
        // Load next video
        console.log('📹 Loading next video:', nextVideo.title);
        
        if (window.azionaApp) {
            window.azionaApp.loadVideo(nextVideo);
            window.azionaApp.showSuccessMessage(`📹 Now watching: ${nextVideo.title}`);
        } else if (window.videoPlayerComponent) {
            await window.videoPlayerComponent.loadVideo(nextVideo.videoId);
        }
    } else {
        // All videos completed, show completion
        console.log('🎉 All videos completed!');
        
        if (window.azionaApp) {
            await window.azionaApp.showCourseCompletionCelebration();
            setTimeout(async () => {
                await window.azionaApp.showLearningComplete();
            }, 3000);
        } else if (window.videoPlayerComponent) {
            await window.videoPlayerComponent.showCompletionSummary();
        }
    }
}

    // Retake quiz
    async retakeQuiz() {
        // Reset quiz state
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.quizStartTime = new Date();

        // Show quiz section
        if (window.pageTransitionManager) {
            await window.pageTransitionManager.showSection('quiz-section');
        } else if (window.azionaApp) {
            window.azionaApp.showSection('quiz-section');
        }

        // Display quiz
        this.displayQuiz();
    }

    // Show error message
    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at top of page
        document.body.insertBefore(errorDiv, document.body.firstChild);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Get quiz history
    getQuizHistory() {
        return storage.get('quiz-history', []);
    }

    // Get quiz statistics
    getQuizStatistics() {
        const history = this.getQuizHistory();

        if (history.length === 0) {
            return {
                totalQuizzes: 0,
                averageScore: 0,
                bestScore: 0,
                totalTimeSpent: 0
            };
        }

        const totalScore = history.reduce((sum, quiz) => sum + quiz.results.score, 0);
        const totalTime = history.reduce((sum, quiz) => sum + quiz.results.timeSpent, 0);

        return {
            totalQuizzes: history.length,
            averageScore: Math.round(totalScore / history.length),
            bestScore: Math.max(...history.map(quiz => quiz.results.score)),
            totalTimeSpent: totalTime,
            recentQuizzes: history.slice(-5)
        };
    }

    // Export quiz results
    exportQuizResults() {
        const history = this.getQuizHistory();
        const statistics = this.getQuizStatistics();

        const exportData = {
            quizHistory: history,
            statistics,
            exportDate: new Date().toISOString()
        };

        const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `quiz-results-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }
}

// Export and initialize
window.quizGeneratorComponent = new QuizGeneratorComponent();

// Global function for starting quiz (called from video player)
function startQuiz() {
    if (window.quizGeneratorComponent) {
        window.quizGeneratorComponent.startQuiz();
    }
}