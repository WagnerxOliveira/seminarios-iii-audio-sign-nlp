# Sistema de Transcrição Acessível com NLP e LIBRAS

Análise, projeto e desenvolvimento de um Produto Mínimo Viável (MVP) focado em acessibilidade comunicativa, desenvolvido para a disciplina de **Seminários III** no curso de **Ciência da Computação — PUC Minas (Campus Poços de Caldas)**.

---

## 🚀 Sobre o Projeto

O sistema resolve um problema clássico de acessibilidade digital: a conversão de fala em tempo real para texto e sua respectiva tradução para a Língua Brasileira de Sinais (LIBRAS). 

O grande diferencial técnico deste MVP é a **integração de Processamento de Linguagem Natural (NLP)**. Tradicionalmente, APIs de conversão de voz para texto (Speech-to-Text) capturam palavras de forma contínua, sem pontuação ou análise gramatical, gerando textos confusos para leitura e de difícil interpretação para ferramentas de tradução mecânica. Este software captura a voz, processa o contexto semântico através de uma rede neural avançada para aplicar a pontuação correta da língua portuguesa e, em seguida, automatiza a tradução visual.

---

## 🛠️ Arquitetura e Engenharia de Solução (Pivô Estratégico)

O planejamento inicial do projeto previa uma infraestrutura complexa com *back-end* baseado em Firebase e consumo direto da API Google Cloud Speech-to-Text. Visando a otimização do tempo de entrega, estabilidade e eliminação de latência de rede desnecessária para o usuário final, a arquitetura foi reformulada para uma abordagem moderna de **Edge/Client-Side Execution**:

1. **Captura e Transcrição de Áudio (Client-Side):** Executada nativamente no motor do navegador utilizando a **Web Speech API**. Isso permite o processamento imediato do áudio local sem gargalos de upload de arquivos de voz.
2. **Camada de NLP (Inteligência Artificial):** O texto bruto transcrito é enviado assincronamente (`fetch` API) para os modelos generativos da **Gemini API** via *Google AI Studio*. A rede neural analisa o contexto semântico do texto bruto, inferindo e aplicando:
   * Pontos de interrogação baseados em estruturas de perguntas.
   * Pontos de exclamação baseados em expressões de ênfase ou surpresa.
   * Ajuste fino de vírgulas, pontos finais e capitalização de letras iniciais.
3. **Mecanismo de Acessibilidade (LIBRAS):** Implementação e automação do plugin oficial do **VLibras**.
4. **Automação de Fluxo:** Implementação de manipulação de DOM e `Selection Range` no JavaScript para simular interações de usuário. Assim que a IA conclui a pontuação, o sistema força o destaque do texto e ativa os gatilhos de animação do avatar tridimensional instantaneamente.

---

## 📦 Estrutura de Arquivos

O projeto adota uma estrutura limpa e modular de Front-end estático de alta performance:

```text
├── index.html       # Estrutura semântica, importação do Bootstrap e do Widget VLibras.
├── style.css        # Estilização customizada e comportamento de inputs editáveis.
├── app.js           # Core lógico (Web Speech API + Chamadas assíncronas de NLP + Automação VLibras).
└── README.md        # Documentação técnica e acadêmica do projeto.