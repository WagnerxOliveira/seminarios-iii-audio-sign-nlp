// Captura dos elementos da nova interface
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
    let ignorarResultados = false; // Trava contra "ecos" ao parar a gravação

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
            if (ignorarResultados) return;

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

            // 🧹 Comando de voz oculto para impressionar na apresentação
            if (textoCompletoAtual.toLowerCase().includes('vox apague o texto')) {
                limparTelaETexto();
                statusText.innerText = '🧹 Texto apagado via comando de voz!';
                return;
            }

            areaTexto.value = textoCompletoAtual;
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

    function limparTelaETexto() {
        textoAcumulado = ''; 
        areaTexto.value = '';
    }

    // ⚡ Lógica de controle do botão Gravar/Parar
    btnGravar.addEventListener('click', () => {
        if (gravando) {
            ignorarResultados = true;
            recognition.stop();
            statusText.innerText = '🧠 Processando Inteligência Artificial e regras sintáticas...';
            
            setTimeout(async () => {
                const textoParaProcessar = areaTexto.value.trim();
                if (textoParaProcessar !== '') {
                    await orquestradorDeNLP(textoParaProcessar);
                } else {
                    statusText.innerText = 'Microfone desligado. Nenhum áudio capturado.';
                }
            }, 300);

        } else {
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

    // 🚀 ORQUESTRADOR DE TRIPLA REDUNDÂNCIA (À prova de falhas)
    async function orquestradorDeNLP(texto) {
        let textoProcessado = "";

        // TENTATIVA 1: Tenta acessar o Back-end da Vercel (Ideal para Produção)
        try {
            const res = await fetch('/api/processar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: texto })
            });
            if (res.ok) {
                const data = await res.json();
                textoProcessado = data.resultado;
                statusText.innerText = '✅ NLP concluído via Servidor da Aplicação! Traduzindo...';
            } else {
                throw new Error("Back-end Vercel indisponível");
            }
        } catch (erroBackend) {
            
            // TENTATIVA 2: Tenta a API do Google direto pelo navegador (Ideal para testes locais)
            try {
                console.warn("Chamando Google API direta via Client-Side...");
                
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
                    statusText.innerText = '✅ NLP concluído via IA Nativa! Traduzindo...';
                } else {
                    throw new Error("API do Google bloqueada.");
                }

            } catch (erroGoogle) {
                // TENTATIVA 3: Motor de Regras Gramaticais Offline (Sobrevivência)
                console.warn("Usando Regras Gramaticais Locais...");
                textoProcessado = aplicarRegrasOffline(texto);
                statusText.innerText = '✅ Análise Concluída via Motor Local! Traduzindo...';
            }
        }

        // Devolve o texto tratado e chama a automação do VLibras
        areaTexto.value = textoProcessado;
        forcarTraducaoVlibras();
    }

    // 🛡️ MOTOR DE REGRAS GRAMATICAIS OFFLINE
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
        const textoLimpio = areaTexto.value.trim();
        if (textoLimpio !== '') {
            const botaoVlibras = document.querySelector('[vw-access-button]');
            const janelaVlibras = document.querySelector('[vw-plugin-wrapper]');
            
            if (botaoVlibras && (!janelaVlibras || window.getComputedStyle(janelaVlibras).display === 'none')) {
                botaoVlibras.click();
            }

            // Seleciona o texto dentro do textarea novo
            areaTexto.select();
            
            // Dispara os eventos que o VLibras escuta para iniciar a tradução
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