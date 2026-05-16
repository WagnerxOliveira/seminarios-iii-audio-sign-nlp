const btnGravar = document.getElementById('btn-gravar');
const areaTexto = document.getElementById('texto-transcrito');
const statusText = document.getElementById('status-gravacao');

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
        };

        recognition.onend = () => {
            gravando = false;
            btnGravar.classList.remove('btn-success');
            btnGravar.classList.add('btn-danger');
            btnGravar.innerHTML = '🎤 Iniciar Gravação';
        };
    }

    btnGravar.addEventListener('click', () => {
        if (gravando) {
            statusText.innerText = '🧠 Enviando ao back-end para processamento de NLP cognitivo...';
            recognition.stop();
            
            setTimeout(async () => {
                const textoParaProcessar = areaTexto.innerText.trim();
                if (textoParaProcessar !== '') {
                    await chamarServidorNLP(textoParaProcessar);
                } else {
                    statusText.innerText = 'Microfone desligado. Nenhum áudio capturado.';
                }
            }, 400);

        } else {
            textoAcumulado = ''; 
            areaTexto.innerText = '';
            
            recognition = new SpeechRecognition();
            configurarRecognition();
            
            try {
                recognition.start();
            } catch (e) {
                console.warn(e);
            }
        }
    });

    async function chamarServidorNLP(texto) {
        try {
            const response = await fetch('/api/processar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: texto })
            });

            if (!response.ok) throw new Error('Erro na resposta do back-end serverless.');

            const data = await response.json();
            
            if (data.resultado) {
                areaTexto.innerText = data.resultado;
                statusText.innerText = '✅ NLP concluído via servidor dedicado! Traduzindo para LIBRAS...';
                forcarTraducaoVlibras();
            } else {
                throw new Error('Resposta sem dados.');
            }

        } catch (error) {
            console.warn('Servidor falhou. Ativando Motor de PLN Local de Emergência:', error);
            statusText.innerText = '🧠 Processando pontuação através das regras gramaticais locais...';

            // 🛡️ MOTOR DE PLN DE EMERGÊNCIA (Baseado nos conceitos de POS Tagging e Regras de Vírgula)
            let palavras = texto.trim().split(/\s+/);
            let textoProcessadoLocal = "";
            let fraseAtual = [];

            const pronomesInterrogativos = ['como', 'onde', 'quem', 'qual', 'quais', 'por que', 'porque', 'quanto', 'quantos', 'o que', 'o quê', 'cadê', 'quando', 'será'];
            const vocativosESaudacoes = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'nossa', 'uau'];
            const adjuntosEConjuncoes = ['mas', 'porém', 'contudo', 'entretanto', 'pois', 'então', 'já que', 'ontem', 'hoje', 'agora'];

            for (let i = 0; i < palavras.length; i++) {
                let palavraAtual = palavras[i];
                let palavraMinuscula = palavraAtual.toLowerCase();

                if (fraseAtual.length === 0) {
                    palavraAtual = palavraAtual.charAt(0).toUpperCase() + palavraAtual.slice(1);
                }

                // Isolar vocativos/chamamentos com vírgula
                if (vocativosESaudacoes.includes(palavraMinuscula) && fraseAtual.length === 0 && i < palavras.length - 1) {
                    palavraAtual += ",";
                }

                // Inserir vírgula antes de adjuntos ou conjunções
                if (adjuntosEConjuncoes.includes(palavraMinuscula) && fraseAtual.length > 0) {
                    let uIdx = fraseAtual.length - 1;
                    if (!fraseAtual[uIdx].endsWith(',') && !fraseAtual[uIdx].endsWith('.') && !fraseAtual[uIdx].endsWith('?')) {
                        fraseAtual[uIdx] += ",";
                    }
                }

                fraseAtual.push(palavraAtual);

                let proximaPalavra = palavras[i + 1] ? palavras[i + 1].toLowerCase() : null;
                const marcadoresTransicao = ['está', 'esta', 'tudo', 'como', 'vai', 'você', 'vc', 'o', 'qual', 'quando', 'é', 'eu'];

                // Analisa fim de frase/sintaxe
                if (proximaPalavra && marcadoresTransicao.includes(proximaPalavra) && fraseAtual.length >= 2) {
                    let subStr = fraseAtual.join(' ').toLowerCase();
                    let ehPergunta = pronomesInterrogativos.some(t => subStr.includes(t)) || 
                                     /\b(você|vc|está|esta|como|vai)\b/i.test(subStr);

                    textoProcessadoLocal += fraseAtual.join(' ') + (ehPergunta ? "? " : ". ");
                    fraseAtual = [];
                }
            }

            if (fraseAtual.length > 0) {
                let subStr = fraseAtual.join(' ').toLowerCase();
                let ehPergunta = pronomesInterrogativos.some(t => subStr.includes(t)) || /\b(você|vc|está|esta|como|vai)\b/i.test(subStr);
                textoProcessadoLocal += fraseAtual.join(' ') + (ehPergunta ? "?" : ".");
            }

            let resultadoFinal = textoProcessadoLocal.replace(/\s+/g, ' ').trim().replace(/\s+\?/g, '?').replace(/\s+\./g, '.');
            resultadoFinal = resultadoFinal.replace(/(?:\?\s*|^)([a-z])/gi, (match, letra) => match.replace(letra, letra.toUpperCase()));

            setTimeout(() => {
                areaTexto.innerText = resultadoFinal;
                statusText.innerText = '✅ Regras de pontuação aplicadas localmente! Traduzindo...';
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