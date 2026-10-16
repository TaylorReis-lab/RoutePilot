import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Info, MessageSquare, Plug, Server, X } from "lucide-react";
import { ChatView } from "./components/ChatView";
import { ConnectionView } from "./components/ConnectionView";
import { AboutView } from "./components/AboutView";
import { ConversationList } from "./components/ConversationList";
import { completeChat, fetchModels, streamChat } from "./lib/api";
import {
  loadConfigAsync,
  loadConfigSync,
  loadSessions,
  saveConfigSecure,
  saveSessions,
  uid,
} from "./lib/storage";
import type { ChatMessage, ConnectionConfig, ConnectionStatus, Session } from "./types";
import { cn } from "./utils/cn";

type Tab = "chat" | "conexao" | "sobre";

const TABS: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "conexao", label: "Conexão", icon: Plug },
  { id: "sobre", label: "Sobre", icon: Info },
];

function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M5.5 18.5C7.5 18.5 7 10 11 10C14.6 10 14 6.5 17 6.5"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="5.5" cy="18.5" r="1.5" fill="white" />
        <circle cx="11" cy="10" r="1.5" fill="white" />
        <circle cx="17" cy="6.5" r="1.5" fill="white" />
      </svg>
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState<ConnectionConfig>(() => loadConfigSync());
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [activeId, setActiveId] = useState<string>(() => sessions[0]?.id ?? uid());
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionsRef = useRef<Session[]>(sessions);

  // Carrega assincronamente a configuração com API Key descriptografada na inicialização
  useEffect(() => {
    let mounted = true;
    loadConfigAsync().then((loaded) => {
      if (mounted) {
        setConfig(loaded);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------------------- persistência ---------------------------- */
  useEffect(() => {
    void saveConfigSecure(config);
  }, [config]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId],
  );
  const messages = activeSession?.messages ?? [];
  const connected = status === "connected";

  /* ------------------------------- conexão ------------------------------- */
  const testConnection = useCallback(
    async (silent = false) => {
      setStatus("connecting");
      setStatusMessage("");
      try {
        const list = await fetchModels(config);
        setModels(list.map((m) => m.id));
        setStatus("connected");
        setStatusMessage(list.length ? `${list.length} modelo(s)` : "sem modelos");
        if (list.length && !config.model) setConfig((c) => ({ ...c, model: list[0].id }));
        return true;
      } catch (err) {
        const message = (err as Error).message ?? "Erro desconhecido";
        setStatus("error");
        setStatusMessage(message.slice(0, 90));
        if (!silent) console.error("[RoutePilot] falha ao conectar:", err);
        return false;
      }
    },
    [config],
  );

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      const t = window.setTimeout(() => void testConnection(true), 400);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => void testConnection(true), 900);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.host, config.port, config.basePath, config.apiKey, config.useProxy, config.proxyUrl]);

  /* ------------------------------ requisição ----------------------------- */
  const updateMessage = useCallback(
    (sessionId: string, messageId: string, updater: (m: ChatMessage) => ChatMessage) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                updatedAt: Date.now(),
                messages: s.messages.map((m) => (m.id === messageId ? updater(m) : m)),
              }
            : s,
        ),
      );
    },
    [],
  );

  const performRequest = useCallback(
    async (sessionId: string, history: ChatMessage[], assistantId: string) => {
      const payload: ChatMessage[] = config.systemPrompt.trim()
        ? [
            {
              id: "system",
              role: "system",
              content: config.systemPrompt,
              createdAt: Date.now(),
            },
            ...history,
          ]
        : history;

      const controller = new AbortController();
      abortRef.current = controller;
      setBusy(true);

      try {
        if (config.stream) {
          const result = await streamChat(
            config,
            payload,
            {
              onDelta: ({ content, reasoning }) => {
                updateMessage(sessionId, assistantId, (m) => ({
                  ...m,
                  content: content ?? m.content,
                  reasoning: reasoning ?? m.reasoning,
                }));
              },
            },
            controller.signal,
          );
          updateMessage(sessionId, assistantId, (m) => ({
            ...m,
            content: result.content || m.content,
            reasoning: result.reasoning || m.reasoning,
            usage: result.usage,
            model: result.model || m.model,
            streaming: false,
          }));
        } else {
          const result = await completeChat(config, payload, controller.signal);
          updateMessage(sessionId, assistantId, (m) => ({
            ...m,
            content: result.content,
            reasoning: result.reasoning,
            usage: result.usage,
            model: result.model || m.model,
            streaming: false,
          }));
        }
        setStatus("connected");
        setStatusMessage("ok");
      } catch (err) {
        const aborted = (err as Error)?.name === "AbortError";
        if (aborted) {
          updateMessage(sessionId, assistantId, (m) => ({ ...m, streaming: false }));
        } else {
          const message = (err as Error)?.message ?? "Erro inesperado";
          updateMessage(sessionId, assistantId, (m) => ({
            ...m,
            content: message,
            error: true,
            streaming: false,
          }));
          setStatus("error");
          setStatusMessage(message.slice(0, 90));
        }
      } finally {
        abortRef.current = null;
        setBusy(false);
      }
    },
    [config, updateMessage],
  );

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || busy) return;

      if (!config.model) {
        setStatus("error");
        setStatusMessage("informe o modelo na aba Conexão");
        setTab("conexao");
        return;
      }

      const sessionId = activeId;
      const userMessage: ChatMessage = {
        id: uid(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };
      const assistantId = uid();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        streaming: true,
        model: config.model,
      };

      const prior = sessionsRef.current.find((s) => s.id === sessionId)?.messages ?? [];
      const title = text.slice(0, 42) + (text.length > 42 ? "…" : "");

      setSessions((prev) => {
        const exists = prev.find((s) => s.id === sessionId);
        if (!exists) {
          const now = Date.now();
          return [
            {
              id: sessionId,
              title,
              createdAt: now,
              updatedAt: now,
              messages: [userMessage, assistantMessage],
            },
            ...prev,
          ];
        }
        return prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                title: s.messages.length === 0 ? title : s.title,
                updatedAt: Date.now(),
                messages: [...s.messages, userMessage, assistantMessage],
              }
            : s,
        );
      });

      setDrawerOpen(false);
      await performRequest(sessionId, [...prior, userMessage], assistantId);
    },
    [activeId, busy, config.model, input, performRequest],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const regenerate = useCallback(
    (messageId: string) => {
      const session = sessionsRef.current.find((s) => s.id === activeId);
      if (!session) return;
      const index = session.messages.findIndex((m) => m.id === messageId);
      if (index < 1) return;
      const history = session.messages.slice(0, index);
      const assistantId = uid();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        streaming: true,
        model: config.model,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? { ...s, messages: [...history, assistantMessage], updatedAt: Date.now() }
            : s,
        ),
      );
      void performRequest(activeId, history, assistantId);
    },
    [activeId, config.model, performRequest],
  );

  /* ------------------------------- sessões ------------------------------- */
  const newChat = useCallback(() => {
    const id = uid();
    const now = Date.now();
    setSessions((prev) => [
      { id, title: "Nova conversa", createdAt: now, updatedAt: now, messages: [] },
      ...prev,
    ]);
    setActiveId(id);
    setInput("");
    setTab("chat");
    setDrawerOpen(false);
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== id);
        if (id === activeId) setActiveId(remaining[0]?.id ?? uid());
        return remaining;
      });
    },
    [activeId],
  );

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#070a14] text-slate-200">
      {/* ------------------------------- header ------------------------------ */}
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 bg-[#0a0e1a]/80 px-3 py-2.5 backdrop-blur sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold leading-tight text-slate-50">
              RoutePilot
            </h1>
            <p className="truncate text-[10px] leading-tight text-slate-500">
              OminRoute Console · by Taylor Reis
            </p>
          </div>
        </div>

        {/* abas */}
        <nav
          className="order-3 flex w-full min-w-0 gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-1 sm:order-2 sm:w-auto"
          aria-label="Navegação principal"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition sm:flex-none",
                tab === id
                  ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </nav>

        <div className="order-2 ml-auto flex min-w-0 items-center gap-2 sm:order-3">
          <div
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              connected
                ? "bg-emerald-500/10 text-emerald-300"
                : status === "error"
                  ? "bg-rose-500/10 text-rose-300"
                  : "bg-white/5 text-slate-400",
            )}
            title={statusMessage || status}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                connected ? "bg-emerald-400" : status === "error" ? "bg-rose-400" : "bg-slate-500",
              )}
            />
            <span className="hidden truncate sm:inline">
              {connected ? "conectado" : status === "error" ? "sem conexão" : "desconectado"}
            </span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 md:flex">
            <Server className="h-3 w-3" />
            <span className="max-w-[180px] truncate">
              {config.model || "sem modelo"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTab("sobre")}
            title="Sobre o projeto"
            className="rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ------------------------------ conteúdo ----------------------------- */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === "chat" && (
          <ChatView
            config={config}
            sessions={sessions}
            activeId={activeId}
            messages={messages}
            input={input}
            busy={busy}
            connected={connected}
            onInputChange={setInput}
            onSend={(text) => void send(text)}
            onStop={stop}
            onRegenerate={regenerate}
            onNewChat={newChat}
            onSelectSession={(id) => {
              setActiveId(id);
              setDrawerOpen(false);
            }}
            onDeleteSession={deleteSession}
            onOpenConversations={() => setDrawerOpen(true)}
          />
        )}

        {tab === "conexao" && (
          <ConnectionView
            config={config}
            onConfigChange={setConfig}
            status={status}
            statusMessage={statusMessage}
            models={models}
            onTestConnection={() => void testConnection(false)}
          />
        )}

        {tab === "sobre" && <AboutView />}
      </div>

      {/* --------------------- drawer mobile: conversas ---------------------- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[80%] max-w-[300px] flex-col border-r border-white/10 bg-[#0a0e1a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Conversas
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ConversationList
              sessions={sessions}
              activeSessionId={activeId}
              onSelect={(id) => {
                setActiveId(id);
                setDrawerOpen(false);
              }}
              onNew={newChat}
              onDelete={deleteSession}
              showHeader={false}
              className="border-r-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
