import { CardBolo } from "@/components/CardBolo";
import type { Bolo } from "@/types/bolo";

// Dados de exemplo: só o Bolo Tiana é real. Os outros saem quando a planilha chegar.
const exemplos: { bolo: Bolo; disponivel?: boolean }[] = [
  {
    bolo: { codigo: "0211", nome: "Bolo Tiana", tipo: "bolo", modalidade: "aluguel", tema: "princesas", andares: 1, precoLocacao: 70 },
    disponivel: true,
  },
  {
    bolo: { codigo: "0001", nome: "Exemplo reservado", tipo: "bolo", modalidade: "aluguel", tema: "safari", andares: 2, precoLocacao: 90 },
    disponivel: false,
  },
  {
    bolo: { codigo: "0002", nome: "Exemplo de kit", tipo: "kit_completo", modalidade: "aluguel", tema: "floral", andares: 1, precoLocacao: 250, itensKit: ["mesa", "bandejas", "painel", "arcos"] },
    disponivel: true,
  },
  {
    bolo: { codigo: "0003", nome: "Exemplo à venda", tipo: "bolo", modalidade: "venda", tema: "futebol", andares: 1, precoVenda: 380 },
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12">
      <h1 className="mb-8 font-display text-3xl font-semibold">Teste do CardBolo</h1>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
        {exemplos.map(({ bolo, disponivel }) => (
          <CardBolo key={bolo.codigo} bolo={bolo} disponivel={disponivel} />
        ))}
      </div>
    </main>
  );
}