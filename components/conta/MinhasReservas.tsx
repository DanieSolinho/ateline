"use client";

import { useState } from "react";
import { CalendarClock, MessageCircle, XCircle } from "lucide-react";
import { CalendarioReserva } from "@/components/bolo/CalendarioReserva";
import { useReservas } from "@/hooks/useReservas";
import { diaPorExtenso, primeiraMaiuscula } from "@/lib/calendario";
import {
  adiarReserva,
  cancelarMeuPedido,
  creditoDoCancelamento,
  podeAdiar,
  podeCancelar,
  reservasSemOItem,
} from "@/lib/alteracoes";
import { situacaoDoPedido } from "@/lib/conta";
import { linkWhatsApp } from "@/lib/contato";
import { formatarPreco } from "@/lib/formatar";
import { calcularPeriodo } from "@/lib/periodo";
import { ANTECEDENCIA_ADIAMENTO_DIAS, VALIDADE_CREDITO_MESES } from "@/lib/regras";
import type { ItemAluguel } from "@/types/carrinho";
import type { Pedido } from "@/types/pedido";

function dia(iso: string) {
  return primeiraMaiuscula(diaPorExtenso(iso));
}

type Aberto = { numero: string; indice: number } | { numero: string; cancelar: true } | null;
type Aviso = { tipo: "sucesso" | "erro"; texto: string } | null;

type Props = {
  pedidos: Pedido[];
  hoje: string;
  agora: string;
  aoMudar: () => void; // busca de novo os pedidos e o crédito
};

// Aluguéis que ainda vão acontecer, com os botões de adiar e cancelar
export function MinhasReservas({ pedidos, hoje, agora, aoMudar }: Props) {
  const agenda = useReservas([]);
  const [aberto, setAberto] = useState<Aberto>(null);
  const [novaData, setNovaData] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  const ativos = pedidos.filter((pedido) => {
    const situacao = situacaoDoPedido(pedido, agora);
    if (situacao === "cancelado" || situacao === "vencido" || !pedido.status || pedido.status === "concluido") {
      return false;
    }
    return pedido.itens.some((item) => item.tipo === "aluguel" && calcularPeriodo(item.festa).retirada > hoje);
  });

  function abrir(novo: Aberto) {
    setAberto(novo);
    setNovaData(null);
    setAviso(null);
  }

  async function confirmarAdiamento(pedido: Pedido, indice: number, item: ItemAluguel) {
    if (!novaData) return;
    setEnviando(true);
    const resposta = await adiarReserva(pedido.numero, indice, novaData, item);
    setEnviando(false);
    if (!resposta.ok) return setAviso({ tipo: "erro", texto: resposta.mensagem });
    const periodo = calcularPeriodo(novaData);
    setAviso({
      tipo: "sucesso",
      texto: `Pronto! A festa do pedido ${pedido.numero} agora é ${diaPorExtenso(novaData)}. Retirada ${diaPorExtenso(periodo.retirada)} e devolução ${diaPorExtenso(periodo.devolucao)}. O sinal pago continua valendo.`,
    });
    setAberto(null);
    aoMudar();
  }

  async function confirmarCancelamento(pedido: Pedido) {
    setEnviando(true);
    const resposta = await cancelarMeuPedido(pedido.numero);
    setEnviando(false);
    if (!resposta.ok) return setAviso({ tipo: "erro", texto: resposta.mensagem });
    setAviso({
      tipo: "sucesso",
      texto:
        resposta.credito > 0
          ? `Pedido ${pedido.numero} cancelado. ${formatarPreco(resposta.credito)} viraram crédito em loja, válido por ${VALIDADE_CREDITO_MESES} meses.`
          : `Pedido ${pedido.numero} cancelado. As peças voltaram para a agenda.`,
    });
    setAberto(null);
    aoMudar();
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="status" aria-live="polite">
        {aviso && (
          <p
            className={`rounded-xl p-4 font-semibold ${aviso.tipo === "sucesso" ? "bg-[#e6f2ea] text-folha" : "bg-[#fce9df] text-alerta"}`}
          >
            {aviso.texto}
          </p>
        )}
      </div>

      {ativos.length === 0 && <p className="text-ameixa-suave">Nenhum aluguel marcado daqui para a frente.</p>}

      {ativos.map((pedido) => {
        const cancelamento = podeCancelar(pedido, hoje, agora);
        const credito = creditoDoCancelamento(pedido);
        const cancelandoEste = aberto !== null && aberto.numero === pedido.numero && "cancelar" in aberto;

        return (
          <article key={pedido.numero} className="flex flex-col gap-4 rounded-2xl border border-linha p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">Pedido {pedido.numero}</h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${pedido.status === "pago" ? "bg-[#e6f2ea] text-folha" : "bg-pessego text-ameixa"}`}
              >
                {pedido.status === "pago" ? "Sinal pago" : "Aguardando o sinal"}
              </span>
            </div>

            <ul className="flex flex-col gap-4">
              {pedido.itens.map((item, indice) => {
                if (item.tipo !== "aluguel" || calcularPeriodo(item.festa).retirada <= hoje) return null;
                const adiamento = podeAdiar(pedido, item, hoje);
                const adiandoEste =
                  aberto !== null && aberto.numero === pedido.numero && "indice" in aberto && aberto.indice === indice;

                return (
                  <li key={indice} className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong>{item.nome}</strong>
                        <span className="block text-sm text-ameixa-suave">Festa: {dia(item.festa)}</span>
                      </div>
                      {adiamento.pode && !adiandoEste && (
                        <button
                          type="button"
                          onClick={() => abrir({ numero: pedido.numero, indice })}
                          className="flex h-11 items-center gap-2 rounded-xl border-2 border-ameixa px-4 font-bold hover:bg-blush"
                        >
                          <CalendarClock size={18} aria-hidden /> Adiar
                        </button>
                      )}
                    </div>
                    {!adiamento.pode && <p className="text-sm text-ameixa-suave">{adiamento.motivo}</p>}

                    {adiandoEste && (
                      <div className="flex flex-col gap-3 rounded-2xl bg-blush/50 p-4">
                        <p className="font-semibold">
                          Escolha a nova data da festa. Só aparecem livres os dias em que o bolo está disponível.
                        </p>
                        <CalendarioReserva
                          codigo={item.codigoBolo}
                          reservas={reservasSemOItem(agenda, item)}
                          festa={novaData}
                          aoEscolher={setNovaData}
                        />
                        {novaData && (
                          <p>
                            Retirada {diaPorExtenso(calcularPeriodo(novaData).retirada)} e devolução{" "}
                            {diaPorExtenso(calcularPeriodo(novaData).devolucao)}.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={!novaData || novaData === item.festa || enviando}
                            onClick={() => confirmarAdiamento(pedido, indice, item)}
                            className="h-11 rounded-xl bg-framboesa px-4 font-bold text-white hover:bg-framboesa-escura disabled:opacity-50"
                          >
                            {enviando ? "Mudando…" : novaData ? `Mudar para ${dia(novaData)}` : "Escolha uma data"}
                          </button>
                          <button
                            type="button"
                            onClick={() => abrir(null)}
                            className="h-11 rounded-xl px-4 font-bold underline"
                          >
                            Voltar
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {cancelandoEste ? (
              <div className="flex flex-col gap-3 rounded-xl bg-[#fce9df] p-4">
                <p className="font-semibold">
                  {credito > 0
                    ? `Cancelar o pedido ${pedido.numero}? O sinal de ${formatarPreco(credito)} não volta em dinheiro: ele vira crédito em loja, válido por ${VALIDADE_CREDITO_MESES} meses, para usar em outro aluguel.`
                    : `Cancelar o pedido ${pedido.numero}? As peças voltam para a agenda.${pedido.creditoUsado ? " O crédito usado neste pedido volta para o seu saldo." : ""}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => confirmarCancelamento(pedido)}
                    className="h-11 rounded-xl bg-alerta px-4 font-bold text-white disabled:opacity-50"
                  >
                    {enviando ? "Cancelando…" : "Sim, cancelar o pedido"}
                  </button>
                  <button type="button" onClick={() => abrir(null)} className="h-11 rounded-xl px-4 font-bold underline">
                    Voltar
                  </button>
                </div>
              </div>
            ) : cancelamento.pode ? (
              <button
                type="button"
                onClick={() => abrir({ numero: pedido.numero, cancelar: true })}
                className="flex items-center gap-2 self-start font-semibold text-ameixa-suave underline hover:text-alerta"
              >
                <XCircle size={18} aria-hidden /> Cancelar este pedido
              </button>
            ) : (
              <p className="text-sm text-ameixa-suave">
                {cancelamento.motivo}{" "}
                <a
                  href={linkWhatsApp(`Olá! Quero falar sobre o pedido ${pedido.numero}.`) ?? "#"}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 font-bold text-framboesa underline"
                >
                  <MessageCircle size={14} aria-hidden /> Falar com a loja
                </a>
              </p>
            )}
          </article>
        );
      })}

      <p className="text-sm text-ameixa-suave">
        Adiamento: até {ANTECEDENCIA_ADIAMENTO_DIAS} dias antes da festa, se o bolo estiver livre na nova data. Em
        cancelamento, o sinal vira crédito em loja por {VALIDADE_CREDITO_MESES} meses.
      </p>
    </div>
  );
}
