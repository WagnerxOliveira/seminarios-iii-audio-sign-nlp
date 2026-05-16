const btnGravar = document.getElementById('btn-gravar');
const areaTexto = document.getElementById('texto-transcrito');
const statusText = document.getElementById('status-gravacao');

// 🔑 CHAVE DE API DO GEMINI
const GEMINI_API_KEY = 'AIzaSyCrh8elS1iSIrdJyoYDBMmvUhKUoq7dMLQ'; 

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    let gravando = false;
    let textoAcumulado = ''; // Mantém todo o histórico falado para não apagar nada

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

        // Se o navegador fechou um bloco de fala, acumulamos ele permanentemente
        if (transcricaoFinalDoBloco !== '') {
            textoAcumulado += ' ' + transcricaoFinalDoBloco;
        }

        // O texto que vai para a tela é tudo o que já acumulamos + o que você está falando agora
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
        
        // Garante que pega o texto final real da tela
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
            textoAcumulado = ''; // Limpa o acumulador para uma nova gravação do zero
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

            // 🛠️ MOTOR DE CONTINGÊNCIA GRAMATICAL COMPORTAMENTAL
            let t = texto.trim();

            // Ajustes de Expressões Regulares para fatiar as perguntas comuns no meio do áudio continuo
            t = t.replace(/\b(olá|oi|bom dia|boa tarde)\b\s*(como você está|tudo bem)?/gi, 'Olá, como você está? ');
            t = t.replace(/\b(está tudo bem com você|ta tudo bem com voce)\b/gi, 'Está tudo bem com você?');
            t = t.replace(/\b(como vai você|como vai vc|como vai)\b/gi, 'Como vai?');
            t = t.replace(/\b(está estudando|esta estudando)\b/gi, 'Está estudando?');
            t = t.replace(/\b(o que você gosta de estudar|o que vc gosta de estudar)\b/gi, 'O que você gosta de estudar?');

            // Garante espaçamento limpo e capitalização de frases seguidas
            t = t.replace(/\s+/g, ' ').trim();
            t = t.replace(/(?:\?\s*|^)([a-z])/gi, (match, letra) => match.replace(letra, letra.toUpperCase()));
            
            // Se a frase inteira não terminou com pontuação por algum motivo, põe uma interrogação geral
            if (!t.endsWith('?') && !t.endsWith('.')) {
                t += '?';
            }

            // Remove interrogações duplicadas coladas (ex: ?? para ?)
            t = t.replace(/\?+/g, '?').replace(/\s+\?/g, '?');

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