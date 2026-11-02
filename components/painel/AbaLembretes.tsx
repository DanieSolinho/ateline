"use client";

import { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { tituloDoGrupo } from "@/components/painel/CartaoSaida";
import { diaPorExtenso, primeiraMaiuscula } from "@/lib/calendario";
import { linkWhatsApp } from "@/lib/contato";
import { mensagemDeLembreteDeDevolucao, mensagemDeLembreteDeRetirada, proximoDiaAberto } from "@/lib/lembretes";
import {
  agruparReservas,
  buscarAgenda,
  receberNaRetirada,
  separarAgenda,
  type GrupoDaAgenda,
  type ReservaDaAgenda,
} from "@/lib/painel";
import { TAXA_SEGURANCA } from "@/lib/regras";

// Lembretes para o próximo dia de loja aberta: quem retira e quem devolve
export function AbaLembretes({ hoje }: { hoje: string }) {
  const dia = proximoDiaAberto(hoje);
  const [reservas, setReservas] = useState<ReservaDaAgenda[] | null | undefined>(undefined);
  const [enviados, setEnviados] = useState<string[]>([]); // só nesta tela, para a dona saber em quem já clicou

  useEffect(() => {
    let ativo = true;
    buscarAgenda(dia).then((lista) => ativo && setReservas(lista));
    return () => {
      ativo = false;
    };
  }, [dia]);

  if (reservas === undefined) return <p className="text-ameixa-suave">Carregando…</p>;
  if (reservas === null) {
    return (
      <p role="alert" className="rounded-xl bg-[#fce9df] p-4 font-semibold text-alerta">
        Não deu para carregar os lembretes. Confira a internet e tente de novo.
      </p>
    );
  }

  const { saem, voltam } = separarAgenda(agruparReservas(reservas), dia);
  const marcar = (chave: string) => setEnviados((lista) => [...lista, chave]);

  return (
    <div className="flex flex-col gap-4">
      <p>
        Lembretes para <strong>{primeiraMaiuscula(diaPorExtenso(dia))}</strong>, o próximo dia de loja aberta. Cada
        botão abre o WhatsApp com a mensagem pronta: é só conferir e enviar.
      </p>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Lista titulo="Retiram" grupos={saem} vazio="Ninguém retira nesse dia.">
          {(grupo) => {
            const valor = grupo.item ? receberNaRetirada(grupo.item, TAXA_SEGURANCA) : null;
            const texto = mensagemDeLembreteDeRetirada(grupo.pedido?.nome ?? "", tituloDoGrupo(grupo), dia, valor);
            return (
              <Lembrete
                grupo={grupo}
                texto={texto}
                enviado={enviados.includes(`r${grupo.chave}`)}
                aoEnviar={() => marcar(`r${grupo.chave}`)}
              />
            );
          }}
        </Lista>
        <Lista titulo="Devolvem" grupos={voltam} vazio="Ninguém devolve nesse dia.">
          {(grupo) => {
            const texto = mensagemDeLembreteDeDevolucao(grupo.pedido?.nome ?? "", tituloDoGrupo(grupo), dia);
            return (
              <Lembrete
                grupo={grupo}
                texto={texto}
                enviado={enviados.includes(`d${grupo.chave}`)}
                aoEnviar={() => marcar(`d${grupo.chave}`)}
              />
            );
          }}
        </Lista>
      </div>
    </div>
  );
}

function Lista({
  titulo,
  grupos,
  vazio,
  children,
}: {
  titulo: string;
  grupos: GrupoDaAgenda[];
  vazio: string;
  children: (grupo: GrupoDaAgenda) => React.ReactNode;
}) {
  return (
    <section aria-label={titulo} className="flex flex-col gap-3 rounded-2xl bg-blush/50 p-4">
      <h2 className="font-display text-xl font-semibold">
        {titulo} <span className="font-medium text-ameixa-suave">· {grupos.length}</span>
      </h2>
      {grupos.length === 0 ? (
        <p className="text-sm text-ameixa-suave">{vazio}</p>
      ) : (
        grupos.map((grupo) => <div key={grupo.chave}>{children(grupo)}</div>)
      )}
    </section>
  );
}

function Lembrete({
  grupo,
  texto,
  enviado,
  aoEnviar,
}: {
  grupo: GrupoDaAgenda;
  texto: string;
  enviado: boolean;
  aoEnviar: () => void;
}) {
  const link = grupo.pedido?.whatsapp ? linkWhatsApp(texto, `55${grupo.pedido.whatsapp}`) : null;
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-linha bg-white p-4">
      <strong>{tituloDoGrupo(grupo)}</strong>
      <p className="text-sm text-ameixa-suave">
        {grupo.pedido
          ? `${grupo.pedido.nome} · ${grupo.pedido.numero}`
          : "Reserva feita pelo WhatsApp: sem contato no sistema"}
      </p>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener"
          onClick={aoEnviar}
          className={`flex h-11 items-center justify-center gap-2 rounded-xl px-4 font-bold ${
            enviado ? "border-2 border-folha text-folha" : "bg-folha text-white hover:opacity-90"
          }`}
        >
          {enviado ? <Check size={18} aria-hidden /> : <MessageCircle size={18} aria-hidden />}
          {enviado ? "Aberto no WhatsApp" : "Enviar lembrete"}
        </a>
      ) : (
        <p className="text-sm">Mande o lembrete pela conversa que você já tem com a cliente.</p>
      )}
    </article>
  );
}
