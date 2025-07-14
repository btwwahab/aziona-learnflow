// YouTube Data API v3 integration
class YouTubeAPI {
    constructor() {
        this.apiUrl = CONFIG.YOUTUBE_API_URL; // '/api/youtube'
        this.detailsUrl = CONFIG.YOUTUBE_DETAILS_URL; // '/api/youtube-details'
        this.defaultParams = CONFIG.YOUTUBE_SEARCH_PARAMS;
    }
    
    // Search for videos based on learning goal and skill level
    async searchVideos(learningGoal, maxResults = CONFIG.MAX_VIDEOS) {
        try {
            const searchQuery = this.buildSearchQuery(learningGoal);
            
            const url = new URL(this.apiUrl, window.location.origin);
            url.searchParams.append('q', searchQuery);
            url.searchParams.append('maxResults', maxResults);
            url.searchParams.append('part', 'snippet');
            url.searchParams.append('type', 'video');
            url.searchParams.append('videoDuration', 'medium');
            url.searchParams.append('videoDefinition', 'high');
            url.searchParams.append('order', 'relevance');
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                return [];
            }
            
            const processedVideos = this.processVideoData(data.items);
            const videoIds = processedVideos.map(video => video.videoId);
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
        
        if (!goalConfig) {
            return `${learningGoal} tutorial beginner`;
        }
        
        const keywords = goalConfig.keywords.join(' ');
        return `${keywords} tutorial`;
    }
    
    // Get video details
    async getVideoDetails(videoIds) {
        try {
            if (!videoIds || videoIds.length === 0) {
                return [];
            }
            
            const url = new URL(this.detailsUrl, window.location.origin);
            url.searchParams.append('ids', videoIds.join(','));
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                return [];
            }
            
            return this.processVideoDetails(data.items);
            
        } catch (error) {
            console.error('Error getting video details:', error);
            return [];
        }
    }

    // Get video captions/transcripts
    async getVideoTranscript(videoId) {
        try {
            // Note: YouTube API doesn't provide direct access to captions for third-party apps
            // This is a placeholder for future implementation or alternative solutions
            console.warn('Video transcript feature requires additional setup');
            return null;
        } catch (error) {
            console.error('Error getting video transcript:', error);
            return null;
        }
    }

    // Process raw video data from API
// Process video data (same as before)
    processVideoData(items) {
        return items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: {
                default: item.snippet.thumbnails.default?.url,
                medium: item.snippet.thumbnails.medium?.url,
                high: item.snippet.thumbnails.high?.url,
                maxres: item.snippet.thumbnails.maxres?.url
            },
            channelTitle: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
        }));
    }
    
    // Process video details (same as before)
    processVideoDetails(items) {
        return items.map(item => ({
            videoId: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            duration: this.parseDuration(item.contentDetails.duration),
            viewCount: parseInt(item.statistics.viewCount || 0),
            likeCount: parseInt(item.statistics.likeCount || 0),
            commentCount: parseInt(item.statistics.commentCount || 0),
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            thumbnail: {
                default: item.snippet.thumbnails.default?.url,
                medium: item.snippet.thumbnails.medium?.url,
                high: item.snippet.thumbnails.high?.url,
                maxres: item.snippet.thumbnails.maxres?.url
            },
            tags: item.snippet.tags || [],
            categoryId: item.snippet.categoryId,
            url: `https://www.youtube.com/watch?v=${item.id}`,
            embedUrl: `https://www.youtube.com/embed/${item.id}`
        }));
    }
    
    // Parse duration (same as before)
    parseDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return 0;
        
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;
        
        return hours * 3600 + minutes * 60 + seconds;
    }

    // Format duration in human-readable format
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }

    // Get channel information
    async getChannelInfo(channelId) {
        try {
            const params = {
                part: 'snippet,statistics',
                id: channelId,
                key: this.apiKey
            };

            const url = `${this.baseURL}/channels?${new URLSearchParams(params)}`;
            const response = await fetch(url);

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

    // Search for educational channels
    async searchEducationalChannels(topic, maxResults = 10) {
        try {
            const params = {
                part: 'snippet',
                type: 'channel',
                q: `${topic} education tutorial`,
                maxResults,
                key: this.apiKey
            };

            const url = `${this.baseURL}/search?${new URLSearchParams(params)}`;
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
            const params = {
                part: 'snippet',
                videoId,
                maxResults,
                order: 'relevance',
                key: this.apiKey
            };

            const url = `${this.baseURL}/commentThreads?${new URLSearchParams(params)}`;
            const response = await fetch(url);

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
