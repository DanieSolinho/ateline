// Servidor bem simples para a pasta out/ (o site já publicado), usado pelos testes de ponta a ponta.
// Funciona com e sem o "/ateline" do GitHub Pages no começo do endereço.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const PASTA = "out";
const PORTA = Number(process.env.PORTA ?? 4173);
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

function arquivoDe(caminho) {
  const limpo = decodeURIComponent(caminho.split("?")[0]).replace(/^\/ateline(?=\/|$)/, "") || "/";
  if (limpo.includes("..")) return null;
  const candidatos = [join(PASTA, limpo), join(PASTA, limpo, "index.html")];
  return candidatos.find((arquivo) => existsSync(arquivo) && statSync(arquivo).isFile()) ?? null;
}

createServer((pedido, resposta) => {
  const arquivo = arquivoDe(pedido.url ?? "/");
  const final = arquivo ?? join(PASTA, "404.html");
  resposta.writeHead(arquivo ? 200 : 404, { "Content-Type": TIPOS[extname(final)] ?? "application/octet-stream" });
  createReadStream(final).pipe(resposta);
}).listen(PORTA, () => console.log(`Site em http://localhost:${PORTA}`));
