import type { ConnectionConfig } from "../types";
import { ApiError, buildEndpoint, buildHeaders, buildManagementEndpoint, buildManagementHeaders } from "./api";

/** Um modelo do catálogo unificado do OminRoute (`/api/models/catalog` ou `/v1/models`). */
export interface CatalogModel {
  id: string;
  name?: string;
  provider: string;
  providerName: string;
  type: string;
  subtype?: string;
  capabilities: Record<string, boolean | string[] | undefined>;
  contextLength?: number;
  maxOutputTokens?: number;
  inputModalities?: string[];
  outputModalities?: string[];
  free?: boolean;
  custom?: boolean;
}

export interface CatalogResult {
  models: CatalogModel[];
  version?: string;
}

const TYPE_LABEL: Record<string, string> = {
  chat: "Chat",
  audio: "Audio",
  image: "Imagem",
  embedding: "Embedding",
  rerank: "Rerank",
  moderation: "Moderação",
  video: "Vídeo",
  music: "Música",
};

const SUBTYPE_LABEL: Record<string, string> = {
  speech: "Fala (TTS)",
  transcription: "Transcrição (STT)",
  tts: "Fala (TTS)",
  stt: "Transcrição (STT)",
};

export function typeLabel(type?: string, subtype?: string): string {
  const base = (type && TYPE_LABEL[type]) || "Chat";
  const sub = subtype && SUBTYPE_LABEL[subtype];
  return sub ? `${base} · ${sub}` : base;
}

export function formatTokens(value?: number): string {
  if (!value || value <= 0) return "—";
  if (value >= 1_000_000) return `${trimZero(value / 1_000_000)}M`;
  if (value >= 1_000) return `${trimZero(value / 1_000)}K`;
  return String(value);
}

function trimZero(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function capabilityList(m: CatalogModel): string[] {
  const caps: string[] = [];
  const c = m.capabilities;
  if (c.vision === true) caps.push("Visão");
  if (c.reasoning === true) caps.push("Raciocínio");
  if (c.tool_calling === true || c.tools === true) caps.push("Tool calling");
  if (c.structured_output === true || c.json_schema === true) caps.push("Saída estruturada");
  return caps;
}

export { capabilityList };

function normalizeModel(raw: any, fallbackProvider?: string, fallbackProviderName?: string): CatalogModel | null {
  const id = typeof raw?.id === "string" ? raw.id : typeof raw?.name === "string" ? raw.name : "";
  if (!id) return null;

  let provider = fallbackProvider || raw?.owned_by || raw?.provider || "";
  if (!provider) {
    const slash = id.indexOf("/");
    provider = slash > 0 ? id.slice(0, slash) : "local";
  }
  provider = String(provider).toLowerCase();

  const capabilities: Record<string, boolean | string[] | undefined> = {};
  if (raw?.capabilities && typeof raw.capabilities === "object") {
    for (const [k, v] of Object.entries(raw.capabilities as Record<string, unknown>)) {
      if (typeof v === "boolean" || Array.isArray(v)) capabilities[k] = v;
    }
  }
  // deriva visão das modalidades quando não vem explícito
  const input = Array.isArray(raw?.input_modalities) ? (raw.input_modalities as string[]) : [];
  if (input.includes("image") && capabilities.vision !== true) capabilities.vision = true;

  return {
    id,
    name: typeof raw?.name === "string" && raw.name !== id ? raw.name : undefined,
    provider,
    providerName:
      typeof raw?.provider === "string"
        ? raw.provider
        : fallbackProviderName || capitalize(provider),
    type: typeof raw?.type === "string" && raw.type ? raw.type : "chat",
    subtype: typeof raw?.subtype === "string" ? raw.subtype : undefined,
    capabilities,
    contextLength: typeof raw?.context_length === "number" ? raw.context_length : undefined,
    maxOutputTokens: typeof raw?.max_output_tokens === "number" ? raw.max_output_tokens : undefined,
    inputModalities: input.length ? input : undefined,
    outputModalities: Array.isArray(raw?.output_modalities) ? (raw.output_modalities as string[]) : undefined,
    free: raw?.free === true,
    custom: raw?.custom === true,
  };
}

function dedupe(models: CatalogModel[]): CatalogModel[] {
  const seen = new Map<string, CatalogModel>();
  for (const m of models) {
    const prev = seen.get(m.id);
    if (!prev) seen.set(m.id, m);
    else seen.set(
      m.id,
      prev.capabilities && Object.keys(prev.capabilities).length ? prev : m,
    );
  }
  return [...seen.values()];
}

async function tryFetch(url: string, headers: Record<string, string>): Promise<Response> {
  return fetch(url, { headers, cache: "no-store" });
}

function isHttpError(res: Response): boolean {
  return res.status === 401 || res.status === 403 || res.status === 404;
}

/**
 * Busca o catálogo de modelos do OminRoute com fallbacks:
 * 1) GET {rest}/models/catalog  (formato agrupado por provedor, com type/capabilities)
 * 2) GET {chat}/models          (lista OpenAI — pode trazer type/capabilities)
 * 3) lista simples de ids       (quando o servidor retorna apenas `id`)
 */
export async function fetchModelCatalog(config: ConnectionConfig): Promise<CatalogResult> {
  const attempts: Array<{ url: string; headers: Record<string, string> }> = [];
  const hasRest = Boolean(config.managementPath.trim());

  if (hasRest && config.managementKey.trim()) {
    attempts.push({ url: buildManagementEndpoint(config, "/models/catalog"), headers: buildManagementHeaders(config) });
  }
  if (hasRest) {
    attempts.push({ url: buildManagementEndpoint(config, "/models/catalog"), headers: buildHeaders(config) });
  }
  attempts.push({ url: buildEndpoint(config, "/models"), headers: buildHeaders(config) });

  let lastError: Error = new ApiError("Nenhum endpoint de modelos configurado.");

  for (const attempt of attempts) {
    let res: Response;
    try {
      res = await tryFetch(attempt.url, attempt.headers);
    } catch (err) {
      lastError = new ApiError(
        "Não foi possível consultar os modelos do servidor.",
        undefined,
        (err as Error)?.message,
      );
      continue;
    }

    if (!res.ok) {
      lastError = new ApiError(`HTTP ${res.status} ao listar modelos.`, res.status);
      if (!isHttpError(res)) break;
      continue;
    }

    const json = await res.json();
    const models: CatalogModel[] = [];
    let version: string | undefined;

    if (json && typeof json === "object" && json.catalog && typeof json.catalog === "object") {
      version = typeof json.catalogVersion === "string" ? json.catalogVersion : undefined;
      for (const [providerId, bucket] of Object.entries(json.catalog as Record<string, any>)) {
        const list = Array.isArray(bucket?.models) ? bucket.models : [];
        const displayName = typeof bucket?.provider === "string" ? bucket.provider : undefined;
        for (const item of list) {
          const normalized = normalizeModel(item, providerId, displayName);
          if (normalized) models.push(normalized);
        }
      }
    } else {
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : [];
      for (const item of list) {
        const normalized = normalizeModel(item);
        if (normalized) models.push(normalized);
      }
    }

    if (!models.length) {
      lastError = new ApiError("O servidor respondeu, mas sem modelos na lista.");
      continue;
    }

    return { models: dedupe(models), version };
  }

  throw lastError;
}

/** Converte a lista simples de ids (do botão Testar conexão) em catálogo mínimo. */
export function idsToCatalog(ids: string[]): CatalogModel[] {
  return dedupe(
    ids
      .filter(Boolean)
      .map((id) => normalizeModel({ id } as Record<string, unknown>))
      .filter((m): m is CatalogModel => Boolean(m)),
  );
}
