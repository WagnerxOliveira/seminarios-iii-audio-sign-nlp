# 🎙️ VoxScript: Sistema de Transcrição Acessível

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

O **VoxScript** é um Produto Mínimo Viável (MVP) focado em acessibilidade e Processamento de Linguagem Natural (PLN). A aplicação realiza a captura de voz em tempo real, aplica regras gramaticais e de pontuação de forma automatizada via Inteligência Artificial, e converte o resultado final em Língua Brasileira de Sinais (LIBRAS) através da integração com o widget oficial do Governo Federal.

## ✨ Funcionalidades Principais

- **Reconhecimento de Voz Contínuo:** Captura de áudio em tempo real utilizando a `Web Speech API`.
- **Tradução Automática para LIBRAS:** Integração responsiva com o avatar 3D do `VLibras`.
- **Comandos de Voz Inteligentes:** Sistema hands-free. (Ex: dizer *"Vox, apague o texto"* limpa o buffer e a interface automaticamente).
- **Processamento de Linguagem Natural (PLN):** O texto bruto capturado passa por um motor cognitivo que analisa a semântica e a sintaxe, aplicando pontos, vírgulas e letras maiúsculas de acordo com o contexto da frase.

## 🏗️ Arquitetura de Tripla Redundância (Anti-Falhas)

Para garantir alta disponibilidade e resiliência, o sistema de pontuação inteligente foi projetado com três camadas de *fallback*:

1. **Camada 1 (Produção): Back-end Serverless (Vercel Functions).** O texto é enviado a uma rota isolada em Node.js (`/api/processar`), contornando bloqueios de CORS e acionando o modelo Gemini (Google AI Studio) com um *prompt* especialista em PLN.
2. **Camada 2 (Desenvolvimento/Contingência 1): Chamada Client-Side.** Caso o servidor da Vercel falhe, o front-end assume a requisição e tenta contato direto com a API de Inteligência Artificial.
3. **Camada 3 (Offline/Contingência 2): Motor Heurístico Local.** Em caso de queda total de rede ou indisponibilidade da API, um algoritmo nativo em JavaScript assume a análise léxica (POS Tagging simulado), isolando vocativos, adjuntos e identificando pronomes interrogativos para pontuar o texto localmente antes de enviá-lo ao VLibras.

## 💻 Tecnologias Utilizadas

- **Front-end:** HTML5, CSS3, Bootstrap 5, JavaScript Vanilla (DOM Manipulation & Web APIs).
- **Back-end:** Node.js operando em arquitetura Serverless (Vercel).
- **Inteligência Artificial:** Gemini 1.5 Flash API (Google).
- **Acessibilidade:** VLibras (LAPI/UFPB).
- **Deploy:** Vercel (CI/CD integrado com GitHub).

## 🚀 Como Executar o Projeto

1. Clone este repositório:
   ```bash
   git clone