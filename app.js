const btnGravar = document.getElementById('btn-gravar');
const textArea = document.getElementById('texto-transcrito');
const statusText = document.getElementById('status-gravacao');

// Verifica suporte do navegador
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Continua gravando até mandarmos parar
    recognition.interimResults = true; // Mostra resultados enquanto a pessoa fala
    recognition.lang = 'pt-BR';

    let gravando = false;

    recognition.onstart = () => {
        gravando = true;
        btnGravar.classList.remove('btn-danger');
        btnGravar.classList.add('btn-success');
        btnGravar.innerHTML = '🛑 Parar Gravação';
        statusText.innerText = 'Ouvindo... Fale agora.';
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
        
        // Atualiza o campo de texto
        textArea.value = transcricaoFinal + transcricaoIntermediaria;
    };

    recognition.onerror = (event) => {
        console.error('Erro de reconhecimento: ', event.error);
        statusText.innerText = 'Erro ao capturar áudio. Tente novamente ou use o teclado.';
    };

    recognition.onend = () => {
        gravando = false;
        btnGravar.classList.remove('btn-success');
        btnGravar.classList.add('btn-danger');
        btnGravar.innerHTML = '🎤 Iniciar Gravação';
        statusText.innerText = 'Microfone desligado.';
    };

    // Controle de clique no botão
    btnGravar.addEventListener('click', () => {
        if (gravando) {
            recognition.stop();
        } else {
            // Limpa a área antes de nova gravação
            textArea.value = '';
            recognition.start();
        }
    });

} else {
    // Tratamento para navegadores incompatíveis
    btnGravar.disabled = true;
    statusText.innerText = 'Seu navegador não suporta a Web Speech API. Use o Google Chrome.';
}