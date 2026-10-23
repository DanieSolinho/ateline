"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCarrinho } from "@/hooks/useCarrinho";
import { diaPorExtenso, primeiraMaiuscula } from "@/lib/calendario";
import { chaveDoItem, resumoDoCarrinho, totalDoItem } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/formatar";
import { calcularPeriodo } from "@/lib/periodo";
import type { ItemCarrinho } from "@/types/carrinho";

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
        <p className="text-lg">Seu pedido está vazio.</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/alugar"
            className="grid h-12 place-items-center rounded-xl bg-framboesa px-6 font-bold text-white hover:bg-framboesa-escura"
          >
            Ver bolos para alugar
          </Link>
          <Link
            href="/comprar"
            className="grid h-12 place-items-center rounded-xl border-2 border-ameixa px-6 font-bold hover:bg-blush"
          >
            Ver bolos à venda
          </Link>
        </div>
      </div>
    );
  }

  const resumo = resumoDoCarrinho(itens);

  return (
    <div className="mt-8 grid items-start gap-8 md:grid-cols-[1fr_340px]">
      <ul className="flex flex-col gap-4">
        {itens.map((item) => (
          <li key={chaveDoItem(item)} className="flex gap-4 rounded-2xl border border-linha p-4">
            <div aria-hidden="true" className="h-28 w-22 shrink-0 rounded-xl bg-rosa" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="self-start rounded-full bg-blush px-2.5 py-0.5 text-xs font-bold">
                {item.tipo === "aluguel" ? "Aluguel" : "Compra"}
              </span>
              <Link
                href={`/bolo/${item.codigoBolo}`}
                className="font-display text-lg font-semibold hover:text-framboesa"
              >
                {item.nome}
              </Link>
              <DetalhesDoItem item={item} />
            </div>
            <div className="flex flex-col items-end justify-between">
              <span className="font-bold">{formatarPreco(totalDoItem(item))}</span>
              <button
                type="button"
                onClick={() => remover(chaveDoItem(item))}
                aria-label={`Remover ${item.nome}`}
                className="grid size-11 place-items-center rounded-full text-ameixa-suave hover:bg-blush hover:text-alerta"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <aside aria-label="Resumo" className="flex flex-col gap-3 rounded-2xl bg-blush p-5">
        <h2 className="font-display text-xl font-semibold">Resumo</h2>
        {resumo.temAluguel && (
          <>
            <p className="flex justify-between">
              <span>Locação</span>
              <span>{formatarPreco(resumo.locacao)}</span>
            </p>
            <p className="flex justify-between">
              <span>Taxa de segurança (devolvida)</span>
              <span>{formatarPreco(resumo.taxas)}</span>
            </p>
          </>
        )}
        {resumo.temCompra && (
          <p className="flex justify-between">
            <span>Compra</span>
            <span>{formatarPreco(resumo.compras)}</span>
          </p>
        )}
        <hr className="border-linha" />
        <p className="flex items-baseline justify-between gap-2">
          <strong>Pagar agora</strong>
          <strong className="font-display text-2xl">{formatarPreco(resumo.pagarAgora)}</strong>
        </p>
        <p className="text-sm text-ameixa-suave">
          Sinal de 50%.
          {resumo.temCompra && " O frete por transportadora, se houver envio, é orçado no WhatsApp."}
        </p>
        {resumo.temAluguel && (
          <p className="flex justify-between text-sm text-ameixa-suave">
            <span>Na retirada do aluguel</span>
            <span>{formatarPreco(resumo.naRetirada)}</span>
          </p>
        )}
        {resumo.temCompra && (
          <p className="flex justify-between gap-2 text-sm text-ameixa-suave">
            <span>Restante da compra (retirada ou antes do envio)</span>
            <span>{formatarPreco(resumo.restanteCompras)}</span>
          </p>
        )}
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

function DetalhesDoItem({ item }: { item: ItemCarrinho }) {
  if (item.tipo === "compra") {
    return (
      <>
        {item.personalizacao && <p className="text-sm text-ameixa-suave">{item.personalizacao}</p>}
        <p className="text-sm">O bolo fica com você. Retirada na loja ou envio por transportadora.</p>
      </>
    );
  }

  const periodo = calcularPeriodo(item.festa);
  return (
    <>
      {(item.topo || item.base) && (
        <p className="text-sm text-ameixa-suave">
          Com {[item.topo?.nome, item.base?.nome].filter(Boolean).join(" e ").toLowerCase()}
        </p>
      )}
      {item.personalizacao && <p className="text-sm text-ameixa-suave">{item.personalizacao}</p>}
      <p className="text-sm">
        <strong>Festa:</strong> {dia(item.festa)}
      </p>
      <p className="text-sm">
        <strong>Retirada:</strong> {dia(periodo.retirada)} · <strong>Devolução:</strong> {dia(periodo.devolucao)}
      </p>
    </>
  );
}
