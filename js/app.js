/**
 * Main App Orchestration
 * Coordinates all components and manages application flow
 */

class AzionaLearnTubeApp {
    constructor() {
        this.storageManager = new StorageManager();
        this.animationManager = new AnimationManager();
        this.youtubeAPI = new YouTubeAPI();
        this.groqAPI = new GroqAPI();

        // Component managers
        this.onboardingManager = null;
        this.videoPlayerManager = null;
        this.chatAssistantManager = null;
        this.quizGeneratorManager = null;
        this.revisionNotesManager = null;

        // App state
        this.currentSection = 'onboarding-section';
        this.isInitialized = false;
        this.learningSession = null;
        this.currentVideo = null;
        this.loadingProgress = 0;

        // Video tracking
        this.videoStartTime = null;
        this.totalViewTime = 0;
        this.minViewTime = 25; // 25 seconds minimum
        this.viewTimeTracker = null;

        // Initialize progress manager
        this.initializeProgressManager();

        this.init();
    }

    // Add method to initialize progress manager
    initializeProgressManager() {
        try {
            // Check if ProgressManager is available globally
            if (typeof ProgressManager !== 'undefined') {
                window.progressManager = new ProgressManager();
                console.log('ProgressManager initialized successfully');
            } else {
                console.warn('ProgressManager class not found, will use fallback methods');
            }
        } catch (error) {
            console.error('Error initializing ProgressManager:', error);
        }
    }

    // Add method to start video time tracking
    startVideoTimeTracking() {
        this.videoStartTime = Date.now();
        this.totalViewTime = 0;

        // Update view time every second
        this.viewTimeTracker = setInterval(() => {
            if (this.videoStartTime) {
                this.totalViewTime = Math.floor((Date.now() - this.videoStartTime) / 1000);
                this.updateVideoProgress();
            }
        }, 1000);

        console.log('📹 Video time tracking started');
    }

    // Add method to stop video time tracking
    stopVideoTimeTracking() {
        if (this.viewTimeTracker) {
            clearInterval(this.viewTimeTracker);
            this.viewTimeTracker = null;
        }

        const finalViewTime = this.totalViewTime;
        console.log(`📹 Video time tracking stopped. Total view time: ${finalViewTime}s`);
        return finalViewTime;
    }

    // Add method to update video progress display
    updateVideoProgress() {
        const markCompleteBtn = document.getElementById('mark-complete');
        if (!markCompleteBtn) return;

        if (this.totalViewTime >= this.minViewTime) {
            // Enable mark complete button
            markCompleteBtn.disabled = false;
            markCompleteBtn.innerHTML = '<i class="fas fa-check"></i> Mark Complete';
            markCompleteBtn.className = 'btn btn-success';

            // Show time requirement met
            if (this.totalViewTime === this.minViewTime) {
                this.showSuccessMessage(`✅ Minimum viewing time (${this.minViewTime}s) reached! You can now mark as complete.`);
            }
        } else {
            // Disable mark complete button and show remaining time
            markCompleteBtn.disabled = true;
            const remaining = this.minViewTime - this.totalViewTime;
            markCompleteBtn.innerHTML = `<i class="fas fa-clock"></i> Watch ${remaining}s more`;
            markCompleteBtn.className = 'btn btn-secondary';
        }
    }

    initializeTheme() {
        // Initialize theme from storage or default
        const savedTheme = storage.get(CONFIG.STORAGE_KEYS.THEME) || 'dark';
        this.setTheme(savedTheme);

        // Setup theme toggle buttons
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.setTheme(theme);
                this.updateThemeButtons(theme);
            });
        });
    }

    updateThemeButtons(activeTheme) {
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === activeTheme) {
                btn.classList.add('active');
            }
        });

    }

    async init() {
        try {
            console.log('🚀 Initializing Aziona LearnFlow App...');

            // Check dependencies
            this.checkDependencies();

            // Initialize theme system
            this.initializeTheme();

            // Initialize components
            this.initializeComponents();

            // Setup global event listeners
            this.setupGlobalEventListeners();

            // Setup component event listeners
            this.setupComponentEventListeners();

            // Check for existing session
            await this.checkExistingSession();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Initialize animations
            this.initializeAnimations();

            // Show initial section
            this.showInitialSection();

            this.isInitialized = true;
            console.log('✅ Aziona LearnFlow App initialized successfully!');

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showInitializationError(error);
        }
    }

    // Add method to check dependencies
    checkDependencies() {
        const requiredDependencies = [
            'CONFIG',
            'storage',
            'StorageManager',
            'AnimationManager',
            'YouTubeAPI',
            'GroqAPI'
        ];

        const missing = requiredDependencies.filter(dep => typeof window[dep] === 'undefined');

        if (missing.length > 0) {
            console.warn('Missing dependencies:', missing);
            console.log('App will continue with fallback methods');
        }

        // Try to initialize ProgressManager if available
        if (typeof ProgressManager !== 'undefined' && !window.progressManager) {
            this.initializeProgressManager();
        }
    }

    initializeComponents() {
        // Initialize all component managers
        this.onboardingManager = new OnboardingComponent();
        this.videoPlayerManager = new VideoPlayerComponent();
        this.chatAssistantManager = new ChatAssistantComponent();
        this.quizGeneratorManager = window.quizGeneratorComponent;
        this.revisionNotesManager = new RevisionNotesComponent();

        // Setup component event listeners
        this.setupComponentEventListeners();

        console.log('📦 All components initialized');
    }

    setupComponentEventListeners() {
        // Onboarding form submission
        const onboardingForm = document.getElementById('onboarding-form');
        if (onboardingForm) {
            onboardingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleOnboardingSubmit();
            });
        }

        // Video controls
        const markCompleteBtn = document.getElementById('mark-complete');
        if (markCompleteBtn) {
            markCompleteBtn.addEventListener('click', () => {
                this.handleVideoComplete();
            });
        }

        const nextVideoBtn = document.getElementById('next-video');
        if (nextVideoBtn) {
            nextVideoBtn.addEventListener('click', () => {
                this.handleNextVideo();
            });
        }

        const prevVideoBtn = document.getElementById('prev-video');
        if (prevVideoBtn) {
            prevVideoBtn.addEventListener('click', () => {
                this.handlePrevVideo();
            });
        }

        // Chat functionality - UPDATED
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-message');

        if (chatInput && sendButton) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });

            sendButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendChatMessage();
            });
        }

        this.setupClearChatButton();

        // Summary section actions
        const downloadNotesBtn = document.getElementById('download-notes');
        if (downloadNotesBtn) {
            downloadNotesBtn.addEventListener('click', () => {
                this.downloadRevisionNotes();
            });
        }

        const startNewLearningBtn = document.getElementById('start-new-learning');
        if (startNewLearningBtn) {
            startNewLearningBtn.addEventListener('click', () => {
                this.startNewLearningSession();
            });
        }
    }

setupClearChatButton() {
    let isProcessing = false;
    let lastClickTime = 0;

    document.addEventListener('click', (e) => {
        if (e.target.matches('#clear-chat') || e.target.closest('#clear-chat')) {
            e.preventDefault();
            e.stopPropagation();

            // Debounce rapid clicks
            const now = Date.now();
            if (now - lastClickTime < 1000) { // Increased to 1 second
                console.log('Ignoring rapid click');
                return;
            }
            lastClickTime = now;

            // Prevent multiple simultaneous processing
            if (isProcessing) {
                console.log('Clear chat already processing, ignoring click');
                return;
            }

            // Check if a modal is already open
            const existingModal = document.querySelector('#clear-chat-modal');
            if (existingModal) {
                console.log('Clear chat modal already open, ignoring click');
                return;
            }

            // Set processing flag
            isProcessing = true;

            console.log('Opening clear chat confirmation modal');

            try {
                // Try chat assistant component first
                if (window.chatAssistantComponent && typeof window.chatAssistantComponent.showClearChatConfirmation === 'function') {
                    window.chatAssistantComponent.showClearChatConfirmation();
                } else {
                    // Fallback to app method
                    this.showClearChatConfirmation();
                }
            } catch (error) {
                console.error('Error showing clear chat modal:', error);
                
                // Force cleanup on error
                if (window.modalCleanupUtility) {
                    window.modalCleanupUtility.cleanupAllModals();
                }
            }

            // Reset processing flag after longer delay
            setTimeout(() => {
                isProcessing = false;
            }, 2000); // Increased to 2 seconds
        }
    });
}

clearChatHistory() {
    try {
        // Clear chat messages array
        this.chatMessages = [];
        
        // Clear from storage
        storage.remove('chat-history');

        // Clear the chat container
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.innerHTML = '';
        }

        // Add welcome message back
        const welcomeMessage = "Chat history cleared! Hello! I'm your AI learning assistant. I can help you understand concepts, answer questions, and provide explanations about the current video. What would you like to know?";
        
        this.addMessage('ai', welcomeMessage, true);

        console.log('✅ Chat history cleared successfully');
        return true;

    } catch (error) {
        console.error('❌ Error clearing chat history:', error);
        return false;
    }
}

    setupGlobalEventListeners() {
        // Theme toggle buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const theme = e.target.getAttribute('data-theme') || e.target.closest('.theme-btn').getAttribute('data-theme');
                if (theme) {
                    this.setTheme(theme);
                    this.updateThemeButtons(theme);
                }
            });
        });

        // Floating Assistant Toggle
        const assistantToggle = document.getElementById('assistant-toggle');
        if (assistantToggle) {
            assistantToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFloatingAssistant();
            });
        }

        // Close Assistant Button
        const closeAssistant = document.getElementById('close-assistant');
        if (closeAssistant) {
            closeAssistant.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeFloatingAssistant();
            });
        }

        // Assistant Input - Updated to prevent form submission
        document.addEventListener('keypress', (e) => {
            if (e.target.matches('.assistant-input input')) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.sendAssistantMessage();
                }
            }
        });

        // Assistant Send Button - Updated to prevent form submission
        document.addEventListener('click', (e) => {
            if (e.target.matches('.assistant-input button') || e.target.closest('.assistant-input button')) {
                e.preventDefault();
                e.stopPropagation();
                this.sendAssistantMessage();
            }
        });

        // Quick Question Buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-question-btn')) {
                e.preventDefault();
                this.handleQuickQuestion(e.target.textContent);
            }
        });

        // Mark video complete button
        const markCompleteBtn = document.getElementById('mark-complete');
        if (markCompleteBtn) {
            markCompleteBtn.addEventListener('click', () => {
                this.handleVideoComplete();
            });
        }

        // Navigation buttons
        const prevBtn = document.getElementById('prev-video');
        const nextBtn = document.getElementById('next-video');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (window.videoPlayerComponent) {
                    window.videoPlayerComponent.previousVideo();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (window.videoPlayerComponent) {
                    window.videoPlayerComponent.nextVideo();
                }
            });
        }
    }

showClearChatConfirmation() {
    // Remove any existing modals first
    const existingModals = document.querySelectorAll('#clear-chat-modal, .clear-chat-modal');
    existingModals.forEach(modal => {
        try {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.dispose();
            }
            modal.remove();
        } catch (error) {
            console.error('Error removing existing modal:', error);
        }
    });

    // Clear any remaining backdrops
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'clear-chat-modal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h5 class="modal-title">🗑️ Clear Chat History</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Are you sure?</strong>
                    </div>
                    <p>This will permanently delete all your chat history with the AI assistant.</p>
                    <p><strong>This action cannot be undone.</strong></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancel-clear">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-danger" id="confirm-clear">
                        <i class="fas fa-trash"></i> Delete All
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Create modal instance
    const modalInstance = new bootstrap.Modal(modal, {
        backdrop: true,
        keyboard: true,
        focus: true
    });

    // Define handlers
    const handleConfirm = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('✅ Confirming chat deletion');
        
        // Clear chat history
        this.clearChatHistory();
        
        // Hide modal
        modalInstance.hide();
    };

    const handleCancel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('❌ Chat deletion cancelled');
        modalInstance.hide();
    };

    // Add event listeners
    const confirmBtn = modal.querySelector('#confirm-clear');
    const cancelBtn = modal.querySelector('#cancel-clear');
    const closeBtn = modal.querySelector('.btn-close');

    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleConfirm, { once: true });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel, { once: true });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', handleCancel, { once: true });
    }

    // Cleanup when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        console.log('🧹 Cleaning up modal');
        
        try {
            modalInstance.dispose();
            
            if (modal.parentNode) {
                modal.remove();
            }
            
            // Clean up Bootstrap artifacts
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }, { once: true });

    // Show modal
    modalInstance.show();

    console.log('🗑️ Clear chat modal created and shown');
}

    async checkExistingSession() {
        const existingSession = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);

        if (existingSession && existingSession.learningGoal) {
            const shouldContinue = confirm(
                `Welcome back! You were learning ${existingSession.learningGoal}. Would you like to continue where you left off?`
            );

            if (shouldContinue) {
                this.learningSession = existingSession;
                this.resumeSession();
            } else {
                storage.remove(CONFIG.STORAGE_KEYS.USER_PROFILE);
                storage.remove(CONFIG.STORAGE_KEYS.LEARNING_PROGRESS);
                this.showSection('onboarding-section');
            }
        } else {
            this.showSection('onboarding-section');
        }
    }

    resumeSession() {
        const progress = progressManager.getProgress();

        if (progress && progress.videos.length > 0) {
            this.showSection('dashboard-section');
            this.loadLearningDashboard();
        } else {
            this.showSection('loading-section');
            this.searchVideos();
        }
    }

    async handleOnboardingSubmit() {
        try {
            const formData = new FormData(document.getElementById('onboarding-form'));
            const userData = {
                name: formData.get('userName'),
                skillLevel: formData.get('skillLevel'),
                learningGoal: formData.get('learningGoal'),
                createdAt: new Date().toISOString()
            };

            console.log('👤 Onboarding completed:', userData);

            // Save user data
            storage.set(CONFIG.STORAGE_KEYS.USER_PROFILE, userData);

            // Update user info display
            this.updateUserInfo(userData);

            // Initialize learning session
            this.learningSession = {
                ...userData,
                startTime: new Date().toISOString(),
                videosWatched: 0,
                quizzesTaken: 0,
                totalTimeSpent: 0
            };

            // Show loading and search for videos
            this.showSection('loading-section');
            await this.searchVideos();

        } catch (error) {
            console.error('Error handling onboarding completion:', error);
            this.showError('Failed to process onboarding data. Please try again.');
        }
    }

    updateUserInfo(userData) {
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');

        if (userInfo && userName) {
            userName.textContent = userData.name;
            userInfo.style.display = 'block';
        }
    }

    async searchVideos() {
        try {
            const userData = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
            const searchQuery = userData.learningGoal;

            console.log('🔍 Searching for videos:', searchQuery);

            // Show search progress
            this.updateLoadingProgress(20, 'Searching for the best learning videos...');

            // Search YouTube - Updated to pass only learningGoal
            const youtubeResults = await youtubeAPI.searchVideos(searchQuery, CONFIG.MAX_VIDEOS);

            if (!youtubeResults || youtubeResults.length === 0) {
                throw new Error('No videos found for your learning goal');
            }

            // Update progress
            this.updateLoadingProgress(60, 'Analyzing videos with AI...');

            // Use Groq to select best videos and create learning plan
            const aiSelection = await groqAPI.selectBestVideos(
                youtubeResults,
                userData.learningGoal,
                userData.skillLevel,
                CONFIG.SELECTED_VIDEOS
            );

            if (!aiSelection || !aiSelection.selectedVideos) {
                throw new Error('AI could not analyze the videos');
            }

            // Update progress
            this.updateLoadingProgress(80, 'Creating your personalized learning path...');

            // Initialize progress tracking
            const selectedVideos = aiSelection.selectedVideos;
            progressManager.initializeProgress(selectedVideos);

            // Update final progress
            this.updateLoadingProgress(100, 'Ready to start learning!');

            // Show dashboard after a short delay
            setTimeout(() => {
                this.showSection('dashboard-section');
                this.loadLearningDashboard();
            }, 1000);

        } catch (error) {
            console.error('Error searching videos:', error);
            this.showError(`Failed to find videos: ${error.message}`);
        }
    }

    updateLoadingProgress(percent, message) {
        const progressFill = document.getElementById('progress-fill');
        const loadingText = document.getElementById('loading-text');

        if (progressFill) {
            animationManager.animateProgress(progressFill, percent);
        }

        if (loadingText) {
            loadingText.textContent = message;
        }

        this.loadingProgress = percent;
    }

    loadLearningDashboard() {
        const progress = progressManager.getProgress();
        if (!progress) return;

        // Update progress display
        this.updateProgressDisplay(progress);

        // Load video playlist
        this.loadVideoPlaylist(progress.videos);

        // Load first video or current video
        const nextVideo = progressManager.getNextVideo();
        if (nextVideo) {
            this.loadVideo(nextVideo);
        } else if (progress.videos.length > 0) {
            this.loadVideo(progress.videos[0]);
        }
    }

    updateProgressDisplay(progress) {
        try {
            if (!progress) {
                progress = this.getProgressFallback();
            }

            const progressCircle = document.getElementById('progress-circle');
            const progressText = progressCircle?.querySelector('.progress-text');
            const videosWatched = document.getElementById('videos-watched');
            const quizScore = document.getElementById('quiz-score');

            if (progressText) {
                progressText.textContent = `${progress.overallProgress || 0}%`;
            }

            if (progressCircle && typeof animationManager !== 'undefined') {
                animationManager.animateCircularProgress(progressCircle, progress.overallProgress || 0);
            }

            if (videosWatched) {
                const completedCount = progress.videos ? progress.videos.filter(v => v.completed).length : 0;
                const totalCount = progress.videos ? progress.videos.length : 0;
                videosWatched.textContent = `${completedCount}/${totalCount}`;
            }

            if (quizScore) {
                const completedQuizzes = progress.videos ? progress.videos.filter(v => v.quizCompleted) : [];
                if (completedQuizzes.length > 0) {
                    const avgScore = Math.round(
                        completedQuizzes.reduce((sum, v) => sum + (v.quizScore || 0), 0) / completedQuizzes.length
                    );
                    quizScore.textContent = `${avgScore}%`;
                } else {
                    quizScore.textContent = '0%';
                }
            }
        } catch (error) {
            console.error('Error updating progress display:', error);
        }
    }

    loadVideoPlaylist(videos) {
        const playlistItems = document.getElementById('playlist-items');
        if (!playlistItems) return;

        playlistItems.innerHTML = videos.map((video, index) => `
            <div class="playlist-item ${video.completed ? 'completed' : ''}" data-video-id="${video.videoId}">
                <div class="playlist-item-content">
                    <div class="playlist-item-number">${index + 1}</div>
                    <div class="playlist-item-info">
                        <h6 class="playlist-item-title">${video.title}</h6>
                        <div class="playlist-item-meta">
                            <span class="duration">${this.formatDuration(video.duration)}</span>
                            ${video.completed ? '<span class="completed-badge"><i class="fas fa-check"></i></span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click listeners to playlist items
        playlistItems.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', () => {
                const videoId = item.dataset.videoId;
                const video = videos.find(v => v.videoId === videoId);
                if (video) {
                    this.loadVideo(video);
                }
            });
        });
    }

    loadVideo(video) {
        const youtubePlayer = document.getElementById('youtube-player');
        if (!youtubePlayer) return;

        // Stop previous tracking
        this.stopVideoTimeTracking();

        // Update current video
        this.currentVideo = video;

        // Load video in iframe
        const videoUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=1&enablejsapi=1`;
        youtubePlayer.src = videoUrl;

        // Start time tracking
        this.startVideoTimeTracking();

        // Initialize mark complete button as disabled
        const markCompleteBtn = document.getElementById('mark-complete');
        if (markCompleteBtn) {
            markCompleteBtn.disabled = true;
            markCompleteBtn.innerHTML = `<i class="fas fa-clock"></i> Watch ${this.minViewTime}s more`;
            markCompleteBtn.className = 'btn btn-secondary';
        }

        // Update playlist highlighting
        this.updatePlaylistHighlight(video.videoId);

        // Update navigation buttons
        this.updateVideoNavigation();

        // Initialize chat context
        if (this.chatAssistantManager) {
            this.chatAssistantManager.setVideoContext(video);
        }

        console.log(`📹 Loaded video: ${video.title}`);
    }


    updatePlaylistHighlight(videoId) {
        const playlistItems = document.querySelectorAll('.playlist-item');
        playlistItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.videoId === videoId) {
                item.classList.add('active');
            }
        });
    }

    updateVideoNavigation() {
        const progress = progressManager.getProgress();
        if (!progress) return;

        const currentIndex = progress.videos.findIndex(v => v.videoId === this.currentVideo.videoId);
        const prevBtn = document.getElementById('prev-video');
        const nextBtn = document.getElementById('next-video');

        if (prevBtn) {
            prevBtn.disabled = currentIndex <= 0;
        }

        if (nextBtn) {
            nextBtn.disabled = currentIndex >= progress.videos.length - 1;
        }
    }

    async handleVideoComplete() {
        if (!this.currentVideo) return;

        // Check if minimum viewing time is met
        if (this.totalViewTime < this.minViewTime) {
            const remaining = this.minViewTime - this.totalViewTime;
            this.showError(`⏰ Please watch the video for at least ${remaining} more seconds before marking as complete.`);
            return;
        }

        try {
            // Stop video time tracking
            const finalViewTime = this.stopVideoTimeTracking();

            // Check if progressManager exists and has the method
            if (!window.progressManager) {
                console.error('ProgressManager not found, initializing...');
                // Initialize progress manager if not exists
                if (typeof ProgressManager !== 'undefined') {
                    window.progressManager = new ProgressManager();
                } else {
                    throw new Error('ProgressManager class not loaded');
                }
            }

            // Check if the method exists
            if (typeof window.progressManager.markVideoCompleted !== 'function') {
                console.error('markVideoCompleted method not found');
                // Use alternative method to mark video complete
                this.markVideoCompletedFallback(this.currentVideo.videoId, finalViewTime);
            } else {
                // Mark video as completed with view time
                window.progressManager.markVideoCompleted(this.currentVideo.videoId, finalViewTime);
            }

            // Update progress display
            const progress = this.getProgressFallback();
            this.updateProgressDisplay(progress);

            // Update playlist
            this.updatePlaylistHighlight(this.currentVideo.videoId);

            // Show video completion message
            this.showSuccessMessage('🎉 Video completed! Great job!');

            // Update button to show completion
            const markCompleteBtn = document.getElementById('mark-complete');
            if (markCompleteBtn) {
                markCompleteBtn.innerHTML = '<i class="fas fa-check"></i> Completed!';
                markCompleteBtn.className = 'btn btn-success';
                markCompleteBtn.disabled = true;
            }

            // Always start quiz after video completion (if available)
            if (window.quizGeneratorComponent) {
                // Small delay to show completion state
                setTimeout(async () => {
                    await this.startVideoQuiz();
                }, 1500);
            } else {
                // No quiz available, proceed to next video or completion
                setTimeout(() => {
                    this.proceedAfterVideo();
                }, 2000);
            }

        } catch (error) {
            console.error('Error marking video complete:', error);
            this.showError('Failed to mark video as complete. Please try again.');
        }
    }

    // Add fallback method for marking video complete
    markVideoCompletedFallback(videoId, viewTime) {
        try {
            // Get existing progress or create new one
            const progress = storage.get(CONFIG.STORAGE_KEYS.LEARNING_PROGRESS) || {
                videos: [],
                overallProgress: 0,
                startTime: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            // Find and update the video
            const videoIndex = progress.videos.findIndex(v => v.videoId === videoId);
            if (videoIndex !== -1) {
                progress.videos[videoIndex].completed = true;
                progress.videos[videoIndex].completedAt = new Date().toISOString();
                progress.videos[videoIndex].viewTime = viewTime;
            } else {
                // Add new video entry
                progress.videos.push({
                    videoId: videoId,
                    title: this.currentVideo.title,
                    completed: true,
                    completedAt: new Date().toISOString(),
                    viewTime: viewTime
                });
            }

            // Update overall progress
            const completedVideos = progress.videos.filter(v => v.completed).length;
            progress.overallProgress = Math.round((completedVideos / progress.videos.length) * 100);
            progress.lastUpdated = new Date().toISOString();

            // Save progress
            storage.set(CONFIG.STORAGE_KEYS.LEARNING_PROGRESS, progress);

            console.log('Video marked as complete using fallback method');
            return true;

        } catch (error) {
            console.error('Error in fallback video completion:', error);
            return false;
        }
    }

    // Add fallback method for getting progress
    getProgressFallback() {
        try {
            if (window.progressManager && typeof window.progressManager.getProgress === 'function') {
                return window.progressManager.getProgress();
            } else {
                // Fallback to direct storage access
                return storage.get(CONFIG.STORAGE_KEYS.LEARNING_PROGRESS) || {
                    videos: [],
                    overallProgress: 0,
                    startTime: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Error getting progress:', error);
            return {
                videos: [],
                overallProgress: 0,
                startTime: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
        }
    }

    // Add method to start video quiz
    async startVideoQuiz() {
        try {
            console.log('🧠 Starting quiz for current video');

            // Show quiz modal first
            this.showQuizStartModal();

        } catch (error) {
            console.error('Error starting quiz:', error);
            this.showError('Failed to start quiz. Moving to next video.');
            this.proceedAfterVideo();
        }
    }

    showQuizStartModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade quiz-start-modal';
        modal.id = 'quiz-start-modal';
        modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h5 class="modal-title">🧠 Ready for Quiz?</h5>
                </div>
                <div class="modal-body text-center">
                    <p>Great job completing "<strong>${this.currentVideo.title}</strong>"!</p>
                    <p>Let's test your understanding with a quick quiz.</p>
                    <div class="quiz-info">
                        <i class="fas fa-clock"></i> Estimated time: 2-3 minutes<br>
                        <i class="fas fa-question-circle"></i> Multiple choice questions<br>
                        <i class="fas fa-trophy"></i> Instant feedback provided
                    </div>
                </div>
                <div class="modal-footer justify-content-center">
                    <button type="button" class="btn btn-success btn-lg" id="start-quiz-btn">
                        <i class="fas fa-play"></i> Start Quiz
                    </button>
                    <button type="button" class="btn btn-outline-secondary" id="skip-quiz-btn">
                        Skip Quiz
                    </button>
                </div>
            </div>
        </div>
    `;

        document.body.appendChild(modal);

        // Show modal
        const modalInstance = new bootstrap.Modal(modal, {
            backdrop: 'static',
            keyboard: false
        });
        modalInstance.show();

        // Add event listeners with proper modal handling
        const startQuizBtn = modal.querySelector('#start-quiz-btn');
        const skipQuizBtn = modal.querySelector('#skip-quiz-btn');

        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                // Disable button to prevent multiple clicks
                startQuizBtn.disabled = true;
                startQuizBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting Quiz...';

                try {
                    // Hide modal first
                    modalInstance.hide();

                    // Wait for modal to be hidden
                    modal.addEventListener('hidden.bs.modal', async () => {
                        // Remove modal from DOM
                        if (modal.parentNode) {
                            modal.remove();
                        }

                        // Start the actual quiz
                        if (window.quizGeneratorComponent) {
                            await window.quizGeneratorComponent.startQuiz();
                        } else {
                            this.proceedAfterVideo();
                        }
                    });

                } catch (error) {
                    console.error('Error starting quiz:', error);
                    // Re-enable button on error
                    startQuizBtn.disabled = false;
                    startQuizBtn.innerHTML = '<i class="fas fa-play"></i> Start Quiz';
                    this.showError('Failed to start quiz. Please try again.');
                }
            });
        }

        if (skipQuizBtn) {
            skipQuizBtn.addEventListener('click', (e) => {
                e.preventDefault();
                modalInstance.hide();

                // Wait for modal to be hidden
                modal.addEventListener('hidden.bs.modal', () => {
                    if (modal.parentNode) {
                        modal.remove();
                    }
                    this.proceedAfterVideo();
                });
            });
        }

        // Clean up modal when hidden (fallback)
        modal.addEventListener('hidden.bs.modal', () => {
            if (modal.parentNode) {
                modal.remove();
            }
        });
    }

    proceedAfterVideo() {
        // Check if this is the last video
        const progress = this.getProgressFallback();
        if (!progress) return;

        // Check if all videos are completed
        const allVideosCompleted = this.isLearningCompleteFallback(progress);

        if (allVideosCompleted) {
            // Show course completion
            setTimeout(async () => {
                await this.showCourseCompletionCelebration();
                setTimeout(async () => {
                    await this.showLearningComplete();
                }, 3000);
            }, 1000);
        } else {
            // Move to next video
            this.handleNextVideo();
        }
    }



    // Add fallback method for checking completion
    isLearningCompleteFallback(progress) {
        try {
            if (window.progressManager && typeof window.progressManager.isLearningComplete === 'function') {
                return window.progressManager.isLearningComplete();
            } else {
                // Fallback check
                if (!progress || !progress.videos || progress.videos.length === 0) {
                    return false;
                }

                const completedVideos = progress.videos.filter(v => v.completed).length;
                return completedVideos === progress.videos.length;
            }
        } catch (error) {
            console.error('Error checking learning completion:', error);
            return false;
        }
    }

    // async showCourseCompletionCelebration() {
    //     // Create celebration modal
    //     const celebrationModal = document.createElement('div');
    //     celebrationModal.className = 'modal fade celebration-modal';
    //     celebrationModal.innerHTML = `
    //     <div class="modal-dialog modal-lg">
    //         <div class="modal-content glass-card celebration-content">
    //             <div class="celebration-animation">
    //                 <div class="confetti"></div>
    //                 <div class="celebration-icon">
    //                     🏆
    //                 </div>
    //                 <h2 class="celebration-title">Course Complete!</h2>
    //                 <p class="celebration-message">
    //                     Congratulations! You've successfully completed your learning journey!
    //                 </p>
    //                 <div class="celebration-stats">
    //                     <div class="stat-item">
    //                         <i class="fas fa-video"></i>
    //                         <span>All Videos Watched</span>
    //                     </div>
    //                     <div class="stat-item">
    //                         <i class="fas fa-brain"></i>
    //                         <span>Knowledge Gained</span>
    //                     </div>
    //                     <div class="stat-item">
    //                         <i class="fas fa-trophy"></i>
    //                         <span>Achievement Unlocked</span>
    //                     </div>
    //                 </div>
    //                 <button class="btn btn-primary btn-lg celebration-continue">
    //                     View My Learning Summary <i class="fas fa-arrow-right"></i>
    //                 </button>
    //             </div>
    //         </div>
    //     </div>
    // `;

    //     document.body.appendChild(celebrationModal);

    //     // Show modal
    //     const modal = new bootstrap.Modal(celebrationModal, {
    //         backdrop: 'static',
    //         keyboard: false
    //     });
    //     modal.show();

    //     // Add click handler for continue button
    //     celebrationModal.querySelector('.celebration-continue').addEventListener('click', () => {
    //         modal.hide();
    //         celebrationModal.remove();
    //     });

    //     // Add confetti animation
    //     this.triggerConfettiAnimation();
    // }

    async showCourseCompletionCelebration() {
    // Play celebration audio
    this.playCelebrationAudio();
    
    // Create celebration modal
    const celebrationModal = document.createElement('div');
    celebrationModal.className = 'modal fade celebration-modal';
    celebrationModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content glass-card celebration-content">
                <div class="celebration-animation">
                    <div class="confetti"></div>
                    <div class="celebration-icon">
                        🏆
                    </div>
                    <h2 class="celebration-title">Course Complete!</h2>
                    <p class="celebration-message">
                        Congratulations! You've successfully completed your learning journey!
                    </p>
                    <div class="celebration-stats">
                        <div class="stat-item">
                            <i class="fas fa-video"></i>
                            <span>All Videos Watched</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-brain"></i>
                            <span>Knowledge Gained</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-trophy"></i>
                            <span>Achievement Unlocked</span>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-lg celebration-continue">
                        View My Learning Summary <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(celebrationModal);

    // Show modal
    const modal = new bootstrap.Modal(celebrationModal, {
        backdrop: 'static',
        keyboard: false
    });
    modal.show();

    // Add click handler for continue button
    celebrationModal.querySelector('.celebration-continue').addEventListener('click', () => {
        modal.hide();
        celebrationModal.remove();
    });

    // Add confetti animation
    this.triggerConfettiAnimation();
}

playCelebrationAudio() {
    try {
        // Use a free online celebration sound
        const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav');
        
        audio.volume = 0.6; // Set volume to 60%
        audio.play().catch(error => {
            console.log('Could not play celebration audio:', error);
            // Audio playback might be blocked by browser - that's okay
        });
        
        console.log('🎵 Playing celebration audio');
    } catch (error) {
        console.log('Celebration audio not available:', error);
        // Fail silently - audio is optional
    }
}

    triggerConfettiAnimation() {
        // Create confetti particles
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-particle';
            confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${this.getRandomColor()};
            top: -10px;
            left: ${Math.random() * 100}%;
            z-index: 9999;
            animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
        `;

            document.body.appendChild(confetti);

            // Remove confetti after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.remove();
                }
            }, 5000);
        }
    }

    // Helper method for random colors:
    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fd79a8', '#fdcb6e'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    handleNextVideo() {
        try {
            const progress = this.getProgressFallback();
            if (!progress || !progress.videos) return;

            // Find next uncompleted video
            const nextVideo = this.getNextVideoFallback(progress);

            if (nextVideo) {
                this.loadVideo(nextVideo);
            } else {
                // All videos completed
                this.showLearningComplete();
            }
        } catch (error) {
            console.error('Error handling next video:', error);
            this.showError('Failed to load next video. Please try again.');
        }
    }

    // Add fallback method for getting next video
    getNextVideoFallback(progress) {
        try {
            if (window.progressManager && typeof window.progressManager.getNextVideo === 'function') {
                return window.progressManager.getNextVideo();
            } else {
                // Fallback logic
                if (!progress || !progress.videos) return null;

                // Find first uncompleted video
                const nextVideo = progress.videos.find(v => !v.completed);
                return nextVideo || null;
            }
        } catch (error) {
            console.error('Error getting next video:', error);
            return null;
        }
    }

    handlePrevVideo() {
        const progress = progressManager.getProgress();
        if (!progress) return;

        const currentIndex = progress.videos.findIndex(v => v.videoId === this.currentVideo.videoId);
        if (currentIndex > 0) {
            this.loadVideo(progress.videos[currentIndex - 1]);
        }
    }

    async showLearningComplete() {
        try {
            // Generate summary
            this.showSection('loading-section');
            this.updateLoadingProgress(0, 'Generating your learning summary...');

            await this.generateLearningSummary();

            this.showSection('summary-section');

        } catch (error) {
            console.error('Error showing learning complete:', error);
            this.showError('Failed to generate learning summary.');
        }
    }

    async generateLearningSummary() {
        try {
            const progress = progressManager.getProgress();
            const statistics = progressManager.getStatistics();

            this.updateLoadingProgress(50, 'Analyzing your learning journey...');

            // Generate AI summary
            const userData = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
            const aiSummary = await groqAPI.generateLearningSummary(progress, userData);

            this.updateLoadingProgress(100, 'Summary ready!');

            // Update summary content
            this.updateSummaryContent(statistics, aiSummary);

        } catch (error) {
            console.error('Error generating learning summary:', error);
            // Show basic summary without AI
            const statistics = progressManager.getStatistics();
            this.updateSummaryContent(statistics, null);
        }
    }

    // Update the updateSummaryContent method:

    updateSummaryContent(statistics, aiSummary) {
        const summaryContent = document.getElementById('summary-content');
        if (!summaryContent) return;

        const userProfile = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
        const progress = progressManager.getProgress();

        summaryContent.innerHTML = `
        <div class="completion-banner">
            <div class="completion-icon">🎓</div>
            <h3>Learning Journey Complete!</h3>
            <p>You've successfully mastered <strong>${userProfile.learningGoal}</strong></p>
        </div>
        
        <div class="summary-stats">
            <div class="stat-card glass-card">
                <div class="stat-icon"><i class="fas fa-video"></i></div>
                <div class="stat-value">${statistics.completedVideos}</div>
                <div class="stat-label">Videos Completed</div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon"><i class="fas fa-quiz"></i></div>
                <div class="stat-value">${statistics.completedQuizzes}</div>
                <div class="stat-label">Quizzes Taken</div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                <div class="stat-value">${statistics.averageQuizScore}%</div>
                <div class="stat-label">Average Score</div>
            </div>
            <div class="stat-card glass-card">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-value">${statistics.timeSpent.formatted}</div>
                <div class="stat-label">Time Invested</div>
            </div>
        </div>
        
        ${aiSummary ? `
            <div class="ai-summary glass-card">
                <h4><i class="fas fa-robot"></i> Your Personalized Learning Summary</h4>
                <div class="summary-text">${aiSummary}</div>
            </div>
        ` : ''}
        
        <div class="download-section glass-card">
            <h4><i class="fas fa-download"></i> Download Your Learning Materials</h4>
            <p>Get your personalized notes and certificate to keep your learning progress.</p>
            <div class="download-options">
                <button class="btn btn-success download-btn" onclick="downloadLearningNotes()">
                    <i class="fas fa-file-alt"></i>
                    <span>Download Learning Notes</span>
                    <small>Comprehensive study notes</small>
                </button>
                <button class="btn btn-primary download-btn" onclick="downloadCertificate()">
                    <i class="fas fa-certificate"></i>
                    <span>Download Certificate</span>
                    <small>Completion certificate</small>
                </button>
                <button class="btn btn-info download-btn" onclick="downloadProgressReport()">
                    <i class="fas fa-chart-line"></i>
                    <span>Progress Report</span>
                    <small>Detailed analytics</small>
                </button>
            </div>
        </div>
        
        <div class="achievements glass-card">
            <h4><i class="fas fa-medal"></i> Your Achievements</h4>
            <div class="achievement-badges">
                ${this.generateAchievementBadges(statistics)}
            </div>
        </div>
        
        <div class="next-steps glass-card">
            <h4><i class="fas fa-rocket"></i> What's Next?</h4>
            <p>Continue your learning journey with these recommendations:</p>
            <div class="next-step-options">
                <button class="btn btn-outline-primary" onclick="exploreRelatedTopics()">
                    <i class="fas fa-search"></i> Explore Related Topics
                </button>
                <button class="btn btn-outline-success" onclick="startAdvancedCourse()">
                    <i class="fas fa-level-up-alt"></i> Take Advanced Course
                </button>
                <button class="btn btn-outline-info" onclick="shareAchievement()">
                    <i class="fas fa-share"></i> Share Achievement
                </button>
            </div>
        </div>
    `;

        // Animate summary elements
        const elements = summaryContent.querySelectorAll('.stat-card, .ai-summary, .download-section, .achievements, .next-steps');
        if (typeof animationManager !== 'undefined') {
            animationManager.staggerIn(elements, 0.3, 0.1);
        }
    }



    generateAchievementBadges(statistics) {
        const badges = [];

        if (statistics.completedVideos >= 5) {
            badges.push('<div class="badge achievement-badge"><i class="fas fa-video"></i> Video Master</div>');
        }

        if (statistics.averageQuizScore >= 80) {
            badges.push('<div class="badge achievement-badge"><i class="fas fa-star"></i> Quiz Champion</div>');
        }

        if (statistics.completedQuizzes >= 3) {
            badges.push('<div class="badge achievement-badge"><i class="fas fa-brain"></i> Knowledge Seeker</div>');
        }

        if (statistics.timeSpent.hours >= 2) {
            badges.push('<div class="badge achievement-badge"><i class="fas fa-clock"></i> Dedicated Learner</div>');
        }

        return badges.join('');
    }

    // Chat functionality
    async sendChatMessage() {
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');

        if (!chatInput || !chatMessages) return;

        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        this.addChatMessage(message, 'user');
        chatInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get AI response
            const response = await groqAPI.chatWithAI(message, this.currentVideo, this.learningSession);

            // Remove typing indicator
            this.hideTypingIndicator();

            // Add AI response
            this.addChatMessage(response, 'ai');

        } catch (error) {
            console.error('Error sending chat message:', error);
            this.hideTypingIndicator();
            this.addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    }

    addChatMessage(message, sender) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Animate message
        animationManager.fadeIn(messageElement, 0.3);
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const typingElement = document.createElement('div');
        typingElement.className = 'message ai-message typing-indicator';
        typingElement.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    toggleChatPanel() {
        const chatContainer = document.querySelector('.ai-chat-container');
        const toggleBtn = document.getElementById('toggle-chat');

        if (!chatContainer || !toggleBtn) return;

        chatContainer.classList.toggle('collapsed');
        const icon = toggleBtn.querySelector('i');

        if (chatContainer.classList.contains('collapsed')) {
            icon.className = 'fas fa-chevron-down';
        } else {
            icon.className = 'fas fa-chevron-up';
        }
    }



    // Floating assistant
    toggleFloatingAssistant() {
        const assistantPopup = document.getElementById('assistant-popup');
        if (assistantPopup) {
            assistantPopup.classList.toggle('show');
        }
    }

    closeFloatingAssistant() {
        const assistantPopup = document.getElementById('assistant-popup');
        if (assistantPopup) {
            assistantPopup.classList.remove('show');
        }
    }

    showAssistantLoading() {
        const popup = document.getElementById('assistant-popup');
        if (popup) {
            // Remove existing loader first
            const existingLoader = popup.querySelector('.assistant-loader');
            if (existingLoader) {
                existingLoader.remove();
            }

            const loader = document.createElement('div');
            loader.className = 'assistant-loader';
            loader.innerHTML = `
            <div class="loading-spinner"></div>
            <span>Processing...</span>
        `;
            loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 10px;
            font-size: 12px;
            z-index: 1002;
            display: flex;
            align-items: center;
            gap: 8px;
        `;

            popup.appendChild(loader);
        }
    }

    hideAssistantLoading() {
        const loader = document.querySelector('.assistant-loader');
        if (loader) {
            loader.remove();
        }
    }

    // Show success indicator
    showAssistantSuccess(message = 'Message sent!') {
        const popup = document.getElementById('assistant-popup');
        if (popup) {
            // Remove any existing indicators
            const existingIndicator = popup.querySelector('.assistant-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            const indicator = document.createElement('div');
            indicator.className = 'assistant-indicator success-indicator';
            indicator.innerHTML = `<i class="fas fa-check"></i> ${message}`;
            indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            z-index: 1003;
            animation: slideInOut 3s ease-in-out;
        `;

            popup.appendChild(indicator);

            // Remove after 3 seconds
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 3000);
        }
    }

    // Show error indicator
    showAssistantError(message = 'Error occurred') {
        const popup = document.getElementById('assistant-popup');
        if (popup) {
            // Remove any existing indicators
            const existingIndicator = popup.querySelector('.assistant-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            const indicator = document.createElement('div');
            indicator.className = 'assistant-indicator error-indicator';
            indicator.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
            indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #dc3545;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            z-index: 1003;
            animation: slideInOut 3s ease-in-out;
        `;

            popup.appendChild(indicator);

            // Remove after 3 seconds
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 3000);
        }
    }

    async sendAssistantMessage() {
        const input = document.querySelector('.assistant-input input');
        const message = input.value.trim();

        if (!message) return;

        // Clear the input but DON'T close the popup
        input.value = '';

        // Show loading state in popup
        this.showAssistantLoading();

        try {
            // Add to main chat if available
            if (window.chatAssistantComponent) {
                await window.chatAssistantComponent.addMessage('user', message);
                window.chatAssistantComponent.showTypingIndicator();

                const response = await window.chatAssistantComponent.getAIResponse(message);
                window.chatAssistantComponent.hideTypingIndicator();
                await window.chatAssistantComponent.addMessage('ai', response);

                // Show success indicator in popup
                this.showAssistantSuccess('Message sent to chat!');

            } else {
                // Fallback - add to main chat
                this.addChatMessage(message, 'user');
                this.showTypingIndicator();

                const response = await groqAPI.chatWithAI(message, this.currentVideo, this.learningSession);
                this.hideTypingIndicator();
                this.addChatMessage(response, 'ai');

                // Show success indicator in popup
                this.showAssistantSuccess('Response received!');
            }

        } catch (error) {
            console.error('Error sending assistant message:', error);

            // Handle error for chatAssistantComponent
            if (window.chatAssistantComponent) {
                window.chatAssistantComponent.hideTypingIndicator();
                await window.chatAssistantComponent.addMessage('ai', 'Sorry, I encountered an error. Please try again.');
            } else {
                this.hideTypingIndicator();
                this.addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
            }

            // Show error indicator in popup
            this.showAssistantError('Failed to send message');
        }

        // Always hide loading state (moved out of finally block)
        this.hideAssistantLoading();
    }

    // Update handleQuickQuestion to NOT close popup for selection
    handleQuickQuestion(question) {
        const assistantInput = document.querySelector('.assistant-input input');
        if (assistantInput) {
            assistantInput.value = question;
            assistantInput.focus();

            // DON'T close popup automatically - let user send manually
            // Just focus the input so they can review the question

            // Optional: Add a small delay to let user see what was selected
            setTimeout(() => {
                assistantInput.focus();
            }, 100);
        }
    }







    // Utility functions
    formatDuration(seconds) {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showSuccessMessage(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 3000);
    }

    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    showInitializationError(error) {
        const errorHtml = `
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="alert alert-danger">
                            <h4><i class="fas fa-exclamation-triangle"></i> Initialization Error</h4>
                            <p>The application failed to initialize properly.</p>
                            <p><strong>Error:</strong> ${error.message}</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="fas fa-redo"></i> Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.innerHTML = errorHtml;
    }

    // UI Management
    showSection(sectionId) {
        if (this.currentSection === sectionId) return;

        const currentEl = document.getElementById(this.currentSection);
        const targetEl = document.getElementById(sectionId);

        if (!targetEl) {
            console.error('Section not found:', sectionId);
            return;
        }

        // Hide current section
        if (currentEl) {
            currentEl.style.display = 'none';
        }

        // Show target section
        targetEl.style.display = 'block';

        // Animate transition
        if (typeof animationManager !== 'undefined') {
            animationManager.fadeIn(targetEl, 0.5);
        }

        this.currentSection = sectionId;
    }

    showInitialSection() {
        const existingSession = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);

        if (existingSession && existingSession.learningGoal) {
            // Will be handled by checkExistingSession
            return;
        }

        this.showSection('onboarding-section');
    }

    // Theme Management
    setTheme(themeName) {
        // Remove all theme classes
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-nebula');

        // Add new theme class
        document.body.classList.add(`theme-${themeName}`);

        // Update theme stylesheet
        const themeStylesheet = document.getElementById('theme-stylesheet');
        if (themeStylesheet) {
            themeStylesheet.href = `css/themes/${themeName}.css`;
        }

        // Save theme to storage
        storage.set(CONFIG.STORAGE_KEYS.THEME, themeName);

        // Update button states
        this.updateThemeButtons(themeName);

        console.log(`Theme changed to: ${themeName}`);
    }

    // Update theme buttons active state
    updateThemeButtons(activeTheme) {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            const btnTheme = btn.getAttribute('data-theme');
            if (btnTheme === activeTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case 'Escape':
                    this.handleEscapeKey();
                    break;
                case 'F1':
                    e.preventDefault();
                    this.showHelp();
                    break;
            }

            // Ctrl/Cmd shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'h':
                        e.preventDefault();
                        this.showHelp();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetApp();
                        break;
                }
            }
        });
    }

    handleEscapeKey() {
        // Close floating assistant
        this.closeFloatingAssistant();

        // Close any open modals
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }

    showHelp() {
        alert('Keyboard Shortcuts:\n\nEsc - Close modals/popups\nF1 - Show help\nCtrl+H - Show help\nCtrl+R - Reset app');
    }

    resetApp() {
        if (confirm('Are you sure you want to reset the app? This will clear all your progress.')) {
            storage.clear();
            location.reload();
        }
    }

    // Event Handlers
    handleWindowResize() {
        // Update responsive elements
        const youtubePlayer = document.getElementById('youtube-player');
        if (youtubePlayer) {
            // Maintain aspect ratio
            const container = youtubePlayer.parentElement;
            const containerWidth = container.offsetWidth;
            youtubePlayer.style.height = `${containerWidth * 0.5625}px`;
        }
    }

    handleBeforeUnload(event) {
        // Save current session state
        if (this.learningSession) {
            storage.set('temp-session', this.learningSession);
        }

        // Show confirmation if learning is in progress
        if (this.currentSection === 'dashboard-section' || this.currentSection === 'quiz-section') {
            event.preventDefault();
            event.returnValue = 'Are you sure you want to leave? Your progress will be saved.';
        }
    }

    handleOnlineStatus(isOnline) {
        if (!isOnline) {
            this.showError('You are currently offline. Some features may not work properly.');
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Pause any ongoing activities
            console.log('Page hidden, pausing activities');
        } else {
            // Resume activities
            console.log('Page visible, resuming activities');
        }
    }

    // Animation Initialization
    initializeAnimations() {
        // Initialize page entrance animations
        const elements = document.querySelectorAll('[data-animate]');
        elements.forEach(element => {
            const animationType = element.dataset.animate;
            animationManager.fadeIn(element, 0.5);
        });
    }

    // Summary actions
    downloadRevisionNotes() {
        const progress = progressManager.getProgress();
        const statistics = progressManager.getStatistics();

        const notesData = {
            learningGoal: this.learningSession.learningGoal,
            completedVideos: progress.videos.filter(v => v.completed),
            statistics: statistics,
            notes: progress.videos.reduce((allNotes, video) => {
                return allNotes.concat(video.notes || []);
            }, []),
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(notesData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `learning-notes-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    startNewLearningSession() {
        if (confirm('Are you sure you want to start a new learning session? This will clear your current progress.')) {
            storage.clear();
            location.reload();
        }
    }

    // Public API
    getCurrentSection() {
        return this.currentSection;
    }

    getLearningSession() {
        return this.learningSession;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Onboarding form step management
let currentStep = 1;
const totalSteps = 3;

function nextStep() {
    const current = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const next = document.querySelector(`.form-step[data-step="${currentStep + 1}"]`);

    if (!next) return;

    // Validate current step
    if (!validateStep(currentStep)) {
        return;
    }

    // Hide current step
    current.classList.remove('active');
    animationManager.slideOut(current, 'left', 0.3);

    // Show next step
    setTimeout(() => {
        current.style.display = 'none';
        next.style.display = 'block';
        next.classList.add('active');
        animationManager.slideIn(next, 'right', 0.3);
        currentStep++;
    }, 300);
}

function prevStep() {
    const current = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const prev = document.querySelector(`.form-step[data-step="${currentStep - 1}"]`);

    if (!prev) return;

    // Hide current step
    current.classList.remove('active');
    animationManager.slideOut(current, 'right', 0.3);

    // Show previous step
    setTimeout(() => {
        current.style.display = 'none';
        prev.style.display = 'block';
        prev.classList.add('active');
        animationManager.slideIn(prev, 'left', 0.3);
        currentStep--;
    }, 300);
}

function validateStep(step) {
    const stepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    const requiredFields = stepElement.querySelectorAll('input[required], select[required]');

    for (let field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            animationManager.shakeAnimation(field, 10, 0.5);
            return false;
        }
    }

    return true;
}

// Add these global download functions:

// Download comprehensive learning notes
async function downloadLearningNotes() {
    try {
        const userProfile = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
        const progress = progressManager.getProgress();
        const statistics = progressManager.getStatistics();

        // Generate comprehensive notes
        let notesContent = `
Aziona LearnFlow - LEARNING SUMMARY
===================================

Student: ${userProfile.name}
Course: ${userProfile.learningGoal}
Skill Level: ${userProfile.skillLevel}
Completion Date: ${new Date().toLocaleDateString()}

COURSE OVERVIEW
===============
Total Videos Watched: ${statistics.completedVideos}
Quizzes Completed: ${statistics.completedQuizzes}
Average Quiz Score: ${statistics.averageQuizScore}%
Total Time Invested: ${statistics.timeSpent.formatted}

VIDEO LEARNING PATH
==================
`;

        // Add video details
        progress.videos.forEach((video, index) => {
            notesContent += `
${index + 1}. ${video.title}
   Status: ${video.completed ? '✅ Completed' : '⏳ Incomplete'}
   ${video.quizCompleted ? `Quiz Score: ${video.quizScore}%` : 'Quiz: Not taken'}
   ${video.notes && video.notes.length > 0 ? `Notes: ${video.notes.length} personal notes` : ''}
`;
        });

        notesContent += `

KEY ACHIEVEMENTS
================
`;

        // Add achievements
        const achievements = generateAchievementsList(statistics);
        achievements.forEach(achievement => {
            notesContent += `• ${achievement}\n`;
        });

        notesContent += `

LEARNING RECOMMENDATIONS
========================
Based on your performance, here are some next steps:

1. Practice implementing what you've learned in real projects
2. Explore advanced topics in ${userProfile.learningGoal}
3. Share your knowledge with others
4. Consider related learning paths

Generated by Aziona LearnFlow - AI-Powered Learning Platform
Visit: https://aziona-learntube.com
`;

        // Download the file
        downloadFile(notesContent, `${userProfile.learningGoal}_Learning_Notes.txt`, 'text/plain');

        // Show success message
        if (window.azionaApp) {
            window.azionaApp.showSuccessMessage('📄 Learning notes downloaded successfully!');
        }

    } catch (error) {
        console.error('Error downloading learning notes:', error);
        if (window.azionaApp) {
            window.azionaApp.showError('Failed to download learning notes. Please try again.');
        }
    }
}

// Download completion certificate
async function downloadCertificate() {
    try {
        const userProfile = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
        const statistics = progressManager.getStatistics();

        // Create certificate content
        const certificateContent = `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                    CERTIFICATE OF COMPLETION                   ║
║                                                                ║
║                        Aziona LearnFlow                        ║
║                   AI-Powered Learning Platform                 ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║                    This certifies that                        ║
║                                                                ║
║                      ${userProfile.name.toUpperCase()}                        ║
║                                                                ║
║              has successfully completed the course             ║
║                                                                ║
║                    ${userProfile.learningGoal}                    ║
║                                                                ║
║                     Skill Level: ${userProfile.skillLevel}                   ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Course Statistics:                                            ║
║  • Videos Completed: ${statistics.completedVideos}                             ║
║  • Average Quiz Score: ${statistics.averageQuizScore}%                        ║
║  • Time Invested: ${statistics.timeSpent.formatted}                   ║
║                                                                ║
║  Date of Completion: ${new Date().toLocaleDateString()}                        ║
║                                                                ║
║                                                                ║
║  ________________________    ________________________        ║
║     Aziona LearnFlow            AI Learning Assistant         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

This certificate verifies that the above-named individual has 
successfully completed the ${userProfile.learningGoal} course through 
Aziona LearnFlow's AI-powered learning platform.

Certificate ID: ALT-${Date.now()}
Verification: https://aziona-learntube.com/verify
`;

        downloadFile(certificateContent, `${userProfile.name}_${userProfile.learningGoal}_Certificate.txt`, 'text/plain');

        // Show success message
        if (window.azionaApp) {
            window.azionaApp.showSuccessMessage('🏆 Certificate downloaded successfully!');
        }

    } catch (error) {
        console.error('Error downloading certificate:', error);
        if (window.azionaApp) {
            window.azionaApp.showError('Failed to download certificate. Please try again.');
        }
    }
}

// Download detailed progress report
async function downloadProgressReport() {
    try {
        const userProfile = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
        const progress = progressManager.getProgress();
        const statistics = progressManager.getStatistics();
        const quizHistory = storage.get('quiz-history', []);

        const reportData = {
            studentInfo: {
                name: userProfile.name,
                learningGoal: userProfile.learningGoal,
                skillLevel: userProfile.skillLevel,
                startDate: progress.startTime,
                completionDate: new Date().toISOString()
            },
            courseStatistics: statistics,
            videoProgress: progress.videos.map(video => ({
                title: video.title,
                completed: video.completed,
                quizScore: video.quizScore || 0,
                timeSpent: video.timeSpent || 0,
                notesCount: video.notes ? video.notes.length : 0
            })),
            quizHistory: quizHistory,
            generatedAt: new Date().toISOString(),
            platform: 'Aziona LearnFlow - AI-Powered Learning'
        };

        downloadFile(JSON.stringify(reportData, null, 2), `${userProfile.name}_Progress_Report.json`, 'application/json');

        // Show success message
        if (window.azionaApp) {
            window.azionaApp.showSuccessMessage('📊 Progress report downloaded successfully!');
        }

    } catch (error) {
        console.error('Error downloading progress report:', error);
        if (window.azionaApp) {
            window.azionaApp.showError('Failed to download progress report. Please try again.');
        }
    }
}

// Helper function to download files
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// Generate achievements list
function generateAchievementsList(statistics) {
    const achievements = [];

    achievements.push(`Completed ${statistics.completedVideos} educational videos`);

    if (statistics.completedQuizzes > 0) {
        achievements.push(`Took ${statistics.completedQuizzes} quizzes with ${statistics.averageQuizScore}% average score`);
    }

    if (statistics.averageQuizScore >= 90) {
        achievements.push('🌟 Excellence Award - 90%+ average quiz score');
    } else if (statistics.averageQuizScore >= 80) {
        achievements.push('⭐ Achievement Award - 80%+ average quiz score');
    }

    if (statistics.timeSpent.hours >= 5) {
        achievements.push('⏰ Dedicated Learner - 5+ hours of study time');
    } else if (statistics.timeSpent.hours >= 2) {
        achievements.push('📚 Committed Student - 2+ hours of study time');
    }

    achievements.push('🎯 Course Completion - Finished entire learning path');

    return achievements;
}

// Add other action functions
function exploreRelatedTopics() {
    const userProfile = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
    const relatedTopics = getRelatedTopics(userProfile.learningGoal);

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h5 class="modal-title">Related Learning Topics</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Based on your completion of <strong>${userProfile.learningGoal}</strong>, here are related topics you might enjoy:</p>
                    <div class="related-topics">
                        ${relatedTopics.map(topic => `
                            <button class="btn btn-outline-primary m-1" onclick="startNewCourse('${topic}')">
                                ${topic}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

function getRelatedTopics(completedTopic) {
    const relatedMap = {
        'Python Programming': ['Machine Learning', 'Data Science', 'Web Development'],
        'JavaScript Programming': ['Web Development', 'React Development', 'Node.js'],
        'Web Development': ['UI/UX Design', 'Frontend Frameworks', 'Backend Development'],
        'Machine Learning': ['Deep Learning', 'Data Science', 'AI Ethics'],
        'Data Science': ['Machine Learning', 'Statistics', 'Data Visualization'],
        'UI/UX Design': ['Web Development', 'Design Systems', 'User Research']
    };

    return relatedMap[completedTopic] || ['Advanced Programming', 'Software Development', 'Technology Trends'];
}

function startAdvancedCourse() {
    alert('Advanced courses coming soon! 🚀');
}

function shareAchievement() {
    const userProfile = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
    const shareText = `🎉 I just completed ${userProfile.learningGoal} on Aziona LearnFlow! AI-powered learning makes all the difference. #Learning #AI #Achievement`;

    if (navigator.share) {
        navigator.share({
            title: 'Learning Achievement',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            if (window.azionaApp) {
                window.azionaApp.showSuccessMessage('🔗 Achievement copied to clipboard!');
            }
        });
    }
}

function startNewCourse(topic) {
    // Clear current progress and start new course
    storage.remove(CONFIG.STORAGE_KEYS.USER_PROFILE);
    progressManager.clearProgress();

    if (window.azionaApp) {
        window.azionaApp.showSection('onboarding-section');
    }

    // Pre-fill the topic if provided
    if (topic) {
        setTimeout(() => {
            const goalInput = document.querySelector(`input[value="${topic}"]`);
            if (goalInput) {
                goalInput.checked = true;
            }
        }, 500);
    }
}

// Update the DOMContentLoaded event:

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing App');

    // Check if required dependencies are loaded
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG not loaded');
        return;
    }

    if (typeof storage === 'undefined') {
        console.error('Storage not loaded');
        return;
    }

    // Initialize app
    try {
        window.azionaApp = new AzionaLearnTubeApp();

        // Create global pageTransitionManager after app initialization
        window.pageTransitionManager = {
            showSection: (sectionId) => {
                if (window.azionaApp) {
                    window.azionaApp.showSection(sectionId);
                }
            }
        };

        console.log('✅ App and PageTransitionManager initialized successfully');

    } catch (error) {
        console.error('❌ Failed to initialize app:', error);

        // Show error message to user
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="alert alert-danger">
                            <h4><i class="fas fa-exclamation-triangle"></i> Application Error</h4>
                            <p>Failed to initialize the application.</p>
                            <p><strong>Error:</strong> ${error.message}</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="fas fa-redo"></i> Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
});