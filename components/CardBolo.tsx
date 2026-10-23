import Image from "next/image";
import Link from "next/link";
import { Check, CircleSlash } from "lucide-react";
import type { Bolo, TipoBolo } from "@/types/bolo";
import { formatarPreco } from "@/lib/formatar";

type CardBoloProps = {
  bolo: Bolo;
  // true = livre na data escolhida · false = reservado · sem valor = nenhuma data escolhida
  disponivel?: boolean;
};

const nomeDoTipo: Record<TipoBolo, string> = {
  bolo: "Bolo",
  mini_kit: "Mini kit",
  kit_completo: "Kit completo",
};

export function CardBolo({ bolo, disponivel }: CardBoloProps) {
  const reservado = disponivel === false;

  const detalhe =
    bolo.tipo === "bolo"
      ? `${bolo.andares} ${bolo.andares === 1 ? "andar" : "andares"}`
      : bolo.itensKit?.join(", ");

  return (
    <article className="flex flex-col gap-3">
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-rosa ${
          reservado ? "opacity-60 grayscale" : ""
        }`}
      >
        {bolo.foto ? (
          <Image
            src={bolo.foto}
            alt={bolo.nome}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center text-sm text-ameixa-suave">
            Foto em breve
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold">
          {nomeDoTipo[bolo.tipo]}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg font-semibold">{bolo.nome}</h3>
        <p className="text-sm text-ameixa-suave">
          Ref. {bolo.codigo}
          {detalhe && ` · ${detalhe}`}
        </p>

        <dl className="mt-1 flex flex-col gap-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-sm text-ameixa-suave">Aluguel</dt>
            <dd className="font-bold">{formatarPreco(bolo.precoLocacao)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-sm text-ameixa-suave">Compra</dt>
            <dd className="font-bold">{formatarPreco(bolo.precoVenda)}</dd>
          </div>
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

      <Link
        href={`/bolo/${bolo.codigo}`}
        className={`grid h-12 place-items-center rounded-xl font-bold ${
          reservado
            ? "border-2 border-ameixa bg-white text-ameixa"
            : "bg-framboesa text-white hover:bg-framboesa-escura"
        }`}
      >
        {reservado ? "Ver datas livres" : "Alugar ou comprar"}
      </Link>
    </article>
  );
}