const WILB_LOADING_IMAGE = '/images/WilbAvatar.png';

function setTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }

    // Atualizar texto do botão
    const toggleButton = document.getElementById('dark-mode-toggle');
    if (toggleButton) {
        const icon = toggleButton.querySelector('i');
        const text = toggleButton.querySelector('span');
        
        icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        text.textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
    }
}

function getPreferredTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function initThemeTransition() {
    const themeToggle = document.getElementById('dark-mode-toggle');
    const app = document.getElementById('app-container');
    
    // Inicializar o tema
    setTheme(getPreferredTheme());
    
    // Criar o overlay de transição
    const overlay = document.createElement('div');
    overlay.id = 'theme-transition-overlay';
    document.body.appendChild(overlay);    // Criar o elemento de loading do Wilb
    const wilbLoading = document.createElement('div');
    wilbLoading.id = 'wilb-loading';
    wilbLoading.style.backgroundImage = `url(${WILB_LOADING_IMAGE})`;
    overlay.appendChild(wilbLoading);

    if (themeToggle) {
        themeToggle.addEventListener('click', async () => {            // Ativar o overlay e blur
            app.classList.add('theme-transitioning');
            overlay.classList.add('active');

            // Esperar o overlay aparecer completamente
            await new Promise(resolve => setTimeout(resolve, 800));

            // Trocar o tema
            const newTheme = !document.body.classList.contains('dark-mode');
            setTheme(newTheme);

            // Esperar a troca de tema completar
            await new Promise(resolve => setTimeout(resolve, 500));

            // Remover o overlay e o blur
            overlay.classList.remove('active');
            app.classList.remove('theme-transitioning');
        });
    }

    // Observar mudanças no sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches);
        }
    });
}
