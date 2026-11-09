// Prepara as fotos dos bolos para o site.
// Uso: npm run fotos
//
// De onde vêm as fotos (a primeira opção que existir):
//   a) uma pasta passada no comando: npm run fotos -- "/Users/voce/OneDrive/Ateline/Fotos"
//   b) a linha PASTA_DAS_FOTOS no arquivo .env (ex.: a pasta do OneDrive no seu Mac)
//   c) dados-fonte/fotos, dentro do projeto
//
// 1. Dentro dessa pasta, uma pasta por bolo com o código no nome (ex.: ABELHINHA_001/).
//    Pode ser o código de um bolo (aba Bolos) ou de uma opção (aba Opções de aluguel).
// 2. A ordem segue o nome dos arquivos: a primeira é a principal (use -01, -02, -03…).
// 3. O comando cria versões leves em public/fotos/ e a lista em data/fotos.json.
// As fotos originais (pesadas) ficam só no seu computador: a pasta dados-fonte/fotos não vai para o GitHub.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { codigoDaPasta, ehFoto, ehHeic, ordenarFotos } from "@/lib/importar/fotos";
import type { Catalogo } from "@/types/catalogo";

const PASTA_PADRAO = "dados-fonte/fotos";
// "~/OneDrive/Fotos" → "/Users/voce/OneDrive/Fotos"
const expandir = (caminho: string) => caminho.trim().replace(/^~(?=\/|$)/, homedir());
const PASTA_ESCOLHIDA = process.argv[2] ?? process.env.PASTA_DAS_FOTOS;
const ORIGEM = PASTA_ESCOLHIDA ? expandir(PASTA_ESCOLHIDA) : PASTA_PADRAO;
const DESTINO = "public/fotos";
const LISTA = "data/fotos.json";

// Tamanho máximo (largura x altura). A foto nunca é aumentada, só diminuída.
const GRANDE = { width: 1400, height: 1750, quality: 80 }; // página do bolo
const PEQUENA = { width: 640, height: 800, quality: 75 }; // cartões

async function salvar(entrada: Buffer, arquivo: string, tamanho: typeof GRANDE): Promise<Buffer> {
  const saida = await sharp(entrada)
    .rotate() // respeita a orientação da foto do celular (em pé / deitada)
    .resize({ width: tamanho.width, height: tamanho.height, fit: "inside", withoutEnlargement: true })
    .webp({ quality: tamanho.quality })
    .toBuffer();
  await writeFile(arquivo, saida);
  return saida;
}

async function main() {
  if (!existsSync(ORIGEM)) {
    if (PASTA_ESCOLHIDA) {
      console.error(`❌ Não achei a pasta de fotos: ${ORIGEM}`);
      console.error("   Confira o caminho (no Finder: clique com o botão direito na pasta, segure Option e escolha \"Copiar … como Nome do Caminho\").");
      process.exit(1);
    }
    await mkdir(ORIGEM, { recursive: true });
    console.log(`📁 Criei a pasta ${ORIGEM}. Coloque nela uma pasta por bolo, com o código no nome, e rode de novo.`);
    return;
  }

  console.log(`📂 Lendo as fotos de: ${ORIGEM}`);
  const catalogo = JSON.parse(await readFile("data/catalogo.json", "utf8")) as Catalogo;
  const codigosValidos = new Set([...catalogo.bolos.map((b) => b.codigo), ...catalogo.opcoes.map((o) => o.codigo)]);

  const mapa: Record<string, string[]> = {};
  const avisos: string[] = [];
  const pastas = (await readdir(ORIGEM, { withFileTypes: true })).filter((item) => item.isDirectory());

  for (const pasta of pastas) {
    const codigo = codigoDaPasta(pasta.name);
    if (!codigosValidos.has(codigo)) {
      avisos.push(`Pasta "${pasta.name}": não existe bolo nem opção com o código ${codigo} na planilha. Pulei.`);
      continue;
    }

    const arquivos = await readdir(path.join(ORIGEM, pasta.name));
    arquivos.filter(ehHeic).forEach((arquivo) =>
      avisos.push(`${pasta.name}/${arquivo}: foto em HEIC. Exporte como JPG (no Mac: Arquivo → Exportar) e rode de novo.`),
    );
    const fotos = ordenarFotos(arquivos.filter(ehFoto));
    if (fotos.length === 0) {
      avisos.push(`Pasta "${pasta.name}": está vazia (ou sem fotos JPG/PNG/WebP).`);
      continue;
    }

    const pastaDeSaida = path.join(DESTINO, codigo);
    await rm(pastaDeSaida, { recursive: true, force: true }); // tira as fotos antigas desse bolo
    await mkdir(pastaDeSaida, { recursive: true });

    const versoes: string[] = [];
    for (const [i, foto] of fotos.entries()) {
      const nn = String(i + 1).padStart(2, "0");
      try {
        const entrada = await readFile(path.join(ORIGEM, pasta.name, foto));
        const grande = await salvar(entrada, path.join(pastaDeSaida, `${codigo}-${nn}.webp`), GRANDE);
        await salvar(entrada, path.join(pastaDeSaida, `${codigo}-${nn}-p.webp`), PEQUENA);
        versoes.push(createHash("sha1").update(grande).digest("hex").slice(0, 8));
      } catch {
        avisos.push(`${pasta.name}/${foto}: não consegui abrir essa foto. Ela pode estar corrompida ou ainda baixando do OneDrive.`);
      }
    }
    if (versoes.length > 0) mapa[codigo] = versoes;
  }

  // Bolos que saíram da pasta de fotos: tira as versões leves antigas também
  if (existsSync(DESTINO)) {
    for (const item of await readdir(DESTINO, { withFileTypes: true })) {
      if (item.isDirectory() && !mapa[item.name]) await rm(path.join(DESTINO, item.name), { recursive: true, force: true });
    }
  }

  const ordenado = Object.fromEntries(Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(LISTA, JSON.stringify(ordenado, null, 2) + "\n");

  avisos.forEach((aviso) => console.warn(`⚠️  ${aviso}`));
  const semFoto = catalogo.bolos.filter((b) => !mapa[b.codigo] && !catalogo.opcoes.some((o) => o.codigoBolo === b.codigo && mapa[o.codigo]));
  const total = Object.values(mapa).reduce((soma, v) => soma + v.length, 0);
  console.log(`\n✅ ${total} fotos prontas, de ${Object.keys(mapa).length} pastas.`);
  if (semFoto.length > 0) console.log(`📷 Ainda sem foto (${semFoto.length}): ${semFoto.map((b) => b.codigo).join(", ")}`);
}

main().catch((erro) => {
  console.error("❌ Não deu para preparar as fotos:", erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
