// Storage utility functions for managing local storage
class StorageManager {
    constructor() {
        this.isAvailable = this.checkStorageAvailability();
    }
    
    // Check if localStorage is available
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage is not available');
            return false;
        }
    }
    
    // Save data to localStorage
    set(key, value) {
        if (!this.isAvailable) {
            console.warn('Storage not available');
            return false;
        }
        
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }
    
    // Get data from localStorage
    get(key, defaultValue = null) {
        if (!this.isAvailable) {
            return defaultValue;
        }
        
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }
    
    // Remove item from localStorage
    remove(key) {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }
    
    // Clear all items from localStorage
    clear() {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
    
    // Get all keys
    getAllKeys() {
        if (!this.isAvailable) {
            return [];
        }
        
        try {
            return Object.keys(localStorage);
        } catch (error) {
            console.error('Error getting localStorage keys:', error);
            return [];
        }
    }
    
    // Get storage size in bytes
    getStorageSize() {
        if (!this.isAvailable) {
            return 0;
        }
        
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return total;
        } catch (error) {
            console.error('Error calculating storage size:', error);
            return 0;
        }
    }
}

// Learning progress management
class ProgressManager {
    constructor() {
        this.storage = new StorageManager();
        this.progressKey = CONFIG.STORAGE_KEYS.LEARNING_PROGRESS;
    }
    
    // Initialize progress for a new session
    initializeProgress(videos) {
        const progress = {
            sessionId: this.generateSessionId(),
            startTime: new Date().toISOString(),
            videos: videos.map(video => ({
                videoId: video.videoId,
                title: video.title,
                completed: false,
                watchTime: 0,
                quizCompleted: false,
                quizScore: 0,
                notes: []
            })),
            overallProgress: 0,
            lastUpdated: new Date().toISOString()
        };
        
        this.storage.set(this.progressKey, progress);
        return progress;
    }
    
    // Get current progress
    getProgress() {
        return this.storage.get(this.progressKey);
    }
    
    // Update video completion status
markVideoCompleted(videoId, viewTime = 0) {
    const progress = this.getProgress();
    if (!progress) return false;
    
    const videoIndex = progress.videos.findIndex(v => v.videoId === videoId);
    if (videoIndex === -1) return false;
    
    progress.videos[videoIndex].completed = true;
    progress.videos[videoIndex].watchTime = Date.now();
    progress.videos[videoIndex].viewTime = viewTime; // ADD THIS LINE
    
    // Update overall progress
    const completedVideos = progress.videos.filter(v => v.completed).length;
    progress.overallProgress = Math.round((completedVideos / progress.videos.length) * 100);
    progress.lastUpdated = new Date().toISOString();
    
    this.storage.set(this.progressKey, progress);
    return true;
}
    
    // Update quiz score
    updateQuizScore(videoId, score) {
        const progress = this.getProgress();
        if (!progress) return false;
        
        const videoIndex = progress.videos.findIndex(v => v.videoId === videoId);
        if (videoIndex === -1) return false;
        
        progress.videos[videoIndex].quizCompleted = true;
        progress.videos[videoIndex].quizScore = score;
        progress.lastUpdated = new Date().toISOString();
        
        this.storage.set(this.progressKey, progress);
        return true;
    }
    
    // Add note to video
    addVideoNote(videoId, note) {
        const progress = this.getProgress();
        if (!progress) return false;
        
        const videoIndex = progress.videos.findIndex(v => v.videoId === videoId);
        if (videoIndex === -1) return false;
        
        progress.videos[videoIndex].notes.push({
            id: Date.now(),
            text: note,
            timestamp: new Date().toISOString()
        });
        progress.lastUpdated = new Date().toISOString();
        
        this.storage.set(this.progressKey, progress);
        return true;
    }
    
    // Get next video to watch
    getNextVideo() {
        const progress = this.getProgress();
        if (!progress) return null;
        
        const nextVideo = progress.videos.find(v => !v.completed);
        return nextVideo || null;
    }
    
    // Check if all videos are completed
    isLearningComplete() {
        const progress = this.getProgress();
        if (!progress) return false;
        
        return progress.videos.every(v => v.completed);
    }
    
    // Get learning statistics
    getStatistics() {
        const progress = this.getProgress();
        if (!progress) return null;
        
        const completedVideos = progress.videos.filter(v => v.completed).length;
        const completedQuizzes = progress.videos.filter(v => v.quizCompleted).length;
        const averageQuizScore = completedQuizzes > 0 
            ? Math.round(progress.videos.reduce((sum, v) => sum + v.quizScore, 0) / completedQuizzes)
            : 0;
        
        return {
            totalVideos: progress.videos.length,
            completedVideos,
            completedQuizzes,
            averageQuizScore,
            overallProgress: progress.overallProgress,
            timeSpent: this.calculateTimeSpent(progress.startTime)
        };
    }
    
    // Calculate time spent learning
    calculateTimeSpent(startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const diffInMs = now - start;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
            hours: diffInHours,
            minutes: diffInMinutes,
            formatted: `${diffInHours}h ${diffInMinutes}m`
        };
    }
    
    // Generate unique session ID
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Clear progress
    clearProgress() {
        return this.storage.remove(this.progressKey);
    }
}

// Export instances - MAKE SURE THESE ARE AT THE END
const storage = new StorageManager();
const progressManager = new ProgressManager();