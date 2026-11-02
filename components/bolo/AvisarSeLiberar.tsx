"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { entrarNaListaDeEspera } from "@/lib/espera";

// "Me avise se liberar": a cliente deixa nome e WhatsApp para uma data ocupada
export function AvisarSeLiberar({ codigo, festa, nomeDoBolo }: { codigo: string; festa: string; nomeDoBolo: string }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const id = `espera-${festa}`;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    const falha = await entrarNaListaDeEspera(codigo, festa, nome, whatsapp);
    setEnviando(false);
    if (falha) return setErro(falha);
    setErro("");
    setPronto(true);
  }

  if (pronto) {
    return (
      <p role="status" className="rounded-xl bg-white p-3 font-semibold text-folha">
        Combinado! Se o {nomeDoBolo} liberar nessa data, a Ateline te avisa pelo WhatsApp.
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex h-11 items-center gap-2 self-start rounded-xl border-2 border-ameixa bg-white px-4 font-bold hover:bg-blush"
      >
        <BellRing size={18} aria-hidden /> Me avise se o {nomeDoBolo} liberar
      </button>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-3 rounded-xl bg-white p-4">
      <p className="text-sm">
        Às vezes uma reserva é cancelada ou o sinal não é pago e a data volta a ficar livre. Deixe seu contato que a
        gente avisa.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor={`${id}-nome`} className="flex flex-col gap-1 text-sm font-bold">
          Seu nome
          <input
            id={`${id}-nome`}
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-11 rounded-xl border border-ameixa/30 px-3 font-normal"
          />
        </label>
        <label htmlFor={`${id}-whatsapp`} className="flex flex-col gap-1 text-sm font-bold">
          WhatsApp
          <input
            id={`${id}-whatsapp`}
            type="tel"
            autoComplete="tel"
            placeholder="(21) 00000-0000"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="h-11 rounded-xl border border-ameixa/30 px-3 font-normal"
          />
        </label>
      </div>
      {erro && (
        <p role="alert" className="text-sm font-semibold text-alerta">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="h-11 self-start rounded-xl bg-framboesa px-5 font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Me avise"}
      </button>
    </form>
  );
}
