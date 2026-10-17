import { ArrowUp, CircleDot, Lock, Radio } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "./SocialIcons";
import type { ConnectionConfig, ConnectionStatus } from "../types";
import { buildBaseUrl, buildManagementBaseUrl } from "../lib/api";
import { detectProfile, MEMORY_SUPPORT_LABEL } from "../lib/serverProfiles";
import { ACCEPT_SUMMARY } from "../lib/fileTypes";
import { cn } from "../utils/cn";

export type FooterTab = "chat" | "conexao" | "memoria" | "sobre";

const VERSION = "1.4.0";

function scrollToTop() {
  const el = document.getElementById("routepilot-scroll");
  (el ?? document.documentElement).scrollTo?.({ top: 0, behavior: "smooth" });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function SiteFooter({
  variant = "full",
  config,
  status,
  onNavigate,
}: {
  variant?: "full" | "slim";
  config: ConnectionConfig;
  status: ConnectionStatus;
  onNavigate: (tab: FooterTab) => void;
}) {
  const profile = detectProfile(config);
  const inference = (() => {
    try {
      return buildBaseUrl(config);
    } catch {
      return "—";
    }
  })();
  const management = (() => {
    try {
      return buildManagementBaseUrl(config);
    } catch {
      return "—";
    }
  })();
  const live =
    status === "connected"
      ? { label: "Conectado", tone: "text-emerald-300", dot: "bg-emerald-400" }
      : status === "connecting"
        ? { label: "Verificando", tone: "text-ember-300", dot: "bg-ember-400" }
        : status === "error"
          ? { label: "Sem conexão", tone: "text-rose-300", dot: "bg-rose-400" }
          : { label: "Ocioso", tone: "text-slate-400", dot: "bg-slate-500" };

  if (variant === "slim") {
    return (
      <footer className="hairline-top flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/10 bg-ink-900/90 px-4 py-2 text-[10.5px] text-slate-500 backdrop-blur sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className={cn("flex items-center gap-1.5", live.tone)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", live.dot, status === "connected" && "live-dot")} />
            {live.label}
          </span>
          <span className="hidden truncate sm:inline">
            {profile.name} · <code className="text-slate-400">{inference}</code>
          </span>
          <span className="hidden truncate lg:inline">
            {MEMORY_SUPPORT_LABEL[profile.memory]} · anexos: {ACCEPT_SUMMARY}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1 md:flex">
            <Lock className="h-3 w-3 text-emerald-400/80" />
            chaves AES-GCM
          </span>
          <span className="font-mono">v{VERSION}</span>
          <span className="hidden sm:inline">© {new Date().getFullYear()} Taylor Reis</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="hairline-top border-t border-white/10 bg-ink-900/70 px-4 pb-8 pt-7 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* marca */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M5.5 18.5C7.5 18.5 7 10 11 10C14.6 10 14 6.5 17 6.5"
                    stroke="white"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                  <circle cx="5.5" cy="18.5" r="1.5" fill="white" />
                  <circle cx="11" cy="10" r="1.5" fill="white" />
                  <circle cx="17" cy="6.5" r="1.5" fill="white" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-display text-[15px] font-semibold leading-tight text-slate-50">
                  RoutePilot
                </p>
                <p className="text-[11px] leading-tight text-slate-500">
                  Console do OminRoute · v{VERSION}
                </p>
              </div>
            </div>
            <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-slate-400">
              Cliente estático que fala direto com o seu gateway: sem backend, sem telemetria e sem
              cópias das suas conversas fora do navegador.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px]",
                  live.tone,
                )}
              >
                <CircleDot className="h-3 w-3" />
                {live.label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-400">
                <Radio className="h-3 w-3" />
                {profile.name}
              </span>
            </div>
          </div>

          {/* navegação */}
          <nav aria-label="Seções">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Seções</p>
            <ul className="mt-2.5 space-y-1.5 text-[13px]">
              {(
                [
                  { id: "chat", label: "Chat e anexos" },
                  { id: "conexao", label: "Conexão e chaves" },
                  { id: "memoria", label: "Memória e aprendizado" },
                  { id: "sobre", label: "Sobre, servidores e FAQ" },
                ] as { id: FooterTab; label: string }[]
              ).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className="group/link flex items-center gap-1.5 text-slate-400 transition hover:text-violet-200"
                  >
                    <span className="h-px w-0 bg-violet-300 transition-all duration-300 group-hover/link:w-3" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* endpoints ativos */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Alvos configurados
            </p>
            <dl className="mt-2.5 space-y-2 text-[12px]">
              <div>
                <dt className="text-slate-500">Inferência</dt>
                <dd className="break-all font-mono text-[11px] text-violet-200">{inference}</dd>
              </div>
              <div>
                <dt className="text-slate-500">REST de gerenciamento</dt>
                <dd className="break-all font-mono text-[11px] text-cyan-200/90">{management}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Memória</dt>
                <dd className="text-slate-300">{MEMORY_SUPPORT_LABEL[profile.memory]}</dd>
              </div>
            </dl>
          </div>

          {/* projeto */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Projeto</p>
            <ul className="mt-2.5 space-y-1.5 text-[13px]">
              <li>
                <a
                  href="https://github.com/TaylorReis-lab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-slate-100"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  TaylorReis-lab
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/taylorreis-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-slate-100"
                >
                  <LinkedinIcon className="h-3.5 w-3.5" />
                  taylorreis-dev
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-slate-100"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  Voltar ao topo
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.07] pt-4 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} <span className="text-slate-400">Taylor Reis</span> · licença
            MIT · projeto open source, sem fins comerciais
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-400/80" />
              chaves e histórico apenas neste navegador
            </span>
            <span className="font-mono text-slate-600">build {VERSION}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
