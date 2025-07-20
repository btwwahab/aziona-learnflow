// YouTube Data API v3 integration
class YouTubeAPI {
    constructor() {
        this.apiKey = CONFIG.YOUTUBE_API_KEY;
        this.baseURL = CONFIG.YOUTUBE_API_URL;
        this.detailsURL = CONFIG.YOUTUBE_DETAILS_URL;
    }
    
    // Search for videos based on learning goal and skill level
    async searchVideos(learningGoal, maxResults = CONFIG.MAX_VIDEOS) {
        try  {
        const searchQuery = this.buildSearchQuery(learningGoal);

        // Call your Vercel serverless function instead of YouTube API directly
        const params = new URLSearchParams({
            q: searchQuery,
            maxResults: maxResults
        });

        const response = await fetch(`/api/you-tube-client?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            return [];
        }

        const processedVideos = this.processVideoData(data.items);
        const videoIds = processedVideos.map(video => video.videoId);

        // Optionally, you can also proxy getVideoDetails through a serverless function
        const detailedVideos = await this.getVideoDetails(videoIds);

        return detailedVideos;
            
        } catch (error) {
            console.error('Error searching YouTube videos:', error);
            throw new Error(CONFIG.ERROR_MESSAGES.YOUTUBE_API_ERROR);
        }
    }

    // Build search query based on learning goal
    buildSearchQuery(learningGoal) {
        const goalConfig = CONFIG.LEARNING_GOALS[learningGoal];
        if (goalConfig && goalConfig.keywords) {
            return goalConfig.keywords.join(' ') + ' tutorial';
        }
        return learningGoal + ' tutorial';
    }
    
    // Get video details
async getVideoDetails(videoIds) {
    try {
        const params = new URLSearchParams({
            ids: videoIds.join(',')
        });
        const response = await fetch(`/api/youtube-details?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
        }
        const data = await response.json();
        return this.processVideoDetails(data.items);
    } catch (error) {
        console.error('Error getting video details:', error);
        return [];
    }
}

    // Get video captions/transcripts
    async getVideoTranscript(videoId) {
        // Note: YouTube API doesn't provide direct transcript access
        // This would require additional implementation
        return null;
    }

    // Process video data (same as before)
    processVideoData(items) {
        return items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt
        }));
    }
    
    // Process video details (same as before)
    processVideoDetails(items) {
        return items.map(item => ({
            videoId: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            duration: this.parseDuration(item.contentDetails.duration),
            viewCount: parseInt(item.statistics.viewCount),
            likeCount: parseInt(item.statistics.likeCount || 0),
            commentCount: parseInt(item.statistics.commentCount || 0)
        }));
    }
    
    // Parse duration (same as before)
    parseDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = (match[1] || '').replace('H', '') || '0';
        const minutes = (match[2] || '').replace('M', '') || '0';
        const seconds = (match[3] || '').replace('S', '') || '0';
        
        return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
    }

    // Format duration in human-readable format
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Get channel information
    async getChannelInfo(channelId) {
    try {
        const params = new URLSearchParams({
            ids: channelId
        });
        const response = await fetch(`/api/youtube-channels?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const channel = data.items[0];
            return {
                channelId: channel.id,
                title: channel.snippet.title,
                description: channel.snippet.description,
                thumbnail: channel.snippet.thumbnails.default?.url,
                subscriberCount: parseInt(channel.statistics.subscriberCount || 0),
                viewCount: parseInt(channel.statistics.viewCount || 0),
                videoCount: parseInt(channel.statistics.videoCount || 0),
                publishedAt: channel.snippet.publishedAt
            };
        }

        return null;

    } catch (error) {
        console.error('Error getting channel info:', error);
        return null;
    }
}

async searchEducationalChannels(topic, maxResults = 10) {
        try {
            const params = {
                part: 'snippet',
                type: 'channel',
                q: `${topic} education tutorial`,
                maxResults,
                key: this.apiKey
            };

            const url = `${this.baseURL}?${new URLSearchParams(params)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status}`);
            }

            const data = await response.json();

            return data.items.map(item => ({
                channelId: item.id.channelId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.default?.url,
                publishedAt: item.snippet.publishedAt
            }));

        } catch (error) {
            console.error('Error searching educational channels:', error);
            return [];
        }
    }

    // Get video comments (for engagement analysis)
    async getVideoComments(videoId, maxResults = 20) {
    try {
        const params = new URLSearchParams({
            videoId,
            maxResults
        });
        const response = await fetch(`/api/youtube-comments?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
        }

        const data = await response.json();

        return data.items.map(item => ({
            commentId: item.id,
            text: item.snippet.topLevelComment.snippet.textDisplay,
            authorDisplayName: item.snippet.topLevelComment.snippet.authorDisplayName,
            likeCount: item.snippet.topLevelComment.snippet.likeCount,
            publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
            updatedAt: item.snippet.topLevelComment.snippet.updatedAt
        }));

    } catch (error) {
        console.error('Error getting video comments:', error);
        return [];
    }
}

    // Analyze video quality based on various metrics
    analyzeVideoQuality(videoData) {
        const quality = {
            score: 0,
            factors: {}
        };

        // View count factor (normalized)
        const viewScore = Math.min(videoData.viewCount / 100000, 1) * 20;
        quality.factors.views = viewScore;

        // Like ratio factor
        const likeRatio = videoData.likeCount / (videoData.viewCount || 1);
        const likeScore = Math.min(likeRatio * 1000, 1) * 20;
        quality.factors.engagement = likeScore;

        // Duration factor (prefer 10-30 minute videos)
        const durationScore = videoData.duration >= 600 && videoData.duration <= 1800 ? 20 : 10;
        quality.factors.duration = durationScore;

        // Title quality (contains educational keywords)
        const educationalKeywords = ['tutorial', 'guide', 'learn', 'course', 'lesson', 'explained', 'how to'];
        const titleScore = educationalKeywords.some(keyword =>
            videoData.title.toLowerCase().includes(keyword)
        ) ? 20 : 10;
        quality.factors.title = titleScore;

        // Description quality
        const descriptionScore = videoData.description.length > 200 ? 20 : 10;
        quality.factors.description = descriptionScore;

        // Calculate overall score
        quality.score = Object.values(quality.factors).reduce((sum, score) => sum + score, 0);

        return quality;
    }

    // Check API quota usage (approximation)
    estimateQuotaUsage(searchQueries = 0, videoDetailRequests = 0, commentRequests = 0) {
        // Rough quota costs based on YouTube API documentation
        const searchCost = searchQueries * 100;
        const videoDetailsCost = videoDetailRequests * 1;
        const commentsCost = commentRequests * 1;

        return {
            total: searchCost + videoDetailsCost + commentsCost,
            breakdown: {
                search: searchCost,
                videoDetails: videoDetailsCost,
                comments: commentsCost
            }
        };
    }
}

// Export instance
const youtubeAPI = new YouTubeAPI();
window.youtubeAPI = youtubeAPI;
