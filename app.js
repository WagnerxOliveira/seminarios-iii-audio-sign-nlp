const btnGravar = document.getElementById('btn-gravar');
const areaTexto = document.getElementById('texto-transcrito');
const statusText = document.getElementById('status-gravacao');

// 🔑 COLE A CHAVE QUE VOCÊ COPIOU EXATAMENTE AQUI, DENTRO DAS ASPAS:
const GEMINI_API_KEY = 'AIzaSyCrh8elS1iSIrdJyoYDBMmvUhKUoq7dMLQ'; 

// Verifica suporte do navegador para Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    let gravando = false;
    let textoBruto = '';

    recognition.onstart = () => {
        gravando = true;
        btnGravar.classList.remove('btn-danger');
        btnGravar.classList.add('btn-success');
        btnGravar.innerHTML = '🛑 Parar Gravação';
        statusText.innerText = 'Ouvindo... Fale naturalmente.';
    };

    recognition.onresult = (event) => {
        let transcricaoFinal = '';
        let transcricaoIntermediaria = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                transcricaoFinal += event.results[i][0].transcript;
            } else {
                transcricaoIntermediaria += event.results[i][0].transcript;
            }
        }
        
        textoBruto = transcricaoFinal;
        areaTexto.innerText = transcricaoFinal + transcricaoIntermediaria;
    };

    recognition.onerror = (event) => {
        console.error('Erro de reconhecimento: ', event.error);
        statusText.innerText = 'Erro ao capturar áudio. Verifique o microfone.';
    };

    // Evento disparado ao parar a gravação
    recognition.onend = async () => {
        gravando = false;
        btnGravar.classList.remove('btn-success');
        btnGravar.classList.add('btn-danger');
        btnGravar.innerHTML = '🎤 Iniciar Gravação';
        
        if (areaTexto.innerText.trim() !== '') {
            statusText.innerText = '🧠 Processando NLP e pontuação com Inteligência Artificial...';
            
            // Chama a IA (Gemini) para processar o texto
            await processarTextoComIA(areaTexto.innerText);
        } else {
            statusText.innerText = 'Microfone desligado.';
        }
    };

    btnGravar.addEventListener('click', () => {
        if (gravando) {
            recognition.stop();
        } else {
            areaTexto.innerText = '';
            recognition.start();
        }
    });

    // 🚀 A MÁGICA DO NLP: Enviando o texto para a API do Gemini
    async function processarTextoComIA(texto) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        // O prompt que orienta a rede neural a pontuar corretamente
        const prompt = `Atue como um corretor gramatical especialista em transcrição de áudio. Analise a semântica da seguinte frase. Adicione a pontuação correta (vírgulas, pontos finais, pontos de interrogação se for uma pergunta, e pontos de exclamação se houver surpresa/ênfase evidente) e capitalize as letras iniciais. Não altere as palavras, apenas a pontuação e formatação. Retorne APENAS o texto final corrigido, sem aspas e sem explicações: "${texto}"`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error('Falha na API da IA');

            const data = await response.json();
            // Pega a resposta limpa da IA
            const textoProcessado = data.candidates[0].content.parts[0].text.trim();
            
            // Atualiza a tela com o texto perfeitamente pontuado
            areaTexto.innerText = textoProcessado;
            statusText.innerText = '✅ NLP concluído! Traduzindo para LIBRAS...';
            
            // Chama o VLibras logo após a IA terminar de escrever
            forcarTraducaoVlibras();

        } catch (error) {
            console.error('Erro no processamento da IA:', error);
            statusText.innerText = 'Erro na IA. Usando texto bruto. Traduzindo...';
            forcarTraducaoVlibras(); // Traduz o texto bruto mesmo se a IA falhar
        }
    }

    // Função que força o VLibras a abrir, seleciona o texto e inicia a animação
    function forcarTraducaoVlibras() {
        if (areaTexto.innerText.trim() !== '') {
            // 1. Força a abertura física da janela do avatar se ela estiver fechada
            const botaoVlibras = document.querySelector('[vw-access-button]');
            const janelaVlibras = document.querySelector('[vw-plugin-wrapper]');
            
            // Se a janela não tiver a classe 'active' ou não estiver visível, simulamos o clique para abrir
            if (botaoVlibras && (!janelaVlibras || window.getComputedStyle(janelaVlibras).display === 'none')) {
                botaoVlibras.click();
            }

            // 2. Seleciona o texto na tela para o motor do VLibras capturar
            const range = document.createRange();
            range.selectNodeContents(areaTexto);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // 3. Pequeno truque de tempo (delay) para dar espaço ao avatar carregar e iniciar a animação
            setTimeout(() => {
                // Dispara um evento no texto selecionado para o VLibras entender o gatilho instantaneamente
                const eventoMudar = new Event('change', { bubbles: true });
                areaTexto.dispatchEvent(eventoMudar);
            }, 500);
        }
    }

} else {
    // Alerta caso o navegador não seja compatível
    btnGravar.disabled = true;
    statusText.innerText = 'Seu navegador não suporta a Web Speech API. Por favor, utilize o Google Chrome.';
}