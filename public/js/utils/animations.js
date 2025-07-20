// Animation utilities using GSAP and custom animations
class AnimationManager {
    constructor() {
        this.isGSAPAvailable = typeof gsap !== 'undefined';
        this.defaultDuration = CONFIG.ANIMATION_DURATION / 1000;
        this.ease = this.isGSAPAvailable ? 'power2.out' : 'ease-out';
    }
    
    // Page transitions
    fadeIn(element, duration = this.defaultDuration, delay = 0) {
        if (this.isGSAPAvailable) {
            return gsap.fromTo(element, 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration, delay, ease: this.ease }
            );
        } else {
            return this.cssAnimation(element, 'fadeInUp', duration * 1000, delay * 1000);
        }
    }
    
    fadeOut(element, duration = this.defaultDuration, delay = 0) {
        if (this.isGSAPAvailable) {
            return gsap.to(element, 
                { opacity: 0, y: -30, duration, delay, ease: this.ease }
            );
        } else {
            return this.cssAnimation(element, 'fadeOutUp', duration * 1000, delay * 1000);
        }
    }
    
    slideIn(element, direction = 'left', duration = this.defaultDuration, delay = 0) {
        const xValue = direction === 'left' ? -100 : 100;
        
        if (this.isGSAPAvailable) {
            return gsap.fromTo(element,
                { opacity: 0, x: xValue },
                { opacity: 1, x: 0, duration, delay, ease: this.ease }
            );
        } else {
            const animationName = direction === 'left' ? 'fadeInLeft' : 'fadeInRight';
            return this.cssAnimation(element, animationName, duration * 1000, delay * 1000);
        }
    }
    
    slideOut(element, direction = 'left', duration = this.defaultDuration, delay = 0) {
        const xValue = direction === 'left' ? -100 : 100;
        
        if (this.isGSAPAvailable) {
            return gsap.to(element,
                { opacity: 0, x: xValue, duration, delay, ease: this.ease }
            );
        } else {
            const animationName = direction === 'left' ? 'fadeOutLeft' : 'fadeOutRight';
            return this.cssAnimation(element, animationName, duration * 1000, delay * 1000);
        }
    }
    
    scaleIn(element, duration = this.defaultDuration, delay = 0) {
        if (this.isGSAPAvailable) {
            return gsap.fromTo(element,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration, delay, ease: this.ease }
            );
        } else {
            return this.cssAnimation(element, 'scaleIn', duration * 1000, delay * 1000);
        }
    }
    
    scaleOut(element, duration = this.defaultDuration, delay = 0) {
        if (this.isGSAPAvailable) {
            return gsap.to(element,
                { opacity: 0, scale: 0.8, duration, delay, ease: this.ease }
            );
        } else {
            return this.cssAnimation(element, 'scaleOut', duration * 1000, delay * 1000);
        }
    }
    
    // Stagger animations
    staggerIn(elements, duration = this.defaultDuration, stagger = 0.1) {
        if (this.isGSAPAvailable) {
            return gsap.fromTo(elements,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration, stagger, ease: this.ease }
            );
        } else {
            elements.forEach((element, index) => {
                setTimeout(() => {
                    this.fadeIn(element, duration);
                }, index * stagger * 1000);
            });
        }
    }
    
    staggerOut(elements, duration = this.defaultDuration, stagger = 0.1) {
        if (this.isGSAPAvailable) {
            return gsap.to(elements,
                { opacity: 0, y: -30, duration, stagger, ease: this.ease }
            );
        } else {
            elements.forEach((element, index) => {
                setTimeout(() => {
                    this.fadeOut(element, duration);
                }, index * stagger * 1000);
            });
        }
    }
    
    // Progress animations
    animateProgress(element, targetValue, duration = 1) {
        if (this.isGSAPAvailable) {
            return gsap.to(element, {
                width: `${targetValue}%`,
                duration,
                ease: this.ease
            });
        } else {
            return new Promise((resolve) => {
                element.style.transition = `width ${duration}s ${this.ease}`;
                element.style.width = `${targetValue}%`;
                setTimeout(resolve, duration * 1000);
            });
        }
    }
    
    animateCounter(element, targetValue, duration = 1) {
        const startValue = parseInt(element.textContent) || 0;
        
        if (this.isGSAPAvailable) {
            return gsap.to({ value: startValue }, {
                value: targetValue,
                duration,
                ease: this.ease,
                onUpdate: function() {
                    element.textContent = Math.round(this.targets()[0].value);
                }
            });
        } else {
            return new Promise((resolve) => {
                const increment = (targetValue - startValue) / (duration * 60);
                let currentValue = startValue;
                
                const animate = () => {
                    currentValue += increment;
                    if (currentValue >= targetValue) {
                        element.textContent = targetValue;
                        resolve();
                    } else {
                        element.textContent = Math.round(currentValue);
                        requestAnimationFrame(animate);
                    }
                };
                
                animate();
            });
        }
    }
    
    // Circular progress animation
    animateCircularProgress(element, targetValue, duration = 1) {
        if (this.isGSAPAvailable) {
            return gsap.to(element, {
                background: `conic-gradient(var(--primary-color) ${targetValue * 3.6}deg, var(--surface-color) ${targetValue * 3.6}deg)`,
                duration,
                ease: this.ease
            });
        } else {
            return new Promise((resolve) => {
                let currentValue = 0;
                const increment = targetValue / (duration * 60);
                
                const animate = () => {
                    currentValue += increment;
                    if (currentValue >= targetValue) {
                        element.style.background = `conic-gradient(var(--primary-color) ${targetValue * 3.6}deg, var(--surface-color) ${targetValue * 3.6}deg)`;
                        resolve();
                    } else {
                        element.style.background = `conic-gradient(var(--primary-color) ${currentValue * 3.6}deg, var(--surface-color) ${currentValue * 3.6}deg)`;
                        requestAnimationFrame(animate);
                    }
                };
                
                animate();
            });
        }
    }
    
    // Loading animations
    pulseAnimation(element, duration = 1, iterations = 'infinite') {
        if (this.isGSAPAvailable) {
            return gsap.to(element, {
                scale: 1.1,
                duration: duration / 2,
                repeat: iterations === 'infinite' ? -1 : iterations * 2 - 1,
                yoyo: true,
                ease: 'power2.inOut'
            });
        } else {
            element.style.animation = `pulse ${duration}s ease-in-out ${iterations}`;
            return Promise.resolve();
        }
    }
    
    // Shake animation
    shakeAnimation(element, intensity = 10, duration = 0.5) {
        if (this.isGSAPAvailable) {
            return gsap.to(element, {
                x: `+=${intensity}`,
                duration: duration / 8,
                repeat: 7,
                yoyo: true,
                ease: 'power2.inOut'
            });
        } else {
            return new Promise((resolve) => {
                element.style.animation = `shake ${duration}s ease-in-out`;
                setTimeout(() => {
                    element.style.animation = '';
                    resolve();
                }, duration * 1000);
            });
        }
    }
    
    // CSS Animation fallback
    cssAnimation(element, animationName, duration, delay = 0) {
        return new Promise((resolve) => {
            const animationEnd = () => {
                element.style.animation = '';
                element.removeEventListener('animationend', animationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', animationEnd);
            
            setTimeout(() => {
                element.style.animation = `${animationName} ${duration}ms ${this.ease}`;
            }, delay);
        });
    }
    
    // Kill all animations on element
    killAnimations(element) {
        if (this.isGSAPAvailable) {
            gsap.killTweensOf(element);
        } else {
            element.style.animation = '';
            element.style.transition = '';
        }
    }
}

// Page transition manager
class PageTransitionManager {
    constructor() {
        this.animationManager = new AnimationManager();
        this.currentSection = null;
        this.transitionInProgress = false;
    }
    
    // Show section with animation
    async showSection(sectionId, hideOthers = true) {
        if (this.transitionInProgress) return;
        
        this.transitionInProgress = true;
        
        const section = document.getElementById(sectionId);
        if (!section) {
            this.transitionInProgress = false;
            return;
        }
        
        // Hide other sections if requested
        if (hideOthers) {
            const allSections = document.querySelectorAll('section');
            for (const sec of allSections) {
                if (sec.id !== sectionId) {
                    sec.style.display = 'none';
                }
            }
        }
        
        // Show and animate the target section
        section.style.display = 'block';
        await this.animationManager.fadeIn(section, 0.5);
        
        this.currentSection = sectionId;
        this.transitionInProgress = false;
    }
    
    // Hide section with animation
    async hideSection(sectionId, animate = true) {
        if (this.transitionInProgress) return;
        
        this.transitionInProgress = true;
        
        const section = document.getElementById(sectionId);
        if (!section) {
            this.transitionInProgress = false;
            return;
        }
        
        if (animate) {
            await this.animationManager.fadeOut(section, 0.3);
        }
        
        section.style.display = 'none';
        this.transitionInProgress = false;
    }
}

// Form animation manager
class FormAnimationManager {
    constructor() {
        this.animationManager = new AnimationManager();
    }
    
    // Animate form step transition
    async animateStepTransition(currentStep, nextStep, direction = 'forward') {
        const slideDirection = direction === 'forward' ? 'right' : 'left';
        
        // Hide current step
        await this.animationManager.slideOut(currentStep, slideDirection, 0.3);
        currentStep.classList.remove('active');
        
        // Show next step
        nextStep.classList.add('active');
        await this.animationManager.slideIn(nextStep, slideDirection === 'right' ? 'left' : 'right', 0.5);
    }
    
    // Animate form validation
    animateValidationError(element) {
        return this.animationManager.shakeAnimation(element, 5, 0.5);
    }
    
    // Animate form success
    animateFormSuccess(element) {
        return this.animationManager.scaleIn(element, 0.5);
    }
}

// Export instances
const animationManager = new AnimationManager();
const pageTransitionManager = new PageTransitionManager();
const formAnimationManager = new FormAnimationManager();