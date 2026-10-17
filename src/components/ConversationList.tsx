import { MessageSquarePlus, MessageSquare, Trash2 } from "lucide-react";
import type { Session } from "../types";
import { cn } from "../utils/cn";

export function ConversationList({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onDelete,
  showHeader = true,
  className,
}: {
  sessions: Session[];
  activeSessionId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col border-white/10 bg-ink-900 md:w-64 md:border-r",
        className,
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Conversas
          </span>
          <button
            type="button"
            onClick={onNew}
            title="Nova conversa"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-2">
        {sessions.length === 0 && (
          <p className="px-2 py-6 text-center text-[11px] leading-relaxed text-slate-600">
            Nenhuma conversa ainda.
            <br />
            Comece pelo botão <span className="text-slate-400">+</span>.
          </p>
        )}
        {sessions.map((session) => {
          const active = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              className={cn(
                "group flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 transition",
                active ? "bg-violet-500/15 text-violet-100" : "text-slate-300 hover:bg-white/5",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <button
                type="button"
                onClick={() => onSelect(session.id)}
                className="min-w-0 flex-1 truncate text-left text-[13px]"
                title={session.title}
              >
                {session.title}
              </button>
              <button
                type="button"
                onClick={() => onDelete(session.id)}
                title="Excluir conversa"
                className="shrink-0 text-slate-500 opacity-0 transition hover:text-rose-400 focus:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {sessions.length > 0 && (
        <div className="border-t border-white/10 p-2">
          <button
            type="button"
            onClick={() => sessions.forEach((s) => onDelete(s.id))}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-slate-400 transition hover:border-rose-500/40 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" /> Limpar histórico
          </button>
        </div>
      )}
    </aside>
  );
}
