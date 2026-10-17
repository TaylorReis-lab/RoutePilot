import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { CatalogModel, ConnectionConfig, ModelCatalogResult } from "../types";
import { capabilityLabels, fetchModelCatalog, typeLabel, uniqueProviders, uniqueTypes } from "../lib/catalogApi";
import { inputClass } from "./Field";
import { cn } from "../utils/cn";

const PAGE_SIZE = 12;

function formatCount(value?: number): string {
  return typeof value === "number" ? new Intl.NumberFormat("pt-BR").format(value) : "—";
}

export function ModelCatalog({
  config,
  onClose,
  onSelectModel,
}: {
  config: ConnectionConfig;
  onClose: () => void;
  onSelectModel: (modelId: string) => void;
}) {
  const [result, setResult] = useState<ModelCatalogResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchModelCatalog(config);
      setResult(data);
    } catch (err) {
      setError((err as Error)?.message || "Não foi possível carregar o catálogo de modelos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const providers = useMemo(() => uniqueProviders(result?.providers ?? []), [result]);
  const types = useMemo(() => uniqueTypes(result?.models ?? []), [result]);

  const filtered = useMemo(() => {
    const models = result?.models ?? [];
    const q = query.trim().toLowerCase();
    return models.filter((m) => {
      if (provider !== "all" && m.provider !== provider) return false;
      if (type !== "all" && m.type !== type) return false;
      if (!q) return true;
      const caps = capabilityLabels(m).join(" ").toLowerCase();
      return (
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        caps.includes(q)
      );
    });
  }, [result, query, provider, type]);

  useEffect(() => setPage(1), [query, provider, type]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const rows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="reveal relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl">
        {/* cabeçalho */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 font-display text-[16px] font-semibold text-slate-50">
              <Sparkles className="h-4 w-4 text-violet-300" />
              Catálogo de modelos
            </h3>
            <p className="truncate text-[11.5px] text-slate-500">
              Metadados de todos os provedores conectados ao seu OminRoute — GET /api/models/catalog
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              title="Atualizar"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* filtros */}
        <div className="flex flex-col gap-2 border-b border-white/10 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className={cn(inputClass, "pl-9")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar por modelo, provedor ou capacidade…"
            />
          </div>
          <select
            className={cn(inputClass, "sm:w-48")}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            aria-label="Filtrar por provedor"
          >
            <option value="all">Todos os provedores</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            className={cn(inputClass, "sm:w-40")}
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filtrar por tipo"
          >
            <option value="all">Todos os tipos</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {typeLabel(t)}
              </option>
            ))}
          </select>
        </div>

        {/* corpo */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {loading && !result ? (
            <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando catálogo…
            </div>
          ) : error && !result ? (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <AlertCircle className="h-6 w-6 text-rose-400" />
              <p className="max-w-sm text-sm text-rose-300">{error}</p>
              <p className="max-w-sm text-xs text-slate-500">
                Confira o token de gerenciamento e a rota REST em Conexão → REST de gerenciamento.
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-slate-500">
              Nenhum modelo encontrado para esse filtro.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-[12px]">
                <thead className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur">
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="px-4 py-2.5 font-semibold uppercase tracking-wide">Provedor</th>
                    <th className="px-4 py-2.5 font-semibold uppercase tracking-wide">Modelo</th>
                    <th className="px-4 py-2.5 font-semibold uppercase tracking-wide">Tipo</th>
                    <th className="px-4 py-2.5 font-semibold uppercase tracking-wide">Capacidades</th>
                    <th className="px-4 py-2.5 font-semibold uppercase tracking-wide">Contexto</th>
                    <th className="px-4 py-2.5 font-semibold uppercase tracking-wide">Saída</th>
                    <th className="px-4 py-2.5 font-semibold uppercase tracking-wide">Flags</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((model: CatalogModel) => {
                    const caps = capabilityLabels(model);
                    const extra = caps.slice(3);
                    const isSelected = config.model === model.id;
                    return (
                      <tr key={`${model.providerId}:${model.id}`} className="align-top transition hover:bg-white/[0.03]">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-200">{model.provider}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-600">{model.providerId}</p>
                        </td>
                        <td className="max-w-[220px] px-4 py-3">
                          <p className="break-words font-medium text-slate-200">{model.name}</p>
                          <p className="mt-0.5 break-all font-mono text-[10px] text-slate-500">{model.id}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {typeLabel(model.type)}
                          {model.subtype && (
                            <span className="mt-0.5 block text-[10px] text-slate-500">
                              {typeLabel(model.subtype)}
                            </span>
                          )}
                        </td>
                        <td className="max-w-[220px] px-4 py-3">
                          {caps.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {caps.slice(0, 3).map((c) => (
                                <span
                                  key={c}
                                  className="rounded border border-violet-400/20 bg-violet-500/[0.08] px-1.5 py-0.5 text-[10px] text-violet-200"
                                >
                                  {c}
                                </span>
                              ))}
                              {extra.length > 0 && (
                                <span
                                  title={extra.join(", ")}
                                  className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-400"
                                >
                                  +{extra.length}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-300">
                          {formatCount(model.contextLength)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-300">
                          {formatCount(model.maxOutputTokens)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {model.custom && (
                              <span className="rounded border border-sky-400/25 bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-300">
                                custom
                              </span>
                            )}
                            {model.free && (
                              <span className="rounded border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                                free
                              </span>
                            )}
                            {!model.custom && !model.free && <span className="text-slate-600">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onSelectModel(model.id)}
                            className={cn(
                              "flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-medium transition",
                              isSelected
                                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                                : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200",
                            )}
                          >
                            {isSelected ? <CheckCircle2 className="h-3 w-3" /> : null}
                            {isSelected ? "Selecionado" : "Usar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* rodapé / paginação */}
        <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3 text-[11.5px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p>
            Mostrando {filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)}{" "}
            de {filtered.length} modelo(s)
            {result?.catalogVersion ? (
              <span className="ml-2 font-mono text-[10px] text-slate-600">v{result.catalogVersion}</span>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <span>
              Página {safePage} de {pageCount}
            </span>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
