import type {
  ConnectionConfig,
  MemoryEntry,
  MemoryPage,
  MemorySettings,
  MemoryStats,
  MemoryType,
} from "../types";
import {
  ApiError,
  buildManagementEndpoint,
  buildManagementHeaders,
} from "./api";

export interface MemoryListFilters {
  page?: number;
  limit?: number;
  query?: string;
  type?: MemoryType | "all";
  sessionId?: string;
  apiKeyId?: string;
}

export interface MemoryCreateInput {
  key: string;
  content: string;
  type: MemoryType;
  sessionId?: string;
  apiKeyId?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryPreviewInput {
  query: string;
  strategy: "exact" | "semantic" | "hybrid";
  maxTokens: number;
  limit: number;
  apiKeyId?: string;
}

export interface MemoryPreview {
  memories: Array<{
    id: string;
    type: MemoryType;
    key: string;
    content: string;
    score: number;
    tokens: number;
    tier: string;
    vecScore: number | null;
    ftsScore: number | null;
  }>;
  resolution?: Record<string, unknown>;
  totalTokensUsed?: number;
  budgetMaxTokens?: number;
}

export interface MemoryHealth {
  working: boolean;
  latencyMs?: number;
  error?: string;
}

export interface MemoryEngineStatus {
  keyword?: { available?: boolean; backend?: string; reason?: string };
  embedding?: {
    source?: string | null;
    model?: string | null;
    dimensions?: number | null;
    available?: boolean;
    reason?: string;
    cacheStats?: { hits?: number; misses?: number; size?: number };
  };
  vectorStore?: {
    backend?: string;
    available?: boolean;
    rowCount?: number;
    needsReindex?: number;
    reason?: string;
  };
  qdrant?: {
    enabled?: boolean;
    healthy?: boolean | null;
    latencyMs?: number | null;
    error?: string | null;
  };
  rerank?: {
    enabled?: boolean;
    provider?: string | null;
    model?: string | null;
    available?: boolean;
    reason?: string;
  };
}

export interface EmbeddingProvidersResponse {
  providers?: Array<{
    provider: string;
    hasKey: boolean;
    models: Array<{ id: string; name: string; dimensions: number | null }>;
  }>;
}

export interface QdrantSettings {
  enabled: boolean;
  host: string;
  port: number;
  collection: string;
  embeddingModel: string;
  quantization: "none" | "int8" | "binary";
  hasApiKey: boolean;
  apiKeyMasked: string | null;
}

function messageFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const data = body as Record<string, any>;
  return (
    data?.error?.message ||
    (typeof data.error === "string" ? data.error : undefined) ||
    data?.message ||
    data?.error?.error
  );
}

async function readResponse<T>(response: Response): Promise<T> {
  let body: any = null;
  const raw = await response.text();
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = { message: raw };
    }
  }

  if (!response.ok) {
    let message = messageFromBody(body) || `HTTP ${response.status} ${response.statusText}`;
    if (response.status === 401) {
      message = "Autenticação de gerenciamento exigida. Informe um token de gestão do OmniRoute.";
    } else if (response.status === 403 && !messageFromBody(body)) {
      message = "A credencial não tem permissão para acessar a API de gerenciamento do OmniRoute.";
    }
    throw new ApiError(message, response.status, raw.slice(0, 1200));
  }
  return body as T;
}

async function request<T>(
  config: ConnectionConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!config.managementKey.trim()) {
    throw new ApiError(
      "Informe um token de gerenciamento do OmniRoute na aba Conexão para acessar a memória.",
    );
  }
  const url = buildManagementEndpoint(config, path);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...buildManagementHeaders(config),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new ApiError(
      "Não foi possível acessar a REST API do OmniRoute. Confira host, porta, rota e CORS.",
      undefined,
      (error as Error)?.message,
    );
  }
  return readResponse<T>(response);
}

function normalizeMemory(raw: any): MemoryEntry {
  return {
    id: String(raw?.id ?? raw?.memoryId ?? ""),
    key: String(raw?.key ?? ""),
    content: String(raw?.content ?? ""),
    type: String(raw?.type ?? "factual").toLowerCase() as MemoryType,
    sessionId: raw?.sessionId ?? raw?.session_id ?? undefined,
    apiKeyId: raw?.apiKeyId ?? raw?.api_key_id ?? undefined,
    metadata: raw?.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
    createdAt: raw?.createdAt ?? raw?.created_at ?? undefined,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? undefined,
    expiresAt: raw?.expiresAt ?? raw?.expires_at ?? null,
    accessCount: raw?.accessCount ?? raw?.access_count ?? undefined,
    lastAccessedAt: raw?.lastAccessedAt ?? raw?.last_accessed_at ?? null,
  };
}

export async function listMemories(
  config: ConnectionConfig,
  filters: MemoryListFilters = {},
): Promise<MemoryPage> {
  const params = new URLSearchParams();
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));
  if (filters.query?.trim()) params.set("q", filters.query.trim());
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.sessionId?.trim()) params.set("sessionId", filters.sessionId.trim());
  if (filters.apiKeyId?.trim()) params.set("apiKeyId", filters.apiKeyId.trim());

  const response = await request<any>(config, `/memory?${params.toString()}`);
  const rawList = Array.isArray(response)
    ? response
    : response?.data ?? response?.memories ?? response?.items ?? [];
  const pagination = response?.pagination ?? response?.meta ?? {};
  const stats = (response?.stats ?? {}) as MemoryStats;
  const page = Number(pagination.page ?? response?.page ?? filters.page ?? 1);
  const limit = Number(pagination.limit ?? response?.limit ?? filters.limit ?? 20);
  const total = Number(pagination.total ?? response?.total ?? stats.total ?? rawList.length);

  return {
    memories: Array.isArray(rawList) ? rawList.map(normalizeMemory) : [],
    page,
    limit,
    total,
    totalPages: Number(pagination.totalPages ?? pagination.total_pages ?? Math.max(1, Math.ceil(total / limit))),
    stats,
  };
}

export async function createMemory(config: ConnectionConfig, input: MemoryCreateInput) {
  return request<{ success?: boolean; id?: string }>(config, "/memory", {
    method: "POST",
    body: JSON.stringify({
      content: input.content,
      key: input.key,
      type: input.type,
      sessionId: input.sessionId || "",
      apiKeyId: input.apiKeyId || "",
      metadata: input.metadata ?? {},
    }),
  });
}

export async function fetchMemory(config: ConnectionConfig, id: string) {
  const response = await request<any>(config, `/memory/${encodeURIComponent(id)}`);
  return normalizeMemory(response?.memory ?? response);
}

export async function updateMemory(
  config: ConnectionConfig,
  id: string,
  update: Partial<Pick<MemoryEntry, "key" | "content" | "type" | "metadata">>,
) {
  return request<{ success?: boolean }>(config, `/memory/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(update),
  });
}

export async function deleteMemory(config: ConnectionConfig, id: string) {
  return request<{ success?: boolean }>(config, `/memory/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function checkMemoryHealth(config: ConnectionConfig) {
  return request<MemoryHealth>(config, "/memory/health");
}

export async function fetchMemorySettings(config: ConnectionConfig) {
  return request<MemorySettings>(config, "/settings/memory");
}

export async function updateMemorySettings(config: ConnectionConfig, settings: MemorySettings) {
  return request<MemorySettings>(config, "/settings/memory", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function previewMemories(config: ConnectionConfig, input: MemoryPreviewInput) {
  return request<MemoryPreview>(config, "/memory/retrieve-preview", {
    method: "POST",
    body: JSON.stringify({
      query: input.query,
      strategy: input.strategy,
      maxTokens: input.maxTokens,
      limit: input.limit,
      ...(input.apiKeyId?.trim() ? { apiKeyId: input.apiKeyId.trim() } : {}),
    }),
  });
}

export async function fetchMemoryEngineStatus(config: ConnectionConfig) {
  return request<MemoryEngineStatus>(config, "/memory/engine-status");
}

export async function fetchEmbeddingProviders(config: ConnectionConfig) {
  return request<EmbeddingProvidersResponse>(config, "/memory/embedding-providers");
}

export async function summarizeMemories(
  config: ConnectionConfig,
  options: { olderThanDays: number; apiKeyId?: string; dryRun: boolean },
) {
  return request<Record<string, unknown>>(config, "/memory/summarize", {
    method: "POST",
    body: JSON.stringify({
      olderThanDays: options.olderThanDays,
      dryRun: options.dryRun,
      ...(options.apiKeyId?.trim() ? { apiKeyId: options.apiKeyId.trim() } : {}),
    }),
  });
}

export async function reindexMemories(config: ConnectionConfig, force = false) {
  return request<{ started?: boolean; pending?: number }>(config, "/memory/reindex", {
    method: "POST",
    body: JSON.stringify({ force }),
  });
}

export async function fetchQdrantSettings(config: ConnectionConfig) {
  return request<QdrantSettings>(config, "/settings/qdrant");
}

export async function updateQdrantSettings(
  config: ConnectionConfig,
  settings: Partial<QdrantSettings> & { apiKey?: string },
) {
  return request<QdrantSettings>(config, "/settings/qdrant", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function checkQdrantHealth(config: ConnectionConfig) {
  return request<{ ok: boolean; latencyMs: number; error?: string }>(
    config,
    "/settings/qdrant/health",
  );
}

export async function searchQdrant(config: ConnectionConfig, query: string, topK: number) {
  return request<{ ok: boolean; results?: Array<Record<string, unknown>> }>(
    config,
    "/settings/qdrant/search",
    {
      method: "POST",
      body: JSON.stringify({ query, topK }),
    },
  );
}

export async function cleanupQdrant(config: ConnectionConfig) {
  return request<{ ok: boolean; deletedCount?: number; retentionDays?: number }>(
    config,
    "/settings/qdrant/cleanup",
    { method: "POST", body: JSON.stringify({}) },
  );
}

export async function fetchQdrantEmbeddingModels(config: ConnectionConfig) {
  return request<{ models?: Array<{ value: string; label: string; dimensions?: number }> }>(
    config,
    "/settings/qdrant/embedding-models",
  );
}