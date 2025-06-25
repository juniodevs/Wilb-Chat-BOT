# WilbChatBOT – Assistente de Estudos com IA

<p align="center">
    <img src="./public/images/WilbAvatar.png" alt="WilbChatBOT Logo" width="120" />
</p>

**Versão 1.0.0 (Beta)** | **Desenvolvido por Júnior Veras**

O **WilbChatBOT** é um assistente de estudos inteligente construído com tecnologias modernas como Vite, Node.js, Express, Firebase e integração com o Google Gemini.

> **Este projeto ainda está em fase Beta. Algumas funcionalidades podem sofrer alterações e melhorias.**

Este projeto oferece uma experiência de aprendizado personalizada e interativa, combinando inteligência artificial avançada e funcionalidades adaptáveis para estudantes. Personificado pelo carismático Wilb — um simpático personagem com chapéu de cangaceiro — o bot fornece suporte acadêmico em diversas disciplinas, ajustando seu tom e abordagem conforme as preferências do usuário.

---

> **Este projeto é open source e aceita contribuições!**
> **A marca Wilb é propriedade da WEBB CENTER® – todos os direitos reservados.**

---

## 🚀 Funcionalidades

* **Interface moderna**: Construída com Vite, Tailwind CSS e JavaScript puro
* **Servidor unificado**: Express.js servindo o frontend e as APIs
* **IA integrada**: Respostas inteligentes com Google Gemini
* **Autenticação**: Login com Google ou modo anônimo via Firebase Auth
* **Modos personalizados**: Ajuda com exercícios, explicações, dicas de estudo e muito mais
* **Upload de imagens**: Análise de imagens pela IA
* **Histórico persistente**: Armazenamento via Firestore ou localStorage

---

## 🛣️ Roadmap

* [x] Configuração inicial com Vite e Node.js
* [x] Integração com Firebase Auth
* [x] Implementação de APIs básicas (`info`, `config`)
* [x] Integração com a API do Google Gemini
* [x] Upload e análise de imagens
* [x] Interface com Tailwind CSS
* [x] Histórico de perguntas e respostas
* [x] Modos de estudo variados (exercícios, dicas, explicações)
* [x] Sistema de cache para respostas da IA (em testes)
* [x] Dark Mode
* [x] Suporte a múltiplos idiomas
* [X] Autenticação avançada (e-mail/senha, etc.)

---

### Em andamento e próximas entregas

* [ ] Implementação de design responsivo
* [ ] Melhorias na interface e usabilidade
* [ ] Correções de bugs e melhorias de segurança
* [ ] Testes unitários e de integração
* [ ] Documentação completa do código
* [ ] Otimização de performance e segurança
* [ ] Suporte a mais idiomas
* [ ] Sistema de feedback dos usuários
* [ ] Notificações em tempo real
* [ ] Painel administrativo
* [ ] Sons e animações (com acessibilidade e opção de desativar)

### Opcionais (futuras versões)

* [ ] Integração com plataformas de ensino (Moodle, Google Classroom, etc.)
* [ ] Modo de estudo colaborativo
* [ ] Suporte a plugins e extensões
* [ ] Análise de desempenho do usuário
* [ ] Integração com outras APIs educacionais
* [ ] Integração com governos e instituições educacionais

---

## 📦 Instalação

1. Clone ou extraia o repositório:

   ```bash
   git clone https://github.com/seu-usuario/wilbchatbot.git
   cd wilbchatbot
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente no arquivo `.env` (já incluído com valores padrão)

4. Execute o projeto:

   ```bash
   # Desenvolvimento (servidor + cliente)
   npm run dev

   # Ou apenas o servidor
   npm run dev:server

   # Ou apenas o cliente
   npm run dev:client
   ```

---

## 🏗️ Build e Produção

```bash
# Gerar build do frontend
npm run build

# Rodar em ambiente de produção
npm start
```

---

## 📁 Estrutura do Projeto

```
wilbchatbot/
├── src/                 # Código-fonte do frontend
│   ├── main.js
│   └── style.css
├── netlify/functions/   # Funções serverless (API)
│   └── api.js
├── public/              # Arquivos estáticos
│   └── images/
├── dist/                # Arquivos de build (gerados)
├── index.html           # Entrada principal
├── vite.config.js       # Configuração do Vite
├── package.json         # Dependências e scripts
├── netlify.toml         # Configuração de deploy e rotas
└── .env                 # Variáveis de ambiente
```

---

## 🔧 Endpoints Disponíveis

* `GET /api/info` – Retorna informações do sistema
* `GET /api/config` – Retorna configurações do bot
* `GET /api/health` – Healthcheck da API
* `GET /api/stats` – Estatísticas do cache
* `POST /api/gemini/generate` – Geração de resposta IA

---

## 🌐 Tecnologias Utilizadas

* **Frontend**: Vite, JavaScript ES6+, Tailwind CSS, Font Awesome
* **Backend/API**: Node.js, Express.js, Netlify Functions
* **IA**: Google Gemini API
* **Autenticação**: Firebase Auth
* **Banco de Dados**: Firestore
* **Build**: Vite
* **Deploy**: Netlify (funções serverless)

---

## ⚙️ Observações sobre a API e Deploy

- O backend agora é focado apenas em API, não servindo mais arquivos estáticos do frontend.
- O roteamento e deploy são feitos via Netlify Functions, conforme configurado em `netlify.toml`.
- O frontend é servido diretamente da pasta `dist` após o build.
- As rotas da API são acessíveis via `/api/*` e o SPA é roteado corretamente para `index.html`.
- Imports não utilizados e middlewares de arquivos estáticos foram removidos da função API para otimizar o bundle serverless.

---

## 👨‍💻 Desenvolvido por

[Júnior Veras](https://www.linkedin.com/in/juniorveras/)

---

## 🎨 Artes do Projeto

As artes e ilustrações do WilbChatBOT foram criadas pelo meu amigo [Israel Oliveira](https://www.instagram.com/israeloliveira003/). Agradeço pela colaboração e talento!

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

---

## 🤝 Como Contribuir

1. Faça um fork do repositório
2. Crie uma branch: `git checkout -b minha-feature`
3. Faça suas alterações e commit: `git commit -m 'feat: minha nova feature'`
4. Envie para seu fork: `git push origin minha-feature`
5. Abra um Pull Request explicando sua contribuição

Contribuições de código, documentação, ideias e feedback são sempre bem-vindos!

---

## 🛡️ Direitos de Marca

A marca **Wilb** é registrada e pertence ao **WEBB CENTER®**. O uso comercial ou redistribuição sem autorização prévia é estritamente proibido.
