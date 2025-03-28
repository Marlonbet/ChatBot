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

        this.autoScrollEnabled = true;
        this.typingIndicator = null;
        this.setupEventListeners();
        this.setupScrollHandler();
        this.setupCopyButtons();
    }

    setupScrollHandler() {
        if (!this.elements.chatHistory) return;
        
        this.elements.chatHistory.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = this.elements.chatHistory;
            this.autoScrollEnabled = (scrollHeight - scrollTop - clientHeight) < 100;
        });
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

    setupCopyButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.copy-btn')) {
                this.handleCopyCode(e.target.closest('.copy-btn'));
            }
        });
    }

    handleCopyCode(button) {
        const codeBlock = button.closest('.code-container')?.querySelector('.code-block');
        if (!codeBlock) return;

        const codeContent = codeBlock.textContent;
        navigator.clipboard.writeText(codeContent).then(() => {
            const icon = button.querySelector('i');
            const originalIcon = icon.className;
            
            icon.className = 'fas fa-check';
            button.classList.add('copied');
            
            setTimeout(() => {
                icon.className = originalIcon;
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar:', err);
            button.classList.add('error');
        });
    }

    processCodeBlocks(text) {
        const parts = text.split('```');
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                const languageMatch = part.match(/^\s*(\w+)/);
                const language = languageMatch ? languageMatch[1] : '';
                const codeContent = part.replace(/^\s*\w+\s*/, '');
                return `
                    <div class="code-container">
                        <div class="code-header">
                            <span class="language-label">${language}</span>
                            <button class="copy-btn" title="Copiar código">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <pre class="code-block">${this.escapeHtml(codeContent)}</pre>
                    </div>
                `;
            }
            return `<p>${this.escapeHtml(part)}</p>`;
        }).join('');
    }

    async renderMessageWithTyping(role, fullText) {
        if (!this.elements.chatHistory) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        this.elements.chatHistory.appendChild(messageDiv);

        let displayedText = '';
        const chunkSize = this.calculateChunkSize(fullText);
        const hasCode = fullText.includes('```');

        for (let i = 0; i < fullText.length; i += chunkSize) {
            displayedText += fullText.substring(i, i + chunkSize);
            
            if (hasCode) {
                messageDiv.innerHTML = this.processCodeBlocks(displayedText);
            } else {
                messageDiv.innerHTML = `<p>${this.escapeHtml(displayedText)}</p>`;
            }

            if (this.autoScrollEnabled) {
                this.scrollToBottom({ behavior: 'auto' });
            }
            
            await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 10));
        }

        if (hasCode) {
            messageDiv.innerHTML = this.processCodeBlocks(fullText);
        }
        
        if (this.autoScrollEnabled) {
            this.scrollToBottom({ behavior: 'smooth' });
        }
    }

    renderMessage(role, fullText) {
        if (!this.elements.chatHistory) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        if (fullText.includes('```')) {
            messageDiv.innerHTML = this.processCodeBlocks(fullText);
        } else {
            messageDiv.innerHTML = `<p>${this.escapeHtml(fullText)}</p>`;
        }
        
        this.elements.chatHistory.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        if (!this.elements.chatHistory) return;

        this.typingIndicator = document.createElement('div');
        this.typingIndicator.className = 'typing-indicator';
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

    scrollToBottom(options = { behavior: 'smooth' }) {
        if (this.elements.chatHistory) {
            this.elements.chatHistory.scrollTo({
                top: this.elements.chatHistory.scrollHeight,
                ...options
            });
        }
    }

    calculateChunkSize(text) {
        const baseSize = 5;
        const maxSize = 20;
        return text.length < 100 ? maxSize : baseSize;
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

    emitEvent(eventName, data = null) {
        document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
}