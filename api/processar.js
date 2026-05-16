module.exports = async function handler(request, response) {
    // Configuração estrita de cabeçalhos CORS para comunicação com o front-end
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
        return response.status(400).json({ error: 'Texto de transcrição não fornecido.' });
    }

    // CHAVE DE API DO GEMINI
    const GEMINI_API_KEY = 'AIzaSyCrh8elS1iSIrdJyoYDBMmvUhKUoq7dMLQ';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const promptEspecialista = `Aja como um revisor gramatical especialista em Processamento de Linguagem Natural e análise léxica da Língua Portuguesa. 
Analise cuidadosamente a estrutura sintática, as conjunções e a semântica da seguinte transcrição de áudio contínua e reescreva-a aplicando as regras gramaticais perfeitas:

1. SINAIS DE ENCERRAMENTO: Diferencie com precisão frases declarativas/afirmativas (aplicando ponto final ".") de frases interrogativas diretas (perguntas baseadas em contexto de dúvida, entonação implícita ou pronomes como quem, onde, quando, qual, como, por que).
2. REGRAS DE OURO DA VÍRGULA: Insira as vírgulas nos locais sintáticos corretos para isolar vocativos (chamamentos), apostos (explicações), elementos de listas e adjuntos adverbiais deslocados. NUNCA separe o sujeito do predicado por vírgula.
3. CAPITALIZAÇÃO: Aplique letras maiúsculas rigorosamente no início de todas as frases e em nomes próprios ou entidades conhecidas (como PUC Minas).

Mantenha o vocabulário original de forma idêntica. Não adicione notas, introduções, explicações ou aspas na resposta. Retorne única e exclusivamente o texto final corrigido e pontuado.

Texto para análise: "${texto}"`;

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
            throw new Error('Estrutura de dados inesperada do provedor de IA.');
        }

    } catch (error) {
        console.error('Erro no processamento do servidor de NLP:', error);
        return response.status(500).json({ error: 'Erro interno ao processar a pontuação linguística.' });
    }
};