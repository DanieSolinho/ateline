"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { CartaoDaConta } from "@/components/conta/CartaoDaConta";
import { MeusDados } from "@/components/conta/MeusDados";
import { apagarPedidos, usePedidos } from "@/hooks/usePedidos";
import { useSessao } from "@/hooks/useSessao";
import { useHoje } from "@/hooks/useHoje";
import { diaPorExtenso, horarioDaLoja, primeiraMaiuscula } from "@/lib/calendario";
import { totalDoItem } from "@/lib/carrinho";
import { dadosMaisRecentes, historico, NOME_DA_SITUACAO, proximaRetirada, type Situacao } from "@/lib/conta";
import { linkWhatsApp } from "@/lib/contato";
import { formatarPreco } from "@/lib/formatar";
import { PERCENTUAL_SINAL, TAXA_SEGURANCA } from "@/lib/regras";

const MAPA_DA_LOJA =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Rua Cândido Benício, 2967, Praça Seca, Rio de Janeiro");

const COR_DA_SITUACAO: Record<Situacao, string> = {
  reservado: "bg-[#e6f2ea] text-folha",
  "sinal-pago": "bg-[#e6f2ea] text-folha",
  "com-voce": "bg-pessego text-ameixa",
  devolucao: "bg-[#fce9df] text-alerta",
  concluido: "bg-[#f1ecee] text-ameixa-suave",
};

const SECOES = [
  { id: "pedidos", nome: "Meus pedidos" },
  { id: "credito", nome: "Crédito em loja" },
  { id: "contratos", nome: "Contratos" },
  { id: "dados", nome: "Meus dados" },
];

function dia(iso: string) {
  return primeiraMaiuscula(diaPorExtenso(iso));
}

// "2026-10-31" → "31/10/2026"
function data(iso: string) {
  return iso.split("-").reverse().join("/");
}

export function MinhaConta() {
  const pedidos = usePedidos();
  const hoje = useHoje();
  const sessao = useSessao();
  const [confirmarApagar, setConfirmarApagar] = useState(false);

  if (pedidos === null || hoje === null) return <p className="text-ameixa-suave">Carregando…</p>;

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="font-display text-4xl font-bold">Minha conta</h1>
        <div className="w-full">
          <CartaoDaConta sessao={sessao} />
        </div>
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-linha p-8">
          <p className="text-lg">Você ainda não fez nenhum pedido por aqui.</p>
          <p className="text-ameixa-suave">Seus aluguéis e compras aparecem nesta página depois do primeiro pedido.</p>
          <Link
            href="/alugar"
            className="grid h-12 place-items-center rounded-xl bg-framboesa px-6 font-bold text-white hover:bg-framboesa-escura"
          >
            Ver bolos para alugar
          </Link>
        </div>
        {sessao && (
          <section aria-labelledby="dados-titulo" className="flex w-full flex-col gap-4">
            <h2 id="dados-titulo" className="font-display text-2xl font-semibold">Meus dados</h2>
            <MeusDados idDaCliente={sessao.user.id} email={sessao.user.email ?? ""} />
          </section>
        )}
      </div>
    );
  }

  const cliente = dadosMaisRecentes(pedidos)!;
  const proxima = proximaRetirada(pedidos, hoje);
  const linhas = historico(pedidos, hoje);
  const pedidosComAluguel = pedidos.filter((pedido) => pedido.itens.some((item) => item.tipo === "aluguel"));

  return (
    <div className="flex flex-wrap items-start gap-10">
      <nav aria-label="Minha conta" className="flex w-full flex-col gap-1 md:sticky md:top-4 md:w-56">
        {SECOES.map((secao) => (
          <a key={secao.id} href={`#${secao.id}`} className="rounded-xl px-4 py-3 font-semibold hover:bg-blush">
            {secao.nome}
          </a>
        ))}
      </nav>

      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-10">
        <h1 className="font-display text-4xl font-bold">Olá, {cliente.nome.split(" ")[0]}</h1>
        <CartaoDaConta sessao={sessao} />

        <div className="flex flex-wrap gap-5">
          <section
            aria-labelledby="proxima-titulo"
            className="flex min-w-0 flex-[2_1_420px] flex-col gap-4 rounded-2xl border border-linha p-6"
          >
            {proxima ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="proxima-titulo" className="font-display text-xl font-semibold">Próxima retirada</h2>
                  <span className="rounded-full bg-[#e6f2ea] px-3 py-1 text-xs font-bold text-folha">
                    Reservado · sinal pago
                  </span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div aria-hidden="true" className="h-30 w-24 shrink-0 rounded-xl bg-rosa" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <strong className="text-lg">{proxima.item.nome}</strong>
                    <span>
                      <strong>Retirada:</strong> {dia(proxima.periodo.retirada)},{" "}
                      {horarioDaLoja(proxima.periodo.retirada, "retirada")}
                    </span>
                    <span>
                      <strong>Devolução:</strong> {dia(proxima.periodo.devolucao)},{" "}
                      {horarioDaLoja(proxima.periodo.devolucao, "devolucao")}
                    </span>
                    <span>
                      <strong>Pagar na retirada:</strong>{" "}
                      {formatarPreco(totalDoItem(proxima.item) * (1 - PERCENTUAL_SINAL) + TAXA_SEGURANCA)} (restante +
                      taxa de segurança)
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={MAPA_DA_LOJA}
                    target="_blank"
                    rel="noopener"
                    className="flex h-11 items-center gap-2 rounded-xl border-2 border-ameixa px-4 font-bold hover:bg-blush"
                  >
                    <MapPin size={18} aria-hidden /> Como chegar
                  </a>
                  <a
                    href={
                      linkWhatsApp(
                        `Olá! Quero pedir o adiamento do pedido ${proxima.pedido.numero} (${proxima.item.nome}, festa em ${data(proxima.item.festa)}).`,
                      ) ?? "#"
                    }
                    target="_blank"
                    rel="noopener"
                    className="flex h-11 items-center gap-2 rounded-xl px-4 font-bold underline hover:bg-blush"
                  >
                    <MessageCircle size={18} aria-hidden /> Pedir adiamento
                  </a>
                </div>
                <p className="text-sm text-ameixa-suave">
                  Adiamento: com pelo menos 15 dias de antecedência e se o bolo estiver livre na nova data.
                </p>
              </>
            ) : (
              <>
                <h2 id="proxima-titulo" className="font-display text-xl font-semibold">Próxima retirada</h2>
                <p className="text-ameixa-suave">Nenhum aluguel marcado daqui para a frente.</p>
                <Link href="/alugar" className="self-start font-bold text-framboesa hover:underline">
                  Ver bolos para alugar
                </Link>
              </>
            )}
          </section>

          <section
            id="credito"
            aria-labelledby="credito-titulo"
            className="flex min-w-0 flex-[1_1_240px] scroll-mt-6 flex-col gap-2 rounded-2xl bg-blush p-6"
          >
            <h2 id="credito-titulo" className="font-display text-xl font-semibold">Crédito em loja</h2>
            <span className="font-display text-3xl font-bold">{formatarPreco(0)}</span>
            <p className="text-sm text-ameixa-suave">
              Em caso de cancelamento, o valor vira crédito por 3 meses. O saldo aparece aqui em breve.
            </p>
          </section>
        </div>

        <section id="pedidos" aria-labelledby="pedidos-titulo" className="flex scroll-mt-6 flex-col gap-4">
          <h2 id="pedidos-titulo" className="font-display text-2xl font-semibold">Meus pedidos</h2>
          <div tabIndex={0} aria-label="Tabela de pedidos" className="overflow-x-auto rounded-2xl border border-linha">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="bg-blush/60">
                <tr>
                  <th scope="col" className="px-4 py-3">Pedido</th>
                  <th scope="col" className="px-4 py-3">Data</th>
                  <th scope="col" className="px-4 py-3">Item</th>
                  <th scope="col" className="px-4 py-3">Tipo</th>
                  <th scope="col" className="px-4 py-3">Situação</th>
                  <th scope="col" className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.chave} className="border-t border-linha">
                    <td className="px-4 py-3 font-bold">{linha.numero}</td>
                    <td className="px-4 py-3">
                      {data(linha.data)}
                      <span className="block text-xs text-ameixa-suave">
                        {linha.item.tipo === "aluguel" ? "festa" : "pedido"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{linha.item.nome}</td>
                    <td className="px-4 py-3">{linha.item.tipo === "aluguel" ? "Aluguel" : "Compra"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${COR_DA_SITUACAO[linha.situacao]}`}>
                        {NOME_DA_SITUACAO[linha.situacao]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatarPreco(totalDoItem(linha.item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="contratos" aria-labelledby="contratos-titulo" className="flex scroll-mt-6 flex-col gap-3">
          <h2 id="contratos-titulo" className="font-display text-2xl font-semibold">Contratos</h2>
          {pedidosComAluguel.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {pedidosComAluguel.map((pedido) => (
                <li
                  key={pedido.numero}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-linha px-4 py-3"
                >
                  <span>
                    <strong>{pedido.numero}</strong> · aceito em {data(pedido.criadoEm.slice(0, 10))}
                  </span>
                  <span className="text-sm text-ameixa-suave">PDF em breve</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ameixa-suave">Os contratos dos seus aluguéis aparecem aqui.</p>
          )}
          <Link href="/contrato" className="self-start font-bold text-framboesa hover:underline">
            Ler os pontos principais do contrato
          </Link>
        </section>

        <section id="dados" aria-labelledby="dados-titulo" className="flex scroll-mt-6 flex-col gap-4">
          <h2 id="dados-titulo" className="font-display text-2xl font-semibold">Meus dados</h2>
          {sessao ? (
            // Logada: os dados vêm do Supabase e podem ser editados aqui
            <MeusDados idDaCliente={sessao.user.id} email={sessao.user.email ?? ""} />
          ) : (
            <>
              <dl className="grid gap-4 rounded-2xl border border-linha p-5 sm:grid-cols-2">
                <Dado rotulo="Nome" valor={cliente.nome} />
                <Dado rotulo="E-mail" valor={cliente.email} />
                <Dado rotulo="WhatsApp" valor={formatarTelefone(cliente.whatsapp)} />
                <Dado rotulo="CPF" valor={mascararCpf(cliente.cpf)} />
                {cliente.chavePix && <Dado rotulo="Chave Pix (devolução da taxa)" valor={cliente.chavePix} />}
              </dl>
              <p className="text-sm text-ameixa-suave">
                Esses dados ficam só neste navegador e preenchem o seu próximo pedido. Entre na sua conta para
                guardá-los com segurança e usar em qualquer aparelho.
              </p>
            </>
          )}
          {confirmarApagar ? (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-[#fce9df] p-4">
              <span className="font-semibold">Apagar os pedidos guardados neste navegador?</span>
              <button
                type="button"
                onClick={() => {
                  apagarPedidos();
                  setConfirmarApagar(false);
                }}
                className="h-11 rounded-xl bg-alerta px-4 font-bold text-white"
              >
                Sim, apagar
              </button>
              <button
                type="button"
                onClick={() => setConfirmarApagar(false)}
                className="h-11 rounded-xl px-4 font-bold underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmarApagar(true)}
              className="self-start font-semibold text-ameixa-suave underline hover:text-alerta"
            >
              Apagar os pedidos guardados neste navegador
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-sm text-ameixa-suave">{rotulo}</dt>
      <dd className="font-semibold break-words">{valor}</dd>
    </div>
  );
}

// "21987654321" → "(21) 98765-4321"
function formatarTelefone(digitos: string) {
  return digitos.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
}

// Mostra só o começo e o fim do CPF: "529.***.***-25"
function mascararCpf(digitos: string) {
  return `${digitos.slice(0, 3)}.***.***-${digitos.slice(-2)}`;
}
