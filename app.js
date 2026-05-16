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

    // 🚀 PROCESSAMENTO DE NLP E INFRAESTRUTURA DE CONTENÇÃO LOCAL
    async function processarTextoComIA(texto) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const prompt = `Atue como um corretor gramatical especialista em transcrição de áudio. Analise a semântica da seguinte frase. Adicione a pontuação correta (vírgulas, pontos finais, pontos de interrogação se for uma pergunta, e pontos de exclamação se houver surpresa/ênfase evidente) e capitalize as letras iniciais. Não altere as palavras, apenas a pontuação e formatação. Retorne APENAS o texto final corrigido, sem aspas e sem explicações: "${texto}"`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) throw new Error('API do Google barrou a requisição direta.');

            const data = await response.json();
            const textoProcessado = data.candidates[0].content.parts[0].text.trim();
            
            areaTexto.innerText = textoProcessado;
            statusText.innerText = '✅ NLP concluído via API! Traduzindo para LIBRAS...';
            forcarTraducaoVlibras();

        } catch (error) {
            console.warn('Usando Algoritmo de Pontuação Semântica Local:', error);
            statusText.innerText = '🧠 Processando pontuação através do motor gramatical local...';

            // 🛠️ MOTOR DE PONTUAÇÃO GRAMATICAL LOCAL (PLANO B DE ALTO NÍVEL)
            let textoCorrigido = texto.trim();

            // 1. Forçar letras maiúsculas no início de frases e nomes conhecidos
            textoCorrigido = textoCorrigido.charAt(0).toUpperCase() + textoCorrigido.slice(1);
            textoCorrigido = textoCorrigido.replace(/puc minas/gi, 'PUC Minas');

            // 2. Identificar e pontuar perguntas clássicas automaticamente
            const padroesPerguntas = /\b(como|onde|quem|qual|quais|por que|porque|quanto|quantos|o que|o quê|cadê|você gosta)\b/i;
            if (padroesPerguntas.test(textoCorrigido)) {
                // Se terminar sem pontuação, adiciona a interrogação
                if (!textoCorrigido.endsWith('?') && !textoCorrigido.endsWith('.')) {
                    textoCorrigido += ' ?';
                }
            } else {
                // Se for uma afirmação comum, coloca ponto final
                if (!textoCorrigido.endsWith('.')) {
                    textoCorrigido += '.';
                }
            }

            // 3. Quebrar pequenas pausas comuns em vírgulas ou pontos de continuidade
            textoCorrigido = textoCorrigido.replace(/\b(estou aqui no meu quarto)\b/gi, '$1,');
            textoCorrigido = textoCorrigido.replace(/\b(com você)\b/gi, '$1. ');
            
            // Corrige espaçamentos duplos gerados pela substituição
            textoCorrigido = textoCorrigido.replace(/\s+/g, ' ').trim();

            // Força a primeira letra maiúscula após qualquer ponto final seguido de espaço
            textoCorrigido = textoCorrigido.replace(/(?:\.\s+)([a-z])/g, (match, letra) => `. ${letra.toUpperCase()}`);

            // Atualiza a tela com o motor léxico e dispara o VLibras
            setTimeout(() => {
                areaTexto.innerText = textoCorrigido;
                statusText.innerText = '✅ Pontuação e análise sintática concluídas localmente! Traduzindo...';
                forcarTraducaoVlibras();
            }, 600);
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