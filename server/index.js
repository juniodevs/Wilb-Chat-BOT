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
        },
        gemini: {
            apiKey: process.env.GEMINI_API_KEY
        }
    });
});

// Rota para proxy da API do Gemini (opcional, para maior segurança)
app.post('/api/gemini/generate', async (req, res) => {
    try {
        const { prompt, image, mode } = req.body;
    
        res.json({
            success: true,
            response: "Esta é uma resposta de exemplo do servidor. Implemente a integração com Gemini aqui.",
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

