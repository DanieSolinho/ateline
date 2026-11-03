import type { Contrato } from "@/lib/contrato";

// As fontes padrão do PDF só têm os caracteres do português "comum".
// Troca os poucos símbolos tipográficos que ficariam com defeito.
export function textoParaPdf(texto: string): string {
  return texto
    .replace(/[  ]/g, " ") // espaços especiais do formatador de preço
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-");
}

// Gera o PDF (A4) do contrato. A biblioteca só é baixada quando a cliente clica no botão.
export async function gerarPdfDoContrato(contrato: Contrato): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.setProperties({ title: `${contrato.titulo} - Ateline`, author: "Ateline Ateliê" });

  const margem = 20;
  const largura = 210 - margem * 2;
  const fimDaPagina = 297 - margem;
  let y = margem;

  function escrever(texto: string, { tamanho = 10.5, negrito = false, recuo = 0, antes = 0, depois = 2 } = {}) {
    pdf.setFont("helvetica", negrito ? "bold" : "normal");
    pdf.setFontSize(tamanho);
    const linhas = pdf.splitTextToSize(textoParaPdf(texto), largura - recuo) as string[];
    const alturaDaLinha = tamanho * 0.45;
    y += antes;
    for (const linha of linhas) {
      if (y + alturaDaLinha > fimDaPagina) {
        pdf.addPage();
        y = margem;
      }
      pdf.text(linha, margem + recuo, y);
      y += alturaDaLinha;
    }
    y += depois;
  }

  escrever(contrato.titulo, { tamanho: 16, negrito: true, depois: 6 });
  for (const bloco of contrato.blocos) {
    if (bloco.tipo === "titulo") escrever(bloco.texto, { negrito: true, antes: 3 });
    else if (bloco.tipo === "item") escrever(bloco.texto, { recuo: 5 });
    else if (bloco.tipo === "destaque") escrever(bloco.texto, { negrito: true, antes: 1 });
    else escrever(bloco.texto, { depois: 3 });
  }

  // Número da página no rodapé
  const total = pdf.getNumberOfPages();
  for (let pagina = 1; pagina <= total; pagina++) {
    pdf.setPage(pagina);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(`Ateline Ateliê - página ${pagina} de ${total}`, 105, 297 - 10, { align: "center" });
  }
  return pdf.output("blob");
}

// Baixa o arquivo no navegador
export async function baixarContrato(contrato: Contrato): Promise<void> {
  const blob = await gerarPdfDoContrato(contrato);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = contrato.nomeDoArquivo;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
