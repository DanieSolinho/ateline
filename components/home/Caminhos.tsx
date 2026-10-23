import Link from "next/link";
import { CalendarHeart, PartyPopper, ShoppingBag, Sparkles } from "lucide-react";

const caminhos = [
  {
    href: "/alugar",
    titulo: "Bolos para alugar",
    texto: "Escolha no acervo e reserve pela data da festa.",
    Icone: CalendarHeart,
  },
  {
    href: null, // ainda não existe: os kits entram quando houver fotos deles montados
    titulo: "Kits pegue e monte",
    texto: "Mesa, bandejas, painel com arco de balões e arcos de mesa.",
    Icone: PartyPopper,
  },
  {
    href: "/encomenda",
    titulo: "Encomende o seu",
    texto: "Um bolo novo, feito do seu jeito. Valores a partir da nossa tabela.",
    Icone: Sparkles,
  },
  {
    href: "/comprar",
    titulo: "Comprar",
    texto: "Leve o bolo para sempre, com envio para todo o Brasil.",
    Icone: ShoppingBag,
  },
];

export function Caminhos() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-16">
      <h2 className="mb-6 font-display text-3xl font-semibold">O que você procura?</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {caminhos.map(({ href, titulo, texto, Icone }) => {
          const conteudo = (
            <>
              <span className="grid size-12 place-items-center rounded-xl bg-blush text-framboesa">
                <Icone size={24} strokeWidth={1.8} />
              </span>
              <span className="font-display text-xl font-semibold">{titulo}</span>
              <span className="text-ameixa-suave">{texto}</span>
            </>
          );

          // Sem link: mostra o card com o selo "Em breve", sem levar a uma página vazia
          if (!href) {
            return (
              <div key={titulo} className="relative flex flex-col gap-2 rounded-2xl border border-dashed border-linha p-6">
                <span className="absolute right-4 top-4 rounded-full bg-pessego px-3 py-1 text-xs font-bold">
                  Em breve
                </span>
                {conteudo}
              </div>
            );
          }

          return (
            <Link
              key={titulo}
              href={href}
              className="flex flex-col gap-2 rounded-2xl border border-linha p-6 transition hover:border-framboesa"
            >
              {conteudo}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
