import type { CatalogModel, ConnectionConfig, ModelCatalogResult } from "../types";
import { managementRequest } from "./api";

/**
 * Cliente para o catálogo unificado de modelos do OmniRoute.
 *
 * GET /api/models/catalog agrupa todos os modelos (de todos os provedores
 * conectados) por provedor, com tipo (chat/image/embedding/audio/...),
 * capacidades, contexto, limite de saída e flags (custom/free).
 *
 * Referência: docs/reference/API_REFERENCE.md e wiki "Routing & Config" do OmniRoute.
 */

function normalizeModel(raw: any, providerId: string, providerName: string): CatalogModel {
  return {
    id: String(raw?.id ?? ""),
    providerId,
    provider: providerName,
    name: String(raw?.name ?? raw?.id ?? ""),
    type: String(raw?.type ?? "chat"),
    subtype: typeof raw?.subtype === "string" ? raw.subtype : undefined,
    custom: raw?.custom === true,
    free: raw?.free === true,
    capabilities: raw?.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : undefined,
    contextLength: typeof raw?.context_length === "number" ? raw.context_length : undefined,
    maxOutputTokens: typeof raw?.max_output_tokens === "number" ? raw.max_output_tokens : undefined,
    inputModalities: Array.isArray(raw?.input_modalities) ? raw.input_modalities : undefined,
    outputModalities: Array.isArray(raw?.output_modalities) ? raw.output_modalities : undefined,
    supportedEndpoints: Array.isArray(raw?.supported_endpoints) ? raw.supported_endpoints : undefined,
  };
}

export async function fetchModelCatalog(config: ConnectionConfig): Promise<ModelCatalogResult> {
  const response = await managementRequest<{
    catalog: Record<string, { provider: string; active: boolean; models: any[] }>;
    catalogVersion?: string | null;
  }>(config, "/models/catalog");

  const catalog = response?.catalog ?? {};
  const providers = Object.entries(catalog).map(([providerId, bucket]) => ({
    provider: bucket?.provider || providerId,
    active: bucket?.active !== false,
    models: Array.isArray(bucket?.models)
      ? bucket.models.map((m) => normalizeModel(m, providerId, bucket?.provider || providerId))
      : [],
  }));

  const models = providers.flatMap((p) => p.models);

  return { providers, models, catalogVersion: response?.catalogVersion ?? null };
}

/** Lista legível de tipos presentes no catálogo, para montar o filtro. */
export function uniqueTypes(models: CatalogModel[]): string[] {
  return [...new Set(models.map((m) => m.type))].sort((a, b) => a.localeCompare(b));
}

/** Lista legível de provedores presentes no catálogo, para montar o filtro. */
export function uniqueProviders(providers: { provider: string; active: boolean }[]): string[] {
  return [...new Set(providers.map((p) => p.provider))].sort((a, b) => a.localeCompare(b));
}

const TYPE_LABELS: Record<string, string> = {
  chat: "Chat",
  image: "Imagem",
  embedding: "Embedding",
  audio: "Áudio",
  video: "Vídeo",
  music: "Música",
  rerank: "Rerank",
};

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

/** Extrai rótulos de capacidade (reasoning, vision, tool calling, etc.) para badges. */
export function capabilityLabels(model: CatalogModel): string[] {
  const labels: string[] = [];
  const caps = model.capabilities ?? {};
  for (const [key, value] of Object.entries(caps)) {
    if (value === true) labels.push(humanize(key));
    else if (Array.isArray(value)) labels.push(...value.filter((v): v is string => typeof v === "string"));
  }
  for (const modality of model.inputModalities ?? []) labels.push(`${humanize(modality)} (entrada)`);
  for (const modality of model.outputModalities ?? []) labels.push(`${humanize(modality)} (saída)`);
  return [...new Set(labels)];
}

function humanize(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
