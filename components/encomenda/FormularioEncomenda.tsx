"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useHoje } from "@/hooks/useHoje";
import { linkWhatsApp } from "@/lib/contato";
import {
  criarEsquemaEncomenda,
  cupomValido,
  dataMinimaParaRefazer,
  mensagemDeEncomenda,
  precoComCupom,
  somarDias,
  type BoloParaRefazer,
  type CampoEncomenda,
} from "@/lib/encomenda";
import { formatarPreco } from "@/lib/formatar";
import { ANTECEDENCIA_REFAZER_DIAS } from "@/lib/regras";
import type { BoloRefazivel, Cupom } from "@/types/catalogo";

type Props = {
  refaziveis: BoloRefazivel[];
  cupom: Cupom | null;
};

const estiloCampo = "h-12 rounded-xl border border-ameixa/30 bg-white px-3 aria-invalid:border-alerta";
const estiloChip = (ativo: boolean) =>
  `min-h-11 rounded-xl border px-4 font-semibold ${
    ativo ? "border-ameixa bg-ameixa text-white" : "border-ameixa/30 bg-white hover:border-ameixa"
  }`;

export function FormularioEncomenda({ refaziveis, cupom }: Props) {
  const hoje = useHoje();
  const [codigoRefazer, setCodigoRefazer] = useState<string | null>(null);
  const [codigoOpcao, setCodigoOpcao] = useState<string | null>(null);
  const [cupomDigitado, setCupomDigitado] = useState("");
  const [erros, setErros] = useState<Partial<Record<CampoEncomenda, string>>>({});
  const [linkEnviado, setLinkEnviado] = useState<string | null>(null);

  // O bolo do acervo escolhido e a opção de tamanho (null = bolo novo)
  const boloRefazer = refaziveis.find((bolo) => bolo.codigo === codigoRefazer) ?? null;
  const opcaoRefazer =
    boloRefazer?.opcoes.find((opcao) => opcao.codigo === codigoOpcao) ?? boloRefazer?.opcoes[0] ?? null;
  const refazer: BoloParaRefazer | null =
    boloRefazer && opcaoRefazer
      ? {
          codigo: boloRefazer.codigo,
          nome: boloRefazer.nome,
          andares: opcaoRefazer.andares,
          decoracao: opcaoRefazer.decoracao,
          preco: opcaoRefazer.precoEncomendaNova,
        }
      : null;

  const dataMinima = hoje ? (refazer ? dataMinimaParaRefazer(hoje) : somarDias(hoje, 1)) : undefined;
  const valor = refazer ? precoComCupom(refazer.preco, cupomDigitado, cupom) : null;

  function escolherParaRefazer(codigo: string) {
    setCodigoRefazer(codigo);
    setCodigoOpcao(null);
    setErros({});
    document.getElementById("pedido")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!hoje) return;

    const valores = Object.fromEntries(new FormData(evento.currentTarget)) as Record<string, string>;
    const resultado = criarEsquemaEncomenda(hoje, refazer).safeParse({
      tema: "",
      andares: "",
      cupom: "",
      ...valores,
    });

    if (!resultado.success) {
      const novosErros: typeof erros = {};
      for (const problema of resultado.error.issues) {
        const campo = problema.path[0] as CampoEncomenda;
        novosErros[campo] ??= problema.message;
      }
      setErros(novosErros);
      return;
    }

    setErros({});
    const link = linkWhatsApp(mensagemDeEncomenda(resultado.data, refazer, cupom));
    if (!link) return;
    setLinkEnviado(link);
    window.open(link, "_blank", "noopener");
  }

  return (
    <>
      {refaziveis.length > 0 && (
        <section aria-labelledby="refazer-titulo" className="mx-auto w-full max-w-7xl px-4 pt-12">
          <h2 id="refazer-titulo" className="font-display text-3xl font-semibold">
            Refaça um bolo do acervo
          </h2>
          <p className="mt-2 max-w-2xl text-ameixa-suave">
            Estes bolos saíram do acervo, mas a Ateline faz de novo para você. A primeira locação é sua, e
            depois ele volta para o acervo. Precisamos de {ANTECEDENCIA_REFAZER_DIAS} dias de antecedência.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            {refaziveis.map((bolo) => (
              <li key={bolo.codigo} className="flex flex-col gap-3">
                <div className="grid aspect-[4/5] place-items-center rounded-2xl bg-rosa text-sm text-ameixa-suave">
                  Foto em breve
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{bolo.nome}</h3>
                  <p className="text-sm text-ameixa-suave">{bolo.tema}</p>
                  <p className="mt-1 text-sm">
                    A partir de <strong>{formatarPreco(Math.min(...bolo.opcoes.map((opcao) => opcao.precoEncomendaNova)))}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => escolherParaRefazer(bolo.codigo)}
                  aria-pressed={codigoRefazer === bolo.codigo}
                  className={`h-12 rounded-xl font-bold ${
                    codigoRefazer === bolo.codigo
                      ? "bg-ameixa text-white"
                      : "border-2 border-ameixa bg-white text-ameixa hover:bg-blush"
                  }`}
                >
                  {codigoRefazer === bolo.codigo ? "Escolhido" : "Quero um igual"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-start gap-10 px-4 py-12">
        <form
          id="pedido"
          onSubmit={enviar}
          noValidate
          className="flex min-w-0 flex-[999_1_560px] scroll-mt-6 flex-col gap-6"
        >
          <h2 className="font-display text-3xl font-semibold">
            {refazer ? "Encomendar igual" : "Pedir orçamento"}
          </h2>

          {boloRefazer && refazer && valor && (
            <div className="flex flex-col gap-4 rounded-2xl bg-blush p-5">
              <div className="flex items-start justify-between gap-3">
                <p>
                  <span className="text-sm text-ameixa-suave">Bolo igual ao</span>
                  <br />
                  <strong className="font-display text-xl">{boloRefazer.nome}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setCodigoRefazer(null)}
                  className="flex min-h-11 items-center gap-1 rounded-xl px-3 font-semibold hover:bg-white"
                >
                  <X size={18} aria-hidden /> Quero um bolo novo
                </button>
              </div>

              {boloRefazer.opcoes.length > 1 && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 font-bold">Modelo e tamanho</legend>
                  <div className="flex flex-wrap gap-2">
                    {boloRefazer.opcoes.map((opcao) => (
                      <button
                        key={opcao.codigo}
                        type="button"
                        aria-pressed={opcao.codigo === opcaoRefazer?.codigo}
                        onClick={() => setCodigoOpcao(opcao.codigo)}
                        className={estiloChip(opcao.codigo === opcaoRefazer?.codigo)}
                      >
                        {opcao.andares} andares{opcao.decoracao && ` · ${opcao.decoracao}`}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {cupom && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cupom" className="font-bold">Cupom de desconto</label>
                  <input
                    id="cupom"
                    name="cupom"
                    value={cupomDigitado}
                    onChange={(evento) => setCupomDigitado(evento.target.value)}
                    autoCapitalize="characters"
                    className={`${estiloCampo} max-w-60 uppercase`}
                    aria-describedby="cupom-situacao"
                  />
                  <p id="cupom-situacao" aria-live="polite" className="text-sm font-semibold">
                    {cupomDigitado.trim() === "" ? null : cupomValido(cupomDigitado, cupom) ? (
                      <span className="text-folha">Cupom aplicado: {Math.round(cupom.desconto * 100)}% de desconto</span>
                    ) : (
                      <span className="text-alerta">Cupom não encontrado</span>
                    )}
                  </p>
                </div>
              )}

              <dl className="flex flex-col gap-1 border-t border-linha pt-3">
                {valor.desconto > 0 && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt>Valor de encomenda</dt>
                      <dd className="text-ameixa-suave line-through">{formatarPreco(refazer.preco)}</dd>
                    </div>
                    <div className="flex justify-between gap-2 text-folha">
                      <dt>Desconto do cupom</dt>
                      <dd>− {formatarPreco(valor.desconto)}</dd>
                    </div>
                  </>
                )}
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="font-bold">Valor de referência</dt>
                  <dd className="font-display text-2xl font-bold">{formatarPreco(valor.preco)}</dd>
                </div>
              </dl>
              <p className="text-sm text-ameixa-suave">O valor final é confirmado pela Ateline no WhatsApp.</p>
            </div>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-bold">O bolo é para</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ameixa/30 p-4 has-checked:border-2 has-checked:border-framboesa">
                <input type="radio" name="finalidade" value="alugar" defaultChecked className="mt-0.5 size-5 accent-framboesa" />
                <span>
                  <strong>Alugar</strong>
                  <br />
                  <span className="text-sm text-ameixa-suave">A primeira locação é sua. Depois ele entra no acervo.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ameixa/30 p-4 has-checked:border-2 has-checked:border-framboesa">
                <input type="radio" name="finalidade" value="comprar" className="mt-0.5 size-5 accent-framboesa" />
                <span>
                  <strong>Comprar</strong>
                  <br />
                  <span className="text-sm text-ameixa-suave">Fica com você, com envio para todo o Brasil.</span>
                </span>
              </label>
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo nome="festa" rotulo="Data da festa" erro={erros.festa}>
              <input id="festa" name="festa" type="date" min={dataMinima} aria-invalid={!!erros.festa}
                aria-describedby="festa-erro" className={estiloCampo} />
            </Campo>
            {!refazer && (
              <Campo nome="tema" rotulo="Tema" erro={erros.tema}>
                <input id="tema" name="tema" placeholder="Ex.: jardim encantado" aria-invalid={!!erros.tema}
                  aria-describedby="tema-erro" className={estiloCampo} />
              </Campo>
            )}
            <Campo nome="cores" rotulo="Cores">
              <input id="cores" name="cores" placeholder="Ex.: rosa e dourado" className={estiloCampo} />
            </Campo>
            {!refazer && (
              <Campo nome="andares" rotulo="Andares">
                <select id="andares" name="andares" className={estiloCampo} defaultValue="Não sei, quero sugestão">
                  <option>1 andar</option>
                  <option>2 andares</option>
                  <option>3 andares</option>
                  <option>4 andares ou mais</option>
                  <option>Não sei, quero sugestão</option>
                </select>
              </Campo>
            )}
          </div>

          <Campo nome="observacoes" rotulo="Conte mais sobre a festa">
            <textarea id="observacoes" name="observacoes" rows={4}
              placeholder="Nome e idade do aniversariante, personagens, detalhes que não podem faltar…"
              className="rounded-xl border border-ameixa/30 px-3 py-3" />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo nome="nome" rotulo="Seu nome" erro={erros.nome}>
              <input id="nome" name="nome" autoComplete="name" aria-invalid={!!erros.nome}
                aria-describedby="nome-erro" className={estiloCampo} />
            </Campo>
            <Campo nome="whatsapp" rotulo="WhatsApp" erro={erros.whatsapp}>
              <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="(21) 00000-0000"
                aria-invalid={!!erros.whatsapp} aria-describedby="whatsapp-erro" className={estiloCampo} />
            </Campo>
          </div>

          <p className="rounded-xl bg-blush p-4 text-sm">
            <strong>Fotos de referência:</strong> prints do Pinterest, do convite ou da decoração. Você manda
            direto na conversa do WhatsApp, logo depois de enviar o pedido.
          </p>

          <button
            type="submit"
            disabled={!hoje}
            className="flex h-14 items-center justify-center gap-2 self-start rounded-2xl bg-framboesa px-8 text-lg font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
          >
            <MessageCircle size={20} aria-hidden /> Enviar pelo WhatsApp
          </button>

          {linkEnviado && (
            <p role="status" className="text-sm">
              Abrimos o WhatsApp com o seu pedido. Não abriu?{" "}
              <a href={linkEnviado} target="_blank" rel="noopener" className="font-bold text-framboesa underline">
                Toque aqui para abrir
              </a>
              .
            </p>
          )}
        </form>

        <aside
          aria-label="Como funciona a encomenda"
          className="flex min-w-0 flex-[1_1_300px] flex-col gap-5 rounded-2xl bg-ameixa p-7 text-[#e2cdd3]"
        >
          <h2 className="font-display text-2xl font-semibold text-white">Como funciona</h2>
          <ol className="flex flex-col gap-4">
            {PASSOS.map((passo, indice) => (
              <li key={passo.titulo} className="flex gap-3">
                <span className="w-6 flex-none font-display text-2xl font-bold text-[#f6b8c8]">{indice + 1}</span>
                <span>
                  <strong className="text-white">{passo.titulo}</strong>
                  <br />
                  {passo.texto}
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}

const PASSOS = [
  { titulo: "Você envia o pedido", texto: "Pelo WhatsApp, com tema, cores, data e fotos de referência." },
  { titulo: "A Ateline responde", texto: "Com o valor final e o prazo." },
  { titulo: "Você paga o sinal", texto: "50% para confirmar, e aceita o contrato." },
  { titulo: "O bolo é feito", texto: "E fica pronto para retirar antes da festa." },
];

// Rótulo + campo + mensagem de erro
function Campo({ nome, rotulo, erro, children }: {
  nome: string;
  rotulo: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={nome} className="font-bold">{rotulo}</label>
      {children}
      {erro && <p id={`${nome}-erro`} className="text-sm font-semibold text-alerta">{erro}</p>}
    </div>
  );
}
