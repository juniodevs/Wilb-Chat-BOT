# Assistente de Estudos IA - Vite + Node.js

Um assistente de estudos inteligente construído com Vite, Node.js, Express e integração com Firebase e Google Gemini.

## 🚀 Características

- **Interface moderna**: Construída com Vite, Tailwind CSS e JavaScript vanilla
- **Servidor unificado**: Express.js servindo tanto frontend quanto APIs
- **IA integrada**: Powered by Google Gemini para respostas inteligentes
- **Autenticação**: Firebase Auth com Google e modo anônimo
- **Múltiplos modos**: Ajuda com exercícios, dicas de estudo, explicações profundas, etc.
- **Upload de imagens**: Análise de imagens pela IA
- **Histórico persistente**: Salvo no Firestore ou localStorage

## 📦 Instalação

1. Clone ou extraia o projeto
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente no arquivo `.env` (já configurado)

4. Execute o projeto:
```bash
# Desenvolvimento (servidor + cliente)
npm run dev

# Ou execute apenas o servidor
npm run dev:server

# Ou apenas o cliente Vite
npm run dev:client
```

## 🏗️ Build e Produção

```bash
# Build do frontend
npm run build

# Executar em produção
npm start
```

## 📁 Estrutura do Projeto

```
assistente-estudos-vite/
├── src/                    # Código fonte do frontend
│   ├── main.js            # JavaScript principal
│   └── style.css          # Estilos CSS
├── server/                # Servidor Express
│   └── index.js          # Servidor principal
├── public/                # Arquivos estáticos (imagens, fontes, etc.)
│   ├── images/           # Imagens do projeto
├── dist/                 # Build de produção (gerado)
├── index.html           # HTML principal
├── vite.config.js       # Configuração do Vite
├── package.json         # Dependências e scripts
└── .env                 # Variáveis de ambiente
```

## 🔧 APIs Disponíveis

- `GET /api/health` - Status do servidor
- `GET /api/info` - Informações do sistema
- `GET /api/config` - Configurações do cliente
- `GET /api/stats` - Estatísticas de uso
- `POST /api/gemini/generate` - Proxy para API Gemini (opcional)

## 🌐 Tecnologias Utilizadas

- **Frontend**: Vite, JavaScript ES6+, Tailwind CSS, Font Awesome
- **Backend**: Node.js, Express.js
- **IA**: Google Gemini API
- **Autenticação**: Firebase Auth
- **Banco de dados**: Firestore
- **Build**: Vite
- **Estilo**: Tailwind CSS

## 👨‍💻 Desenvolvido por

**Júnior Veras**

## 📄 Licença

MIT License

