"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCarrinho } from "@/hooks/useCarrinho";
import { diaPorExtenso, primeiraMaiuscula } from "@/lib/calendario";
import { resumoDoCarrinho } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/formatar";
import { calcularPeriodo } from "@/lib/periodo";

// "2026-10-30" → "Sexta-feira, 30/10"
function dia(iso: string) {
  return primeiraMaiuscula(diaPorExtenso(iso));
}

export function Carrinho() {
  const { itens, remover } = useCarrinho();

  if (itens === null) {
    return <p className="mt-6 text-ameixa-suave">Carregando…</p>;
  }

  if (itens.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-linha p-8">
        <p className="text-lg">Sua reserva está vazia.</p>
        <Link
          href="/alugar"
          className="grid h-12 place-items-center rounded-xl bg-framboesa px-6 font-bold text-white hover:bg-framboesa-escura"
        >
          Ver bolos para alugar
        </Link>
      </div>
    );
  }

  const resumo = resumoDoCarrinho(itens);

  return (
    <div className="mt-8 grid items-start gap-8 md:grid-cols-[1fr_340px]">
      <ul className="flex flex-col gap-4">
        {itens.map((item) => {
          const periodo = calcularPeriodo(item.festa);
          return (
            <li key={`${item.codigo}-${item.festa}`} className="flex gap-4 rounded-2xl border border-linha p-4">
              <div aria-hidden="true" className="h-28 w-22 shrink-0 rounded-xl bg-rosa" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={`/bolo/${item.codigo}`}
                  className="font-display text-lg font-semibold hover:text-framboesa"
                >
                  {item.nome}
                </Link>
                <p className="text-sm text-ameixa-suave">Ref. {item.codigo}</p>
                <p className="text-sm">
                  <strong>Festa:</strong> {dia(item.festa)}
                </p>
                <p className="text-sm">
                  <strong>Retirada:</strong> {dia(periodo.retirada)} · <strong>Devolução:</strong>{" "}
                  {dia(periodo.devolucao)}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <span className="font-bold">{formatarPreco(item.precoLocacao)}</span>
                <button
                  type="button"
                  onClick={() => remover(item.codigo, item.festa)}
                  aria-label={`Remover ${item.nome}`}
                  className="grid size-11 place-items-center rounded-full text-ameixa-suave hover:bg-blush hover:text-alerta"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <aside aria-label="Resumo" className="flex flex-col gap-3 rounded-2xl bg-blush p-5">
        <h2 className="font-display text-xl font-semibold">Resumo</h2>
        <p className="flex justify-between">
          <span>Locação</span>
          <span>{formatarPreco(resumo.locacao)}</span>
        </p>
        <p className="flex justify-between">
          <span>Taxa de segurança (devolvida)</span>
          <span>{formatarPreco(resumo.taxas)}</span>
        </p>
        <hr className="border-linha" />
        <p className="flex items-baseline justify-between">
          <strong>Pagar agora (sinal de 50%)</strong>
          <strong className="font-display text-2xl">{formatarPreco(resumo.sinal)}</strong>
        </p>
        <p className="flex justify-between text-sm text-ameixa-suave">
          <span>Na retirada</span>
          <span>{formatarPreco(resumo.naRetirada)}</span>
        </p>
        <Link
          href="/checkout"
          className="mt-2 grid h-14 place-items-center rounded-xl bg-framboesa text-lg font-bold text-white hover:bg-framboesa-escura"
        >
          Continuar
        </Link>
        <Link href="/alugar" className="text-center font-bold text-framboesa hover:underline">
          Adicionar outro bolo
        </Link>
      </aside>
    </div>
  );
}