// Onboarding component for user registration and preferences
class OnboardingComponent {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {};
        this.initializeEventListeners();
    }
    
    // Initialize event listeners
    initializeEventListeners() {
        // Form submission
        const form = document.getElementById('onboarding-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        // // Theme toggle
        // document.querySelectorAll('.theme-btn').forEach(btn => {
        //     btn.addEventListener('click', (e) => this.handleThemeChange(e));
        // });
        
        // Input validation
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('input', (e) => this.validateInput(e.target));
        });
        
        // Radio button changes
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleRadioChange(e));
        });
    }
    
    // Handle form submission
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.validateCurrentStep()) {
            this.collectFormData();
            await this.saveUserData();
            await this.startLearningJourney();
        }
    }
    
    // Move to next step
    async nextStep() {
        if (this.validateCurrentStep()) {
            this.collectFormData();
            
            if (this.currentStep < this.totalSteps) {
                await this.animateStepTransition(this.currentStep, this.currentStep + 1);
                this.currentStep++;
                this.updateStepIndicators();
            }
        } else {
            this.showValidationErrors();
        }
    }
    
    // Move to previous step
    async prevStep() {
        if (this.currentStep > 1) {
            await this.animateStepTransition(this.currentStep, this.currentStep - 1);
            this.currentStep--;
            this.updateStepIndicators();
        }
    }
    
validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
    if (!currentStepElement) return false;
    
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        // Only validate visible fields
        if (field.offsetParent !== null) {
            if (!this.validateInput(field)) {
                isValid = false;
            }
        }
    });
    
    return isValid;
}

// Update the validateInput method to handle radio buttons better:
validateInput(input) {
    const value = input.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Remove previous error styling
    input.classList.remove('is-invalid');
    
    // Skip validation for hidden inputs
    if (input.offsetParent === null) {
        return true;
    }
    
    // Check if required field is empty
    if (input.required && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Specific validation rules
    switch (input.type) {
        case 'text':
            if (input.name === 'userName' && value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters long';
            }
            break;
        case 'radio':
            // Check if any radio in the group is selected
            const radioGroup = document.querySelectorAll(`input[name="${input.name}"]`);
            const isChecked = Array.from(radioGroup).some(radio => radio.checked);
            if (input.required && !isChecked) {
                isValid = false;
                errorMessage = 'Please select an option';
                
                // Apply validation to the radio group container instead
                const radioContainer = input.closest('.skill-options, .learning-goals');
                if (radioContainer) {
                    radioContainer.classList.add('is-invalid');
                    this.showGroupError(radioContainer, errorMessage);
                    return false;
                }
            }
            break;
    }
    
    // Show error state
    if (!isValid) {
        input.classList.add('is-invalid');
        this.showInputError(input, errorMessage);
    } else {
        this.clearInputError(input);
    }
    
    return isValid;
}

// Add method to show group errors for radio buttons:
showGroupError(container, message) {
    // Remove existing error message
    this.clearGroupError(container);
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback d-block';
    errorElement.style.cssText = `
        display: block !important;
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    `;
    errorElement.textContent = message;
    
    // Append to container
    container.appendChild(errorElement);
}

// Add method to clear group errors:
clearGroupError(container) {
    const errorElement = container.querySelector('.invalid-feedback');
    if (errorElement) {
        errorElement.remove();
    }
    container.classList.remove('is-invalid');
}
    
    // Show input error
showInputError(input, message) {
    // Remove existing error message
    this.clearInputError(input);
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback';
    errorElement.textContent = message;
    
    // Insert after input
    input.parentNode.insertBefore(errorElement, input.nextSibling);
    
    // Animate error if animation manager exists
    if (typeof animationManager !== 'undefined' && animationManager.shakeAnimation) {
        animationManager.shakeAnimation(input, 5, 0.3);
    }
}
    
    // Clear input error
    clearInputError(input) {
        const errorElement = input.parentNode.querySelector('.invalid-feedback');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    // Show validation errors
    showValidationErrors() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const invalidFields = currentStepElement.querySelectorAll('.is-invalid');
        
        if (invalidFields.length > 0) {
            invalidFields[0].focus();
        }
    }
    
    // Handle radio button changes
handleRadioChange(e) {
    const radioGroup = document.querySelectorAll(`input[name="${e.target.name}"]`);
    
    // Update visual state
    radioGroup.forEach(radio => {
        const label = radio.nextElementSibling;
        if (label) {
            label.classList.toggle('selected', radio.checked);
        }
    });
    
    // Animate selection
    if (e.target.checked && typeof animationManager !== 'undefined') {
        animationManager.scaleIn(e.target.nextElementSibling, 0.2);
    }
}
    
    // Animate step transition
async animateStepTransition(currentStep, nextStep) {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const nextStepElement = document.querySelector(`.form-step[data-step="${nextStep}"]`);
    
    if (currentStepElement && nextStepElement) {
        const direction = nextStep > currentStep ? 'forward' : 'backward';
        
        // Simple animation if no animation manager
        if (typeof animationManager === 'undefined') {
            currentStepElement.style.display = 'none';
            nextStepElement.style.display = 'block';
        } else {
            // Use animation manager if available
            if (direction === 'forward') {
                animationManager.slideOut(currentStepElement, 'left', 0.3);
                setTimeout(() => {
                    currentStepElement.style.display = 'none';
                    nextStepElement.style.display = 'block';
                    animationManager.slideIn(nextStepElement, 'right', 0.3);
                }, 300);
            } else {
                animationManager.slideOut(currentStepElement, 'right', 0.3);
                setTimeout(() => {
                    currentStepElement.style.display = 'none';
                    nextStepElement.style.display = 'block';
                    animationManager.slideIn(nextStepElement, 'left', 0.3);
                }, 300);
            }
        }
    }
}
    
    // Update step indicators
    updateStepIndicators() {
        document.querySelectorAll('.form-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
        });
    }
    
    // Collect form data
    collectFormData() {
        const form = document.getElementById('onboarding-form');
        const formData = new FormData(form);
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            this.formData[key] = value;
        }
    }
    
    // Save user data
async saveUserData() {
    try {
        const userData = {
            name: this.formData.userName,
            skillLevel: this.formData.skillLevel,
            learningGoal: this.formData.learningGoal,
            onboardingCompleted: true,
            createdAt: new Date().toISOString()
        };
        
        // Save to local storage using existing storage manager
        const success = storage.set(CONFIG.STORAGE_KEYS.USER_PROFILE, userData);
        
        if (success) {
            console.log('User data saved successfully');
            return true;
        } else {
            throw new Error('Failed to save user data');
        }
        
    } catch (error) {
        console.error('Error saving user data:', error);
        this.showError('Failed to save your information. Please try again.');
        return false;
    }
}
    
    // Start learning journey
async startLearningJourney() {
    try {
        // Show loading section
        if (window.pageTransitionManager) {
            await window.pageTransitionManager.showSection('loading-section');
        } else if (window.azionaApp) {
            window.azionaApp.showSection('loading-section');
        }
        
        // Initialize learning session
        await this.initializeLearningSession();
        
    } catch (error) {
        console.error('Error starting learning journey:', error);
        this.showError('Failed to start your learning journey. Please try again.');
    }
}
    
// Update the method call in initializeLearningSession
async initializeLearningSession() {
    try {
        // Update loading text
        this.updateLoadingText('Searching for the best educational content...');
        this.updateProgress(20);
        
        // Search for videos - Fixed method call
        const videos = await youtubeAPI.searchVideos(
            this.formData.learningGoal,
            CONFIG.MAX_VIDEOS
        );
        
        this.updateLoadingText('AI is analyzing and selecting the best videos...');
        this.updateProgress(50);
        
        // Get AI recommendations
        const aiRecommendations = await groqAPI.selectBestVideos(
            videos,
            this.formData.learningGoal,
            this.formData.skillLevel,
            CONFIG.SELECTED_VIDEOS
        );
        
        this.updateLoadingText('Creating your personalized learning plan...');
        this.updateProgress(80);
        
        // Initialize progress tracking
        const selectedVideos = aiRecommendations.selectedVideos.map(selected => {
            const originalVideo = videos.find(v => v.videoId === selected.videoId);
            return {
                ...originalVideo,
                ...selected
            };
        });
        
        progressManager.initializeProgress(selectedVideos);
        
        // Save session data - using storage instead of sessionManager
        storage.set('current-session', {
            learningGoal: this.formData.learningGoal,
            skillLevel: this.formData.skillLevel,
            selectedVideos: selectedVideos,
            learningPlan: aiRecommendations.learningPlan,
            startTime: new Date().toISOString()
        });
        
        this.updateLoadingText('Your learning journey is ready!');
        this.updateProgress(100);
        
        // Wait a moment then transition to dashboard
        setTimeout(async () => {
            if (window.azionaApp) {
                window.azionaApp.showSection('dashboard-section');
                window.azionaApp.loadLearningDashboard();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error initializing learning session:', error);
        this.updateLoadingText('Failed to initialize your learning session. Please try again.');
        
        // Show error and return to onboarding
        setTimeout(() => {
            if (window.azionaApp) {
                window.azionaApp.showSection('onboarding-section');
            }
        }, 2000);
    }
}
    
    // Update loading text
    updateLoadingText(text) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }
    
    // Update progress bar
updateProgress(percentage) {
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        if (typeof animationManager !== 'undefined') {
            animationManager.animateProgress(progressFill, percentage);
        } else {
            // Fallback animation
            progressFill.style.width = percentage + '%';
        }
    }
}
    
// Handle theme change
handleThemeChange(e) {
    const theme = e.target.dataset.theme;
    if (theme) {
        // Use the app's theme management instead of themeManager
        if (window.azionaApp) {
            window.azionaApp.setTheme(theme);
            window.azionaApp.updateThemeButtons(theme);
        } else {
            // Fallback direct theme setting
            document.body.className = `theme-${theme}`;
            storage.set(CONFIG.STORAGE_KEYS.THEME, theme);
            
            // Update active state
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
        }
    }
}
    
    // Show error message
    showError(message) {
        // Create error alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert into current step
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.insertBefore(alert, currentStepElement.firstChild);
        }
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
    
    // Check if user is returning
checkReturningUser() {
    const userProfile = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
    if (userProfile) {
        // Show welcome back message
        this.showWelcomeBack(userProfile);
        return true;
    }
    return false;
}

// Start new learning journey
startNewJourning() {
    // Clear previous data
    storage.remove(CONFIG.STORAGE_KEYS.USER_PROFILE);
    progressManager.clearProgress();
    
    // Reset form
    this.resetForm();
    
    // Hide welcome back elements
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.style.display = 'none';
    }
    
    document.querySelectorAll('.btn').forEach(btn => {
        if (btn.textContent.includes('Continue') || btn.textContent.includes('Start New')) {
            btn.parentElement.remove();
        }
    });
}
    
    // Show welcome back message
    showWelcomeBack(userProfile) {
        const welcomeElement = document.getElementById('user-info');
        const nameElement = document.getElementById('user-name');
        
        if (welcomeElement && nameElement) {
            nameElement.textContent = userProfile.name;
            welcomeElement.style.display = 'block';
            
            // Option to continue or restart
            this.showContinueOption(userProfile);
        }
    }
    
    // Show continue learning option
    showContinueOption(userProfile) {
        const continueButton = document.createElement('button');
        continueButton.className = 'btn btn-primary me-2';
        continueButton.textContent = 'Continue Learning';
        continueButton.onclick = () => this.continueLearning();
        
        const restartButton = document.createElement('button');
        restartButton.className = 'btn btn-outline-secondary';
        restartButton.textContent = 'Start New Journey';
        restartButton.onclick = () => this.startNewJourney();
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'mt-3 text-center';
        buttonContainer.appendChild(continueButton);
        buttonContainer.appendChild(restartButton);
        
        const onboardingCard = document.querySelector('.onboarding-card');
        if (onboardingCard) {
            onboardingCard.appendChild(buttonContainer);
        }
    }
    
    // Continue previous learning session
async continueLearning() {
    const progress = progressManager.getProgress();
    if (progress) {
        // Show dashboard section
        if (window.azionaApp) {
            window.azionaApp.showSection('dashboard-section');
            window.azionaApp.loadLearningDashboard();
        }
    } else {
        this.startNewJourney();
    }
}
    
    // Start new learning journey
    // startNewJourney() {
    //     // Clear previous data
    //     userDataManager.clearUserData();
    //     progressManager.clearProgress();
    //     sessionManager.clearSession();
        
    //     // Reset form
    //     this.resetForm();
        
    //     // Hide welcome back elements
    //     document.getElementById('user-info').style.display = 'none';
    //     document.querySelectorAll('.btn').forEach(btn => {
    //         if (btn.textContent.includes('Continue') || btn.textContent.includes('Start New')) {
    //             btn.parentElement.remove();
    //         }
    //     });
    // }
    
    // Reset form to initial state
    resetForm() {
        this.currentStep = 1;
        this.formData = {};
        
        // Reset form elements
        const form = document.getElementById('onboarding-form');
        if (form) {
            form.reset();
        }
        
        // Reset step visibility
        document.querySelectorAll('.form-step').forEach((step, index) => {
            step.classList.toggle('active', index === 0);
        });
        
        // Clear validation errors
        document.querySelectorAll('.is-invalid').forEach(input => {
            input.classList.remove('is-invalid');
        });
        
        document.querySelectorAll('.invalid-feedback').forEach(error => {
            error.remove();
        });
    }
    
    // Initialize onboarding
    initialize() {
        // Check if user is returning
        if (!this.checkReturningUser()) {
            // Animate onboarding form
            animationManager.fadeIn(document.querySelector('.onboarding-card'), 0.8);
            
            // Stagger animate form elements
            const formElements = document.querySelectorAll('.form-group, .step-indicator');
            animationManager.staggerIn(formElements, 0.5, 0.1);
        }
    }
}

// Global functions for form navigation (called from HTML)
function nextStep() {
    if (window.onboardingComponent) {
        window.onboardingComponent.nextStep();
    }
}

function prevStep() {
    if (window.onboardingComponent) {
        window.onboardingComponent.prevStep();
    }
}

// Export and initialize
window.onboardingComponent = new OnboardingComponent();
