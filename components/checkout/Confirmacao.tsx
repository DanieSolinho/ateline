"use client";

import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { useUltimoPedido } from "@/hooks/useUltimoPedido";
import { diaPorExtenso, primeiraMaiuscula } from "@/lib/calendario";
import { formatarPreco } from "@/lib/formatar";
import { calcularPeriodo } from "@/lib/periodo";

function dia(iso: string) {
  return primeiraMaiuscula(diaPorExtenso(iso));
}

export function Confirmacao() {
  const pedido = useUltimoPedido();

  if (pedido === undefined) return <p className="text-ameixa-suave">Carregando…</p>;

  if (pedido === null) {
    return (
      <p>
        Nenhuma reserva encontrada.{" "}
        <Link href="/alugar" className="font-bold text-framboesa hover:underline">Ver bolos para alugar</Link>
      </p>
    );
  }

  const primeiroNome = pedido.cliente.nome.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <CircleCheck size={48} className="text-folha" aria-hidden="true" />
        <h1 className="font-display text-4xl font-bold">Reserva confirmada, {primeiroNome}!</h1>
        <p className="text-lg text-ameixa-suave">
          Pedido <strong className="text-ameixa">{pedido.numero}</strong>. O contrato e os detalhes vão para{" "}
          {pedido.cliente.email} e para o seu WhatsApp.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {pedido.itens.map((item) => {
          const periodo = calcularPeriodo(item.festa);
          return (
            <li key={`${item.codigo}-${item.festa}`} className="rounded-2xl border border-linha p-4">
              <p className="font-display text-lg font-semibold">{item.nome}</p>
              <p className="text-sm">
                <strong>Retirada:</strong> {dia(periodo.retirada)} · <strong>Festa:</strong> {dia(item.festa)} ·{" "}
                <strong>Devolução:</strong> {dia(periodo.devolucao)}
              </p>
            </li>
          );
        })}
      </ul>

      <dl className="grid gap-3 rounded-2xl bg-blush p-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ameixa-suave">Sinal pago ({pedido.cliente.pagamento === "pix" ? "Pix" : "cartão"})</dt>
          <dd className="font-display text-2xl font-bold">{formatarPreco(pedido.sinal)}</dd>
        </div>
        <div>
          <dt className="text-sm text-ameixa-suave">A pagar na retirada</dt>
          <dd className="font-display text-2xl font-bold">{formatarPreco(pedido.naRetirada)}</dd>
        </div>
      </dl>

      <p className="text-sm text-ameixa-suave">
        Versão de demonstração: o pagamento foi simulado. No site oficial, aqui aparece o comprovante do Mercado Pago.
      </p>

      <Link href="/" className="self-start font-bold text-framboesa hover:underline">
        Voltar para o início
      </Link>
    </div>
  );
}