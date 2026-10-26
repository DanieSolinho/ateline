"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCarrinho } from "@/hooks/useCarrinho";
import { salvarPedido, usePedidos } from "@/hooks/usePedidos";
import { usePerfil } from "@/hooks/usePerfil";
import { useSessao } from "@/hooks/useSessao";
import { diaPorExtenso, primeiraMaiuscula } from "@/lib/calendario";
import { alugueisDo, chaveDoItem, comprasDo, resumoDoCarrinho, totalDoItem } from "@/lib/carrinho";
import { buscarCep, cepValido, formatarCep } from "@/lib/cep";
import { dadosMaisRecentes } from "@/lib/conta";
import { enviarPedido } from "@/lib/pedidos";
import { salvarPerfil } from "@/lib/perfil";
import { criarEsquemaCheckout, type CampoCheckout } from "@/lib/checkout";
import { formatarPreco } from "@/lib/formatar";
import { calcularPeriodo } from "@/lib/periodo";
import { TAXA_SEGURANCA } from "@/lib/regras";

type Estado = {
  erros: Partial<Record<CampoCheckout, string>>;
  valores: Record<string, string>;
  erroDoPedido?: string; // quando o banco recusa (ex.: o bolo acabou de ser reservado por outra pessoa)
};

const estadoInicial: Estado = { erros: {}, valores: {} };

const estiloCampo = "h-12 w-full rounded-xl border border-ameixa/30 bg-white px-3 aria-invalid:border-alerta";
const estiloOpcao = (ativa: boolean) =>
  `flex cursor-pointer gap-3 rounded-xl border p-4 ${ativa ? "border-2 border-framboesa" : "border-ameixa/30"}`;

const LOJA = "Rua Cândido Benício, 2967, bloco P, loja G — Praça Seca";

function dia(iso: string) {
  return primeiraMaiuscula(diaPorExtenso(iso));
}

export function FormularioCheckout() {
  const { itens, esvaziar } = useCarrinho();
  const router = useRouter();
  const [entrega, setEntrega] = useState<"retirada" | "entrega">("retirada");
  const [recebimento, setRecebimento] = useState<"retirada" | "envio">("retirada");

  // Endereço do envio: o CEP preenche rua, bairro, cidade e estado
  const [endereco, setEndereco] = useState({ cep: "", rua: "", bairro: "", cidade: "", uf: "" });
  const [situacaoCep, setSituacaoCep] = useState<"" | "buscando" | "nao-encontrado">("");

  async function aoDigitarCep(valor: string) {
    const cep = formatarCep(valor);
    setEndereco((atual) => ({ ...atual, cep }));
    if (!cepValido(cep)) return setSituacaoCep("");

    setSituacaoCep("buscando");
    const achado = await buscarCep(cep);
    if (achado) {
      setEndereco((atual) => ({ ...atual, ...achado }));
      setSituacaoCep("");
    } else {
      setSituacaoCep("nao-encontrado");
    }
  }

  // Logada: os dados da conta (Supabase) têm prioridade sobre os guardados no navegador
  const pedidosAnteriores = usePedidos();
  const sessao = useSessao();
  const { perfil, carregando: carregandoPerfil } = usePerfil(sessao?.user.id ?? null);

  // Roda quando a cliente envia o formulário
  async function finalizar(_anterior: Estado, formData: FormData): Promise<Estado> {
    const valores = Object.fromEntries(formData) as Record<string, string>;
    if (!itens || itens.length === 0) return { erros: {}, valores };

    const resumo = resumoDoCarrinho(itens);
    const resultado = criarEsquemaCheckout(resumo).safeParse(valores);

    if (!resultado.success) {
      const erros: Estado["erros"] = {};
      for (const problema of resultado.error.issues) {
        const campo = problema.path[0] as CampoCheckout;
        erros[campo] ??= problema.message; // guarda só o primeiro erro de cada campo
      }
      return { erros, valores };
    }

    const pedido = {
      cliente: resultado.data,
      itens,
      pagoAgora: resumo.pagarAgora,
      naRetirada: resumo.temAluguel ? resumo.naRetirada : 0,
      restanteCompra: resumo.restanteCompras,
    };

    // O banco confere a agenda e reserva as peças. Se alguém reservou antes, ele recusa.
    const resposta = await enviarPedido(pedido);
    if (!resposta.ok) return { erros: {}, valores, erroDoPedido: resposta.mensagem };

    // Guarda também no navegador, para a confirmação e para quem não tem login
    salvarPedido({
      ...pedido,
      numero: resposta.numero,
      criadoEm: new Date().toISOString(),
      status: "aguardando_pagamento",
      guardadoAte: resposta.guardadoAte,
    });

    // Logada: guarda os dados na conta para os próximos pedidos (sem fazer a cliente esperar)
    if (sessao) {
      const { nome, cpf, whatsapp, chavePix } = resultado.data;
      void salvarPerfil(sessao.user.id, { nome, cpf, whatsapp, chavePix: chavePix || perfil?.chavePix || "" });
    }

    esvaziar();
    router.push("/checkout/confirmado");
    return estadoInicial;
  }

  const [estado, enviar, enviando] = useActionState(finalizar, estadoInicial);
  const { erros } = estado;

  // Quem já comprou aqui encontra os dados preenchidos (até ela mudar e enviar de novo)
  // Preenchimento: dados de pedidos anteriores, e-mail do login e dados da conta (estes ganham)
  const preenchimento: Record<string, string | undefined> = {
    ...(dadosMaisRecentes(pedidosAnteriores ?? []) ?? {}),
    ...(sessao?.user.email ? { email: sessao.user.email } : {}),
    ...Object.fromEntries(Object.entries(perfil ?? {}).filter(([, valor]) => valor !== "")),
  };
  const valores: Record<string, string | undefined> =
    Object.keys(estado.valores).length > 0 ? estado.valores : preenchimento;

  if (itens === null) return <p className="mt-6 text-ameixa-suave">Carregando…</p>;

  if (itens.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-linha p-8">
        <p className="text-lg">Seu pedido está vazio.</p>
        <Link href="/alugar" className="font-bold text-framboesa hover:underline">
          Ver bolos para alugar
        </Link>
      </div>
    );
  }

  const resumo = resumoDoCarrinho(itens);
  const alugueis = alugueisDo(itens);
  const compras = comprasDo(itens);

  return (
    <form action={enviar} noValidate className="mt-8 grid items-start gap-8 md:grid-cols-[1fr_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        {estado.erroDoPedido && (
          <p role="alert" className="rounded-xl bg-[#fce9df] px-4 py-3 font-semibold text-alerta">
            {estado.erroDoPedido}
          </p>
        )}
        {Object.keys(erros).length > 0 && (
          <p role="alert" className="rounded-xl bg-[#fce9df] px-4 py-3 font-semibold text-alerta">
            Confira os campos marcados abaixo.
          </p>
        )}

        {/* O "key" refaz os campos quando os dados da conta chegam do Supabase, já preenchidos */}
        <fieldset
          key={carregandoPerfil ? "carregando" : "pronto"}
          className="flex flex-col gap-4 rounded-2xl border border-linha p-5"
        >
          <legend className="px-2 font-display text-xl font-semibold">Seus dados</legend>
          {sessao === null && (
            <p className="text-sm text-ameixa-suave">
              Já tem conta?{" "}
              <Link href="/entrar" className="font-bold text-framboesa hover:underline">
                Entre
              </Link>{" "}
              para preencher seus dados automaticamente.
            </p>
          )}
          <Campo nome="nome" rotulo="Nome completo" erro={erros.nome}>
            <input id="nome" name="nome" autoComplete="name" defaultValue={valores.nome}
              aria-invalid={!!erros.nome} aria-describedby="nome-erro" className={estiloCampo} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo nome="cpf" rotulo="CPF" erro={erros.cpf}>
              <input id="cpf" name="cpf" inputMode="numeric" placeholder="000.000.000-00" defaultValue={valores.cpf}
                aria-invalid={!!erros.cpf} aria-describedby="cpf-erro" className={estiloCampo} />
            </Campo>
            <Campo nome="whatsapp" rotulo="WhatsApp" erro={erros.whatsapp}>
              <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="(21) 00000-0000"
                defaultValue={valores.whatsapp} aria-invalid={!!erros.whatsapp} aria-describedby="whatsapp-erro"
                className={estiloCampo} />
            </Campo>
          </div>
          <Campo nome="email" rotulo="E-mail" erro={erros.email}>
            <input id="email" name="email" type="email" autoComplete="email" defaultValue={valores.email}
              aria-invalid={!!erros.email} aria-describedby="email-erro" className={estiloCampo} />
          </Campo>
          {resumo.temAluguel && (
            <Campo nome="chavePix" rotulo="Chave Pix (para devolver a taxa de segurança)" erro={erros.chavePix}>
              <input id="chavePix" name="chavePix" placeholder="CPF, e-mail, telefone ou chave aleatória"
                defaultValue={valores.chavePix} aria-invalid={!!erros.chavePix}
                aria-describedby="chavePix-erro chavePix-dica" className={estiloCampo} />
              <p id="chavePix-dica" className="text-sm text-ameixa-suave">
                Quando a peça volta conferida, devolvemos os R$ {TAXA_SEGURANCA},00 nessa chave.
              </p>
            </Campo>
          )}
        </fieldset>

        {resumo.temAluguel && (
          <fieldset className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
            <legend className="px-2 font-display text-xl font-semibold">Como você vai buscar o aluguel?</legend>
            <label className={estiloOpcao(entrega === "retirada")}>
              <input type="radio" name="entrega" value="retirada" checked={entrega === "retirada"}
                onChange={() => setEntrega("retirada")} className="mt-1 size-5 accent-framboesa" />
              <span>
                <strong className="block">Retirar na loja · grátis</strong>
                <span className="text-sm text-ameixa-suave">{LOJA}</span>
              </span>
            </label>
            <label className={estiloOpcao(entrega === "entrega")}>
              <input type="radio" name="entrega" value="entrega" checked={entrega === "entrega"}
                onChange={() => setEntrega("entrega")} className="mt-1 size-5 accent-framboesa" />
              <span>
                <strong className="block">Entrega no endereço</strong>
                <span className="text-sm text-ameixa-suave">Valor de acordo com o bairro, combinado pelo WhatsApp</span>
              </span>
            </label>
            {entrega === "entrega" && (
              <Campo nome="endereco" rotulo="Endereço completo, com bairro e CEP" erro={erros.endereco}>
                <input id="endereco" name="endereco" autoComplete="street-address" defaultValue={valores.endereco}
                  aria-invalid={!!erros.endereco} aria-describedby="endereco-erro" className={estiloCampo} />
              </Campo>
            )}
          </fieldset>
        )}

        {resumo.temCompra && (
          <fieldset className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
            <legend className="px-2 font-display text-xl font-semibold">Como você quer receber a compra?</legend>
            <label className={estiloOpcao(recebimento === "retirada")}>
              <input type="radio" name="recebimento" value="retirada" checked={recebimento === "retirada"}
                onChange={() => setRecebimento("retirada")} className="mt-1 size-5 accent-framboesa" />
              <span>
                <strong className="block">Retirar na loja · grátis</strong>
                <span className="text-sm text-ameixa-suave">{LOJA}. Combinamos o dia pelo WhatsApp e você paga o restante na retirada.</span>
              </span>
            </label>
            <label className={estiloOpcao(recebimento === "envio")}>
              <input type="radio" name="recebimento" value="envio" checked={recebimento === "envio"}
                onChange={() => setRecebimento("envio")} className="mt-1 size-5 accent-framboesa" />
              <span>
                <strong className="block">Envio por transportadora</strong>
                <span className="text-sm text-ameixa-suave">Para todo o Brasil. O frete é orçado pelo WhatsApp.</span>
              </span>
            </label>

            {recebimento === "envio" && (
              <div className="grid gap-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <Campo nome="cep" rotulo="CEP" erro={erros.cep}>
                    <input id="cep" name="cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
                      value={endereco.cep} onChange={(evento) => aoDigitarCep(evento.target.value)}
                      aria-invalid={!!erros.cep} aria-describedby="cep-erro cep-situacao" className={estiloCampo} />
                    <p id="cep-situacao" aria-live="polite" className="text-sm text-ameixa-suave">
                      {situacaoCep === "buscando" && "Buscando endereço…"}
                      {situacaoCep === "nao-encontrado" && "Não achamos esse CEP. Preencha o endereço abaixo."}
                    </p>
                  </Campo>
                </div>
                <div className="sm:col-span-4">
                  <Campo nome="rua" rotulo="Rua" erro={erros.rua}>
                    <input id="rua" name="rua" autoComplete="address-line1" value={endereco.rua}
                      onChange={(evento) => setEndereco({ ...endereco, rua: evento.target.value })}
                      aria-invalid={!!erros.rua} aria-describedby="rua-erro" className={estiloCampo} />
                  </Campo>
                </div>
                <div className="sm:col-span-2">
                  <Campo nome="numero" rotulo="Número" erro={erros.numero}>
                    <input id="numero" name="numero" defaultValue={valores.numero} aria-invalid={!!erros.numero}
                      aria-describedby="numero-erro" className={estiloCampo} />
                  </Campo>
                </div>
                <div className="sm:col-span-4">
                  <Campo nome="complemento" rotulo="Complemento (opcional)">
                    <input id="complemento" name="complemento" autoComplete="address-line2"
                      defaultValue={valores.complemento} className={estiloCampo} />
                  </Campo>
                </div>
                <div className="sm:col-span-2">
                  <Campo nome="bairro" rotulo="Bairro" erro={erros.bairro}>
                    <input id="bairro" name="bairro" value={endereco.bairro}
                      onChange={(evento) => setEndereco({ ...endereco, bairro: evento.target.value })}
                      aria-invalid={!!erros.bairro} aria-describedby="bairro-erro" className={estiloCampo} />
                  </Campo>
                </div>
                <div className="sm:col-span-3">
                  <Campo nome="cidade" rotulo="Cidade" erro={erros.cidade}>
                    <input id="cidade" name="cidade" autoComplete="address-level2" value={endereco.cidade}
                      onChange={(evento) => setEndereco({ ...endereco, cidade: evento.target.value })}
                      aria-invalid={!!erros.cidade} aria-describedby="cidade-erro" className={estiloCampo} />
                  </Campo>
                </div>
                <div>
                  <Campo nome="uf" rotulo="Estado" erro={erros.uf}>
                    <input id="uf" name="uf" autoComplete="address-level1" maxLength={2} value={endereco.uf}
                      onChange={(evento) => setEndereco({ ...endereco, uf: evento.target.value.toUpperCase() })}
                      aria-invalid={!!erros.uf} aria-describedby="uf-erro" className={`${estiloCampo} uppercase`} />
                  </Campo>
                </div>
                <p className="rounded-xl bg-blush p-3 text-sm sm:col-span-6">
                  Depois do pedido, você manda o endereço no WhatsApp com um toque e a Ateline orça o frete com a
                  transportadora. O restante da compra e o frete são pagos antes do envio.
                </p>
              </div>
            )}
          </fieldset>
        )}

        {resumo.temAluguel && (
          <fieldset className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
            <legend className="px-2 font-display text-xl font-semibold">Contrato de locação</legend>
            <div tabIndex={0} aria-label="Resumo do contrato"
              className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-xl bg-blush/60 p-4 text-sm">
              {alugueis.map((item) => {
                const periodo = calcularPeriodo(item.festa);
                return (
                  <p key={chaveDoItem(item)}>
                    <strong>{item.nome} (Ref. {item.codigoOpcao})</strong>
                    {item.topo && ` + topo ${item.topo.nome}`}
                    {item.base && ` + base dourada (${item.base.codigo})`}: retirada {dia(periodo.retirada)}, devolução{" "}
                    {dia(periodo.devolucao)}. Locação de {formatarPreco(totalDoItem(item))}.
                    {item.personalizacao && ` Personalização: ${item.personalizacao}.`}
                  </p>
                );
              })}
              <p>Sinal de 50% na reserva. O restante e a taxa de segurança de {formatarPreco(TAXA_SEGURANCA)} por peça são pagos na retirada.</p>
              <p>A taxa de segurança não é devolvida em caso de atraso ou avarias como furos, cola e sujeira. Vela acoplada que não volta: desconto de R$ 10,00.</p>
              <p>Não use cola, água, tinta ou outro material nas peças. Atraso na devolução: multa de 30% por dia sobre o valor total.</p>
              <p>Em cancelamento ou adiamento, o valor de entrada não é devolvido.</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 font-semibold">
              <input type="checkbox" name="aceite" value="sim" defaultChecked={valores.aceite === "sim"}
                aria-invalid={!!erros.aceite} aria-describedby="aceite-erro" className="mt-0.5 size-5 accent-framboesa" />
              Li e aceito o contrato de locação.
            </label>
            {erros.aceite && <p id="aceite-erro" className="text-sm font-semibold text-alerta">{erros.aceite}</p>}
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
          <legend className="px-2 font-display text-xl font-semibold">Como você prefere pagar o sinal?</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ameixa/30 p-4 font-bold has-checked:border-2 has-checked:border-framboesa">
              <input type="radio" name="pagamento" value="pix" defaultChecked={valores.pagamento !== "cartao"} className="size-5 accent-framboesa" />
              Pix
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ameixa/30 p-4 font-bold has-checked:border-2 has-checked:border-framboesa">
              <input type="radio" name="pagamento" value="cartao" defaultChecked={valores.pagamento === "cartao"} className="size-5 accent-framboesa" />
              Cartão
            </label>
          </div>
        </fieldset>
      </div>

      <aside aria-label="Resumo do pedido" className="flex flex-col gap-3 rounded-2xl bg-blush p-5 md:sticky md:top-4">
        <h2 className="font-display text-xl font-semibold">Seu pedido</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {alugueis.map((item) => (
            <li key={chaveDoItem(item)} className="flex justify-between gap-2">
              <span>Aluguel: {item.nome} · festa {dia(item.festa)}</span>
              <span>{formatarPreco(totalDoItem(item))}</span>
            </li>
          ))}
          {compras.map((item) => (
            <li key={chaveDoItem(item)} className="flex justify-between gap-2">
              <span>Compra: {item.nome}</span>
              <span>{formatarPreco(totalDoItem(item))}</span>
            </li>
          ))}
        </ul>
        <hr className="border-linha" />
        {resumo.temAluguel && (
          <p className="flex justify-between text-sm">
            <span>Sinal do aluguel (50%)</span>
            <span>{formatarPreco(resumo.sinal)}</span>
          </p>
        )}
        {resumo.temCompra && (
          <p className="flex justify-between text-sm">
            <span>Sinal da compra (50%)</span>
            <span>{formatarPreco(resumo.sinalCompras)}</span>
          </p>
        )}
        <p className="flex items-baseline justify-between">
          <strong>Pagar agora</strong>
          <strong className="font-display text-2xl">{formatarPreco(resumo.pagarAgora)}</strong>
        </p>
        {resumo.temAluguel && (
          <p className="flex justify-between text-sm text-ameixa-suave">
            <span>Na retirada do aluguel</span>
            <span>{formatarPreco(resumo.naRetirada)}</span>
          </p>
        )}
        {resumo.temCompra && (
          <p className="flex justify-between gap-2 text-sm text-ameixa-suave">
            <span>{recebimento === "envio" ? "Antes do envio (+ frete)" : "Na retirada da compra"}</span>
            <span>{formatarPreco(resumo.restanteCompras)}</span>
          </p>
        )}
        <button type="submit" disabled={enviando}
          className="mt-2 h-14 rounded-xl bg-framboesa text-lg font-bold text-white hover:bg-framboesa-escura disabled:opacity-60">
          {enviando ? "Reservando…" : "Finalizar pedido"}
        </button>
        <p className="text-xs text-ameixa-suave">
          As peças ficam guardadas por 2 horas enquanto você paga o sinal pelo WhatsApp. Em breve, o pagamento será
          direto pelo Mercado Pago.
        </p>
      </aside>
    </form>
  );
}

// Rótulo + campo + mensagem de erro, sempre no mesmo formato
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
