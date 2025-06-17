import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env['PORT'] || 3001;

class ResponseCache {
    constructor(maxSize = 1000, ttl = 3600000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

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

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        this.cache.delete(key);
        this.cache.set(key, item);
        return item.data;
    }

    set(key, data) {
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

const responseCache = new ResponseCache();

const MATH_FORMAT_INSTRUCTION = "Sempre escreva fórmulas matemáticas usando delimitadores LaTeX: use `$...$` para fórmulas inline e `$$...$$` para fórmulas em bloco. Nunca use blocos de código para fórmulas matemáticas. Quando a fórmula for maior que 15 caracteres, quebre a linha usando comandos LaTeX apropriados, como `\\` (duas barras invertidas) ou `\newline`, para garantir que cada linha tenha no máximo 15 caracteres. Não utilize barra de rolagem horizontal e não deixe a fórmula ultrapassar esse limite por linha.";
const PROMPTS = {
    ajuda: `${MATH_FORMAT_INSTRUCTION}\nPERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um tutor didático que ajuda com exercícios sem dar respostas diretas. Guie o aluno através de perguntas e dicas para que ele chegue à resposta sozinho. Seja paciente e encorajador. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para destacar fórmulas matemáticas (use sintaxe LaTeX), listas, tópicos importantes, exemplos e destaques.`,
    dicas: `${MATH_FORMAT_INSTRUCTION}\nPERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um conselheiro de estudos que oferece técnicas de aprendizagem, organização e motivação. Foque em métodos práticos e personalizados para melhorar o desempenho acadêmico. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para listas, destaques, exemplos e dicas práticas.`,
    resposta_direta: `${MATH_FORMAT_INSTRUCTION}\nPERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é uma enciclopédia precisa que fornece respostas diretas e objetivas. Seja claro, conciso e factual, mas mantenha o tom amigável. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para fórmulas, listas, tabelas, exemplos e destaques.`,
    explicacao_profunda: `${MATH_FORMAT_INSTRUCTION}\nPERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um especialista apaixonado que explica conceitos em detalhes. Use analogias, exemplos práticos e quebre tópicos complexos em partes digestíveis. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para fórmulas matemáticas, listas, exemplos, destaques e explicações passo a passo.`,
    correcao: `${MATH_FORMAT_INSTRUCTION}\nPERSONALIDADE DO ASSISTENTE: Você é o Wilb, um companheiro de estudos amigável, positivo e encorajador, com um chapéu de cangaceiro. Use emojis como 💜 e ✨ para criar um tom leve e motivador. Seu objetivo é fazer o aluno se sentir apoiado e confiante. Chame o aluno de 'meu caro' ou 'minha cara' de vez em quando. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um professor de redação que corrige textos com cuidado. Aponte erros gramaticais, sugira melhorias de estilo e explique as correções de forma educativa. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para destacar correções, exemplos e sugestões.`,
    serio: `${MATH_FORMAT_INSTRUCTION}\nATENÇÃO: Dois prompts de personalidade podem ser enviados juntos, mas neste modo você deve IGNORAR QUALQUER OUTRA PERSONALIDADE considerar APENAS esta personalidade séria. PERSONALIDADE DO ASSISTENTE: Você é Wilb, um tutor objetivo, formal. NÃO use emojis, emotes ou qualquer tipo de informalidade. Fale de forma clara, profissional e sem rodeios, SEM NENHUM EMOTE. --- INSTRUÇÃO ORIGINAL: PAPEL: Você é um professor sério sem brincadeiras ou informalidade. --- FORMATAÇÃO: Sempre que possível, utilize Markdown para fórmulas matemáticas, listas, tabelas, exemplos e destaques. Use sintaxe LaTeX quando apropriado.`
};

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env['CORS_ALLOWED_ORIGINS'] || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
    origin: function(origin, callback) {
        console.log('CORS request from origin:', origin, '| Allowed:', allowedOrigins);
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, '../dist')));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        error: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/gemini/generate', apiLimiter);

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
            apiKey: process.env.FIREBASE_API_KEY || process.env['FIREBASE_API_KEY'],
            authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env['FIREBASE_AUTH_DOMAIN'],
            projectId: process.env.FIREBASE_PROJECT_ID || process.env['FIREBASE_PROJECT_ID'],
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env['FIREBASE_STORAGE_BUCKET'],
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env['FIREBASE_MESSAGING_SENDER_ID'],
            appId: process.env.FIREBASE_APP_ID || process.env['FIREBASE_APP_ID']
        }
    });
});

async function callGeminiAPI(prompt, image, mode, conversationHistory, language = 'pt-br') {
    let promptMode = (mode || 'ajuda').toString().toLowerCase();
    let systemPrompt = PROMPTS[promptMode] || PROMPTS['ajuda'];

    const languageInstruction = `IMPORTANTE:(Você está no modo ${language}) Responda sempre nesse idioma ${language}, mesmo se a mensagem for em um idioma diferente. Não traduza para outro idioma, mesmo que solicitado. Seja natural e fluente.`;
    systemPrompt = `${languageInstruction}\n${systemPrompt}`;

    if (promptMode === 'serio' && prompt && prompt._originalMode && PROMPTS[prompt._originalMode]) {
        systemPrompt = `${languageInstruction}\n${PROMPTS['serio']}\n${PROMPTS[prompt._originalMode]}`;
    }
    const systemInstruction = { parts: [{ text: systemPrompt }] };
    
    let historyForAPI = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
        historyForAPI = conversationHistory.map(message => ({
            role: message.sender === 'user' ? 'user' : 'model',
            parts: [{ text: message.text || '' }]
        }));
    }

    let userParts = [{ text: prompt || 'Por favor, analise a imagem.' }];
    if (image) {
        userParts.push({ inlineData: { mimeType: 'image/png', data: image } });
    }

    const finalUserPart = { role: 'user', parts: userParts };
    const payload = {
        contents: [...historyForAPI, finalUserPart],
        systemInstruction
    };

    const fetch = (await import('node-fetch')).default;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY || process.env['GEMINI_API_KEY']}`;

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

// Helper to wrap async route handlers for error forwarding
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

app.post('/api/gemini/generate', asyncHandler(async (req, res) => {
    const { prompt, image, mode, conversationHistory, seriousMode, language } = req.body;

    if (!(process.env.GEMINI_API_KEY || process.env['GEMINI_API_KEY'])) {
        return res.status(500).json({
            success: false,
            error: (process.env.NODE_ENV === 'development' || process.env['NODE_ENV'] === 'development') ? 'Gemini API Key não configurada no servidor.' : 'An unexpected error occurred. Please try again later.'
        });
    }

    if (typeof prompt === 'string' && prompt.length > 5000) {
        return res.status(400).json({
            success: false,
            error: (process.env.NODE_ENV === 'development' || process.env['NODE_ENV'] === 'development') ? 'O texto enviado excede o limite máximo de 5000 caracteres.' : 'An unexpected error occurred. Please try again later.'
        });
    }

    let promptMode = mode;
    if (seriousMode === true) {
        promptMode = 'serio';
    }
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
        responseText = await callGeminiAPI(
            prompt,
            image,
            promptMode,
            conversationHistory,
            language?.toLowerCase() || 'pt-br'
        );

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
}));

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

app.post('/api/cache/clear', (req, res) => {
    if (process.env.NODE_ENV || process.env['NODE_ENV'] === 'development') {
        responseCache.clear();
        res.json({ success: true, message: 'Cache limpo com sucesso' });
    } else {
        res.status(403).json({ success: false, error: 'Operation not allowed in production.' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Centralized error-handling middleware
app.use((err, req, res, next) => {
    // Always log full error details internally
    console.error('Internal error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV || process.env['NODE_ENV'] === 'development'
            ? (err && err.message ? err.message : 'Internal server error')
            : 'An unexpected error occurred. Please try again later.'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📱 Assistente de Estudos IA - Versão 1.1.0`);
    console.log(`🔧 Ambiente: ${process.env.NODE_ENV || process.env['NODE_ENV'] || 'development'}`);
    console.log(`💾 Cache configurado: ${responseCache.maxSize} itens, TTL: ${responseCache.ttl / 1000}s`);
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
});

export default app;