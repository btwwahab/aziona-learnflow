// (Note: Rename from model.js to modal-cleanup.js)

/**
 * Modal Cleanup Utility
 * Helps manage Bootstrap modals and prevent stacking issues
 */

class ModalCleanupUtility {
    static cleanupAllModals() {
        try {
            // Remove all existing modals
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                try {
                    const instance = bootstrap.Modal.getInstance(modal);
                    if (instance) {
                        instance.dispose();
                    }
                    modal.remove();
                } catch (error) {
                    console.warn('Error disposing modal:', error);
                    // Force remove even if dispose fails
                    modal.remove();
                }
            });

            // Remove all backdrops
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                try {
                    backdrop.remove();
                } catch (error) {
                    console.warn('Error removing backdrop:', error);
                }
            });

            // Reset body state
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            console.log('All modals cleaned up');
        } catch (error) {
            console.error('Error cleaning up modals:', error);
        }
    }

    static preventModalStacking() {
        // Add mutation observer to prevent backdrop stacking
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    const backdrops = document.querySelectorAll('.modal-backdrop');
                    if (backdrops.length > 1) {
                        // Remove extra backdrops
                        for (let i = 1; i < backdrops.length; i++) {
                            try {
                                backdrops[i].remove();
                            } catch (error) {
                                console.warn('Error removing extra backdrop:', error);
                            }
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    static forceCloseModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                const instance = bootstrap.Modal.getInstance(modal);
                if (instance) {
                    instance.dispose();
                }
                modal.remove();
            }

            // Clean up any remaining backdrops
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                try {
                    backdrop.remove();
                } catch (error) {
                    console.warn('Error removing backdrop:', error);
                }
            });

            // Reset body state
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            console.log(`Modal ${modalId} force closed`);
        } catch (error) {
            console.error(`Error force closing modal ${modalId}:`, error);
        }
    }

    static safeModalShow(modalElement) {
        try {
            if (!modalElement) {
                console.error('Modal element is null or undefined');
                return null;
            }

            // Ensure the modal is properly attached to DOM
            if (!modalElement.parentNode) {
                document.body.appendChild(modalElement);
            }

            // Create modal instance with error handling
            const modalInstance = new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true,
                focus: true
            });

            // Show with error handling
            modalInstance.show();

            return modalInstance;
        } catch (error) {
            console.error('Error showing modal safely:', error);
            return null;
        }
    }
}

// Initialize modal cleanup only if not already initialized
if (!window.modalCleanupUtility) {
    window.modalCleanupUtility = ModalCleanupUtility;
    
    // Start monitoring for backdrop stacking
    ModalCleanupUtility.preventModalStacking();
    
    console.log('Modal Cleanup Utility initialized');
}