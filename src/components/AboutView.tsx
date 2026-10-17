import type { ReactNode } from "react";
import {
  BookOpen,
  Brain,
  Boxes,
  ChevronRight,
  Database,
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
import { Markdown } from "./Markdown";
import { FILE_GROUPS, MAX_FILES, MAX_IMAGE_BYTES, MAX_TEXT_BYTES, formatBytes } from "../lib/fileTypes";
import {
  MEMORY_SUPPORT_LABEL,
  SERVER_PROFILES,
  VISION_SUPPORT_LABEL,
} from "../lib/serverProfiles";
import { GithubIcon, LinkedinIcon } from "./SocialIcons";
import { cn } from "../utils/cn";

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
    icon: <Boxes className="h-4 w-4" />,
    title: "4. Anexe arquivos",
    text: "O clipe do Composer aceita até 5 arquivos. Código, dados, logs e texto entram no corpo da mensagem como bloco cercado (você revisa antes de enviar); PNG/JPG/WebP viram blocos image_url e só saem se o modelo for de visão.",
  },
  {
    icon: <KeyRound className="h-4 w-4" />,
    title: "5. Chaves protegidas no seu navegador",
    text: "A API Key de inferência e o token de gerenciamento são cifrados localmente com AES-GCM de 256 bits (Web Crypto API + PBKDF2, salt e IV aleatórios) antes de irem para o localStorage.",
  },
  {
    icon: <Brain className="h-4 w-4" />,
    title: "6. Memória onde ela existe",
    text: "Somente o OminRoute tem API de memória persistente (FTS5 + embeddings + Qdrant, com extração automática de fatos). Em Ollama, LM Studio, llama.cpp, vLLM e OpenRouter não há memória no servidor — o RoutePilot detecta, avisa e usa o histórico local mais o system prompt.",
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
    a: "A chave de inferência e o token de gerenciamento são criptografados no próprio navegador usando a Web Crypto API (AES-GCM 256 bits com PBKDF2 e IV único) antes de serem salvos no localStorage.",
  },
  {
    q: "Deu erro de CORS. E agora?",
    a: "Se o seu servidor local não envia headers de CORS, rode `node proxy.mjs` (incluído no projeto) e ative “Usar proxy local (CORS)” em Conexão → Avançado apontando para http://localhost:8787. O proxy já libera os headers usados aqui, inclusive Authorization, HTTP-Referer, X-Title e X-Session-Id.",
  },
  {
    q: "Quais servidores funcionam?",
    a: "Qualquer API compatível com OpenAI: Ollama, LM Studio, llama.cpp, vLLM, LocalAI, text-generation-webui, OpenRouter e o seu próprio OminRoute.",
  },
  {
    q: "Como funciona o aprendizado automático?",
    a: "Ao ativar Memória na aba Aprendizado, o OmniRoute pode recuperar fatos em conversas futuras e extrair preferências/decisões. O próprio servidor controla essa função; ela pode acrescentar tokens ao contexto. Para guardar algo pontual, use o botão Aprender em uma resposta ou crie uma memória manual.",
  },
  {
    q: "Por que a memória pede outro token?",
    a: "A REST de memória passa por requireManagementAuth: use um Access Token do OminRoute (oma_live_…) com escopo read/write/admin, ou uma API Key habilitada com manage/admin. Uma chave comum de inferência recebe 401/403 nessas rotas.",
  },
  {
    q: "Onde filtro o tipo do modelo (chat, áudio, imagem, embedding…)?",
    a: "Em Conexão → Modelo: o RoutePilot carrega o catálogo unificado do OminRoute (GET /api/models/catalog, com fallback para GET /v1/models) e oferece pesquisa por modelo/provedor/capacidade, filtro de Provedor e filtro de Tipo — Chat, Audio (Fala/Transcrição), Imagem, Embedding, Rerank, Moderação, Vídeo e Música — com contexto, saída máxima e flags (Gratuito/Custom) em tabela paginada. Um clique na linha seleciona o modelo.",
  },
  {
    q: "Quais servidores têm memória como a do OminRoute?",
    a: "Nenhum outro. Ollama, LM Studio, llama.cpp, vLLM e OpenRouter são stateless: você reenvia o histórico a cada chamada e nada é guardado no servidor. O LocalAI oferece \"stores\" de vetores (get/set/find), que dá para usar como memória feita à mão, sem injeção automática. O RoutePilot detecta isso e, nesses casos, mantém apenas o histórico local do navegador mais o system prompt.",
  },
  {
    q: "Posso mandar PDF, Word ou planilha?",
    a: "Não como binário. Exporte: PDF/Word → .txt ou .md, planilha → .csv, dados → .json/.jsonl. O texto entra no corpo da mensagem dentro de um bloco cercado, e você pode revisar ou apagar trechos antes de enviar.",
  },
  {
    q: "Anexei uma imagem e o modelo não viu. Por quê?",
    a: "Confirme três coisas: o modelo é de visão (llava, llama3.2-vision, qwen2.5-vl, gemma3, gpt-4o…); no llama.cpp o servidor foi iniciado com --mmproj; e em Conexão → Parâmetros o envio de imagens não está em \"nunca enviar\". O RoutePilot usa o formato OpenAI image_url com data URI, aceito por OminRoute, Ollama (/v1), LM Studio, llama.cpp, vLLM e OpenRouter.",
  },
];

const shortcuts = [
  { keys: ["Enter"], desc: "Enviar mensagem" },
  { keys: ["Shift", "+", "Enter"], desc: "Quebrar linha" },
  { keys: ["■"], desc: "Parar a geração (durante o streaming)" },
];

export function AboutView({ footer }: { footer?: ReactNode }) {
  return (
    <div
      id="routepilot-scroll"
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
    >
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
          title="Segurança das chaves"
          icon={<Lock className="h-4 w-4" />}
          description="Duas credenciais, cada uma no seu escopo — ambas cifradas no navegador."
        >
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-emerald-100">Criptografia AES-GCM ativada</p>
              <p className="mt-0.5 text-emerald-200/80">
                A <strong className="text-emerald-100">API Key</strong> fala com <code>/v1</code> e o{" "}
                <strong className="text-emerald-100">token de gerenciamento</strong> fala com{" "}
                <code>/api</code>. Cada um é criptografado com AES-GCM de 256 bits (Web Crypto API,
                PBKDF2 com 100.000 iterações, salt e IV aleatórios por gravação) antes de ir para o
                localStorage, e só é decifrado em memória no instante da requisição. Separar as duas
                evita que uma chave de chat consiga mexer na sua memória.
              </p>
            </div>
          </div>
        </Card>

        <Card
          title="Arquivos que você pode mandar para a IA"
          icon={<Boxes className="h-4 w-4" />}
          description={`Até ${MAX_FILES} arquivos por mensagem: texto entra no corpo da mensagem, imagem vira bloco de visão.`}
        >
          <div className="space-y-2.5">
            {FILE_GROUPS.map((group) => (
              <div key={group.kind} className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[12.5px] font-semibold text-slate-100">{group.label}</p>
                  <span className="rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-2 py-0.5 text-[10px] text-violet-200">
                    {group.note}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-slate-600">
                    {group.exts.length} extensões
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {group.exts.map((ext) => (
                    <span
                      key={ext}
                      className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                    >
                      .{ext}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { k: "Texto no corpo", v: `até ${formatBytes(MAX_TEXT_BYTES)} por arquivo`, d: "colado dentro da mensagem; você revisa antes de enviar" },
              { k: "Imagens", v: `até ${formatBytes(MAX_IMAGE_BYTES)} por arquivo`, d: "enviadas como image_url (data URI) para modelos de visão" },
              { k: "Não lidos", v: "PDF, DOCX, XLSX, ZIP", d: "binários: exporte para .txt, .md ou .csv antes de anexar" },
            ].map((item) => (
              <div key={item.k} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{item.k}</p>
                <p className="mt-1 text-[13px] font-semibold text-slate-100">{item.v}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">{item.d}</p>
              </div>
            ))}
          </div>

          <Markdown
            content={`No servidor, o corpo da mensagem fica assim:

\`\`\`json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Analise o arquivo e a captura de tela abaixo" },
    { "type": "image_url", "image_url": { "url": "data:image/png;base64,iVBORw0KGgo..." } }
  ]
}
\`\`\`

Arquivos de texto são embutidos como bloco cercado, então o modelo cita linhas exatas:

\`\`\`markdown
Arquivo: src/lib/api.ts
\`\`\`ts
export function buildBaseUrl(config: ConnectionConfig) { ... }
\`\`\`
\`\`\``}
          />
        </Card>

        <Card
          title="Memória e visão em cada servidor"
          icon={<Wifi className="h-4 w-4" />}
          description="Nem todo servidor OpenAI-compatível tem API de memória. Veja o que o RoutePilot faz em cada caso."
        >
          <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
            <table className="w-full min-w-[620px] border-collapse text-left text-[12px]">
              <thead>
                <tr className="bg-white/[0.03] text-slate-400">
                  <th className="px-3 py-2 font-semibold">Servidor</th>
                  <th className="px-3 py-2 font-semibold">Chat</th>
                  <th className="px-3 py-2 font-semibold">REST / gestão</th>
                  <th className="px-3 py-2 font-semibold">Memória</th>
                  <th className="px-3 py-2 font-semibold">Imagens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {SERVER_PROFILES.map((p) => (
                  <tr key={p.id} className="align-top hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-100">{p.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{p.tagline}</p>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-400">
                      {p.host.replace(/^https?:\/\//, "")}
                      {p.port ? `:${p.port}` : ""}
                      {p.basePath || "/"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-cyan-200/90">
                      {p.restPath ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] uppercase",
                          p.memory === "full"
                            ? "border-emerald-400/30 text-emerald-300"
                            : p.memory === "partial"
                              ? "border-ember-400/30 text-ember-300"
                              : "border-white/10 text-slate-400",
                        )}
                      >
                        {MEMORY_SUPPORT_LABEL[p.memory]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-400">
                      {VISION_SUPPORT_LABEL[p.vision]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            {SERVER_PROFILES.map((p) => (
              <details
                key={p.id}
                className="group/delta rounded-xl border border-white/[0.07] bg-black/20 open:bg-white/[0.02]"
              >
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold text-slate-200 transition hover:text-white">
                  <ChevronRight className="h-4 w-4 shrink-0 text-violet-300 transition group-open/delta:rotate-90" />
                  {p.name}
                  <span className="ml-auto font-mono text-[10px] font-normal text-slate-500">
                    {p.restPath ? `${p.restPath}/memory` : "sem API de memória"}
                  </span>
                </summary>
                <div className="space-y-3 border-t border-white/[0.06] px-3.5 py-3">
                  <p className="text-[12.5px] leading-relaxed text-slate-400">{p.memoryNote}</p>
                  <p className="text-[12.5px] leading-relaxed text-slate-400">{p.visionNote}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.endpoints.map((ep) => (
                      <span
                        key={ep}
                        className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                      >
                        {ep}
                      </span>
                    ))}
                  </div>
                  <Markdown content={`\`\`\`bash
${p.chatExample}
\`\`\``} />
                  {p.memoryExample ? (
                    <>
                      <p className="text-[11.5px] text-slate-500">
                        Escrita na memória persistente (exemplo real usado pelo RoutePilot):
                      </p>
                      <Markdown content={`\`\`\`bash
${p.memoryExample}
\`\`\``} />
                    </>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </Card>

        <Card
          title="Como funciona"
          icon={<Wifi className="h-4 w-4" />}
          description="Do clique até o token na tela — anexos, chaves e memória incluídos."
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
          title="Memória, aprendizado e próximos passos"
          icon={<Brain className="h-4 w-4" />}
          description="O RoutePilot administra a memória pelo REST API do OmniRoute."
        >
          <div className="space-y-3 text-[13px] leading-relaxed text-slate-400">
            <p>
              A aba <strong className="text-slate-200">Memória</strong> permite consultar, buscar,
              criar, editar e excluir memórias persistentes. O botão <strong className="text-slate-200">Aprender</strong>
              em uma resposta grava a pergunta e a resposta como um episódio; na aba Aprendizado
              você também pode ativar a extração e a recuperação automáticas do OmniRoute.
            </p>
            <p>
              O motor e o armazenamento atuais são controlados pelo próprio OmniRoute (SQLite/FTS5,
              com embeddings e Qdrant opcionais conforme a configuração do servidor). A rota REST
              normalmente é <code className="text-cyan-300">/api</code> na porta{" "}
              <code className="text-cyan-300">20128</code>; configure essa rota e um token de
              gerenciamento na aba Conexão. A chave de inferência do chat não substitui esse token.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-violet-400/20 bg-violet-500/[0.07] p-3">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
            <p className="text-xs leading-relaxed text-violet-100/80">
              <strong className="text-violet-100">Roadmap:</strong> uma conexão direta e opcional
              com outros sistemas SQL pode ser adicionada em uma versão futura. Ela ainda não está
              implementada: por enquanto, o RoutePilot usa somente a API de memória do OmniRoute e
              não abre conexão direta com bancos de dados.
            </p>
          </div>
        </Card>

        <Card
          title="Anatomia da requisição HTTP"
          icon={<Terminal className="h-4 w-4" />}
          description="Payload compatível com o ecossistema OpenAI / OpenRouter."
        >
          <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-850">
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
              "Anexos de código, dados e imagens",
              "Chave com criptografia AES-GCM",
              "Memória e aprendizado do OmniRoute",
              "Markdown completo e tabelas",
              "Regeneração de respostas",
              "Histórico de conversas local",
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
      {footer}
    </div>
  );
}
