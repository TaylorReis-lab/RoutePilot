import {
  IMAGE_EXT,
  MAX_FILES,
  MAX_IMAGE_BYTES,
  MAX_TEXT_BYTES,
  extensionOf,
  formatBytes,
  isImageLike,
  isTextLike,
} from "./fileTypes";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  kind: "text" | "image" | "skipped";
  /** Data URL para imagens; texto embutido vai direto no corpo da mensagem. */
  dataUrl?: string;
  /** Motivo quando o arquivo não pôde ser lido. */
  note?: string;
}

export interface AttachmentRead {
  snippet: string;
  attachments: Attachment[];
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

function fenced(name: string, content: string): string {
  const ext = extensionOf(name);
  const lang = ext && ext !== name && IMAGE_EXT.has(ext) === false ? ext : "";
  return `Arquivo: ${name}\n\`\`\`${lang}\n${content}\n\`\`\``;
}

/**
 * Lê arquivos selecionados: texto/código/dados vão embutidos no corpo da mensagem
 * (você pode revisar antes de enviar) e imagens viram anexos base64 quando o
 * envio de imagens estiver ativo no servidor.
 */
export async function readFiles(files: File[]): Promise<AttachmentRead> {
  const accepted = files.slice(0, MAX_FILES);
  const skippedTooMany = files.length - accepted.length;
  const blocks: string[] = [];
  const attachments: Attachment[] = [];

  for (const file of accepted) {
    const base: Attachment = { id: uid(), name: file.name, size: file.size, kind: "skipped" };
    try {
      if (isImageLike(file)) {
        if (file.size > MAX_IMAGE_BYTES) {
          attachments.push({ ...base, note: `imagem acima de ${formatBytes(MAX_IMAGE_BYTES)}` });
          blocks.push(`[imagem ignorada: ${file.name} — ${formatBytes(file.size)}, acima do limite]`);
          continue;
        }
        const dataUrl = await readAsDataUrl(file);
        attachments.push({ ...base, kind: "image", dataUrl });
        blocks.push(`[imagem anexada: ${file.name} — ${formatBytes(file.size)}]`);
        continue;
      }

      if (!isTextLike(file)) {
        attachments.push({ ...base, note: "formato não suportado para leitura" });
        blocks.push(
          `[arquivo não suportado: ${file.name} — ${formatBytes(file.size)}; só texto/código/dados/imagens]`,
        );
        continue;
      }

      if (file.size > MAX_TEXT_BYTES) {
        attachments.push({ ...base, note: `acima de ${formatBytes(MAX_TEXT_BYTES)}` });
        blocks.push(`[arquivo ignorado: ${file.name} — ${formatBytes(file.size)}, acima do limite de texto]`);
        continue;
      }

      const content = (await file.text()).slice(0, MAX_TEXT_BYTES);
      attachments.push({ ...base, kind: "text" });
      blocks.push(fenced(file.name, content));
    } catch (error) {
      attachments.push({ ...base, note: (error as Error)?.message || "erro de leitura" });
      blocks.push(`[não foi possível ler: ${file.name}]`);
    }
  }

  if (skippedTooMany > 0) {
    blocks.push(`[${skippedTooMany} arquivo(s) não anexados — máximo de ${MAX_FILES} por mensagem]`);
  }

  return { snippet: blocks.join("\n\n"), attachments };
}
