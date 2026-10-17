export type Role = "user" | "assistant" | "system";

export interface Usage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** Data URLs (data:image/png;base64,…) enviadas como blocos de visão. */
  images?: string[];
  /** Nomes dos arquivos anexados, exibidos no balão da mensagem. */
  attachments?: string[];
  createdAt: number;
  model?: string;
  reasoning?: string;
  usage?: Usage;
  error?: boolean;
  streaming?: boolean;
}

export interface ConnectionConfig {
  /** Host sem porta, ex.: http://localhost ou https://openrouter.ai/api */
  host: string;
  /** Porta do servidor, ex.: 11434 (vazio = usa a porta padrão do host) */
  port: string;
  /** Caminho base da API, ex.: /v1 (vazio para servidores estilo llama.cpp) */
  basePath: string;
  apiKey: string;
  /** OmniRoute management / REST authentication; separate from inference API Key. */
  managementKey: string;
  /** Optional override for the management API port; blank uses the inference port. */
  managementPort: string;
  /** Management API route prefix, normally /api. */
  managementPath: string;
  /** Optional OmniRoute inference key UUID used to scope memories. */
  memoryApiKeyId: string;
  model: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  systemPrompt: string;
  /** Headers extras no formato "Chave: valor" (um por linha) */
  extraHeaders: string;
  referer: string;
  appTitle: string;
  useProxy: boolean;
  proxyUrl: string;
  /** "auto"/"openai" enviam imagens como blocos image_url; "off" nunca envia. */
  visionMode: "auto" | "openai" | "off";
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export type MemoryType = "factual" | "episodic" | "procedural" | "semantic";

export interface MemoryEntry {
  id: string;
  key: string;
  content: string;
  type: MemoryType;
  sessionId?: string;
  apiKeyId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string | null;
  accessCount?: number;
  lastAccessedAt?: string | null;
}

export interface MemoryStats {
  total?: number;
  tokensUsed?: number;
  hitRate?: number;
  cacheStats?: { hits?: number; misses?: number };
  byType?: Record<string, number>;
}

export interface MemoryPage {
  memories: MemoryEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  stats: MemoryStats;
}

export interface MemorySettings {
  enabled?: boolean;
  maxTokens?: number;
  retentionDays?: number;
  strategy?: "recent" | "semantic" | "hybrid";
  skillsEnabled?: boolean;
  embeddingSource?: "remote" | "static" | "transformers" | "auto";
  embeddingProviderModel?: string | null;
  customBaseUrl?: string | null;
  customModelId?: string | null;
  transformersEnabled?: boolean;
  staticEnabled?: boolean;
  rerankEnabled?: boolean;
  rerankProviderModel?: string | null;
  vectorStore?: "sqlite-vec" | "qdrant" | "auto";
  primaryBackend?: string;
  fallbackBackends?: string[];
  backendConfigs?: Record<string, Record<string, unknown>>;
}
