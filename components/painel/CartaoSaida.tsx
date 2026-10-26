"use client";

import { useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { formatarPreco } from "@/lib/formatar";
import { receberNaRetirada, registrarRetirada, type GrupoDaAgenda } from "@/lib/painel";
import { TAXA_SEGURANCA } from "@/lib/regras";

export function linkDoWhatsAppDaCliente(whatsapp: string | null | undefined): string | null {
  return whatsapp ? `https://wa.me/55${whatsapp}` : null;
}

// Título do cartão: o nome do bolo (pedido do site) ou os códigos (reserva do WhatsApp)
export function tituloDoGrupo(grupo: GrupoDaAgenda): string {
  return grupo.item?.nome ?? grupo.codigos.join(" + ");
}

export function CartaoSaida({ grupo, aoMudar }: { grupo: GrupoDaAgenda; aoMudar: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const whatsapp = linkDoWhatsAppDaCliente(grupo.pedido?.whatsapp);

  async function registrar() {
    setEnviando(true);
    const falha = await registrarRetirada(grupo.ids);
    setEnviando(false);
    if (falha) return setErro(falha);
    aoMudar();
  }

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-linha bg-white p-4">
      <strong>{tituloDoGrupo(grupo)}</strong>
      <p className="text-sm text-ameixa-suave">
        {grupo.pedido ? `${grupo.pedido.nome} · ${grupo.pedido.numero}` : "Reserva feita pelo WhatsApp"} · festa{" "}
        {grupo.festa.split("-").reverse().slice(0, 2).join("/")}
      </p>
      {grupo.item && grupo.codigos.length > 1 && <p className="text-sm">Peças: {grupo.codigos.join(", ")}</p>}
      {grupo.item?.personalizacao && <p className="text-sm">{grupo.item.personalizacao}</p>}
      {grupo.item && (
        <p className="text-sm">
          Receber: <strong>{formatarPreco(receberNaRetirada(grupo.item, TAXA_SEGURANCA))}</strong> (restante + taxa)
        </p>
      )}
      {grupo.pedido?.status === "aguardando_pagamento" && (
        <p className="rounded-lg bg-pessego px-3 py-2 text-sm font-semibold">Atenção: o sinal ainda não foi pago.</p>
      )}
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1.5 text-sm font-bold text-folha"
        >
          <MessageCircle size={16} aria-hidden /> Falar com a cliente
        </a>
      )}
      {erro && (
        <p role="alert" className="text-sm font-semibold text-alerta">
          {erro}
        </p>
      )}
      {grupo.retirado ? (
        <p className="flex items-center gap-1.5 font-bold text-folha">
          <Check size={18} aria-hidden /> Retirado
        </p>
      ) : (
        <button
          type="button"
          onClick={registrar}
          disabled={enviando}
          className="h-11 rounded-xl bg-framboesa font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
        >
          {enviando ? "Registrando…" : "Registrar retirada"}
        </button>
      )}
    </article>
  );
}
