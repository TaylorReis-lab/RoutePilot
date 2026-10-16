import { useEffect, useRef } from "react";
import { MessageSquarePlus, PanelLeft, Sparkles } from "lucide-react";
import { ConversationList } from "./ConversationList";
import { MessageItem } from "./MessageItem";
import { Composer } from "./Composer";
import type { ChatMessage, ConnectionConfig, Session } from "../types";

const suggestions = [
  "Explique o que é um LLM em 3 frases simples.",
  "Escreva um script Python que lista arquivos de um diretório.",
  "Resuma a arquitetura de um app React com Vite.",
  "Me dê 5 ideias de projeto para usar com um modelo local.",
];

export function ChatView({
  config,
  sessions,
  activeId,
  messages,
  input,
  busy,
  connected,
  onInputChange,
  onSend,
  onStop,
  onRegenerate,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onOpenConversations,
}: {
  config: ConnectionConfig;
  sessions: Session[];
  activeId: string;
  messages: ChatMessage[];
  input: string;
  busy: boolean;
  connected: boolean;
  onInputChange: (value: string) => void;
  onSend: (text?: string) => void;
  onStop: () => void;
  onRegenerate: (messageId: string) => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenConversations: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, last?.content]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ConversationList
        sessions={sessions}
        activeSessionId={activeId}
        onSelect={onSelectSession}
        onNew={onNewChat}
        onDelete={onDeleteSession}
        className="hidden md:flex"
      />

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* barra mobile da lista de conversas */}
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={onOpenConversations}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          >
            <PanelLeft className="h-3.5 w-3.5" />
            {sessions.length} conversa(s)
          </button>
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" /> Nova
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-5 py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                Converse com o seu OminRoute
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                {connected && config.model
                  ? `Pronto para conversar com ${config.model}.`
                  : "Informe a URL e a porta do servidor na aba Conexão, escolha o modelo e comece."}
              </p>

              {config.model ? (
                <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSend(s)}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-[13px] leading-relaxed text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-slate-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
                  Nenhum modelo selecionado — abra a aba <strong>Conexão</strong> para configurar.
                </p>
              )}
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl py-2">
              {messages.map((m) => (
                <MessageItem
                  key={m.id}
                  message={m}
                  onRetry={m.role === "assistant" ? () => onRegenerate(m.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        <Composer
          value={input}
          onChange={onInputChange}
          onSend={() => onSend()}
          onStop={onStop}
          busy={busy}
          disabled={!config.model}
          hint={
            config.model
              ? "Enter envia · Shift+Enter quebra linha"
              : "Selecione um modelo na aba Conexão para começar"
          }
        />
      </section>
    </div>
  );
}
