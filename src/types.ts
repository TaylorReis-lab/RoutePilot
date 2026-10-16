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
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
