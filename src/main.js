// Importar estilos
import './style.css'
import { initThemeTransition } from './themeManager.js'

// Inicializar o gerenciador de tema imediatamente
initThemeTransition();

// --- Firebase Config ---
let app, auth, db, googleProvider;

async function initializeFirebase() {
    const response = await fetch('/api/config');
    const config = await response.json();
    const firebaseConfig = config.firebase;
    const { initializeApp } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, signOut } = await import('firebase/auth');
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
    const { signInWithPopup, signInAnonymously, onAuthStateChanged, signOut, collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, orderBy, serverTimestamp, onSnapshot } = firebaseFns;

    // --- DOM Elements ---
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

    // --- Constants ---
    const WILB_IMAGE_URL = '/images/WilbAvatar.png';
    const WILB_IMAGE_URL_ANON = '/images/WilbAvatarAnon.png';
    const WILB_POPUP_IMAGE = '/images/WilbMainImage.jpg';
    const DEFAULT_AVATAR_URL = WILB_IMAGE_URL_ANON;

    // --- State ---
    let currentUser = null;
    let imageBase64 = null;
    let currentChatId = null;
    let historyData = [];
    let currentMessages = [];
    let contextTargetId = null;
    let unsubscribeHistory = null;

    // Cache local para perguntas frequentes
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

    // --- Utility Functions ---
    const scrollToBottom = () => chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });

    // Inicializar o gerenciador de tema
    initThemeTransition();

    const showWelcomeMessage = () => {
        chatWindow.innerHTML = `
            <div class="flex items-start gap-3 justify-start mb-6 message-appear">
                <img src="${WILB_IMAGE_URL}" alt="Ícone do Wilb" class="w-10 h-10 rounded-full bg-slate-200">
                <div class="bg-white p-4 rounded-lg shadow-sm max-w-lg prose">
                    <p>Oi! Eu sou o Wilb, seu companheiro de estudos 💜✨</p>
                    <p>Vamos arrasar juntos?</p>
                </div>
            </div>`;
        renderSuggestions();
    };

    const showEmptyChatMessage = () => {
        chatWindow.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center text-slate-500 message-appear">
                <i class="fa-regular fa-comments text-5xl mb-4"></i>
                <h3 class="text-lg font-semibold">Este chat está vazio.</h3>
                <p class="text-sm">Envie uma mensagem ou uma imagem para começar a conversa.</p>
            </div>`;
    };

    const updateSendButtonState = () => {
        sendBtn.disabled = !(messageInput.value.trim() || imageBase64);
    };

    // --- UI Functions ---
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
                ? 'Seu histórico não é salvo no modo anônimo.'
                : 'Seu histórico aparecerá aqui.';
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
                    if (e.key === 'Enter') exitRenameMode(item.id, renameInput.value);
                    if (e.key === 'Escape') exitRenameMode(item.id, null);
                });
            }
        });
    };

    // --- State Management ---
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
                    <p class="font-bold mb-2">Erro ao carregar o histórico!</p>
                    <p>Verifique se as <strong class="underline">Regras de Segurança</strong> do seu banco de dados Firestore estão configuradas corretamente.</p>
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

    // --- Authentication ---
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

    // --- Image Handling ---
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

    // --- Message Handling ---
    const displayMessage = (message) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start gap-3 mb-6 message-appear ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`;

        if (message.sender === 'user') {
            const userAvatarUrl = currentUser?.photoURL || WILB_IMAGE_URL_ANON;
            messageDiv.innerHTML = `
                <div class="bg-purple-600 text-white p-4 rounded-lg shadow-sm max-w-lg prose">
                    ${message.imageUrl ? `<img src="${message.imageUrl}" alt="Imagem enviada" class="rounded-lg mb-2 max-w-full h-auto">` : ''}
                    ${message.text ? `<div>${marked.parse(message.text)}</div>` : ''}
                </div>
                <img src="${userAvatarUrl}" alt="Ícone do usuário" class="w-10 h-10 rounded-full bg-slate-200">
            `;
        } else {
            messageDiv.innerHTML = `
                <img src="${WILB_IMAGE_URL}" alt="Ícone do Wilb" class="w-10 h-10 rounded-full bg-slate-200">
                <div class="bg-white p-4 rounded-lg shadow-sm max-w-lg prose">${marked.parse(message.text)}</div>
            `;
        }

        chatWindow.appendChild(messageDiv);
        scrollToBottom();
        // Renderiza LaTeX com MathJax
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([messageDiv]);
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

    // --- API Communication ---
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

        const payload = {
            conversationHistory,
            prompt: newText,
            image: newBase64ImageData,
            mode: currentMode,
            seriousMode,
        };
        
        const language = localStorage.getItem('language') || 'pt-BR';

        const response = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': language
            },
            body: JSON.stringify({ ...payload, language })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("API Error Response Body:", errorBody);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();

        if (result && result.response) {
            // Salva no cache local se não tem imagem
            if (!newBase64ImageData) {
                localCache.set(newText, currentMode, result.response);
            }

            // Log se veio do cache do servidor
            if (result.cached) {
                console.log('Resposta veio do cache do servidor');
            }

            return result.response;
        }

        return "Não consegui gerar uma resposta.";
    };

    // --- Chat Management ---
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
        const userText = messageInput.value.trim();
        if (!userText && !imageBase64) return;

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

        // Esconde sugestões ao enviar a primeira mensagem
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
    };

    // --- Chat History Management ---
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

    const deleteChat = async (chatId) => {
        if (!confirm('Tem certeza que deseja excluir este chat?')) return;

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

    // --- SUGESTÕES ALEATÓRIAS ---
    const SUGGESTIONS = [
        'Me ajude a revisar matemática básica',
        'Como posso estudar melhor para provas?',
        'Explique a fotossíntese de forma simples',
        'Quais são dicas para organizar meus estudos?',
        'Me dê um exemplo de redação nota 1000',
        'Como funciona a Revolução Francesa?',
        'Sugira técnicas para memorizar conteúdos',
        'Qual a diferença entre mitose e meiose?',
        'Como criar um cronograma de estudos?',
        'Explique o que é energia cinética',
        'Como melhorar minha concentração?',
        'Me ajude com um exercício de física',
        'O que é um texto dissertativo?',
        'Como fazer um resumo eficiente?',
        'Me explique a tabela periódica',
        'Dicas para ENEM',
        'Como estudar redação?',
        'Como revisar conteúdos rapidamente?'
    ];

    function renderSuggestions() {
        const bar = document.getElementById('suggestions-bar');
        if (!bar) return;
        bar.innerHTML = '';
        const shuffled = SUGGESTIONS.sort(() => 0.5 - Math.random());
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

    // --- MODO DE CONVERSA (NORMAL/SÉRIO) ---
    let conversationStyle = 'normal';
    const modeSwitch = document.getElementById('mode-switch');
    if (modeSwitch) {
        modeSwitch.addEventListener('change', () => {
            conversationStyle = modeSwitch.checked ? 'serio' : 'normal';
        });
    }

    // Altera o modo de conversa enviado para o backend
    function getCurrentPromptMode() {
        // Se for modo sério, retorna 'serio', senão mantém selecionado
        if (conversationStyle === 'serio') return 'serio';
        return modeSelect.value;
    }

    // --- State Initialization ---
    const initializeState = () => {
        updateSendButtonState();
        showWelcomeMessage();
        renderSuggestions();
    };

    // --- Event Listeners ---
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

    // Login/Logout events
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

    // Chat events
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSendMessage();
    });

    messageInput.addEventListener('input', updateSendButtonState);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    imageUploadInput.addEventListener('change', handleImageUpload);
    removeImageBtn.addEventListener('click', removeImage);
    newChatBtn.addEventListener('click', startNewChat);

    // User menu dropdown
    userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenuDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!userMenuDropdown.contains(e.target) && !userMenuButton.contains(e.target)) {
            userMenuDropdown.classList.add('hidden');
        }
    });

    // Mobile menu toggle
    menuToggleBtn.addEventListener('click', () => {
        historyPanel.classList.toggle('-translate-x-full');
        historyOverlay.classList.toggle('hidden');
    });

    historyOverlay.addEventListener('click', () => {
        historyPanel.classList.add('-translate-x-full');
        historyOverlay.classList.add('hidden');
    });

    // History item clicks
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

            // Close mobile menu
            historyPanel.classList.add('-translate-x-full');
            historyOverlay.classList.add('hidden');
        }
    });

    // Context menu actions
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
                deleteChat(contextTargetId);
                break;
        }

        contextMenu.classList.add('hidden');
        contextTargetId = null;
    });

    // Close context menu on outside click
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.classList.add('hidden');
            contextTargetId = null;
        }
    });

    // Initialize app state
    initializeState();

    // --- Conversation Mode Logic ---
    const conversationModeSwitch = document.getElementById('conversation-mode-switch');
    const conversationModeLabel = document.getElementById('conversation-mode-label');

    const updateConversationModeLabel = () => {
        if (conversationModeSwitch.checked) {
            conversationModeLabel.textContent = 'Sério';
        } else {
            conversationModeLabel.textContent = 'Normal';
        }
    };

    // Load saved conversation mode preference
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
}

initializeFirebase();


// --- Dark Mode Logic ---
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

// Check for saved theme preference on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    enableDarkMode();
} else if (savedTheme === 'light') {
    disableDarkMode();
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // If no preference, check system preference
    enableDarkMode();
} else {
    disableDarkMode();
}

darkModeToggle.addEventListener('click', toggleDarkMode);