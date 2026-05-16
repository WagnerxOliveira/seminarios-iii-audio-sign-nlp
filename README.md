# Sistema de Transcrição Acessível - MVP

## Arquitetura Atualizada (Pivô Estratégico)
Devido a restrições operacionais e foco estrito na entrega de valor para o usuário final, a arquitetura do projeto foi simplificada para o MVP. 

A dependência de infraestrutura externa (Firebase e Google Cloud Speech-to-Text API) foi substituída por tecnologias Client-Side:
1. **Reconhecimento de Voz:** Utilização da `Web Speech API` nativa dos navegadores (Chrome), garantindo transcrição em tempo real sem latência de rede.
2. **Tradução LIBRAS:** Implementação do widget oficial do VLibras.
3. **Hospedagem:** Vercel (CI/CD via GitHub).

Esta abordagem garante a total funcionalidade dos requisitos de acessibilidade levantados com a comunidade, eliminando pontos únicos de falha relacionados a chamadas de API em back-end não consolidado.