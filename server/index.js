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

// Middleware para rotas de API inexistentes (404)
app.use('/api', (req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'API não encontrada',
        message: `A rota ${req.originalUrl} não existe.`
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

