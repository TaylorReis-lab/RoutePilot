#!/usr/bin/env node
/**
 * Proxy local para o cliente RoutePilot.
 *
 * Uso:  node proxy.mjs            (porta padrão 8787)
 *       PORT=9000 node proxy.mjs
 *
 * Depois ative "Usar proxy local (CORS)" no app e aponte a URL do proxy
 * para http://localhost:8787
 *
 * O proxy recebe:  /proxy?url=<url-encoded do destino>
 * e repassa método, headers, corpo e resposta (com streaming SSE).
 */
import http from "node:http";
import { Readable } from "node:stream";

const PORT = Number(process.env.PORT || 8787);
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";

const cors = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type,Authorization,Accept,HTTP-Referer,X-Title,X-Custom,X-Session-Id,OpenAI-Organization",
  "Access-Control-Max-Age": "86400",
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (requestUrl.pathname === "/health") {
    res.writeHead(200, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "routepilot-proxy" }));
    return;
  }

  if (requestUrl.pathname !== "/proxy") {
    res.writeHead(404, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Use /proxy?url=<url codificada>" }));
    return;
  }

  const target = requestUrl.searchParams.get("url");
  if (!target) {
    res.writeHead(400, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Parâmetro 'url' obrigatório" }));
    return;
  }

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (["host", "connection", "content-length", "origin", "referer"].includes(key)) continue;
    headers[key] = value;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
    });

    const outHeaders = { ...cors };
    upstream.headers.forEach((value, key) => {
      if (["content-encoding", "content-length", "transfer-encoding"].includes(key)) return;
      outHeaders[key] = value;
    });

    res.writeHead(upstream.status, outHeaders);
    if (!upstream.body) {
      res.end();
      return;
    }
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    res.writeHead(502, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `Não foi possível falar com o destino: ${err.message}` }));
  }
});

server.listen(PORT, () => {
  console.log(`\n  ➜  RoutePilot Proxy rodando em http://localhost:${PORT}`);
  console.log(`     Use no app: http://localhost:${PORT}  (ative "Usar proxy local")\n`);
});
