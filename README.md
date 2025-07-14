# Aziona LearnFlow

A futuristic, AI-powered learning platform that creates personalized video-based learning experiences using YouTube content and advanced AI analysis.

## Features

- **Animated Onboarding**: Glassmorphism forms with GSAP animations
- **AI-Powered Video Selection**: Uses Groq API (LLaMA 3) to select optimal learning videos
- **Interactive Video Player**: Custom player with AI-generated chapter breakdowns
- **Smart Quiz Generation**: AI-generated quizzes with animated feedback
- **Chat Assistant**: Real-time AI tutor powered by Groq
- **Personalized Revision Notes**: AI-generated summary and learning recommendations
- **Multiple Themes**: Dark, Light, and Nebula themes with glassmorphism effects
- **Fully Responsive**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Bootstrap 5.3, Custom CSS with Glassmorphism
- **Animations**: GSAP (GreenSock Animation Platform)
- **APIs**: YouTube Data API v3, Groq API (LLaMA 3)
- **Storage**: LocalStorage for offline capability
- **Icons**: Font Awesome 6

## Setup Instructions

### 1. Get API Keys

#### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Restrict the API key to YouTube Data API v3

#### Groq API (LLaMA 3)
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for an account
3. Generate an API key
4. Note the API key for configuration

### 2. Configure Environment

1. Copy `.env.example` to `.env`
2. Fill in your API keys:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```

### 3. Update Configuration

Edit `js/config.js` and update the API keys:

```javascript
// API Configuration
api: {
    youtube: {
        apiKey: 'YOUR_YOUTUBE_API_KEY',
        // ... other config
    },
    groq: {
        apiKey: 'YOUR_GROQ_API_KEY',
        // ... other config
    }
}
```

### 4. Serve the Application

Since this is a client-side application, you need to serve it over HTTP(S) to avoid CORS issues:

#### Option 1: Using Python (if installed)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Option 2: Using Node.js (if installed)
```bash
npx http-server -p 8000
```

#### Option 3: Using VS Code Live Server Extension
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

### 5. Access the Application

Open your browser and navigate to:
- `http://localhost:8000` (or your chosen port)

## Project Structure

```
aziona-learntube/
├── index.html                 # Main HTML file
├── .env.example              # Environment configuration template
├── README.md                 # This file
├── css/
│   ├── styles.css           # Main styles
│   ├── glassmorphism.css    # Glassmorphism effects
│   ├── animations.css       # Animation styles
│   └── themes/
│       ├── dark.css         # Dark theme
│       ├── light.css        # Light theme
│       └── nebula.css       # Nebula theme
├── js/
│   ├── app.js               # Main application orchestration
│   ├── config.js            # Configuration settings
│   ├── api/
│   │   ├── youtube.js       # YouTube API integration
│   │   └── groq.js          # Groq API integration
│   ├── components/
│   │   ├── onboarding.js    # Onboarding form logic
│   │   ├── video-player.js  # Video player component
│   │   ├── chat-assistant.js # AI chat assistant
│   │   ├── quiz-generator.js # Quiz generation and handling
│   │   └── revision-notes.js # Revision notes component
│   └── utils/
│       ├── storage.js       # Local storage management
│       └── animations.js    # Animation utilities
└── assets/
    ├── images/             # Image assets
    ├── fonts/              # Custom fonts
    └── icons/              # Custom icons
```

## Usage Guide

### 1. Onboarding
- Enter your name and learning goal
- Select your skill level (Beginner, Intermediate, Advanced)
- The AI will create a personalized learning plan

### 2. Video Learning
- Watch AI-selected videos with generated chapter breakdowns
- Use the chat assistant for questions and clarifications
- Track your progress through the learning dashboard

### 3. Interactive Quizzes
- Take AI-generated quizzes after each video
- Receive instant feedback and explanations
- Track your performance and improvement areas

### 4. Revision & Summary
- Access personalized revision notes
- Download your learning summary in multiple formats
- Get AI-powered recommendations for next steps

## Customization

### Themes
The application supports three themes:
- **Dark**: High contrast with neon accents
- **Light**: Clean and minimalist design
- **Nebula**: Cosmic theme with particle effects

### Configuration
Edit `js/config.js` to customize:
- API endpoints and keys
- UI settings and animations
- Learning parameters
- Theme configurations

## API Rate Limits

### YouTube Data API v3
- 10,000 units per day (free tier)
- Search requests cost 100 units each
- Video details cost 1 unit each

### Groq API
- Check current rate limits on [Groq Console](https://console.groq.com/)
- Implement appropriate rate limiting in production

## Security Notes

### API Key Management
- Never commit API keys to version control
- Use environment variables in production
- Consider using a backend proxy for API calls in production
- Implement proper CORS policies

### Content Security
- Sanitize all user inputs
- Validate API responses
- Implement proper error handling

## Performance Optimization

### Recommended Optimizations
1. **Lazy Loading**: Load components only when needed
2. **Caching**: Cache API responses and user data
3. **Compression**: Minify CSS/JS files
4. **CDN**: Use CDN for external libraries
5. **Progressive Loading**: Show content progressively

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Common Issues

#### API Keys Not Working
1. Verify API keys are correctly configured
2. Check API key restrictions and quotas
3. Ensure APIs are enabled in respective consoles

#### CORS Errors
1. Serve the application over HTTP(S)
2. Don't open `index.html` directly in browser
3. Use a local server (Python, Node.js, etc.)

#### Videos Not Loading
1. Check YouTube API quotas
2. Verify video IDs are valid
3. Check network connectivity

#### Animations Not Working
1. Ensure GSAP is loaded correctly
2. Check browser console for JavaScript errors
3. Verify CSS animations are supported

### Performance Issues
1. Clear browser cache and local storage
2. Check network connection
3. Monitor browser console for errors
4. Reduce animation complexity if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the browser console for error messages

## Future Enhancements

- Offline mode with service workers
- Advanced analytics and progress tracking
- Social features and collaboration tools
- Integration with more learning platforms
- Advanced AI tutoring capabilities
- Multi-language support
- Accessibility improvements

## Credits

- **Design**: Custom glassmorphism design
- **Animations**: GSAP (GreenSock Animation Platform)
- **Icons**: Font Awesome
- **AI**: Groq API (LLaMA 3)
- **Video Content**: YouTube Data API v3
- **Styling**: Bootstrap 5.3

---

Built with ❤️ for the future of learning
