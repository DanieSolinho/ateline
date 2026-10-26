"use client";

import { useState } from "react";
import { diaEHora } from "@/lib/calendario";
import { formatarPreco } from "@/lib/formatar";
import { mudarStatus, type PedidoAguardando } from "@/lib/painel";
import { linkDoWhatsAppDaCliente } from "@/components/painel/CartaoSaida";

export function ListaAguardando({ pedidos, aoMudar }: { pedidos: PedidoAguardando[]; aoMudar: () => void }) {
  const [agora] = useState(() => new Date().toISOString());
  return (
    <>
      {pedidos.map((pedido) => (
        <CartaoAguardando
          key={pedido.numero}
          pedido={pedido}
          vencido={!!pedido.guardado_ate && pedido.guardado_ate < agora}
          aoMudar={aoMudar}
        />
      ))}
    </>
  );
}

function CartaoAguardando({
  pedido,
  vencido,
  aoMudar,
}: {
  pedido: PedidoAguardando;
  vencido: boolean;
  aoMudar: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
  const [erro, setErro] = useState("");
  const whatsapp = linkDoWhatsAppDaCliente(pedido.cliente.whatsapp);

  async function mudar(status: "pago" | "cancelado") {
    setEnviando(true);
    const falha = await mudarStatus(pedido.numero, status);
    setEnviando(false);
    if (falha) return setErro(falha);
    aoMudar();
  }

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-linha bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <strong>
          {pedido.numero} · {pedido.cliente.nome}
        </strong>
        <span className="text-sm font-bold">{formatarPreco(Number(pedido.pago_agora))}</span>
      </div>
      <ul className="text-sm text-ameixa-suave">
        {pedido.itens.map((item, indice) => (
          <li key={indice}>
            {item.tipo === "aluguel" ? "Aluguel" : "Compra"}: {item.nome}
            {item.tipo === "aluguel" && ` · festa ${item.festa.split("-").reverse().slice(0, 2).join("/")}`}
          </li>
        ))}
      </ul>
      {pedido.guardado_ate && (
        <p className={`text-sm font-semibold ${vencido ? "text-alerta" : ""}`}>
          {vencido ? "Prazo vencido em " : "Peças guardadas até "}
          {diaEHora(pedido.guardado_ate)}
        </p>
      )}
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener" className="text-sm font-bold text-folha">
          Falar com a cliente no WhatsApp
        </a>
      )}
      {erro && (
        <p role="alert" className="text-sm font-semibold text-alerta">
          {erro}
        </p>
      )}
      {confirmarCancelamento ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#fce9df] p-3 text-sm">
          <span className="font-semibold">Cancelar o {pedido.numero} e liberar as peças?</span>
          <button
            type="button"
            onClick={() => mudar("cancelado")}
            disabled={enviando}
            className="h-10 rounded-lg bg-alerta px-3 font-bold text-white"
          >
            Sim, cancelar
          </button>
          <button
            type="button"
            onClick={() => setConfirmarCancelamento(false)}
            className="h-10 px-2 font-bold underline"
          >
            Voltar
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => mudar("pago")}
            disabled={enviando}
            className="h-11 flex-1 rounded-xl bg-framboesa font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
          >
            {enviando ? "Salvando…" : "Confirmar pagamento"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmarCancelamento(true)}
            className="h-11 rounded-xl border-2 border-ameixa px-3 font-bold hover:bg-blush"
          >
            Cancelar
          </button>
        </div>
      )}
    </article>
  );
}
