import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Configurar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Sistema de Cache em Memória
class ResponseCache {
    constructor(maxSize = 1000, ttl = 3600000) { // TTL padrão: 1 hora
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

    // Gera uma chave única baseada no conteúdo da requisição
    generateKey(prompt, mode, conversationHistory, hasImage) {
        const content = {
            prompt: prompt?.trim(),
            mode,
            historyLength: conversationHistory?.length || 0,
            hasImage: !!hasImage
        };
        return crypto.createHash('md5').update(JSON.stringify(content)).digest('hex');
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        // Verifica se o item expirou
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        // Move para o final (LRU)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.data;
    }

    set(key, data) {
        // Remove itens antigos se atingir o limite
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            expiry: Date.now() + this.ttl,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttl: this.ttl
        };
    }
}

// Instância do cache
const responseCache = new ResponseCache();

// Configurações dos prompts centralizadas
const PROMPTS = {
    ajuda: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um tutor didático que ajuda com exercícios sem dar respostas diretas. Guie o aluno através de perguntas e dicas para que ele chegue à resposta sozinho. Seja paciente e encorajador. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para destacar fórmulas matemáticas (use blocos de código ou sintaxe LaTeX), listas, tópicos importantes, exemplos e destaques.",
    dicas: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um conselheiro de estudos que oferece técnicas de aprendizagem, organização e motivação. Foque em métodos práticos e personalizados para melhorar o desempenho acadêmico. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para listas, destaques, exemplos e dicas práticas.",
    resposta_direta: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é uma enciclopédia precisa que fornece respostas diretas e objetivas. Seja claro, conciso e factual, mas mantenha o tom amigável. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para fórmulas, listas, tabelas, exemplos e destaques.",
    explicacao_profunda: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um especialista apaixonado que explica conceitos em detalhes. Use analogias, exemplos práticos e quebre tópicos complexos em partes digestíveis. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para fórmulas matemáticas, listas, exemplos, destaques e explicações passo a passo.",
    correcao: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um professor de redação que corrige textos com cuidado. Aponte erros gramaticais, sugira melhorias de estilo e explique as correções de forma educativa. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para destacar correções, exemplos e sugestões.",
    serio: "PERSONALIDADE DO ASSISTENTE: Você é o Wilb, um tutor objetivo, formal e direto, sem uso de emojis ou informalidade. Fale de forma clara, profissional e sem rodeios. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um professor sério que responde de modo direto, sem brincadeiras ou informalidade. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para fórmulas matemáticas, listas, tabelas, exemplos e destaques. Use blocos de código para fórmulas e sintaxe LaTeX quando apropriado."
};

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
        timestamp: new Date().toISOString(),
        cache: responseCache.getStats()
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        name: 'Assistente de Estudos IA - Wilb',
        version: '1.1.0',
        description: 'Assistente de estudos com IA integrada e sistema de cache',
        author: 'Júnior Veras',
        features: [
            'Chat com IA (Gemini)',
            'Sistema de cache inteligente',
            'Múltiplos modos de interação',
            'Upload de imagens',
            'Histórico de conversas',
            'Autenticação Firebase',
            'Modo anônimo',
            'Configurações personalizáveis'
        ]
    });
});

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

// Função auxiliar para chamar a API Gemini
async function callGeminiAPI(prompt, image, mode, conversationHistory) {
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
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const geminiData = await geminiRes.json();
    
    if (!geminiRes.ok) {
        throw new Error(geminiData.error?.message || 'Erro ao chamar Gemini.');
    }

    if (geminiData.candidates?.[0]?.content?.parts?.[0]) {
        return geminiData.candidates[0].content.parts[0].text;
    } else if (geminiData.candidates?.[0]?.finishReason === 'SAFETY') {
        return 'Não consigo responder a essa solicitação.';
    }
    
    return 'Não consegui gerar uma resposta.';
}

// Rota principal para geração de respostas com cache
app.post('/api/gemini/generate', async (req, res) => {
    try {
        const { prompt, image, mode, conversationHistory } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                success: false, 
                error: 'Gemini API Key não configurada no servidor.' 
            });
        }

        // Corrige: promptMode pode ser 'serio', então a chave do cache deve usar promptMode
        let promptMode = mode;
        if (mode === 'serio') promptMode = 'serio';
        const cacheKey = responseCache.generateKey(prompt, promptMode, conversationHistory, !!image);
        let responseText = null;
        let fromCache = false;
        if (!image) {
            responseText = responseCache.get(cacheKey);
            if (responseText) {
                fromCache = true;
                console.log(`Cache hit para chave: ${cacheKey}`);
            }
        }
        if (!responseText) {
            console.log(`Cache miss - chamando API Gemini para chave: ${cacheKey}`);
            responseText = await callGeminiAPI(prompt, image, promptMode, conversationHistory);
            if (!image && responseText) {
                responseCache.set(cacheKey, responseText);
            }
        }

        res.json({
            success: true,
            response: responseText,
            mode: promptMode,
            cached: fromCache,
            cacheKey: !image ? cacheKey : null
        });

    } catch (error) {
        console.error('Erro na API Gemini:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para estatísticas incluindo cache
app.get('/api/stats', (req, res) => {
    res.json({
        totalUsers: 1250,
        totalChats: 8430,
        totalMessages: 45670,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cache: responseCache.getStats()
    });
});

// Rota para gerenciar cache (desenvolvimento/debug)
app.post('/api/cache/clear', (req, res) => {
    if (process.env.NODE_ENV === 'development') {
        responseCache.clear();
        res.json({ success: true, message: 'Cache limpo com sucesso' });
    } else {
        res.status(403).json({ success: false, error: 'Operação não permitida em produção' });
    }
});

// Fallback para SPA
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
    console.log(`📱 Assistente de Estudos IA - Versão 1.1.0`);
    console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Cache configurado: ${responseCache.maxSize} itens, TTL: ${responseCache.ttl/1000}s`);
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
});

export default app;