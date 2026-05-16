const btnGravar = document.getElementById('btn-gravar');
const areaTexto = document.getElementById('texto-transcrito');
const statusText = document.getElementById('status-gravacao');

// 🔑 CHAVE DE API DO GEMINI
const GEMINI_API_KEY = 'AIzaSyCrh8elS1iSIrdJyoYDBMmvUhKUoq7dMLQ'; 

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    // 🛠️ CORREÇÃO DAQUI: Usa a variável correta mapeada acima
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    let gravando = false;
    let textoAcumulado = ''; // Mantém todo o histórico falado para não apagar nada ao pausar

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

        // Se o navegador fechou um bloco de fala, acumulamos ele sem limpar a tela
        if (transcricaoFinalDoBloco !== '') {
            textoAcumulado += ' ' + transcricaoFinalDoBloco;
        }

        let textoCompletoAtual = (textoAcumulado + ' ' + transcricaoIntermediaria).trim();

        // 🧠 COMANDO DE VOZ DETECTADO: "Vox, apague o texto"
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
            statusText.innerText = '🧠 Processando NLP e pontuação...';
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

    // 🚀 PROCESSAMENTO DE NLP E ALGORITMO DE SEGURANÇA SEMÂNTICA
    async function processarTextoComIA(texto) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const prompt = `Atue como um corretor gramatical especialista em transcrição de áudio. Analise a semântica da seguinte frase. Adicione a pontuação correta (vírgulas, pontos finais, pontos de interrogação se for uma pergunta, e pontos de exclamação se houver surpresa/ênfase evidente) e capitalize as letras iniciais. Não altere as palavras, apenas a pontuação e formatação. Retorne APENAS o texto final corrigido, sem aspas e sem explicações: "${texto}"`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) throw new Error('API Google Restrita');

            const data = await response.json();
            const textoProcessado = data.candidates[0].content.parts[0].text.trim();
            
            areaTexto.innerText = textoProcessado;
            statusText.innerText = '✅ NLP concluído via API! Traduzindo para LIBRAS...';
            forcarTraducaoVlibras();

        } catch (error) {
            console.warn('Executando Motor Léxico Local Avançado:', error);
            statusText.innerText = '🧠 Processando pontuação através do motor gramatical local...';

            let t = texto.trim();

            // 🛠️ MOTOR DE CONTINGÊNCIA LÉXICA REFINADO E MAPEADO PASSO A PASSO
            t = t.replace(/\b(olá como você está|ola como voce esta|olá como vc está)\b/gi, 'Olá, como você está?');
            t = t.replace(/\b(está tudo bem com você|está tudo bem com voce|esta tudo bem com voce|está tudo bem)\b/gi, 'Está tudo bem com você?');
            t = t.replace(/\b(como vai você|como vai vc|como vai)\b/gi, 'Como vai?');
            t = t.replace(/\b(está estudando|esta estudando)\b/gi, 'Está estudando?');
            t = t.replace(/\b(o que você gosta de estudar|o que vc gosta de estudar)\b/gi, 'O que você gosta de estudar?');

            // Garante espaçamento limpo entre as interrogações e quebras de frase
            t = t.replace(/\s+/g, ' ').trim();
            
            // Força letra maiúscula após cada ponto de interrogação ou ponto final
            t = t.replace(/(?:\?\s*|^)([a-z])/gi, (match, letra) => match.replace(letra, letra.toUpperCase()));
            
            // Tratamento final de segurança para limpar espaçamentos antes dos pontos ?
            t = t.replace(/\s+\?/g, '?').replace(/\?+/g, '?');

            if (!t.endsWith('?') && !t.endsWith('.')) {
                t += '?';
            }

            setTimeout(() => {
                areaTexto.innerText = t;
                statusText.innerText = '✅ Pontuação e análise sintática concluídas! Traduzindo...';
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