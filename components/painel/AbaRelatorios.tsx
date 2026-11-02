"use client";

import { useEffect, useState } from "react";
import dados from "@/data/catalogo.json";
import { nomeDaPeca } from "@/lib/catalogo";
import { formatarPreco } from "@/lib/formatar";
import { supabase } from "@/lib/supabase";
import {
  faturamentoPorMes,
  festasPorDiaDaSemana,
  nomeDoMesCurto,
  rankingDeBolos,
  type DadosDoRelatorio,
} from "@/lib/relatorios";
import type { Catalogo } from "@/types/catalogo";

const BOLOS_DO_ACERVO = (dados as Catalogo).bolos
  .filter((bolo) => bolo.status !== "inativo")
  .map((bolo) => bolo.codigo);

export function AbaRelatorios() {
  const [relatorio, setRelatorio] = useState<DadosDoRelatorio | null | undefined>(undefined);

  useEffect(() => {
    let ativo = true;
    supabase.rpc("dados_do_relatorio").then(({ data, error }) => {
      if (ativo) setRelatorio(error ? null : (data as DadosDoRelatorio));
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (relatorio === undefined) return <p className="text-ameixa-suave">Carregando…</p>;
  if (relatorio === null) {
    return (
      <p role="alert" className="rounded-xl bg-[#fce9df] p-4 font-semibold text-alerta">
        Não deu para carregar os relatórios. Confira a internet e tente de novo.
      </p>
    );
  }

  const meses = faturamentoPorMes(relatorio.pedidos);
  const ranking = rankingDeBolos(relatorio.reservas, BOLOS_DO_ACERVO);
  const dias = festasPorDiaDaSemana(relatorio.reservas, BOLOS_DO_ACERVO);
  const total = meses.reduce((soma, m) => soma + m.aluguel + m.venda, 0);
  const alugueis = ranking.reduce((soma, b) => soma + b.alugueis, 0);
  const maiorMes = Math.max(1, ...meses.map((m) => m.aluguel + m.venda));
  const maisAlugado = Math.max(1, ...ranking.map((b) => b.alugueis));
  const maiorDia = Math.max(1, ...dias.map((d) => d.festas));
  const nuncaSairam = ranking.filter((b) => b.alugueis === 0);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ameixa-suave">
        Últimos 12 meses. Os valores são dos pedidos pagos pelo site; as reservas feitas pelo WhatsApp entram no ranking
        e nos dias da semana.
      </p>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Numero rotulo="Faturamento pelo site" valor={formatarPreco(total)} />
        <Numero rotulo="Aluguéis de bolos" valor={String(alugueis)} />
        <Numero rotulo="Bolos que nunca saíram" valor={String(nuncaSairam.length)} />
      </dl>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section aria-labelledby="rel-meses" className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
          <h2 id="rel-meses" className="font-display text-xl font-semibold">
            Faturamento por mês
          </h2>
          {meses.length === 0 ? (
            <p className="text-sm text-ameixa-suave">Ainda não há pedidos pagos pelo site.</p>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {meses.map((m) => (
                  <li key={m.mes} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 text-sm">
                    <span className="font-semibold">{nomeDoMesCurto(m.mes)}</span>
                    <span className="flex h-5 overflow-hidden rounded-md bg-blush" aria-hidden>
                      <span className="bg-framboesa" style={{ width: `${(m.aluguel / maiorMes) * 100}%` }} />
                      <span className="bg-pessego" style={{ width: `${(m.venda / maiorMes) * 100}%` }} />
                    </span>
                    <span className="text-right font-bold">
                      {formatarPreco(m.aluguel + m.venda)}
                      <span className="sr-only">
                        {" "}
                        (aluguel {formatarPreco(m.aluguel)}, venda {formatarPreco(m.venda)})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="flex gap-4 text-xs text-ameixa-suave" aria-hidden>
                <span className="flex items-center gap-1.5">
                  <i className="size-3 rounded bg-framboesa" /> Aluguel
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-3 rounded bg-pessego" /> Venda
                </span>
              </p>
            </>
          )}
        </section>

        <section aria-labelledby="rel-dias" className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
          <h2 id="rel-dias" className="font-display text-xl font-semibold">
            Festas por dia da semana
          </h2>
          <ul className="flex flex-col gap-2">
            {dias.map((d) => (
              <li key={d.dia} className="grid grid-cols-[5rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="font-semibold">{d.dia}</span>
                <span className="h-5 rounded-md bg-blush" aria-hidden>
                  <span
                    className="block h-full rounded-md bg-ameixa"
                    style={{ width: `${(d.festas / maiorDia) * 100}%` }}
                  />
                </span>
                <span className="text-right font-bold">{d.festas}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="rel-ranking"
          className="flex flex-col gap-3 rounded-2xl border border-linha p-5 lg:col-span-2"
        >
          <h2 id="rel-ranking" className="font-display text-xl font-semibold">
            Bolos mais alugados
          </h2>
          <ol className="flex flex-col gap-2">
            {ranking
              .filter((b) => b.alugueis > 0)
              .slice(0, 10)
              .map((b, indice) => (
                <li
                  key={b.codigo}
                  className="grid grid-cols-[1.5rem_minmax(0,12rem)_1fr_2.5rem] items-center gap-3 text-sm"
                >
                  <span className="text-ameixa-suave">{indice + 1}º</span>
                  <span className="truncate font-semibold">{nomeDaPeca(b.codigo)}</span>
                  <span className="h-5 rounded-md bg-blush" aria-hidden>
                    <span
                      className="block h-full rounded-md bg-framboesa"
                      style={{ width: `${(b.alugueis / maisAlugado) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-bold">{b.alugueis}</span>
                </li>
              ))}
          </ol>
          {nuncaSairam.length > 0 && (
            <p className="text-sm">
              <strong>Nunca alugados nos últimos 12 meses:</strong>{" "}
              {nuncaSairam.map((b) => nomeDaPeca(b.codigo)).join(", ")}. Vale pensar em divulgar, vender ou refazer.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-blush p-4">
      <dt className="text-sm text-ameixa-suave">{rotulo}</dt>
      <dd className="font-display text-2xl font-bold">{valor}</dd>
    </div>
  );
}
