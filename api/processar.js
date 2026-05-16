// 🛠️ BACK-END AUTÔNOMO (api/processar.js)
// Este servidor NÃO usa a API do Google. Ele usa regras avançadas de PLN local.

module.exports = async function handler(request, response) {
    // Cabeçalhos de segurança (CORS)
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Método não permitido.' });
    }

    const { texto } = request.body;

    if (!texto) {
        return response.status(400).json({ error: 'Texto não fornecido.' });
    }

    try {
        // 🧠 MOTOR HEURÍSTICO DE PONTUAÇÃO (PLN Baseado em Regras)
        let resultadoFinal = aplicarRegrasGramaticais(texto);

        // Devolve o texto processado pelo próprio servidor
        return response.status(200).json({ resultado: resultadoFinal });

    } catch (error) {
        console.error('Erro no motor sintático:', error);
        return response.status(500).json({ error: 'Erro ao processar o texto.' });
    }
};

// ============================================================================
// 📚 FUNÇÕES DO MOTOR DE LINGUAGEM NATURAL (LÍNGUA PORTUGUESA)
// ============================================================================

function aplicarRegrasGramaticais(textoBruto) {
    let texto = textoBruto.trim().toLowerCase();

    // 1. ISOLAMENTO DE VOCATIVOS E SAUDAÇÕES COM VÍRGULA
    // Ex: "olá como vai" -> "olá, como vai"
    texto = texto.replace(/\b(olá|oi|e aí|bom dia|boa tarde|boa noite|nossa|uau|poxa)\b\s+/g, "$1, ");

    // 2. VÍRGULAS ANTES DE CONJUNÇÕES ADVERSATIVAS E EXPLICATIVAS
    // Ex: "eu fui mas não gostei" -> "eu fui, mas não gostei"
    texto = texto.replace(/\s+\b(mas|porém|contudo|entretanto|pois|então|porque|logo|portanto)\b/g, ", $1");

    // 3. IDENTIFICAÇÃO DE PERGUNTAS (ESTRUTURAS INTERROGATIVAS)
    // Procuramos por blocos que indicam perguntas claras e fatiamos a frase.
    const padroesPerguntas = [
        /(como\s+você\s+está|tudo\s+bem(\s+com\s+você)?|como\s+vai(\s+você)?)/g,
        /(o\s+que\s+você\s+(gosta|faz|quer|acha|pensa))/g,
        /(\b(quem|onde|quando|qual|quais|por\s+que|cadê)\b.*?)(?=\s+(?:e|mas|ou|porque)|$)/g,
        /(está\s+(estudando|fazendo|indo|bem|pronto))/g
    ];

    padroesPerguntas.forEach(padrao => {
        texto = texto.replace(padrao, (match) => {
            return match.trim() + "? ";
        });
    });

    // Limpeza de espaços gerados pelos replaces
    texto = texto.replace(/\s+/g, ' ').trim();

    // 4. IDENTIFICAÇÃO DE FIM DE DECLARAÇÃO
    // Se a frase não foi marcada como pergunta no final, é uma afirmação.
    if (!texto.endsWith('?')) {
        texto += '.';
    }

    // 5. LIMPEZA DE PONTUAÇÃO DUPLICADA OU MAL FORMADA
    texto = texto.replace(/\s+\?/g, '?');
    texto = texto.replace(/\s+\./g, '.');
    texto = texto.replace(/\s+,/g, ',');
    texto = texto.replace(/,\s*,/g, ',');
    texto = texto.replace(/,\s*\?/g, '?');
    texto = texto.replace(/,\s*\./g, '.');
    texto = texto.replace(/\?\s*\?/g, '?');
    texto = texto.replace(/\.\s*\./g, '.');

    // 6. CAPITALIZAÇÃO (Iniciais maiúsculas após pontuação e no início)
    // Converte a primeira letra do texto e a primeira letra após cada '.' ou '?'
    let textoCapitalizado = texto.replace(/(?:^|[.?]\s*)([a-zçáéíóúâêôãõ])/g, function(match) {
        return match.toUpperCase();
    });

    // 7. CORREÇÃO DE NOMES PRÓPRIOS ESPECÍFICOS (NER - Named Entity Recognition básico)
    textoCapitalizado = textoCapitalizado.replace(/\bpuc minas\b/gi, 'PUC Minas');
    textoCapitalizado = textoCapitalizado.replace(/\bbrasil\b/gi, 'Brasil');

    return textoCapitalizado.trim();
}