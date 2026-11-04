"use client";

import { useEffect, useState } from "react";
import { Eye, UsersRound } from "lucide-react";
import { nomeDaPeca } from "@/lib/catalogo";
import {
  bolosMaisVistos,
  nomeDoMesCurto,
  resumoDeClientes,
  variacao,
  vistosSemAluguel,
  type DadosDeClientes,
} from "@/lib/relatorios";
import { supabase } from "@/lib/supabase";

type Props = { hoje: string; alugueisPorBolo: Map<string, number> };

// Clientes (total, novas, que voltaram) e bolos mais vistos no site
export function RelatorioClientes({ hoje, alugueisPorBolo }: Props) {
  const [dados, setDados] = useState<DadosDeClientes | null | undefined>(undefined);

  useEffect(() => {
    let ativo = true;
    supabase.rpc("dados_de_clientes_e_visualizacoes").then(({ data, error }) => {
      if (ativo) setDados(error ? null : (data as DadosDeClientes));
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (dados === undefined) return <p className="text-ameixa-suave">Carregando clientes…</p>;
  if (dados === null) {
    return (
      <p role="alert" className="rounded-xl bg-[#fce9df] p-4 font-semibold text-alerta">
        Não deu para carregar clientes e visualizações. Se o arquivo 11 do banco ainda não foi rodado no Supabase, rode
        e recarregue.
      </p>
    );
  }

  const clientes = resumoDeClientes(dados.clientes, hoje);
  const maisVistos = bolosMaisVistos(dados.visualizacoes, alugueisPorBolo);
  const semAluguel = vistosSemAluguel(maisVistos);
  const totalDeVistas = dados.visualizacoes.reduce((soma, v) => soma + (v.ultimos30 ?? 0), 0);
  const totalAnterior = dados.visualizacoes.reduce((soma, v) => soma + (v.anteriores30 ?? 0), 0);
  const maiorMes = Math.max(1, ...clientes.novosPorMes.map((m) => m.novos));
  const maisVisto = Math.max(1, ...maisVistos.map((v) => v.vistas));

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Numero rotulo="Clientes" valor={String(clientes.total)} detalhe="com pedido pago pelo site" />
        <Numero
          rotulo="Novas clientes este mês"
          valor={String(clientes.novosEsteMes)}
          detalhe={`${variacao(clientes.novosEsteMes, clientes.novosMesPassado)} em relação ao mês passado (${clientes.novosMesPassado})`}
        />
        <Numero rotulo="Clientes que voltaram" valor={String(clientes.voltaram)} detalhe="fizeram mais de um pedido" />
        <Numero
          rotulo="Visualizações de bolos"
          valor={String(totalDeVistas)}
          detalhe={`últimos 30 dias · ${variacao(totalDeVistas, totalAnterior)} em relação aos 30 anteriores`}
        />
      </dl>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section aria-labelledby="rel-novas" className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
          <h2 id="rel-novas" className="flex items-center gap-2 font-display text-xl font-semibold">
            <UsersRound size={20} aria-hidden /> Novas clientes por mês
          </h2>
          <ul className="flex flex-col gap-2">
            {clientes.novosPorMes.map((m) => (
              <li key={m.mes} className="grid grid-cols-[3.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="font-semibold">{nomeDoMesCurto(m.mes)}</span>
                <span className="h-5 rounded-md bg-blush" aria-hidden>
                  <span className="block h-full rounded-md bg-folha" style={{ width: `${(m.novos / maiorMes) * 100}%` }} />
                </span>
                <span className="text-right font-bold">{m.novos}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="rel-vistos" className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
          <h2 id="rel-vistos" className="flex items-center gap-2 font-display text-xl font-semibold">
            <Eye size={20} aria-hidden /> Bolos mais vistos (30 dias)
          </h2>
          {maisVistos.length === 0 ? (
            <p className="text-sm text-ameixa-suave">
              Ainda não há visualizações. Elas começam a contar quando as clientes abrem a página de um bolo.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {maisVistos.map((v, indice) => (
                <li key={v.codigo} className="grid grid-cols-[1.5rem_minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                  <span className="text-ameixa-suave">{indice + 1}º</span>
                  <span className="truncate font-semibold">{nomeDaPeca(v.codigo)}</span>
                  <span className="h-5 rounded-md bg-blush" aria-hidden>
                    <span className="block h-full rounded-md bg-framboesa" style={{ width: `${(v.vistas / maisVisto) * 100}%` }} />
                  </span>
                  <span className="text-right">
                    <strong>{v.vistas}</strong>{" "}
                    <span className="text-xs text-ameixa-suave">
                      {variacao(v.vistas, v.anteriores)} · {v.alugueis} {v.alugueis === 1 ? "aluguel" : "aluguéis"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          {semAluguel.length > 0 && (
            <p className="rounded-xl bg-pessego/60 p-3 text-sm">
              <strong>Muito vistos e nenhum aluguel em 12 meses:</strong>{" "}
              {semAluguel.map((v) => nomeDaPeca(v.codigo)).join(", ")}. As clientes se interessam, mas não fecham: vale
              rever foto, preço ou descrição.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <div className="rounded-2xl bg-blush p-4">
      <dt className="text-sm text-ameixa-suave">{rotulo}</dt>
      <dd className="font-display text-2xl font-bold">{valor}</dd>
      <dd className="text-xs text-ameixa-suave">{detalhe}</dd>
    </div>
  );
}
