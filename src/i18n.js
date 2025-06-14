import { translations } from './locales/translations.js';

// Função para obter o idioma atual do localStorage com fallback para pt-br
export function getCurrentLanguage() {
    const savedLanguage = localStorage.getItem('language');
    // Validar se o idioma salvo é válido
    if (savedLanguage && translations[savedLanguage]) {
        return savedLanguage;
    }
    // Fallback para pt-br se não houver idioma salvo ou se for inválido
    return 'pt-br';
}

// Função para obter uma tradução específica
export function getTranslation(key) {
    const currentLanguage = getCurrentLanguage();
    return translations[currentLanguage][key] || translations['pt-br'][key] || key;
}

// Função centralizada para atualizar toda a UI com base no idioma atual
export function updateLanguageUI() {
    const currentLanguage = getCurrentLanguage();
    
    // Atualizar o dropdown de idioma
    const languageDropdown = document.getElementById('language-dropdown');
    if (languageDropdown) {
        languageDropdown.value = currentLanguage;
    }

    // Atualizar textos estáticos da interface
    updateStaticTexts(currentLanguage);
    
    // Atualizar placeholders
    updatePlaceholders(currentLanguage);
    
    // Atualizar botões e labels
    updateButtonsAndLabels(currentLanguage);
    
    // Atualizar mensagens de aviso
    updateWarningMessages(currentLanguage);
    
    // Atualizar opções do select de modo de interação
    updateInteractionModeOptions(currentLanguage);
    
    // Atualizar mensagem de boas-vindas se estiver sendo exibida
    updateWelcomeMessage(currentLanguage);
}

// Função para atualizar textos estáticos
function updateStaticTexts(language) {
    const elements = [
        { id: 'dropdown-user-name', key: 'signOut', selector: '#logout-btn span' },
        { selector: 'header h1', text: 'Wilb' },
        { selector: 'header p', key: 'withYourFriend' },
        { selector: '#dark-mode-toggle span', key: 'darkMode' },
        { selector: '#language-selector label', key: 'language' },
        { selector: '#history-panel h2', key: 'history' },
        { selector: 'footer span:first-child', key: 'createdBy' },
        { selector: 'footer span:nth-child(2)', key: 'checkResponses' },
        { selector: 'footer a:last-child', key: 'reportBug' }
    ];

    elements.forEach(({ selector, key, text }) => {
        const element = document.querySelector(selector);
        if (element) {
            if (selector === 'footer span:first-child' && key === 'createdBy') {
                // Atualiza o texto para (Júnior Veras), mantendo o <a>
                const link = element.querySelector('a');
                if (link) {
                    // Remove todos os nós de texto antes do link
                    while (element.firstChild && element.firstChild !== link) {
                        element.removeChild(element.firstChild);
                    }
                    // Atualiza o texto antes do link
                    element.insertBefore(document.createTextNode('Criado por '), link);
                } else {
                    element.textContent = '(Júnior Veras)';
                }
            } else if (text) {
                element.textContent = text;
            } else if (key) {
                element.textContent = getTranslation(key);
            }
        }
    });
}

// Função para atualizar placeholders
function updatePlaceholders(language) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.placeholder = getTranslation('chatPlaceholder');
    }
}

// Função para atualizar botões e labels
function updateButtonsAndLabels(language) {
    // Botões do modal de login
    const loginGoogleBtn = document.querySelector('#login-google-btn span');
    if (loginGoogleBtn) {
        loginGoogleBtn.textContent = getTranslation('loginWithGoogle');
    }

    const loginAnonBtn = document.getElementById('login-anon-btn');
    if (loginAnonBtn) {
        loginAnonBtn.textContent = getTranslation('continueAnonymously');
    }

    // Título e descrição do modal de login
    const modalTitle = document.querySelector('#login-modal h2');
    if (modalTitle) {
        modalTitle.textContent = getTranslation('welcomeToAssistant');
    }

    const modalDescription = document.querySelector('#login-modal p');
    if (modalDescription) {
        modalDescription.textContent = getTranslation('loginPrompt');
    }

    // Botão de entrar no header
    const headerLoginBtn = document.querySelector('#header-login-btn span');
    if (headerLoginBtn) {
        headerLoginBtn.textContent = getTranslation('login');
    }

    // Botão de logout
    const logoutBtn = document.querySelector('#logout-btn span');
    if (logoutBtn) {
        logoutBtn.textContent = getTranslation('signOut');
    }

    // Menu de contexto
    const contextMenuButtons = document.querySelectorAll('#context-menu button');
    const contextActions = ['rename', 'pin', 'delete'];
    contextMenuButtons.forEach((btn, index) => {
        if (contextActions[index]) {
            const span = btn.querySelector('span') || btn.childNodes[btn.childNodes.length - 1];
            if (span) {
                span.textContent = ` ${getTranslation(contextActions[index])}`;
            }
        }
    });

    // Atualizar opções do dropdown de idioma
    updateLanguageOptions(language);

    // Modal Esqueceu a Senha
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    if (forgotPasswordModal) {
        const title = forgotPasswordModal.querySelector('h2');
        if (title) title.textContent = getTranslation('forgotPasswordTitle');
        const desc = forgotPasswordModal.querySelector('p');
        if (desc) desc.textContent = getTranslation('forgotPasswordDescription');
        const emailInput = forgotPasswordModal.querySelector('input#forgot-email');
        if (emailInput) emailInput.placeholder = getTranslation('forgotPasswordEmailLabel');
        const emailLabel = forgotPasswordModal.querySelector('label[for="forgot-email"]');
        if (emailLabel) emailLabel.textContent = getTranslation('forgotPasswordEmailLabel');
        const sendBtn = forgotPasswordModal.querySelector('button[type="submit"]');
        if (sendBtn) sendBtn.textContent = getTranslation('forgotPasswordSendBtn');
        const backBtn = forgotPasswordModal.querySelector('#back-to-login-modal');
        if (backBtn) backBtn.textContent = getTranslation('forgotPasswordBackBtn');
    }

    // Botão 'Esqueceu a senha?' no modal de login com email
    const forgotPasswordBtn = document.getElementById('show-forgot-password-modal');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.textContent = getTranslation('forgotPasswordBtn') || 'Esqueceu a senha?';
    }
}

// Função para atualizar opções do dropdown de idioma
function updateLanguageOptions(language) {
    const languageOptions = document.querySelectorAll('#language-dropdown option');
    languageOptions.forEach(option => {
        if (option.value === 'pt-br') {
            option.textContent = getTranslation('portuguese');
        } else if (option.value === 'en') {
            option.textContent = getTranslation('english');
        }
    });
}

// Função para atualizar mensagens de aviso
function updateWarningMessages(language) {
    const anonWarning = document.getElementById('anon-warning');
    if (anonWarning) {
        anonWarning.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${getTranslation('youAreAnonymous')}`;
    }
}

// Função para atualizar opções do select de modo de interação
function updateInteractionModeOptions(language) {
    const modeSelect = document.getElementById('interaction-mode-select');
    if (modeSelect) {
        const options = modeSelect.querySelectorAll('option');
        const modeKeys = ['helpMode', 'tipsMode', 'directAnswerMode', 'deepExplanationMode', 'correctionMode'];
        
        options.forEach((option, index) => {
            if (modeKeys[index]) {
                option.textContent = `${getTranslation('mode')} ${getTranslation(modeKeys[index])}`;
            }
        });
    }
}

// Função para atualizar a mensagem de boas-vindas
function updateWelcomeMessage(language) {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow && chatWindow.innerHTML.includes('Oi! Eu sou o Wilb')) {
        // Se a mensagem de boas-vindas estiver sendo exibida, atualizá-la
        const welcomeText = getTranslation('welcome').split('\n');
        chatWindow.innerHTML = `
            <div class="flex items-start gap-3 justify-start mb-6 message-appear">
                <img src="/images/WilbAvatar.png" alt="Ícone do Wilb" class="w-10 h-10 rounded-full bg-slate-200">
                <div class="bg-white p-4 rounded-lg shadow-sm max-w-lg prose">
                    <p>${welcomeText[0]}</p>
                    <p>${welcomeText[1]}</p>
                </div>
            </div>`;
    }
}

// Função para configurar o listener de mudança de idioma
export function setupLanguageChangeListener() {
    const languageDropdown = document.getElementById('language-dropdown');
    if (languageDropdown) {
        languageDropdown.addEventListener('change', (e) => {
            const selectedLanguage = e.target.value;
            localStorage.setItem('language', selectedLanguage);
            // Exibir skeleton antes do reload
            showSkeletonLoader();
            setTimeout(() => {
                window.location.reload();
            }, 600); // Pequeno delay para o skeleton aparecer
        });
    }
}

function showSkeletonLoader() {
    if (document.getElementById('wilb-skeleton-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'wilb-skeleton-overlay';
    overlay.innerHTML = `
      <img id="wilb-skeleton-img" src="/images/WilbAvatar.png" alt="Wilb girando" />
      <div id="wilb-skeleton-text">Carregando...</div>
    `;
    document.body.appendChild(overlay);
}

// Exibe o skeleton Wilb ao abrir a página pela primeira vez
window.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('wilbSplashShown')) {
        showWilbSplashSkeleton();
        setTimeout(() => {
            removeWilbSplashSkeleton();
            sessionStorage.setItem('wilbSplashShown', '1');
        }, 2000);
    }
});

function showWilbSplashSkeleton() {
    if (document.getElementById('wilb-skeleton-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'wilb-skeleton-overlay';
    overlay.innerHTML = `
      <img id="wilb-skeleton-img" src="/images/WilbAvatar.png" alt="Wilb girando" />
      <div id="wilb-skeleton-text">Carregando...</div>
    `;
    document.body.appendChild(overlay);
    // Adiciona skeletons nos principais blocos
    addSkeletonsToMainBlocks();
}

function removeWilbSplashSkeleton() {
    const overlay = document.getElementById('wilb-skeleton-overlay');
    if (overlay) overlay.remove();
    removeSkeletonsFromMainBlocks();
}

function addSkeletonsToMainBlocks() {
    // Chat window
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
        chatWindow.innerHTML = `<div class="skeleton" style="height: 120px; width: 100%; margin-bottom: 16px;"></div>
        <div class="skeleton" style="height: 80px; width: 80%; margin-bottom: 12px;"></div>
        <div class="skeleton" style="height: 40px; width: 60%;"></div>`;
    }
    // History panel
    const historyList = document.getElementById('history-list');
    if (historyList) {
        historyList.innerHTML = `<div class="skeleton" style="height: 32px; width: 90%; margin-bottom: 8px;"></div>
        <div class="skeleton" style="height: 32px; width: 70%; margin-bottom: 8px;"></div>
        <div class="skeleton" style="height: 32px; width: 80%;"></div>`;
    }
    // Sugestões
    const suggestionsBar = document.getElementById('suggestions-bar');
    if (suggestionsBar) {
        suggestionsBar.innerHTML = `<div class="skeleton" style="height: 32px; width: 120px; margin-right: 8px;"></div>
        <div class="skeleton" style="height: 32px; width: 100px;"></div>`;
    }
    // Input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.classList.add('skeleton');
        messageInput.disabled = true;
    }
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.classList.add('skeleton');
        sendBtn.disabled = true;
    }
}

function removeSkeletonsFromMainBlocks() {
    // Chat window
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) chatWindow.innerHTML = '';
    // History panel
    const historyList = document.getElementById('history-list');
    if (historyList) historyList.innerHTML = '';
    // Sugestões
    const suggestionsBar = document.getElementById('suggestions-bar');
    if (suggestionsBar) suggestionsBar.innerHTML = '';
    // Input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.classList.remove('skeleton');
        messageInput.disabled = false;
    }
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.classList.remove('skeleton');
        sendBtn.disabled = false;
    }
}

// Função para inicializar o sistema de i18n
export function initializeI18n() {
    // Garantir que o idioma padrão seja pt-br se não houver nada salvo
    const currentLanguage = getCurrentLanguage();
    localStorage.setItem('language', currentLanguage);
    
    // Atualizar a UI com o idioma atual
    updateLanguageUI();
    
    // Configurar o listener para mudanças de idioma
    setupLanguageChangeListener();
}