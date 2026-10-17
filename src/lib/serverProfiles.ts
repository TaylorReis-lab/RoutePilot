/**
 * Perfis conhecidos de servidores: como configurar cada um, o que eles oferecem
 * (memória persistente, imagens/visão) e exemplos prontos de requisição.
 *
 * Referência das pesquisas:
 * - OmniRoute  → gateway com REST de gerenciamento em /api (memória, Qdrant, settings)
 * - Ollama     → /v1 (OpenAI-compatível) + /api/chat nativo com campo `images`
 * - LM Studio  → /v1 (OpenAI/Anthropic-compatível) + REST nativa /api/v0
 * - llama.cpp  → /v1 ou raiz, visão com `image_url` quando servido com --mmproj
 * - vLLM       → /v1 (chat, completions, embeddings, rerank, score) e /v1/messages
 * - LocalAI    → /v1 + "stores"/embeddings (memória vetorial manual, não auto-injection)
 * - OpenRouter → /api/v1, stateless (sem memória no servidor; histórico é local)
 */

export type MemorySupport = "full" | "partial" | "none";
export type VisionFormat = "image_url" | "ollama-images" | "image_url+images" | "none";

export interface ServerProfile {
  id: string;
  name: string;
  tagline: string;
  host: string;
  port: string;
  basePath: string;
  /** Rota da API de gerenciamento/REST; null quando o servidor não tem. */
  restPath: string | null;
  memory: MemorySupport;
  memoryNote: string;
  memoryEndpoints?: string[];
  vision: VisionFormat;
  visionNote: string;
  endpoints: string[];
  modelExamples: string[];
  chatExample: string;
  memoryExample?: string;
}

export const SERVER_PROFILES: ServerProfile[] = [
  {
    id: "omniroute",
    name: "OminRoute",
    tagline: "Gateway que centraliza várias IAs num endpoint só",
    host: "http://localhost",
    port: "20128",
    basePath: "/v1",
    restPath: "/api",
    memory: "full",
    memoryNote:
      "Tem sistema de memória completo: SQLite/FTS5, embeddings, Qdrant opcional, extração automática de fatos e injeção de contexto. Tudo pela REST API de gerenciamento em /api/memory, protegida por requireManagementAuth.",
    memoryEndpoints: [
      "GET/POST /api/memory",
      "GET/PUT/DELETE /api/memory/{id}",
      "GET /api/memory/health",
      "POST /api/memory/retrieve-preview",
      "GET /api/memory/engine-status",
      "POST /api/memory/summarize",
      "POST /api/memory/reindex",
      "GET/PUT /api/settings/memory",
      "GET/PUT /api/settings/qdrant",
    ],
    vision: "image_url",
    visionNote:
      "Aceita o formato OpenAI de `image_url` com data URI; o roteamento traduz para o provedor escolhido. Use um modelo com visão (GPT-4o, Claude, Gemini, Llama 3.2 Vision…).",
    endpoints: [
      "GET /v1/models",
      "POST /v1/chat/completions",
      "POST /v1/responses",
      "POST /v1/embeddings",
      "POST /v1/images/generations",
      "GET /api/memory",
      "GET /dashboard → Memory Studio",
    ],
    modelExamples: ["auto", "cc/claude-sonnet-4-6", "openai/gpt-4o-mini"],
    chatExample: `curl -s http://localhost:20128/v1/chat/completions \\
  -H "Authorization: Bearer $OMNIROUTE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "auto",
    "messages": [{ "role": "user", "content": "Resuma isto" }],
    "stream": true
  }'`,
    memoryExample: `# criar/lembrar um fato (precisa de token de gerenciamento)
curl -s -X POST http://localhost:20128/api/memory \\
  -H "Authorization: Bearer $OMNIROUTE_MANAGEMENT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "preference:idioma",
    "content": "Prefere respostas em português (BR)",
    "type": "factual",
    "apiKeyId": "<uuid-da-chave-de-chat>"
  }'`,
  },
  {
    id: "ollama",
    name: "Ollama",
    tagline: "Modelos locais com runtime próprio",
    host: "http://localhost",
    port: "11434",
    basePath: "/v1",
    restPath: null,
    memory: "none",
    memoryNote:
      "Não tem API de memória persistente. O Ollama mantém apenas o contexto que você reenvia (ou a sessão `prompt_keep_alive`). Para aprendizado use o histórico local do RoutePilot, ou aponte o RoutePilot para um OminRoute que roteie o Ollama.",
    vision: "image_url+images",
    visionNote:
      "Pelo /v1/chat/completions aceita `image_url` com data URI (formato OpenAI); a API nativa /api/chat usa `\"images\": [\"<base64 sem prefixo>\"]`. Só funcionam modelos de visão: llava, llama3.2-vision, qwen2.5-vl, gemma3…",
    endpoints: [
      "GET /v1/models",
      "POST /v1/chat/completions",
      "POST /v1/embeddings",
      "POST /api/chat  (nativo, suporta images)",
      "POST /api/generate",
      "GET /api/tags",
      "GET /api/show",
    ],
    modelExamples: ["llama3.1:8b", "qwen2.5-coder:7b", "llava:13b", "gemma3:4b"],
    chatExample: `curl -s http://localhost:11434/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{ "model": "llama3.1:8b",
         "messages": [{ "role": "user", "content": "Olá" }],
         "stream": true }'`,
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    tagline: "App desktop com servidor local",
    host: "http://localhost",
    port: "1234",
    basePath: "/v1",
    restPath: "/api/v0",
    memory: "none",
    memoryNote:
      "Sem memória persistente do servidor. A REST nativa /api/v0 expõe modelos, embeddings e estatísticas, mas não um store de fatos. O aprendizado fica no histórico local do RoutePilot.",
    vision: "image_url",
    visionNote:
      "Aceita blocos `image_url`. Versões recentes esperam a data URI completa (`data:image/png;base64,…`); em algumas builds o campo é exigido em formato base64 puro — teste com o modelo de visão carregado antes de confiar.",
    endpoints: [
      "GET /v1/models",
      "POST /v1/chat/completions",
      "POST /v1/responses",
      "POST /v1/embeddings",
      "GET /api/v0/models  (REST nativa, com TTFT e tok/s)",
      "POST /api/v0/chat/completions",
      "POST /api/v0/embeddings",
    ],
    modelExamples: ["local-model", "qwen2.5-coder-32b-instruct", "pixtral-12b"],
    chatExample: `curl -s http://localhost:1234/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{ "model": "local-model",
         "messages": [{ "role": "user", "content": "Olá" }] }'`,
  },
  {
    id: "llamacpp",
    name: "llama.cpp server",
    tagline: "Servidor mínimo, sem caminho /v1 obrigatório",
    host: "http://localhost",
    port: "8080",
    basePath: "",
    restPath: null,
    memory: "none",
    memoryNote:
      "É um servidor de inferência puro: sem memória, sem histórico no servidor. Reenvie o contexto a cada chamada (o RoutePilot já faz isso) e use o histórico local para continuidade.",
    vision: "image_url",
    visionNote:
      "Só aceita imagens se iniciado com --mmproj (ou -hf de um modelo multimodal). Aceita `image_url` com URL remota, base64 puro ou data URI (jpeg, png, bmp, gif, tga via stb_image).",
    endpoints: [
      "GET /models  (ou /v1/models)",
      "POST /chat/completions  (ou /v1/chat/completions)",
      "POST /v1/completions",
      "POST /v1/embeddings",
      "POST /rerank  (com --reranking)",
      "GET /props · /health",
    ],
    modelExamples: ["gemma-3-4b-it-Q4_K_M", "qwen3-vl-30b (com --mmproj)"],
    chatExample: `curl -s http://localhost:8080/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{ "messages": [{ "role": "user", "content": "Olá" }],
         "stream": true }'`,
  },
  {
    id: "vllm",
    name: "vLLM / LocalAI (OpenAI-compatível)",
    tagline: "Inferência de alta performance em produção",
    host: "http://localhost",
    port: "8000",
    basePath: "/v1",
    restPath: null,
    memory: "none",
    memoryNote:
      "vLLM não guarda memória de conversa: é um motor de inferência stateless com /v1/chat/completions, embeddings, rerank e score. O LocalAI, embora compatível, tem apenas “stores” de vetores (get/set/find) — dá para montar memória por conta própria, mas não há injeção automática de fatos.",
    vision: "image_url",
    visionNote:
      "vLLM aceita `image_url` com data URI para modelos multimodais (inicie com --limit-mm-per-prompt). LocalAI aceita o mesmo formato em backends de visão.",
    endpoints: [
      "GET /v1/models",
      "POST /v1/chat/completions",
      "POST /v1/completions",
      "POST /v1/embeddings",
      "POST /v1/rerank · /v2/rerank",
      "POST /v1/score · /tokenize",
      "LocalAI: POST /v1/stores/{name}/{get|set|find|delete}",
    ],
    modelExamples: ["meta-llama/Llama-3.1-8B-Instruct", "Qwen/Qwen2.5-VL-7B"],
    chatExample: `curl -s http://localhost:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{ "model": "meta-llama/Llama-3.1-8B-Instruct",
         "messages": [{ "role": "user", "content": "Olá" }],
         "stream": true }'`,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    tagline: "Roteador em nuvem (mesmo formato, sem servidor local)",
    host: "https://openrouter.ai",
    port: "",
    basePath: "/api/v1",
    restPath: null,
    memory: "none",
    memoryNote:
      "O OpenRouter é explicitamente stateless: não há API de memória persistente nem estado entre requisições (o /v1/responses rejeita store:true). O histórico do app web deles é local-first, no navegador. A API REST serve para modelos, credits, key e geração (/api/v1/generation).",
    vision: "image_url",
    visionNote:
      "Aceita `image_url` (data URI ou URL) nos modelos multimodais; imagens retornadas por ferramentas também são suportadas nas rotas /v1/responses e /v1/chat/completions.",
    endpoints: [
      "GET /api/v1/models",
      "POST /api/v1/chat/completions",
      "POST /api/v1/responses",
      "GET /api/v1/generation?id=…",
      "GET /api/v1/credits · /api/v1/key",
    ],
    modelExamples: ["anthropic/claude-sonnet-4.5", "openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct:free"],
    chatExample: `curl -s https://openrouter.ai/api/v1/chat/completions \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "model": "openai/gpt-4o-mini",
         "messages": [{ "role": "user", "content": "Olá" }] }'`,
  },
];

export const MEMORY_SUPPORT_LABEL: Record<MemorySupport, string> = {
  full: "Memória nativa",
  partial: "Parcial",
  none: "Sem memória no servidor",
};

export const VISION_SUPPORT_LABEL: Record<VisionFormat, string> = {
  image_url: "image_url (OpenAI)",
  "ollama-images": "images[] (Ollama)",
  "image_url+images": "image_url + images[]",
  none: "Sem imagens",
};

export function detectProfile(config: { host: string; port: string; basePath: string }): ServerProfile {
  const haystack = `${config.host} ${config.port} ${config.basePath}`.toLowerCase();
  if (/20128|omniroute|ominroute/.test(haystack)) return SERVER_PROFILES[0];
  if (/11434|ollama/.test(haystack)) return SERVER_PROFILES[1];
  if (/1234|lm[- ]?studio/.test(haystack)) return SERVER_PROFILES[2];
  if (/openrouter/.test(haystack)) return SERVER_PROFILES[5];
  if (/8000|vllm/.test(haystack)) return SERVER_PROFILES[4];
  if (/localai/.test(haystack)) return SERVER_PROFILES[4];
  if (/llama\.cpp|llamacpp|:8080/.test(haystack)) return SERVER_PROFILES[3];
  return SERVER_PROFILES[0];
}
