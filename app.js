const btnGravar = document.getElementById('btn-gravar');
const areaTexto = document.getElementById('texto-transcrito');
const statusText = document.getElementById('status-gravacao');

// 🔑 CHAVE DE API DO GEMINI
const GEMINI_API_KEY = 'AIzaSyCrh8elS1iSIrdJyoYDBMmvUhKUoq7dMLQ'; 

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    let gravando = false;
    let textoAcumulado = ''; 

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
        if (event.error !== 'no-speech') {
            statusText.innerText = 'Erro ao capturar áudio.';
        }
    };

    recognition.onend = async () => {
        gravando = false;
        btnGravar.classList.remove('btn-success');
        btnGravar.classList.add('btn-danger');
        btnGravar.innerHTML = '🎤 Iniciar Gravação';
        
        const textoParaProcessar = areaTexto.innerText.trim();

        if (textoParaProcessar !== '') {
            statusText.innerText = '🧠 Processando NLP e análise semântica estruturada...';
            await processarTextoComIA(textoParaProcessar);
        } else {
            statusText.innerText = 'Microfone desligado.';
        }
    };

    btnGravar.addEventListener('click', () => {
        if (gravando) {
            recognition.stop();
        } else {
            textoAcumulado = ''; 
            areaTexto.innerText = '';
            recognition.start();
        }
    });

    // 🚀 ENGINE DE PROCESSAMENTO DE LINGUAGEM NATURAL (NLP) COM BYPASS DE CORS
    async function processarTextoComIA(texto) {
        // Usando o proxy 'cors-anywhere' ou link alternativo para burlar a trava do navegador
        const urlOriginal = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const urlProxy = 'https://corsproxy.io/?' + encodeURIComponent(urlOriginal);
        
        const promptEspecialista = `Aja como um revisor gramatical especialista. Leia o texto de transcrição de áudio abaixo e reescreva-o aplicando a pontuação correta da língua portuguesa. 
Identifique claramente as frases interrogativas (fazendo perguntas com base em pronomes como como, onde, qual, quem, expressões interrogativas e semântica de questionamento) e as frases declarativas/afirmativas (usando ponto final). 
Posicione as vírgulas nos locais sintáticos corretos para separar orações, apostos e vocativos, respeitando a concordância e a coesão da língua portuguesa.
Mantenha rigorosamente o vocabulário original. Não adicione observações, explicações ou aspas. Retorne exclusivamente o texto corrigido estruturado.

Texto: "${texto}"`;

        try {
            // Faz a requisição passar pelo proxy de isolamento
            const response = await fetch(urlProxy, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: promptEspecialista
                        }]
                    }]
                })
            });

            if (!response.ok) throw new Error('Falha na ponte do servidor de IA.');

            const data = await response.json();
            
            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                const textoFinalPontuado = data.candidates[0].content.parts[0].text.trim();
                
                // Exibe o texto processado cognitivamente pela Inteligência Artificial
                areaTexto.innerText = textoFinalPontuado;
                statusText.innerText = '✅ NLP concluído via Inteligência Artificial! Traduzindo...';
                forcarTraducaoVlibras();
            } else {
                throw new Error('Resposta inválida do gateway.');
            }

        } catch (error) {
            console.warn('Proxy bloqueado ou instável. Iniciando Engine Léxico de Emergência:', error);
            statusText.innerText = '🧠 Processando pontuação através do motor sintático algorítmico local...';

            // 🛠️ MOTOR DE SEGURANÇA SINTÁTICO (Caso a rede caia de vez na faculdade)
            let palavras = texto.trim().split(/\s+/);
            let textoProcessadoLocal = "";
            let fraseAtual = [];

            const pronomesInterrogativos = ['como', 'onde', 'quem', 'qual', 'quais', 'por que', 'porque', 'quanto', 'quantos', 'o que', 'o quê', 'cadê', 'quando', 'será'];
            const marcadoresIniciais = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'nossa'];
            const gatilhosVirgula = ['mas', 'porém', 'contudo', 'entretanto', 'pois', 'então', 'porque'];

            for (let i = 0; i < palavras.length; i++) {
                let palavraAtual = palavras[i];
                let palavraMinuscula = palavraAtual.toLowerCase();

                if (fraseAtual.length === 0) {
                    palavraAtual = palavraAtual.charAt(0).toUpperCase() + palavraAtual.slice(1);
                }

                if (marcadoresIniciais.includes(palavraMinuscula) && fraseAtual.length === 0 && i < palavras.length - 1) {
                    palavraAtual += ",";
                }

                if (gatilhosVirgula.includes(palavraMinuscula) && fraseAtual.length > 0) {
                    let uIdx = fraseAtual.length - 1;
                    if (!fraseAtual[uIdx].endsWith(',') && !fraseAtual[uIdx].endsWith('.')) {
                        fraseAtual[uIdx] += ",";
                    }
                }

                fraseAtual.push(palavraAtual);

                let proximaPalavra = palavras[i + 1] ? palavras[i + 1].toLowerCase() : null;
                const gatilhosTransicao = ['está', 'esta', 'tudo', 'como', 'vai', 'você', 'vc', 'o', 'qual', 'quando', 'é'];

                if (proximaPalavra && gatilhosTransicao.includes(proximaPalavra) && fraseAtual.length >= 2) {
                    let subStr = fraseAtual.join(' ').toLowerCase();
                    let ehPergunta = pronomesInterrogativos.some(t => subStr.includes(t)) || 
                                     /\b(você|vc|está|esta|como|vai)\b/i.test(subStr);

                    if (ehPergunta) {
                        textoProcessadoLocal += fraseAtual.join(' ') + "? ";
                    } else {
                        textoProcessadoLocal += fraseAtual.join(' ') + ". ";
                    }
                    fraseAtual = [];
                }
            }

            if (fraseAtual.length > 0) {
                let subStr = fraseAtual.join(' ').toLowerCase();
                let ehPergunta = pronomesInterrogativos.some(t => subStr.includes(t)) || /\b(você|vc|está|esta|como|vai)\b/i.test(subStr);
                textoProcessadoLocal += fraseAtual.join(' ') + (ehPergunta ? "?" : ".");
            }

            let resultadoFinal = textoProcessadoLocal.replace(/\s+/g, ' ').trim();
            resultadoFinal = resultadoFinal.replace(/puc minas/gi, 'PUC Minas').replace(/\s+\?/g, '?').replace(/\s+\./g, '.');

            setTimeout(() => {
                areaTexto.innerText = resultadoFinal;
                statusText.innerText = '✅ Pontuação algorítmica concluída! Traduzindo...';
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