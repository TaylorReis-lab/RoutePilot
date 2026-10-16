import type { ChatMessage, ConnectionConfig, Usage } from "../types";

export class ApiError extends Error {
  status?: number;
  details?: string;
  constructor(message: string, status?: number, details?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const stripTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");

export function buildBaseUrl(config: ConnectionConfig): string {
  const rawHost = stripTrailingSlash(config.host || "http://localhost");
  const port = (config.port || "").trim();
  const basePath = stripTrailingSlash(config.basePath || "");
  // permite colar a porta direto no host (ex.: http://localhost:11434)
  const portInHost = /^https?:\/\/[^/]+:\d+/i.test(rawHost);
  const host = port && !portInHost ? `${rawHost}:${port}` : rawHost;
  if (!basePath) return host;
  // evita duplicar o caminho base quando ele já estiver no host
  const hostPath = host.replace(/^https?:\/\/[^/]+/i, "");
  if (hostPath.toLowerCase().endsWith(basePath.toLowerCase())) return host;
  return `${host}${basePath}`;
}

/** URL final (aplicando proxy opcional) de um endpoint do servidor. */
export function buildEndpoint(config: ConnectionConfig, endpoint: string): string {
  const base = buildBaseUrl(config);
  const full = `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  if (config.useProxy && config.proxyUrl.trim()) {
    const proxy = stripTrailingSlash(config.proxyUrl.trim());
    return `${proxy}/proxy?url=${encodeURIComponent(full)}`;
  }
  return full;
}

function parseExtraHeaders(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const idx = line.indexOf(":");
      if (idx <= 0) return;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key) out[key] = value;
    });
  return out;
}

export function buildHeaders(config: ConnectionConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (config.apiKey.trim()) headers.Authorization = `Bearer ${config.apiKey.trim()}`;
  if (config.referer.trim()) headers["HTTP-Referer"] = config.referer.trim();
  if (config.appTitle.trim()) headers["X-Title"] = config.appTitle.trim();
  return { ...headers, ...parseExtraHeaders(config.extraHeaders) };
}

function isJsonResponse(res: Response) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json");
}

async function readErrorMessage(res: Response): Promise<{ message: string; details?: string }> {
  let raw = "";
  try {
    raw = await res.text();
  } catch {
    raw = "";
  }
  if (!raw) {
    return { message: `HTTP ${res.status} ${res.statusText || ""}`.trim() };
  }
  try {
    const json = JSON.parse(raw);
    const message =
      json?.error?.message ||
      json?.message ||
      (typeof json?.error === "string" ? json.error : "") ||
      `HTTP ${res.status}`;
    return { message, details: raw.slice(0, 1200) };
  } catch {
    return { message: `HTTP ${res.status} ${res.statusText || ""}`.trim(), details: raw.slice(0, 1200) };
  }
}

export interface ModelInfo {
  id: string;
  name?: string;
}

export async function fetchModels(config: ConnectionConfig, signal?: AbortSignal): Promise<ModelInfo[]> {
  const url = buildEndpoint(config, "/models");
  let res: Response;
  try {
    res = await fetch(url, { headers: buildHeaders(config), signal });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique URL/porta, se o serviço está rodando e as permissões de CORS.",
      undefined,
      (err as Error)?.message,
    );
  }
  if (!res.ok) {
    const { message, details } = await readErrorMessage(res);
    throw new ApiError(message, res.status, details);
  }
  const json = await res.json();
  const list = Array.isArray(json) ? json : json?.data || json?.models || [];
  if (!Array.isArray(list)) return [];
  return list
    .map((item: any) => {
      if (typeof item === "string") return { id: item, name: item };
      return { id: item?.id || item?.name || "", name: item?.name || item?.id || "" };
    })
    .filter((m: ModelInfo) => Boolean(m.id));
}

export interface StreamHandlers {
  onDelta: (chunk: { content?: string; reasoning?: string; full: string }) => void;
}

export interface StreamResult {
  content: string;
  reasoning: string;
  usage?: Usage;
  model?: string;
}

function buildRequestBody(
  config: ConnectionConfig,
  messages: ChatMessage[],
  stream: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    model: config.model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream,
  };
  if (typeof config.temperature === "number") payload.temperature = config.temperature;
  if (config.maxTokens > 0) payload.max_tokens = config.maxTokens;
  if (stream) payload.stream_options = { include_usage: true };
  return payload;
}

export async function streamChat(
  config: ConnectionConfig,
  messages: ChatMessage[],
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<StreamResult> {
  const url = buildEndpoint(config, "/chat/completions");
  const body = buildRequestBody(config, messages, true);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(config),
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(
      "Falha de rede ao enviar a mensagem. Se o servidor não envia CORS, ative o Proxy Local no painel de conexão.",
      undefined,
      (err as Error)?.message,
    );
  }

  if (!res.ok) {
    const { message, details } = await readErrorMessage(res);
    throw new ApiError(message, res.status, details);
  }

  // alguns servidores ignoram "stream" e devolvem JSON
  if (isJsonResponse(res)) {
    const json = await res.json();
    const choice = json?.choices?.[0];
    const content = choice?.message?.content ?? choice?.text ?? "";
    const reasoning = choice?.message?.reasoning ?? choice?.message?.reasoning_content ?? "";
    handlers.onDelta({ content, reasoning, full: content });
    return { content, reasoning, usage: json?.usage, model: json?.model };
  }

  if (!res.body) {
    const text = await res.text();
    handlers.onDelta({ content: text, full: text });
    return { content: text, reasoning: "" };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let reasoning = "";
  let usage: Usage | undefined;
  let model: string | undefined;

  const handleEvent = (rawEvent: string) => {
    const dataLines = rawEvent
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith("data:"))
      .map((line) => line.trim().slice(5).trim());
    if (!dataLines.length) return;
    const payload = dataLines.join("\n");
    if (!payload || payload === "[DONE]") return;
    let json: any;
    try {
      json = JSON.parse(payload);
    } catch {
      return;
    }
    if (json?.model) model = json.model;
    if (json?.usage) usage = json.usage;
    const choice = json?.choices?.[0];
    const delta = choice?.delta || choice?.message || {};
    const text = typeof delta.content === "string" ? delta.content : "";
    const think =
      typeof delta.reasoning === "string"
        ? delta.reasoning
        : typeof delta.reasoning_content === "string"
          ? delta.reasoning_content
          : "";
    if (think) {
      reasoning += think;
      handlers.onDelta({ reasoning, full: content });
    }
    if (text) {
      content += text;
      handlers.onDelta({ content, full: content });
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";
    events.forEach(handleEvent);
  }
  if (buffer.trim()) handleEvent(buffer);

  return { content, reasoning, usage, model };
}

export async function completeChat(
  config: ConnectionConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<StreamResult> {
  const url = buildEndpoint(config, "/chat/completions");
  const body = buildRequestBody(config, messages, false);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(config),
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(
      "Falha de rede ao enviar a mensagem. Se o servidor não envia CORS, ative o Proxy Local no painel de conexão.",
      undefined,
      (err as Error)?.message,
    );
  }
  if (!res.ok) {
    const { message, details } = await readErrorMessage(res);
    throw new ApiError(message, res.status, details);
  }
  const json = await res.json();
  const choice = json?.choices?.[0];
  const content = choice?.message?.content ?? choice?.text ?? "";
  const reasoning = choice?.message?.reasoning ?? choice?.message?.reasoning_content ?? "";
  return { content, reasoning, usage: json?.usage, model: json?.model };
}
