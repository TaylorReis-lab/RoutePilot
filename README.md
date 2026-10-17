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

O **RoutePilot** é um **site web em React** que funciona como console/cliente completo para o **[OminRoute](https://omniroute.online)** — um gateway local open-source que **centraliza várias IAs** (OpenAI, Anthropic, Google Gemini, Mistral, Llama, Groq, Qwen, DeepSeek e dezenas de outros provedores, incluindo contas gratuitas) atrás de **um único endpoint compatível com a API da OpenAI**, rodando na sua máquina em `http://localhost:20128/v1`.

Com o RoutePilot você conversa com **todos os modelos que o seu OminRoute roteia** e gerencia o **sistema de memória e aprendizado persistente** (`/api/memory`) — direto do navegador, sem backend intermediário: o site faz as chamadas HTTP para o seu servidor local (ou qualquer outro compatível), permite anexar arquivos e imagens, exibe a resposta **em streaming token por token** e salva tudo localmente com criptografia.

> ✨ Também funciona com qualquer serviço compatível com a API OpenAI: **Ollama, LM Studio, llama.cpp, vLLM, LocalAI, OpenRouter** e o próprio OminRoute.

---

## 🖥️ Telas do aplicativo

| Aba | O que você encontra |
| --- | --- |
| 💬 **Chat** | Conversa em tempo real com streaming (SSE) sem *flicker*, Markdown completo (blocos de código com cabeçalho *sticky* e botão de copiar fixo, tabelas, listas), envio de arquivos e imagens, exibição de raciocínio de modelos (*thinking*), contagem de tokens, regenerar resposta, botão **Aprender** em cada resposta e histórico com múltiplas conversas. |
| 🔌 **Conexão** | Presets inteligentes de servidores (OminRoute, Ollama, LM Studio, llama.cpp, vLLM, OpenRouter), campos obrigatórios sinalizados com `*` em vermelho, URL, porta e rota separadas para chat (`/v1`) e para REST de gestão (`/api`), **API Key** e **Token de Gerenciamento** com **criptografia AES-256**, seletor de modo de visão (`image_url`), lista automática de modelos, temperatura, max tokens, system prompt, headers extras e proxy para CORS. |
| 🧠 **Memória** | Painel completo integrado à REST API de memória do OminRoute: **Memórias** (CRUD completo, busca por texto, filtro por tipo e `sessionId`, paginação e health check), **Aprendizado** (ativação de memória e extração automática no servidor, orçamento de tokens, retenção, estratégia e fonte de embeddings) e **Motor & Busca** (diagnóstico de FTS5/vetores/rerank, simulador *retrieve-preview*, reindexação, compactação de memórias antigas e configuração completa do **Qdrant**). |
| ℹ️ **Sobre** | Perfil do desenvolvedor Taylor Reis com links de GitHub e LinkedIn, contribuidores, lista detalhada de todos os tipos de arquivos aceitos, tabela comparativa de suporte a memória e visão entre servidores (OminRoute, Ollama, LM Studio, llama.cpp, vLLM, LocalAI e OpenRouter) com exemplos `curl`, roadmap de integrações futuras com sistemas SQL, anatomia da requisição, atalhos e FAQ. |

---

## ⚡ Funcionalidades

- ✅ **Streaming em tempo real** (SSE) — resposta renderizada token por token com rolagem estabilizada (sem tremer a tela) e botão flutuante para voltar ao fim da conversa
- ✅ **Presets de servidores com detecção automática** — um clique configura **OminRoute** (`localhost:20128/v1` + REST `/api`), Ollama, LM Studio, llama.cpp, vLLM e OpenRouter, exibindo o que cada servidor suporta
- ✅ **Listagem automática de modelos** via `GET /models` — ou digite manualmente (ex.: `"auto"` no OminRoute escolhe o melhor modelo sozinho)
- ✅ **Sistema de Memória e Aprendizado (OminRoute REST API)** — crie, busque, filtre, edite e exclua memórias (`factual`, `episodic`, `procedural`, `semantic`), ou clique em **Aprender** diretamente em qualquer resposta do chat
- ✅ **Motor de Memória, Playground & Qdrant** — simule buscas sem alterar dados (`POST /api/memory/retrieve-preview`), monitore FTS5 + `sqlite-vec` + Qdrant, dispare reindexação (`POST /api/memory/reindex`), compacte memórias antigas (`POST /api/memory/summarize`) e gerencie o Qdrant
- ✅ **Upload de arquivos e imagens no chat** — anexe até 5 arquivos por mensagem pelo botão de clipe (`📎`) ou arrastando e soltando (*drag & drop*): códigos/textos/dados entram formatados no prompt e imagens (`png`, `jpg`, `webp`, `gif`, `bmp`, `tiff`) são enviadas como blocos multimodais `image_url`
- ✅ **Dupla credencial criptografada com AES-GCM 256 bits** — tanto a **API Key** do chat quanto o **Token de Gerenciamento** (`requireManagementAuth`) são cifrados via Web Crypto API + PBKDF2 antes de salvar no `localStorage`
- ✅ **Markdown & código aprimorados** — blocos de código com rolagem interna e barra superior fixa (*sticky*) para copiar o código ou o Markdown original mesmo no fim de respostas longas
- ✅ **Limpeza automática do input** — o campo de mensagem é limpo imediatamente ao enviar, preservando o texto caso falte configurar o modelo
- ✅ **Múltiplas conversas** salvas no navegador, com título gerado automaticamente e envio do header `X-Session-Id`
- ✅ **Rodapé profissional dinâmico** — versão compacta (*slim*) no chat e versão completa com status em tempo real, rotas ativas, links rápidos e créditos nas demais abas
- ✅ **Proxy local incluso** (`proxy.mjs`) para contornar bloqueios de CORS sem dependências externas
- ✅ **Layout responsivo** com 4 abas (**Chat / Conexão / Memória / Sobre**), sem scroll horizontal e tema escuro *instrument panel*
- ✅ **Ícone e favicon próprios** em SVG, com versões PNG para PWA

---

## 🚀 Começando

### 1. Prepare o seu servidor de modelos

Por padrão o RoutePilot já vem configurado para o **OminRoute**. Se você ainda não tem um, instale e rode:

```bash
npm install -g omniroute
omniroute
# O gateway sobe em http://localhost:20128
# - Chat OpenAI-compatível: http://localhost:20128/v1
# - REST de gerenciamento/memória: http://localhost:20128/api
```

Você também pode usar qualquer outro serviço local ou em nuvem:

| Servidor | URL | Porta | Caminho base (Chat) | Rota REST (Gestão) | Memória no servidor | Visão (`image_url`) |
| --- | --- | --- | --- | --- | --- | --- |
| **OminRoute** *(padrão)* | `http://localhost` | `20128` | `/v1` | `/api` | ✅ Completa (FTS5 + Vec + Qdrant) | ✅ `image_url` |
| Ollama | `http://localhost` | `11434` | `/v1` | *(não possui)* | ❌ Stateless | ✅ `image_url` (`/v1`) / `images[]` (`/api/chat`) |
| LM Studio | `http://localhost` | `1234` | `/v1` | `/api/v0` *(modelos/stats)* | ❌ Stateless | ✅ `image_url` (data URI) |
| llama.cpp server | `http://localhost` | `8080` | *(vazio)* | *(não possui)* | ❌ Stateless | ✅ `image_url` (exige `--mmproj`) |
| vLLM / LocalAI | `http://localhost` | `8000` | `/v1` | *(não possui)* | ⚠️ LocalAI tem `/v1/stores` manual | ✅ `image_url` |
| OpenRouter | `https://openrouter.ai` | *(vazio)* | `/api/v1` | *(não possui)* | ❌ Stateless | ✅ `image_url` |

### 2. Rode o RoutePilot

```bash
npm install
npm run dev        # http://localhost:5173

# build de produção (gera o site estático em dist/)
npm run build
```

### 3. Conecte, converse e ensine a IA

1. Abra a aba **Conexão** (os campos obrigatórios estão marcados com `*` em vermelho)
2. Clique no preset **OminRoute** (ou informe URL + porta manualmente)
3. Clique em **Testar conexão** — a lista de modelos é carregada automaticamente
4. *(Opcional — para usar a aba Memória)* No card **REST de gerenciamento · memória**, confirme a rota `/api`, a porta (`20128` ou deixe em branco para usar a mesma do chat) e informe o **Token de gerenciamento** (`oma_live_…` ou chave com escopo `manage`/`admin`)
5. Volte para a aba **Chat** para conversar, anexar arquivos ou clicar em **Aprender** nas respostas 🎉

---

## 📎 Tipos de arquivos que você pode enviar para a IA

No **Composer** (botão `📎` ou arrastar e soltar), você pode anexar até **5 arquivos por mensagem** e clicar em **Tipos aceitos** para consultar a lista a qualquer momento:

| Categoria | Extensões aceitas | Como o RoutePilot envia |
| --- | --- | --- |
| **Código-fonte** | `.js` `.jsx` `.mjs` `.cjs` `.ts` `.tsx` `.py` `.java` `.kt` `.kts` `.go` `.rs` `.c` `.h` `.cpp` `.hpp` `.cc` `.cs` `.php` `.rb` `.swift` `.scala` `.lua` `.pl` `.r` `.m` `.sql` `.prisma` `.graphql` `.gql` `.proto` `.sol` `.dart` `.ex` `.exs` | Lido no navegador (até **200 KB** por arquivo) e inserido como bloco de código Markdown cercado (```` ```ext ````) para você revisar antes de enviar. |
| **Texto e dados** | `.txt` `.md` `.markdown` `.mdx` `.rst` `.tex` `.csv` `.tsv` `.json` `.jsonl` `.ndjson` `.xml` `.yml` `.yaml` `.toml` `.ini` `.cfg` `.conf` `.env` `.log` `.properties` `.editorconfig` | Lido como texto simples e anexado ao corpo da mensagem. |
| **Web e estilos** | `.html` `.htm` `.css` `.scss` `.sass` `.less` `.vue` `.svelte` `.astro` `.svg` | Lido como texto e formatado em bloco de código. |
| **Scripts e infra** | `.sh` `.bash` `.zsh` `.fish` `.ps1` `.bat` `.cmd` `Dockerfile` `.dockerignore` `Makefile` `.mk` `.gitignore` `.nginx` `.service` `.tf` `.tfvars` `.hcl` | Lido como texto e formatado no prompt. |
| **Imagens (Visão)** | `.png` `.jpg` `.jpeg` `.webp` `.gif` `.bmp` `.tiff` | Convertidas no navegador (até **5 MB** por imagem) para Data URI Base64 e enviadas no array multimodal `messages[].content` com `{ "type": "image_url", "image_url": { "url": "data:image/...;base64,..." } }`. |

> 💡 **Arquivos binários de escritório** (`.pdf`, `.docx`, `.xlsx`, `.zip`) não são convertidos diretamente: exporte para `.txt`, `.md` ou `.csv` antes de anexar.

---

## 🧠 Sistema de Memória e Aprendizado (REST API)

Todos os endpoints de memória do **OminRoute** exigem autenticação de gerenciamento (`requireManagementAuth`). Por isso, o RoutePilot mantém campos separados para a **API Key de chat** (`/v1`) e para o **Token de gerenciamento** (`/api`).

### Endpoints REST consumidos pelo RoutePilot

#### Core Memory (`/api/memory`)
| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/memory` | Lista paginada com filtros (`apiKeyId`, `type`, `sessionId`, `q`, `limit`, `page`, `offset`) e estatísticas (`stats.total`, `stats.tokensUsed`, `stats.hitRate`, `cacheStats`). |
| `POST` | `/api/memory` | Cria ou atualiza (upsert por `apiKeyId` + `key`) uma memória validada (`content`, `key`, `type`, `sessionId`, `apiKeyId`, `metadata`, `expiresAt`). |
| `GET` | `/api/memory/[id]` | Busca uma memória individual pelo UUID. |
| `PUT` | `/api/memory/[id]` | Atualiza campos da memória (`type`, `key`, `content`, `metadata`) e sincroniza o vetor. |
| `DELETE` | `/api/memory/[id]` | Remove a memória do SQLite, do `vec_memories` e do Qdrant. |
| `GET` | `/api/memory/health` | Executa o *round-trip* de verificação (`create → list → delete`) e retorna `{ working, latencyMs, error? }`. |

#### Memory Engine (`/api/memory/*`)
| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/memory/retrieve-preview` | Simula a recuperação de memórias (*dry-run*) retornando ranking com `score`, `tier`, `tokens`, `vecScore` e `ftsScore` sem injetar nem modificar dados. |
| `GET` | `/api/memory/embedding-providers` | Lista provedores e modelos de embedding indicando quais possuem chave configurada. |
| `GET` | `/api/memory/engine-status` | Diagnóstico completo do motor: FTS5, resolução de embeddings, `sqlite-vec`, saúde do Qdrant e rerank. |
| `POST` | `/api/memory/summarize` | Compacta memórias mais antigas que `olderThanDays` (suporta `dryRun: true` para pré-visualizar candidatos e economia de tokens). |
| `POST` | `/api/memory/reindex` | Dispara a reindexação vetorial em background (`force: false` para pendentes ou `force: true` para todos). |

#### Configurações & Qdrant (`/api/settings/*`)
| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` / `PUT` | `/api/settings/memory` | Lê e atualiza `MemorySettingsExtended` (`enabled`, `maxTokens`, `retentionDays`, `strategy`, `skillsEnabled`, `embeddingSource`, `vectorStore`, etc.). |
| `GET` / `PUT` | `/api/settings/qdrant` | Lê e atualiza a configuração do banco vetorial Qdrant (`enabled`, `host`, `port`, `collection`, `embeddingModel`, `quantization`, `apiKey`). |
| `GET` | `/api/settings/qdrant/health` | Probe de saúde e latência da instância Qdrant. |
| `POST` | `/api/settings/qdrant/search` | Teste de busca semântica direta no Qdrant (`query`, `topK`). |
| `POST` | `/api/settings/qdrant/cleanup` | Remove pontos expirados ou fora da janela de retenção no Qdrant. |
| `GET` | `/api/settings/qdrant/embedding-models` | Lista os modelos de embedding disponíveis para o Qdrant. |

### E nos outros servidores (Ollama, LM Studio, llama.cpp, vLLM, OpenRouter)?

- **Ollama, LM Studio, llama.cpp, vLLM e OpenRouter** são servidores de inferência *stateless*: eles **não possuem** endpoints `/api/memory` no servidor.
- Quando você seleciona um desses servidores, o RoutePilot detecta automaticamente, exibe um aviso amigável explicando o comportamento, mantém toda a continuidade pelo **histórico local de conversas** + **System Prompt** e mostra exemplos práticos de uso (ou como colocar o OminRoute na frente deles para ganhar memória persistente).
- **Roadmap SQL:** a arquitetura atual delega o armazenamento de memória à API do OminRoute (SQLite/FTS5 + `sqlite-vec` + Qdrant). O suporte opcional a conexões e integrações com sistemas **SQL** externos faz parte do roadmap futuro do projeto (documentado na aba *Sobre*).

---

## 🔒 Segurança das chaves

Suas credenciais **nunca são salvas em texto puro**:

- Ao digitar a **API Key** (chat) ou o **Token de Gerenciamento** (memória) na aba *Conexão*, ambos são criptografados **no próprio navegador** usando a **Web Crypto API**
- Algoritmo: **AES-GCM de 256 bits** com chave derivada por **PBKDF2 (100.000 iterações, SHA-256)**, salt de 16 bytes e IV de 12 bytes criptograficamente aleatórios a cada gravação
- O dado salvo no `localStorage` tem o formato `enc:v1:<salt>:<iv>:<ciphertext>` — só é descriptografado em memória no instante de autenticar a requisição HTTP com o seu servidor

---

## 🛡️ Proxy local para CORS (opcional)

Se o navegador bloquear a chamada por CORS (`Access-Control-Allow-Origin` ausente no servidor), use o proxy incluso — Node puro, sem dependências:

```bash
node proxy.mjs            # sobe em http://localhost:8787
# PORT=9000 node proxy.mjs   # outra porta
```

Depois, em **Conexão → Avançado → Usar proxy local (CORS)**, informe `http://localhost:8787`. O proxy repassa método, headers (`Authorization`, `X-Session-Id`, `HTTP-Referer`, `X-Title`, etc.), corpo e a resposta **com streaming**.

---

## 🔌 API esperada (Chat & Modelos)

Qualquer servidor **compatível com OpenAI** funciona para o chat:

| Endpoint | Descrição |
| --- | --- |
| `GET {base}/models` | Lista de modelos disponíveis (usada no botão *Testar conexão* — opcional) |
| `POST {base}/chat/completions` | Chat completion no formato OpenAI (`messages`, `temperature`, `max_tokens`, `stream`) |

Headers enviados automaticamente: `Content-Type`, `Accept`, `Authorization: Bearer <key>` (quando informada), `HTTP-Referer`, `X-Title` e `X-Session-Id`. Headers extras podem ser adicionados em *Avançado → Headers extras*.

---

## 🧠 Stack técnica

| Peça | Tecnologia |
| --- | --- |
| Front-end | React 19 + TypeScript 5 |
| Build | Vite 7 |
| Estilização | Tailwind CSS 4 |
| Markdown | react-markdown + remark-gfm |
| Ícones | lucide-react + SVGs vetoriais customizados |
| Criptografia | Web Crypto API (AES-GCM 256-bit / PBKDF2) |
| Proxy local | Node.js (sem dependências externas) |

---

## 📁 Estrutura do projeto

```text
├── index.html                  # Título, favicon, manifest e metatags
├── proxy.mjs                   # Proxy local anti-CORS (opcional)
├── public/
│   ├── favicon.svg             # Favicon vetorial
│   ├── icon.svg                # Ícone oficial do RoutePilot
│   ├── icon-192.png / icon-512.png / apple-touch-icon.png
│   └── manifest.webmanifest    # Manifesto PWA
└── src/
    ├── App.tsx                 # Layout, 4 abas, estado global, streaming e aprendizado
    ├── types.ts                # Contratos TypeScript (chat, conexão, memória e settings)
    ├── components/
    │   ├── ChatView.tsx        # Tela do chat (lista + mensagens + composer + scroll estável)
    │   ├── ConnectionView.tsx  # Tela de conexão (presets, chat /v1, REST /api, visão e chaves)
    │   ├── MemoryView.tsx      # Estúdio de memória (CRUD, aprendizado, motor, preview e Qdrant)
    │   ├── AboutView.tsx       # Sobre, equipe, tipos de arquivos, comparativo de servidores e roadmap SQL
    │   ├── ConversationList.tsx# Histórico de conversas na lateral/drawer
    │   ├── MessageItem.tsx     # Balão de mensagem (anexos, código, copiar, regenerar e aprender)
    │   ├── Markdown.tsx        # Renderização de markdown e blocos de código com topo fixo
    │   ├── Composer.tsx        # Caixa de mensagem com upload de arquivos, drag-and-drop e guia de tipos
    │   ├── Field.tsx           # Campos e cards de formulário com indicador * obrigatório em vermelho
    │   ├── SiteFooter.tsx      # Rodapé profissional (barra slim no chat e rodapé completo nas abas)
    │   └── SocialIcons.tsx     # Ícones vetoriais do GitHub e LinkedIn
    └── lib/
        ├── api.ts              # Cliente OpenAI-compatível (SSE, multimodal image_url e rotas REST)
        ├── memoryApi.ts        # Cliente REST autenticado para /api/memory e /api/settings/*
        ├── fileTypes.ts        # Catálogo canônico de extensões aceitas e limites de anexo
        ├── attachments.ts      # Leitura de arquivos no navegador (texto cercado e imagem base64)
        ├── serverProfiles.ts   # Perfis e exemplos de OminRoute, Ollama, LM Studio, llama.cpp, vLLM e OpenRouter
        ├── crypto.ts           # Criptografia AES-GCM 256 bits das credenciais
        └── storage.ts          # Persistência segura no localStorage com migração automática
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

O RoutePilot **não possui backend e não coleta dados**: todas as mensagens e chamadas de memória vão diretamente do seu navegador para o servidor que você configurou. Configurações, chaves criptografadas e conversas ficam apenas no `localStorage` do seu navegador — e podem ser apagadas a qualquer momento em *Limpar histórico*.

---

## 📝 Licença

Distribuído sob a licença **MIT**. Use, modifique e compartilhe à vontade.

<div align="center">
  <sub>Feito com 💜 por <strong>Taylor Reis</strong> — RoutePilot · Console OminRoute</sub>
</div>
