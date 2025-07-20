// Chat assistant component for AI-powered learning support
class ChatAssistantComponent {
    constructor() {
        this.chatMessages = [];
        this.currentVideoContext = null;
        this.isTyping = false;
        this.userProfile = null;
        this.initializeEventListeners();
        this.initializeComponent();
    }
    
// Update the initializeEventListeners method:

initializeEventListeners() {
    // Chat input
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            this.autoResizeTextarea(chatInput);
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', () => this.sendMessage());
    }
    
    // Chat toggle
    const toggleButton = document.getElementById('toggle-chat');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => this.toggleChat());
    }
    
    // Clear chat button - ADD THIS
    const clearChatButton = document.getElementById('clear-chat');
    if (clearChatButton) {
        clearChatButton.addEventListener('click', () => this.showClearChatConfirmation());
    }
    
    // Keep only the quick question handling
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-question-btn')) {
            this.handleQuickQuestion(e.target.textContent);
        }
    });
}

// Replace the existing showClearChatConfirmation method with this updated version:

showClearChatConfirmation() {
    // Check if modal already exists and is visible
    const existingModal = document.querySelector('#clear-chat-modal');
    if (existingModal) {
        console.log('Modal already exists, ignoring request');
        return;
    }

    // Use the utility to clean up any existing modals first
    if (window.modalCleanupUtility) {
        window.modalCleanupUtility.cleanupAllModals();
    }

    // Create modal immediately (no timeout)
    this.createClearChatModal();
}

// Update the createClearChatModal method with better event handling:
createClearChatModal() {
    // Double-check that no modal exists
    const existingModal = document.querySelector('#clear-chat-modal');
    if (existingModal) {
        console.log('Modal already exists, removing existing one');
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'clear-chat-modal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'clearChatModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h5 class="modal-title" id="clearChatModalLabel">🗑️ Clear Chat History</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Are you sure?</strong>
                    </div>
                    <p>This will permanently delete all your chat history with the AI assistant.</p>
                    <p><strong>This action cannot be undone.</strong></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancel-clear-btn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-danger" id="confirm-clear-btn">
                        <i class="fas fa-trash"></i> Delete All
                    </button>
                </div>
            </div>
        </div>
    `;

    // Append to body
    document.body.appendChild(modal);

    // Create modal instance with error handling
    let modalInstance = null;
    
    try {
        modalInstance = new bootstrap.Modal(modal, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
    } catch (error) {
        console.error('Error creating modal instance:', error);
        modal.remove();
        return;
    }

    // Track if modal is being processed to prevent multiple actions
    let isProcessing = false;

    // Define event handlers with processing protection
    const handleConfirm = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isProcessing) {
            console.log('Already processing, ignoring click');
            return;
        }
        
        isProcessing = true;
        console.log('✅ Confirming chat deletion');
        
        // Disable buttons to prevent multiple clicks
        const confirmBtn = modal.querySelector('#confirm-clear-btn');
        const cancelBtn = modal.querySelector('#cancel-clear-btn');
        
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        }
        if (cancelBtn) {
            cancelBtn.disabled = true;
        }
        
        try {
            // Clear chat history
            this.clearChatHistory();
            
            // Hide modal
            modalInstance.hide();
            
            // Show success message
            if (window.azionaApp) {
                window.azionaApp.showSuccessMessage('🗑️ Chat history cleared successfully!');
            }
            
        } catch (error) {
            console.error('Error clearing chat:', error);
            
            // Re-enable buttons on error
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-trash"></i> Delete All';
            }
            if (cancelBtn) {
                cancelBtn.disabled = false;
            }
            
            isProcessing = false;
        }
    };

    const handleCancel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isProcessing) {
            console.log('Already processing, ignoring cancel');
            return;
        }
        
        console.log('❌ Chat deletion cancelled');
        
        // Hide modal
        modalInstance.hide();
    };

    // Add event listeners with proper cleanup
    const confirmBtn = modal.querySelector('#confirm-clear-btn');
    const cancelBtn = modal.querySelector('#cancel-clear-btn');
    const closeBtn = modal.querySelector('.btn-close');

    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleConfirm);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', handleCancel);
    }

    // Single cleanup handler when modal is hidden
    modal.addEventListener('hidden.bs.modal', (e) => {
        console.log('🧹 Cleaning up chat modal');
        
        try {
            // Remove event listeners
            if (confirmBtn) {
                confirmBtn.removeEventListener('click', handleConfirm);
            }
            if (cancelBtn) {
                cancelBtn.removeEventListener('click', handleCancel);
            }
            if (closeBtn) {
                closeBtn.removeEventListener('click', handleCancel);
            }
            
            // Dispose the modal instance
            if (modalInstance) {
                modalInstance.dispose();
            }
            
            // Remove modal from DOM
            if (modal.parentNode) {
                modal.remove();
            }
            
            // Clean up any remaining backdrops
            const remainingBackdrops = document.querySelectorAll('.modal-backdrop');
            remainingBackdrops.forEach(backdrop => {
                try {
                    backdrop.remove();
                } catch (error) {
                    console.warn('Error removing backdrop:', error);
                }
            });
            
            // Reset body classes if needed
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
        } catch (error) {
            console.error('Error during modal cleanup:', error);
        }
    }, { once: true }); // Use { once: true } to ensure this only runs once

    // Show modal
    try {
        modalInstance.show();
        console.log('🗑️ Clear chat modal created and shown');
    } catch (error) {
        console.error('Error showing modal:', error);
        modal.remove();
    }
}

// Update the clearChatHistory method:
clearChatHistory() {
    try {
        // Clear chat messages array
        this.chatMessages = [];
        
        // Clear from storage
        storage.remove('chat-history');

        // Clear the chat container
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.innerHTML = `
                <div class="message ai-message">
                    <div class="message-content">
                        <p>Chat history cleared! Hello! I'm your AI learning assistant. I can help you understand concepts, answer questions, and provide explanations about the current video. What would you like to know?</p>
                    </div>
                </div>
            `;
        }
        
        // Also add the welcome message to the array
        this.chatMessages = [{
            role: 'ai',
            content: "Chat history cleared! Hello! I'm your AI learning assistant. I can help you understand concepts, answer questions, and provide explanations about the current video. What would you like to know?",
            timestamp: new Date().toISOString()
        }];
        
        // Save the reset state
        this.saveChatHistory();

        console.log('Chat history cleared successfully');
        return true;

    } catch (error) {
        console.error('Error clearing chat history:', error);
        return false;
    }
}

// Update the clearChatHistory method:
clearChatHistory() {
    try {
        // Clear from memory
        this.chatMessages = [];
        
        // Clear from storage
        storage.remove('chat-history');
        
        // Clear the chat container
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.innerHTML = '';
        }
        
        // Add welcome message back
        this.addMessage('ai', 'Chat history cleared! Hello! I\'m your AI learning assistant. I can help you understand concepts, answer questions, and provide explanations about the current video. What would you like to know?', false);
        
        // Show success message
        this.showChatMessage('Chat history cleared successfully!', 'success');
        
        console.log('Chat history cleared successfully');
        
    } catch (error) {
        console.error('Error clearing chat history:', error);
        this.showChatMessage('Failed to clear chat history. Please try again.', 'error');
    }
}

// Add method to show temporary messages:
showChatMessage(message, type = 'info') {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message system-message ${type}-message`;
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-text">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                ${message}
            </div>
        </div>
    `;
    
    // Style the system message
    messageElement.style.cssText = `
        margin: 10px 0;
        padding: 10px;
        border-radius: 8px;
        background: ${type === 'success' ? 'rgba(40, 167, 69, 0.1)' : type === 'error' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(23, 162, 184, 0.1)'};
        border: 1px solid ${type === 'success' ? 'rgba(40, 167, 69, 0.3)' : type === 'error' ? 'rgba(220, 53, 69, 0.3)' : 'rgba(23, 162, 184, 0.3)'};
        color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        text-align: center;
        font-size: 0.9rem;
        animation: fadeInOut 3s ease-in-out;
    `;
    
    chatContainer.appendChild(messageElement);
    this.scrollToBottom();
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 3000);
}
    
    // Initialize component
    initializeComponent() {
        // Use existing storage instead of userDataManager
        this.userProfile = storage.get(CONFIG.STORAGE_KEYS.USER_PROFILE);
        this.loadChatHistory();
        this.setupQuickQuestions();
        
        // Add welcome message if no chat history
        if (this.chatMessages.length === 0) {
            this.addMessage('ai', 'Hello! I\'m your AI learning assistant. I can help you understand concepts, answer questions, and guide you through your learning journey. How can I help you today?', false);
        }
    }
    
    // Load chat history from storage
    loadChatHistory() {
        const savedMessages = storage.get('chat-history', []);
        this.chatMessages = savedMessages;
        this.renderChatHistory();
    }
    
    // Save chat history to storage
    saveChatHistory() {
        storage.set('chat-history', this.chatMessages);
    }
    
    // Set video context (called from video player)
    setVideoContext(video) {
        this.currentVideoContext = video;
        this.updateContext(video.title, video.description);
    }
    
    // Update context information
    updateContext(title, description) {
        const contextInfo = document.getElementById('context-info');
        if (contextInfo) {
            contextInfo.innerHTML = `
                <div class="context-item">
                    <strong>Current Video:</strong> ${title}
                </div>
            `;
        }
    }
    

    // Update the sendMessage method with better error handling and logging:
async sendMessage() {
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');
    
    if (!input) {
        console.error('Chat input not found');
        return;
    }
    
    const message = input.value.trim();
    
    if (!message) {
        console.log('Empty message, ignoring');
        return;
    }
    
    console.log('📤 Sending message:', message);
    
    // Disable send button and show loading state
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.classList.add('btn-sending');
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    // Add user message
    this.addMessage('user', message);
    input.value = '';
    
    // Show typing indicator
    console.log('⏳ Showing typing indicator...');
    this.showTypingIndicator();
    
    try {
        // Get AI response
        console.log('🤖 Getting AI response...');
        const response = await this.getAIResponse(message);
        console.log('✅ AI response received:', response.substring(0, 100) + '...');
        
        // Remove typing indicator
        this.hideTypingIndicator();
        
        // Add AI response
        this.addMessage('ai', response);
        
    } catch (error) {
        console.error('❌ Error getting AI response:', error);
        this.hideTypingIndicator();
        this.addMessage('ai', 'Sorry, I encountered an error. Please try again.');
    } finally {
        // Re-enable send button
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.classList.remove('btn-sending');
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }
}

// Update the getAIResponse method with better logging:
async getAIResponse(message) {
    console.log('🔄 Processing AI request...');
    
    try {
        // Use existing groqAPI if available
        if (typeof groqAPI !== 'undefined' && groqAPI.chatWithAI) {
            const context = {
                currentVideo: this.currentVideoContext,
                userProfile: this.userProfile,
                chatHistory: this.chatMessages.slice(-5) // Last 5 messages for context
            };
            
            console.log('📡 Calling Groq API...');
            const response = await groqAPI.chatWithAI(message, context);
            console.log('✅ Groq API response received');
            return response;
            
        } else {
            console.warn('⚠️ Groq API not available, using fallback');
            // Fallback response if API not available
            return 'I\'m here to help! However, the AI service is not currently available. Please make sure your API configuration is set up correctly.';
        }
    } catch (error) {
        console.error('❌ Error in getAIResponse:', error);
        throw error;
    }
}

// Also update the addMessage method to include better logging:
addMessage(sender, content, save = true) {
    console.log(`💬 Adding ${sender} message:`, content.substring(0, 50) + '...');
    
    const message = {
        id: Date.now(),
        sender,
        content,
        timestamp: new Date().toISOString()
    };
    
    this.chatMessages.push(message);
    
    if (save) {
        this.saveChatHistory();
    }
    
    this.renderMessage(message);
    this.scrollToBottom();
}
    
    // Render single message
    renderMessage(message) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender}-message`;
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(message.content)}</div>
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            </div>
        `;
        
        chatContainer.appendChild(messageElement);
        
        // Animate message appearance
        if (typeof animationManager !== 'undefined') {
            animationManager.fadeIn(messageElement, 0.3);
        }
    }
    
    // Render chat history
    renderChatHistory() {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;
        
        chatContainer.innerHTML = '';
        
        this.chatMessages.forEach(message => {
            this.renderMessage(message);
        });
        
        this.scrollToBottom();
    }
    
    // Format message content
    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    
    // Format timestamp
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
showTypingIndicator() {
    // Remove any existing typing indicators first
    this.hideTypingIndicator();
    
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) {
        console.warn('Chat container not found');
        return;
    }
    
    const typingElement = document.createElement('div');
    typingElement.className = 'message ai-message typing-indicator';
    typingElement.id = 'typing-indicator';
    typingElement.innerHTML = `
        <div class="message-content">
            <div class="typing-animation">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatContainer.appendChild(typingElement);
    this.scrollToBottom();
    
    console.log('Typing indicator shown');
}

// Update the hideTypingIndicator method:
hideTypingIndicator() {
    const typingIndicators = document.querySelectorAll('.typing-indicator, #typing-indicator');
    typingIndicators.forEach(indicator => {
        if (indicator && indicator.parentNode) {
            indicator.remove();
        }
    });
    
    console.log('Typing indicator hidden');
}
    
    // Scroll to bottom
    scrollToBottom() {
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
    
    // Auto-resize textarea
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
    
    // Toggle chat panel
    toggleChat() {
        const chatContainer = document.querySelector('.ai-chat-container');
        const toggleBtn = document.getElementById('toggle-chat');
        
        if (!chatContainer || !toggleBtn) return;
        
        chatContainer.classList.toggle('collapsed');
        
        const icon = toggleBtn.querySelector('i');
        if (chatContainer.classList.contains('collapsed')) {
            icon.className = 'fas fa-chevron-up';
        } else {
            icon.className = 'fas fa-chevron-down';
        }
    }
    
    // Toggle floating assistant
    toggleFloatingAssistant() {
        const popup = document.getElementById('assistant-popup');
        if (popup) {
            popup.classList.toggle('show');
        }
    }
    
    // Close floating assistant
    closeFloatingAssistant() {
        const popup = document.getElementById('assistant-popup');
        if (popup) {
            popup.classList.remove('show');
        }
    }
    
    // Handle quick questions
    handleQuickQuestion(question) {
        const mainChatInput = document.getElementById('chat-input');
        const assistantInput = document.querySelector('.assistant-input input');
        
        if (mainChatInput && mainChatInput.offsetParent !== null) {
            // Main chat is visible
            mainChatInput.value = question;
            mainChatInput.focus();
        } else if (assistantInput) {
            // Use floating assistant
            assistantInput.value = question;
            assistantInput.focus();
        }
    }
    
    // Send message from floating assistant
    async sendAssistantMessage() {
        const input = document.querySelector('.assistant-input input');
        const message = input.value.trim();
        
        if (!message) return;
        
        input.value = '';
        this.closeFloatingAssistant();
        
        // Add to main chat
        this.addMessage('user', message);
        this.showTypingIndicator();
        
        try {
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessage('ai', response);
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessage('ai', 'Sorry, I encountered an error. Please try again.');
        }
    }
    
    // Setup quick questions
    setupQuickQuestions() {
        const quickQuestions = [
            "Explain this concept",
            "What's next?",
            "Give me a summary",
            "I don't understand",
            "Show me examples",
            "Test my knowledge"
        ];
        
        const container = document.querySelector('.quick-questions');
        if (container) {
            container.innerHTML = quickQuestions.map(question => 
                `<button class="quick-question-btn">${question}</button>`
            ).join('');
        }
    }
    
    // Clear chat history
    clearChatHistory() {
        this.chatMessages = [];
        this.saveChatHistory();
        
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.innerHTML = '';
        }
        
        // Add welcome message
        this.addMessage('ai', 'Chat history cleared. How can I help you?', false);
    }
    
    // Export chat history
    exportChatHistory() {
        const exportData = {
            messages: this.chatMessages,
            exportDate: new Date().toISOString(),
            userProfile: this.userProfile
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    // Get chat statistics
    getChatStatistics() {
        const userMessages = this.chatMessages.filter(m => m.sender === 'user');
        const aiMessages = this.chatMessages.filter(m => m.sender === 'ai');
        
        return {
            totalMessages: this.chatMessages.length,
            userMessages: userMessages.length,
            aiMessages: aiMessages.length,
            averageMessageLength: userMessages.length > 0 
                ? Math.round(userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length)
                : 0,
            chatStartTime: this.chatMessages.length > 0 ? this.chatMessages[0].timestamp : null
        };
    }
}

// Create global instance
window.chatAssistantComponent = new ChatAssistantComponent();