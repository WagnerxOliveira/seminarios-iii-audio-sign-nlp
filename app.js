const btnGravar = document.getElementById('btn-gravar');
const areaTexto = document.getElementById('texto-transcrito');
const statusText = document.getElementById('status-gravacao');

// 🔑 CHAVE DA INTELIGÊNCIA ARTIFICIAL
const GEMINI_API_KEY = 'AIzaSyCrh8elS1iSIrdJyoYDBMmvUhKUoq7dMLQ';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    let recognition = new SpeechRecognition();
    configurarRecognition();

    let gravando = false;
    let textoAcumulado = ''; 
    let ignorarResultados = false; // Trava para impedir que o áudio antigo volte para a tela

    function configurarRecognition() {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
            gravando = true;
            ignorarResultados = false;
            btnGravar.classList.remove('btn-danger');
            btnGravar.classList.add('btn-success');
            btnGravar.innerHTML = '🛑 Parar Gravação';
            statusText.innerText = 'Ouvindo... Fale naturalmente.';
        };

        recognition.onresult = (event) => {
            if (ignorarResultados) return; // Se parou de gravar, ignora ecos do microfone

            let transcricaoIntermediaria = '';
            let transcricaoFinalDoBloco = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    transcricaoFinalDoBloco += event.results[i][0].transcript;
                } else {
                    transcricaoIntermediaria += event.results[i][0].transcript;
                }
            }

            if (transcricaoFinalDoBloco !== '') {
                textoAcumulado += ' ' + transcricaoFinalDoBloco;
            }

            let textoCompletoAtual = (textoAcumulado + ' ' + transcricaoIntermediaria).trim();

            // Comando de voz para limpar
            if (textoCompletoAtual.toLowerCase().includes('vox apague o texto')) {
                limparTelaETexto();
                statusText.innerText = '🧹 Texto apagado via comando de voz!';
                return;
            }

            atualizarTela(textoCompletoAtual);
        };

        recognition.onerror = (event) => {
            console.error('Erro no microfone: ', event.error);
        };

        recognition.onend = () => {
            gravando = false;
            btnGravar.classList.remove('btn-success');
            btnGravar.classList.add('btn-danger');
            btnGravar.innerHTML = '🎤 Iniciar Gravação';
        };
    }

    function atualizarTela(texto) {
        if (areaTexto.value !== undefined) {
            areaTexto.value = texto;
        } else {
            areaTexto.innerText = texto;
        }
    }

    function limparTelaETexto() {
        textoAcumulado = ''; 
        if (areaTexto.value !== undefined) areaTexto.value = '';
        areaTexto.innerText = '';
        areaTexto.innerHTML = '';
    }

    // ⚡ LÓGICA BLINDADA DO BOTÃO GRAVAR/PARAR
    btnGravar.addEventListener('click', () => {
        if (gravando) {
            ignorarResultados = true; // Corta a escuta imediatamente
            recognition.stop();
            statusText.innerText = '🧠 Processando Inteligência Artificial e regras de Português...';
            
            setTimeout(async () => {
                const textoParaProcessar = (areaTexto.value || areaTexto.innerText || '').trim();
                if (textoParaProcessar !== '') {
                    await orquestradorDeNLP(textoParaProcessar);
                } else {
                    statusText.innerText = 'Microfone desligado. Nenhum áudio capturado.';
                }
            }, 300);

        } else {
            // Limpa a tela imediatamente ao começar a gravar de novo
            limparTelaETexto();
            
            recognition = new SpeechRecognition();
            configurarRecognition();
            
            try {
                recognition.start();
            } catch (e) {
                console.warn(e);
            }
        }
    });

    // 🚀 ORQUESTRADOR DE TRIPLA REDUNDÂNCIA (Garante que nunca vai dar erro)
    async function orquestradorDeNLP(texto) {
        let textoProcessado = "";

        // TENTATIVA 1: Tenta usar o Back-end da Vercel (Se estiver online)
        try {
            const res = await fetch('/api/processar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: texto })
            });
            if (res.ok) {
                const data = await res.json();
                textoProcessado = data.resultado;
                statusText.innerText = '✅ NLP concluído via Servidor! Traduzindo...';
            } else {
                throw new Error("Back-end Vercel indisponível");
            }
        } catch (erroBackend) {
            
            // TENTATIVA 2: Tenta usar a API do Google direto pelo navegador (Funciona localmente)
            try {
                console.warn("Servidor Vercel ausente (Testando local?). Chamando Google API direta...");
                
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
                const prompt = `Aja como um revisor gramatical especialista em Processamento de Linguagem Natural da Língua Portuguesa. 
Analise a semântica da transcrição de áudio abaixo e reescreva-a aplicando as regras:
1. SINAIS: Diferencie frases declarativas (ponto final) de frases interrogativas diretas (ponto de interrogação), analisando o contexto de dúvida e pronomes (quem, onde, como, qual).
2. VÍRGULAS: Isole vocativos (chamamentos), apostos e adjuntos adverbiais deslocados. NUNCA separe o sujeito do predicado.
3. MAIÚSCULAS: Inicie todas as frases com letra maiúscula.
Retorne APENAS o texto corrigido, sem explicações.

Texto: "${texto}"`;

                const resGoogle = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                if (resGoogle.ok) {
                    const dataGoogle = await resGoogle.json();
                    textoProcessado = dataGoogle.candidates[0].content.parts[0].text.trim();
                    statusText.innerText = '✅ NLP concluído via Inteligência Artificial! Traduzindo...';
                } else {
                    throw new Error("API do Google bloqueada ou fora do ar.");
                }

            } catch (erroGoogle) {
                // TENTATIVA 3: Motor de Regras Gramaticais Offline (Prova de falhas)
                console.warn("Inteligência Artificial inacessível. Usando Regras Gramaticais Offline...");
                textoProcessado = aplicarRegrasOffline(texto);
                statusText.innerText = '✅ NLP Concluído via Regras Locais! Traduzindo...';
            }
        }

        // Coloca o texto perfeito na tela e chama o VLibras
        atualizarTela(textoProcessado);
        forcarTraducaoVlibras();
    }

    // 🛡️ MOTOR DE REGRAS GRAMATICAIS OFFLINE (Plano C)
    function aplicarRegrasOffline(t) {
        let texto = t.trim().toLowerCase();
        texto = texto.replace(/\b(olá|oi|bom dia|boa tarde|boa noite|nossa)\b\s+/g, "$1, ");
        texto = texto.replace(/\s+\b(mas|porém|entretanto|pois|então|porque)\b/g, ", $1");
        
        const perguntas = [/(como\s+você\s+está|tudo\s+bem(\s+com\s+você)?|como\s+vai(\s+você)?)/g, /((quem|onde|quando|qual|quais|por\s+que|o\s+que)\b.*?)(?=\s+(?:e|mas|ou)|$)/g, /(está\s+(estudando|fazendo|indo|bem))/g];
        perguntas.forEach(p => texto = texto.replace(p, match => match.trim() + "? "));
        
        texto = texto.replace(/\s+/g, ' ').trim();
        if (!texto.endsWith('?')) texto += '.';
        texto = texto.replace(/\s+\?/g, '?').replace(/\s+\./g, '.').replace(/,\s*\?/g, '?');
        
        return texto.replace(/(?:^|[.?]\s*)([a-zçáéíóúâêôãõ])/g, m => m.toUpperCase());
    }

    function forcarTraducaoVlibras() {
        const textoLimpio = (areaTexto.value || areaTexto.innerText || '').trim();
        if (textoLimpio !== '') {
            const botaoVlibras = document.querySelector('[vw-access-button]');
            const janelaVlibras = document.querySelector('[vw-plugin-wrapper]');
            
            if (botaoVlibras && (!janelaVlibras || window.getComputedStyle(janelaVlibras).display === 'none')) {
                botaoVlibras.click();
            }

            if (typeof areaTexto.select === 'function') areaTexto.select();
            else {
                const range = document.createRange();
                range.selectNodeContents(areaTexto);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
            
            setTimeout(() => {
                areaTexto.dispatchEvent(new Event('input', { bubbles: true }));
                areaTexto.dispatchEvent(new Event('change', { bubbles: true }));
            }, 400);
        }
    }

} else {
    btnGravar.disabled = true;
    statusText.innerText = 'Seu navegador não suporta a Web Speech API. Por favor, utilize o Google Chrome.';
}