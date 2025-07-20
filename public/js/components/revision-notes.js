/**
 * Revision Notes Component
 * Handles personalized revision notes and summary generation
 */
class RevisionNotesComponent {
    constructor() {
        this.groqAPI = new GroqAPI();
        this.storageManager = new StorageManager();
        this.animationManager = new AnimationManager();
        this.currentNotes = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupDownloadHandlers();
    }

    bindEvents() {
        // Download buttons
        const downloadPDF = document.getElementById('downloadPDF');
        const downloadTXT = document.getElementById('downloadTXT');
        const downloadJSON = document.getElementById('downloadJSON');
        const shareNotes = document.getElementById('shareNotes');

        if (downloadPDF) downloadPDF.addEventListener('click', () => this.downloadPDF());
        if (downloadTXT) downloadTXT.addEventListener('click', () => this.downloadTXT());
        if (downloadJSON) downloadJSON.addEventListener('click', () => this.downloadJSON());
        if (shareNotes) shareNotes.addEventListener('click', () => this.shareNotes());
    }

    setupDownloadHandlers() {
        // Setup download functionality
        console.log('Download handlers setup');
    }

    async generateRevisionNotes(userProfile, videoProgress) {
        try {
            const prompt = `Generate comprehensive revision notes for a ${userProfile.skillLevel} level learner studying ${userProfile.learningGoal}. 
            Based on the following video progress: ${JSON.stringify(videoProgress)}
            
            Please provide:
            1. Key concepts learned
            2. Summary of each video
            3. Important points to remember
            4. Recommended next steps
            5. Additional resources for further learning
            
            Format the response as a well-structured learning summary.`;

            const response = await this.groqAPI.generateResponse(prompt);
            this.currentNotes = response;
            return response;
        } catch (error) {
            console.error('Error generating revision notes:', error);
            return null;
        }
    }

    displaySummary(summaryData) {
        const summaryContent = document.getElementById('summary-content');
        if (!summaryContent) return;

        const { userProfile, progress, revisionNotes, statistics } = summaryData;

        summaryContent.innerHTML = `
            <div class="summary-stats">
                <div class="stat-card glass-card">
                    <h4>Videos Completed</h4>
                    <div class="stat-value">${progress.completed || 0}</div>
                </div>
                <div class="stat-card glass-card">
                    <h4>Quiz Average</h4>
                    <div class="stat-value">${statistics?.averageScore || 0}%</div>
                </div>
                <div class="stat-card glass-card">
                    <h4>Time Spent</h4>
                    <div class="stat-value">${statistics?.timeSpent || '0h 0m'}</div>
                </div>
            </div>
            <div class="revision-notes">
                <h4>Your Personalized Learning Summary</h4>
                <div class="notes-content">
                    ${revisionNotes || 'No revision notes available.'}
                </div>
            </div>
        `;
    }

    downloadPDF() {
        if (!this.currentNotes) return;
        
        // Create PDF content
        const pdfContent = `
            Aziona LearnFlow - Learning Summary
            ==================================
            
            ${this.currentNotes}
            
            Generated on: ${new Date().toLocaleDateString()}
        `;
        
        this.downloadFile(pdfContent, 'learning-summary.txt', 'text/plain');
    }

    downloadTXT() {
        if (!this.currentNotes) return;
        this.downloadFile(this.currentNotes, 'learning-summary.txt', 'text/plain');
    }

    downloadJSON() {
        if (!this.currentNotes) return;
        const jsonData = {
            notes: this.currentNotes,
            generatedAt: new Date().toISOString(),
            version: '1.0'
        };
        this.downloadFile(JSON.stringify(jsonData, null, 2), 'learning-summary.json', 'application/json');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    shareNotes() {
        if (!this.currentNotes) return;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Learning Summary',
                text: this.currentNotes,
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(this.currentNotes).then(() => {
                alert('Notes copied to clipboard!');
            });
        }
    }
}

// Initialize component
window.revisionNotesComponent = new RevisionNotesComponent();