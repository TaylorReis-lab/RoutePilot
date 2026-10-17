import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, MessageSquarePlus, PanelLeft, Sparkles } from "lucide-react";
import { ConversationList } from "./ConversationList";
import { MessageItem } from "./MessageItem";
import { Composer } from "./Composer";
import { SiteFooter, type FooterTab } from "./SiteFooter";
import type { ChatMessage, ConnectionConfig, ConnectionStatus, Session } from "../types";
import type { Attachment } from "../lib/attachments";
import { formatBytes, MAX_FILES, MAX_TEXT_BYTES } from "../lib/fileTypes";
import { cn } from "../utils/cn";

const suggestions = [
  {
    title: "Revisar um arquivo",
    body: "Analise o arquivo anexado e aponte bugs, riscos e melhorias de performance.",
    icon: "📎",
  },
  {
    title: "Explicar um erro",
    body: "Cole o stack trace abaixo e explique a causa raiz em português, com a correção.",
    icon: "⚠️",
  },
  {
    title: "Gerar teste",
    body: "Escreva testes unitários para a função anexada, cobrindo casos de borda.",
    icon: "🧪",
  },
  {
    title: "Resumir doc",
    body: "Resuma o documento anexado em 6 bullets e liste as decisões que ele implica.",
    icon: "📄",
  },
];

export function ChatView({
  config,
  sessions,
  activeId,
  messages,
  input,
  busy,
  connected,
  status,
  visionEnabled,
  onNavigate,
  onInputChange,
  onSend,
  onStop,
  onRegenerate,
  onRemember,
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
  status: ConnectionStatus;
  visionEnabled: boolean;
  onNavigate: (tab: FooterTab) => void;
  onInputChange: (value: string) => void;
  onSend: (text?: string, attachments?: Attachment[]) => void;
  onStop: () => void;
  onRegenerate: (messageId: string) => void;
  onRemember: (messageId: string) => Promise<void>;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenConversations: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const lastLenRef = useRef(0);
  const [showJump, setShowJump] = useState(false);
  const last = messages[messages.length - 1];

  // acompanha o final da conversa apenas se o usuário estiver perto da base
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    stickRef.current = nearBottom;
    setShowJump(!nearBottom);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // mensagem nova (usuário/assistente) sempre pinta para a base
    if (messages.length > lastLenRef.current) stickRef.current = true;
    lastLenRef.current = messages.length;
    // rolagem instantânea: evita a animação "suave" que fica empilhada
    // token a token e causa o tremido da tela em respostas longas
    if (stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, last?.content]);

  const jumpToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = true;
    setShowJump(false);
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

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

      <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
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

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        >
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-center px-5 py-8">
              <div className="reveal rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 font-medium text-violet-200">
                    <Sparkles className="h-3 w-3" /> console do OminRoute
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium",
                      connected
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 bg-white/[0.04] text-slate-400",
                    )}
                  >
                    {connected ? "endpoint respondendo" : "endpoint ainda não validado"}
                  </span>
                </div>

                <h3 className="mt-3.5 font-display text-[26px] font-semibold leading-[1.1] tracking-tight text-slate-50 sm:text-[32px]">
                  Mande uma mensagem,
                  <br />
                  <span className="text-violet-200">ou um arquivo.</span>
                </h3>
                <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-slate-400">
                  {connected && config.model
                    ? `Tudo vai direto para ${config.model} no seu servidor — nada passa por terceiros. Anexe código, logs ou dados e pergunte sobre eles.`
                    : "Informe a URL e a porta na aba Conexão, escolha o modelo e comece. Anexos de texto entram no corpo da mensagem para você revisar antes de enviar."}
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    { k: "Modelo", v: config.model || "não definido" },
                    { k: "Anexos", v: `${MAX_FILES} arquivos · ${formatBytes(MAX_TEXT_BYTES)} de texto` },
                    { k: "Imagens", v: visionEnabled ? "enviadas como image_url" : "desativadas" },
                  ].map((row) => (
                    <div key={row.k} className="rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2">
                      <p className="text-[9.5px] uppercase tracking-[0.16em] text-slate-500">{row.k}</p>
                      <p className="mt-0.5 truncate font-mono text-[11.5px] text-slate-200" title={row.v}>
                        {row.v}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {config.model ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => onSend(s.body)}
                      className={cn(
                        "reveal group/card rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition",
                        "hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-violet-500/[0.08] hover:shadow-lg hover:shadow-black/30",
                        `rise-${Math.min(i + 1, 4)}`,
                      )}
                    >
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-100">
                        <span aria-hidden>{s.icon}</span>
                        {s.title}
                        <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-slate-600 transition group-hover/card:translate-x-0.5 group-hover/card:text-violet-300" />
                      </span>
                      <span className="mt-1 block text-[12px] leading-relaxed text-slate-400">
                        {s.body}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate("conexao")}
                  className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-ember-400/30 bg-ember-400/10 px-4 py-3 text-left text-[12.5px] text-ember-200 transition hover:bg-ember-400/15"
                >
                  Nenhum modelo selecionado — abrir a aba Conexão
                  <ArrowUpRight className="h-4 w-4 shrink-0" />
                </button>
              )}
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl py-2">
              {messages.map((m) => (
                <MessageItem
                  key={m.id}
                  message={m}
                  onRetry={m.role === "assistant" ? () => onRegenerate(m.id) : undefined}
                  onRemember={m.role === "assistant" ? () => onRemember(m.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        <Composer
          value={input}
          onChange={onInputChange}
          onSend={(attachments) => onSend(undefined, attachments)}
          onStop={onStop}
          busy={busy}
          disabled={!config.model}
          visionEnabled={visionEnabled}
          hint={
            config.model
              ? "Enter envia · Shift+Enter quebra linha · arraste arquivos para anexar"
              : "Selecione um modelo na aba Conexão para começar"
          }
        />

        <SiteFooter variant="slim" config={config} status={status} onNavigate={onNavigate} />

        {/* botão: voltar para o fim da conversa */}
        {showJump && (
          <button
            type="button"
            onClick={jumpToBottom}
            title="Ir para o fim"
            className="absolute bottom-28 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-ink-900/90 text-slate-200 shadow-lg shadow-black/40 backdrop-blur transition hover:border-violet-400/40 hover:text-white sm:right-8"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </section>
    </div>
  );
}
