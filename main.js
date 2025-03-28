import { ApiManager } from './apiManager.js';
import { ChatManager } from './chatManager.js';
import { UIManager } from './uiManager.js';
import { PersonalityManager } from './personality.js';

class ChatApplication {
    constructor() {
        document.addEventListener("DOMContentLoaded", () => this.initialize());
    }

    initialize() {
        this.runDiagnostics();

        this.api = new ApiManager();
        this.chatManager = new ChatManager();
        this.ui = new UIManager();
        this.personalityManager = new PersonalityManager();
        this.isProcessing = false;

        // Configuración de eventos
        document.addEventListener("sendMessage", () => this.handleSendMessage());
        document.addEventListener("newChat", () => this.handleNewChat());
        document.addEventListener("clearHistory", () => this.handleClearHistory());
        document.addEventListener("selectChat", (e) => this.handleSelectChat(e.detail));

        this.renderInitialState();
    }

    runDiagnostics() {
        try {
            console.group("🚀 Ejecutando Diagnósticos");
            console.log("ApiManager:", ApiManager.testSyntax());
            console.log("ChatManager:", ChatManager.testSyntax());
            // UIManager no tiene testSyntax; se asume que se inicializa correctamente.
            console.log("PersonalityManager:", PersonalityManager.testSyntax());
            console.groupEnd();
        } catch (error) {
            console.error("❌ Error en diagnóstico:", error.message, error.stack);
        }
    }

    renderInitialState() {
        setTimeout(() => {
            this.ui.renderChatList(this.chatManager.getChatList());
            this.chatManager.currentChat.forEach(msg => {
                this.ui.renderMessage(msg.role, msg.content);
            });
        }, 100);
    }

    async handleSendMessage() {
        if (this.isProcessing) return;

        const userMessage = this.ui.elements.userInput.value.trim();
        if (!userMessage) return;

        this.isProcessing = true;
        this.ui.elements.userInput.value = '';

        // Renderiza el mensaje del usuario inmediatamente.
        this.chatManager.addMessage('user', userMessage);
        this.ui.renderMessage('user', userMessage);

        try {
            // Enriquecer la consulta con la personalidad.
            const enrichedQuery = this.personalityManager.enrichQuery(userMessage);
            this.ui.showTypingIndicator();
            
            const aiResponse = await this.api.sendRequest(enrichedQuery, this.chatManager.currentChat);

            this.ui.removeTypingIndicator();
            await this.ui.renderMessageWithTyping('ai', aiResponse);
            
            this.chatManager.addMessage('ai', aiResponse);
            this.ui.renderChatList(this.chatManager.getChatList());
        } catch (error) {
            this.ui.showError(error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    handleNewChat() {
        this.chatManager.createNewChat();
        this.ui.renderChatList(this.chatManager.getChatList());
        this.ui.elements.chatHistory.innerHTML = '';
    }

    handleClearHistory() {
        this.chatManager.clearHistory();
        this.ui.renderChatList(this.chatManager.getChatList());
    }

    handleSelectChat(chatId) {
        this.chatManager.currentChatId = chatId;
        this.chatManager.currentChat = this.chatManager.loadCurrentChat();
        this.ui.elements.chatHistory.innerHTML = '';
        this.chatManager.currentChat.forEach(msg => {
            this.ui.renderMessage(msg.role, msg.content);
        });
        this.ui.toggleSidebar(false);
    }
}

// Inicializamos la aplicación
try {
    new ChatApplication();
    console.log("🔥 Aplicación iniciada correctamente");
} catch (error) {
    console.error("💥 Error crítico al iniciar:", error.message, error.stack);
}