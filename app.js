document.addEventListener('DOMContentLoaded', () => {
    const btnGravar = document.getElementById('btn-gravar');
    const areaTexto = document.getElementById('texto-transcrito');
    const statusText = document.getElementById('status-gravacao');

    const GEMINI_API_KEY = 'AIzaSyCrh8elS1iSIrdJyoYDBMmvUhKUoq7dMLQ';
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        btnGravar.disabled = true;
        statusText.innerText = '⚠️ Navegador não suporta a API de voz. Use o Google Chrome.';
        return;
    }

    let recognition = new SpeechRecognition();
    let gravando = false;
    let textoAcumulado = '';
    let ignorarResultados = false;

    function configurarRecognition() {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
            gravando = true;
            ignorarResultados = false;
            btnGravar.classList.remove('btn-danger');
            btnGravar.classList.add('btn-success');
            btnGravar.innerHTML = '🛑 Parar Gravação';
            statusText.innerText = '🎤 Ouvindo... Fale naturalmente.';
        };

        recognition.onresult = (event) => {
            if (ignorarResultados) return;

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
            console.error('Erro de gravação:', event.error);
            if(event.error === 'not-allowed') {
                statusText.innerText = '⚠️ Permissão de microfone negada! Libere no navegador.';
                gravando = false;
                resetarBotao();
            }
        };

        recognition.onend = () => {
            if(gravando) {
               gravando = false;
               resetarBotao();
            }
        };
    }

    function resetarBotao() {
        btnGravar.classList.remove('btn-success');
        btnGravar.classList.add('btn-danger');
        btnGravar.innerHTML = '🎤 Iniciar Gravação';
    }

    configurarRecognition();

    btnGravar.addEventListener('click', () => {
        if (gravando) {
            ignorarResultados = true;
            recognition.stop();
            gravando = false;
            resetarBotao();
            statusText.innerText = '🧠 Processando pontuação inteligente...';

            setTimeout(async () => {
                const textoParaProcessar = areaTexto.innerText.trim();
                if (textoParaProcessar !== '') {
                    await orquestradorDeNLP(textoParaProcessar);
                } else {
                    statusText.innerText = 'Microfone desligado. Nenhum áudio capturado.';
                }
            }, 300);
        } else {
            textoAcumulado = '';
            areaTexto.innerText = '';
            try {
                recognition.start();
            } catch (e) {
                recognition.stop();
                setTimeout(() => recognition.start(), 200);
            }
        }
    });

    async function orquestradorDeNLP(texto) {
        let textoProcessado = "";
        try {
            const res = await fetch('/api/processar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: texto })
            });
            if (res.ok) {
                const data = await res.json();
                textoProcessado = data.resultado;
                statusText.innerText = '✅ NLP concluído via Servidor! Traduzindo...';
            } else throw new Error("Back-end Vercel falhou");
        } catch (erroBackend) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
                const prompt = `Aja como revisor gramatical especialista. Pontue o texto com interrogações e vírgulas respeitando a sintaxe. Capitalize o início das frases. Mantenha as palavras originais intactas. Texto: "${texto}"`;
                const resGoogle = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                if (resGoogle.ok) {
                    const dataGoogle = await resGoogle.json();
                    textoProcessado = dataGoogle.candidates[0].content.parts[0].text.trim();
                    statusText.innerText = '✅ NLP concluído via IA Direta! Traduzindo...';
                } else throw new Error("API Google falhou");
            } catch (erroGoogle) {
                textoProcessado = aplicarRegrasOffline(texto);
                statusText.innerText = '✅ Regras Locais de Gramática aplicadas! Traduzindo...';
            }
        }

        areaTexto.innerText = textoProcessado;
        forcarTraducaoVlibras();
    }

    function aplicarRegrasOffline(t) {
        let texto = t.trim().toLowerCase();
        texto = texto.replace(/\b(olá|oi|bom dia|boa tarde|boa noite|nossa)\b\s+/g, "$1, ");
        texto = texto.replace(/\s+\b(mas|porém|entretanto|pois|então|porque)\b/g, ", $1");
        const perguntas = [/(como\s+você\s+está|tudo\s+bem(\s+com\s+você)?|como\s+vai(\s+você)?)/g, /((quem|onde|quando|qual|quais|por\s+que|o\s+que)\b.*?)(?=\s+(?:e|mas|ou)|$)/g, /(está\s+(estudando|fazendo|indo|bem))/g];
        perguntas.forEach(p => texto = texto.replace(p, match => match.trim() + "? "));
        texto = texto.replace(/\s+/g, ' ').trim();
        if (!texto.endsWith('?')) texto += '.';
        texto = texto.replace(/\s+\?/g, '?').replace(/\s+\./g, '.').replace(/,\s*\?/g, '?');
        return texto.replace(/(?:^|[.?]\s*)([a-zçáéíóúâêôãõ])/g, m => m.toUpperCase());
    }

    function forcarTraducaoVlibras() {
        const textoFinal = areaTexto.innerText.trim();
        if (textoFinal !== '') {
            const botaoVlibras = document.querySelector('[vw-access-button]');
            const wrapperVlibras = document.querySelector('[vw-plugin-wrapper]');
            
            if (botaoVlibras && wrapperVlibras) {
                if (!wrapperVlibras.classList.contains('active')) {
                    botaoVlibras.click(); 
                }
            }

            const range = document.createRange();
            range.selectNodeContents(areaTexto);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            setTimeout(() => {
                areaTexto.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, view: window }));
            }, 500);
        }
    }
});