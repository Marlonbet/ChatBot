export class UIManager {
    constructor() {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        console.log("✅ UIManager inicializado");
        this.elements = {
            chatHistory: document.getElementById('chatHistory'),
            userInput: document.getElementById('userInput'),
            sendButton: document.getElementById('sendButton'),
            chatList: document.getElementById('chatList'),
            sidebar: document.querySelector('.sidebar'),
            closeSidebarBtn: document.getElementById('closeSidebarBtn'),
            newChatBtn: document.getElementById('newChatBtn'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            toggleSidebarBtn: document.getElementById('toggleSidebarBtn')
        };

        console.log("📌 Elementos UI:", this.elements);
        this.autoScrollEnabled = true;
        this.typingIndicator = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.elements.sendButton) {
            this.elements.sendButton.addEventListener('click', () => this.emitEvent('sendMessage'));
        }
        if (this.elements.userInput) {
            this.elements.userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.emitEvent('sendMessage');
                }
            });
        }
        if (this.elements.newChatBtn) {
            this.elements.newChatBtn.addEventListener('click', () => this.emitEvent('newChat'));
        }
        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.addEventListener('click', () => {
                if (confirm('¿Borrar todo el historial?')) {
                    this.emitEvent('clearHistory');
                }
            });
        }
        if (this.elements.chatList) {
            this.elements.chatList.addEventListener('click', (e) => {
                const chatItem = e.target.closest('.chat-item');
                if (chatItem) this.emitEvent('selectChat', chatItem.dataset.id);
            });
        }
        if (this.elements.toggleSidebarBtn) {
            this.elements.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        }
        if (this.elements.closeSidebarBtn) {
            this.elements.closeSidebarBtn.addEventListener('click', () => this.toggleSidebar(false));
        }
    }

    emitEvent(eventName, data = null) {
        document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }

    showTypingIndicator() {
        if (!this.elements.chatHistory) return;

        this.typingIndicator = document.createElement('div');
        this.typingIndicator.className = 'typing-indicator';
        // Se puede animar con CSS usando la clase .typing-indicator
        this.typingIndicator.innerHTML = `<p>🟡 Escribiendo...</p>`;
        this.elements.chatHistory.appendChild(this.typingIndicator);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.remove();
            this.typingIndicator = null;
        }
    }

    // Método para renderizar un mensaje inmediatamente (sin efecto de tipeo)
    renderMessage(role, fullText) {
        if (!this.elements.chatHistory) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.innerHTML = `<p>${this.escapeHtml(fullText)}</p>`;
        this.elements.chatHistory.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // Método que aplica efecto de escritura (solo para respuestas de la IA)
    async renderMessageWithTyping(role, fullText) {
        if (!this.elements.chatHistory) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        this.elements.chatHistory.appendChild(messageDiv);

        if (role === 'ai') {
            let chunkSize = this.calculateChunkSize(fullText) * 2;
            let displayedText = '';
            for (let i = 0; i < fullText.length; i += chunkSize) {
                displayedText += fullText.substring(i, i + chunkSize);
                messageDiv.innerHTML = `<p>${this.escapeHtml(displayedText)}</p>`;
                if (this.autoScrollEnabled) {
                    this.scrollToBottom();
                }
                await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 10));
            }
        } else {
            messageDiv.innerHTML = `<p>${this.escapeHtml(fullText)}</p>`;
        }
    }

    calculateChunkSize(text) {
        return text.length < 100 ? 1 : text.length < 500 ? 2 : 3;
    }

    scrollToBottom() {
        if (this.elements.chatHistory) {
            this.elements.chatHistory.scrollTo({ 
                top: this.elements.chatHistory.scrollHeight, 
                behavior: 'smooth' 
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        if (!this.elements.chatHistory) return;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.innerHTML = `<p>❌ ${this.escapeHtml(message)}</p>`;
        this.elements.chatHistory.appendChild(errorDiv);
        this.scrollToBottom();
    }

    renderChatList(chatList) {
        if (!this.elements.chatList) return;
        this.elements.chatList.innerHTML = chatList.map(chat => `
            <div class="chat-item" data-id="${chat.id}">
                <div class="chat-title">${this.escapeHtml(chat.title)}</div>
                <div class="chat-date">${new Date(chat.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
    }

    toggleSidebar(show = null) {
        if (this.elements.sidebar) {
            if (show === null) {
                this.elements.sidebar.classList.toggle('active');
            } else {
                this.elements.sidebar.classList.toggle('active', show);
            }
        }
    }
}

// Función global para copiar código, si es necesaria.
window.copyCode = function(button) {
    const codeBlock = button.parentElement;
    const codeElement = codeBlock.querySelector('.code-block');
    if (!codeElement) return;
    const code = codeElement.textContent.replace('Copiar', '').trim();
    navigator.clipboard.writeText(code).then(() => {
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    });
};