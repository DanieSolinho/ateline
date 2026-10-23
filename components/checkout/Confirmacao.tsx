"use client";

import Link from "next/link";
import { CircleCheck, MessageCircle } from "lucide-react";
import { useUltimoPedido } from "@/hooks/useUltimoPedido";
import { diaPorExtenso, primeiraMaiuscula } from "@/lib/calendario";
import { chaveDoItem } from "@/lib/carrinho";
import { formatarCep } from "@/lib/cep";
import { linkWhatsApp } from "@/lib/contato";
import { formatarPreco } from "@/lib/formatar";
import { mensagemOrcamentoFrete } from "@/lib/frete";
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
        Nenhum pedido encontrado.{" "}
        <Link href="/alugar" className="font-bold text-framboesa hover:underline">Ver bolos para alugar</Link>
      </p>
    );
  }

  const { cliente } = pedido;
  const primeiroNome = cliente.nome.split(" ")[0];
  const temAluguel = pedido.itens.some((item) => item.tipo === "aluguel");
  const temCompra = pedido.itens.some((item) => item.tipo === "compra");
  const envio = temCompra && cliente.recebimento === "envio";
  const linkFrete = envio ? linkWhatsApp(mensagemOrcamentoFrete(pedido)) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <CircleCheck size={48} className="text-folha" aria-hidden="true" />
        <h1 className="font-display text-4xl font-bold">Pedido confirmado, {primeiroNome}!</h1>
        <p className="text-lg text-ameixa-suave">
          Pedido <strong className="text-ameixa">{pedido.numero}</strong>.{" "}
          {temAluguel ? "O contrato e os detalhes vão" : "Os detalhes vão"} para {cliente.email} e para o seu WhatsApp.
        </p>
      </div>

      {linkFrete && (
        <section className="flex flex-col items-start gap-3 rounded-2xl border-2 border-folha p-5">
          <h2 className="font-display text-xl font-semibold">Próximo passo: orçamento do frete</h2>
          <p>
            O envio é feito por transportadora. Mande o endereço para a Ateline orçar o frete. O restante da compra e
            o frete são pagos antes do envio.
          </p>
          <a
            href={linkFrete}
            target="_blank"
            rel="noopener"
            className="flex h-12 items-center gap-2 rounded-xl bg-folha px-5 font-bold text-white hover:opacity-90"
          >
            <MessageCircle size={20} aria-hidden /> Pedir orçamento do frete
          </a>
        </section>
      )}

      <ul className="flex flex-col gap-3">
        {pedido.itens.map((item) => (
          <li key={chaveDoItem(item)} className="rounded-2xl border border-linha p-4">
            <p className="font-display text-lg font-semibold">
              {item.tipo === "aluguel" ? "Aluguel" : "Compra"}: {item.nome}
            </p>
            {item.personalizacao && <p className="text-sm text-ameixa-suave">{item.personalizacao}</p>}
            {item.tipo === "aluguel" ? (
              <p className="text-sm">
                <strong>Retirada:</strong> {dia(calcularPeriodo(item.festa).retirada)} · <strong>Festa:</strong>{" "}
                {dia(item.festa)} · <strong>Devolução:</strong> {dia(calcularPeriodo(item.festa).devolucao)}
              </p>
            ) : envio ? (
              <p className="text-sm">
                <strong>Envio para:</strong> {cliente.rua}, {cliente.numero}
                {cliente.complemento && ` (${cliente.complemento})`} · {cliente.bairro} · {cliente.cidade}/{cliente.uf} ·
                CEP {formatarCep(cliente.cep ?? "")}
              </p>
            ) : (
              <p className="text-sm">
                <strong>Retirada na loja:</strong> combinamos o dia pelo WhatsApp.
              </p>
            )}
          </li>
        ))}
      </ul>

      <dl className="grid gap-3 rounded-2xl bg-blush p-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ameixa-suave">Sinal pago ({cliente.pagamento === "pix" ? "Pix" : "cartão"})</dt>
          <dd className="font-display text-2xl font-bold">{formatarPreco(pedido.pagoAgora)}</dd>
        </div>
        {temAluguel && (
          <div>
            <dt className="text-sm text-ameixa-suave">A pagar na retirada do aluguel</dt>
            <dd className="font-display text-2xl font-bold">{formatarPreco(pedido.naRetirada)}</dd>
          </div>
        )}
        {temCompra && (
          <div>
            <dt className="text-sm text-ameixa-suave">
              {envio ? "Restante da compra, antes do envio (+ frete)" : "Restante da compra, na retirada"}
            </dt>
            <dd className="font-display text-2xl font-bold">{formatarPreco(pedido.restanteCompra)}</dd>
          </div>
        )}
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
