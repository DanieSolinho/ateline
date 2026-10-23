// Lê a planilha da Ateline e gera data/catalogo.json para o site.
// Uso: npm run importar
import { writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { converterCatalogo, type Linha } from "@/lib/importar/converter";

const PLANILHA = "dados-fonte/catalogo.xlsx";
const SAIDA = "data/catalogo.json";

// Uma célula do Excel pode ser texto, número, data, fórmula, link… Aqui viram texto ou número.
function valorDaCelula(valor: ExcelJS.CellValue): string | number | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (typeof valor === "object") {
    if ("result" in valor) return valorDaCelula(valor.result as ExcelJS.CellValue);
    if ("richText" in valor) return valor.richText.map((parte) => parte.text).join("");
    if ("text" in valor) return String(valor.text);
    return null;
  }
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  return valor;
}

// Transforma uma aba em uma lista de { "Nome da coluna": valor }
function lerAba(planilha: ExcelJS.Workbook, nomeDaAba: string): Linha[] {
  const aba = planilha.getWorksheet(nomeDaAba);
  if (!aba) throw new Error(`A aba "${nomeDaAba}" não existe na planilha.`);

  const cabecalho: string[] = [];
  aba.getRow(1).eachCell((celula, coluna) => {
    cabecalho[coluna] = String(valorDaCelula(celula.value) ?? "").trim();
  });

  const linhas: Linha[] = [];
  aba.eachRow((linha, numero) => {
    if (numero === 1) return;
    const registro: Linha = {};
    linha.eachCell((celula, coluna) => {
      if (cabecalho[coluna]) registro[cabecalho[coluna]] = valorDaCelula(celula.value);
    });
    linhas.push(registro);
  });
  return linhas;
}

// Na aba "Como usar", o cupom fica numa linha com o rótulo na coluna A e o valor na coluna B
function lerCupom(planilha: ExcelJS.Workbook): { codigo: unknown; desconto: unknown } {
  const aba = planilha.getWorksheet("Como usar");
  const cupom: { codigo: unknown; desconto: unknown } = { codigo: null, desconto: null };
  aba?.eachRow((linha) => {
    const rotulo = String(valorDaCelula(linha.getCell(1).value) ?? "").trim();
    if (rotulo === "Código do cupom") cupom.codigo = valorDaCelula(linha.getCell(2).value);
    if (rotulo === "Desconto") cupom.desconto = valorDaCelula(linha.getCell(2).value);
  });
  return cupom;
}

async function main() {
  const planilha = new ExcelJS.Workbook();
  await planilha.xlsx.readFile(PLANILHA);

  const { catalogo, erros, avisos } = converterCatalogo({
    bolos: lerAba(planilha, "Bolos"),
    opcoes: lerAba(planilha, "Opções de aluguel"),
    topos: lerAba(planilha, "Topos"),
    bases: lerAba(planilha, "Andar avulso"),
    cupom: lerCupom(planilha),
  });

  for (const aviso of avisos) console.log(`⚠️  ${aviso}`);

  if (erros.length > 0) {
    for (const erro of erros) console.log(`❌ ${erro}`);
    console.log(`\n${erros.length} erro(s). Corrija a planilha: ${SAIDA} não foi alterado.`);
    process.exit(1);
  }

  await writeFile(SAIDA, JSON.stringify(catalogo, null, 2) + "\n");
  console.log(
    `\n✅ ${SAIDA} atualizado: ${catalogo.bolos.length} bolos, ${catalogo.opcoes.length} opções, ` +
      `${catalogo.topos.length} topos e ${catalogo.bases.length} bases.` +
      (catalogo.cupomRefazer ? ` Cupom: ${catalogo.cupomRefazer.codigo}.` : ""),
  );
}

main();