import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { ArrowUp, ChevronDown, FileCode2, Image, Loader2, Paperclip, Square, X } from "lucide-react";
import {
  ACCEPT_ATTR,
  FILE_GROUPS,
  MAX_FILES,
  MAX_IMAGE_BYTES,
  MAX_TEXT_BYTES,
  formatBytes,
} from "../lib/fileTypes";
import { readFiles, type Attachment } from "../lib/attachments";
import { cn } from "../utils/cn";

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  disabled,
  hint,
  visionEnabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachments: Attachment[]) => void;
  onStop: () => void;
  busy: boolean;
  disabled?: boolean;
  hint?: string;
  visionEnabled: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showTypes, setShowTypes] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  const images = attachments.filter((a) => a.kind === "image");
  const texts = attachments.filter((a) => a.kind === "text");
  const problems = attachments.filter((a) => a.kind === "skipped");

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && (value.trim() || images.length)) onSend(attachments);
    }
  };

  const ingest = async (list: FileList | File[] | null) => {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    setReading(true);
    const { snippet, attachments: added } = await readFiles(files);
    if (snippet) {
      const prefix = value ? (value.endsWith("\n") ? "\n\n" : "\n\n") : "";
      onChange(`${value}${prefix}${snippet}`.replace(/^\n+/, ""));
      requestAnimationFrame(() => ref.current?.focus());
    }
    setAttachments((prev) => [...prev, ...added].slice(0, MAX_FILES + 4));
    setReading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    void ingest(e.dataTransfer?.files ?? null);
  };

  const send = () => {
    onSend(attachments);
    setAttachments([]);
  };

  const canSend = !disabled && !busy && (Boolean(value.trim()) || images.length > 0);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "border-t bg-ink-900/85 px-4 pb-3 pt-3 backdrop-blur transition-colors sm:px-6",
        dragging ? "border-violet-400/70 bg-violet-500/[0.06]" : "border-white/10",
      )}
    >
      <div className="mx-auto max-w-4xl">
        {/* anexos */}
        {(images.length > 0 || texts.length > 0 || problems.length > 0) && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {images.map((a) => (
              <span
                key={a.id}
                className="group/img flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/10 py-1 pl-1 pr-2 text-[11px] text-violet-100"
              >
                {a.dataUrl ? (
                  <img
                    src={a.dataUrl}
                    alt={a.name}
                    className="h-7 w-7 rounded-md border border-white/10 object-cover"
                  />
                ) : (
                  <Image className="h-3.5 w-3.5" />
                )}
                <span className="max-w-[160px] truncate">{a.name}</span>
                <span className="text-violet-300/70">{formatBytes(a.size)}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                  className="text-violet-200/60 transition hover:text-white"
                  aria-label={`Remover ${a.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {texts.map((a) => (
              <span
                key={a.id}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-300"
                title="Conteúdo já inserido no corpo da mensagem"
              >
                <FileCode2 className="h-3 w-3 text-violet-300" />
                <span className="max-w-[150px] truncate">{a.name}</span>
                <span className="text-slate-500">no corpo</span>
              </span>
            ))}
            {problems.map((a) => (
              <span
                key={a.id}
                title={a.note}
                className="flex items-center gap-1.5 rounded-lg border border-ember-400/30 bg-ember-400/10 px-2 py-1 text-[11px] text-ember-300"
              >
                <span className="max-w-[190px] truncate">{a.name}</span>
                <span className="opacity-80">{a.note}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                  aria-label={`Remover ${a.name}`}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {images.length > 0 && !visionEnabled && (
              <span className="rounded-lg border border-ember-400/30 bg-ember-400/10 px-2 py-1 text-[11px] text-ember-300">
                Envio de imagens está desativado — ative em Conexão → Avançado
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border bg-white/[0.03] p-2 transition focus-within:ring-2",
            dragging
              ? "border-violet-400/70 ring-2 ring-violet-400/20"
              : "border-white/10 focus-within:border-violet-400/50 focus-within:ring-violet-500/20",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            className="hidden"
            onChange={(e) => void ingest(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || reading}
            title={`Anexar arquivo (até ${MAX_FILES}, texto até ${formatBytes(MAX_TEXT_BYTES)}, imagem até ${formatBytes(MAX_IMAGE_BYTES)})`}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition",
              "hover:-translate-y-px hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0",
            )}
          >
            {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </button>

          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              disabled
                ? "Configure a conexão para começar…"
                : "Escreva para o modelo, ou arraste um arquivo para cá…"
            }
            disabled={disabled}
            className="max-h-[220px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed"
          />

          {busy ? (
            <button
              type="button"
              onClick={onStop}
              title="Parar geração"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/15 text-rose-300 transition hover:bg-rose-500/25"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              title="Enviar"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* tipos aceitos */}
        <div className="mt-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="text-[11px] text-slate-500">{hint ?? "Enter envia · Shift+Enter quebra linha"}</p>
            <button
              type="button"
              onClick={() => setShowTypes((v) => !v)}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-400 transition hover:bg-white/5 hover:text-violet-200"
              aria-expanded={showTypes}
            >
              <FileCode2 className="h-3 w-3" />
              Tipos aceitos
              <ChevronDown className={cn("h-3 w-3 transition-transform", showTypes && "rotate-180")} />
            </button>
          </div>

          {showTypes && (
            <div className="reveal mt-2 grid gap-2 rounded-xl border border-white/10 bg-black/25 p-3 sm:grid-cols-2">
              {FILE_GROUPS.map((group) => (
                <div key={group.kind} className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                    {group.label}
                    <span className="ml-1.5 font-normal normal-case tracking-normal text-slate-500">
                      {group.note}
                    </span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {group.exts.slice(0, group.exts.length > 12 ? 12 : group.exts.length).map((ext) => (
                      <span
                        key={ext}
                        className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                      >
                        .{ext}
                      </span>
                    ))}
                    {group.exts.length > 12 && (
                      <span className="px-1 py-0.5 text-[10px] text-slate-500">
                        +{group.exts.length - 12}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-[11px] leading-relaxed text-slate-500 sm:col-span-2">
                Máximo de <strong className="text-slate-300">{MAX_FILES} arquivos</strong> por mensagem ·
                texto até <strong className="text-slate-300">{formatBytes(MAX_TEXT_BYTES)}</strong> (vai
                colado no corpo, você revisa antes de enviar) · imagens até{" "}
                <strong className="text-slate-300">{formatBytes(MAX_IMAGE_BYTES)}</strong> e enviadas
                como <code className="text-violet-200">image_url</code> apenas para modelos de visão.
                PDF, Word e planilhas binárias não são lidos — exporte como .txt, .md ou .csv.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
