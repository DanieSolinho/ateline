"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, Truck } from "lucide-react";
import { CalendarioReserva } from "@/components/bolo/CalendarioReserva";
import { useCarrinho } from "@/hooks/useCarrinho";
import { useHoje } from "@/hooks/useHoje";
import { useReservas } from "@/hooks/useReservas";
import { diaPorExtenso, horarioDaLoja, primeiraMaiuscula } from "@/lib/calendario";
import { linkWhatsApp } from "@/lib/contato";
import { formatarPreco } from "@/lib/formatar";
import { calcularPeriodo, estaDisponivel, livreParaVenda, primeiraUnidadeLivre } from "@/lib/periodo";
import { PERCENTUAL_SINAL, TAXA_SEGURANCA } from "@/lib/regras";
import type { Acessorio, BoloVitrine } from "@/types/catalogo";
import type { Reserva } from "@/types/reserva";

type Props = {
  bolo: BoloVitrine;
  topos: Acessorio[]; // só os topos compatíveis com este bolo
  bases: Acessorio[]; // as unidades de base dourada
  reservas: Reserva[]; // agenda do momento da publicação
};

const estiloChip = (ativo: boolean) =>
  `min-h-11 rounded-xl border px-4 font-semibold ${
    ativo ? "border-ameixa bg-ameixa text-white" : "border-ameixa/30 bg-white hover:border-ameixa"
  }`;

// Quem chega pela página "Comprar" vem com #comprar no endereço e já cai na aba de compra
const semMudancas = () => () => {};
const veioParaComprar = () => window.location.hash === "#comprar";

export function MontarReserva({ bolo, topos, bases, reservas: daPublicacao }: Props) {
  const reservas = useReservas(daPublicacao); // agenda atualizada do Supabase
  const router = useRouter();
  const { adicionar } = useCarrinho();

  const hoje = useHoje();
  const [modoEscolhido, setModo] = useState<"alugar" | "comprar" | null>(null);
  const modoPeloLink = useSyncExternalStore(semMudancas, veioParaComprar, () => false) ? "comprar" : "alugar";
  const modo = modoEscolhido ?? modoPeloLink;
  const [decoracao, setDecoracao] = useState<string | null>(bolo.decoracoes[0] ?? null);
  const [andares, setAndares] = useState(bolo.opcoes[0].andares);
  const [codigoTopo, setCodigoTopo] = useState("");
  const [querBase, setQuerBase] = useState(false);
  const [festa, setFesta] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [inicial, setInicial] = useState("");
  const [erro, setErro] = useState("");

  // A opção escolhida = decoração + número de andares
  const opcoesDaDecoracao = bolo.opcoes.filter((opcao) => opcao.decoracao === decoracao);
  const opcao = opcoesDaDecoracao.find((o) => o.andares === andares) ?? opcoesDaDecoracao[0];

  // Topo e base só valem se estiverem livres na data da festa
  const topoLivre = (codigo: string) => !festa || estaDisponivel(codigo, festa, reservas);
  const topo = topos.find((t) => t.codigo === codigoTopo && topoLivre(t.codigo)) ?? null;

  const codigosDasBases = bases.map((b) => b.codigo);
  const unidadeDaBase = festa ? primeiraUnidadeLivre(codigosDasBases, festa, reservas) : codigosDasBases[0] ?? null;
  const baseDisponivel = bolo.aceitaBaseDourada && bases.length > 0 && unidadeDaBase !== null;
  const precoBase = bases[0]?.precoLocacao ?? 0;
  const comBase = querBase && baseDisponivel;

  const locacao = opcao.precoLocacao + (topo?.precoLocacao ?? 0) + (comBase ? precoBase : 0);
  const sinal = locacao * PERCENTUAL_SINAL;
  const naRetirada = locacao - sinal + TAXA_SEGURANCA;
  const periodo = festa ? calcularPeriodo(festa) : null;

  const pedeNome = bolo.personalizacao === "nome" || bolo.personalizacao === "nome_idade";
  const pedeIdade = bolo.personalizacao === "idade" || bolo.personalizacao === "nome_idade";
  const pedeInicial = bolo.personalizacao === "inicial";

  const nomeDoItem = [bolo.nome, opcao.decoracao, `${opcao.andares} andares`].filter(Boolean).join(" · ");

  // Venda: só peças em bom estado, com preço de venda e sem aluguel marcado daqui para a frente
  const vendaLiberada = bolo.status === "disponivel" && hoje !== null && livreParaVenda(bolo.codigo, hoje, reservas);

  // Confere a personalização e devolve o texto dela (ou null se faltar algo)
  function lerPersonalizacao(): { ok: boolean; texto: string | null } {
    if (pedeNome && !nome.trim()) return (setErro("Escreva o nome que vai no bolo."), { ok: false, texto: null });
    if (pedeIdade && !idade.trim()) return (setErro("Escreva a idade que vai no bolo."), { ok: false, texto: null });
    if (pedeInicial && !inicial.trim()) return (setErro("Escreva a inicial que vai no bolo."), { ok: false, texto: null });
    const partes = [
      pedeNome && `Nome: ${nome.trim()}`,
      pedeIdade && `Idade: ${idade.trim()}`,
      pedeInicial && `Inicial: ${inicial.trim().toUpperCase()}`,
    ].filter(Boolean);
    return { ok: true, texto: partes.length > 0 ? partes.join(" · ") : null };
  }

  function comprar() {
    if (opcao.precoVenda === null || !vendaLiberada) return;
    const personalizacao = lerPersonalizacao();
    if (!personalizacao.ok) return;
    adicionar({
      tipo: "compra",
      codigoBolo: bolo.codigo,
      codigoOpcao: opcao.codigo,
      nome: nomeDoItem,
      preco: opcao.precoVenda,
      personalizacao: personalizacao.texto,
    });
    router.push("/carrinho");
  }

  function reservar() {
    if (!festa) return setErro("Escolha o dia da festa no calendário.");
    const personalizacao = lerPersonalizacao();
    if (!personalizacao.ok) return;

    adicionar({
      tipo: "aluguel",
      codigoBolo: bolo.codigo,
      codigoOpcao: opcao.codigo,
      nome: nomeDoItem,
      festa,
      precoOpcao: opcao.precoLocacao,
      topo: topo ? { codigo: topo.codigo, nome: topo.nome, preco: topo.precoLocacao } : null,
      base: comBase && unidadeDaBase ? { codigo: unidadeDaBase, nome: "Base dourada", preco: precoBase } : null,
      personalizacao: personalizacao.texto,
    });
    router.push("/carrinho");
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Alugar ou comprar" className="grid grid-cols-2 gap-1 rounded-2xl bg-blush p-1">
        {(["alugar", "comprar"] as const).map((valor) => {
          const ativo = modo === valor;
          const preco = valor === "alugar" ? opcao.precoLocacao : opcao.precoVenda;
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => {
                setModo(valor);
                setErro("");
              }}
              className={`flex flex-col items-center rounded-xl py-3 ${
                ativo ? "bg-white shadow-sm" : "text-ameixa-suave hover:text-ameixa"
              }`}
            >
              <span className="font-bold">{valor === "alugar" ? "Alugar" : "Comprar"}</span>
              <span className="font-display text-xl font-bold">
                {preco !== null ? formatarPreco(preco) : "Sob consulta"}
              </span>
            </button>
          );
        })}
      </div>

      {bolo.decoracoes.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-bold">Decoração</legend>
          <div className="flex flex-wrap gap-2">
            {bolo.decoracoes.map((d) => (
              <button key={d} type="button" aria-pressed={d === decoracao} onClick={() => setDecoracao(d)}
                className={estiloChip(d === decoracao)}>
                {d}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Tamanho</legend>
        <div className="flex flex-wrap gap-2">
          {opcoesDaDecoracao.map((o) => (
            <button key={o.codigo} type="button" aria-pressed={o.codigo === opcao.codigo} onClick={() => setAndares(o.andares)}
              className={estiloChip(o.codigo === opcao.codigo)}>
              {o.andares} andares
            </button>
          ))}
        </div>
      </fieldset>

      {(pedeNome || pedeIdade || pedeInicial) && (
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 font-bold">Personalização (inclusa)</legend>
          {pedeNome && (
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Nome no bolo
              <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={20}
                className="h-12 rounded-xl border border-ameixa/30 px-3 text-base font-normal" />
            </label>
          )}
          {pedeIdade && (
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Idade
              <input value={idade} onChange={(e) => setIdade(e.target.value)} inputMode="numeric" maxLength={3}
                className="h-12 rounded-xl border border-ameixa/30 px-3 text-base font-normal" />
            </label>
          )}
          {pedeInicial && (
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Inicial
              <input value={inicial} onChange={(e) => setInicial(e.target.value)} maxLength={2}
                className="h-12 w-24 rounded-xl border border-ameixa/30 px-3 text-base font-normal uppercase" />
            </label>
          )}
        </fieldset>
      )}

      {modo === "comprar" ? (
        <section aria-live="polite" className="flex flex-col gap-4 rounded-2xl bg-blush p-5">
          <ul className="flex flex-col gap-2">
            <li className="flex items-center gap-2 font-semibold">
              <Store size={18} aria-hidden /> Retirada grátis na loja, na Praça Seca
            </li>
            <li className="flex items-center gap-2 font-semibold">
              <Truck size={18} aria-hidden /> Envio por transportadora, com frete orçado no WhatsApp
            </li>
          </ul>
          {opcao.precoVenda !== null && (
            <dl className="flex flex-col gap-1">
              <div className="flex justify-between">
                <dt>Sinal agora (50%)</dt>
                <dd className="font-bold">{formatarPreco(opcao.precoVenda * PERCENTUAL_SINAL)}</dd>
              </div>
              <div className="flex justify-between text-sm text-ameixa-suave">
                <dt>Restante: na retirada ou antes do envio</dt>
                <dd>{formatarPreco(opcao.precoVenda * (1 - PERCENTUAL_SINAL))}</dd>
              </div>
            </dl>
          )}

          {opcao.precoVenda === null ? (
            <a
              href={linkWhatsApp(`Olá! Quero saber o valor para comprar o bolo ${nomeDoItem} (${bolo.codigo}).`) ?? "#"}
              target="_blank"
              rel="noopener"
              className="grid h-14 place-items-center rounded-xl border-2 border-ameixa bg-white text-lg font-bold hover:bg-rosa"
            >
              Venda sob consulta · falar no WhatsApp
            </a>
          ) : hoje !== null && !vendaLiberada ? (
            <p className="rounded-xl bg-white p-4 text-sm">
              Esta peça tem aluguéis marcados e não pode ser vendida agora. Que tal{" "}
              <Link href="/encomenda" className="font-bold text-framboesa underline">
                encomendar um igual
              </Link>
              ?
            </p>
          ) : (
            <>
              {erro && <p role="alert" className="font-semibold text-alerta">{erro}</p>}
              <button
                type="button"
                onClick={comprar}
                disabled={hoje === null}
                className="h-14 rounded-xl bg-framboesa text-lg font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
              >
                Comprar por {formatarPreco(opcao.precoVenda)}
              </button>
            </>
          )}
        </section>
      ) : (
        <>
          {bolo.tipoTopo === "fixo" && <p className="text-ameixa-suave">Topo incluso no bolo.</p>}

          {bolo.tipoTopo === "opcional" && topos.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 font-bold">Topo (opcional)</legend>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="radio" name="topo" checked={codigoTopo === ""} onChange={() => setCodigoTopo("")}
                  className="size-5 accent-framboesa" />
                Sem topo
              </label>
              {topos.map((t) => {
                const livre = topoLivre(t.codigo);
                return (
                  <label key={t.codigo} className={`flex items-center gap-3 ${livre ? "cursor-pointer" : "opacity-50"}`}>
                    <input type="radio" name="topo" disabled={!livre} checked={codigoTopo === t.codigo}
                      onChange={() => setCodigoTopo(t.codigo)} className="size-5 accent-framboesa" />
                    <span>
                      {t.nome} <strong>+ {formatarPreco(t.precoLocacao)}</strong>
                      {!livre && <span className="text-sm text-alerta"> · reservado nessa data</span>}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}

          {bolo.aceitaBaseDourada && bases.length > 0 && (
            <label className={`flex items-start gap-3 rounded-xl border border-linha p-4 ${baseDisponivel ? "cursor-pointer" : "opacity-50"}`}>
              <input type="checkbox" checked={comBase} disabled={!baseDisponivel}
                onChange={(evento) => setQuerBase(evento.target.checked)} className="mt-1 size-5 accent-framboesa" />
              <span>
                <strong>Base dourada + {formatarPreco(precoBase)}</strong>
                <span className="block text-sm text-ameixa-suave">
                  {baseDisponivel ? "Um andar a mais, para o bolo ficar maior." : "Todas as bases estão reservadas nessa data."}
                </span>
              </span>
            </label>
          )}

          <CalendarioReserva codigo={bolo.codigo} reservas={reservas} festa={festa}
            aoEscolher={(iso) => { setFesta(iso); setErro(""); }} />

          <section aria-live="polite" className="flex flex-col gap-3 rounded-2xl bg-blush p-5">
            {periodo && (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-ameixa-suave">Retirada</dt>
                  <dd className="font-bold">{primeiraMaiuscula(diaPorExtenso(periodo.retirada))}</dd>
                  <dd className="text-sm text-ameixa-suave">{horarioDaLoja(periodo.retirada, "retirada")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-ameixa-suave">Devolução</dt>
                  <dd className="font-bold">{primeiraMaiuscula(diaPorExtenso(periodo.devolucao))}</dd>
                  <dd className="text-sm text-ameixa-suave">{horarioDaLoja(periodo.devolucao, "devolucao")}</dd>
                </div>
              </dl>
            )}
            <p className="flex justify-between">
              <span>Locação {topo || comBase ? "(com extras)" : ""}</span>
              <strong>{formatarPreco(locacao)}</strong>
            </p>
            <p className="flex justify-between">
              <span>Sinal agora (50%)</span>
              <strong>{formatarPreco(sinal)}</strong>
            </p>
            <p className="flex justify-between text-sm text-ameixa-suave">
              <span>Na retirada: restante + taxa de segurança</span>
              <span>{formatarPreco(naRetirada)}</span>
            </p>
            {erro && <p role="alert" className="font-semibold text-alerta">{erro}</p>}
            <button type="button" onClick={reservar}
              className="mt-2 h-14 rounded-xl bg-framboesa text-lg font-bold text-white hover:bg-framboesa-escura">
              Reservar e pagar sinal de {formatarPreco(sinal)}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
