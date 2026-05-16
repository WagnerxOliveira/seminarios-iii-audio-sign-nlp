const btnGravar = document.getElementById('btn-gravar');
const areaTexto = document.getElementById('texto-transcrito');
const statusText = document.getElementById('status-gravacao');

// 🔑 CHAVE DE API DO GEMINI (Google AI Studio)
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

    // 🚀 ENGINE DE PROCESSAMENTO DE LINGUAGEM NATURAL (API GEMINI)
    async function processarTextoComIA(texto) {
        // Endpoint oficial estável para chamadas globais
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        // Prompt especialista estruturado com base nas diretrizes gramaticais fornecidas
        const promptEspecialista = `Aja como um revisor gramatical especialista. Leia o texto de transcrição de áudio abaixo e reescreva-o aplicando a pontuação correta da língua portuguesa. 
Identifique claramente as frases interrogativas (fazendo perguntas com base nos pronomes, inversões e semântica de questionamento) e as frases declarativas/afirmativas (usando ponto final). 
Posicione as vírgulas nos locais sintáticos corretos para separar orações, apostos e vocativos, respeitando as pausas lógicas da fala.
Mantenha rigorosamente o vocabulário original. Não adicione observações, explicações ou aspas no início e fim. Retorne exclusivamente o texto corrigido.

Texto: "${texto}"`;

        try {
            const response = await fetch(url, {
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

            if (!response.ok) {
                const erroDetalhado = await response.text();
                throw new Error(`Restrição de gateway/CORS: ${erroDetalhado}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                const textoFinalPontuado = data.candidates[0].content.parts[0].text.trim();
                
                // Atualiza o DOM com o resultado do processamento cognitivo da IA
                areaTexto.innerText = textoFinalPontuado;
                statusText.innerText = '✅ Processamento NLP concluído com sucesso! Traduzindo...';
                forcarTraducaoVlibras();
            } else {
                throw new Error('Estrutura de resposta inesperada da API.');
            }

        } catch (error) {
            console.error('Falha na comunicação com o provedor de NLP:', error);
            statusText.innerText = '⚠️ Falha no processamento remoto de IA. Executando normalização básica...';
            
            // Tratamento fallback mínimo de concordância local para não quebrar a execução
            let textoFallback = texto.trim();
            textoFallback = textoFallback.charAt(0).toUpperCase() + textoFallback.slice(1);
            if (!textoFallback.endsWith('.') && !textoFallback.endsWith('?')) {
                textoFallback += '.';
            }
            areaTexto.innerText = textoFallback;
            forcarTraducaoVlibras();
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