import { useState } from "react";
import { AlertTriangle, Bot, ChevronDown, ChevronRight, User } from "lucide-react";
import type { ChatMessage } from "../types";
import { Markdown } from "./Markdown";
import { CopyButton } from "./CopyButton";
import { cn } from "../utils/cn";

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

export function MessageItem({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry?: () => void;
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  const isUser = message.role === "user";
  const isError = message.error;

  return (
    <div className={cn("group flex w-full gap-3 px-4 py-4 sm:px-6", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
          isUser
            ? "border-violet-400/30 bg-violet-500/15 text-violet-300"
            : isError
              ? "border-rose-400/30 bg-rose-500/15 text-rose-300"
              : "border-white/10 bg-white/5 text-cyan-300",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : isError ? <AlertTriangle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("min-w-0 max-w-[min(820px,88%)]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "rounded-tr-sm bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
              : isError
                ? "rounded-tl-sm border border-rose-500/30 bg-rose-500/10 text-rose-100"
                : "rounded-tl-sm border border-white/10 bg-white/[0.04] text-slate-200",
          )}
        >
          {message.reasoning && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setShowReasoning((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 transition hover:text-slate-200"
              >
                {showReasoning ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                raciocínio
              </button>
              {showReasoning && (
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 text-[12px] leading-relaxed text-slate-300">
                  {message.reasoning}
                </pre>
              )}
            </div>
          )}

          {isUser ? (
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</div>
          ) : message.content ? (
            <Markdown content={message.content} />
          ) : message.streaming ? (
            <div className="flex items-center gap-2 py-1 text-sm text-slate-400">
              <ThinkingDots /> gerando resposta…
            </div>
          ) : null}

          {message.streaming && message.content && (
            <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-violet-400 align-middle" />
          )}
        </div>

        <div
          className={cn(
            "mt-1 flex items-center gap-2 px-1 text-[11px] text-slate-500 opacity-0 transition group-hover:opacity-100",
            isUser && "flex-row-reverse",
          )}
        >
          <CopyButton text={message.content} />
          {message.model && <span className="truncate">{message.model}</span>}
          {message.usage?.totalTokens ? <span>{message.usage.totalTokens} tokens</span> : null}
          {onRetry && !isUser && !message.error && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md px-2 py-1 font-medium transition hover:bg-white/10 hover:text-slate-200"
            >
              Regenerar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
