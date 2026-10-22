"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCarrinho } from "@/hooks/useCarrinho";
import {
  diaPorExtenso,
  diasDoMes,
  hojeIso,
  horarioDaLoja,
  nomeDoMes,
  primeiraMaiuscula,
} from "@/lib/calendario";
import { formatarPreco } from "@/lib/formatar";
import { calcularPeriodo, estaDisponivel } from "@/lib/periodo";
import { PERCENTUAL_SINAL, TAXA_SEGURANCA } from "@/lib/regras";
import type { Bolo } from "@/types/bolo";
import type { Reserva } from "@/types/reserva";

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

// "Hoje" só existe no navegador. No servidor devolvemos null e o calendário espera.
const naoMuda = () => () => {};
const hojeNoServidor = () => null;

type Situacao = "livre" | "reservado" | "passado";

function situacaoDoDia(iso: string, hoje: string, bolo: Bolo, reservas: Reserva[]): Situacao {
  const periodo = calcularPeriodo(iso);
  if (periodo.retirada <= hoje) return "passado"; // a retirada já passou ou é hoje
  if (!estaDisponivel(bolo.codigo, iso, reservas)) return "reservado";
  return "livre";
}

type Props = { bolo: Bolo; reservas: Reserva[] };

export function CalendarioReserva({ bolo, reservas }: Props) {
  const hoje = useSyncExternalStore(naoMuda, hojeIso, hojeNoServidor);
  const [mesEscolhido, setMesEscolhido] = useState<{ ano: number; mes: number } | null>(null);
  const [festa, setFesta] = useState<string | null>(null);
  const { adicionar } = useCarrinho();
  const router = useRouter();

  if (!hoje) {
    return <p className="rounded-2xl border border-linha p-5 text-ameixa-suave">Carregando calendário…</p>;
  }

  const [anoHoje, mesHoje] = hoje.split("-").map(Number);
  const { ano, mes } = mesEscolhido ?? { ano: anoHoje, mes: mesHoje - 1 };
  const estaNoMesAtual = ano === anoHoje && mes === mesHoje - 1;

  function mudarMes(quantos: number) {
    const data = new Date(Date.UTC(ano, mes + quantos, 1));
    setMesEscolhido({ ano: data.getUTCFullYear(), mes: data.getUTCMonth() });
  }

  const periodo = festa ? calcularPeriodo(festa) : null;
  const locacao = bolo.precoLocacao ?? 0;
  const sinal = locacao * PERCENTUAL_SINAL;
  const naRetirada = locacao - sinal + TAXA_SEGURANCA;

  function reservar() {
    if (!festa) return;
    adicionar({ codigo: bolo.codigo, nome: bolo.nome, precoLocacao: locacao, festa });
    router.push("/carrinho");
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="titulo-calendario" className="flex flex-col gap-4 rounded-2xl border border-linha p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="titulo-calendario" className="font-display text-lg font-semibold">
            Escolha o dia da festa
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

            const situacao = situacaoDoDia(iso, hoje, bolo, reservas);
            const ehFesta = iso === festa;
            const ehRetiradaOuDevolucao =
              periodo !== null && (iso === periodo.retirada || iso === periodo.devolucao);
            const bloqueado = situacao !== "livre";

            let estilo = "border border-linha hover:border-framboesa";
            if (bloqueado) estilo = "bg-[#ede7e9] text-ameixa-suave";
            if (situacao === "reservado") estilo += " line-through";
            if (ehRetiradaOuDevolucao) estilo = "bg-pessego";
            if (ehFesta) estilo = "bg-framboesa text-white";

            return (
              <button
                key={iso}
                type="button"
                disabled={bloqueado}
                aria-pressed={ehFesta}
                aria-label={`${diaPorExtenso(iso)}${situacao === "reservado" ? ", reservado" : ""}`}
                onClick={() => setFesta(iso)}
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
      </section>

      {periodo ? (
        <section aria-live="polite" className="flex flex-col gap-3 rounded-2xl bg-blush p-5">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ameixa-suave">Retirada</dt>
              <dd className="font-bold">{primeiraMaiuscula(diaPorExtenso(periodo.retirada))}</dd>
              <dd className="text-sm text-ameixa-suave">{horarioDaLoja(periodo.retirada, "retirada")}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ameixa-suave">Devolução</dt>
              <dd className="font-bold">{primeiraMaiuscula(diaPorExtenso(periodo.devolucao))}</dd>
              <dd className="text-sm text-ameixa-suave">{horarioDaLoja(periodo.devolucao, "devolucao")}</dd>
            </div>
          </dl>
          <hr className="border-linha" />
          <p className="flex justify-between">
            <span>Sinal agora (50%)</span>
            <strong>{formatarPreco(sinal)}</strong>
          </p>
          <p className="flex justify-between">
            <span>Na retirada: restante + taxa de segurança</span>
            <strong>{formatarPreco(naRetirada)}</strong>
          </p>
          <button
            type="button"
            onClick={reservar}
            className="mt-2 h-14 rounded-xl bg-framboesa text-lg font-bold text-white hover:bg-framboesa-escura"
          >
            Reservar e pagar sinal de {formatarPreco(sinal)}
          </button>
        </section>
      ) : (
        <p className="rounded-2xl bg-blush p-5 text-ameixa-suave">
          Escolha um dia livre no calendário para ver as datas de retirada e devolução.
        </p>
      )}
    </div>
  );
}