import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Link2,
  Loader2,
  MessageSquarePlus,
  Plug,
  PlugZap,
  RefreshCw,
  Settings2,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { ConnectionConfig, ConnectionStatus, Session } from "../types";
import { buildBaseUrl } from "../lib/api";
import { cn } from "../utils/cn";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
        {hint && <span className="font-normal normal-case tracking-normal text-slate-500">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20";

export function Sidebar({
  config,
  onConfigChange,
  status,
  statusMessage,
  models,
  onTestConnection,
  onRefreshModels,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearSessions,
  onClose,
}: {
  config: ConnectionConfig;
  onConfigChange: (config: ConnectionConfig) => void;
  status: ConnectionStatus;
  statusMessage: string;
  models: string[];
  onTestConnection: () => void;
  onRefreshModels: () => void;
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearSessions: () => void;
  onClose?: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showChats, setShowChats] = useState(true);

  const baseUrl = useMemo(() => buildBaseUrl(config), [config]);

  const set = <K extends keyof ConnectionConfig>(key: K, value: ConnectionConfig[K]) =>
    onConfigChange({ ...config, [key]: value });

  const statusInfo = {
    idle: { icon: Plug, color: "text-slate-400", bg: "bg-white/5", label: "Não conectado" },
    connecting: { icon: Loader2, color: "text-amber-300", bg: "bg-amber-500/10", label: "Conectando…" },
    connected: { icon: Wifi, color: "text-emerald-300", bg: "bg-emerald-500/10", label: "Conectado" },
    error: { icon: WifiOff, color: "text-rose-300", bg: "bg-rose-500/10", label: "Erro" },
  }[status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto bg-[#0a0e1a] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <PlugZap className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100">OminRoute Chat</h1>
            <p className="text-[11px] text-slate-500">Cliente para API compatível com OpenRouter</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-slate-100 lg:hidden"
          >
            Fechar
          </button>
        )}
      </div>

      {/* Status */}
      <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-xs", statusInfo.bg)}>
        <StatusIcon className={cn("h-3.5 w-3.5", statusInfo.color, status === "connecting" && "animate-spin")} />
        <span className={cn("font-medium", statusInfo.color)}>{statusInfo.label}</span>
        {statusMessage && <span className="truncate text-slate-500">· {statusMessage}</span>}
      </div>

      {/* Conexão */}
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
          <Link2 className="h-3.5 w-3.5" /> Conexão
        </div>

        <div className="grid grid-cols-[1fr_96px] gap-2">
          <Field label="URL" hint="host">
            <input
              className={inputClass}
              value={config.host}
              onChange={(e) => set("host", e.target.value)}
              placeholder="http://localhost"
              spellCheck={false}
            />
          </Field>
          <Field label="Porta">
            <input
              className={inputClass}
              value={config.port}
              onChange={(e) => set("port", e.target.value.replace(/[^\d]/g, ""))}
              placeholder="11434"
              inputMode="numeric"
            />
          </Field>
        </div>

        <Field label="Caminho base" hint="/v1">
          <input
            className={inputClass}
            value={config.basePath}
            onChange={(e) => set("basePath", e.target.value)}
            placeholder="/v1"
            spellCheck={false}
          />
        </Field>

        <div className="rounded-lg border border-white/5 bg-black/30 px-2.5 py-2 text-[11px] text-slate-400">
          <span className="text-slate-500">Endpoint:</span>{" "}
          <code className="break-all text-cyan-300">{baseUrl || "—"}</code>
        </div>

        <Field label="API Key" hint="opcional">
          <input
            className={inputClass}
            type="password"
            value={config.apiKey}
            onChange={(e) => set("apiKey", e.target.value)}
            placeholder="sk-…"
            spellCheck={false}
          />
        </Field>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onTestConnection}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110"
          >
            {status === "connecting" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plug className="h-3.5 w-3.5" />
            )}
            Testar conexão
          </button>
          <button
            type="button"
            onClick={onRefreshModels}
            title="Atualizar modelos"
            className="rounded-lg border border-white/10 px-2.5 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Modelo */}
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
          <Cpu className="h-3.5 w-3.5" /> Modelo
        </div>

        {models.length > 0 ? (
          <Field label="Selecione o modelo">
            <select
              className={cn(inputClass, "appearance-none bg-black/30")}
              value={config.model}
              onChange={(e) => set("model", e.target.value)}
            >
              <option value="">Selecione…</option>
              {models.map((m) => (
                <option key={m} value={m} className="bg-[#0a0e1a]">
                  {m}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Nome do modelo" hint="manual">
          <input
            className={inputClass}
            value={config.model}
            onChange={(e) => set("model", e.target.value)}
            placeholder="ex.: anthropic/claude-3.5-sonnet ou llama3.1"
            spellCheck={false}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Temperatura">
            <input
              className={inputClass}
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={config.temperature}
              onChange={(e) => set("temperature", Number(e.target.value))}
            />
          </Field>
          <Field label="Max tokens">
            <input
              className={inputClass}
              type="number"
              min={0}
              step={128}
              value={config.maxTokens}
              onChange={(e) => set("maxTokens", Number(e.target.value))}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <span className="text-xs text-slate-300">Resposta em streaming</span>
          <input
            type="checkbox"
            checked={config.stream}
            onChange={(e) => set("stream", e.target.checked)}
            className="h-4 w-4 accent-violet-500"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-300"
        >
          {showAdvanced ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          Avançado
        </button>

        {showAdvanced && (
          <div className="space-y-3 rounded-xl border border-white/5 bg-black/20 p-3">
            <Field label="System prompt">
              <textarea
                className={cn(inputClass, "min-h-[80px] resize-y")}
                value={config.systemPrompt}
                onChange={(e) => set("systemPrompt", e.target.value)}
                placeholder="Instruções para o modelo…"
              />
            </Field>
            <Field label="Headers extras" hint="um por linha">
              <textarea
                className={cn(inputClass, "min-h-[60px] resize-y font-mono text-[12px]")}
                value={config.extraHeaders}
                onChange={(e) => set("extraHeaders", e.target.value)}
                placeholder={"X-Custom: valor"}
              />
            </Field>
            <Field label="HTTP-Referer" hint="opcional">
              <input
                className={inputClass}
                value={config.referer}
                onChange={(e) => set("referer", e.target.value)}
                placeholder="http://localhost:5173"
              />
            </Field>
            <Field label="X-Title">
              <input
                className={inputClass}
                value={config.appTitle}
                onChange={(e) => set("appTitle", e.target.value)}
              />
            </Field>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <span className="text-xs text-slate-300">Usar proxy local (CORS)</span>
              <input
                type="checkbox"
                checked={config.useProxy}
                onChange={(e) => set("useProxy", e.target.checked)}
                className="h-4 w-4 accent-violet-500"
              />
            </label>
            {config.useProxy && (
              <Field label="URL do proxy" hint="node proxy.mjs">
                <input
                  className={inputClass}
                  value={config.proxyUrl}
                  onChange={(e) => set("proxyUrl", e.target.value)}
                  placeholder="http://localhost:8787"
                />
              </Field>
            )}
          </div>
        )}
      </section>

      {/* Conversas */}
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowChats((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300"
          >
            {showChats ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Conversas
          </button>
          <button
            type="button"
            onClick={onNewChat}
            title="Nova conversa"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </div>

        {showChats && (
          <>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {sessions.length === 0 && (
                <p className="px-1 py-3 text-center text-[11px] text-slate-600">
                  Nenhuma conversa ainda.
                </p>
              )}
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2.5 py-2 transition",
                    session.id === activeSessionId
                      ? "bg-violet-500/15 text-violet-100"
                      : "text-slate-300 hover:bg-white/5",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSession(session.id)}
                    className="min-w-0 flex-1 truncate text-left text-[13px]"
                  >
                    {session.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(session.id)}
                    title="Excluir"
                    className="opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {sessions.length > 0 && (
              <button
                type="button"
                onClick={onClearSessions}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-slate-400 transition hover:border-rose-500/40 hover:text-rose-300"
              >
                <Trash2 className="h-3 w-3" /> Limpar histórico
              </button>
            )}
          </>
        )}
      </section>

      <p className="flex items-center gap-1.5 px-1 text-[10px] text-slate-600">
        <Settings2 className="h-3 w-3" /> Configuração salva no navegador (localStorage)
      </p>
    </div>
  );
}
