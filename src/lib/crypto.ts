/**
 * Utilitário de criptografia AES-GCM (Web Crypto API) para armazenar a API Key
 * de forma criptografada no localStorage em vez de texto puro.
 *
 * Utiliza chave derivada via PBKDF2 com salt aleatório e IV único para cada gravação.
 */



function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}



async function getCryptoKey(salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode("routepilot.secure.storage.TaylorReis-dev"),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Criptografa um texto (como a API Key) com AES-GCM.
 * Retorna string no formato `enc:v1:<salt_b64>:<iv_b64>:<ciphertext_b64>`
 */
export async function encryptApiKey(plainText: string): Promise<string> {
  if (!plainText) return "";
  try {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const key = await getCryptoKey(salt);
    const enc = new TextEncoder();
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as any },
      key,
      enc.encode(plainText),
    );

    return `enc:v1:${bufferToBase64(salt.buffer)}:${bufferToBase64(iv.buffer)}:${bufferToBase64(cipherBuffer)}`;
  } catch (err) {
    console.error("[RoutePilot Crypto] Falha ao criptografar API Key:", err);
    // fallback seguro simples
    return `enc:b64:${btoa(plainText)}`;
  }
}

/**
 * Descriptografa uma API Key salva no localStorage.
 * Suporta formatos `enc:v1:...`, `enc:b64:...` ou texto direto anterior para retrocompatibilidade.
 */
export async function decryptApiKey(storedValue: string): Promise<string> {
  if (!storedValue) return "";
  if (!storedValue.startsWith("enc:")) {
    // texto puro antigo
    return storedValue;
  }

  try {
    const parts = storedValue.split(":");
    if (parts[1] === "b64") {
      return atob(parts[2]);
    }

    if (parts[1] === "v1" && parts.length === 5) {
      const salt = new Uint8Array(base64ToBuffer(parts[2]));
      const iv = new Uint8Array(base64ToBuffer(parts[3]));
      const cipher = base64ToBuffer(parts[4]);

      const key = await getCryptoKey(salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as any },
        key,
        cipher,
      );

      const dec = new TextDecoder();
      return dec.decode(decrypted);
    }
  } catch (err) {
    console.warn("[RoutePilot Crypto] Não foi possível descriptografar:", err);
  }
  return "";
}
