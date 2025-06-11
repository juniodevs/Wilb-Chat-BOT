// Importar estilos
import './style.css'

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

    // --- DOM Elements & Config ---
    const appContainer = document.getElementById('app-container');
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

    const WILB_IMAGE_URL = '/images/WilbAvatar.png'; // URL do avatar do Wilb
    const WILB_IMAGE_URL_ANON = '/images/WilbAvatarAnon.png'; // URL do avatar anônimo


    // --- State ---
    let currentUser = null;
    let imageBase64 = null;
    let currentChatId = null;
    let historyData = [];
    let currentMessages = [];
    let contextTargetId = null; 
    let draggedItemId = null;
    let unsubscribeHistory = null;

    const WILB_PERSONALITY = "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL:";

    const PROMPTS = {
        ajuda: `${WILB_PERSONALITY} PAPEL: Você é um tutor didático que ajuda com exercícios sem dar respostas diretas. Guie o aluno através de perguntas e dicas para que ele chegue à resposta sozinho. Seja paciente e encorajador.`,
        dicas: `${WILB_PERSONALITY} PAPEL: Você é um conselheiro de estudos que oferece técnicas de aprendizagem, organização e motivação. Foque em métodos práticos e personalizados para melhorar o desempenho acadêmico.`,
        resposta_direta: `${WILB_PERSONALITY} PAPEL: Você é uma enciclopédia precisa que fornece respostas diretas e objetivas. Seja claro, conciso e factual, mas mantenha o tom amigável.`,
        explicacao_profunda: `${WILB_PERSONALITY} PAPEL: Você é um especialista apaixonado que explica conceitos em detalhes. Use analogias, exemplos práticos e quebre tópicos complexos em partes digestíveis.`,
        correcao: `${WILB_PERSONALITY} PAPEL: Você é um professor de redação que corrige textos com cuidado. Aponte erros gramaticais, sugira melhorias de estilo e explique as correções de forma educativa.`
    };

    // --- Functions ---
    const scrollToBottom = () => chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });

    const showWelcomeMessage = () => {
         chatWindow.innerHTML = `<div class="flex items-start gap-3 justify-start mb-6 message-appear"><img src="${WILB_IMAGE_URL}" alt="Ícone do Wilb" class="w-10 h-10 rounded-full bg-slate-200"><div class="bg-white p-4 rounded-lg shadow-sm max-w-lg prose"><p>Oi! Eu sou o Wilb, seu companheiro de estudos 💜✨</p><p>Vamos arrasar juntos?</p></div></div>`;
    };

    const renderHistory = () => {
        historyList.innerHTML = '';
        const displayHistory = [...historyData].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

        if (displayHistory.length === 0) {
            if(currentUser && !currentUser.isAnonymous) {
                 historyList.innerHTML = `<div class="text-center text-sm text-slate-500 mt-4 px-2">Seu histórico aparecerá aqui.</div>`;
            } else if (currentUser && currentUser.isAnonymous) {
                 historyList.innerHTML = `<div class="text-center text-sm text-slate-500 mt-4 px-2">Seu histórico não é salvo no modo anônimo.</div>`;
            }
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

    const closeLoginModalBtn = document.getElementById('close-login-modal-btn');
    if (closeLoginModalBtn) {
        closeLoginModalBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    const updateUIForUser = (user) => {

        if (user) {
            // --- USUÁRIO LOGADO ---
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
            // --- USUÁRIO DESLOGADO ---
            loginModal.style.display = 'flex';

            userMenuButton.classList.add('hidden');
            userMenuButton.classList.remove('flex');
            anonWarning.classList.add('hidden');
            headerLoginBtn.classList.remove('hidden');
            headerLoginBtn.classList.add('flex');
        }
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
        };

        const chatsRef = collection(db, "users", currentUser.uid, "chats");
        const q = query(chatsRef, orderBy("createdAt", "desc"));
        
        unsubscribeHistory = onSnapshot(q, (querySnapshot) => {
            historyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderHistory();
        }, (error) => {
            console.error("Error loading history:", error);
            historyList.innerHTML = `<div class="p-4 text-center text-sm text-red-700 bg-red-100 rounded-lg">
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

    const updateSendButtonState = () => {
        sendBtn.disabled = !(messageInput.value.trim() || imageBase64);
    };

    const showEmptyChatMessage = () => {
        chatWindow.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center text-slate-500 message-appear">
            <i class="fa-regular fa-comments text-5xl mb-4"></i>
            <h3 class="text-lg font-semibold">Este chat está vazio.</h3>
            <p class="text-sm">Envie uma mensagem ou uma imagem para começar a conversa.</p>
        </div>`;
    };

    const loadChat = (chatId) => {
        const result = historyData.find(c => c.id === chatId);
        if (result) {
            currentChatId = chatId;
            currentMessages = result.messages || [];
            chatWindow.innerHTML = '';
            if (currentMessages.length > 0) {
                currentMessages.forEach(msg => displayMessage(msg));
            } else {
                showEmptyChatMessage();
            }
            renderHistory();
        }
    };

    const getGeminiResponse = async (conversationHistory, newText, newBase64ImageData) => {
        const currentMode = modeSelect.value;
        const payload = {
            conversationHistory,
            prompt: newText,
            image: newBase64ImageData,
            mode: currentMode
        };
        const response = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("API Error Response Body:", errorBody);
            throw new Error(`API request failed with status ${response.status}`);
        }
        const result = await response.json();
        if (result && result.response) {
            return result.response;
        } else {
            return "Não consegui gerar uma resposta.";
        }
    };

    const createNewChat = async (title, messages) => {
        if(!currentUser) return;
        
        const messagesToStore = messages.map(msg => ({ sender: msg.sender, text: msg.text, hasImage: msg.hasImage || false }));
        
        if(currentUser.isAnonymous) {
            const newChat = { id: `chat_${Date.now()}`, title, messages: messagesToStore, pinned: false, createdAt: new Date().toISOString() };
            historyData.unshift(newChat);
            localStorage.setItem(`anonymousHistory_${currentUser.uid}`, JSON.stringify(historyData));
            currentChatId = newChat.id;
            renderHistory();
        } else {
             const docRef = await addDoc(collection(db, "users", currentUser.uid, "chats"), { title, messages: messagesToStore, pinned: false, createdAt: serverTimestamp() });
            currentChatId = docRef.id;
        }
    };

    const updateChat = async (chatId, messages) => {
        if(!currentUser) return;
        
        const messagesToStore = messages.map(msg => ({ sender: msg.sender, text: msg.text, hasImage: msg.hasImage || false }));
        
        if (currentUser.isAnonymous) {
            const chatIndex = historyData.findIndex(c => c.id === chatId);
            if(chatIndex > -1) {
                historyData[chatIndex].messages = messagesToStore;
                localStorage.setItem(`anonymousHistory_${currentUser.uid}`, JSON.stringify(historyData));
            }
        } else {
            const chatDocRef = doc(db, "users", currentUser.uid, "chats", chatId);
            await updateDoc(chatDocRef, { messages: messagesToStore });
        }
    };

    const displayMessage = (message) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start gap-3 mb-6 message-appear ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`;

        if (message.sender === 'user') {
            const userAvatarUrl = currentUser?.photoURL || WILB_IMAGE_URL_ANON;

            messageDiv.innerHTML = `
                <div class="bg-purple-600 text-white p-4 rounded-lg shadow-sm max-w-lg">
                    ${message.imageUrl ? `<img src="${message.imageUrl}" alt="Imagem enviada" class="rounded-lg mb-2 max-w-full h-auto">` : ''}
                    ${message.text ? `<p>${message.text}</p>` : ''}
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

    const handleSendMessage = async () => {
        const userText = messageInput.value.trim();
        if (!userText && !imageBase64) return;
        if (chatWindow.querySelector('.prose') || chatWindow.querySelector('.fa-comments')) chatWindow.innerHTML = '';
        
        const messageForDisplay = { sender: 'user', text: userText, imageUrl: imageBase64 ? imagePreview.src : null, hasImage: !!imageBase64 };
        const historyForApi = [...currentMessages];
        currentMessages.push(messageForDisplay);
        displayMessage(messageForDisplay);

        const tempImageBase64 = imageBase64;
        messageInput.value = '';
        removeImage();
        updateSendButtonState();

        showTypingIndicator();

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
            const errorMessage = { sender: 'assistant', text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.' };
            currentMessages.push(errorMessage);
            displayMessage(errorMessage);
        }
    };

    // Função para renomear chat
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

    // Função para deletar chat
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

    // Função para fixar/desfixar chat
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

    // Event Listeners
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

    // Initialize app
    updateSendButtonState();
    showWelcomeMessage();
}

initializeFirebase();