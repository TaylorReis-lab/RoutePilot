<div align="center">

# 🛰️ RoutePilot

### Console web para o **OminRoute** — converse com todas as suas IAs em um só lugar

Idealizado e desenvolvido por **[Taylor Reis](https://github.com/TaylorReis-lab)**

[![GitHub](https://img.shields.io/badge/GitHub-TaylorReis--lab-181717?style=for-the-badge&logo=github)](https://github.com/TaylorReis-lab)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-taylorreis--dev-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/taylorreis-dev)
[![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/Licença-MIT-16a34a?style=for-the-badge)](LICENSE)

</div>

---

## 📖 O que é o RoutePilot?

O **RoutePilot** é um **site web em React** que funciona como console/cliente para o **[OminRoute](https://omniroute.online)** — um gateway local open-source que **centraliza várias IAs** (OpenAI, Anthropic, Google Gemini, Mistral, Llama, Groq e dezenas de outros provedores, incluindo contas gratuitas) atrás de **um único endpoint compatível com a API da OpenAI**, rodando na sua máquina em `http://localhost:20128/v1`.

Com o RoutePilot você conversa com **todos os modelos que o seu OminRoute roteia** — direto do navegador, sem backend próprio: o site faz as chamadas HTTP para o seu servidor local (ou qualquer outro compatível), exibe a resposta **em streaming token por token** e salva tudo localmente.

> ✨ Também funciona com qualquer serviço compatível com a API OpenAI: **Ollama, LM Studio, llama.cpp, vLLM, LocalAI, OpenRouter** e o próprio OminRoute.

---

## 🖥️ Telas do aplicativo

| Aba | O que você encontra |
| --- | --- |
| 💬 **Chat** | Conversa em tempo real com streaming (SSE), Markdown completo (código com botão de copiar, tabelas, listas), exibição de raciocínio de modelos (*thinking*), contagem de tokens, regenerar resposta e histórico com múltiplas conversas. |
| 🔌 **Conexão** | Presets de servidores prontos (OminRoute, Ollama, LM Studio, llama.cpp, vLLM, OpenRouter), URL, porta, caminho base, API Key com **criptografia AES-256**, lista automática de modelos, temperatura, max tokens, system prompt, headers extras e proxy para CORS. |
| ℹ️ **Sobre** | Perfil do desenvolvedor Taylor Reis com links de GitHub e LinkedIn, contribuidores, explicação de como o app funciona, anatomia da requisição, atalhos e FAQ. |

---

## ⚡ Funcionalidades

- ✅ **Streaming em tempo real** (SSE) — a resposta aparece token por token, com botão de **parar a geração**
- ✅ **Presets de servidores** — um clique preenche URL, porta e caminho base do **OminRoute** (`localhost:20128/v1`), Ollama, LM Studio, llama.cpp, vLLM e OpenRouter
- ✅ **Listagem automática de modelos** via `GET /models` — ou digite manualmente (ex.: `"auto"` no OminRoute escolhe o melhor modelo sozinho)
- ✅ **API Key criptografada** com **AES-GCM 256 bits** (Web Crypto API + PBKDF2) antes de salvar no `localStorage`
- ✅ **Markdown & código** — blocos de código com destacador de linguagem e botão de copiar, tabelas, citações e cabeçalhos
- ✅ **Múltiplas conversas** salvas no navegador, com renomear automático pelo título da primeira mensagem
- ✅ **Regenerar resposta**, **system prompt**, **headers extras**, **temperatura** e **max tokens**
- ✅ **Proxy local incluso** (`proxy.mjs`) para contornar bloqueios de CORS sem dependências externas
- ✅ **Layout responsivo** com abas (Chat / Conexão / Sobre), sem scroll horizontal e tema escuro moderno
- ✅ **Ícone e favicon próprios** em SVG, com versões PNG para PWA

---

## 🚀 Começando

### 1. Prepare o seu servidor de modelos

Por padrão o RoutePilot já vem configurado para o **OminRoute**. Se você ainda não tem um, instale e rode:

```bash
npm install -g omniroute
omniroute
# O gateway sobe em http://localhost:20128 com endpoint OpenAI-compatível em /v1
```

Você também pode usar qualquer outro serviço local:

| Servidor | URL | Porta | Caminho base |
| --- | --- | --- | --- |
| **OminRoute** *(padrão)* | `http://localhost` | `20128` | `/v1` |
| Ollama | `http://localhost` | `11434` | `/v1` |
| LM Studio | `http://localhost` | `1234` | `/v1` |
| llama.cpp server | `http://localhost` | `8080` | *(vazio)* |
| vLLM / LocalAI | `http://localhost` | `8000` | `/v1` |
| OpenRouter | `https://openrouter.ai` | *(vazio)* | `/api/v1` |

### 2. Rode o RoutePilot

```bash
npm install
npm run dev        # http://localhost:5173

# build de produção (gera o site estático em dist/)
npm run build
```

### 3. Conecte e converse

1. Abra a aba **Conexão**
2. Clique no preset **OminRoute** (ou informe URL + porta manualmente)
3. Clique em **Testar conexão** — a lista de modelos é carregada automaticamente
4. Escolha o modelo e volte para a aba **Chat** para conversar 🎉

---

## 🔒 Segurança da API Key

Sua chave **nunca é salva em texto puro**:

- Ao digitar a chave na aba *Conexão*, ela é criptografada **no próprio navegador** usando a **Web Crypto API**
- Algoritmo: **AES-GCM de 256 bits** com chave derivada por **PBKDF2 (100.000 iterações)**, salt e IV criptograficamente aleatórios a cada gravação
- O dado salvo no `localStorage` tem o formato `enc:v1:<salt>:<iv>:<ciphertext>` — só é descriptografado em memória, um instante antes de autenticar com o seu servidor

---

## 🛡️ Proxy local para CORS (opcional)

Se o navegador bloquear a chamada por CORS (`Access-Control-Allow-Origin` ausente no servidor), use o proxy incluso — Node puro, sem dependências:

```bash
node proxy.mjs            # sobe em http://localhost:8787
# PORT=9000 node proxy.mjs   # outra porta
```

Depois, em **Conexão → Avançado → Usar proxy local (CORS)**, informe `http://localhost:8787`. O proxy repassa método, headers, corpo e a resposta **com streaming**.

---

## 🔌 API esperada

Qualquer servidor **compatível com OpenAI** funciona:

| Endpoint | Descrição |
| --- | --- |
| `GET {base}/models` | Lista de modelos disponíveis (usada no botão *Testar conexão* — opcional) |
| `POST {base}/chat/completions` | Chat completion no formato OpenAI (`messages`, `temperature`, `max_tokens`, `stream`) |

Headers enviados automaticamente: `Content-Type`, `Accept`, `Authorization: Bearer <key>` (quando informada), `HTTP-Referer` e `X-Title`. Headers extras podem ser adicionados em *Avançado → Headers extras*.

---

## 🧠 Stack técnica

| Peça | Tecnologia |
| --- | --- |
| Front-end | React 19 + TypeScript |
| Build | Vite 7 |
| Estilização | Tailwind CSS 4 |
| Markdown | react-markdown + remark-gfm |
| Ícones | lucide-react |
| Criptografia | Web Crypto API (AES-GCM / PBKDF2) |
| Proxy local | Node.js (sem dependências) |

---

## 📁 Estrutura do projeto

```text
├── index.html                  # Título, favicon, manifest e metatags
├── netlify.toml                # Configuração de build e deploy (SPA + cache de ícones)
├── proxy.mjs                   # Proxy local anti-CORS (opcional)
├── public/
│   ├── favicon.svg             # Favicon vetorial
│   ├── icon.svg                # Ícone oficial do RoutePilot
│   ├── icon-192.png / icon-512.png / apple-touch-icon.png
│   └── manifest.webmanifest    # Manifesto PWA
└── src/
    ├── App.tsx                 # Layout, abas, estado global e chamadas de streaming
    ├── components/
    │   ├── ChatView.tsx        # Tela do chat (lista + mensagens + composer)
    │   ├── ConnectionView.tsx  # Tela de conexão (presets, URL, porta, chave)
    │   ├── AboutView.tsx       # Sobre, equipe, FAQ e documentação interna
    │   ├── ConversationList.tsx# Histórico de conversas
    │   ├── MessageItem.tsx     # Balão de mensagem (usuário/assistente)
    │   ├── Markdown.tsx        # Renderização de markdown e código
    │   ├── Composer.tsx        # Caixa de envio da mensagem
    │   ├── Field.tsx           # Campos de formulário com * obrigatório
    │   └── SocialIcons.tsx     # Ícones GitHub/LinkedIn
    └── lib/
        ├── api.ts              # Cliente OpenAI-compatível (SSE + fallback JSON)
        ├── crypto.ts           # Criptografia AES-GCM da API Key
        └── storage.ts          # Persistência no localStorage
```

---

## 🤝 Contribuindo

1. Faça um **fork** deste repositório
2. Crie uma branch: `git checkout -b feat/minha-melhoria`
3. Commit: `git commit -m "feat: minha melhoria"`
4. Push: `git push origin feat/minha-melhoria`
5. Abra um **Pull Request**

Toda contribuição é bem-vinda — testes com novos servidores locais, melhorias de UI, correções de bugs e traduções.

---

## 👥 Equipe

| Papel | Quem | Links |
| --- | --- | --- |
| 🧑‍💻 **Criador & Lead Developer** | **Taylor Reis** | [GitHub](https://github.com/TaylorReis-lab) · [LinkedIn](https://www.linkedin.com/in/taylorreis-dev) |
| 🌐 **Contribuidores** | Comunidade Open Source | via Pull Requests & Issues |

---

## 🛡️ Privacidade

O RoutePilot **não possui backend e não coleta dados**: todas as mensagens vão diretamente do seu navegador para o servidor que você configurou. Configurações e conversas ficam apenas no `localStorage` do seu navegador — e podem ser apagadas a qualquer momento em *Limpar histórico*.

---

## 📝 Licença

Distribuído sob a licença **MIT**. Use, modifique e compartilhe à vontade.

<div align="center">
  <sub>Feito com 💜 por <strong>Taylor Reis</strong> — RoutePilot · Console OminRoute</sub>
</div>
