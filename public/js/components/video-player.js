// Video player component for managing video playback and progress
class VideoPlayerComponent {
    constructor() {
        this.currentVideoIndex = 0;
        this.videos = [];
        this.currentVideo = null;
        this.learningPlan = null;
        this.initializeEventListeners();
    }
    
    // Initialize event listeners
    initializeEventListeners() {
        // Video control buttons
        const prevButton = document.getElementById('prev-video');
        const nextButton = document.getElementById('next-video');
        const completeButton = document.getElementById('mark-complete');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => this.previousVideo());
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => this.nextVideo());
        }
        
        if (completeButton) {
            completeButton.addEventListener('click', () => this.markVideoComplete());
        }
        
        // Playlist item clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.playlist-item')) {
                const videoId = e.target.closest('.playlist-item').dataset.videoId;
                this.playVideo(videoId);
            }
        });
    }
    
    // Initialize dashboard with video data
    async initializeDashboard() {
        try {
            // Get current session data
            const session = sessionManager.getCurrentSession();
            const progress = progressManager.getProgress();
            
            if (!session || !progress) {
                console.error('No session or progress data found');
                return;
            }
            
            this.videos = session.selectedVideos;
            this.learningPlan = session.learningPlan;
            
            // Update progress display
            this.updateProgressDisplay();
            
            // Build playlist
            this.buildPlaylist();
            
            // Load first incomplete video
            const nextVideo = progressManager.getNextVideo();
            if (nextVideo) {
                this.currentVideoIndex = this.videos.findIndex(v => v.videoId === nextVideo.videoId);
                await this.loadVideo(nextVideo.videoId);
            } else {
                // All videos completed
                await this.showCompletionSummary();
            }
            
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }
    
    // Build video playlist
    buildPlaylist() {
        const playlistContainer = document.getElementById('playlist-items');
        if (!playlistContainer) return;
        
        playlistContainer.innerHTML = '';
        
        this.videos.forEach((video, index) => {
            const progress = progressManager.getProgress();
            const videoProgress = progress?.videos.find(v => v.videoId === video.videoId);
            
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-item';
            playlistItem.dataset.videoId = video.videoId;
            
            // Add status classes
            if (videoProgress?.completed) {
                playlistItem.classList.add('completed');
            }
            if (index === this.currentVideoIndex) {
                playlistItem.classList.add('active');
            }
            
            playlistItem.innerHTML = `
                <div class="status">
                    ${videoProgress?.completed ? '<i class="fas fa-check"></i>' : 
                      index === this.currentVideoIndex ? '<i class="fas fa-play"></i>' : 
                      index + 1}
                </div>
                <div class="info">
                    <div class="title">${video.title}</div>
                    <div class="duration">${video.concepts?.join(', ') || 'Educational content'}</div>
                </div>
            `;
            
            playlistContainer.appendChild(playlistItem);
        });
        
        // Animate playlist items
        const items = playlistContainer.querySelectorAll('.playlist-item');
        animationManager.staggerIn(items, 0.3, 0.1);
    }
    
    // Load video by ID
    async loadVideo(videoId) {
        try {
            const video = this.videos.find(v => v.videoId === videoId);
            if (!video) {
                console.error('Video not found:', videoId);
                return;
            }
            
            this.currentVideo = video;
            this.currentVideoIndex = this.videos.findIndex(v => v.videoId === videoId);
            
            // Load video in iframe
            const iframe = document.getElementById('youtube-player');
            if (iframe) {
                iframe.src = `${video.embedUrl}?autoplay=1&rel=0&modestbranding=1`;
            }
            
            // Update playlist active state
            this.updatePlaylistActiveState();
            
            // Update navigation buttons
            this.updateNavigationButtons();
            
            // Generate chapter breakdown
            await this.generateChapterBreakdown();
            
            // Update AI chat context
            this.updateChatContext();
            
        } catch (error) {
            console.error('Error loading video:', error);
        }
    }
    
    // Play specific video
    async playVideo(videoId) {
        await this.loadVideo(videoId);
        
        // Update session activity
        sessionManager.updateActivity();
    }
    
    // Go to previous video
    async previousVideo() {
        if (this.currentVideoIndex > 0) {
            await this.loadVideo(this.videos[this.currentVideoIndex - 1].videoId);
        }
    }
    
    // Go to next video
    async nextVideo() {
        if (this.currentVideoIndex < this.videos.length - 1) {
            await this.loadVideo(this.videos[this.currentVideoIndex + 1].videoId);
        }
    }
    
    // Mark current video as complete
    async markVideoComplete() {
        if (!this.currentVideo) return;
        
        try {
            // Update progress
            progressManager.markVideoCompleted(this.currentVideo.videoId);
            
            // Update UI
            this.updateProgressDisplay();
            this.updatePlaylistActiveState();
            this.updateNavigationButtons();
            
            // Show completion animation
            const completeButton = document.getElementById('mark-complete');
            if (completeButton) {
                completeButton.innerHTML = '<i class="fas fa-check"></i> Completed!';
                completeButton.classList.add('btn-success');
                completeButton.classList.remove('btn-primary');
                
                // Animate completion
                animationManager.scaleIn(completeButton, 0.3);
                
                // Reset button after animation
                setTimeout(() => {
                    completeButton.innerHTML = '<i class="fas fa-check"></i> Mark Complete';
                    completeButton.classList.remove('btn-success');
                    completeButton.classList.add('btn-primary');
                }, 2000);
            }
            
            // Check if all videos completed
            if (progressManager.isLearningComplete()) {
                setTimeout(() => {
                    this.showCompletionSummary();
                }, 2000);
            } else {
                // Show quiz option
                this.showQuizOption();
            }
            
        } catch (error) {
            console.error('Error marking video complete:', error);
        }
    }
    
    // Show quiz option
    showQuizOption() {
        const quizModal = document.createElement('div');
        quizModal.className = 'modal fade';
        quizModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content glass-card">
                    <div class="modal-header">
                        <h5 class="modal-title">Video Complete!</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Great job completing "${this.currentVideo.title}"!</p>
                        <p>Would you like to test your knowledge with a quick quiz?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Skip Quiz</button>
                        <button type="button" class="btn btn-primary" onclick="startQuiz()">Take Quiz</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(quizModal);
        
        // Show modal
        const modal = new bootstrap.Modal(quizModal);
        modal.show();
        
        // Clean up after modal closes
        quizModal.addEventListener('hidden.bs.modal', () => {
            quizModal.remove();
        });
    }
    
    // Generate chapter breakdown for current video
    async generateChapterBreakdown() {
        try {
            if (!this.currentVideo) return;
            
            const userProfile = userDataManager.getUserProfile();
            if (!userProfile) return;
            
            const chapterBreakdown = await groqAPI.generateChapterBreakdown(
                this.currentVideo.title,
                this.currentVideo.description,
                userProfile.skillLevel
            );
            
            this.displayChapterBreakdown(chapterBreakdown);
            
        } catch (error) {
            console.error('Error generating chapter breakdown:', error);
        }
    }
    
    // Display chapter breakdown
    displayChapterBreakdown(breakdown) {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        // Remove existing chapter breakdown
        const existingBreakdown = sidebar.querySelector('.chapter-breakdown');
        if (existingBreakdown) {
            existingBreakdown.remove();
        }
        
        // Create chapter breakdown element
        const breakdownElement = document.createElement('div');
        breakdownElement.className = 'chapter-breakdown';
        breakdownElement.innerHTML = `
            <h4>Chapter Breakdown</h4>
            <div class="chapters">
                ${breakdown.chapters.map(chapter => `
                    <div class="chapter-item">
                        <div class="chapter-time">${chapter.timestamp}</div>
                        <div class="chapter-title">${chapter.title}</div>
                        <div class="chapter-concepts">
                            ${chapter.concepts.map(concept => `<span class="concept-tag">${concept}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="key-takeaways">
                <h5>Key Takeaways</h5>
                <ul>
                    ${breakdown.keyTakeaways.map(takeaway => `<li>${takeaway}</li>`).join('')}
                </ul>
            </div>
        `;
        
        // Insert after learning progress
        const learningProgress = sidebar.querySelector('.learning-progress');
        if (learningProgress) {
            learningProgress.insertAdjacentElement('afterend', breakdownElement);
        } else {
            sidebar.appendChild(breakdownElement);
        }
        
        // Animate chapter breakdown
        animationManager.fadeIn(breakdownElement, 0.5);
    }
    
    // Update progress display
    updateProgressDisplay() {
        const progress = progressManager.getProgress();
        if (!progress) return;
        
        const stats = progressManager.getStatistics();
        
        // Update progress circle
        const progressCircle = document.getElementById('progress-circle');
        if (progressCircle) {
            const progressText = progressCircle.querySelector('.progress-text');
            if (progressText) {
                progressText.textContent = `${stats.overallProgress}%`;
            }
            
            // Animate circular progress
            animationManager.animateCircularProgress(progressCircle, stats.overallProgress);
        }
        
        // Update statistics
        const videosWatched = document.getElementById('videos-watched');
        const quizScore = document.getElementById('quiz-score');
        
        if (videosWatched) {
            animationManager.animateCounter(videosWatched, stats.completedVideos);
        }
        
        if (quizScore) {
            animationManager.animateCounter(quizScore, stats.averageQuizScore);
        }
    }
    
    // Update playlist active state
    updatePlaylistActiveState() {
        const playlistItems = document.querySelectorAll('.playlist-item');
        
        playlistItems.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentVideoIndex);
        });
    }
    
    // Update navigation buttons
    updateNavigationButtons() {
        const prevButton = document.getElementById('prev-video');
        const nextButton = document.getElementById('next-video');
        
        if (prevButton) {
            prevButton.disabled = this.currentVideoIndex === 0;
        }
        
        if (nextButton) {
            nextButton.disabled = this.currentVideoIndex === this.videos.length - 1;
        }
    }
    
    // Update chat context for AI assistant
    updateChatContext() {
        if (window.chatAssistantComponent && this.currentVideo) {
            window.chatAssistantComponent.updateContext(this.currentVideo.title, this.currentVideo.description);
        }
    }
    
    // Show completion summary
    async showCompletionSummary() {
        try {
            const userProfile = userDataManager.getUserProfile();
            const progress = progressManager.getProgress();
            
            if (!userProfile || !progress) return;
            
            // Generate revision notes
            const revisionNotes = await groqAPI.generateRevisionNotes(
                userProfile.learningGoal,
                userProfile.skillLevel,
                progress.videos
            );
            
            // Prepare summary data
            const summaryData = {
                userProfile,
                progress,
                revisionNotes,
                statistics: progressManager.getStatistics()
            };
            
            // Show summary section
            await pageTransitionManager.showSection('summary-section');
            
            // Initialize summary component
            if (window.revisionNotesComponent) {
                window.revisionNotesComponent.displaySummary(summaryData);
            }
            
        } catch (error) {
            console.error('Error showing completion summary:', error);
        }
    }
    
    // Get video embed URL with parameters
    getVideoEmbedUrl(videoId, options = {}) {
        const defaultOptions = {
            autoplay: 0,
            rel: 0,
            modestbranding: 1,
            showinfo: 0,
            controls: 1,
            fs: 1,
            cc_load_policy: 0,
            iv_load_policy: 3
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        const params = new URLSearchParams(finalOptions);
        
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }
    
    // Handle video events (if using YouTube API)
    handleVideoStateChange(event) {
        switch (event.data) {
            case YT.PlayerState.ENDED:
                this.onVideoEnded();
                break;
            case YT.PlayerState.PLAYING:
                this.onVideoPlaying();
                break;
            case YT.PlayerState.PAUSED:
                this.onVideoPaused();
                break;
        }
    }
    
    // Video ended event
    onVideoEnded() {
        console.log('Video ended');
        
        // Auto-mark as complete if not already
        const progress = progressManager.getProgress();
        const videoProgress = progress?.videos.find(v => v.videoId === this.currentVideo.videoId);
        
        if (!videoProgress?.completed) {
            this.markVideoComplete();
        }
    }
    
    // Video playing event
    onVideoPlaying() {
        console.log('Video playing');
        sessionManager.updateActivity();
    }
    
    // Video paused event
    onVideoPaused() {
        console.log('Video paused');
    }
    
    // Get current video time (if using YouTube API)
    getCurrentTime() {
        // This would work with YouTube Player API
        // return this.player.getCurrentTime();
        return 0;
    }
    
    // Seek to specific time (if using YouTube API)
    seekTo(seconds) {
        // This would work with YouTube Player API
        // this.player.seekTo(seconds);
    }
    
    // Add video note
    addVideoNote(note) {
        if (this.currentVideo) {
            progressManager.addVideoNote(this.currentVideo.videoId, note);
        }
    }
    
    // Export learning data
    exportLearningData() {
        const progress = progressManager.getProgress();
        const userProfile = userDataManager.getUserProfile();
        
        const exportData = {
            userProfile,
            progress,
            videos: this.videos,
            learningPlan: this.learningPlan,
            exportDate: new Date().toISOString()
        };
        
        // Create download link
        const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `aziona-learning-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Global function for starting quiz
function startQuiz() {
    if (window.quizGeneratorComponent) {
        window.quizGeneratorComponent.startQuiz();
    }
    
    // Close any open modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide();
        }
    });
}

// Export and initialize
window.videoPlayerComponent = new VideoPlayerComponent();
