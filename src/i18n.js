import { translations } from './locales/translations.js';

export function getCurrentLanguage() {
    const savedLanguage = localStorage.getItem('language');

    if (savedLanguage && translations[savedLanguage]) {
        return savedLanguage;
    }

    return 'pt-br';
}

export function getTranslation(key) {
    const currentLanguage = getCurrentLanguage();
    return translations[currentLanguage][key] || translations['pt-br'][key] || key;
}

export function updateLanguageUI() {
    const currentLanguage = getCurrentLanguage();

    const languageDropdown = document.getElementById('language-dropdown');
    if (languageDropdown) {
        languageDropdown.value = currentLanguage;
    }

    updateStaticTexts(currentLanguage);

    updatePlaceholders(currentLanguage);

    updateButtonsAndLabels(currentLanguage);

    updateWarningMessages(currentLanguage);

    updateInteractionModeOptions(currentLanguage);

    updateWelcomeMessage(currentLanguage);

    const deleteChatTitle = document.getElementById('delete-chat-title');
    const deleteChatMessage = document.getElementById('delete-chat-message');
    const deleteChatYes = document.getElementById('delete-chat-yes-btn');
    const deleteChatNo = document.getElementById('delete-chat-no-btn');
    if (deleteChatTitle) deleteChatTitle.textContent = getTranslation('deleteChatTitle');
    if (deleteChatMessage) deleteChatMessage.textContent = getTranslation('deleteChatMessage');
    if (deleteChatYes) deleteChatYes.textContent = getTranslation('deleteChatYes');
    if (deleteChatNo) deleteChatNo.textContent = getTranslation('deleteChatNo');
}

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
        { selector: 'footer a:last-child', key: 'reportBug' },
        { selector: '#github-link-text', key: 'githubLink' },
        { selector: '#github-link-text-mobile', key: 'githubLink' }
    ];

    elements.forEach(({ selector, key, text }) => {
        const element = document.querySelector(selector);
        if (element) {
            if (selector === 'footer span:first-child' && key === 'createdBy') {

                const link = element.querySelector('a');
                if (link) {

                    while (element.firstChild && element.firstChild !== link) {
                        element.removeChild(element.firstChild);
                    }

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

function updatePlaceholders(language) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.placeholder = getTranslation('chatPlaceholder');
    }
}

function updateButtonsAndLabels(language) {

    const loginGoogleBtn = document.querySelector('#login-google-btn span');
    if (loginGoogleBtn) {
        loginGoogleBtn.textContent = getTranslation('loginWithGoogle');
    }

    const loginAnonBtn = document.getElementById('login-anon-btn');
    if (loginAnonBtn) {
        loginAnonBtn.textContent = getTranslation('continueAnonymously');
    }

    const modalTitle = document.querySelector('#login-modal h2');
    if (modalTitle) {
        modalTitle.textContent = getTranslation('welcomeToAssistant');
    }

    const modalDescription = document.querySelector('#login-modal p');
    if (modalDescription) {
        modalDescription.textContent = getTranslation('loginPrompt');
    }

    const headerLoginBtn = document.querySelector('#header-login-btn span');
    if (headerLoginBtn) {
        headerLoginBtn.textContent = getTranslation('login');
    }

    const logoutBtn = document.querySelector('#logout-btn span');
    if (logoutBtn) {
        logoutBtn.textContent = getTranslation('signOut');
    }

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

    updateLanguageOptions(language);

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

    const forgotPasswordBtn = document.getElementById('show-forgot-password-modal');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.textContent = getTranslation('forgotPasswordBtn') || 'Esqueceu a senha?';
    }
}

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

function updateWarningMessages(language) {
    const anonWarning = document.getElementById('anon-warning');
    if (anonWarning) {
        anonWarning.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${getTranslation('youAreAnonymous')}`;
    }
}

function updateInteractionModeOptions(language) {
    const modeSelect = document.getElementById('interaction-mode-select');
    if (modeSelect) {
        const modeKeys = [
            'directAnswerMode',
            'helpMode',
            'tipsMode',
            'deepExplanationMode',
            'correctionMode'
        ];
        const modeValues = [
            'resposta_direta',
            'ajuda',
            'dicas',
            'explicacao_profunda',
            'correcao'
        ];
        const modeEmojis = [
            '⚡',
            '📝',
            '💡',
            '🔬',
            '✍️'
        ];

        modeSelect.innerHTML = '';
        modeKeys.forEach((key, idx) => {
            const option = document.createElement('option');
            option.value = modeValues[idx];
            option.textContent = `${modeEmojis[idx]} ${getTranslation('mode')} ${getTranslation(key)}`;
            if (idx === 0) option.selected = true;
            modeSelect.appendChild(option);
        });
    }
}

function updateWelcomeMessage(language) {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow && chatWindow.innerHTML.includes('Oi! Eu sou o Wilb')) {

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

export function setupLanguageChangeListener() {
    const languageDropdown = document.getElementById('language-dropdown');
    if (languageDropdown) {
        languageDropdown.addEventListener('change', (e) => {
            const selectedLanguage = e.target.value;
            localStorage.setItem('language', selectedLanguage);

            showSkeletonLoader();
            setTimeout(() => {
                window.location.reload();
            }, 600);
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

    addSkeletonsToMainBlocks();
}

function removeWilbSplashSkeleton() {
    const overlay = document.getElementById('wilb-skeleton-overlay');
    if (overlay) overlay.remove();
    removeSkeletonsFromMainBlocks();
}

function addSkeletonsToMainBlocks() {

    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
        chatWindow.innerHTML = `<div class="skeleton" style="height: 120px; width: 100%; margin-bottom: 16px;"></div>
        <div class="skeleton" style="height: 80px; width: 80%; margin-bottom: 12px;"></div>
        <div class="skeleton" style="height: 40px; width: 60%;"></div>`;
    }

    const historyList = document.getElementById('history-list');
    if (historyList) {
        historyList.innerHTML = `<div class="skeleton" style="height: 32px; width: 90%; margin-bottom: 8px;"></div>
        <div class="skeleton" style="height: 32px; width: 70%; margin-bottom: 8px;"></div>
        <div class="skeleton" style="height: 32px; width: 80%;"></div>`;
    }

    const suggestionsBar = document.getElementById('suggestions-bar');
    if (suggestionsBar) {
        suggestionsBar.innerHTML = `<div class="skeleton" style="height: 32px; width: 120px; margin-right: 8px;"></div>
        <div class="skeleton" style="height: 32px; width: 100px;"></div>`;
    }

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

    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) chatWindow.innerHTML = '';

    const historyList = document.getElementById('history-list');
    if (historyList) historyList.innerHTML = '';

    const suggestionsBar = document.getElementById('suggestions-bar');
    if (suggestionsBar) suggestionsBar.innerHTML = '';

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

export function initializeI18n() {

    const currentLanguage = getCurrentLanguage();
    localStorage.setItem('language', currentLanguage);

    updateLanguageUI();

    setupLanguageChangeListener();
}