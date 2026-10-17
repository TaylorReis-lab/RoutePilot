import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  HardDrive,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import type {
  ConnectionConfig,
  MemoryEntry,
  MemoryPage,
  MemorySettings,
  MemoryType,
} from "../types";
import { Card, Field, inputClass } from "./Field";
import {
  MEMORY_SUPPORT_LABEL,
  SERVER_PROFILES,
  VISION_SUPPORT_LABEL,
  detectProfile,
} from "../lib/serverProfiles";
import {
  checkMemoryHealth,
  checkQdrantHealth,
  cleanupQdrant,
  createMemory,
  deleteMemory,
  fetchEmbeddingProviders,
  fetchMemory,
  fetchMemoryEngineStatus,
  fetchMemorySettings,
  fetchQdrantEmbeddingModels,
  fetchQdrantSettings,
  listMemories,
  previewMemories,
  reindexMemories,
  searchQdrant,
  summarizeMemories,
  updateMemory,
  updateMemorySettings,
  updateQdrantSettings,
  type EmbeddingProvidersResponse,
  type MemoryHealth,
  type MemoryEngineStatus,
  type MemoryPreview,
  type QdrantSettings,
} from "../lib/memoryApi";
import { cn } from "../utils/cn";

type MemoryTab = "memorias" | "aprendizado" | "motor";
type Feedback = { tone: "success" | "error" | "info"; text: string } | null;

const MEMORY_TYPES: Array<{ value: MemoryType; label: string }> = [
  { value: "factual", label: "Factual" },
  { value: "episodic", label: "Episódica" },
  { value: "procedural", label: "Procedural" },
  { value: "semantic", label: "Semântica" },
];

const DEFAULT_SETTINGS: MemorySettings = {
  enabled: false,
  maxTokens: 2000,
  retentionDays: 30,
  strategy: "hybrid",
  skillsEnabled: false,
  embeddingSource: "auto",
  embeddingProviderModel: null,
  transformersEnabled: false,
  staticEnabled: false,
  rerankEnabled: false,
  rerankProviderModel: null,
  vectorStore: "auto",
};

function errorText(error: unknown) {
  return (error as Error)?.message || "Ocorreu um erro inesperado.";
}

function dateText(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("pt-BR");
}

function feedbackClass(tone: NonNullable<Feedback>["tone"]) {
  if (tone === "error") return "border-rose-500/25 bg-rose-500/10 text-rose-200";
  if (tone === "success") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  return "border-sky-500/25 bg-sky-500/10 text-sky-200";
}

function useManagementReady(config: ConnectionConfig) {
  return Boolean(config.managementKey.trim() && config.host.trim());
}

export function MemoryView({
  config,
  onOpenConnection,
  footer,
}: {
  config: ConnectionConfig;
  onOpenConnection: () => void;
  footer?: ReactNode;
}) {
  const [tab, setTab] = useState<MemoryTab>("memorias");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [health, setHealth] = useState<MemoryHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const managementReady = useManagementReady(config);

  const [page, setPage] = useState<MemoryPage>({
    memories: [],
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    stats: {},
  });
  const [listLoading, setListLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MemoryType | "all">("all");
  const [sessionFilter, setSessionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formType, setFormType] = useState<MemoryType>("factual");
  const [formSessionId, setFormSessionId] = useState("");
  const [formBusy, setFormBusy] = useState(false);

  const [memorySettings, setMemorySettings] = useState<MemorySettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [engine, setEngine] = useState<MemoryEngineStatus | null>(null);
  const [embeddingProviders, setEmbeddingProviders] = useState<EmbeddingProvidersResponse | null>(null);
  const [engineLoading, setEngineLoading] = useState(false);
  const [previewQuery, setPreviewQuery] = useState("");
  const [previewStrategy, setPreviewStrategy] = useState<"exact" | "semantic" | "hybrid">("hybrid");
  const [preview, setPreview] = useState<MemoryPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [olderThanDays, setOlderThanDays] = useState(30);
  const [summarizeResult, setSummarizeResult] = useState<Record<string, unknown> | null>(null);
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  const [reindexLoading, setReindexLoading] = useState(false);

  const [qdrant, setQdrant] = useState<QdrantSettings | null>(null);
  const [qdrantSaving, setQdrantSaving] = useState(false);
  const [qdrantApiKey, setQdrantApiKey] = useState("");
  const [clearQdrantKey, setClearQdrantKey] = useState(false);
  const [qdrantModels, setQdrantModels] = useState<Array<{ value: string; label: string; dimensions?: number }>>([]);
  const [qdrantHealth, setQdrantHealth] = useState<{ ok: boolean; latencyMs: number; error?: string } | null>(null);
  const [qdrantQuery, setQdrantQuery] = useState("");
  const [qdrantSearchResults, setQdrantSearchResults] = useState<Array<Record<string, unknown>> | null>(null);
  const [qdrantBusy, setQdrantBusy] = useState(false);

  const reloadList = useCallback(async () => {
    setListLoading(true);
    try {
      const result = await listMemories(config, {
        page: currentPage,
        limit: 20,
        query,
        type: typeFilter,
        sessionId: sessionFilter,
        apiKeyId: config.memoryApiKeyId,
      });
      setPage(result);
      setFeedback(null);
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setListLoading(false);
    }
  }, [
    config.host,
    config.port,
    config.managementPort,
    config.managementPath,
    config.managementKey,
    config.memoryApiKeyId,
    config.useProxy,
    config.proxyUrl,
    currentPage,
    query,
    typeFilter,
    sessionFilter,
  ]);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      setHealth(await checkMemoryHealth(config));
    } catch (error) {
      setHealth({ working: false, error: errorText(error) });
    } finally {
      setHealthLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (!managementReady || tab !== "memorias") return;
    const timer = window.setTimeout(() => void reloadList(), query ? 280 : 0);
    return () => window.clearTimeout(timer);
  }, [managementReady, query, reloadList, tab]);

  useEffect(() => {
    if (!managementReady || tab !== "memorias") return;
    void loadHealth();
  }, [managementReady, loadHealth, tab]);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const serverSettings = await fetchMemorySettings(config);
      setMemorySettings({ ...DEFAULT_SETTINGS, ...serverSettings });
      setSettingsLoaded(true);
      setFeedback(null);
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setSettingsLoading(false);
    }
  }, [config]);

  const loadEngine = useCallback(async () => {
    setEngineLoading(true);
    try {
      const [engineResult, providersResult, qdrantResult, qdrantModelsResult] = await Promise.allSettled([
        fetchMemoryEngineStatus(config),
        fetchEmbeddingProviders(config),
        fetchQdrantSettings(config),
        fetchQdrantEmbeddingModels(config),
      ]);
      if (engineResult.status === "fulfilled") setEngine(engineResult.value);
      if (providersResult.status === "fulfilled") setEmbeddingProviders(providersResult.value);
      if (qdrantResult.status === "fulfilled") setQdrant(qdrantResult.value);
      if (qdrantModelsResult.status === "fulfilled") {
        setQdrantModels(qdrantModelsResult.value.models ?? []);
      }
      const failed = [engineResult, providersResult, qdrantResult].find(
        (result) => result.status === "rejected",
      );
      if (failed?.status === "rejected") {
        setFeedback({ tone: "error", text: errorText(failed.reason) });
      } else {
        setFeedback(null);
      }
    } finally {
      setEngineLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (!managementReady) return;
    if (tab === "aprendizado" && !settingsLoaded) void loadSettings();
    if (tab === "motor") void loadEngine();
  }, [managementReady, tab, settingsLoaded, loadSettings, loadEngine]);

  const openNewForm = () => {
    setEditingId("");
    setFormKey("");
    setFormContent("");
    setFormType("factual");
    setFormSessionId("");
    setFormOpen(true);
  };

  const openEditForm = async (entry: MemoryEntry) => {
    setEditingId(entry.id);
    setFormKey(entry.key);
    setFormContent(entry.content);
    setFormType(entry.type);
    setFormSessionId(entry.sessionId || "");
    setFormOpen(true);
    try {
      const current = await fetchMemory(config, entry.id);
      setFormKey(current.key || entry.key);
      setFormContent(current.content || entry.content);
      setFormType(current.type || entry.type);
      setFormSessionId(current.sessionId || entry.sessionId || "");
    } catch (error) {
      setFeedback({ tone: "error", text: `Não foi possível recarregar a memória: ${errorText(error)}` });
    }
  };

  const saveMemory = async () => {
    if (!formKey.trim() || !formContent.trim()) {
      setFeedback({ tone: "error", text: "Preencha a chave e o conteúdo da memória." });
      return;
    }
    setFormBusy(true);
    try {
      if (editingId) {
        await updateMemory(config, editingId, {
          key: formKey.trim(),
          content: formContent.trim(),
          type: formType,
        });
        setFeedback({ tone: "success", text: "Memória atualizada." });
      } else {
        await createMemory(config, {
          key: formKey.trim(),
          content: formContent.trim(),
          type: formType,
          sessionId: formSessionId.trim(),
          apiKeyId: config.memoryApiKeyId,
          metadata: { source: "routepilot_manual", savedAt: new Date().toISOString() },
        });
        setFeedback({ tone: "success", text: "Aprendizado salvo na memória do OmniRoute." });
      }
      setFormOpen(false);
      await reloadList();
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setFormBusy(false);
    }
  };

  const removeMemory = async (entry: MemoryEntry) => {
    if (!window.confirm(`Excluir a memória “${entry.key || entry.content.slice(0, 60)}”?`)) return;
    try {
      await deleteMemory(config, entry.id);
      setFeedback({ tone: "success", text: "Memória excluída." });
      await reloadList();
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const result = await updateMemorySettings(config, memorySettings);
      setMemorySettings({ ...DEFAULT_SETTINGS, ...result });
      setSettingsLoaded(true);
      setFeedback({
        tone: "success",
        text: memorySettings.enabled
          ? "Memória e extração automática ativadas no OmniRoute."
          : "Configurações de memória salvas no OmniRoute.",
      });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setSettingsSaving(false);
    }
  };

  const runPreview = async () => {
    if (!previewQuery.trim()) return;
    setPreviewLoading(true);
    try {
      const result = await previewMemories(config, {
        query: previewQuery.trim(),
        strategy: previewStrategy,
        maxTokens: Number(memorySettings.maxTokens) || 2000,
        limit: 20,
        apiKeyId: config.memoryApiKeyId,
      });
      setPreview(result);
      setFeedback({ tone: "success", text: "Busca simulada sem alterar a memória." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setPreviewLoading(false);
    }
  };

  const runSummarize = async (dryRun: boolean) => {
    setSummarizeLoading(true);
    try {
      const result = await summarizeMemories(config, {
        olderThanDays,
        apiKeyId: config.memoryApiKeyId,
        dryRun,
      });
      setSummarizeResult(result);
      setFeedback({
        tone: "success",
        text: dryRun
          ? "Prévia concluída; nenhuma memória foi alterada."
          : "Compactação concluída no OmniRoute.",
      });
      if (!dryRun) await reloadList();
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setSummarizeLoading(false);
    }
  };

  const runReindex = async (force: boolean) => {
    setReindexLoading(true);
    try {
      const result = await reindexMemories(config, force);
      setFeedback({
        tone: "success",
        text: `Reindexação iniciada. Itens pendentes: ${result.pending ?? "—"}.`,
      });
      await loadEngine();
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setReindexLoading(false);
    }
  };

  const saveQdrant = async () => {
    if (!qdrant) return;
    setQdrantSaving(true);
    try {
      const body: Parameters<typeof updateQdrantSettings>[1] = {
        enabled: qdrant.enabled,
        host: qdrant.host,
        port: Number(qdrant.port),
        collection: qdrant.collection,
        embeddingModel: qdrant.embeddingModel,
        quantization: qdrant.quantization,
      };
      if (qdrantApiKey.trim()) body.apiKey = qdrantApiKey.trim();
      else if (clearQdrantKey) body.apiKey = "";
      const result = await updateQdrantSettings(config, body);
      setQdrant(result);
      setQdrantApiKey("");
      setClearQdrantKey(false);
      setFeedback({ tone: "success", text: "Configuração do Qdrant salva." });
      await loadEngine();
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setQdrantSaving(false);
    }
  };

  const runQdrantHealth = async () => {
    setQdrantBusy(true);
    try {
      const result = await checkQdrantHealth(config);
      setQdrantHealth(result);
      setFeedback({
        tone: result.ok ? "success" : "error",
        text: result.ok
          ? `Qdrant respondeu em ${result.latencyMs} ms.`
          : result.error || "Qdrant não respondeu.",
      });
    } catch (error) {
      setQdrantHealth({ ok: false, latencyMs: 0, error: errorText(error) });
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setQdrantBusy(false);
    }
  };

  const runQdrantSearch = async () => {
    if (!qdrantQuery.trim()) return;
    setQdrantBusy(true);
    try {
      const result = await searchQdrant(config, qdrantQuery.trim(), 5);
      setQdrantSearchResults(result.results ?? []);
      setFeedback({
        tone: result.ok ? "success" : "error",
        text: result.ok ? "Busca semântica concluída." : "Busca semântica sem resultados ou indisponível.",
      });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setQdrantBusy(false);
    }
  };

  const runQdrantCleanup = async () => {
    if (!window.confirm("Remover do Qdrant vetores expirados ou fora da retenção?")) return;
    setQdrantBusy(true);
    try {
      const result = await cleanupQdrant(config);
      setFeedback({ tone: "success", text: `Limpeza concluída: ${result.deletedCount ?? 0} vetor(es) removido(s).` });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setQdrantBusy(false);
    }
  };

  const statsLine = useMemo(() => {
    const stats = page.stats;
    return `${stats.total ?? page.total} memórias · ${stats.tokensUsed ?? 0} tokens indexados`;
  }, [page]);

  const tabs: Array<{ id: MemoryTab; label: string; icon: typeof Brain }> = [
    { id: "memorias", label: "Memórias", icon: Database },
    { id: "aprendizado", label: "Aprendizado", icon: Brain },
    { id: "motor", label: "Motor e busca", icon: Activity },
  ];

  return (
    <div
      id="routepilot-scroll"
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
    >
      <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-50">
              <Brain className="h-5 w-5 text-violet-300" /> Memória e aprendizado
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
              Gerencie fatos persistentes no OmniRoute, teste o que será recuperado e controle a
              extração automática de preferências e decisões.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                health?.working ? "bg-emerald-400" : health ? "bg-rose-400" : "bg-slate-500",
              )}
            />
            <span className="text-slate-400">
              {healthLoading ? "Verificando memória…" : health?.working ? "Memória operacional" : health?.error ? "Memória indisponível" : "Não testada"}
            </span>
          </div>
        </header>

        {(() => {
          const profile = detectProfile(config);
          const compatible = profile.memory === "full";
          return (
            <div
              className={cn(
                "reveal rounded-2xl border p-4",
                compatible
                  ? "border-emerald-400/20 bg-emerald-500/[0.06]"
                  : "border-ember-400/25 bg-ember-400/[0.06]",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-[15px] font-semibold text-slate-100">
                  Servidor detectado: {profile.name}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                    compatible
                      ? "border-emerald-400/30 text-emerald-300"
                      : "border-ember-400/30 text-ember-300",
                  )}
                >
                  {MEMORY_SUPPORT_LABEL[profile.memory]}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                  {VISION_SUPPORT_LABEL[profile.vision]}
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-300/90">{profile.memoryNote}</p>

              {!compatible && (
                <>
                  <p className="mt-2.5 text-[12px] leading-relaxed text-ember-200/90">
                    Alternativas sem API de memória: (1) manter o histórico local do RoutePilot, que
                    reenvia a conversa inteira a cada chamada; (2) fixar preferências em{" "}
                    <strong>Conexão → Avançado → System prompt</strong>; (3) rodar o OminRoute na
                    frente deste servidor e apontar a conexão para{" "}
                    <code className="text-ember-100">http://localhost:20128/v1</code> + REST{" "}
                    <code className="text-ember-100">/api</code> — ele decorre a memória por você.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {SERVER_PROFILES.map((p) => (
                      <div
                        key={p.id}
                        className={cn(
                          "rounded-xl border p-2.5",
                          p.id === profile.id
                            ? "border-violet-400/40 bg-violet-500/[0.08]"
                            : "border-white/[0.07] bg-black/20",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-semibold text-slate-200">{p.name}</p>
                          <span className="font-mono text-[10px] text-slate-500">
                            {p.restPath ? `REST ${p.restPath}` : "sem REST"}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{p.memoryNote}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        <nav className="flex w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-1 sm:w-fit" aria-label="Seções de memória">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition",
                tab === id ? "bg-violet-500/20 text-violet-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </nav>

        {!managementReady ? (
          <Card title="Conecte a API de gerenciamento" icon={<AlertCircle className="h-4 w-4" />}>
            <p className="text-sm leading-relaxed text-slate-400">
              A memória do OmniRoute é uma REST API de gerenciamento e exige um token próprio. Ela
              não usa automaticamente a chave de inferência do chat.
            </p>
            <button
              type="button"
              onClick={onOpenConnection}
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
            >
              Configurar rota e token
            </button>
          </Card>
        ) : (
          <>
            {feedback && (
              <div className={cn("flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed", feedbackClass(feedback.tone))}>
                {feedback.tone === "success" ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                <span className="min-w-0 flex-1">{feedback.text}</span>
                <button type="button" onClick={() => setFeedback(null)} className="text-current/70 hover:text-current" aria-label="Fechar aviso">×</button>
              </div>
            )}

            {tab === "memorias" && (
              <section className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_180px_auto] sm:items-center">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      className={cn(inputClass, "pl-9")}
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Buscar conteúdo ou chave…"
                    />
                  </div>
                  <select
                    className={cn(inputClass, "sm:w-44")}
                    value={typeFilter}
                    onChange={(event) => {
                      setTypeFilter(event.target.value as MemoryType | "all");
                      setCurrentPage(1);
                    }}
                    aria-label="Filtrar por tipo de memória"
                  >
                    <option value="all">Todos os tipos</option>
                    {MEMORY_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <input
                    className={inputClass}
                    value={sessionFilter}
                    onChange={(event) => {
                      setSessionFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="ID da sessão"
                    aria-label="Filtrar por sessão"
                  />
                  <button
                    type="button"
                    onClick={openNewForm}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
                  >
                    <Plus className="h-4 w-4" /> Nova memória
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{statsLine}{page.stats.hitRate !== undefined ? ` · cache ${(page.stats.hitRate * 100).toFixed(0)}%` : ""}</span>
                  <button type="button" onClick={() => { void reloadList(); void loadHealth(); }} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-400 transition hover:bg-white/5 hover:text-white">
                    <RefreshCw className={cn("h-3.5 w-3.5", listLoading && "animate-spin")} /> Atualizar
                  </button>
                </div>

                {formOpen && (
                  <Card
                    title={editingId ? "Editar memória" : "Salvar aprendizado"}
                    icon={<Sparkles className="h-4 w-4" />}
                    description="O campo chave identifica o fato e permite atualizar a mesma memória em vez de duplicá-la."
                  >
                    <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                      <Field label="Chave" required>
                        <input className={inputClass} value={formKey} onChange={(event) => setFormKey(event.target.value)} placeholder="preference:language" />
                      </Field>
                      <Field label="Tipo">
                        <select className={inputClass} value={formType} onChange={(event) => setFormType(event.target.value as MemoryType)}>
                          {MEMORY_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                      </Field>
                    </div>
                    {!editingId && <Field label="ID da sessão" hint="opcional"><input className={cn(inputClass, "font-mono")} value={formSessionId} onChange={(event) => setFormSessionId(event.target.value)} placeholder="ID da conversa (opcional)" /></Field>}
                    <Field label="Conteúdo aprendido" required>
                      <textarea className={cn(inputClass, "min-h-24 resize-y")} value={formContent} onChange={(event) => setFormContent(event.target.value)} placeholder="Ex.: Prefere respostas em português e exemplos em TypeScript." />
                    </Field>
                    {config.memoryApiKeyId && <p className="text-[11px] text-slate-500">Será associado à API Key ID <code className="text-slate-300">{config.memoryApiKeyId}</code>.</p>}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Cancelar</button>
                      <button type="button" disabled={formBusy} onClick={() => void saveMemory()} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50">
                        {formBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {editingId ? "Salvar alterações" : "Aprender"}
                      </button>
                    </div>
                  </Card>
                )}

                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                  {listLoading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Carregando memórias…</div>
                  ) : page.memories.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <Database className="mx-auto h-8 w-8 text-slate-600" />
                      <p className="mt-3 text-sm font-medium text-slate-300">Nenhuma memória encontrada</p>
                      <p className="mt-1 text-xs text-slate-500">Adicione fatos manualmente ou ative a extração automática na aba Aprendizado.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/5">
                      {page.memories.map((entry) => (
                        <li key={entry.id} className="group flex min-w-0 items-start gap-3 px-4 py-4 transition hover:bg-white/[0.025]">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/10 text-violet-300"><Brain className="h-3.5 w-3.5" /></div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-xs font-semibold text-slate-200">{entry.key || "sem chave"}</span>
                              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-400">{entry.type}</span>
                              {entry.sessionId && <span className="truncate font-mono text-[10px] text-slate-600">sessão {entry.sessionId}</span>}
                            </div>
                            <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-300">{entry.content}</p>
                            {entry.createdAt && <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-600"><Clock className="h-3 w-3" /> {dateText(entry.createdAt)}</p>}
                          </div>
                          <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-60 sm:group-hover:opacity-100">
                            <button type="button" onClick={() => openEditForm(entry)} title="Editar memória" className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><PencilIcon /></button>
                            <button type="button" onClick={() => void removeMemory(entry)} title="Excluir memória" className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">Página {page.page} de {page.totalPages} · {page.total} item(ns)</span>
                  <div className="flex gap-1">
                    <button type="button" disabled={currentPage <= 1 || listLoading} onClick={() => setCurrentPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/5 disabled:opacity-30" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
                    <button type="button" disabled={currentPage >= page.totalPages || listLoading} onClick={() => setCurrentPage((value) => Math.min(page.totalPages, value + 1))} className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/5 disabled:opacity-30" aria-label="Próxima página"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              </section>
            )}

            {tab === "aprendizado" && (
              <section className="space-y-4">
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.07] p-3 text-xs leading-relaxed text-amber-100/80">
                  Quando habilitada no servidor, a memória do OmniRoute pode recuperar fatos relevantes para cada conversa e extrair preferências/decisões das respostas. Isso pode acrescentar contexto e tokens a cada chamada. As alterações abaixo são salvas no OmniRoute, não neste app.
                </div>

                <Card title="Aprendizado automático" icon={<Sparkles className="h-4 w-4" />} description="Controle a memória persistente que o próprio OmniRoute injeta e atualiza durante as conversas.">
                  {settingsLoading ? (
                    <p className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Lendo configuração do servidor…</p>
                  ) : (
                    <>
                      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                        <span><span className="block text-sm font-medium text-slate-100">Memória ativa no OmniRoute</span><span className="mt-0.5 block text-[11px] text-slate-500">Recuperação de contexto e extração de aprendizados automáticos.</span></span>
                        <input type="checkbox" checked={Boolean(memorySettings.enabled)} onChange={(event) => setMemorySettings((value) => ({ ...value, enabled: event.target.checked }))} className="h-4 w-4 accent-violet-500" />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Orçamento de contexto" hint="tokens">
                          <input className={inputClass} type="number" min={0} max={16000} step={100} value={memorySettings.maxTokens ?? 2000} onChange={(event) => setMemorySettings((value) => ({ ...value, maxTokens: Number(event.target.value) }))} />
                        </Field>
                        <Field label="Retenção" hint="dias">
                          <input className={inputClass} type="number" min={1} max={365} value={memorySettings.retentionDays ?? 30} onChange={(event) => setMemorySettings((value) => ({ ...value, retentionDays: Number(event.target.value) }))} />
                        </Field>
                        <Field label="Estratégia">
                          <select className={inputClass} value={memorySettings.strategy ?? "hybrid"} onChange={(event) => setMemorySettings((value) => ({ ...value, strategy: event.target.value as MemorySettings["strategy"] }))}>
                            <option value="recent">Recente</option><option value="semantic">Semântica</option><option value="hybrid">Híbrida</option>
                          </select>
                        </Field>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Fonte de embeddings">
                          <select className={inputClass} value={memorySettings.embeddingSource ?? "auto"} onChange={(event) => setMemorySettings((value) => ({ ...value, embeddingSource: event.target.value as MemorySettings["embeddingSource"] }))}>
                            <option value="auto">Automática</option><option value="remote">Remota</option><option value="static">Estática local</option><option value="transformers">Transformers local</option>
                          </select>
                        </Field>
                        <Field label="Armazenamento vetorial">
                          <select className={inputClass} value={memorySettings.vectorStore ?? "auto"} onChange={(event) => setMemorySettings((value) => ({ ...value, vectorStore: event.target.value as MemorySettings["vectorStore"] }))}>
                            <option value="auto">Automático / SQLite</option><option value="sqlite-vec">sqlite-vec</option><option value="qdrant">Qdrant</option>
                          </select>
                        </Field>
                      </div>
                      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 px-3 py-2.5">
                        <span className="text-xs text-slate-300">Ativar skills junto da memória</span><input type="checkbox" checked={Boolean(memorySettings.skillsEnabled)} onChange={(event) => setMemorySettings((value) => ({ ...value, skillsEnabled: event.target.checked }))} className="h-4 w-4 accent-violet-500" />
                      </label>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button type="button" onClick={() => void loadSettings()} disabled={settingsLoading} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"><RefreshCw className={cn("h-3.5 w-3.5", settingsLoading && "animate-spin")} /> Ler valores do servidor</button>
                        <button type="button" onClick={() => void saveSettings()} disabled={settingsSaving || settingsLoading} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{settingsSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar no OmniRoute</button>
                      </div>
                    </>
                  )}
                </Card>

                <Card title="Aprender manualmente" icon={<Brain className="h-4 w-4" />} description="Use “Nova memória” na aba Memórias para guardar uma preferência, decisão ou procedimento que você quer reutilizar.">
                  <p className="text-xs leading-relaxed text-slate-400">Você também pode clicar em <strong className="text-slate-200">Aprender</strong> em uma resposta do chat para salvar aquele par pergunta/resposta como memória episódica. O campo “ID da API Key” associa os fatos ao escopo usado pelo OmniRoute.</p>
                  <button type="button" onClick={() => { setTab("memorias"); openNewForm(); }} className="flex items-center gap-1.5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-100 hover:bg-violet-500/20"><Plus className="h-3.5 w-3.5" /> Criar uma memória</button>
                </Card>
              </section>
            )}

            {tab === "motor" && (
              <section className="space-y-4">
                <Card title="Estado do motor de memória" icon={<Activity className="h-4 w-4" />} description="Diagnóstico de busca textual, embeddings, vetor, Qdrant e re-ranking.">
                  {engineLoading && !engine ? <p className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Consultando estado…</p> : engine ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <StatusLine label="Busca textual" value={`${engine.keyword?.backend ?? "—"} · ${engine.keyword?.available ? "disponível" : "indisponível"}`} ok={engine.keyword?.available} />
                      <StatusLine label="Embeddings" value={`${engine.embedding?.source ?? "sem fonte"} · ${engine.embedding?.model ?? "sem modelo"}`} ok={engine.embedding?.available} />
                      <StatusLine label="Vetores" value={`${engine.vectorStore?.backend ?? "—"} · ${engine.vectorStore?.rowCount ?? 0} itens · ${engine.vectorStore?.needsReindex ?? 0} pendentes`} ok={engine.vectorStore?.available} />
                      <StatusLine label="Qdrant" value={engine.qdrant?.enabled ? engine.qdrant.healthy ? `saudável · ${engine.qdrant.latencyMs ?? "—"} ms` : engine.qdrant.error ?? "sem conexão" : "desativado"} ok={engine.qdrant?.enabled ? engine.qdrant?.healthy ?? false : undefined} />
                      <StatusLine label="Re-ranking" value={engine.rerank?.enabled ? `${engine.rerank.model ?? engine.rerank.provider ?? "ativado"} · ${engine.rerank.available ? "disponível" : "indisponível"}` : "desativado"} ok={engine.rerank?.enabled ? engine.rerank?.available : undefined} />
                    </div>
                  ) : <p className="text-xs text-slate-500">Nenhum estado carregado.</p>}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void loadEngine()} disabled={engineLoading} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"><RefreshCw className={cn("h-3.5 w-3.5", engineLoading && "animate-spin")} /> Atualizar diagnóstico</button>
                    <button type="button" onClick={() => void runReindex(false)} disabled={reindexLoading} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"><HardDrive className="h-3.5 w-3.5" /> Reindexar pendentes</button>
                    <button type="button" onClick={() => { if (window.confirm("Forçar reindexação de todos os vetores?")) void runReindex(true); }} disabled={reindexLoading} className="flex items-center gap-1.5 rounded-lg border border-amber-400/20 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"><Zap className="h-3.5 w-3.5" /> Reindexar tudo</button>
                  </div>
                </Card>

                <Card title="Prévia de recuperação" icon={<Search className="h-4 w-4" />} description="Simula a busca do OmniRoute sem injetar contexto nem modificar memórias.">
                  <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
                    <input className={inputClass} value={previewQuery} onChange={(event) => setPreviewQuery(event.target.value)} placeholder="O que a IA deve lembrar sobre este assunto?" />
                    <select className={inputClass} value={previewStrategy} onChange={(event) => setPreviewStrategy(event.target.value as typeof previewStrategy)}><option value="exact">Exata / palavras</option><option value="semantic">Semântica</option><option value="hybrid">Híbrida</option></select>
                    <button type="button" onClick={() => void runPreview()} disabled={previewLoading || !previewQuery.trim()} className="flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{previewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Simular</button>
                  </div>
                  {preview && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] text-slate-500">{preview.memories.length} resultado(s) · {preview.totalTokensUsed ?? 0} / {preview.budgetMaxTokens ?? memorySettings.maxTokens ?? 2000} tokens{preview.resolution?.strategyUsed ? ` · ${String(preview.resolution.strategyUsed)}` : ""}</p>
                      {preview.memories.length ? preview.memories.map((memory) => <div key={memory.id} className="rounded-lg border border-white/10 bg-black/20 p-3"><div className="flex flex-wrap items-center gap-2 text-[10px] text-violet-300"><span>{memory.type}</span><span>score {memory.score.toFixed(3)}</span><span>{memory.tokens} tokens</span><span>{memory.tier}</span></div><p className="mt-1 break-words text-xs leading-relaxed text-slate-300">{memory.content}</p></div>) : <p className="rounded-lg border border-white/5 px-3 py-4 text-center text-xs text-slate-500">Nenhuma memória relevante para essa consulta.</p>}
                    </div>
                  )}
                  {embeddingProviders?.providers && <p className="pt-1 text-[10px] text-slate-600">Provedores de embedding configurados: {embeddingProviders.providers.filter((provider) => provider.hasKey).map((provider) => provider.provider).join(", ") || "nenhum com credencial"}</p>}
                </Card>

                <Card title="Compactar memórias antigas" icon={<Clock className="h-4 w-4" />} description="A prévia não altera nada. Execute a compactação somente após revisar o resultado no OmniRoute.">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="w-full sm:max-w-48"><Field label="Mais antigas que" hint="dias"><input className={inputClass} type="number" min={1} max={365} value={olderThanDays} onChange={(event) => setOlderThanDays(Number(event.target.value))} /></Field></div>
                    <button type="button" onClick={() => void runSummarize(true)} disabled={summarizeLoading} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">{summarizeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Pré-visualizar</button>
                    <button type="button" onClick={() => { if (window.confirm("Compactar e remover as memórias antigas selecionadas? Esta ação altera o armazenamento do OmniRoute.")) void runSummarize(false); }} disabled={summarizeLoading} className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/25 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/10">{summarizeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Executar compactação</button>
                  </div>
                  {summarizeResult && <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] leading-relaxed text-slate-300">{JSON.stringify(summarizeResult, null, 2)}</pre>}
                </Card>

                <QdrantCard
                  qdrant={qdrant}
                  setQdrant={setQdrant}
                  loading={engineLoading}
                  saving={qdrantSaving}
                  apiKey={qdrantApiKey}
                  setApiKey={setQdrantApiKey}
                  clearApiKey={clearQdrantKey}
                  setClearApiKey={setClearQdrantKey}
                  models={qdrantModels}
                  health={qdrantHealth}
                  query={qdrantQuery}
                  setQuery={setQdrantQuery}
                  searchResults={qdrantSearchResults}
                  busy={qdrantBusy}
                  onSave={() => void saveQdrant()}
                  onHealth={() => void runQdrantHealth()}
                  onSearch={() => void runQdrantSearch()}
                  onCleanup={() => void runQdrantCleanup()}
                />
              </section>
            )}
          </>
        )}
      </div>
      {footer}
    </div>
  );
}

function PencilIcon() {
  return <Pencil className="h-3.5 w-3.5" />;
}

function StatusLine({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2.5">
      <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", ok === undefined ? "bg-slate-600" : ok ? "bg-emerald-400" : "bg-amber-400")} />
      <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-0.5 break-words text-xs text-slate-300">{value}</p></div>
    </div>
  );
}

function QdrantCard({
  qdrant,
  setQdrant,
  loading,
  saving,
  apiKey,
  setApiKey,
  clearApiKey,
  setClearApiKey,
  models,
  health,
  query,
  setQuery,
  searchResults,
  busy,
  onSave,
  onHealth,
  onSearch,
  onCleanup,
}: {
  qdrant: QdrantSettings | null;
  setQdrant: (settings: QdrantSettings | null) => void;
  loading: boolean;
  saving: boolean;
  apiKey: string;
  setApiKey: (value: string) => void;
  clearApiKey: boolean;
  setClearApiKey: (value: boolean) => void;
  models: Array<{ value: string; label: string; dimensions?: number }>;
  health: { ok: boolean; latencyMs: number; error?: string } | null;
  query: string;
  setQuery: (value: string) => void;
  searchResults: Array<Record<string, unknown>> | null;
  busy: boolean;
  onSave: () => void;
  onHealth: () => void;
  onSearch: () => void;
  onCleanup: () => void;
}) {
  return (
    <Card title="Qdrant vetorial (opcional)" icon={<HardDrive className="h-4 w-4" />} description="Use um banco vetorial externo para recuperação semântica. SQLite/FTS5 continua sendo o fallback do OmniRoute.">
      {loading && !qdrant ? <p className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Lendo configuração Qdrant…</p> : qdrant ? (
        <>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2.5"><span><span className="block text-sm text-slate-200">Ativar Qdrant como motor vetorial</span><span className="block text-[11px] text-slate-500">Altera o vectorStore do OmniRoute para qdrant.</span></span><input type="checkbox" checked={qdrant.enabled} onChange={(event) => setQdrant({ ...qdrant, enabled: event.target.checked })} className="h-4 w-4 accent-violet-500" /></label>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <Field label="Host Qdrant"><input className={inputClass} value={qdrant.host} onChange={(event) => setQdrant({ ...qdrant, host: event.target.value })} placeholder="http://localhost" /></Field>
            <Field label="Porta"><input className={inputClass} type="number" min={1} max={65535} value={qdrant.port} onChange={(event) => setQdrant({ ...qdrant, port: Number(event.target.value) })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Collection"><input className={inputClass} value={qdrant.collection} onChange={(event) => setQdrant({ ...qdrant, collection: event.target.value })} /></Field>
            <Field label="Modelo de embeddings">
              {models.length ? <select className={inputClass} value={qdrant.embeddingModel} onChange={(event) => setQdrant({ ...qdrant, embeddingModel: event.target.value })}>{models.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}</select> : <input className={inputClass} value={qdrant.embeddingModel} onChange={(event) => setQdrant({ ...qdrant, embeddingModel: event.target.value })} placeholder="provider/model" />}
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Quantização"><select className={inputClass} value={qdrant.quantization} onChange={(event) => setQdrant({ ...qdrant, quantization: event.target.value as QdrantSettings["quantization"] })}><option value="none">Nenhuma</option><option value="int8">INT8</option><option value="binary">Binária</option></select></Field>
            <Field label="Chave de API do Qdrant" hint={qdrant.apiKeyMasked ? `atual ${qdrant.apiKeyMasked}` : "opcional"}><input className={inputClass} type="password" value={apiKey} onChange={(event) => { setApiKey(event.target.value); setClearApiKey(false); }} placeholder={qdrant.hasApiKey ? "Deixe em branco para manter" : "Chave do Qdrant"} autoComplete="new-password" /></Field>
          </div>
          {qdrant.hasApiKey && <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={clearApiKey} onChange={(event) => setClearApiKey(event.target.checked)} className="h-3.5 w-3.5 accent-rose-500" /> Remover chave salva</label>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={saving} onClick={onSave} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar Qdrant</button>
            <button type="button" disabled={busy} onClick={onHealth} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"><Activity className="h-3.5 w-3.5" /> Testar saúde</button>
            <button type="button" disabled={busy} onClick={onCleanup} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Limpar expirados</button>
          </div>
          {health && <p className={cn("text-xs", health.ok ? "text-emerald-300" : "text-rose-300")}>{health.ok ? `Qdrant ativo · ${health.latencyMs} ms` : health.error || "Qdrant indisponível"}</p>}
          <div className="flex flex-col gap-2 border-t border-white/5 pt-3 sm:flex-row">
            <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Testar busca semântica…" />
            <button type="button" disabled={busy || !query.trim()} onClick={onSearch} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"><Search className="h-3.5 w-3.5" /> Buscar</button>
          </div>
          {searchResults && <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-[10px] leading-relaxed text-slate-300">{JSON.stringify(searchResults, null, 2)}</pre>}
        </>
      ) : <p className="text-xs text-slate-500">Não foi possível carregar as configurações do Qdrant.</p>}
    </Card>
  );
}