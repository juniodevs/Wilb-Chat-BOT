import './style.css'
import { initThemeTransition } from './themeManager.js'
import { initializeI18n, updateLanguageUI, getTranslation, getCurrentLanguage } from './i18n.js'
import DOMPurify from 'dompurify';

initThemeTransition();

let app, auth, db, googleProvider;

async function initializeFirebase() {
    const response = await fetch('/api/config');
    const config = await response.json();
    const firebaseConfig = config.firebase;
    const { initializeApp } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } = await import('firebase/auth');
    const { getFirestore, collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, orderBy, serverTimestamp, onSnapshot } = await import('firebase/firestore');

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();

    afterFirebaseInit({
        signInWithPopup,
        signInAnonymously,
        onAuthStateChanged,
        signOut,
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        updateProfile,
        sendPasswordResetEmail,
        collection,
        doc,
        addDoc,
        getDocs,
        updateDoc,
        deleteDoc,
        query,
        orderBy,
        serverTimestamp,
        onSnapshot
    });
}

function afterFirebaseInit(firebaseFns) {
    const { signInWithPopup, signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, orderBy, serverTimestamp, onSnapshot } = firebaseFns;

    const loginModal = document.getElementById('login-modal');
    const loginGoogleBtn = document.getElementById('login-google-btn');
    const loginAnonBtn = document.getElementById('login-anon-btn');
    const anonWarning = document.getElementById('anon-warning');
    const loginFromWarning = document.getElementById('login-from-warning');
    const userMenuButton = document.getElementById('user-menu-button');
    const userPhotoEl = document.getElementById('user-photo');
    const headerLoginBtn = document.getElementById('header-login-btn');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserEmail = document.getElementById('dropdown-user-email');
    const dropdownUserPhoto = document.getElementById('dropdown-user-photo');
    const logoutBtn = document.getElementById('logout-btn');
    const chatWindow = document.getElementById('chat-window');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const imageUploadInput = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');
    const modeSelect = document.getElementById('interaction-mode-select');
    const historyPanel = document.getElementById('history-panel');
    const historyList = document.getElementById('history-list');
    const newChatBtn = document.getElementById('new-chat-btn');
    const contextMenu = document.getElementById('context-menu');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const historyOverlay = document.getElementById('history-overlay');
    const closeLoginModalBtn = document.getElementById('close-login-modal-btn');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const showForgotPasswordModalBtn = document.getElementById('show-forgot-password-modal');
    const closeForgotPasswordModalBtn = document.getElementById('close-forgot-password-modal-btn');
    const backToLoginModalBtn = document.getElementById('back-to-login-modal');

    const WILB_IMAGE_URL = '/images/WilbAvatar.png';
    const WILB_IMAGE_URL_ANON = '/images/WilbAvatarAnon.png';
    const WILB_POPUP_IMAGE = '/images/WilbMainImage.jpg';
    const DEFAULT_AVATAR_URL = WILB_IMAGE_URL_ANON;

    let currentUser = null;
    let imageBase64 = null;
    let currentChatId = null;
    let historyData = [];
    let currentMessages = [];
    let contextTargetId = null;
    let unsubscribeHistory = null;
    let chatIdToDelete = null;
    let isWaitingWilbResponse = false;

    const localCache = {
        responses: new Map(),
        maxSize: 50,

        generateKey(prompt, mode) {
            return `${mode}:${prompt.trim().toLowerCase()}`;
        },

        get(prompt, mode) {
            const key = this.generateKey(prompt, mode);
            return this.responses.get(key);
        },

        set(prompt, mode, response) {
            const key = this.generateKey(prompt, mode);

            if (this.responses.size >= this.maxSize) {
                const firstKey = this.responses.keys().next().value;
                this.responses.delete(firstKey);
            }

            this.responses.set(key, {
                response,
                timestamp: Date.now()
            });
        },

        clear() {
            this.responses.clear();
        }
    };

    const scrollToBottom = () => chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });

    initThemeTransition();

    const showWelcomeMessage = () => {
        const welcomeText = getTranslation('welcome').split('\n');
        chatWindow.innerHTML = `
            <div class="flex items-start gap-3 justify-start mb-6 message-appear">
                <img src="${WILB_IMAGE_URL}" alt="Ícone do Wilb" class="w-10 h-10 rounded-full bg-slate-200">
                <div class="bg-white p-4 rounded-lg shadow-sm max-w-lg prose">
                    <p>${welcomeText[0]}</p>
                    <p>${welcomeText[1]}</p>
                </div>
            </div>`;
        renderSuggestions();
    };

    const showEmptyChatMessage = () => {
        chatWindow.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center text-slate-500 message-appear">
                <i class="fa-regular fa-comments text-5xl mb-4"></i>
                <h3 class="text-lg font-semibold">${getTranslation('emptyChatTitle')}</h3>
                <p class="text-sm">${getTranslation('emptyChatSubtitle')}</p>
            </div>`;
    };

    const updateSendButtonState = () => {
        sendBtn.disabled = !(messageInput.value.trim() || imageBase64);
    };

    const updateUIForUser = (user) => {
        if (user) {
            loginModal.style.display = 'none';

            if (user.isAnonymous) {
                userMenuButton.classList.add('hidden');
                headerLoginBtn.classList.remove('hidden');
                headerLoginBtn.classList.add('flex');
                anonWarning.classList.remove('hidden');
            } else {
                userMenuButton.classList.remove('hidden');
                userMenuButton.classList.add('flex');
                headerLoginBtn.classList.add('hidden');
                anonWarning.classList.add('hidden');

                const userPhoto = user.photoURL || DEFAULT_AVATAR_URL;
                userPhotoEl.src = userPhoto;
                dropdownUserPhoto.src = userPhoto;
                dropdownUserName.textContent = user.displayName || 'Usuário';
                dropdownUserEmail.textContent = user.email || 'Não disponível';
                dropdownUserEmail.classList.add('truncate-email');
            }
        } else {
            loginModal.style.display = 'flex';
            userMenuButton.classList.add('hidden');
            userMenuButton.classList.remove('flex');
            anonWarning.classList.add('hidden');
            headerLoginBtn.classList.remove('hidden');
            headerLoginBtn.classList.add('flex');
            const popupImg = loginModal.querySelector('img');
            if (popupImg) popupImg.src = WILB_POPUP_IMAGE;
        }
    };

    const renderHistory = () => {
        historyList.innerHTML = '';
        const displayHistory = [...historyData].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

        if (displayHistory.length === 0) {
            const message = currentUser?.isAnonymous
                ? getTranslation('anonymousHistoryWarning')
                : getTranslation('historyPlaceholder');
            historyList.innerHTML = `<div class="text-center text-sm text-slate-500 mt-4 px-2">${message}</div>`;
            return;
        }

        displayHistory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.dataset.id = item.id;
            itemDiv.draggable = true;
            itemDiv.className = `history-item p-2 flex items-center gap-2 cursor-pointer rounded-md`;

            if (item.id === currentChatId) {
                itemDiv.classList.add('bg-purple-100', 'text-purple-800');
            } else {
                itemDiv.classList.add('hover:bg-slate-200');
            }

            const iconClass = item.pinned ? 'fa-thumbtack text-purple-600' : 'fa-comment';

            const titleContent = item.isRenaming
                ? `<input class="rename-input flex-1 bg-white border border-purple-500 rounded px-1 text-sm" value="${item.title.replace('...', '')}" />`
                : `<span class="flex-1 truncate">${item.title}</span>`;

            itemDiv.innerHTML = `
                <i class="fa-regular ${iconClass} w-5 text-center"></i> 
                ${titleContent}
                <button class="options-btn p-2 rounded-md hover:bg-slate300/70" data-item-id="${item.id}">
                    <i class="fa-solid fa-ellipsis-vertical pointer-events-none"></i>
                </button>
            `;
            historyList.appendChild(itemDiv);

            if (item.isRenaming) {
                const renameInput = itemDiv.querySelector('.rename-input');
                renameInput.focus();
                renameInput.select();
                renameInput.addEventListener('blur', () => exitRenameMode(item.id, renameInput.value));
                renameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') exitRenameMode(item.id, null);
                    if (e.key === 'Escape') exitRenameMode(item.id, null);
                });
            }
        });
    };

    const resetAppState = () => {
        if (unsubscribeHistory) unsubscribeHistory();
        unsubscribeHistory = null;
        currentUser = null;
        historyData = [];
        currentChatId = null;
        currentMessages = [];
        renderHistory();
        showWelcomeMessage();
        updateUIForUser(null);
    };

    const loadHistoryFromFirestore = () => {
        if (unsubscribeHistory) unsubscribeHistory();
        if (!currentUser) return;

        if (currentUser.isAnonymous) {
            const localHistory = localStorage.getItem(`anonymousHistory_${currentUser.uid}`);
            historyData = localHistory ? JSON.parse(localHistory) : [];
            renderHistory();
            return;
        }

        const chatsRef = collection(db, "users", currentUser.uid, "chats");
        const q = query(chatsRef, orderBy("createdAt", "desc"));

        unsubscribeHistory = onSnapshot(q, (querySnapshot) => {
            historyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderHistory();
        }, (error) => {
            console.error("Error loading history:", error);
            historyList.innerHTML = `
                <div class="p-4 text-center text-sm text-red-700 bg-red-100 rounded-lg">
                    <p class="font-bold mb-2">${getTranslation('errorLoadingHistory')}</p>
                    <p>${getTranslation('firestoreSecurityRules')}</p>
                </div>`;
        });
    };

    const startNewChat = () => {
        if (currentChatId === null && currentMessages.length === 0) return;
        currentChatId = null;
        currentMessages = [];
        messageInput.value = '';
        removeImage();
        showWelcomeMessage();
        renderHistory();
    };

    const loadChat = (chatId) => {
        const result = historyData.find(c => c.id === chatId);
        if (result) {
            currentChatId = chatId;
            currentMessages = result.messages || [];
            chatWindow.innerHTML = '';
            const bar = document.getElementById('suggestions-bar');
            if (bar) bar.style.display = 'none';
            if (currentMessages.length > 0) {
                currentMessages.forEach(msg => displayMessage(msg));
            } else {
                showEmptyChatMessage();
            }
            renderHistory();
        }
    };

    const handleSignOut = async () => {
        const isAnon = currentUser?.isAnonymous;
        if (isAnon) {
            localStorage.removeItem(`anonymousHistory_${currentUser.uid}`);
        }
        await signOut(auth);
        localStorage.removeItem('anonymousUid');
        resetAppState();
        window.location.reload();
    };

    const signInWithGoogle = async () => {
        try {
            loginModal.style.display = 'none';
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error during Google sign-in:", error);
            updateUIForUser(null);
        }
    };

    const signInAnonymouslyFlow = async () => {
        try {
            loginModal.style.display = 'none';
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Error during anonymous sign-in:", error);
            updateUIForUser(null);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            imageBase64 = reader.result.split(',')[1];
            imagePreview.src = reader.result;
            imagePreviewContainer.classList.remove('hidden');
            updateSendButtonState();
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        imageBase64 = null;
        imageUploadInput.value = '';
        imagePreviewContainer.classList.add('hidden');
        updateSendButtonState();
    };

    function insertLatexLineBreaksKaTeX(text, maxLineLength = 15) {
        // KaTeX removed: just return the text as-is
        return text;
    }

    const displayMessage = (message) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start gap-3 mb-6 message-appear ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`;

        // KaTeX removed: do not process LaTeX
        let processedText = message.text;

        if (message.sender === 'user') {
            const userAvatarUrl = currentUser?.photoURL || WILB_IMAGE_URL_ANON;
            messageDiv.innerHTML = `
                <div class="bg-purple-600 text-white p-4 rounded-lg shadow-sm max-w-lg prose">
                    ${message.imageUrl ? `<img src="${DOMPurify.sanitize(message.imageUrl)}" alt="Imagem enviada" class="rounded-lg mb-2 max-w-full h-auto">` : ''}
                    ${message.text ? `<div>${DOMPurify.sanitize(marked.parse(message.text))}</div>` : ''}
                </div>
                <img src="${userAvatarUrl}" alt="Ícone do usuário" class="w-10 h-10 rounded-full bg-slate-200">
            `;
        } else {
            messageDiv.innerHTML = `
                <img src="${WILB_IMAGE_URL}" alt="Ícone do Wilb" class="w-10 h-10 rounded-full bg-slate-200">
                <div class="bg-white p-4 rounded-lg shadow-sm max-w-lg prose">${DOMPurify.sanitize(marked.parse(processedText))}</div>
            `;
        }

        chatWindow.appendChild(messageDiv);
        scrollToBottom();

        // Render KaTeX in the new message (only for bot messages)
        if (message.sender !== 'user' && window.renderMathInElement) {
            try {
                renderMathInElement(messageDiv, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false,
                    output: 'html',
                    macros: {},
                    renderCallback: function(elem) {
                        // Força o bloco display KaTeX a ficar em box
                        if (elem.classList.contains('katex-display')) {
                            // Se já não está em um .katex-block-box, envolve
                            if (!elem.parentElement.classList.contains('katex-block-box')) {
                                const wrapper = document.createElement('div');
                                wrapper.className = 'katex-block-box';
                                elem.parentElement.insertBefore(wrapper, elem);
                                wrapper.appendChild(elem);
                            }
                        }
                    }
                });
                // Garante que todos os blocos KaTeX display estejam em .katex-block-box
                messageDiv.querySelectorAll('.katex-display').forEach(elem => {
                    if (!elem.parentElement.classList.contains('katex-block-box')) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'katex-block-box';
                        elem.parentElement.insertBefore(wrapper, elem);
                        wrapper.appendChild(elem);
                    }
                });
            } catch (e) {
                // Silently ignore KaTeX errors
            }
        }
    };

    const showTypingIndicator = () => {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex items-start gap-3 justify-start mb-6 message-appear';
        typingDiv.innerHTML = `
            <img src="${WILB_IMAGE_URL}" alt="Ícone do Wilb" class="w-10 h-10 rounded-full bg-slate-200">
            <div class="bg-white p-4 rounded-lg shadow-sm flex items-center gap-1">
                <div class="typing-dot w-2 h-2 bg-purple-600 rounded-full"></div>
                <div class="typing-dot w-2 h-2 bg-purple-600 rounded-full"></div>
                <div class="typing-dot w-2 h-2 bg-purple-600 rounded-full"></div>
            </div>
        `;
        chatWindow.appendChild(typingDiv);
        scrollToBottom();
    };

    const removeTypingIndicator = () => {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    };

    const getGeminiResponse = async (conversationHistory, newText, newBase64ImageData) => {
        const currentMode = modeSelect.value;
        const seriousMode = conversationModeSwitch && conversationModeSwitch.checked === true;

        if (!newBase64ImageData) {
            const cached = localCache.get(newText, currentMode);
            if (cached) {
                console.log('Resposta encontrada no cache local');
                return cached.response;
            }
        }

        const currentLanguage = getCurrentLanguage();

        const payload = {
            conversationHistory,
            prompt: newText,
            image: newBase64ImageData,
            mode: currentMode,
            seriousMode,
            language: currentLanguage
        };

        const response = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': currentLanguage
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("API Error Response Body:", errorBody);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();

        if (result && result.response) {

            if (!newBase64ImageData) {
                localCache.set(newText, currentMode, result.response);
            }

            if (result.cached) {
                console.log('Resposta veio do cache do servidor');
            }

            return result.response;
        }

        return "Não consegui gerar uma resposta.";
    };

    const createNewChat = async (title, messages) => {
        if (!currentUser) return;

        const messagesToStore = messages.map(msg => ({
            sender: msg.sender,
            text: msg.text,
            hasImage: msg.hasImage || false
        }));

        if (currentUser.isAnonymous) {
            const newChat = {
                id: `chat_${Date.now()}`,
                title,
                messages: messagesToStore,
                pinned: false,
                createdAt: new Date().toISOString()
            };
            historyData.unshift(newChat);
            localStorage.setItem(`anonymousHistory_${currentUser.uid}`, JSON.stringify(historyData));
            currentChatId = newChat.id;
            renderHistory();
        } else {
            const docRef = await addDoc(collection(db, "users", currentUser.uid, "chats"), {
                title,
                messages: messagesToStore,
                pinned: false,
                createdAt: serverTimestamp()
            });
            currentChatId = docRef.id;
        }
    };

    const updateChat = async (chatId, messages) => {
        if (!currentUser) return;

        const messagesToStore = messages.map(msg => ({
            sender: msg.sender,
            text: msg.text,
            hasImage: msg.hasImage || false
        }));

        if (currentUser.isAnonymous) {
            const chatIndex = historyData.findIndex(c => c.id === chatId);
            if (chatIndex > -1) {
                historyData[chatIndex].messages = messagesToStore;
                localStorage.setItem(`anonymousHistory_${currentUser.uid}`, JSON.stringify(historyData));
            }
        } else {
            const chatDocRef = doc(db, "users", currentUser.uid, "chats", chatId);
            await updateDoc(chatDocRef, { messages: messagesToStore });
        }
    };

    const handleSendMessage = async () => {
        if (isWaitingWilbResponse) return;
        const userText = messageInput.value.trim();
        if (!userText && !imageBase64) return;

        isWaitingWilbResponse = true;
        sendBtn.disabled = true;
        newChatBtn.disabled = true;

        const messageForDisplay = {
            sender: 'user',
            text: userText,
            imageUrl: imageBase64 ? imagePreview.src : null,
            hasImage: !!imageBase64
        };

        const historyForApi = [...currentMessages];
        currentMessages.push(messageForDisplay);
        displayMessage(messageForDisplay);

        const tempImageBase64 = imageBase64;
        messageInput.value = '';
        removeImage();
        updateSendButtonState();

        showTypingIndicator();

        const bar = document.getElementById('suggestions-bar');
        if (bar) bar.style.display = 'none';

        try {
            const response = await getGeminiResponse(historyForApi, userText, tempImageBase64);
            removeTypingIndicator();

            const assistantMessage = { sender: 'assistant', text: response };
            currentMessages.push(assistantMessage);
            displayMessage(assistantMessage);

            if (currentChatId) {
                await updateChat(currentChatId, currentMessages);
            } else {
                const title = userText.length > 50 ? userText.substring(0, 50) + '...' : userText;
                await createNewChat(title, currentMessages);
            }
        } catch (error) {
            removeTypingIndicator();
            console.error('Erro ao obter resposta:', error);
            const errorMessage = {
                sender: 'assistant',
                text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
            };
            currentMessages.push(errorMessage);
            displayMessage(errorMessage);
        }

        setTimeout(() => {
            isWaitingWilbResponse = false;
            sendBtn.disabled = false;
            newChatBtn.disabled = false;
            updateSendButtonState();
        }, 3000);
    };

    const exitRenameMode = async (chatId, newTitle) => {
        const chatIndex = historyData.findIndex(c => c.id === chatId);
        if (chatIndex === -1) return;

        historyData[chatIndex].isRenaming = false;

        if (newTitle && newTitle.trim() !== '') {
            historyData[chatIndex].title = newTitle.trim();

            if (currentUser && !currentUser.isAnonymous) {
                try {
                    const chatDocRef = doc(db, "users", currentUser.uid, "chats", chatId);
                    await updateDoc(chatDocRef, { title: newTitle.trim() });
                } catch (error) {
                    console.error("Error updating chat title:", error);
                }
            } else if (currentUser && currentUser.isAnonymous) {
                localStorage.setItem(`anonymousHistory_${currentUser.uid}`, JSON.stringify(historyData));
            }
        }

        renderHistory();
    };

    function showDeleteChatModal(chatId) {
        chatIdToDelete = chatId;
        const modal = document.getElementById('delete-chat-modal');
        const title = document.getElementById('delete-chat-title');
        const message = document.getElementById('delete-chat-message');
        const yesBtn = document.getElementById('delete-chat-yes-btn');
        const noBtn = document.getElementById('delete-chat-no-btn');
        if (title) title.textContent = getTranslation('deleteChatTitle');
        if (message) message.textContent = getTranslation('deleteChatMessage');
        if (yesBtn) yesBtn.textContent = getTranslation('deleteChatYes');
        if (noBtn) noBtn.textContent = getTranslation('deleteChatNo');
        if (modal) modal.classList.remove('hidden');
    }

    function hideDeleteChatModal() {
        const modal = document.getElementById('delete-chat-modal');
        if (modal) modal.classList.add('hidden');
        chatIdToDelete = null;
    }

    const deleteChat = async (chatId, confirmed = false) => {
        if (!confirmed) {
            showDeleteChatModal(chatId);
            return;
        }

        if (currentUser && !currentUser.isAnonymous) {
            try {
                const chatDocRef = doc(db, "users", currentUser.uid, "chats", chatId);
                await deleteDoc(chatDocRef);
            } catch (error) {
                console.error("Error deleting chat:", error);
            }
        } else if (currentUser && currentUser.isAnonymous) {
            historyData = historyData.filter(c => c.id !== chatId);
            localStorage.setItem(`anonymousHistory_${currentUser.uid}`, JSON.stringify(historyData));
            renderHistory();
        }

        if (currentChatId === chatId) {
            startNewChat();
        }
    };

    const togglePinChat = async (chatId) => {
        const chatIndex = historyData.findIndex(c => c.id === chatId);
        if (chatIndex === -1) return;

        historyData[chatIndex].pinned = !historyData[chatIndex].pinned;

        if (currentUser && !currentUser.isAnonymous) {
            try {
                const chatDocRef = doc(db, "users", currentUser.uid, "chats", chatId);
                await updateDoc(chatDocRef, { pinned: historyData[chatIndex].pinned });
            } catch (error) {
                console.error("Error updating chat pin status:", error);
            }
        } else if (currentUser && currentUser.isAnonymous) {
            localStorage.setItem(`anonymousHistory_${currentUser.uid}`, JSON.stringify(historyData));
            renderHistory();
        }
    };

    function getSuggestions() {
        const currentLanguage = getCurrentLanguage();
        return getTranslation('suggestions', currentLanguage) || [];
    }

    function renderSuggestions() {
        const bar = document.getElementById('suggestions-bar');
        if (!bar) return;
        bar.innerHTML = '';
        const suggestions = getSuggestions();
        const shuffled = suggestions.sort(() => 0.5 - Math.random());
        shuffled.slice(0, 2).forEach(suggestion => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = suggestion;
            btn.onclick = () => {
                messageInput.value = suggestion;
                updateSendButtonState();
                handleSendMessage();
            };
            bar.appendChild(btn);
        });
        bar.style.display = 'flex';
    }

    let conversationStyle = 'normal';
    const modeSwitch = document.getElementById('mode-switch');
    if (modeSwitch) {
        modeSwitch.addEventListener('change', () => {
            conversationStyle = modeSwitch.checked ? 'serio' : 'normal';
        });
    }

    function getCurrentPromptMode() {

        if (conversationStyle === 'serio') return 'serio';
        return modeSelect.value;
    }

    const initializeState = () => {
        updateSendButtonState();
        showWelcomeMessage();
        renderSuggestions();
    };

    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        updateUIForUser(user);

        if (user) {
            if (user.isAnonymous) {
                localStorage.setItem('anonymousUid', user.uid);
            } else {
                localStorage.removeItem('anonymousUid');
            }
            loadHistoryFromFirestore();
            startNewChat();
        } else {
            resetAppState();
        }
    });

    if (closeLoginModalBtn) {
        closeLoginModalBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    headerLoginBtn.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });

    loginFromWarning.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });

    loginGoogleBtn.addEventListener('click', signInWithGoogle);
    loginAnonBtn.addEventListener('click', signInAnonymouslyFlow);
    logoutBtn.addEventListener('click', handleSignOut);

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isWaitingWilbResponse) handleSendMessage();
    });

    messageInput.addEventListener('input', updateSendButtonState);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isWaitingWilbResponse) handleSendMessage();
        }
    });

    imageUploadInput.addEventListener('change', handleImageUpload);
    removeImageBtn.addEventListener('click', removeImage);
    newChatBtn.addEventListener('click', () => {
        if (!isWaitingWilbResponse) startNewChat();
    });

    userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenuDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!userMenuDropdown.contains(e.target) && !userMenuButton.contains(e.target)) {
            userMenuDropdown.classList.add('hidden');
        }
    });

    menuToggleBtn.addEventListener('click', () => {
        historyPanel.classList.toggle('-translate-x-full');
        historyOverlay.classList.toggle('hidden');
    });

    historyOverlay.addEventListener('click', () => {
        historyPanel.classList.add('-translate-x-full');
        historyOverlay.classList.add('hidden');
    });

    historyList.addEventListener('click', (e) => {
        const historyItem = e.target.closest('.history-item');
        const optionsBtn = e.target.closest('.options-btn');

        if (optionsBtn) {
            e.stopPropagation();
            const itemId = optionsBtn.dataset.itemId;
            contextTargetId = itemId;

            const rect = optionsBtn.getBoundingClientRect();
            contextMenu.style.left = `${rect.left - 120}px`;
            contextMenu.style.top = `${rect.bottom + 5}px`;
            contextMenu.classList.remove('hidden');

            return;
        }

        if (historyItem && !historyItem.querySelector('.rename-input')) {
            const chatId = historyItem.dataset.id;
            loadChat(chatId);

            historyPanel.classList.add('-translate-x-full');
            historyOverlay.classList.add('hidden');
        }
    });

    contextMenu.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (!action || !contextTargetId) return;

        switch (action) {
            case 'rename':
                const chatIndex = historyData.findIndex(c => c.id === contextTargetId);
                if (chatIndex !== -1) {
                    historyData[chatIndex].isRenaming = true;
                    renderHistory();
                }
                break;
            case 'pin':
                togglePinChat(contextTargetId);
                break;
            case 'delete':
                showDeleteChatModal(contextTargetId);
                break;
        }

        contextMenu.classList.add('hidden');
        contextTargetId = null;
    });

    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.classList.add('hidden');
            contextTargetId = null;
        }
    });

    initializeState();

    const conversationModeSwitch = document.getElementById('conversation-mode-switch');
    const conversationModeLabel = document.getElementById('conversation-mode-label');

    const updateConversationModeLabel = () => {
        if (conversationModeSwitch.checked) {
            conversationModeLabel.textContent = getTranslation('serious');
        } else {
            conversationModeLabel.textContent = getTranslation('normal');
        }
    };

    const savedConversationMode = localStorage.getItem('conversationMode');
    if (savedConversationMode === 'serious') {
        conversationModeSwitch.checked = true;
    } else {
        conversationModeSwitch.checked = false;
    }

    updateConversationModeLabel();

    conversationModeSwitch.addEventListener('change', () => {
        const mode = conversationModeSwitch.checked ? 'serious' : 'normal';
        localStorage.setItem('conversationMode', mode);
        updateConversationModeLabel();
    });

    initializeI18n();

    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                currentUser = userCredential.user;
                updateUIForUser(currentUser);
                hideModal(emailLoginModal);
                window.location.reload();
            } catch (error) {
                let msg = getTranslation('loginGenericError');
                if (error.code === 'auth/user-not-found') msg = getTranslation('loginUserNotFound');
                else if (error.code === 'auth/wrong-password') msg = getTranslation('loginWrongPassword');
                else if (error.code === 'auth/invalid-email') msg = getTranslation('loginInvalidEmail');
                else if (error.code === 'auth/too-many-requests') msg = getTranslation('loginTooManyRequests');
                showLoginErrorModal(msg);
            }
        });
    }
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            if (password !== confirmPassword) {
                alert(getTranslation('passwordMismatch') || 'As senhas não coincidem!');
                return;
            }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                currentUser = userCredential.user;

                if (name && updateProfile) {
                    await updateProfile(currentUser, { displayName: name });
                }
                updateUIForUser(currentUser);
                hideModal(signupModal);
                showModal(emailLoginModal);
                alert('Conta criada com sucesso! Faça login.');
            } catch (error) {
                let msg = 'Erro ao criar conta.';
                if (error.code === 'auth/email-already-in-use') msg = 'Este email já está em uso.';
                else if (error.code === 'auth/invalid-email') msg = 'Email inválido.';
                else if (error.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres.';
                alert(msg);
            }
        });
    }

    if (showForgotPasswordModalBtn) {
        showForgotPasswordModalBtn.addEventListener('click', () => {
            hideModal(emailLoginModal);
            showModal(forgotPasswordModal);
        });
    }
    if (closeForgotPasswordModalBtn) {
        closeForgotPasswordModalBtn.addEventListener('click', () => {
            hideModal(forgotPasswordModal);
            showModal(emailLoginModal);
        });
    }
    if (backToLoginModalBtn) {
        backToLoginModalBtn.addEventListener('click', () => {
            hideModal(forgotPasswordModal);
            showModal(emailLoginModal);
        });
    }

    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            if (!email) return;
            try {
                let sendPasswordResetEmailFn = null;
                if (typeof sendPasswordResetEmail === 'undefined') {
                    const firebaseAuth = await import('firebase/auth');
                    sendPasswordResetEmailFn = firebaseAuth.sendPasswordResetEmail;
                } else {
                    sendPasswordResetEmailFn = sendPasswordResetEmail;
                }
                await sendPasswordResetEmailFn(auth, email);
                showForgotPasswordFeedbackModal(getTranslation('forgotPasswordSuccess') || 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.', true);
                hideModal(forgotPasswordModal);
                showModal(emailLoginModal);
            } catch (error) {
                showForgotPasswordFeedbackModal(getTranslation('forgotPasswordError') || 'Erro ao tentar recuperar a senha. Tente novamente.', false);
            }
        });
    }

    const yesBtn = document.getElementById('delete-chat-yes-btn');
    const noBtn = document.getElementById('delete-chat-no-btn');
    if (yesBtn) {
        yesBtn.onclick = async () => {
            if (chatIdToDelete) {
                await deleteChat(chatIdToDelete, true);
            }
            hideDeleteChatModal();
        };
    }
    if (noBtn) {
        noBtn.onclick = hideDeleteChatModal;
    }
}

initializeFirebase();

const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

const enableDarkMode = () => {
    body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    darkModeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    darkModeToggle.querySelector('span').textContent = 'Modo Claro';
};

const disableDarkMode = () => {
    body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    darkModeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
    darkModeToggle.querySelector('span').textContent = 'Modo Escuro';
};

const toggleDarkMode = () => {
    if (body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
};

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    enableDarkMode();
} else if (savedTheme === 'light') {
    disableDarkMode();
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    enableDarkMode();
} else {
    disableDarkMode();
}

darkModeToggle.addEventListener('click', toggleDarkMode);
document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('message-input');
    const counter = document.getElementById('char-counter');
    const maxHeight = 160;
    if (textarea) {
        function autoResize() {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
        }
        textarea.addEventListener('input', function () {
            autoResize();
            if (counter) {
                counter.textContent = `${textarea.value.length}/4000`;
            }
        });
        autoResize();
        if (counter) {
            counter.textContent = `${textarea.value.length}/4000`;
        }
    }
});

const loginModal = document.getElementById('login-modal');
const emailLoginModal = document.getElementById('email-login-modal');
const signupModal = document.getElementById('signup-modal');

const loginEmailBtn = document.getElementById('login-email-btn');
const showSignupModalBtn = document.getElementById('show-signup-modal');
const showLoginModalBtn = document.getElementById('show-login-modal');

const closeEmailLoginModalBtn = document.getElementById('close-email-login-modal-btn');
const closeSignupModalBtn = document.getElementById('close-signup-modal-btn');

const emailLoginForm = document.getElementById('email-login-form');
const signupForm = document.getElementById('signup-form');

function showModal(modal) {
    modal.classList.remove('hidden');
}

function hideModal(modal) {
    modal.classList.add('hidden');
}

loginEmailBtn.addEventListener('click', () => {
    hideModal(loginModal);
    showModal(emailLoginModal);
});

showSignupModalBtn.addEventListener('click', () => {
    hideModal(emailLoginModal);
    showModal(signupModal);
});

showLoginModalBtn.addEventListener('click', () => {
    hideModal(signupModal);
    showModal(emailLoginModal);
});

closeEmailLoginModalBtn.addEventListener('click', () => {
    hideModal(emailLoginModal);
    showModal(loginModal);
});

closeSignupModalBtn.addEventListener('click', () => {
    hideModal(signupModal);
    showModal(loginModal);
});

function updateAuthModalsLanguage() {
    if (emailLoginModal) {
        const title = emailLoginModal.querySelector('h2');
        if (title) title.textContent = getTranslation('emailLoginTitle');
        const desc = emailLoginModal.querySelector('p');
        if (desc) desc.textContent = getTranslation('emailLoginDescription');
        const emailInput = emailLoginModal.querySelector('input#email');
        if (emailInput) emailInput.placeholder = getTranslation('emailLabel');
        const passwordInput = emailLoginModal.querySelector('input#password');
        if (passwordInput) passwordInput.placeholder = getTranslation('passwordLabel');
        const emailLabel = emailLoginModal.querySelector('label[for="email"]');
        if (emailLabel) emailLabel.textContent = getTranslation('emailLabel');
        const passwordLabel = emailLoginModal.querySelector('label[for="password"]');
        if (passwordLabel) passwordLabel.textContent = getTranslation('passwordLabel');
        const loginBtn = emailLoginModal.querySelector('button[type="submit"]');
        if (loginBtn) loginBtn.textContent = getTranslation('loginBtn');
        const noAccount = emailLoginModal.querySelector('.mt-4 p');
        if (noAccount) {
            noAccount.innerHTML = `${getTranslation('noAccount')} <button id="show-signup-modal" class="text-purple-600 font-semibold hover:text-purple-700">${getTranslation('createAccount')}</button>`;
        }
    }

    if (signupModal) {
        const title = signupModal.querySelector('h2');
        if (title) title.textContent = getTranslation('signupTitle');
        const desc = signupModal.querySelector('p');
        if (desc) desc.textContent = getTranslation('signupDescription');
        const nameInput = signupModal.querySelector('input#signup-name');
        if (nameInput) nameInput.placeholder = getTranslation('nameLabel');
        const emailInput = signupModal.querySelector('input#signup-email');
        if (emailInput) emailInput.placeholder = getTranslation('emailLabel');
        const passwordInput = signupModal.querySelector('input#signup-password');
        if (passwordInput) passwordInput.placeholder = getTranslation('passwordLabel');
        const confirmPasswordInput = signupModal.querySelector('input#signup-confirm-password');
        if (confirmPasswordInput) confirmPasswordInput.placeholder = getTranslation('confirmPasswordLabel');
        const nameLabel = signupModal.querySelector('label[for="signup-name"]');
        if (nameLabel) nameLabel.textContent = getTranslation('nameLabel');
        const emailLabel = signupModal.querySelector('label[for="signup-email"]');
        if (emailLabel) emailLabel.textContent = getTranslation('emailLabel');
        const passwordLabel = signupModal.querySelector('label[for="signup-password"]');
        if (passwordLabel) passwordLabel.textContent = getTranslation('passwordLabel');
        const confirmPasswordLabel = signupModal.querySelector('label[for="signup-confirm-password"]');
        if (confirmPasswordLabel) confirmPasswordLabel.textContent = getTranslation('confirmPasswordLabel');
        const signupBtn = signupModal.querySelector('button[type="submit"]');
        if (signupBtn) signupBtn.textContent = getTranslation('signupBtn');
        const alreadyAccount = signupModal.querySelector('.mt-4 p');
        if (alreadyAccount) {
            alreadyAccount.innerHTML = `${getTranslation('alreadyHaveAccount')} <button id="show-login-modal" class="text-purple-600 font-semibold hover:text-purple-700">${getTranslation('doLogin')}</button>`;
        }
    }

    if (loginEmailBtn) {
        const span = loginEmailBtn.querySelector('span');
        if (span) span.textContent = getTranslation('loginWithEmail');
    }

    const newShowSignupModalBtn = document.getElementById('show-signup-modal');
    if (newShowSignupModalBtn) {
        newShowSignupModalBtn.onclick = () => {
            hideModal(emailLoginModal);
            showModal(signupModal);
        };
    }
    const newShowLoginModalBtn = document.getElementById('show-login-modal');
    if (newShowLoginModalBtn) {
        newShowLoginModalBtn.onclick = () => {
            hideModal(signupModal);
            showModal(emailLoginModal);
        };
    }
}

updateAuthModalsLanguage();

window.addEventListener('DOMContentLoaded', () => {
    const languageDropdown = document.getElementById('language-dropdown');
    if (languageDropdown) {
        languageDropdown.addEventListener('change', () => {
            setTimeout(updateAuthModalsLanguage, 700);
        });
    }
});

function criarLoginErrorModalSeNecessario() {
    if (document.getElementById('login-error-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'login-error-modal';
    modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 hidden';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
        <h2 class="text-lg font-bold mb-2" id="login-error-title">Erro de Login</h2>
        <p class="mb-4" id="login-error-message">Mensagem de erro aqui</p>
        <button id="close-login-error-modal-btn" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
}

function showLoginErrorModal(message) {
    criarLoginErrorModalSeNecessario();
    const modal = document.getElementById('login-error-modal');
    const msg = document.getElementById('login-error-message');
    const title = document.getElementById('login-error-title');
    const btn = document.getElementById('close-login-error-modal-btn');
    if (title) title.textContent = getTranslation('loginErrorTitle') || 'Erro de Login';
    if (msg) msg.textContent = message;
    if (btn) btn.textContent = getTranslation('okBtn') || 'OK';
    if (modal) modal.classList.remove('hidden');
}

function hideLoginErrorModal() {
    const modal = document.getElementById('login-error-modal');
    if (modal) modal.classList.add('hidden');
}

function adicionarEventoFecharLoginErrorModal() {
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'close-login-error-modal-btn') {
            hideLoginErrorModal();
        }
    });
}
adicionarEventoFecharLoginErrorModal();

function criarForgotPasswordModalSeNecessario() {
    if (document.getElementById('forgot-password-feedback-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'forgot-password-feedback-modal';
    modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 hidden';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
        <h2 class="text-lg font-bold mb-2" id="forgot-password-feedback-title">Recuperação de Senha</h2>
        <p class="mb-4" id="forgot-password-feedback-message">Mensagem aqui</p>
        <button id="close-forgot-password-feedback-modal-btn" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
}

function showForgotPasswordFeedbackModal(message, isSuccess = true) {
    criarForgotPasswordModalSeNecessario();
    const modal = document.getElementById('forgot-password-feedback-modal');
    const msg = document.getElementById('forgot-password-feedback-message');
    const title = document.getElementById('forgot-password-feedback-title');
    const btn = document.getElementById('close-forgot-password-feedback-modal-btn');
    if (msg) msg.textContent = message;
    if (title) title.textContent = isSuccess ? (getTranslation('forgotPasswordTitle') || 'Recuperação de Senha') : (getTranslation('forgotPasswordErrorTitle') || 'Erro na Recuperação');
    if (btn) btn.textContent = getTranslation('okBtn') || 'OK';
    if (modal) modal.classList.remove('hidden');
}

function hideForgotPasswordFeedbackModal() {
    const modal = document.getElementById('forgot-password-feedback-modal');
    if (modal) modal.classList.add('hidden');
}

function adicionarEventoFecharForgotPasswordFeedbackModal() {
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'close-forgot-password-feedback-modal-btn') {
            hideForgotPasswordFeedbackModal();
        }
    });
}
adicionarEventoFecharForgotPasswordFeedbackModal();