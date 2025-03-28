export class ChatManager {
    constructor() {
        this.chats = JSON.parse(localStorage.getItem('gemini_chats')) || [];
        this.currentChatId = localStorage.getItem('current_chat_id') || Date.now().toString();
        this.currentChat = this.loadCurrentChat();
    }

    loadCurrentChat() {
        const chat = this.chats.find(c => c.id === this.currentChatId);
        return chat ? chat.messages : [];
    }

    addMessage(role, content) {
        if (!this.currentChat) this.currentChat = [];
        this.currentChat.push({ role, content });
        this.saveChat();
    }

    saveChat() {
        const existingIndex = this.chats.findIndex(c => c.id === this.currentChatId);
        const chatData = {
            id: this.currentChatId,
            timestamp: Date.now(),
            messages: this.currentChat
        };

        if (existingIndex >= 0) {
            this.chats[existingIndex] = chatData;
        } else {
            this.chats.push(chatData);
        }

        localStorage.setItem('gemini_chats', JSON.stringify(this.chats));
        localStorage.setItem('current_chat_id', this.currentChatId);
    }

    createNewChat() {
        this.currentChatId = Date.now().toString();
        this.currentChat = [];
        this.saveChat();
        return this.currentChatId;
    }

    clearHistory() {
        localStorage.removeItem('gemini_chats');
        this.chats = [];
        this.createNewChat();
    }

    getChatList() {
        return this.chats.map(chat => ({
            id: chat.id,
            title: this.generateChatTitle(chat.messages),
            timestamp: chat.timestamp
        })).sort((a, b) => b.timestamp - a.timestamp);
    }

    generateChatTitle(messages) {
        const firstUserMessage = messages.find(m => m.role === 'user');
        return firstUserMessage
            ? (firstUserMessage.content.length > 30
                ? firstUserMessage.content.substring(0, 30) + '...'
                : firstUserMessage.content)
            : 'Nuevo chat';
    }

    // Método de diagnóstico para ChatManager
    static testSyntax() {
        console.log("✅ ChatManager syntax OK");
        return true;
    }
}