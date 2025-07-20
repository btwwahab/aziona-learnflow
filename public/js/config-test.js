/**
 * Configuration Test and Validation
 * Tests API connections and validates configuration
 */

// Test configuration and API connectivity
class ConfigurationTest {
    constructor() {
        this.results = {
            config: false,
            youtube: false,
            groq: false,
            storage: false,
            animations: false
        };
    }

    async runAllTests() {
        console.log('🧪 Running configuration tests...');
        
        try {
            await this.testConfiguration();
            await this.testYouTubeAPI();
            await this.testGroqAPI();
            await this.testStorage();
            await this.testAnimations();
            
            this.displayResults();
            return this.results;
            
        } catch (error) {
            console.error('❌ Configuration test failed:', error);
            return this.results;
        }
    }

    async testConfiguration() {
        try {
            // Test if CONFIG is loaded
            if (typeof CONFIG === 'undefined') {
                throw new Error('CONFIG not found');
            }
            
            // Test required configuration keys
            const requiredKeys = [
                'api.youtube.apiKey',
                'api.groq.apiKey',
                'app.name',
                'themes'
            ];
            
            for (const key of requiredKeys) {
                if (!this.getNestedValue(CONFIG, key)) {
                    throw new Error(`Missing configuration: ${key}`);
                }
            }
            
            this.results.config = true;
            console.log('✅ Configuration test passed');
            
        } catch (error) {
            console.error('❌ Configuration test failed:', error.message);
            this.results.config = false;
        }
    }

    async testYouTubeAPI() {
        try {
            if (!CONFIG.api.youtube.apiKey || CONFIG.api.youtube.apiKey === 'your_youtube_api_key_here') {
                throw new Error('YouTube API key not configured');
            }
            
            // Test API connectivity
            const testUrl = `${CONFIG.api.youtube.baseUrl}/search?part=snippet&q=test&key=${CONFIG.api.youtube.apiKey}&maxResults=1`;
            
            const response = await fetch(testUrl);
            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.items || data.items.length === 0) {
                throw new Error('YouTube API returned no results');
            }
            
            this.results.youtube = true;
            console.log('✅ YouTube API test passed');
            
        } catch (error) {
            console.error('❌ YouTube API test failed:', error.message);
            this.results.youtube = false;
        }
    }

    async testGroqAPI() {
        try {
            if (!CONFIG.api.groq.apiKey || CONFIG.api.groq.apiKey === 'your_groq_api_key_here') {
                throw new Error('Groq API key not configured');
            }
            
            // Test API connectivity with a simple request
            const testPayload = {
                messages: [
                    { role: 'user', content: 'Hello, this is a test message.' }
                ],
                model: CONFIG.api.groq.model,
                max_tokens: 10
            };
            
            const response = await fetch(`${CONFIG.api.groq.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.api.groq.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testPayload)
            });
            
            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.choices || data.choices.length === 0) {
                throw new Error('Groq API returned no response');
            }
            
            this.results.groq = true;
            console.log('✅ Groq API test passed');
            
        } catch (error) {
            console.error('❌ Groq API test failed:', error.message);
            this.results.groq = false;
        }
    }

    async testStorage() {
        try {
            // Test localStorage availability
            if (typeof Storage === 'undefined') {
                throw new Error('localStorage not supported');
            }
            
            // Test write and read
            const testKey = 'aziona_test_key';
            const testValue = 'test_value_' + Date.now();
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            
            if (retrieved !== testValue) {
                throw new Error('localStorage write/read failed');
            }
            
            // Clean up
            localStorage.removeItem(testKey);
            
            this.results.storage = true;
            console.log('✅ Storage test passed');
            
        } catch (error) {
            console.error('❌ Storage test failed:', error.message);
            this.results.storage = false;
        }
    }

    async testAnimations() {
        try {
            // Test GSAP availability
            if (typeof gsap === 'undefined') {
                throw new Error('GSAP not loaded');
            }
            
            // Test CSS animations support
            const testElement = document.createElement('div');
            testElement.style.transition = 'opacity 0.3s ease';
            
            if (!testElement.style.transition) {
                throw new Error('CSS transitions not supported');
            }
            
            this.results.animations = true;
            console.log('✅ Animations test passed');
            
        } catch (error) {
            console.error('❌ Animations test failed:', error.message);
            this.results.animations = false;
        }
    }

    displayResults() {
        console.log('\n🔍 Configuration Test Results:');
        console.log('================================');
        
        const tests = [
            { name: 'Configuration', key: 'config' },
            { name: 'YouTube API', key: 'youtube' },
            { name: 'Groq API', key: 'groq' },
            { name: 'Storage', key: 'storage' },
            { name: 'Animations', key: 'animations' }
        ];
        
        tests.forEach(test => {
            const status = this.results[test.key] ? '✅ PASS' : '❌ FAIL';
            console.log(`${test.name}: ${status}`);
        });
        
        const passedCount = Object.values(this.results).filter(Boolean).length;
        const totalCount = Object.keys(this.results).length;
        
        console.log(`\nOverall: ${passedCount}/${totalCount} tests passed`);
        
        if (passedCount === totalCount) {
            console.log('🎉 All tests passed! The app is ready to use.');
        } else {
            console.log('⚠️  Some tests failed. Check the configuration and try again.');
        }
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }
}

// Auto-run tests when script is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only run tests if in development mode or explicitly requested
    if (window.location.hostname === 'localhost' || window.location.search.includes('test=true')) {
        const configTest = new ConfigurationTest();
        
        // Add a small delay to ensure all dependencies are loaded
        setTimeout(() => {
            configTest.runAllTests();
        }, 1000);
    }
});

// Export for manual testing
window.ConfigurationTest = ConfigurationTest;
