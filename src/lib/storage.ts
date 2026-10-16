import type { ConnectionConfig, Session } from "../types";
import { encryptApiKey, decryptApiKey } from "./crypto";

const CONFIG_KEY = "routepilot.config.v1";
const SESSIONS_KEY = "routepilot.sessions.v1";
const LEGACY_KEYS = [
  "omindesk.config.v2",
  "omindesk.sessions.v1",
  "ominroute.config.v1",
  "ominroute.sessions.v1",
];

export const defaultConfig: ConnectionConfig = {
  host: "http://localhost",
  port: "20128",
  basePath: "/v1",
  apiKey: "",
  model: "",
  temperature: 0.7,
  maxTokens: 2048,
  stream: true,
  systemPrompt: "",
  extraHeaders: "",
  referer: "",
  appTitle: "RoutePilot",
  useProxy: false,
  proxyUrl: "http://localhost:8787",
};

function readRaw(keys: string[]): string | null {
  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (value) return value;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Carrega a configuração do localStorage e descriptografa a API Key caso esteja encriptada.
 */
export async function loadConfigAsync(): Promise<ConnectionConfig> {
  try {
    const raw = readRaw([CONFIG_KEY, "omindesk.config.v2", "ominroute.config.v1"]);
    if (!raw) return { ...defaultConfig };

    const parsed = JSON.parse(raw) as Partial<ConnectionConfig>;
    const cfg = { ...defaultConfig, ...parsed };

    if (cfg.apiKey) {
      cfg.apiKey = await decryptApiKey(cfg.apiKey);
    }
    return cfg;
  } catch {
    return { ...defaultConfig };
  }
}

/**
 * Versão síncrona inicial para evitar flash de tela.
 */
export function loadConfigSync(): ConnectionConfig {
  try {
    const raw = readRaw([CONFIG_KEY, "omindesk.config.v2", "ominroute.config.v1"]);
    if (!raw) return { ...defaultConfig };
    const parsed = JSON.parse(raw) as Partial<ConnectionConfig>;
    return { ...defaultConfig, ...parsed };
  } catch {
    return { ...defaultConfig };
  }
}

/**
 * Salva a configuração no localStorage, CRIPTOGRAFANDO a API Key antes de persistir.
 */
export async function saveConfigSecure(config: ConnectionConfig): Promise<void> {
  try {
    const toSave: ConnectionConfig = { ...config };
    if (toSave.apiKey) {
      toSave.apiKey = await encryptApiKey(toSave.apiKey);
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(toSave));
    // remove chaves legadas do nome antigo para não duplicar dados
    for (const key of LEGACY_KEYS) {
      if (!key.startsWith("routepilot")) {
        try {
          localStorage.removeItem(key);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore quota errors */
  }
}

export function loadSessions(): Session[] {
  try {
    const raw = readRaw([SESSIONS_KEY, "omindesk.sessions.v1", "ominroute.sessions.v1"]);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Session[];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    /* ignore quota errors */
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
