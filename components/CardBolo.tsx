import Image from "next/image";
import Link from "next/link";
import { Check, CircleSlash } from "lucide-react";
import { formatarPreco } from "@/lib/formatar";
import type { BoloVitrine } from "@/types/catalogo";

type CardBoloProps = {
  bolo: BoloVitrine;
  foto?: string;
  // true = livre na data escolhida · false = reservado · sem valor = nenhuma data escolhida
  disponivel?: boolean;
  // "compra": card da página Comprar, com o preço de venda em destaque
  modo?: "aluguel" | "compra";
};

export function CardBolo({ bolo, foto, disponivel, modo = "aluguel" }: CardBoloProps) {
  const reservado = disponivel === false;
  const tamanhos =
    bolo.andaresMin === bolo.andaresMax
      ? `${bolo.andaresMin} andares`
      : `${bolo.andaresMin} a ${bolo.andaresMax} andares`;

  return (
    <article className="flex flex-col gap-3">
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-rosa ${
          reservado ? "opacity-60 grayscale" : ""
        }`}
      >
        {foto ? (
          <Image src={foto} alt={bolo.nome} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-sm text-ameixa-suave">Foto em breve</span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold">{bolo.tema}</span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg font-semibold">{bolo.nome}</h3>
        <p className="text-sm text-ameixa-suave">
          {tamanhos}
          {bolo.decoracoes.length > 0 && ` · ${bolo.decoracoes.join(", ")}`}
        </p>

        <dl className={`mt-1 flex gap-0.5 ${modo === "compra" ? "flex-col-reverse" : "flex-col"}`}>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-sm text-ameixa-suave">Aluguel a partir de</dt>
            <dd className="font-bold">{formatarPreco(bolo.menorPrecoLocacao)}</dd>
          </div>
          {bolo.menorPrecoVenda !== null && (
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-sm text-ameixa-suave">Compra a partir de</dt>
              <dd className="font-bold">{formatarPreco(bolo.menorPrecoVenda)}</dd>
            </div>
          )}
        </dl>

        {disponivel === true && (
          <p className="flex items-center gap-1.5 text-sm font-bold text-folha">
            <Check size={16} /> Livre na sua data
          </p>
        )}
        {reservado && (
          <p className="flex items-center gap-1.5 text-sm font-bold text-alerta">
            <CircleSlash size={16} /> Reservado nessa data
          </p>
        )}
      </div>

      {modo === "compra" ? (
        <Link
          href={`/bolo/${bolo.codigo}#comprar`}
          className="grid h-12 place-items-center rounded-xl bg-framboesa font-bold text-white hover:bg-framboesa-escura"
        >
          Ver e comprar
        </Link>
      ) : (
        <Link
          href={`/bolo/${bolo.codigo}`}
          className={`grid h-12 place-items-center rounded-xl font-bold ${
            reservado
              ? "border-2 border-ameixa bg-white text-ameixa"
              : "bg-framboesa text-white hover:bg-framboesa-escura"
          }`}
        >
          {reservado ? "Ver datas livres" : "Escolher tamanho e data"}
        </Link>
      )}
    </article>
  );
}
