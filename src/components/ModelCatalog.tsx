import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import type { CatalogModel } from "../lib/catalogApi";
import { capabilityList, formatTokens, typeLabel } from "../lib/catalogApi";
import { cn } from "../utils/cn";

const PAGE_SIZE = 8;

function typeTone(type: string): string {
  switch (type) {
    case "chat":
      return "border-violet-400/30 bg-violet-500/10 text-violet-200";
    case "audio":
      return "border-sky-400/30 bg-sky-500/10 text-sky-200";
    case "image":
      return "border-rose-400/30 bg-rose-500/10 text-rose-200";
    case "embedding":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
    case "rerank":
      return "border-amber-400/30 bg-amber-500/10 text-amber-200";
    case "moderation":
      return "border-orange-400/30 bg-orange-500/10 text-orange-200";
    case "video":
      return "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200";
    case "music":
      return "border-pink-400/30 bg-pink-500/10 text-pink-200";
    default:
      return "border-white/15 bg-white/[0.04] text-slate-300";
  }
}

function matchesSearch(model: CatalogModel, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    model.id,
    model.name ?? "",
    model.provider,
    model.providerName,
    typeLabel(model.type, model.subtype),
    ...capabilityList(model),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function ModelCatalog({
  models,
  selectedId,
  onSelect,
  loading,
  error,
  onRefresh,
  version,
}: {
  models: CatalogModel[];
  selectedId?: string;
  onSelect: (id: string) => void;
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  version?: string;
}) {
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const providers = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of models) map.set(m.provider, m.providerName);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [models]);

  const types = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of models) {
      map.set(m.type, typeLabel(m.type));
    }
    const order = ["chat", "audio", "image", "embedding", "rerank", "moderation", "video", "music"];
    return order
      .filter((t) => map.has(t))
      .map((t) => [t, map.get(t)!] as const);
  }, [models]);

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (provider !== "all" && m.provider !== provider) return false;
      if (type !== "all" && m.type !== type) return false;
      if (!matchesSearch(m, search)) return false;
      return true;
    });
  }, [models, provider, type, search]);

  // reset pagina quando os filtros mudam
  useEffect(() => {
    setPage(1);
  }, [provider, type, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(filtered.length, safePage * PAGE_SIZE);

  return (
    <div className="rounded-xl border border-white/10 bg-black/25">
      {/* toolbar */}
      <div className="flex flex-col gap-2 border-b border-white/10 p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar modelo, provedor ou capacidade"
              className={cn(
                "w-full rounded-lg border border-white/10 bg-ink-900/60 py-1.5 pl-8 pr-2 text-xs text-slate-100",
                "outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20",
              )}
            />
          </div>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded-lg border border-white/10 bg-ink-900/60 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-400/60"
            aria-label="Filtrar por provedor"
          >
            <option value="all">Todos os provedores</option>
            {providers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-white/10 bg-ink-900/60 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-400/60"
            aria-label="Filtrar por tipo"
          >
            <option value="all">Todos os tipos</option>
            {types.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Atualizar
          </button>
        </div>
      </div>

      {/* body */}
      {loading && models.length === 0 ? (
        <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando catálogo…
        </div>
      ) : error && models.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <p className="max-w-md text-xs leading-relaxed text-slate-400">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
          >
            Tentar novamente
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="px-4 py-10 text-center text-xs text-slate-500">
          Nenhum modelo corresponde aos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-semibold">Provedor</th>
                <th className="px-3 py-2 font-semibold">Modelo</th>
                <th className="px-3 py-2 font-semibold">Tipo</th>
                <th className="px-3 py-2 font-semibold">Capacidades</th>
                <th className="px-3 py-2 font-semibold">Contexto</th>
                <th className="px-3 py-2 font-semibold">Saída</th>
                <th className="px-3 py-2 font-semibold">Flags</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((m) => {
                const selected = selectedId === m.id;
                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelect(m.id)}
                    className={cn(
                      "cursor-pointer border-t border-white/5 transition hover:bg-violet-500/[0.06]",
                      selected && "bg-violet-500/[0.10]",
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {selected && <Check className="h-3.5 w-3.5 shrink-0 text-violet-300" />}
                        <span className={cn("max-w-[110px] truncate", selected ? "text-violet-200" : "text-slate-300")}>
                          {m.providerName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="max-w-[220px] truncate font-mono text-[11px] text-slate-200" title={m.id}>
                        {m.id}
                      </p>
                      {m.name && (
                        <p className="max-w-[220px] truncate text-[10px] text-slate-500">{m.name}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px]",
                          typeTone(m.type),
                        )}
                      >
                        {typeLabel(m.type, m.subtype)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex max-w-[180px] flex-wrap gap-1">
                        {capabilityList(m).map((cap) => (
                          <span
                            key={cap}
                            className="whitespace-nowrap rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9.5px] text-slate-400"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">
                      {formatTokens(m.contextLength)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">
                      {formatTokens(m.maxOutputTokens)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {m.free && (
                          <span className="rounded border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] text-emerald-300">
                            Gratuito
                          </span>
                        )}
                        {m.custom && (
                          <span className="rounded border border-violet-400/30 bg-violet-500/10 px-1.5 py-0.5 text-[9.5px] text-violet-300">
                            Custom
                          </span>
                        )}
                        {!m.free && !m.custom && <span className="text-slate-600">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* footer: paginação */}
      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[11px] text-slate-500">
        <span>
          Mostrando {rangeStart}–{rangeEnd} de {filtered.length} modelos
        </span>
        <div className="flex items-center gap-2">
          <span>
            Página {safePage} de {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
          >
            <ChevronLeft className="h-3 w-3" /> Anterior
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
          >
            Próximo <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {version && (
        <p className="border-t border-white/5 px-3 py-1.5 text-[10px] text-slate-600">
          <Sparkles className="mr-1 inline h-3 w-3" />
          Catálogo v{version} · clique em uma linha para selecionar o modelo
        </p>
      )}
    </div>
  );
}
