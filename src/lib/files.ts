import type { Attachment } from "../types";

export const MAX_FILES = 6;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_TEXT_BYTES = 1024 * 1024;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

/** Tipos aceitos no seletor de arquivos (o processamento valida de novo). */
export const ACCEPT =
  "image/*,text/*,.pdf,.md,.markdown,.json,.csv,.tsv,.xml,.yaml,.yml,.toml,.ini,.cfg,.conf,.log,.env," +
  ".js,.jsx,.ts,.tsx,.mjs,.cjs,.py,.java,.c,.cpp,.h,.hpp,.cs,.go,.rs,.rb,.php,.sh,.bash,.zsh,.ps1,.bat," +
  ".sql,.html,.htm,.css,.scss,.less,.vue,.svelte,.kt,.swift,.dart,.r,.lua,.tex,.rst,.svg";

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "json", "csv", "tsv", "xml", "yaml", "yml", "toml", "ini", "cfg", "conf",
  "log", "env", "js", "jsx", "ts", "tsx", "mjs", "cjs", "py", "java", "c", "cpp", "h", "hpp", "cs",
  "go", "rs", "rb", "php", "sh", "bash", "zsh", "ps1", "bat", "sql", "html", "htm", "css", "scss",
  "less", "vue", "svelte", "kt", "swift", "dart", "r", "lua", "tex", "rst", "adoc", "svg",
  "gitignore", "dockerfile", "properties", "gradle",
]);

const TEXT_MIMES = new Set([
  "application/json", "application/xml", "application/javascript", "application/x-javascript",
  "application/typescript", "application/x-yaml", "application/yaml", "application/toml",
  "application/x-sh", "application/sql", "application/x-httpd-php", "image/svg+xml",
]);

const LANG_BY_EXT: Record<string, string> = {
  js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "jsx", ts: "typescript", tsx: "tsx",
  py: "python", rb: "ruby", rs: "rust", go: "go", java: "java", kt: "kotlin", swift: "swift",
  c: "c", h: "c", cpp: "cpp", hpp: "cpp", cs: "csharp", php: "php", sh: "bash", bash: "bash",
  zsh: "bash", ps1: "powershell", bat: "batch", sql: "sql", html: "html", htm: "html", css: "css",
  scss: "scss", less: "less", json: "json", yaml: "yaml", yml: "yaml", toml: "toml", xml: "xml",
  md: "markdown", markdown: "markdown", csv: "csv", tsv: "tsv", vue: "vue", svelte: "svelte",
  dart: "dart", r: "r", lua: "lua", dockerfile: "dockerfile", tex: "latex", ini: "ini", conf: "ini",
  cfg: "ini", env: "bash", txt: "text", log: "text", svg: "xml", rst: "rst", adoc: "asciidoc",
};

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extOf(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  if (base.toLowerCase() === "dockerfile") return "dockerfile";
  const idx = base.lastIndexOf(".");
  return idx >= 0 ? base.slice(idx + 1).toLowerCase() : "";
}

export function languageFor(name: string): string {
  return LANG_BY_EXT[extOf(name)] ?? "";
}

export function kindLabel(a: Attachment): string {
  if (a.kind === "image") return "imagem";
  if (a.kind === "file") return a.mime === "application/pdf" ? "PDF" : "arquivo";
  return languageFor(a.name) || "texto";
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function toDataUrl(file: Blob, mime: string): Promise<string> {
  const buffer = await file.arrayBuffer();
  return `data:${mime};base64,${bytesToBase64(new Uint8Array(buffer))}`;
}

async function looksLikeText(file: Blob): Promise<boolean> {
  const head = await file.slice(0, 8192).text();
  return !head.includes("\u0000");
}

export interface ProcessResult {
  attachments: Attachment[];
  errors: string[];
}

/**
 * Lê os arquivos selecionados e os converte em anexos:
 *  - texto/código  → conteúdo textual (vai embutido na mensagem)
 *  - imagens       → data URL (formato OpenAI `image_url`)
 *  - PDF           → data URL (formato `file`, suportado por OpenRouter/OminRoute)
 */
export async function processFiles(files: File[], existingCount: number): Promise<ProcessResult> {
  const attachments: Attachment[] = [];
  const errors: string[] = [];
  let slots = MAX_FILES - existingCount;

  for (const file of files) {
    if (slots <= 0) {
      errors.push(`Limite de ${MAX_FILES} anexos por mensagem.`);
      break;
    }

    const ext = extOf(file.name);
    const mime = (file.type || "").toLowerCase();
    const base = { id: newId(), name: file.name, size: file.size };

    try {
      const isSvg = mime === "image/svg+xml" || ext === "svg";

      if (mime.startsWith("image/") && !isSvg) {
        if (file.size > MAX_IMAGE_BYTES) {
          errors.push(`${file.name}: imagem acima de ${formatBytes(MAX_IMAGE_BYTES)}.`);
          continue;
        }
        attachments.push({ ...base, mime, kind: "image", dataUrl: await toDataUrl(file, mime) });
      } else if (mime === "application/pdf" || ext === "pdf") {
        if (file.size > MAX_PDF_BYTES) {
          errors.push(`${file.name}: PDF acima de ${formatBytes(MAX_PDF_BYTES)}.`);
          continue;
        }
        attachments.push({
          ...base,
          mime: "application/pdf",
          kind: "file",
          dataUrl: await toDataUrl(file, "application/pdf"),
        });
      } else if (
        mime.startsWith("text/") ||
        TEXT_MIMES.has(mime) ||
        TEXT_EXTENSIONS.has(ext) ||
        (!mime && (await looksLikeText(file)))
      ) {
        if (file.size > MAX_TEXT_BYTES) {
          errors.push(`${file.name}: arquivo de texto acima de ${formatBytes(MAX_TEXT_BYTES)}.`);
          continue;
        }
        attachments.push({ ...base, mime: mime || "text/plain", kind: "text", text: await file.text() });
      } else {
        errors.push(`${file.name}: tipo não suportado (envie texto, código, imagens ou PDF).`);
        continue;
      }
      slots -= 1;
    } catch {
      errors.push(`${file.name}: falha ao ler o arquivo.`);
    }
  }

  return { attachments, errors };
}
