import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Plug,
  RefreshCw,
  Server,
  Sliders,
} from "lucide-react";
import type { ConnectionConfig, ConnectionStatus } from "../types";
import { buildBaseUrl } from "../lib/api";
import { Field, Card, inputClass } from "./Field";
import { cn } from "../utils/cn";

interface ServerPreset {
  name: string;
  desc: string;
  host: string;
  port: string;
  basePath: string;
}

const SERVER_PRESETS: ServerPreset[] = [
  {
    name: "OminRoute",
    desc: "Gateway local que centraliza várias IAs",
    host: "http://localhost",
    port: "20128",
    basePath: "/v1",
  },
  {
    name: "Ollama",
    desc: "Modelos locais",
    host: "http://localhost",
    port: "11434",
    basePath: "/v1",
  },
  {
    name: "LM Studio",
    desc: "Servidor de modelos desktop",
    host: "http://localhost",
    port: "1234",
    basePath: "/v1",
  },
  {
    name: "llama.cpp",
    desc: "Sem caminho base",
    host: "http://localhost",
    port: "8080",
    basePath: "",
  },
  {
    name: "vLLM",
    desc: "Inferência de alta performance",
    host: "http://localhost",
    port: "8000",
    basePath: "/v1",
  },
  {
    name: "OpenRouter",
    desc: "API em nuvem",
    host: "https://openrouter.ai",
    port: "",
    basePath: "/api/v1",
  },
];

export function ConnectionView({
  config,
  onConfigChange,
  status,
  statusMessage,
  models,
  onTestConnection,
}: {
  config: ConnectionConfig;
  onConfigChange: (config: ConnectionConfig) => void;
  status: ConnectionStatus;
  statusMessage: string;
  models: string[];
  onTestConnection: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const set = <K extends keyof ConnectionConfig>(key: K, value: ConnectionConfig[K]) =>
    onConfigChange({ ...config, [key]: value });

  const applyPreset = (preset: ServerPreset) =>
    onConfigChange({
      ...config,
      host: preset.host,
      port: preset.port,
      basePath: preset.basePath,
    });

  const activePreset = (preset: ServerPreset) =>
    config.host === preset.host && config.port === preset.port && config.basePath === preset.basePath;

  const endpoint = buildBaseUrl(config);
  const testing = status === "connecting";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <header>
          <h2 className="text-xl font-semibold tracking-tight text-slate-50">Conexão</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Aponte o RoutePilot para o servidor onde o seu OminRoute (ou outro serviço) está
            rodando. As configurações e chaves são salvas com criptografia no seu navegador.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Campos marcados com <span className="font-bold text-rose-400">*</span> são obrigatórios.
          </p>
        </header>

        <Card
          title="Servidores prontos"
          icon={<Server className="h-4 w-4" />}
          description="Preenchimento automático de URL, porta e caminho base."
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SERVER_PRESETS.map((preset) => {
              const active = activePreset(preset);
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  title={preset.desc}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left transition",
                    active
                      ? "border-violet-400/60 bg-violet-500/15"
                      : "border-white/10 bg-black/20 hover:border-white/25 hover:bg-white/5",
                  )}
                >
                  <span
                    className={cn(
                      "block text-[13px] font-medium",
                      active ? "text-violet-100" : "text-slate-200",
                    )}
                  >
                    {preset.name}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-slate-500">
                    {preset.host}
                    {preset.port ? `:${preset.port}` : ""}
                    {preset.basePath}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
            <Plug className="mt-0.5 h-3 w-3 shrink-0 text-violet-300" />
            <span>
              <strong className="text-slate-300">OminRoute</strong> é um gateway local que
              centraliza várias IAs (OpenAI, Anthropic, Gemini, Llama e mais) em um único endpoint
              OpenAI-compatível, normalmente em{" "}
              <code className="text-violet-300">localhost:20128/v1</code>. Basta selecionar e testar.
            </span>
          </p>
        </Card>

        <Card
          title="Servidor"
          icon={<Plug className="h-4 w-4" />}
          description="Endereço e porta do serviço que responde a API do modelo."
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <Field label="URL" hint="host" required>
              <input
                className={inputClass}
                value={config.host}
                onChange={(e) => set("host", e.target.value)}
                placeholder="http://localhost"
                spellCheck={false}
              />
            </Field>
            <Field label="Porta" hint="se houver">
              <input
                className={inputClass}
                value={config.port}
                onChange={(e) => set("port", e.target.value.replace(/[^\d]/g, ""))}
                placeholder="20128"
                inputMode="numeric"
              />
            </Field>
          </div>

          <Field label="Caminho base" hint="ex.: /v1">
            <input
              className={inputClass}
              value={config.basePath}
              onChange={(e) => set("basePath", e.target.value)}
              placeholder="/v1"
              spellCheck={false}
            />
          </Field>

          <div className="rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-[12px]">
            <span className="text-slate-500">Endpoint usado:</span>{" "}
            <code className="break-all font-mono text-cyan-300">{endpoint || "—"}</code>
          </div>

          <div className="space-y-1.5">
            <Field label="API Key" hint="criptografada com AES-GCM">
              <div className="relative">
                <input
                  className={cn(inputClass, "font-mono pr-10")}
                  type={showApiKey ? "text" : "password"}
                  value={config.apiKey}
                  onChange={(e) => set("apiKey", e.target.value)}
                  placeholder="sk-…"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  title={showApiKey ? "Ocultar chave" : "Mostrar chave"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center gap-1.5 px-1 text-[11px] text-emerald-400/90">
              <Lock className="h-3 w-3" />
              <span>Chave criptografada com AES-256 no seu navegador ao salvar</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onTestConnection}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === "connected" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Plug className="h-4 w-4" />
              )}
              {testing ? "Testando…" : "Testar conexão"}
            </button>
            <button
              type="button"
              onClick={onTestConnection}
              title="Recarregar lista de modelos"
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={cn("h-4 w-4", testing && "animate-spin")} />
              Modelos
            </button>
          </div>

          {statusMessage && (
            <p
              className={cn(
                "text-xs",
                status === "error"
                  ? "text-rose-300"
                  : status === "connected"
                    ? "text-emerald-300"
                    : "text-slate-400",
              )}
            >
              {status === "connected" ? "✓ " : status === "error" ? "✕ " : ""}
              {statusMessage}
            </p>
          )}
        </Card>

        <Card
          title="Modelo"
          icon={<Cpu className="h-4 w-4" />}
          description="Escolha um modelo da lista ou digite o identificador manualmente."
        >
          {models.length > 0 && (
            <Field label="Modelos disponíveis" hint={`${models.length} encontrado(s)`}>
              <select
                className={cn(inputClass, "appearance-none")}
                value={config.model}
                onChange={(e) => set("model", e.target.value)}
              >
                <option value="">Selecione…</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Identificador do modelo" hint="manual" required>
            <input
              className={cn(inputClass, "font-mono")}
              value={config.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="auto, llama3.1:8b, cc/claude-sonnet…"
              spellCheck={false}
            />
          </Field>

          {models.length === 0 && (
            <p className="text-xs leading-relaxed text-slate-500">
              Não foi possível listar os modelos automaticamente. Use o campo manual acima — o nome
              exato depende do seu servidor (ex.:{" "}
              <code className="text-slate-300">auto</code> no OminRoute,{" "}
              <code className="text-slate-300">llama3.1:8b</code> no Ollama,{" "}
              <code className="text-slate-300">local-model</code> no LM Studio).
            </p>
          )}
        </Card>

        <Card
          title="Parâmetros"
          icon={<Sliders className="h-4 w-4" />}
          description="Ajustes enviados junto com cada mensagem."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Temperatura" hint="0 a 2">
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
            <Field label="Max tokens" hint="0 = padrão">
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

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
            <span className="min-w-0">
              <span className="block text-sm text-slate-200">Resposta em streaming</span>
              <span className="block text-[11px] text-slate-500">
                Mostra a resposta token por token (SSE)
              </span>
            </span>
            <input
              type="checkbox"
              checked={config.stream}
              onChange={(e) => set("stream", e.target.checked)}
              className="h-4 w-4 shrink-0 accent-violet-500"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-300"
          >
            {showAdvanced ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Avançado
          </button>

          {showAdvanced && (
            <div className="space-y-3 rounded-xl border border-white/5 bg-black/20 p-3">
              <Field label="System prompt">
                <textarea
                  className={cn(inputClass, "min-h-[90px] resize-y")}
                  value={config.systemPrompt}
                  onChange={(e) => set("systemPrompt", e.target.value)}
                  placeholder="Instruções de comportamento para o modelo…"
                />
              </Field>
              <Field label="Headers extras" hint="um por linha">
                <textarea
                  className={cn(inputClass, "min-h-[64px] resize-y font-mono text-[12px]")}
                  value={config.extraHeaders}
                  onChange={(e) => set("extraHeaders", e.target.value)}
                  placeholder={"X-Custom: valor"}
                  spellCheck={false}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="HTTP-Referer" hint="opcional">
                  <input
                    className={inputClass}
                    value={config.referer}
                    onChange={(e) => set("referer", e.target.value)}
                    placeholder="http://localhost:5173"
                    spellCheck={false}
                  />
                </Field>
                <Field label="X-Title">
                  <input
                    className={inputClass}
                    value={config.appTitle}
                    onChange={(e) => set("appTitle", e.target.value)}
                  />
                </Field>
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm text-slate-200">Usar proxy local (CORS)</span>
                  <span className="block text-[11px] text-slate-500">
                    Rode <code className="text-slate-300">node proxy.mjs</code> e aponte aqui
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={config.useProxy}
                  onChange={(e) => set("useProxy", e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-violet-500"
                />
              </label>
              {config.useProxy && (
                <Field label="URL do proxy">
                  <input
                    className={inputClass}
                    value={config.proxyUrl}
                    onChange={(e) => set("proxyUrl", e.target.value)}
                    placeholder="http://localhost:8787"
                    spellCheck={false}
                  />
                </Field>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
