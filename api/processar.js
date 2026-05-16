// 🛠️ BACK-END SERVERLESS (api/processar.js) - Padrão CommonJS (À prova de falhas no Vercel)
module.exports = async function handler(request, response) {
    // Cabeçalhos de segurança CORS
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    const { texto } = request.body;

    if (!texto) {
        return response.status(400).json({ error: 'Texto não fornecido.' });
    }

    // 🔑 CHAVE DA API
    const GEMINI_API_KEY = 'AIzaSyCrh8elS1iSIrdJyoYDBMmvUhKUoq7dMLQ';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Prompt com diretrizes de Tokenização, Sintaxe e Regras de Ouro da Língua Portuguesa
    const promptEspecialista = `Aja como um revisor gramatical especialista em Processamento de Linguagem Natural. Analise a semântica e a estrutura sintática da transcrição de áudio abaixo.
Aplique estritamente as regras de pontuação da Língua Portuguesa:
1. SINAIS DE FIM DE FRASE: Identifique orações interrogativas (perguntas diretas baseadas no contexto de dúvida ou pronomes como quem, onde, quando, qual, por que, como) e aplique o ponto de interrogação (?). Use ponto final (.) para declarações ou afirmações concluídas.
2. REGRAS DE OURO DA VÍRGULA: Isole vocativos (chamamentos) e apostos (explicações intercaladas). Separe adjuntos adverbiais deslocados. Lembre-se: NUNCA separe o sujeito do predicado por vírgula.
Mantenha rigorosamente o vocabulário original integralmente. Não adicione notas, explicações ou aspas. Retorne exclusivamente o texto final corrigido com perfeita concordância e coesão.

Texto para correção: "${texto}"`;

    try {
        const googleResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptEspecialista }] }] })
        });

        if (!googleResponse.ok) {
            throw new Error('Falha na resposta do servidor do Google Gemini.');
        }

        const data = await googleResponse.json();
        
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const textoProcessado = data.candidates[0].content.parts[0].text.trim();
            return response.status(200).json({ resultado: textoProcessado });
        } else {
            throw new Error('Estrutura de resposta inesperada da API.');
        }

    } catch (error) {
        console.error('Erro no servidor interno de IA:', error);
        return response.status(500).json({ error: 'Erro interno ao processar o Processamento de Linguagem Natural.' });
    }
};