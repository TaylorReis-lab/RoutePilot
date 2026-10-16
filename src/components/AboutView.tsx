import {
  BookOpen,
  Boxes,
  ExternalLink,
  Globe,
  Heart,
  Keyboard,
  KeyRound,
  Lock,
  ShieldCheck,
  Terminal,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { Card } from "./Field";
import { GithubIcon, LinkedinIcon } from "./SocialIcons";

const steps = [
  {
    icon: <Globe className="h-4 w-4" />,
    title: "1. Aponte para o seu servidor",
    text: "O OminRoute é um gateway local que centraliza várias IAs (OpenAI, Anthropic, Gemini, Llama e mais) em um único endpoint OpenAI-compatível, normalmente em localhost:20128/v1. No RoutePilot basta escolher o preset “OminRoute” na aba Conexão — ou informar a URL e a porta de qualquer outro servidor (Ollama, LM Studio, vLLM…).",
  },
  {
    icon: <Boxes className="h-4 w-4" />,
    title: "2. Escolha o modelo",
    text: "O RoutePilot consulta GET /models para listar todos os modelos que o seu OminRoute roteia — ou você pode digitar o identificador manualmente (ex.: \"auto\" deixa o OminRoute escolher o melhor modelo automaticamente).",
  },
  {
    icon: <Zap className="h-4 w-4" />,
    title: "3. Converse em streaming",
    text: "Cada mensagem vai para POST /chat/completions no formato OpenAI. A resposta chega token por token (SSE), com markdown e blocos de código com cópia rápida.",
  },
  {
    icon: <KeyRound className="h-4 w-4" />,
    title: "4. Chave criptografada no seu navegador",
    text: "Sua API Key é criptografada localmente via AES-GCM (Web Crypto API) antes de ir para o localStorage. Nada de texto puro gravado.",
  },
];

const team = [
  {
    name: "Taylor Reis",
    role: "Criador & Lead Developer",
    badge: "Autor",
    bio: "Idealizador e desenvolvedor do RoutePilot. Engenharia de software, front-end moderno e integrações com modelos de linguagem.",
    github: "https://github.com/TaylorReis-lab",
    linkedin: "https://www.linkedin.com/in/taylorreis-dev",
    avatar: "https://github.com/TaylorReis-lab.png",
    initials: "TR",
  },
];

const contributors = [
  {
    name: "Comunidade Open Source",
    role: "Testes, issues e feedbacks",
    badge: "Comunidade",
    bio: "Colaboradores que abrem pull requests, reportam bugs e testam com diferentes servidores locais (Ollama, LM Studio, vLLM, llama.cpp).",
    github: "https://github.com/TaylorReis-lab",
    initials: "OS",
  },
  {
    name: "Lucide & React Icons",
    role: "Design System & Ícones",
    badge: "Design",
    bio: "Conjunto de ícones vetoriais modernos que compõem a identidade visual limpa do RoutePilot.",
    initials: "IC",
  },
];

const faq = [
  {
    q: "A API Key fica segura?",
    a: "Sim. Ela é criptografada no próprio navegador usando a Web Crypto API (AES-GCM 256 bits com PBKDF2 e IV único). O texto puro nunca é salvo no localStorage.",
  },
  {
    q: "Deu erro de CORS. E agora?",
    a: "Se o seu servidor local não envia headers de CORS, rode `node proxy.mjs` incluído no projeto e ative “Usar proxy local (CORS)” nas configurações avançadas apontando para http://localhost:8787.",
  },
  {
    q: "Quais servidores funcionam?",
    a: "Qualquer API compatível com OpenAI: Ollama, LM Studio, llama.cpp, vLLM, LocalAI, text-generation-webui, OpenRouter e o seu próprio OminRoute.",
  },
  {
    q: "Como publicar no Netlify?",
    a: "O projeto já tem netlify.toml configurado na raiz. Conecte o repositório no Netlify e o deploy é automático em menos de 1 minuto.",
  },
];

const shortcuts = [
  { keys: ["Enter"], desc: "Enviar mensagem" },
  { keys: ["Shift", "+", "Enter"], desc: "Quebrar linha" },
  { keys: ["■"], desc: "Parar a geração (durante o streaming)" },
];

export function AboutView() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <header>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-200">
            <BookOpen className="h-3.5 w-3.5" /> Sobre o RoutePilot
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-50">
            RoutePilot — o console do seu OminRoute
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            O RoutePilot é um console web open-source criado por{" "}
            <strong className="text-slate-200">Taylor Reis</strong> para conversar com o{" "}
            <strong className="text-slate-200">OminRoute</strong> — o gateway que centraliza várias
            IAs em um único endpoint — e com qualquer outro servidor compatível com a API OpenAI
            (Ollama, LM Studio, vLLM, llama.cpp, OpenRouter…).
          </p>
        </header>

        {/* Card do Autor Taylor Reis */}
        <Card
          title="Desenvolvedor & Criador"
          icon={<Users className="h-4 w-4" />}
          description="Conecte-se com quem construiu o projeto."
        >
          {team.map((member) => (
            <div
              key={member.name}
              className="flex flex-col gap-4 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-white/[0.02] to-transparent p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-600 to-indigo-700 font-bold text-white shadow-lg shadow-violet-500/25">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="text-base">{member.initials}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold text-slate-100">{member.name}</h4>
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                      {member.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{member.role}</p>
                  <p className="mt-1 text-xs text-slate-500">{member.bio}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-violet-400/40 hover:bg-violet-500/15 hover:text-white"
                >
                  <GithubIcon className="h-4 w-4" />
                  <span>GitHub</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-200 transition hover:bg-blue-500/20 hover:text-white"
                >
                  <LinkedinIcon className="h-4 w-4" />
                  <span>LinkedIn</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Contribuidores & Apoio
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {contributors.map((c) => (
                <div
                  key={c.name}
                  className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-slate-300">
                    {c.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-medium text-slate-200">{c.name}</p>
                      <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] text-slate-400">
                        {c.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{c.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Segurança da Chave */}
        <Card
          title="Segurança da API Key"
          icon={<Lock className="h-4 w-4" />}
          description="Sua credencial protegida com criptografia nativa do navegador."
        >
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-emerald-100">Criptografia AES-GCM ativada</p>
              <p className="mt-0.5 text-emerald-200/80">
                Ao preencher sua chave na aba Conexão, ela é criptografada com algoritmo AES-GCM 256
                bits (Web Crypto API) antes de ser gravada no localStorage. Ela só é descriptografada
                na memória para autenticar com o seu servidor no momento da requisição.
              </p>
            </div>
          </div>
        </Card>

        <Card
          title="Como funciona"
          icon={<Wifi className="h-4 w-4" />}
          description="Do clique até o token na tela, em quatro passos."
        >
          <ol className="space-y-4">
            {steps.map((step) => (
              <li key={step.title} className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-violet-300">
                  {step.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-slate-100">{step.title}</h4>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-slate-400">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card
          title="Anatomia da requisição HTTP"
          icon={<Terminal className="h-4 w-4" />}
          description="Payload compatível com o ecossistema OpenAI / OpenRouter."
        >
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1020]">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                HTTP Request
              </span>
              <span className="text-[11px] font-mono text-slate-500">POST /v1/chat/completions</span>
            </div>
            <pre className="overflow-x-auto px-4 py-3 text-[12px] leading-relaxed text-slate-300">
              {`POST http://localhost:20128/v1/chat/completions
Authorization: Bearer <chave-descriptografada>
Content-Type: application/json

{
  "model": "auto",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "sua pergunta" }
  ],
  "stream": true
}`}
            </pre>
          </div>
        </Card>

        <Card
          title="Atalhos e recursos"
          icon={<Keyboard className="h-4 w-4" />}
          description="Produtividade para quem testa modelos locais."
        >
          <ul className="divide-y divide-white/5">
            {shortcuts.map((s) => (
              <li key={s.desc} className="flex items-center justify-between gap-3 py-2">
                <span className="text-[13px] text-slate-300">{s.desc}</span>
                <span className="flex shrink-0 gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 pt-2 text-[13px] text-slate-400 sm:grid-cols-2">
            {[
              "Streaming SSE em tempo real",
              "Chave com criptografia AES-GCM",
              "Markdown completo e tabelas",
              "Regeneração de respostas",
              "Histórico de conversas local",
              "Pronto para deploy no Netlify",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Perguntas frequentes" icon={<BookOpen className="h-4 w-4" />}>
          <div className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}>
                <h4 className="text-sm font-medium text-slate-100">{item.q}</h4>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </Card>

        <footer className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
            <span>
              Desenvolvido com carinho por <strong className="text-slate-200">Taylor Reis</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/TaylorReis-lab"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub de Taylor Reis"
              className="text-slate-400 transition hover:text-white"
            >
              <GithubIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/taylorreis-dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn de Taylor Reis"
              className="text-slate-400 transition hover:text-blue-400"
            >
              <LinkedinIcon className="h-4 w-4" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
