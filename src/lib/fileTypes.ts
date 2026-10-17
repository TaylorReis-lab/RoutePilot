/**
 * Lista canônica dos arquivos que o RoutePilot consegue anexar a uma mensagem.
 * Usada pelo Composer (input `accept` + painel de tipos), pela aba Sobre e pelos
 * avisos de compatibilidade.
 */

export const MAX_FILES = 5;
export const MAX_TEXT_BYTES = 200 * 1024; // conteúdo embutido no prompt
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // base64 ~ 33% maior

export type FileKind = "code" | "data" | "web" | "infra" | "image" | "other";

export interface FileTypeGroup {
  kind: FileKind;
  label: string;
  note: string;
  exts: string[];
}

export const FILE_GROUPS: FileTypeGroup[] = [
  {
    kind: "code",
    label: "Código",
    note: "lido e colado como bloco ```",
    exts: [
      "js", "jsx", "mjs", "cjs", "ts", "tsx", "py", "java", "kt", "kts", "go", "rs",
      "c", "h", "cpp", "hpp", "cc", "cs", "php", "rb", "swift", "scala", "lua", "pl",
      "r", "m", "sql", "prisma", "graphql", "gql", "proto", "sol", "dart", "ex", "exs",
    ],
  },
  {
    kind: "data",
    label: "Texto e dados",
    note: "lido como texto simples",
    exts: [
      "txt", "md", "markdown", "mdx", "rst", "tex", "csv", "tsv", "json", "jsonl",
      "ndjson", "xml", "yml", "yaml", "toml", "ini", "cfg", "conf", "env", "log",
      "properties", "editorconfig",
    ],
  },
  {
    kind: "web",
    label: "Web e estilos",
    note: "lido como texto",
    exts: ["html", "htm", "css", "scss", "sass", "less", "vue", "svelte", "astro", "svg"],
  },
  {
    kind: "infra",
    label: "Scripts e configuração",
    note: "lido como texto",
    exts: [
      "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd", "dockerfile", "dockerignore",
      "makefile", "mk", "gitignore", "nginx", "service", "tf", "tfvars", "hcl",
    ],
  },
  {
    kind: "image",
    label: "Imagens (modelos de visão)",
    note: "enviadas como imagem, quando ativado",
    exts: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff"],
  },
];

export const TEXT_EXT = new Set(
  FILE_GROUPS.filter((g) => g.kind !== "image").flatMap((g) => g.exts),
);
export const IMAGE_EXT = new Set(FILE_GROUPS.find((g) => g.kind === "image")!.exts);

/** String para o atributo `accept` do <input type="file">. */
export const ACCEPT_ATTR = [
  ...[...TEXT_EXT].map((e) => `.${e}`),
  ...[...IMAGE_EXT].map((e) => `.${e}`),
  "text/plain",
  "text/*",
  "application/json",
  "application/xml",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/svg+xml",
].join(",");

/** Extensões que aparecem em texto grande demais, binário etc. */
export function extensionOf(name: string): string {
  const base = name.split(/[\\/]/).pop() || name;
  if (!base.includes(".")) return base.toLowerCase(); // Dockerfile, Makefile…
  return base.split(".").pop()!.toLowerCase();
}

const NAME_ONLY_TEXT = ["dockerfile", "makefile", "gemfile", "rakefile", "procfile", "justfile"];

export function isTextLike(file: File): boolean {
  const ext = extensionOf(file.name);
  if (IMAGE_EXT.has(ext)) return false;
  if (TEXT_EXT.has(ext)) return true;
  if (NAME_ONLY_TEXT.includes(ext)) return true;
  return file.type.startsWith("text/") || /json|xml|javascript|typescript|x-sh|yaml/.test(file.type);
}

export function isImageLike(file: File): boolean {
  const ext = extensionOf(file.name);
  return IMAGE_EXT.has(ext) || file.type.startsWith("image/");
}

const trimZero = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${trimZero(bytes / 1024)} KB`;
  return `${trimZero(bytes / (1024 * 1024))} MB`;
}

export function kindLabel(kind: FileKind): string {
  return FILE_GROUPS.find((g) => g.kind === kind)?.label ?? "Outros";
}

/** Todos os tipos aceitos, em uma frase curta para hints de UI. */
export const ACCEPT_SUMMARY = `${TEXT_EXT.size + IMAGE_EXT.size} extensões · texto, código, dados e imagens`;
