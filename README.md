# Assistente de Estudos IA - Vite + Node.js

Um assistente de estudos inteligente construído com Vite, Node.js, Express e integração com Firebase e Google Gemini.

---

> **Este projeto é Open Source e aceita contribuições!**
> 
> **A marca Wilb pertence ao WEBB CENTER® com todos os direitos reservados.**

---

## 🚀 Características

- **Interface moderna**: Construída com Vite, Tailwind CSS e JavaScript vanilla
- **Servidor unificado**: Express.js servindo tanto frontend quanto APIs
- **IA integrada**: Powered by Google Gemini para respostas inteligentes
- **Autenticação**: Firebase Auth com Google e modo anônimo
- **Múltiplos modos**: Ajuda com exercícios, dicas de estudo, explicações profundas, etc.
- **Upload de imagens**: Análise de imagens pela IA
- **Histórico persistente**: Salvo no Firestore ou localStorage

## 🛣️ Roadmap
- [x] Configuração inicial do projeto com Vite e Node.js
- [x] Integração com Firebase Auth
- [x] Implementação de APIs básicas (status, info, config, stats)
- [x] Integração com Google Gemini API
- [x] Implementação de upload de imagens
- [x] Criação de interface com Tailwind CSS
- [x] Implementação de histórico de perguntas e respostas
- [x] Implementação de modos de estudo (exercícios, dicas, explicações)

- Apartir daqui, o projeto está nas mãos de quem quiser contribuir!

- [X] Implementação de um sistema de cache para respostas da IA (não testado)
- [ ] Correção de Segurança e Bugs
- [ ] Implementar Sons e Animações
- [ ] Responsividade total para dispositivos móveis
- [ ] Melhorias na interface e usabilidade
- [ ] Adição de testes unitários e de integração
- [ ] Documentação completa do código
- [ ] Implementação de autenticação avançada (email/senha, etc.)
- [ ] Otimização de performance e segurança
- [ ] Implementação de notificações em tempo real
- [ ] Suporte a múltiplos idiomas
- [ ] Implementação de um painel administrativo
- [ ] Melhoria na análise de imagens com IA
- [ ] Implementação de um sistema de feedback dos usuários

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
├── src/                 # Código fonte do frontend
│   ├── main.js          # JavaScript principal
│   └── style.css        # Estilos CSS
├── server/              # Servidor Express
│   └── index.js         # Servidor principal
├── public/              # Arquivos estáticos (imagens, fontes, etc.)
│   ├── images/          # Imagens do projeto
├── dist/                # Build de produção (gerado)
├── index.html           # HTML principal
├── vite.config.js       # Configuração do Vite
├── package.json         # Dependências e scripts
└── .env                 # Variáveis de ambiente
```

## 🔧 APIs Disponíveis

- `GET /api/health` - Status do servidor
- `GET /api/info` - Informações do sistema
- `GET /api/stats` - Estatísticas de uso

## 🌐 Tecnologias Utilizadas

- **Frontend**: Vite, JavaScript ES6+, Tailwind CSS, Font Awesome
- **Backend**: Node.js, Express.js
- **IA**: Google Gemini API
- **Autenticação**: Firebase Auth
- **Banco de dados**: Firestore
- **Build**: Vite
- **Estilo**: Tailwind CSS

## 👨‍💻 Desenvolvido por

[Júnior Veras](https://www.linkedin.com/in/juniorveras/)

## 📄 Licença

MIT License

## 🤝 Como Contribuir

1. Faça um fork deste repositório
2. Crie uma branch para sua feature ou correção: `git checkout -b minha-feature`
3. Commit suas alterações: `git commit -m 'feat: minha nova feature'`
4. Push para o seu fork: `git push origin minha-feature`
5. Abra um Pull Request explicando sua contribuição

Contribuições de código, documentação, sugestões e feedbacks são muito bem-vindos!

## 🛡️ Direitos de Marca

A marca **Wilb** pertence ao **WEBB CENTER®**. Todos os direitos reservados. O uso da marca para fins comerciais sem autorização é proibido.