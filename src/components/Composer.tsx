import { useEffect, useRef, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  disabled,
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && value.trim()) onSend();
    }
  };

  return (
    <div className="border-t border-white/10 bg-[#0a0e1a]/80 px-4 pb-4 pt-3 backdrop-blur sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 transition focus-within:border-violet-400/50 focus-within:ring-2 focus-within:ring-violet-500/20">
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={disabled ? "Configure a conexão para começar…" : "Envie uma mensagem para o seu modelo…"}
            disabled={disabled}
            className="max-h-[220px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed"
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
              onClick={onSend}
              disabled={disabled || !value.trim()}
              title="Enviar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-600">
          {hint ?? "Enter envia · Shift+Enter quebra linha"}
        </p>
      </div>
    </div>
  );
}
