import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configurar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos do build do Vite
app.use(express.static(path.join(__dirname, '../dist')));

// Rotas da API
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Servidor do Assistente de Estudos IA funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Rota para informações do sistema
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Assistente de Estudos IA - Wilb',
        version: '1.0.0',
        description: 'Assistente de estudos com IA integrada',
        author: 'Júnior Veras',
        features: [
            'Chat com IA (Gemini)',
            'Múltiplos modos de interação',
            'Upload de imagens',
            'Histórico de conversas',
            'Autenticação Firebase',
            'Modo anônimo',
            'Configurações personalizáveis'
        ]
    });
});

// Rota para configurações do cliente
app.get('/api/config', (req, res) => {
    res.json({
        firebase: {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
        }
    });
});

// Rota para proxy da API do Gemini (opcional, para maior segurança)
app.post('/api/gemini/generate', async (req, res) => {
    try {
        const { prompt, image, mode, conversationHistory } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, error: 'Gemini API Key não configurada no servidor.' });
        }

        // Monta o systemInstruction conforme o antigo script.js
        const PROMPTS = {
            ajuda: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um tutor didático que ajuda com exercícios sem dar respostas diretas. Guie o aluno através de perguntas e dicas para que ele chegue à resposta sozinho. Seja paciente e encorajador.",
            dicas: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um conselheiro de estudos que oferece técnicas de aprendizagem, organização e motivação. Foque em métodos práticos e personalizados para melhorar o desempenho acadêmico.",
            resposta_direta: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é uma enciclopédia precisa que fornece respostas diretas e objetivas. Seja claro, conciso e factual, mas mantenha o tom amigável.",
            explicacao_profunda: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um especialista apaixonado que explica conceitos em detalhes. Use analogias, exemplos práticos e quebre tópicos complexos em partes digestíveis.",
            correcao: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um professor de redação que corrige textos com cuidado. Aponte erros gramaticais, sugira melhorias de estilo e explique as correções de forma educativa."
        };
        const systemInstruction = { parts: [{ text: PROMPTS[mode] || PROMPTS['ajuda'] }] };

        // Monta o histórico de conversa
        let historyForAPI = [];
        if (conversationHistory && Array.isArray(conversationHistory)) {
            historyForAPI = conversationHistory.map(message => ({
                role: message.sender === 'user' ? 'user' : 'model',
                parts: [{ text: message.text || '' }]
            }));
        }
        // Monta a mensagem do usuário
        let userParts = [{ text: prompt || 'Por favor, analise a imagem.' }];
        if (image) {
            userParts.push({ inlineData: { mimeType: 'image/png', data: image } });
        }
        const finalUserPart = { role: 'user', parts: userParts };
        const payload = {
            contents: [...historyForAPI, finalUserPart],
            systemInstruction
        };

        // Chama a API Gemini
        const fetch = (await import('node-fetch')).default;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const geminiData = await geminiRes.json();
        if (!geminiRes.ok) {
            return res.status(500).json({ success: false, error: geminiData.error?.message || 'Erro ao chamar Gemini.' });
        }
        let responseText = 'Não consegui gerar uma resposta.';
        if (geminiData.candidates?.[0]?.content?.parts?.[0]) {
            responseText = geminiData.candidates[0].content.parts[0].text;
        } else if (geminiData.candidates?.[0]?.finishReason === 'SAFETY') {
            responseText = 'Não consigo responder a essa solicitação.';
        }
        res.json({
            success: true,
            response: responseText,
            mode: mode || 'ajuda'
        });
    } catch (error) {
        console.error('Erro na API Gemini:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para estatísticas (exemplo de API adicional)
app.get('/api/stats', (req, res) => {
    res.json({
        totalUsers: 1250,
        totalChats: 8430,
        totalMessages: 45670,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
    });
});

// Fallback para SPA - todas as rotas não-API retornam o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📱 Assistente de Estudos IA - Versão 1.0.0`);
    console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
});

export default app;