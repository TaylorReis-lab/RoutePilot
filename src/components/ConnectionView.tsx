import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Eye,
  EyeOff,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Lock,
  Plug,
  RefreshCw,
  Server,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { ConnectionConfig, ConnectionStatus } from "../types";
import { buildBaseUrl, buildManagementBaseUrl, resolveVisionMode } from "../lib/api";
import {
  MEMORY_SUPPORT_LABEL,
  SERVER_PROFILES,
  VISION_SUPPORT_LABEL,
  detectProfile,
  type ServerProfile,
} from "../lib/serverProfiles";
import { Field, Card, inputClass } from "./Field";
import { cn } from "../utils/cn";
import type { ReactNode } from "react";

function Badge({
  tone,
  children,
  title,
}: {
  tone: "ok" | "no" | "partial" | "neutral";
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide",
        tone === "ok" && "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
        tone === "no" && "border-white/10 bg-white/[0.04] text-slate-400",
        tone === "partial" && "border-ember-400/30 bg-ember-400/10 text-ember-300",
        tone === "neutral" && "border-violet-400/25 bg-violet-500/10 text-violet-200",
      )}
    >
      {children}
    </span>
  );
}

export function ConnectionView({
  config,
  onConfigChange,
  status,
  statusMessage,
  models,
  onTestConnection,
  footer,
}: {
  config: ConnectionConfig;
  onConfigChange: (config: ConnectionConfig) => void;
  status: ConnectionStatus;
  statusMessage: string;
  models: string[];
  onTestConnection: () => void;
  footer?: ReactNode;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showManagementKey, setShowManagementKey] = useState(false);

  const set = <K extends keyof ConnectionConfig>(key: K, value: ConnectionConfig[K]) =>
    onConfigChange({ ...config, [key]: value });

  const applyPreset = (preset: ServerProfile) =>
    onConfigChange({
      ...config,
      host: preset.host,
      port: preset.port,
      basePath: preset.basePath,
      managementPath: preset.restPath ?? "",
    });

  const activePreset = (preset: ServerProfile) =>
    config.host === preset.host &&
    config.port === preset.port &&
    config.basePath === preset.basePath;

  const detected = detectProfile(config);
  const endpoint = buildBaseUrl(config);
  let managementEndpoint = "";
  try {
    managementEndpoint = buildManagementBaseUrl(config);
  } catch {
    managementEndpoint = "URL inválida";
  }
  const testing = status === "connecting";
  const vision = resolveVisionMode(config);

  return (
    <div
      id="routepilot-scroll"
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
    >
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <header className="reveal">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-50">Conexão</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
            Aponte o RoutePilot para o servidor onde o seu OminRoute (ou outro serviço) está rodando.
            Chaves e configurações são criptografadas no seu navegador.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Campos marcados com <span className="font-bold text-rose-400">*</span> são obrigatórios.
          </p>
        </header>

        <Card
          title="Escolha o servidor"
          icon={<Server className="h-4 w-4" />}
          description="Cada preset preenche URL, porta, caminho base e a rota REST adequada."
          className="reveal rise-1"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVER_PROFILES.map((preset) => {
              const active = activePreset(preset);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "group/preset min-w-0 rounded-xl border p-3 text-left transition",
                    "hover:-translate-y-px hover:border-violet-400/40 hover:bg-violet-500/[0.07]",
                    active
                      ? "border-violet-400/60 bg-violet-500/15 shadow-lg shadow-violet-500/10"
                      : "border-white/10 bg-black/20",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-[13.5px] font-semibold",
                        active ? "text-violet-100" : "text-slate-100",
                      )}
                    >
                      {preset.name}
                    </span>
                    {active && <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-300" />}
                  </div>
                  <span className="mt-0.5 block truncate font-mono text-[10.5px] text-slate-500">
                    {preset.host}
                    {preset.port ? `:${preset.port}` : ""}
                    {preset.basePath || ""}
                  </span>
                  <span className="mt-1 block text-[11px] leading-snug text-slate-400">
                    {preset.tagline}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1">
                    <Badge
                      tone={preset.memory === "full" ? "ok" : preset.memory === "partial" ? "partial" : "no"}
                      title={preset.memoryNote}
                    >
                      {MEMORY_SUPPORT_LABEL[preset.memory]}
                    </Badge>
                    <Badge tone={preset.vision === "none" ? "no" : "neutral"} title={preset.visionNote}>
                      {VISION_SUPPORT_LABEL[preset.vision]}
                    </Badge>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-black/25 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Sparkles className="h-3 w-3 text-violet-300" />
              Detectado: {detected.name}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">
              {detected.memoryNote}
            </p>
            <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-slate-400">
              <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
              <span>{detected.visionNote}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {detected.endpoints.map((ep) => (
                <span
                  key={ep}
                  className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                >
                  {ep}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card
          title="Chat · endpoint de inferência"
          icon={<Plug className="h-4 w-4" />}
          description="Usado pelas mensagens: {base}/models e {base}/chat/completions."
          className="reveal rise-2"
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

          <Field label="Caminho base" hint="prefixo da API">
            <input
              className={inputClass}
              value={config.basePath}
              onChange={(e) => set("basePath", e.target.value)}
              placeholder="/v1"
              spellCheck={false}
            />
          </Field>

          <div className="grid gap-3 rounded-lg border border-white/5 bg-black/30 px-3 py-2.5 text-[12px] sm:grid-cols-2">
            <div className="min-w-0">
              <p className="text-slate-500">URL final do chat</p>
              <code className="block break-all font-mono text-cyan-300">{endpoint || "—"}</code>
            </div>
            <div className="min-w-0">
              <p className="text-slate-500">Exemplos de modelo</p>
              <code className="block break-all font-mono text-slate-300">
                {detected.modelExamples.join(" · ")}
              </code>
            </div>
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
            <p className="flex items-center gap-1.5 px-1 text-[11px] text-emerald-400/90">
              <Lock className="h-3 w-3" />
              Cifrada com AES-256 no navegador ao salvar · servidor local costuma aceitar qualquer
              valor (Ollama: <code className="text-slate-300">ollama</code>)
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onTestConnection}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-[0.99]"
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
          title="REST de gerenciamento · memória"
          icon={<KeyRound className="h-4 w-4" />}
          description="Rota e token próprios para a API /api/memory do OminRoute."
          className={cn(
            "reveal rise-3",
            detected.memory === "none" && "border-ember-400/20",
          )}
        >
          {detected.memory === "none" ? (
            <div className="rounded-xl border border-ember-400/25 bg-ember-400/[0.07] p-3 text-[12.5px] leading-relaxed text-ember-200">
              <p className="font-semibold text-ember-100">
                {detected.name} não expõe API de memória persistente.
              </p>
              <p className="mt-1 text-ember-200/80">
                {detected.memoryNote} Você continua com histórico de conversas local no navegador e
                pode manter um contexto fixo em <strong>System prompt</strong>. Para memória de
                verdade, sirva o mesmo modelo através de um OminRoute (porta{" "}
                <code className="text-ember-100">20128</code>) e aponte para ele.
              </p>
            </div>
          ) : detected.memory === "partial" ? (
            <div className="rounded-xl border border-ember-400/25 bg-ember-400/[0.07] p-3 text-[12.5px] leading-relaxed text-ember-200">
              <p className="font-semibold text-ember-100">Suporte parcial: armazenamento vetorial.</p>
              <p className="mt-1 text-ember-200/80">{detected.memoryNote}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] p-3 text-[12.5px] leading-relaxed text-emerald-200">
              <p className="font-semibold text-emerald-100">Memória completa disponível.</p>
              <p className="mt-1 text-emerald-200/80">{detected.memoryNote}</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
            <Field label="Rota REST" hint="prefixo da API de gestão">
              <input
                className={inputClass}
                value={config.managementPath}
                onChange={(e) => set("managementPath", e.target.value)}
                placeholder="/api"
                spellCheck={false}
              />
            </Field>
            <Field label="Porta REST" hint="vazio = porta do chat">
              <input
                className={inputClass}
                value={config.managementPort}
                onChange={(e) => set("managementPort", e.target.value.replace(/[^\d]/g, ""))}
                placeholder={config.port || "20128"}
                inputMode="numeric"
              />
            </Field>
          </div>

          <div className="rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-[12px]">
            <span className="text-slate-500">Base de gerenciamento:</span>{" "}
            <code className="break-all font-mono text-cyan-300">{managementEndpoint || "—"}</code>
          </div>

          <Field label="Token de gerenciamento" hint="não é a chave do chat">
            <div className="relative">
              <input
                className={cn(inputClass, "pr-10 font-mono")}
                type={showManagementKey ? "text" : "password"}
                value={config.managementKey}
                onChange={(e) => set("managementKey", e.target.value)}
                placeholder="oma_live_… ou chave com escopo manage/admin"
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowManagementKey((v) => !v)}
                title={showManagementKey ? "Ocultar token" : "Mostrar token"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showManagementKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3 text-[12px] leading-relaxed text-amber-100/85">
            A REST de gerenciamento exige <code className="text-amber-100">requireManagementAuth</code>:
            use um Access Token (<code className="text-amber-100">oma_live_…</code>) criado em
            Settings → Access Tokens, ou uma API Key com escopo{" "}
            <code className="text-amber-100">manage</code>/<code className="text-amber-100">admin</code>.
            Uma chave comum de inferência <strong>não</strong> autoriza these rotas (retorna 401/403).
          </div>

          <Field label="ID da API Key (apiKeyId)" hint="opcional">
            <input
              className={cn(inputClass, "font-mono")}
              value={config.memoryApiKeyId}
              onChange={(e) => set("memoryApiKeyId", e.target.value)}
              placeholder="uuid da chave usada no chat"
              spellCheck={false}
            />
          </Field>
          <p className="text-[11px] leading-relaxed text-slate-500">
            No OminRoute a memória é escopada por API Key. Informe o UUID da chave de chat para que
            os fatos aprendidos aqui sejam os mesmos injetados nas conversas.
          </p>
        </Card>

        <Card
          title="Modelo"
          icon={<Cpu className="h-4 w-4" />}
          description="Lista carregada do servidor ou digitado à mão."
          className="reveal rise-4"
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

          <Field label="Identificador do modelo" required>
            <input
              className={cn(inputClass, "font-mono")}
              value={config.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder={detected.modelExamples[0]}
              spellCheck={false}
            />
          </Field>

          {models.length === 0 && (
            <p className="text-xs leading-relaxed text-slate-500">
              Sem lista automática (o servidor pode não expor <code>/models</code> ou exigir
              autenticação). Digite o identificador — exemplos deste servidor:{" "}
              {detected.modelExamples.map((m) => (
                <code key={m} className="mr-1 text-slate-300">
                  {m}
                </code>
              ))}
            </p>
          )}
        </Card>

        <Card title="Parâmetros e anexos" icon={<Sliders className="h-4 w-4" />}>
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
            <Field label="Max tokens" hint="0 = padrão do servidor">
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

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 transition hover:border-white/20">
            <span className="min-w-0">
              <span className="block text-sm text-slate-200">Resposta em streaming</span>
              <span className="block text-[11px] text-slate-500">
                Renderiza token por token via SSE (desative se o servidor não suportar)
              </span>
            </span>
            <input
              type="checkbox"
              checked={config.stream}
              onChange={(e) => set("stream", e.target.checked)}
              className="h-4 w-4 shrink-0 accent-violet-500"
            />
          </label>

          <Field label="Imagens anexadas" hint={vision === "openai" ? "serão enviadas" : "não enviadas"}>
            <select
              className={cn(inputClass, "appearance-none")}
              value={config.visionMode}
              onChange={(e) => set("visionMode", e.target.value as ConnectionConfig["visionMode"])}
            >
              <option value="auto">auto — decide pelo servidor detectado</option>
              <option value="openai">sempre enviar (image_url + data URI)</option>
              <option value="off">nunca enviar (só texto)</option>
            </select>
          </Field>
          <p className="text-[11.5px] leading-relaxed text-slate-500">
            Formato usado: <code className="text-slate-300">messages[].content[]</code> com{" "}
            <code className="text-slate-300">image_url</code>, o mesmo aceito por OminRoute, Ollama
            (/v1), LM Studio, llama.cpp (com <code className="text-slate-300">--mmproj</code>), vLLM e
            OpenRouter. A API nativa do Ollama (<code className="text-slate-300">/api/chat</code>) usa{" "}
            <code className="text-slate-300">images: [\"&lt;base64&gt;\"]</code>; aqui falamos pelo
            endpoint OpenAI-compatível. Modelos sem visão simplesmente ignoram ou rejeitam a imagem.
          </p>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-white/[0.03] hover:text-slate-300"
          >
            {showAdvanced ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
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

        <Card
          title="Copiar e colar por servidor"
          icon={<Server className="h-4 w-4" />}
          description="O que cada servidor aceita, para não ficar perdido entre portas e rotas."
        >
          <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
            <table className="w-full min-w-[520px] border-collapse text-left text-[11.5px]">
              <thead>
                <tr className="bg-white/[0.03] text-slate-400">
                  <th className="px-3 py-2 font-semibold">Servidor</th>
                  <th className="px-3 py-2 font-semibold">Chat</th>
                  <th className="px-3 py-2 font-semibold">REST gestão</th>
                  <th className="px-3 py-2 font-semibold">Memória</th>
                  <th className="px-3 py-2 font-semibold">Imagens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {SERVER_PROFILES.map((p) => (
                  <tr key={p.id} className={cn(p.id === detected.id && "bg-violet-500/[0.07]")}>
                    <td className="px-3 py-2 font-semibold text-slate-200">{p.name}</td>
                    <td className="px-3 py-2 font-mono text-[10.5px] text-slate-400">
                      {p.host.replace(/^https?:\/\//, "")}
                      {p.port ? `:${p.port}` : ""}
                      {p.basePath || "/"}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10.5px] text-slate-400">
                      {p.restPath ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        tone={
                          p.memory === "full" ? "ok" : p.memory === "partial" ? "partial" : "no"
                        }
                      >
                        {MEMORY_SUPPORT_LABEL[p.memory]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-[10.5px] text-slate-400">
                      {VISION_SUPPORT_LABEL[p.vision]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-850">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
              <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400">
                {detected.name} · exemplo
              </span>
              <span className="font-mono text-[10.5px] text-slate-500">curl</span>
            </div>
            <pre className="overflow-x-auto px-4 py-3 text-[11.5px] leading-relaxed text-slate-300">
              {detected.chatExample}
            </pre>
          </div>
        </Card>
      </div>
      {footer}
    </div>
  );
}
