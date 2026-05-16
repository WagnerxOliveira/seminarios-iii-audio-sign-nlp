const btnGravar = document.getElementById('btn-gravar');
const areaTexto = document.getElementById('texto-transcrito');
const statusText = document.getElementById('status-gravacao');

// 🔑 CHAVE DE API DO GEMINI
const GEMINI_API_KEY = 'AIzaSyCrh8elS1iSIrdJyoYDBMmvUhKUoq7dMLQ'; 

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    let recognition = new SpeechRecognition();
    configurarRecognition();

    let gravando = false;
    let textoAcumulado = ''; 

    function configurarRecognition() {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
            gravando = true;
            btnGravar.classList.remove('btn-danger');
            btnGravar.classList.add('btn-success');
            btnGravar.innerHTML = '🛑 Parar Gravação';
            statusText.innerText = 'Ouvindo... Fale naturalmente.';
        };

        recognition.onresult = (event) => {
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

            // 🧹 COMANDO DE VOZ DETECTADO: "Vox, apague o texto"
            if (textoCompletoAtual.toLowerCase().includes('vox apague o texto')) {
                textoAcumulado = '';
                areaTexto.innerText = '';
                statusText.innerText = '🧹 Texto apagado via comando de voz!';
                return;
            }

            areaTexto.innerText = textoCompletoAtual;
        };

        recognition.onerror = (event) => {
            console.error('Erro de reconhecimento: ', event.error);
            if (event.error === 'not-allowed') {
                statusText.innerText = 'Permissão de microfone negada.';
            }
        };

        recognition.onend = () => {
            gravando = false;
            btnGravar.classList.remove('btn-success');
            btnGravar.classList.add('btn-danger');
            btnGravar.innerHTML = '🎤 Iniciar Gravação';
        };
    }

    // ⚡ LÓGICA INTELIGENTE DO BOTÃO: Limpa, reseta a instância e reinicia sem travar
    btnGravar.addEventListener('click', async () => {
        if (gravando) {
            statusText.innerText = '🧠 Processando NLP e análise semântica estruturada...';
            recognition.stop();
            
            // Aguarda uma fração de segundo para o microfone fechar antes de processar a IA
            setTimeout(async () => {
                const textoParaProcessar = areaTexto.innerText.trim();
                if (textoParaProcessar !== '') {
                    await processarTextoComIA(textoParaProcessar);
                } else {
                    statusText.innerText = 'Microfone desligado. Nenhum texto capturado.';
                }
            }, 400);

        } else {
            // FIX DO BUG: Reseta o acumulador e apaga o que está escrito na tela na mesma hora
            textoAcumulado = ''; 
            areaTexto.innerText = '';
            
            // Recria a instância para limpar buffers travados do navegador
            recognition = new SpeechRecognition();
            configurarRecognition();
            
            try {
                recognition.start();
            } catch (e) {
                console.warn("Tentativa de reinício rápido contornada: ", e);
            }
        }
    });

    // 🚀 ENGINE DE PROCESSAMENTO DE LINGUAGEM NATURAL (NLP)
    async function processarTextoComIA(texto) {
        const urlOriginal = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const urlProxy = 'https://corsproxy.io/?' + encodeURIComponent(urlOriginal);
        
        // Prompt especialista estruturado baseado na teoria de PLN e regras gramaticais fornecidas
        const promptEspecialista = `Aja como um revisor gramatical especialista em Processamento de Linguagem Natural. Analise a semântica e sintaxe do texto de transcrição abaixo.
Aplique estritamente as regras de pontuação da Língua Portuguesa:
1. SINAIS DE FIM: Identifique orações interrogativas diretas e use ponto de interrogação (?). Use ponto final (.) para declarações concluídas.
2. REGRAS DA VÍRGULA: Isole vocativos (chamamentos) e apostos (explicações). Separe adjuntos adverbiais deslocados. NUNCA separe o sujeito do predicado por vírgula.
Mantenha o vocabulário original integralmente. Não adicione notas, explicações ou aspas. Retorne apenas o texto corrigido.

Texto: "${texto}"`;

        try {
            const response = await fetch(urlProxy, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptEspecialista }] }] })
            });

            if (!response.ok) throw new Error('CORS ou restrição de API pública ativa.');

            const data = await response.json();
            const textoProcessado = data.candidates[0].content.parts[0].text.trim();
            
            areaTexto.innerText = textoProcessado;
            statusText.innerText = '✅ NLP concluído via Inteligência Artificial! Traduzindo...';
            forcarTraducaoVlibras();

        } catch (error) {
            console.warn('Executando Motor de PLN Heurístico Local baseado em POS-Tagging:', error);
            statusText.innerText = '🧠 Processando pontuação através das regras gramaticais locais...';

            // 🛠️ MOTOR DE PLN LOCAL REFORÇADO (Análise de Camadas Gramaticais)
            let palavras = texto.trim().split(/\s+/);
            let textoProcessadoLocal = "";
            let fraseAtual = [];

            // Tokenização e Classificação de Palavras (Heurística POS Tagging)
            const pronomesInterrogativos = ['como', 'onde', 'quem', 'qual', 'quais', 'por que', 'porque', 'quanto', 'quantos', 'o que', 'o quê', 'cadê', 'quando', 'será'];
            const vocativosESaudacoes = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'nossa', 'uau'];
            const adjuntosEConjuncoes = ['mas', 'porém', 'contudo', 'entretanto', 'pois', 'então', 'porque', 'já que', 'ontem', 'hoje', 'agora'];

            for (let i = 0; i < palavras.length; i++) {
                let palavraAtual = palavras[i];
                let palavraMinuscula = palavraAtual.toLowerCase();

                // Capitalização de início de frase (Transformers-like)
                if (fraseAtual.length === 0) {
                    palavraAtual = palavraAtual.charAt(0).toUpperCase() + palavraAtual.slice(1);
                }

                // Regra do Vocativo / Saudação: Isolar por vírgula
                if (vocativosESaudacoes.includes(palavraMinuscula) && fraseAtual.length === 0 && i < palavras.length - 1) {
                    palavraAtual += ",";
                }

                // Regra das Conjunções/Adjuntos Deslocados: Adicionar pausa intermediária antes do termo
                if (adjuntosEConjuncoes.includes(palavraMinuscula) && fraseAtual.length > 0) {
                    let uIdx = fraseAtual.length - 1;
                    if (!fraseAtual[uIdx].endsWith(',') && !fraseAtual[uIdx].endsWith('.') && !fraseAtual[uIdx].endsWith('?')) {
                        fraseAtual[uIdx] += ",";
                    }
                }

                fraseAtual.push(palavraAtual);

                // Análise de Encerramento de Bloco Sintático (Verifica se a próxima palavra exige quebra de oração)
                let proximaPalavra = palavras[i + 1] ? palavras[i + 1].toLowerCase() : null;
                const marcadoresTransicao = ['está', 'esta', 'tudo', 'como', 'vai', 'você', 'vc', 'o', 'qual', 'quando', 'é', 'eu'];

                if (proximaPalavra && marcadoresTransicao.includes(proximaPalavra) && fraseAtual.length >= 2) {
                    let subStr = fraseAtual.join(' ').toLowerCase();
                    let ehPergunta = pronomesInterrogativos.some(t => subStr.includes(t)) || 
                                     /\b(você|vc|está|esta|como|vai)\b/i.test(subStr);

                    if (ehPergunta) {
                        textoProcessadoLocal += fraseAtual.join(' ') + "? ";
                    } else {
                        textoProcessadoLocal += fraseAtual.join(' ') + ". ";
                    }
                    fraseAtual = []; // Reseta o buffer da frase atual
                }
            }

            // Limpeza e processamento do bloco final que restou
            if (fraseAtual.length > 0) {
                let subStr = fraseAtual.join(' ').toLowerCase();
                let ehPergunta = pronomesInterrogativos.some(t => subStr.includes(t)) || /\b(você|vc|está|esta|como|vai)\b/i.test(subStr);
                textoProcessadoLocal += fraseAtual.join(' ') + (ehPergunta ? "?" : ".");
            }

            // Normalização de Strings, espaçamentos e acertos de siglas
            let resultadoFinal = textoProcessadoLocal.replace(/\s+/g, ' ').trim();
            resultadoFinal = resultadoFinal.replace(/puc minas/gi, 'PUC Minas').replace(/\s+\?/g, '?').replace(/\s+\./g, '.');

            // Força a capitalização pós-pontuação no fallback local
            resultadoFinal = resultadoFinal.replace(/(?:\?\s*|^)([a-z])/gi, (match, letra) => match.replace(letra, letra.toUpperCase()));

            setTimeout(() => {
                areaTexto.innerText = resultadoFinal;
                statusText.innerText = '✅ Análise sintática e regras de pontuação aplicadas localmente! Traduzindo...';
                forcarTraducaoVlibras();
            }, 600);
        }
    }

    function forcarTraducaoVlibras() {
        if (areaTexto.innerText.trim() !== '') {
            const botaoVlibras = document.querySelector('[vw-access-button]');
            const janelaVlibras = document.querySelector('[vw-plugin-wrapper]');
            
            if (botaoVlibras && (!janelaVlibras || window.getComputedStyle(janelaVlibras).display === 'none')) {
                botaoVlibras.click();
            }

            const range = document.createRange();
            range.selectNodeContents(areaTexto);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            setTimeout(() => {
                const eventoMudar = new Event('change', { bubbles: true });
                areaTexto.dispatchEvent(eventoMudar);
            }, 500);
        }
    }

} else {
    btnGravar.disabled = true;
    statusText.innerText = 'Seu navegador não suporta a Web Speech API. Por favor, utilize o Google Chrome.';
}