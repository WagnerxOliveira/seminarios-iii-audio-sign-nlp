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
                areaTexto.value = '';
                areaTexto.innerText = '';
                areaTexto.innerHTML = '';
                statusText.innerText = '🧹 Texto apagado via comando de voz!';
                return;
            }

            // Atualiza o campo tratando as variações de elementos do DOM
            if (areaTexto.value !== undefined) {
                areaTexto.value = textoCompletoAtual;
            } else {
                areaTexto.innerText = textoCompletoAtual;
            }
        };

        recognition.onerror = (event) => {
            console.error('Erro na captura do áudio: ', event.error);
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
            statusText.innerText = '🧠 Processando NLP e análise semântica estruturada...';
            recognition.stop();
            
            setTimeout(async () => {
                const textoParaProcessar = (areaTexto.value || areaTexto.innerText || '').trim();
                if (textoParaProcessar !== '') {
                    await chamarServidorNLP(textoParaProcessar);
                } else {
                    statusText.innerText = 'Microfone desligado. Nenhum áudio capturado.';
                }
            }, 400);

        } else {
            // FIX: Limpeza absoluta de todas as propriedades do campo para reiniciar do zero
            textoAcumulado = ''; 
            areaTexto.value = '';
            areaTexto.innerText = '';
            areaTexto.innerHTML = '';
            
            recognition = new SpeechRecognition();
            configurarRecognition();
            
            try {
                recognition.start();
            } catch (e) {
                console.warn("Gerenciamento de concorrência de áudio ativo:", e);
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
                // Injeta o texto estruturado e pontuado de volta no campo
                if (areaTexto.value !== undefined) {
                    areaTexto.value = data.resultado;
                } else {
                    areaTexto.innerText = data.resultado;
                }
                
                statusText.innerText = '✅ NLP concluído com sucesso! Traduzindo para LIBRAS...';
                forcarTraducaoVlibras();
            } else {
                throw new Error('Resposta sem payload de dados.');
            }

        } catch (error) {
            console.error('Falha de gateway:', error);
            statusText.innerText = '⚠️ Erro ao conectar com o servidor de NLP.';
        }
    }

    function forcarTraducaoVlibras() {
        const textoLimpio = (areaTexto.value || areaTexto.innerText || '').trim();
        if (textoLimpio !== '') {
            const botaoVlibras = document.querySelector('[vw-access-button]');
            const janelaVlibras = document.querySelector('[vw-plugin-wrapper]');
            
            if (botaoVlibras && (!janelaVlibras || window.getComputedStyle(janelaVlibras).display === 'none')) {
                botaoVlibras.click();
            }

            // Seleção universal de texto compatível com inputs, textareas e blocos de texto
            if (typeof areaTexto.select === 'function') {
                areaTexto.select();
            } else {
                const range = document.createRange();
                range.selectNodeContents(areaTexto);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
            
            // Dispara múltiplos gatilhos de eventos assincronamente para forçar a captura do VLibras
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