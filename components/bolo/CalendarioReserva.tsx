"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHoje } from "@/hooks/useHoje";
import { diasDoMes, nomeDoMes, primeiraMaiuscula, rotuloDoDia } from "@/lib/calendario";
import { calcularPeriodo, estaDisponivel } from "@/lib/periodo";
import type { Reserva } from "@/types/reserva";

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];


type Situacao = "livre" | "reservado" | "passado";

function situacaoDoDia(iso: string, hoje: string, codigo: string, reservas: Reserva[]): Situacao {
  const periodo = calcularPeriodo(iso);
  if (periodo.retirada <= hoje) return "passado"; // a retirada já passou ou é hoje
  if (!estaDisponivel(codigo, iso, reservas)) return "reservado";
  return "livre";
}

type Props = {
  codigo: string; // o bolo físico que vai ser reservado
  reservas: Reserva[];
  festa: string | null; // a data escolhida (quem controla é o componente de cima)
  aoEscolher: (iso: string) => void;
  // Opcional: tocar num dia reservado mostra outros bolos livres naquele dia
  ocupada?: string | null;
  aoEscolherOcupada?: (iso: string) => void;
};

export function CalendarioReserva({ codigo, reservas, festa, aoEscolher, ocupada, aoEscolherOcupada }: Props) {
  const hoje = useHoje();
  const [mesEscolhido, setMesEscolhido] = useState<{ ano: number; mes: number } | null>(null);

  if (!hoje) {
    return <p className="rounded-2xl border border-linha p-5 text-ameixa-suave">Carregando calendário…</p>;
  }

  const [anoHoje, mesHoje] = hoje.split("-").map(Number);
  // Abre no mês da festa já escolhida (ex.: veio de um link com a data), senão no mês atual
  const mesInicial = festa ? { ano: Number(festa.slice(0, 4)), mes: Number(festa.slice(5, 7)) - 1 } : null;
  const { ano, mes } = mesEscolhido ?? mesInicial ?? { ano: anoHoje, mes: mesHoje - 1 };
  const estaNoMesAtual = ano === anoHoje && mes === mesHoje - 1;
  const periodo = festa ? calcularPeriodo(festa) : null;

  function mudarMes(quantos: number) {
    const data = new Date(Date.UTC(ano, mes + quantos, 1));
    setMesEscolhido({ ano: data.getUTCFullYear(), mes: data.getUTCMonth() });
  }

  return (
    <section aria-labelledby="titulo-calendario" className="flex flex-col gap-4 rounded-2xl border border-linha p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="titulo-calendario" className="font-display text-lg font-semibold">
          Dia da festa
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            disabled={estaNoMesAtual}
            aria-label="Mês anterior"
            className="grid size-11 place-items-center rounded-full hover:bg-blush disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-36 text-center font-bold">{primeiraMaiuscula(nomeDoMes(ano, mes))}</span>
          <button
            type="button"
            onClick={() => mudarMes(1)}
            aria-label="Próximo mês"
            className="grid size-11 place-items-center rounded-full hover:bg-blush"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {SEMANA.map((letra, indice) => (
          <span key={indice} aria-hidden="true" className="py-1 text-xs font-bold text-ameixa-suave">
            {letra}
          </span>
        ))}

        {diasDoMes(ano, mes).map((iso, indice) => {
          if (!iso) return <span key={`vazio-${indice}`} />;

          const situacao = situacaoDoDia(iso, hoje, codigo, reservas);
          const ehFesta = iso === festa;
          const ehRetiradaOuDevolucao =
            periodo !== null && (iso === periodo.retirada || iso === periodo.devolucao);
          const reservadoClicavel = situacao === "reservado" && aoEscolherOcupada !== undefined;
          const bloqueado = situacao !== "livre" && !reservadoClicavel;

          let estilo = "border border-linha hover:border-framboesa";
          if (situacao !== "livre") estilo = "bg-[#ede7e9] text-ameixa-suave";
          if (situacao === "reservado") estilo += " line-through";
          if (reservadoClicavel) estilo += " hover:ring-2 hover:ring-framboesa";
          if (iso === ocupada) estilo = "bg-ameixa text-white line-through";
          if (ehRetiradaOuDevolucao) estilo = "bg-pessego";
          if (ehFesta) estilo = "bg-framboesa text-white";

          return (
            <button
              key={iso}
              type="button"
              disabled={bloqueado}
              aria-pressed={ehFesta || iso === ocupada}
              aria-label={`${rotuloDoDia(iso)}${
                situacao === "reservado" ? (reservadoClicavel ? ", reservado: ver outros bolos livres" : ", reservado") : ""
              }`}
              onClick={() => (situacao === "reservado" ? aoEscolherOcupada?.(iso) : aoEscolher(iso))}
              className={`h-11 rounded-xl font-bold disabled:cursor-not-allowed ${estilo}`}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ameixa-suave">
        <span className="flex items-center gap-1.5">
          <i className="size-3 rounded bg-framboesa" /> Festa
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-3 rounded bg-pessego" /> Retirada e devolução
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-3 rounded bg-[#ede7e9]" /> Indisponível
        </span>
      </div>
      {aoEscolherOcupada && (
        <p className="text-sm text-ameixa-suave">Tocou num dia riscado? Mostramos outros bolos livres nessa data.</p>
      )}
    </section>
  );
}
