import Link from "next/link";
import { CalendarX } from "lucide-react";
import { bolosLivresNaData } from "@/lib/alternativas";
import { diaPorExtenso } from "@/lib/calendario";
import { formatarPreco } from "@/lib/formatar";
import type { BoloVitrine } from "@/types/catalogo";
import type { Reserva } from "@/types/reserva";

type Props = {
  festa: string;
  escolhido: BoloVitrine;
  outros: BoloVitrine[];
  reservas: Reserva[];
};

// Aparece quando a cliente toca num dia em que este bolo já está reservado
export function LivresNaData({ festa, escolhido, outros, reservas }: Props) {
  const livres = bolosLivresNaData(outros, festa, reservas, escolhido);
  const dia = diaPorExtenso(festa);

  return (
    <section aria-live="polite" aria-labelledby="livres-titulo" className="flex flex-col gap-3 rounded-2xl bg-pessego/50 p-5">
      <h3 id="livres-titulo" className="flex items-center gap-2 font-display text-lg font-semibold">
        <CalendarX size={20} aria-hidden /> O {escolhido.nome} já está reservado em {dia}
      </h3>

      {livres.length > 0 ? (
        <>
          <p>Estes bolos estão livres nessa data:</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {livres.map((bolo) => (
              <li key={bolo.codigo}>
                <Link
                  href={{ pathname: `/bolo/${bolo.codigo}`, query: { festa } }}
                  className="flex h-full flex-col rounded-xl border border-linha bg-white p-3 hover:border-framboesa"
                >
                  <strong>{bolo.nome}</strong>
                  <span className="text-sm text-ameixa-suave">Tema {bolo.tema}</span>
                  <span className="mt-1 text-sm">
                    A partir de <strong>{formatarPreco(bolo.menorPrecoLocacao)}</strong>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={{ pathname: "/alugar", query: { data: festa } }} className="font-bold text-framboesa hover:underline">
            Ver todos os bolos livres em {dia}
          </Link>
        </>
      ) : (
        <p>
          Nenhum outro bolo do acervo está livre nessa data.{" "}
          <Link href="/encomenda" className="font-bold text-framboesa underline">
            Que tal encomendar um bolo novo?
          </Link>
        </p>
      )}
    </section>
  );
}
