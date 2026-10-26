"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { linkDoWhatsAppDaCliente, tituloDoGrupo } from "@/components/painel/CartaoSaida";
import { totalDoItem } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/formatar";
import { calcularDevolucao, diasDeAtraso, registrarDevolucao, type GrupoDaAgenda } from "@/lib/painel";
import { DESCONTO_VELA, MULTA_POR_DIA, TAXA_SEGURANCA } from "@/lib/regras";

type Vela = "nao-tem" | "devolvida" | "nao-devolvida";

export function CartaoDevolucao({ grupo, hoje, aoMudar }: { grupo: GrupoDaAgenda; hoje: string; aoMudar: () => void }) {
  const atrasoAteHoje = grupo.devolvido ? 0 : diasDeAtraso(grupo.devolucao, hoje);
  const [estadoDaPeca, setEstadoDaPeca] = useState<"ok" | "avaria" | null>(null); // null = ainda não conferiu
  const [vela, setVela] = useState<Vela>("nao-tem");
  const [atraso, setAtraso] = useState(atrasoAteHoje);
  const [valorDigitado, setValorDigitado] = useState(""); // reservas do WhatsApp não têm o valor no sistema
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  const valorLocacao = grupo.item ? totalDoItem(grupo.item) : Number(valorDigitado.replace(",", ".")) || 0;
  const conta = calcularDevolucao({
    taxa: TAXA_SEGURANCA,
    valorLocacao,
    diasAtraso: atraso,
    semAvarias: estadoDaPeca !== "avaria",
    temVela: vela !== "nao-tem",
    velaDevolvida: vela === "devolvida",
  });
  const id = `dev-${grupo.chave}`;
  const chavePix = grupo.pedido?.chavePix;
  const whatsapp = linkDoWhatsAppDaCliente(grupo.pedido?.whatsapp);

  async function concluir() {
    setEnviando(true);
    const falha = await registrarDevolucao(grupo.ids, conta.devolver);
    setEnviando(false);
    if (falha) return setErro(falha);
    aoMudar();
  }

  async function copiarChave() {
    if (!chavePix) return;
    try {
      await navigator.clipboard.writeText(chavePix);
      setCopiado(true);
    } catch {
      // sem permissão para copiar: a chave continua visível na tela
    }
  }

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl bg-white p-4 ${atrasoAteHoje > 0 ? "border-2 border-ameixa" : "border border-linha"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <strong>{tituloDoGrupo(grupo)}</strong>
        {atrasoAteHoje > 0 && (
          <span className="rounded-full bg-[#fce9df] px-2.5 py-0.5 text-xs font-bold text-alerta">
            {atrasoAteHoje} {atrasoAteHoje === 1 ? "dia" : "dias"} de atraso
          </span>
        )}
      </div>
      <p className="text-sm text-ameixa-suave">
        {grupo.pedido ? `${grupo.pedido.nome} · ${grupo.pedido.numero}` : "Reserva feita pelo WhatsApp"}
        {grupo.codigos.length > 1 && ` · peças: ${grupo.codigos.join(", ")}`}
      </p>

      {grupo.devolvido ? (
        <p className="flex items-center gap-1.5 font-bold text-folha">
          <Check size={18} aria-hidden /> Devolvido
        </p>
      ) : (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-bold">Checklist de devolução</legend>
            <div role="radiogroup" aria-label="Como a peça voltou" className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name={`${id}-estado`}
                  checked={estadoDaPeca === "ok"}
                  onChange={() => setEstadoDaPeca("ok")}
                  className="size-5 accent-framboesa"
                />
                Sem furos, cola ou sujeira
              </label>
              <label className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name={`${id}-estado`}
                  checked={estadoDaPeca === "avaria"}
                  onChange={() => setEstadoDaPeca("avaria")}
                  className="size-5 accent-framboesa"
                />
                Com avaria (furo, cola ou sujeira)
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm font-semibold" htmlFor={`${id}-vela`}>
              Vela acoplada
              <select
                id={`${id}-vela`}
                value={vela}
                onChange={(e) => setVela(e.target.value as Vela)}
                className="h-10 rounded-lg border border-ameixa/30 bg-white px-2 font-normal"
              >
                <option value="nao-tem">O bolo não tem vela</option>
                <option value="devolvida">Vela devolvida</option>
                <option value="nao-devolvida">Vela não devolvida (− {formatarPreco(DESCONTO_VELA)})</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1 text-sm font-semibold" htmlFor={`${id}-atraso`}>
                Dias de atraso
                <input
                  id={`${id}-atraso`}
                  type="number"
                  min={0}
                  value={atraso}
                  onChange={(e) => setAtraso(Math.max(0, Number(e.target.value) || 0))}
                  className="h-10 w-24 rounded-lg border border-ameixa/30 px-2 font-normal"
                />
              </label>
              {!grupo.item && (
                <label className="flex flex-col gap-1 text-sm font-semibold" htmlFor={`${id}-valor`}>
                  Valor da locação (R$)
                  <input
                    id={`${id}-valor`}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valorDigitado}
                    onChange={(e) => setValorDigitado(e.target.value)}
                    className="h-10 w-32 rounded-lg border border-ameixa/30 px-2 font-normal"
                  />
                </label>
              )}
            </div>
          </fieldset>

          {estadoDaPeca && (
            <dl
              aria-live="polite"
              className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-lg bg-blush/60 p-3 text-sm"
            >
              <dt>Taxa de segurança</dt>
              <dd>{formatarPreco(TAXA_SEGURANCA)}</dd>
              {conta.motivo === "avaria" ? (
                <>
                  <dt className="text-alerta">Avaria: a taxa não é devolvida</dt>
                  <dd className="text-alerta">− {formatarPreco(TAXA_SEGURANCA)}</dd>
                </>
              ) : (
                <>
                  {conta.multa > 0 && (
                    <>
                      <dt className="text-alerta">
                        Multa: {atraso} × {MULTA_POR_DIA * 100}% de {formatarPreco(valorLocacao)}
                      </dt>
                      <dd className="text-alerta">− {formatarPreco(conta.multa)}</dd>
                    </>
                  )}
                  {conta.descontoVela > 0 && (
                    <>
                      <dt className="text-alerta">Vela não devolvida</dt>
                      <dd className="text-alerta">− {formatarPreco(conta.descontoVela)}</dd>
                    </>
                  )}
                </>
              )}
              <dt className="border-t border-linha pt-1 font-bold">Devolver à cliente</dt>
              <dd className="border-t border-linha pt-1 font-bold">{formatarPreco(conta.devolver)}</dd>
              {conta.faltaCobrar > 0 && (
                <>
                  <dt className="font-bold text-alerta">A multa passou da taxa: cobrar</dt>
                  <dd className="font-bold text-alerta">{formatarPreco(conta.faltaCobrar)}</dd>
                </>
              )}
            </dl>
          )}

          {estadoDaPeca && chavePix && conta.devolver > 0 && (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              Chave Pix: <strong className="break-all">{chavePix}</strong>
              <button type="button" onClick={copiarChave} className="flex items-center gap-1 font-bold text-framboesa">
                <Copy size={14} aria-hidden /> {copiado ? "Copiada" : "Copiar"}
              </button>
            </p>
          )}
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener" className="text-sm font-bold text-folha">
              Falar com a cliente no WhatsApp
            </a>
          )}
          {!estadoDaPeca && (
            <p className="text-sm text-ameixa-suave">
              Confira a peça e marque como ela voltou para ver a conta da taxa.
            </p>
          )}
          {erro && (
            <p role="alert" className="text-sm font-semibold text-alerta">
              {erro}
            </p>
          )}
          <button
            type="button"
            onClick={concluir}
            disabled={enviando || !estadoDaPeca || (!grupo.item && valorLocacao === 0 && atraso > 0)}
            className="h-11 rounded-xl bg-ameixa font-bold text-white hover:opacity-90 disabled:opacity-60"
          >
            {enviando
              ? "Registrando…"
              : !estadoDaPeca
                ? "Concluir devolução"
                : conta.devolver > 0
                  ? `Concluir e devolver ${formatarPreco(conta.devolver)} por Pix`
                  : "Concluir devolução (nada a devolver)"}
          </button>
        </>
      )}
    </article>
  );
}
